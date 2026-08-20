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
 * Which slice of the frame to show, and where to put it on screen. Both rects
 * are fractions (0–1) — of the frame for the source, of the canvas for the
 * destination — so they survive any viewport size, and every number can be
 * tweened, which is what makes one scene's framing morph into the next.
 */
export type FrameLayout = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
  /** Corner radius in CSS pixels. */
  radius: number;
};

/** The tint laid over the blurred backdrop — the page's own background. */
const GLASS = "rgba(238, 234, 224, 0.62)";

/** Width of the scratch canvas the backdrop is squeezed through. */
const HAZE = 28;

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
  /** Null means "fill the canvas with the whole frame" — the desktop case. */
  private layout: FrameLayout | null = null;
  /** Backing pixels per CSS pixel, kept from the last resize. */
  private density = 1;
  /** Scratch canvas for the cheap backdrop blur. Built on first use. */
  private haze: HTMLCanvasElement | null = null;

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
   * Reframe: which slice of the frame to show and where. Pass null to go back
   * to filling the canvas with the whole frame. Repaints immediately, so it is
   * safe to drive straight from a scrub.
   */
  setLayout(layout: FrameLayout | null) {
    this.layout = layout;
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
    this.density = density;
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

  /** Draw the held frame — either filling the canvas, or into its layout box. */
  private paint() {
    const bitmap = this.current;
    if (!bitmap) return;
    const { width, height } = this.canvas;
    const layout = this.layout;

    if (!layout) {
      const scale = Math.max(width / bitmap.width, height / bitmap.height);
      const w = bitmap.width * scale;
      const h = bitmap.height * scale;
      this.ctx.drawImage(bitmap, (width - w) / 2, (height - h) / 2, w, h);
      return;
    }

    const dx = layout.dx * width;
    const dy = layout.dy * height;
    const dw = layout.dw * width;
    const dh = layout.dh * height;
    const covers = dw >= width - 1 && dh >= height - 1;

    // Whatever the box leaves uncovered becomes frosted glass over the scene.
    // The blur is a squeeze through a ~28px canvas and back, not a filter:
    // two drawImage calls the GPU does for free, where a real `filter:blur`
    // at this size is one of the most expensive things a phone can be asked
    // to do every frame.
    if (!covers) {
      const haze = this.hazeCanvas(bitmap);
      const scale = Math.max(width / haze.width, height / haze.height);
      const hw = haze.width * scale;
      const hh = haze.height * scale;
      this.ctx.drawImage(haze, (width - hw) / 2, (height - hh) / 2, hw, hh);
      this.ctx.fillStyle = GLASS;
      this.ctx.fillRect(0, 0, width, height);
    }

    const density = this.density;
    const radius = Math.min(layout.radius * density, dw / 2, dh / 2);

    this.ctx.save();
    // A whisper of a drop, laid down before the clip — a shadow painted inside
    // one would be clipped away with everything else. The boxes run to the
    // screen's edges, so this only ever shows along the horizontal seam, where
    // its job is to part the sharp footage from the blur behind it rather than
    // to lift a card off a surface. No vertical offset, so both edges get it.
    if (!covers) {
      this.ctx.shadowColor = "rgba(14, 19, 18, 0.16)";
      this.ctx.shadowBlur = 28 * density;
      this.ctx.fillStyle = "#eeeae0";
      this.ctx.beginPath();
      this.ctx.roundRect(dx, dy, dw, dh, radius);
      this.ctx.fill();
      this.ctx.shadowColor = "transparent";
    }

    this.ctx.beginPath();
    this.ctx.roundRect(dx, dy, dw, dh, radius);
    this.ctx.clip();

    // Trim the source band to the box's shape rather than letterboxing it, so
    // the crop stays centred on whatever the scene was framed around.
    const fw = bitmap.width;
    const fh = bitmap.height;
    let sx = layout.sx * fw;
    let sy = layout.sy * fh;
    let sw = layout.sw * fw;
    let sh = layout.sh * fh;
    if (sw / sh > dw / dh) {
      const trimmed = sh * (dw / dh);
      sx += (sw - trimmed) / 2;
      sw = trimmed;
    } else {
      const trimmed = sw / (dw / dh);
      sy += (sh - trimmed) / 2;
      sh = trimmed;
    }
    this.ctx.drawImage(bitmap, sx, sy, sw, sh, dx, dy, dw, dh);
    this.ctx.restore();
  }

  /** The current frame squeezed onto a tiny canvas — the blur source. */
  private hazeCanvas(bitmap: ImageBitmap) {
    let haze = this.haze;
    if (!haze) {
      haze = document.createElement("canvas");
      haze.width = HAZE;
      haze.height = Math.max(
        1,
        Math.round((HAZE * bitmap.height) / bitmap.width)
      );
      this.haze = haze;
    }
    const hctx = haze.getContext("2d");
    if (hctx) hctx.drawImage(bitmap, 0, 0, haze.width, haze.height);
    return haze;
  }
}
