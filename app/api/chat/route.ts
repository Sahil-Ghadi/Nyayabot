import { NextResponse } from "next/server";
import { appGraph } from "@/lib/langgraph";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    // TODO: Verify Firebase token using firebase-admin for full security
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, history = [] } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }

    const initialState = {
      input: message,
      messages: history, // Pass history to langgraph
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