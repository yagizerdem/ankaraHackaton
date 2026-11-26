import mammoth from "mammoth";
import { extractText as extractPdfText } from "unpdf";

/** Formats extractText can read; legacy binary .doc is not one of them. */
export const TEXT_EXTRACTABLE_EXTENSIONS = ["pdf", "docx", "txt"];

/**
 * Plain text of a stored document, with paragraphs separated by blank lines
 * so chunkText can split on them. Throws for formats it can't read.
 */
export async function extractText(
  buffer: Uint8Array,
  extension: string,
): Promise<string> {
  switch (extension) {
    case "pdf": {
      // pdf.js detaches the buffer it is given; copy so the caller's survives.
      const { text } = await extractPdfText(new Uint8Array(buffer));
      return text.join("\n\n");
    }

    case "docx": {
      const { value } = await mammoth.extractRawText({
        buffer: Buffer.from(buffer),
      });
      return value;
    }

    case "txt":
      return new TextDecoder("utf-8").decode(buffer);

    default:
      throw new Error(`Can't extract text from .${extension} files`);
  }
}
