import { NextRequest, NextResponse } from "next/server";
import { chunkDocument } from "@/lib/rag/chunkDocs";
import { insertDocuments } from "@/lib/rag/vectorStore";
import fs from "fs";
import path from "path";

// Extract text using pdf2json — pure Node.js, no web worker needed
function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    // Dynamically require to avoid SSR/bundler issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PDFParser = require("pdf2json");
    const pdfParser = new PDFParser(null, 1); // 1 = raw text mode

    pdfParser.on("pdfParser_dataError", (err: any) => {
      reject(new Error(err?.parserError || "PDF parsing failed"));
    });

    pdfParser.on("pdfParser_dataReady", () => {
      try {
        const rawText: string = pdfParser.getRawTextContent();
        resolve(rawText);
      } catch (e: any) {
        reject(new Error("Failed to extract raw text from parsed PDF"));
      }
    });

    pdfParser.parseBuffer(buffer);
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Save PDF to docs folder
    const docsDir = path.join(process.cwd(), "docs");
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    const filePath = path.join(docsDir, file.name);
    fs.writeFileSync(filePath, buffer);

    // Parse PDF using pdf2json (pure Node.js, no worker dependency)
    let rawText: string;
    try {
      rawText = await extractTextFromPDF(buffer);
    } catch (parseError: any) {
      console.error("PDF parse error:", parseError);
      return NextResponse.json(
        { error: `Failed to parse PDF: ${parseError.message}. Try re-exporting the PDF from its source application.` },
        { status: 422 }
      );
    }

    if (!rawText.trim()) {
      return NextResponse.json(
        { error: "No text could be extracted from this PDF. It may be a scanned image PDF." },
        { status: 422 }
      );
    }

    // Chunk Document
    const docs = await chunkDocument(rawText, file.name);

    // Embed & Store in VectorStore
    await insertDocuments(docs);

    return NextResponse.json({ success: true, chunks: docs.length });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

