import { ChatOllama } from "@langchain/ollama";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// Toggle this variable to easily switch between "ollama" and "gemini"
//const MODEL_PROVIDER: "ollama" | "gemini" = "gemini";

export const getModel = () => {
  // if (MODEL_PROVIDER === "ollama") {
  //   return new ChatOllama({
  //     model: "qwen2.5:3b",
  //     temperature: 0.1,
  //   });
  // }

  // Default to Gemini
  return new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0.1,
    apiKey: process.env.GEMINI_API_KEY,
  });
};
