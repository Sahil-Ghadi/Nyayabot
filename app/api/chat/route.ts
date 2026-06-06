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


    const initialState = {
      input: message,
      messages: history, // Pass history to langgraph
    };

    const stream = await appGraph.stream(initialState);
    const encoder = new TextEncoder();

    const customReadable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            // chunk contains the state output from the node that just finished
            const data = JSON.stringify(chunk);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          controller.close();
        } catch (err) {
          console.error("Stream Error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(customReadable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}