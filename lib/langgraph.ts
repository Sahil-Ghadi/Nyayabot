import { StateGraph, Annotation } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { similaritySearch } from "./rag/vectorStore";

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
  response: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  citations: Annotation<any[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
});

const getModel = () =>
  new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.1,
  });

// ── Node: Validate Input ──────────────────────────────────────────────────────
const validateInput = (state: typeof ChatStateAnnotation.State) => {
  if (!state.input || state.input.trim().length === 0) {
    return { response: "Please provide a valid query." };
  }
  return { input: state.input.trim() };
};

// ── Node: Classify Issue (keyword-first, LLM fallback) ───────────────────────
const classifyIssue = async (state: typeof ChatStateAnnotation.State) => {
  const text = state.input.toLowerCase();

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
    `Classify this workplace issue into exactly one of: SALARY_DISPUTE, WRONGFUL_TERMINATION, POSH, LEAVE_DENIAL, OTHER_LABOUR.\n\nIssue: "${state.input}"\n\nRespond with ONLY the category name.`
  );
  return { classification: result.content.toString().trim() };
};

// ── Node: Retrieve Documents ──────────────────────────────────────────────────
const retrieveDocuments = async (state: typeof ChatStateAnnotation.State) => {
  const docs = await similaritySearch(state.input, 8);
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

// ── Node: Generate Response ───────────────────────────────────────────────────
const generateResponse = async (state: typeof ChatStateAnnotation.State) => {
  const model = getModel();

  const categoryLabels: Record<string, string> = {
    POSH: "Sexual Harassment / POSH",
    SALARY_DISPUTE: "Salary / Wage Dispute",
    WRONGFUL_TERMINATION: "Wrongful Termination",
    LEAVE_DENIAL: "Leave Denial",
    OTHER_LABOUR: "Labour Issue",
    Unknown: "Workplace Issue",
  };
  const issueLabel = categoryLabels[state.classification] ?? "Workplace Issue";

  const prompt = `You are NyayaBot, a knowledgeable Indian labour law assistant.

STRICT RULES:
1. Use ONLY the legal context provided below — never invent or assume any law, section, or provision.
2. If the context does not cover a specific point, provide general guidance from well-known Indian labour law principles (Industrial Disputes Act, Factories Act, POSH Act, Payment of Wages Act) without citing specific sections unless they appear in the context.
3. NEVER say "the document corpus does not contain…" or "I cannot find in the context…" — just answer helpfully with what you know or advise consulting a lawyer.
4. Respond ONLY using the exact markdown structure below. Do not add any extra headings or sections.
5. NEVER use vague phrases like "appropriate authority", "relevant body", or "concerned department". 
   Always name the exact office: Labour Commissioner, ESIC office, Industrial Tribunal, Labour Court, 
   District Magistrate, etc. If the exact office depends on the state, say 
   "visit the Labour Commissioner's office in your district/city."
---

LEGAL CONTEXT:
${state.context}

ISSUE TYPE: ${issueLabel}
USER QUERY: ${state.input}

---

Respond in this EXACT format:

## ⚖️ Legal Assessment
> [2–3 sentence plain-English summary of whether the user has a valid grievance and what their core legal position is]

---

## 📜 Applicable Laws & Provisions
| Law / Act | Section | What It Means For You |
|---|---|---|
| [Act name] | Sec. [X] | [One-line plain explanation] |
[Add one row per applicable provision. If no specific section is known, write "General provision".]

---

## 🗺️ Your Action Plan
**Step 1 — [Short title]**
→ [Concrete action: who to contact, what to say, what to submit]

**Step 2 — [Short title]**
→ [Next step with specifics]

**Step 3 — [Short title]**
→ [If escalation needed, name the exact next body: Labour Court, ESIC office, Industrial Tribunal, High Court. Never say "appropriate authority" — always name it.]

[3–5 steps total. Every step must have a real person/office/action, not a placeholder.]

---

## 📂 Evidence to Collect
- **[Document/item]** — [Why it matters]
- **[Document/item]** — [Why it matters]
[List 3–6 items]

---

## ⏱️ Key Deadlines
- [Deadline or time limit with brief explanation]
- [Add another if applicable; if none known, write "File your complaint at the earliest — delays can weaken your case."]

---

## ⚠️ Disclaimer
*This is general legal information based on Indian labour law. It is not a substitute for professional legal advice. For serious matters, consult a qualified labour law advocate or visit your nearest Labour Commissioner's office.*`;

  const result = await model.invoke(prompt);
  return { response: result.content.toString() };
};

// ── Graph ─────────────────────────────────────────────────────────────────────
const workflow = new StateGraph(ChatStateAnnotation)
  .addNode("validateInput", validateInput)
  .addNode("classifyIssue", classifyIssue)
  .addNode("retrieveDocuments", retrieveDocuments)
  .addNode("buildContext", buildContext)
  .addNode("generateResponse", generateResponse)
  .addEdge("__start__", "validateInput")
  .addEdge("validateInput", "classifyIssue")
  .addEdge("classifyIssue", "retrieveDocuments")
  .addEdge("retrieveDocuments", "buildContext")
  .addEdge("buildContext", "generateResponse")
  .addEdge("generateResponse", "__end__");

export const appGraph = workflow.compile();