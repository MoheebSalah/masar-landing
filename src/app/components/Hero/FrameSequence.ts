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
  /** Null means "cover the canvas with the whole frame" — the desktop case. */
  private pan: number | null = null;

  constructor(canvas: HTMLCanvasElement, urls: string[], maxDensity = 2) {
    this.canvas = canvas;
    this.maxDensity = maxDensity;
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

   /**
   * Slide the viewing window across the frame. The window is always the full
   * height of the footage, so how much of its width fits follows from the
   * canvas' own shape — on a portrait phone that's about a quarter of it.
   *
   * `pan` names the point of the frame to centre that window on, as a fraction
   * of the frame's width, and it is clamped so the window never runs off
   * either end (0 therefore means "hard left", 1 "hard right"). Naming a point
   * rather than a distance travelled is what makes one number safe on every
   * screen: a taller, narrower viewport takes a narrower slice, and a window
   * anchored to a *subject* stays on it while a window anchored to a fraction
   * of the total travel slides off. Pass null to go back to covering the
   * canvas with the whole frame — the desktop case. Safe to call every scroll
   * frame.
   */
  setPan(pan: number | null) {
    if (pan === this.pan) return;
    this.pan = pan;
    this.paint();
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

  /** Draw the held frame, either centred or through the panning window. */
  private paint() {
    const bitmap = this.current;
    if (!bitmap) return;
    const { width, height } = this.canvas;

    if (this.pan === null) {
      const scale = Math.max(width / bitmap.width, height / bitmap.height);
      const w = bitmap.width * scale;
      const h = bitmap.height * scale;
      this.ctx.drawImage(bitmap, (width - w) / 2, (height - h) / 2, w, h);
      return;
    }

    // The slice the canvas can hold at the frame's full height. `min` covers
    // the screen too wide to need one — there the whole frame goes in, the
    // height is trimmed instead, and the pan has nowhere left to travel.
    const aspect = width / height;
    const sw = Math.min(aspect * bitmap.height, bitmap.width);
    const sh = sw / aspect;
    const half = sw / 2;
    const centre = Math.min(
      Math.max(this.pan * bitmap.width, half),
      bitmap.width - half
    );
    const sx = centre - half;
    const sy = (bitmap.height - sh) / 2;
    this.ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);
  }
}
