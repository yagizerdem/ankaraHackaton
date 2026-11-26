import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";

export async function getPageCount(
  buffer: Buffer,
  extension: string,
): Promise<number | null> {
  switch (extension) {
    case "pdf": {
      const pdf = await PDFDocument.load(buffer, {
        ignoreEncryption: true,
        updateMetadata: false,
      });
      return pdf.getPageCount();
    }

    case "docx": {
      const zip = await JSZip.loadAsync(buffer);
      const appXml = await zip.file("docProps/app.xml")?.async("string");
      const pages = appXml?.match(/<Pages>(\d+)<\/Pages>/)?.[1];
      return pages ? Number(pages) : null;
    }

    default:
      return null;
  }
}
