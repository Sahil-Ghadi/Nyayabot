import { NextResponse } from "next/server";
import { appGraph } from "@/lib/langgraph";
import { seedLegalDocs } from "@/lib/rag/seedDocs";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }

    // Seed PDFs on first message only
    await seedLegalDocs();

    const initialState = {
      input: message,
    };

    const finalState = await appGraph.invoke(initialState);

    return NextResponse.json({
      response: finalState.response,
      classification: finalState.classification,
      citations: finalState.citations,
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}