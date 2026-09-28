import "server-only";
import path from "node:path";
import sharp from "sharp";
import { createWorker, OEM, PSM, type Worker } from "tesseract.js";
import { logger } from "@/lib/logger";
import type { OcrLine } from "./upi-parser";

// English LSTM model shipped with the app (no CDN download at runtime); see next.config.ts tracing.
const LANG_PATH = path.join(process.cwd(), "node_modules", "@tesseract.js-data", "eng", "4.0.0_best_int");
const OCR_TIMEOUT_MS = 30_000;

let workerPromise: Promise<Worker> | null = null;

/** One long-lived worker per server process; Tesseract queues jobs on it. */
function worker() {
  workerPromise ??= (async () => {
    const w = await createWorker("eng", OEM.LSTM_ONLY, {
      langPath: LANG_PATH,
      gzip: true,
      // Never write traineddata caches to disk (read-only filesystems on serverless).
      cacheMethod: "none",
      errorHandler: (error: unknown) => logger.error("Tesseract worker error", { error }),
    });
    await w.setParameters({
      // Payment receipts are scattered text of very different sizes; the single-block default
      // drops the big amount line entirely.
      tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      // Screenshots have no DPI metadata; stop Tesseract guessing (and warning).
      user_defined_dpi: "300",
      preserve_interword_spaces: "1",
    });
    return w;
  })().catch((error) => {
    workerPromise = null;
    throw error;
  });
  return workerPromise;
}

interface Gray {
  data: Buffer;
  width: number;
  height: number;
}

/**
 * Grey, contrast-stretched, and sized so text is ~20–40 px tall — what Tesseract reads best.
 * Dark-mode screenshots are inverted to dark-on-light.
 */
async function preprocess(image: Uint8Array): Promise<{ png: Buffer; gray: Gray; sourceWidth: number }> {
  const base = sharp(image, { failOn: "error", limitInputPixels: 40_000_000 }).rotate().grayscale();
  const [{ width = 0 }, stats] = await Promise.all([base.clone().metadata(), base.clone().stats()]);
  let pipeline = base.clone();
  if (width && width < 1000) pipeline = pipeline.resize({ width: 1400 });
  else if (width > 2200) pipeline = pipeline.resize({ width: 2000 });
  pipeline = pipeline.normalise();
  if (stats.channels[0].mean < 100) pipeline = pipeline.negate({ alpha: false });
  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
  const gray = { data, width: info.width, height: info.height };
  const png = await sharp(data, { raw: { width: info.width, height: info.height, channels: 1 } }).png().toBuffer();
  return { png, gray, sourceWidth: width };
}

/**
 * Tesseract's English model has no ₹, so "₹450" usually comes back as "3450", "2450" or "7450"
 * with high confidence. The rupee sign is the only one of these glyphs with two full-width
 * horizontal bars in its upper half (7 and 5 have one, 2 and 3 have curves), so look at the pixels.
 */
function looksLikeRupee(img: Gray, box: { x0: number; y0: number; x1: number; y1: number }) {
  const x0 = Math.max(0, box.x0), y0 = Math.max(0, box.y0);
  const w = Math.min(img.width, box.x1) - x0, h = Math.min(img.height, box.y1) - y0;
  if (w < 5 || h < 10) return false;

  let min = 255, max = 0;
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const v = img.data[y * img.width + x];
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (max - min < 60) return false;
  const threshold = (min + max) / 2;

  // Ink is whatever the background around the glyph isn't (light text on a coloured banner too).
  let ring = 0, ringCount = 0;
  const sample = (x: number, y: number) => {
    if (x >= 0 && y >= 0 && x < img.width && y < img.height) {
      ring += img.data[y * img.width + x];
      ringCount++;
    }
  };
  for (let x = x0 - 3; x < x0 + w + 3; x++) {
    sample(x, y0 - 3);
    sample(x, y0 + h + 2);
  }
  for (let y = y0; y < y0 + h; y++) {
    sample(x0 - 3, y);
    sample(x0 + w + 2, y);
  }
  const inkIsDark = !ringCount || ring / ringCount >= threshold;
  const isInk = (v: number) => (inkIsDark ? v < threshold : v >= threshold);

  // Full-width "bar" rows in the top 55% of the glyph, grouped into bands with a real gap between.
  const minGap = Math.max(2, Math.round(h * 0.05));
  let bands = 0, gap = Infinity;
  for (let y = y0; y < y0 + Math.ceil(h * 0.55); y++) {
    let ink = 0;
    for (let x = x0; x < x0 + w; x++) if (isInk(img.data[y * img.width + x])) ink++;
    if (ink / w >= 0.7) {
      if (gap >= minGap) bands++;
      gap = 0;
    } else {
      gap++;
    }
  }
  return bands >= 2;
}

const SUSPECT_FIRST_DIGIT = /^[237]\d/;
const MONTH_WORD = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i;

/** Read every text line with its confidence and size; a misread leading ₹ is restored. */
export async function recognizeLines(image: Uint8Array): Promise<OcrLine[]> {
  const { png, gray, sourceWidth } = await preprocess(image);
  // Forwarded / downscaled screenshots lose detail; make every field ask to be checked.
  const resolutionFactor = sourceWidth && sourceWidth < 800 ? 0.85 : 1;
  const w = await worker();
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("OCR timed out")), OCR_TIMEOUT_MS);
  });
  try {
    const { data } = await Promise.race([
      w.recognize(png, {}, { text: true, blocks: true }),
      timeout.catch((error) => {
        // A stuck worker would block every later scan: replace it.
        workerPromise = null;
        void w.terminate().catch(() => undefined);
        throw error;
      }),
    ]);
    return (data.blocks ?? []).flatMap((block) =>
      block.paragraphs.flatMap((p) =>
        p.lines
          .map((line) => {
            const words = line.words.map((word, i) => {
              const t = word.text.trim();
              const first = word.symbols[0];
              const isDay = MONTH_WORD.test(line.words[i + 1]?.text ?? "");
              if (!isDay && SUSPECT_FIRST_DIGIT.test(t) && /^\d[\d,]*(\.\d{1,2})?$/.test(t) && first && looksLikeRupee(gray, first.bbox)) {
                return `₹${t.slice(1)}`;
              }
              return t;
            });
            // An unreadable glyph (the ₹ again) drags the line score to ~0 even when every character
            // Tesseract did output is certain; credit those, a little below face value.
            const symbols = line.words.flatMap((word) => word.symbols);
            const symbolMean = symbols.length ? symbols.reduce((sum, sym) => sum + sym.confidence, 0) / symbols.length : 0;
            return {
              text: words.join(" ").replace(/\s+/g, " ").trim(),
              confidence: Math.max(line.confidence, symbolMean * 0.9) * resolutionFactor,
              height: line.rowAttributes?.rowHeight || line.bbox.y1 - line.bbox.y0,
              top: line.bbox.y0,
            };
          })
          .filter((line) => line.text),
      ),
    );
  } finally {
    clearTimeout(timer);
  }
}
