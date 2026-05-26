import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";

export async function DELETE(req: NextRequest) {
  try {
    const { filename } = await req.json();

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    // Delete metadata from Firestore
    await deleteDoc(doc(db, "documents", filename));

    // Note: Deleting from a MemoryVectorStore isn't directly supported by default without custom filters,
    // In production with Pinecone/Chroma, you would delete vectors where metadata.source === filename here.

    return NextResponse.json({ success: true, message: `Document ${filename} deleted.` });
  } catch (error: any) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
