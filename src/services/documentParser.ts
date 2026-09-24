import fs from "fs/promises";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export async function extractTextFromFile(
  filePath: string,
  fileType: "pdf" | "docx",
): Promise<string> {
  const buffer = await fs.readFile(filePath);

  if (fileType === "pdf") {
    const parser = new PDFParse({
      data: buffer,
    });

    const result = await parser.getText();

    await parser.destroy();

    return result.text.trim();
  }

  if (fileType === "docx") {
    const result = await mammoth.extractRawText({
      buffer,
    });

    return result.value.trim();
  }

  throw new Error("Unsupported file type.");
}
