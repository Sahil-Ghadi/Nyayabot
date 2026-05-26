import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import * as pdf from "pdf-parse";
import { chunkDocument } from "@/lib/rag/chunkDocs";
import { insertDocuments } from "@/lib/rag/vectorStore";

// Handle default export difference between ESM and CJS for pdf-parse
const pdfParse = (typeof pdf === "function" ? pdf : (pdf as any).default) as any;


export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Parse PDF
    const data = await pdfParse(buffer);
    const rawText = data.text;

    // Chunk Document
    const docs = await chunkDocument(rawText, file.name);

    // Embed & Store in VectorStore
    await insertDocuments(docs);

    // Save metadata to Firestore
    const docRef = doc(db, "documents", file.name);
    await setDoc(docRef, {
      filename: file.name,
      uploadedAt: serverTimestamp(),
      chunkCount: docs.length,
      processed: true,
    });

    return NextResponse.json({ success: true, chunks: docs.length });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
