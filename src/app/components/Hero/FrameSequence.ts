/**
 * Plays a still-image sequence into a canvas, driven by scroll position.
 *
 * This replaces scrubbing a <video>. Setting `video.currentTime` costs a full
 * seek every time — the decoder rewinds to the preceding keyframe and decodes
 * forward — and that overhead is per-seek, so no amount of keyframe density
 * removes it. A sequence has no seek at all: every frame is an independent
 * image, and showing one is just a decode.
 *
 * Two measured facts shape the design:
 *
 *  - `createImageBitmap(blob)` decodes off the main thread. Decoding flat out
 *    at full size leaves the frame budget untouched (rAF stays at 16.7ms), so
 *    scrolling never stutters however hard we push it.
 *  - Its `resizeWidth`/`resizeHeight` options do NOT stay off-thread — they
 *    cost 60ms+ stalls. Frames are decoded at native size and scaled by the
 *    canvas instead.
 *
 * Only the frame on screen is held decoded; everything else stays as encoded
 * bytes (a few KB each), so the whole sequence costs about as much memory as
 * one bitmap plus its downloads.
 */

/**
 * How the frame meets a canvas that isn't its shape.
 *
 * - `cover` fills the canvas and lets whatever overflows fall off the edges.
 *   Right for the desktop cut, which is wider than any window it lands in.
 * - `fit-bottom` matches the frame's width to the canvas', sits it on the
 *   bottom edge, and carries the frame's own top row up through the gap left
 *   above. Right for the phone cut: it is composed 9:16 with labels and
 *   framing marks hard against all four edges, so cropping it to a taller
 *   screen clips type, and its top row is a single flat tone in every scene —
 *   stretch it and the join is invisible.
 */
export type FrameFit = "cover" | "fit-bottom";

export default class FrameSequence {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly urls: string[];

  /** Encoded bytes per frame, filled in as they arrive. */
  private readonly blobs: (Blob | undefined)[];
  /** Whether a frame's request has finished, successfully or not. */
  private readonly settled: boolean[];
  /** How far the contiguous run of settled frames reaches from the start. */
  private prefix = -1;

  private current: ImageBitmap | null = null;
  private targetIndex = 0;
  private drawnIndex = -1;
  private decoding = false;
  private aborted = false;

  /** How far past 1 the backing store may go. */
  private readonly maxDensity: number;
  /** Fixed for the sequence's life — it follows the cut, not the scroll. */
  private readonly fit: FrameFit;

  constructor(
    canvas: HTMLCanvasElement,
    urls: string[],
    maxDensity = 2,
    fit: FrameFit = "cover"
  ) {
    this.canvas = canvas;
    this.maxDensity = maxDensity;
    this.fit = fit;
    // Alpha stays on so the canvas is transparent until the first frame is
    // decoded, letting the poster behind it show through. Opting out would
    // paint it opaque black from the start — a flash before frame one lands.
    // Every frame covers the whole canvas, so nothing ever needs clearing.
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) throw new Error("2d context unavailable");
    this.ctx = ctx;
    this.urls = urls;
    this.blobs = new Array(urls.length);
    this.settled = new Array(urls.length).fill(false);
  }

  get length() {
    return this.urls.length;
  }

  /**
   * Download every frame, in order, a few at a time. Order matters: the
   * sequence is consumed front to back, so the earliest frames are the ones
   * worth having first. `onProgress` reports the contiguous run from the
   * start — the part that can actually be played through.
   */
  async load(concurrency: number, onProgress?: (ready: number) => void) {
    let cursor = 0;
    const worker = async () => {
      while (cursor < this.urls.length && !this.aborted) {
        const index = cursor++;
        try {
          const response = await fetch(this.urls[index]);
          if (response.ok) this.blobs[index] = await response.blob();
        } catch {
          // A frame that never arrives is skipped, not fatal: the player falls
          // back to the closest one it does have.
        }
        this.settled[index] = true;
        while (this.settled[this.prefix + 1]) this.prefix += 1;
        onProgress?.(this.prefix + 1);
        // A frame may have been asked for before it landed.
        if (index === this.nearestAvailable(this.targetIndex)) this.pump();
      }
    };
    await Promise.all(
      Array.from({ length: concurrency }, () => worker())
    );
  }

  /** Point the sequence at a frame. Safe to call every scroll frame. */
  seek(index: number) {
    const clamped = Math.min(Math.max(Math.round(index), 0), this.urls.length - 1);
    if (clamped === this.targetIndex) return;
    this.targetIndex = clamped;
    this.pump();
  }

  /** Match the backing store to the box, then repaint what's on screen. */
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const density = Math.min(window.devicePixelRatio || 1, this.maxDensity);
    const width = Math.round(rect.width * density);
    const height = Math.round(rect.height * density);
    if (this.canvas.width === width && this.canvas.height === height) return;
    this.canvas.width = width;
    this.canvas.height = height;
    this.paint();
  }

  destroy() {
    this.aborted = true;
    this.current?.close();
    this.current = null;
  }

  /**
   * The best frame we can show for `index`: itself if it's here, otherwise the
   * closest earlier one that is. Downloads run front to back, so anything past
   * the contiguous prefix hasn't arrived yet.
   */
  private nearestAvailable(index: number) {
    let i = Math.min(index, this.prefix);
    while (i >= 0 && !this.blobs[i]) i -= 1;
    return i;
  }

  /**
   * Decode-and-draw loop, one frame in flight at a time. Anything the scroll
   * flew past while a decode was running is simply never drawn — on a fast
   * fling that skips most of the sequence, which is exactly right.
   */
  private pump() {
    if (this.decoding || this.aborted) return;
    const index = this.nearestAvailable(this.targetIndex);
    if (index < 0 || index === this.drawnIndex) return;
    const blob = this.blobs[index];
    if (!blob) return;

    this.decoding = true;
    createImageBitmap(blob)
      .then((bitmap) => {
        if (this.aborted) {
          bitmap.close();
          return;
        }
        this.current?.close();
        this.current = bitmap;
        this.drawnIndex = index;
        this.paint();
      })
      .catch(() => {})
      .finally(() => {
        this.decoding = false;
        if (this.nearestAvailable(this.targetIndex) !== this.drawnIndex) {
          this.pump();
        }
      });
  }

  /** Draw the held frame the way this cut asks to meet the canvas. */
  private paint() {
    const bitmap = this.current;
    if (!bitmap) return;
    const { width, height } = this.canvas;

    const cover = () => {
      const scale = Math.max(width / bitmap.width, height / bitmap.height);
      const w = bitmap.width * scale;
      const h = bitmap.height * scale;
      this.ctx.drawImage(bitmap, (width - w) / 2, (height - h) / 2, w, h);
    };

    if (this.fit === "cover") {
      cover();
      return;
    }

    const h = (bitmap.height * width) / bitmap.width;
    // A viewport wider than the frame's own shape: matching widths already
    // overflows the height, which is just cover — and dropping all of that
    // overflow off one edge would be worse than splitting it.
    if (h >= height) {
      cover();
      return;
    }

    // The frame sits on the bottom edge and its top row is stretched up
    // through what's left. One pixel of overlap so no rounding can leave a
    // hairline of bare canvas along the join.
    const gap = height - h;
    this.ctx.drawImage(bitmap, 0, 0, bitmap.width, 1, 0, 0, width, gap + 1);
    this.ctx.drawImage(bitmap, 0, gap, width, h);
  }
}
