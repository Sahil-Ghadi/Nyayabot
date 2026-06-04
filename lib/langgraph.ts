import { StateGraph, Annotation } from "@langchain/langgraph";
import { ChatOllama } from "@langchain/ollama";
import { similaritySearch } from "./rag/vectorStore";
import { z } from "zod";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const ChatStateAnnotation = Annotation.Root({
  input: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  classification: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "Unknown",
  }),
  retrievedDocs: Annotation<any[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  context: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  messages: Annotation<any[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  response: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  citations: Annotation<any[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
});

const getModel = () =>
  new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0.1,
    apiKey: process.env.GEMINI_API_KEY,
  });

// ── Node: Validate Input ──────────────────────────────────────────────────────
const validateInput = (state: typeof ChatStateAnnotation.State) => {
  if (!state.input || state.input.trim().length === 0) {
    return { response: "Please provide a valid query." };
  }
  return { input: state.input.trim() };
};

const classifyIssue = async (state: typeof ChatStateAnnotation.State) => {
  const text = state.input.toLowerCase().trim();

  if (/^(hi|hello|hey|greetings|good morning|good afternoon|thanks|thank you)/i.test(text)) {
    return { classification: "GREETING" };
  }

  const rules: [RegExp, string][] = [
    [/\b(posh|sexual.?harass|harass|inappropri|misconduct|hostile.work|unwanted.advanc)\b/, "POSH"],
    [/\b(salary|wages?|pay|overtime|underpay|arrear|bonus|stipend)\b/, "SALARY_DISPUTE"],
    [/\b(terminat|dismiss|fired|retrench|layoff|lay.off|compulsory.retir)\b/, "WRONGFUL_TERMINATION"],
    [/\b(leave|sick.leave|casual.leave|earned.leave|maternity|paternity|medical.leave|absent)\b/, "LEAVE_DENIAL"],
  ];

  for (const [pattern, category] of rules) {
    if (pattern.test(text)) return { classification: category };
  }

  // LLM fallback only when keyword match fails
  const model = getModel();
  const result = await model.invoke(
    `Classify this workplace issue into exactly one of: SALARY_DISPUTE, WRONGFUL_TERMINATION, POSH, LEAVE_DENIAL, OTHER_LABOUR, GREETING, NON_LEGAL.\n\nIssue: "${state.input}"\n\nRespond with ONLY the category name.`
  );
  return { classification: result.content.toString().trim() };
};

// ── Node: Retrieve Documents ──────────────────────────────────────────────────
const retrieveDocuments = async (state: typeof ChatStateAnnotation.State) => {
  const docs = await similaritySearch(state.input, 4);
  return { retrievedDocs: docs };
};

// ── Node: Build Context ───────────────────────────────────────────────────────
const buildContext = (state: typeof ChatStateAnnotation.State) => {
  if (state.retrievedDocs.length === 0) {
    return { context: "NO_DOCS", citations: [] };
  }

  const contextStr = state.retrievedDocs
    .map((doc, idx) => `[Source ${idx + 1}: ${doc.source}]\n${doc.content}`)
    .join("\n\n");

  const citations = state.retrievedDocs.map((doc, idx) => ({
    id: idx + 1,
    source: doc.source,
    page: doc.page ?? null,
    preview: doc.content.substring(0, 120) + "…",
  }));

  return { context: contextStr, citations };
};

// ── Zod Schema for Structured Output ──────────────────────────────────────────
const LegalResponseSchema = z.object({
  assessment: z.string().describe("1-2 sentence plain-English summary of the legal position. BE EXTREMELY BRIEF."),
  applicableLaws: z.array(
    z.object({
      law: z.string().describe("Name of the Act (e.g., POSH Act)"),
      section: z.string().describe("Section number"),
      meaning: z.string().describe("One-line explanation (max 15 words)")
    })
  ).describe("List 1 or 2 most relevant laws. DO NOT list more than 2."),
  actionPlan: z.array(
    z.object({
      stepTitle: z.string().describe("Short action name (e.g., 'File Complaint', not 'Step 1')"),
      action: z.string().describe("Concrete action (max 20 words). Name the exact office.")
    })
  ).describe("Step by step action plan. EXACTLY 3 steps. KEEP IT SHORT."),
  evidence: z.array(
    z.object({
      item: z.string().describe("Document name"),
      reason: z.string().describe("Why it matters (max 10 words)")
    })
  ).describe("List 1 to 3 items to collect"),
  deadlines: z.array(z.string()).describe("List 1 or 2 key deadlines (max 10 words each)")
});

// ── Node: Generate Response ───────────────────────────────────────────────────
const generateResponse = async (state: typeof ChatStateAnnotation.State) => {
  const model = getModel();
  const structuredModel = model.withStructuredOutput(LegalResponseSchema);

  const categoryLabels: Record<string, string> = {
    POSH: "Sexual Harassment / POSH",
    SALARY_DISPUTE: "Salary / Wage Dispute",
    WRONGFUL_TERMINATION: "Wrongful Termination",
    LEAVE_DENIAL: "Leave Denial",
    OTHER_LABOUR: "Labour Issue",
    Unknown: "Workplace Issue",
  };
  const issueLabel = categoryLabels[state.classification] ?? "Workplace Issue";

  const historyText = (state.messages || []).map(m => `${m.role}: ${m.content}`).join("\n");

  const prompt = `You are NyayaBot, a strict Indian labour law assistant.

CRITICAL RULES FOR BREVITY (VIOLATION WILL CAUSE SYSTEM CRASH):
1. BE EXTREMELY CONCISE. Your response takes time to generate, so keep every string under 20 words where possible.
2. Only list a MAXIMUM of 2 Applicable Laws. Do NOT hallucinate 6 sections.
3. Action Plan MUST have exactly 3 steps. Never use "Step 1" as a title, use actual action names (e.g. "Draft Complaint").
4. Evidence MUST have a maximum of 3 items.
5. Do NOT invent legal procedures. Use the provided context. If context is missing, use general POSH/Labour law knowledge but keep it brief.
6. Name exact offices (Labour Court, ICC) instead of "appropriate authority".

CONVERSATION HISTORY:
${historyText}

LEGAL CONTEXT:
${state.context}

ISSUE TYPE: ${issueLabel}
USER QUERY: ${state.input}`;

  const result = await structuredModel.invoke(prompt);
  return { response: result };
};

// ── Node: Generate Conversational Response ────────────────────────────────────
const generateConversationalResponse = async (state: typeof ChatStateAnnotation.State) => {
  const model = getModel();
  const historyText = (state.messages || []).map(m => `${m.role}: ${m.content}`).join("\n");

  const prompt = `You are NyayaBot, an AI assistant for Indian labour law.
The user's query is non-legal or a greeting. Respond politely and concisely. If they say hi, greet them back and ask how you can help with their workplace issues.

Conversation History:
${historyText}

User Query: ${state.input}
`;
  const result = await model.invoke(prompt);
  return { response: result.content.toString() };
};

// ── Graph ─────────────────────────────────────────────────────────────────────

const routeAfterClassification = (state: typeof ChatStateAnnotation.State) => {
  if (state.classification === "GREETING" || state.classification === "NON_LEGAL") {
    return "generateConversationalResponse";
  }
  return "retrieveDocuments";
};

const workflow = new StateGraph(ChatStateAnnotation)
  .addNode("validateInput", validateInput)
  .addNode("classifyIssue", classifyIssue)
  .addNode("retrieveDocuments", retrieveDocuments)
  .addNode("buildContext", buildContext)
  .addNode("generateResponse", generateResponse)
  .addNode("generateConversationalResponse", generateConversationalResponse)
  .addEdge("__start__", "validateInput")
  .addEdge("validateInput", "classifyIssue")
  .addConditionalEdges("classifyIssue", routeAfterClassification)
  .addEdge("retrieveDocuments", "buildContext")
  .addEdge("buildContext", "generateResponse")
  .addEdge("generateResponse", "__end__")
  .addEdge("generateConversationalResponse", "__end__");

export const appGraph = workflow.compile();