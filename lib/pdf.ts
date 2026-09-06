import pdfParse from "pdf-parse";

export async function extractPdfText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await pdfParse(buffer);
  const text = parsed.text.replace(/\u0000/g, "").trim();
  if (!text) {
    throw new Error("No selectable text was found in this PDF. Scanned/image-only PDFs need OCR support.");
  }
  return text;
}
