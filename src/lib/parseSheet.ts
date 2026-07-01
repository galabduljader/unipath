// Client-side major-sheet parser: extract text from PDF/DOCX, then heuristically
// pull course codes / titles / credits. Heavy libs are dynamically imported.

export type ExtractedCourse = { code: string; title: string; credits: number };

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Load the worker from a CDN matching the installed version (bundler-safe).
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const buf = await file.arrayBuffer();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await pdfjs.getDocument({ data: buf }).promise as any;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    // group items into lines by their vertical position
    const rows = new Map<number, string[]>();
    for (const item of content.items as { str: string; transform: number[] }[]) {
      if (!("str" in item)) continue;
      const y = Math.round(item.transform[5]);
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y)!.push(item.str);
    }
    const ys = [...rows.keys()].sort((a, b) => b - a);
    text += ys.map((y) => rows.get(y)!.join(" ")).join("\n") + "\n";
  }
  // Scanned / image-only PDF (no text layer): fall back to OCR of the pages.
  if (text.trim().length < 30) return ocrPdfPages(doc);
  return text;
}

// Rasterize each PDF page and OCR it — handles photographed or scanned sheets
// saved as PDFs. Capped to keep it responsive; heavy libs stay lazy.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ocrPdfPages(doc: any): Promise<string> {
  const Tesseract = await import("tesseract.js");
  let text = "";
  const pages = Math.min(doc.numPages, 6);
  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) continue;
    await page.render({ canvasContext: context, viewport, canvas }).promise;
    const { data } = await Tesseract.recognize(canvas, "eng");
    text += data.text + "\n";
  }
  return text;
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const buf = await file.arrayBuffer();
  const res = await mammoth.extractRawText({ arrayBuffer: buf });
  return res.value;
}

// OCR a photo/scan of a sheet (e.g. a phone picture). tesseract.js is heavy,
// so it's only imported when an image is actually uploaded.
async function extractImageText(file: File): Promise<string> {
  const Tesseract = await import("tesseract.js");
  const { data } = await Tesseract.recognize(file, "eng");
  return data.text;
}

const IMAGE_RE = /\.(png|jpe?g|webp|gif|bmp|heic|heif|tiff?)$/i;

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || IMAGE_RE.test(file.name);
}

export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") return extractPdfText(file);
  if (name.endsWith(".docx") || name.endsWith(".doc") || /word|officedocument|msword/.test(file.type))
    return extractDocxText(file);
  if (isImageFile(file)) return extractImageText(file);
  // plain text fallback
  return file.text();
}

const COURSE_RE = /\b([A-Z]{2,4})\s?-?\s?(\d{3}[A-Z]?)\b/;

export function extractCourses(text: string): ExtractedCourse[] {
  const lines = text.split(/\r?\n/);
  const out: ExtractedCourse[] = [];
  const seen = new Set<string>();

  for (const raw of lines) {
    const line = raw.replace(/\s{2,}/g, " ").trim();
    const m = line.match(COURSE_RE);
    if (!m) continue;
    const code = `${m[1].toUpperCase()} ${m[2].toUpperCase()}`;
    if (seen.has(code)) continue;

    // everything after the matched code on the same line
    const after = line.slice(line.indexOf(m[0]) + m[0].length);

    // credits: prefer an explicit "N cr / credits / hrs", else a trailing small int
    let credits = 3;
    const crM =
      line.match(/\b([1-6])\s*(?:cr|credits?|hrs?|ch|units?)\b/i) ||
      after.match(/(?:^|\s)([1-6])(?:\.0)?\s*$/);
    if (crM) credits = parseInt(crM[1], 10);

    // title: strip leading separators and trailing credit/grade noise
    let title = after
      .replace(/^[\s\-:.)|]+/, "")
      .replace(/\b[1-6]\s*(?:cr|credits?|hrs?|ch|units?)\b.*$/i, "")
      .replace(/\b(?:A[+-]?|B[+-]?|C[+-]?|D[+-]?|F|P|NP|W|IP)\b\s*$/i, "")
      .replace(/[\s\d.]+$/, "")
      .trim();
    if (!title || title.length < 2) title = code;
    if (title.length > 64) title = title.slice(0, 64).trim();

    out.push({ code, title, credits });
    seen.add(code);
  }
  return out;
}

export async function parseSheet(file: File): Promise<ExtractedCourse[]> {
  try {
    const text = await extractText(file);
    return extractCourses(text);
  } catch {
    return [];
  }
}
