import {
  dateOrdinalLabel,
  monthName,
  WEEKDAY_NAMES,
  type RotaWeek,
  type ScheduleDay,
} from "./schedule-service";

/**
 * Renders the duty roster to PNG and PDF in the exact layout of the Excel
 * export (lib/schedule-export): a "July, 2026" title, then one block per week —
 * an ordinal date row, a navy weekday band, a "WEEK n" label, and DAY / NIGHT
 * rows with names joined by " / ". A single canvas renderer feeds both formats
 * so they stay pixel-identical to each other and to the spreadsheet.
 */

// Roster palette — mirrors the ARGB fills in schedule-export.ts (Excel export).
const NAVY = "#1F3864";
const DAY_BLUE = "#305496";
const NIGHT_BLACK = "#111111";
const INK = "#000000";
const PAPER = "#FFFFFF";
const FONT_STACK = "Arial, Helvetica, sans-serif";

// Layout geometry, in CSS pixels (multiplied by `scale` for the backing store).
const PAD = 28;
const TITLE_H = 48;
const DATE_H = 24;
const BAND_H = 24;
const ROW_H = 30;
const BLOCK_GAP = 22;
const W_WEEK = 92;
const W_SHIFT = 68;
const W_TIME = 88;
const W_DAY = 170;
const GRID_W = W_WEEK + W_SHIFT + W_TIME + W_DAY * 7;

const DEFAULT_SCALE = 2;

export interface RotaImageOptions {
  year: number;
  month: number;
  weeks: RotaWeek[];
  days: ScheduleDay[];
  filename?: string;
  /** Device-pixel multiplier for the backing store (crispness). Defaults to 2. */
  scale?: number;
}

/** Draws `text` centered at (cx, cy), shrinking the font until it fits `maxWidth`. */
function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  maxWidth: number,
  baseSize = 11,
  minSize = 7,
): void {
  let size = baseSize;
  ctx.font = `${size}px ${FONT_STACK}`;
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 0.5;
    ctx.font = `${size}px ${FONT_STACK}`;
  }
  ctx.fillText(text, cx, cy);
}

/** The overall roster dimensions in CSS pixels for a given week count. */
export function rotaCanvasSize(weekCount: number): { width: number; height: number } {
  const blockH = DATE_H + BAND_H + ROW_H * 2;
  const height = PAD * 2 + TITLE_H + weekCount * blockH + Math.max(0, weekCount - 1) * BLOCK_GAP;
  return { width: PAD * 2 + GRID_W, height };
}

/**
 * Paints the whole roster onto a fresh canvas. Browser-only (uses `document`).
 */
export function renderRotaCanvas(options: RotaImageOptions): HTMLCanvasElement {
  const { year, month, weeks, days } = options;
  const scale = options.scale ?? DEFAULT_SCALE;
  const byDate = new Map(days.map((day) => [day.date, day]));
  const { width, height } = rotaCanvasSize(weeks.length);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is unavailable");
  ctx.scale(scale, scale);
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);

  const xWeek = PAD;
  const xShift = xWeek + W_WEEK;
  const xTime = xShift + W_SHIFT;
  const xDay0 = xTime + W_TIME;
  const dayCenter = (index: number) => xDay0 + index * W_DAY + W_DAY / 2;

  // Title
  ctx.fillStyle = INK;
  ctx.font = `bold 16px ${FONT_STACK}`;
  ctx.fillText(`${monthName(month)}, ${year}`, PAD + GRID_W / 2, PAD + TITLE_H / 2);

  const shifts: Array<{ label: string; fill: string; time: string; pick: (day: ScheduleDay) => string[] }> = [
    { label: "DAY", fill: DAY_BLUE, time: "7am - 7pm", pick: (day) => day.dayShift },
    { label: "NIGHT", fill: NIGHT_BLACK, time: "7pm - 7am", pick: (day) => day.nightShift },
  ];

  let y = PAD + TITLE_H;
  for (const week of weeks) {
    // Ordinal date row above the active day columns
    ctx.fillStyle = INK;
    ctx.font = `bold 11px ${FONT_STACK}`;
    week.dates.forEach((date, index) => {
      if (date) ctx.fillText(dateOrdinalLabel(date), dayCenter(index), y + DATE_H / 2);
    });

    // Navy weekday band across the full grid width
    const bandY = y + DATE_H;
    ctx.fillStyle = NAVY;
    ctx.fillRect(xWeek, bandY, GRID_W, BAND_H);
    ctx.fillStyle = PAPER;
    ctx.font = `bold 11px ${FONT_STACK}`;
    week.dates.forEach((date, index) => {
      if (date) ctx.fillText(WEEKDAY_NAMES[index], dayCenter(index), bandY + BAND_H / 2);
    });

    // "WEEK n" centered across both shift rows
    const rowTop = bandY + BAND_H;
    ctx.fillStyle = INK;
    ctx.font = `bold 11px ${FONT_STACK}`;
    ctx.fillText(`WEEK ${week.week}`, xWeek + W_WEEK / 2, rowTop + ROW_H);

    shifts.forEach((shift, shiftIndex) => {
      const rowY = rowTop + shiftIndex * ROW_H;

      // Colored DAY / NIGHT chip
      ctx.fillStyle = shift.fill;
      ctx.fillRect(xShift, rowY, W_SHIFT, ROW_H);
      ctx.fillStyle = PAPER;
      ctx.font = `bold 11px ${FONT_STACK}`;
      ctx.fillText(shift.label, xShift + W_SHIFT / 2, rowY + ROW_H / 2);

      // Shift time
      ctx.fillStyle = INK;
      ctx.fillText(shift.time, xTime + W_TIME / 2, rowY + ROW_H / 2);

      // Assigned names per day, joined with slashes
      week.dates.forEach((date, index) => {
        if (!date) return;
        const day = byDate.get(date);
        const names = day ? shift.pick(day) : [];
        if (names.length) {
          drawFittedText(ctx, names.join(" / "), dayCenter(index), rowY + ROW_H / 2, W_DAY - 12);
        }
      });
    });

    y = rowTop + ROW_H * 2 + BLOCK_GAP;
  }

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to encode the roster canvas"))),
      type,
      quality,
    );
  });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function defaultFilename(month: number, year: number, ext: string): string {
  return `duty-roster-${monthName(month).toLowerCase()}-${year}.${ext}`;
}

/** Renders the roster to a PNG and triggers a client-side download. */
export async function exportRotaToImage(options: RotaImageOptions): Promise<void> {
  const canvas = renderRotaCanvas(options);
  const blob = await canvasToBlob(canvas, "image/png");
  downloadBlob(blob, options.filename ?? defaultFilename(options.month, options.year, "png"));
}

// A4 landscape (points) with an even margin — a sensible print/email size.
const A4_LANDSCAPE = { width: 842, height: 595, margin: 24 };

/** Renders the roster to a single-page PDF and triggers a client-side download. */
export async function exportRotaToPdf(options: RotaImageOptions): Promise<void> {
  const canvas = renderRotaCanvas({ ...options, scale: options.scale ?? 3 });
  const jpegBlob = await canvasToBlob(canvas, "image/jpeg", 0.95);
  const image = new Uint8Array(await jpegBlob.arrayBuffer());

  const { width: pageWidth, height: pageHeight, margin } = A4_LANDSCAPE;
  const availWidth = pageWidth - margin * 2;
  const availHeight = pageHeight - margin * 2;
  const aspect = canvas.width / canvas.height;
  let drawWidth = availWidth;
  let drawHeight = availWidth / aspect;
  if (drawHeight > availHeight) {
    drawHeight = availHeight;
    drawWidth = availHeight * aspect;
  }

  const pdf = buildImagePdf({
    image,
    pxWidth: canvas.width,
    pxHeight: canvas.height,
    pageWidth,
    pageHeight,
    draw: {
      x: margin + (availWidth - drawWidth) / 2,
      y: margin + (availHeight - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight,
    },
  });

  // Cast around the TS 5.7 Uint8Array<ArrayBufferLike> vs BlobPart narrowing.
  downloadBlob(
    new Blob([pdf as BlobPart], { type: "application/pdf" }),
    options.filename ?? defaultFilename(options.month, options.year, "pdf"),
  );
}

export interface ImagePdfParams {
  /** Raw JPEG (DCTDecode) bytes. */
  image: Uint8Array;
  /** Pixel dimensions of the JPEG (resolution only; placement is by `draw`). */
  pxWidth: number;
  pxHeight: number;
  /** Page (MediaBox) size in points. */
  pageWidth: number;
  pageHeight: number;
  /** Where to paint the image on the page, in points (PDF origin = bottom-left). */
  draw: { x: number; y: number; width: number; height: number };
}

/**
 * Assembles a minimal, valid single-page PDF that embeds one JPEG image. Pure
 * (no DOM) and byte-offset accurate, so the xref table resolves in strict
 * readers. Exported for unit testing the structure.
 */
export function buildImagePdf(params: ImagePdfParams): Uint8Array {
  const { image, pxWidth, pxHeight, pageWidth, pageHeight, draw } = params;
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let offset = 0;

  const push = (data: Uint8Array | string) => {
    const bytes = typeof data === "string" ? encoder.encode(data) : data;
    chunks.push(bytes);
    offset += bytes.length;
  };
  const obj = (n: number, body: string) => {
    offsets[n] = offset;
    push(`${n} 0 obj\n${body}\nendobj\n`);
  };
  const num = (value: number) => value.toFixed(2).replace(/\.00$/, "");

  push("%PDF-1.3\n");

  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  obj(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(pageWidth)} ${num(pageHeight)}] ` +
      "/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>",
  );

  // Image XObject — dictionary + binary JPEG stream.
  offsets[4] = offset;
  push(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pxWidth} /Height ${pxHeight} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`,
  );
  push(image);
  push("\nendstream\nendobj\n");

  // Content stream: scale/translate the unit image onto the page.
  const content = `q ${num(draw.width)} 0 0 ${num(draw.height)} ${num(draw.x)} ${num(draw.y)} cm /Im0 Do Q`;
  obj(5, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);

  const xrefStart = offset;
  const count = 6; // objects 0..5
  let xref = `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let n = 1; n < count; n++) {
    xref += `${String(offsets[n]).padStart(10, "0")} 00000 n \n`;
  }
  push(xref);
  push(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let position = 0;
  for (const chunk of chunks) {
    out.set(chunk, position);
    position += chunk.length;
  }
  return out;
}
