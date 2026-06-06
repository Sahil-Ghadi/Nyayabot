import { StateGraph, Annotation } from "@langchain/langgraph";
import { similaritySearch } from "./rag/vectorStore";
import { z } from "zod";
import { getModel } from "./llm";

export const ChatStateAnnotation = Annotation.Root({
  input: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  classification: Annotation<string[]>({
    reducer: (x, y) => y ?? x,
    default: () => ["Unknown"],
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
  assessment: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  applicableLaws: Annotation<any[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  actionPlan: Annotation<any[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  evidence: Annotation<any[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  deadlines: Annotation<string[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  citations: Annotation<any[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
});

// ── Node: Validate Input ──────────────────────────────────────────────────────
const validateInput = (state: typeof ChatStateAnnotation.State) => {
  if (!state.input || state.input.trim().length === 0) {
    return { response: "Please provide a valid query." };
  }
  return { input: state.input.trim() };
};

// ── Node: Classify Issue (multi-label) ────────────────────────────────────────
const classifyIssue = async (state: typeof ChatStateAnnotation.State) => {
  const text = state.input.toLowerCase().trim();

  // Quick greeting short-circuit
  if (/^(hi|hello|hey|greetings|good morning|good afternoon|thanks|thank you)\b/i.test(text)) {
    return { classification: ["GREETING"] };
  }

  const rules: [RegExp, string][] = [
    [/\b(posh|sexual.?harass|harass|inappropri|misconduct|hostile.work|unwanted.advanc)\b/, "POSH"],
    [/\b(salary|wages?|pay|overtime|underpay|arrear|bonus|stipend|increment)\b/, "SALARY_DISPUTE"],
    [/\b(terminat|dismiss|fired|retrench|layoff|lay.off|compulsory.retir|removal)\b/, "WRONGFUL_TERMINATION"],
    [/\b(leave|sick.leave|casual.leave|earned.leave|maternity|paternity|medical.leave|absent|pl|cl|el)\b/, "LEAVE_DENIAL"],
    [/\b(pf|provident.fund|esic|gratuity|esi|epfo|pension)\b/, "STATUTORY_BENEFITS"],
    [/\b(contract|bond|notice.period|nda|non.compete|appointment.letter)\b/, "CONTRACT_DISPUTE"],
  ];

  const matched: string[] = [];
  for (const [pattern, category] of rules) {
    if (pattern.test(text)) matched.push(category);
  }

  if (matched.length > 0) {
    return { classification: matched };
  }

  // LLM fallback — qwen 2.5:3b friendly: short, direct prompt
  const model = getModel();
  const result = await model.invoke(
    `You are a classifier. Given the workplace issue below, output a comma-separated list of ALL relevant categories from: SALARY_DISPUTE, WRONGFUL_TERMINATION, POSH, LEAVE_DENIAL, STATUTORY_BENEFITS, CONTRACT_DISPUTE, OTHER_LABOUR, GREETING, NON_LEGAL.

Issue: "${state.input}"

Rules:
- Output ONLY category names separated by commas, nothing else.
- If multiple apply, list all.
- Example output: SALARY_DISPUTE,WRONGFUL_TERMINATION`
  );

  const raw = result.content.toString().trim().toUpperCase();
  const categories = raw
    .split(/[,\s]+/)
    .map(s => s.trim())
    .filter(s =>
      ["SALARY_DISPUTE", "WRONGFUL_TERMINATION", "POSH", "LEAVE_DENIAL",
        "STATUTORY_BENEFITS", "CONTRACT_DISPUTE", "OTHER_LABOUR", "GREETING", "NON_LEGAL"].includes(s)
    );

  return { classification: categories.length > 0 ? categories : ["OTHER_LABOUR"] };
};

// ── Node: Retrieve Documents ──────────────────────────────────────────────────
const retrieveDocuments = async (state: typeof ChatStateAnnotation.State) => {
  // Search using the full input for better semantic coverage
  const docs = await similaritySearch(state.input, 5);
  return { retrievedDocs: docs };
};

// ── Node: Build Context ───────────────────────────────────────────────────────
const buildContext = (state: typeof ChatStateAnnotation.State) => {
  if (state.retrievedDocs.length === 0) {
    return { context: "NO_DOCS", citations: [] };
  }

  // Keep context tight for small models — truncate each chunk
  const contextStr = state.retrievedDocs
    .map((doc, idx) => `[Source ${idx + 1}: ${doc.source}]\n${doc.content.substring(0, 400)}`)
    .join("\n\n");

  const citations = state.retrievedDocs.map((doc, idx) => {
    // 1. Strip the .pdf extension to get the clean Act name
    const cleanSource = doc.source.replace(/\.pdf$/i, "");
    
    // 2. Attempt to extract Section / Chapter heading from the raw text
    const content = doc.content;
    let sectionInfo = "";
    
    // Match "8. Termination of employment..." or "9. Complaint..."
    const secMatch = content.match(/\b(\d+[A-Z]*)\.\s+([A-Z][^.—\n]+)/);
    // Match "CHAPTER IV"
    const chapMatch = content.match(/CHAPTER\s+[IVXLCDM]+/i);
    
    if (secMatch) {
      // Keep it short if it's too long
      const title = secMatch[2].trim();
      const shortTitle = title.length > 30 ? title.substring(0, 30) + "..." : title;
      sectionInfo = ` - Sec. ${secMatch[1]}: ${shortTitle}`;
    } else if (chapMatch) {
      sectionInfo = ` - ${chapMatch[0].toUpperCase()}`;
    }

    return {
      id: idx + 1,
      source: cleanSource + sectionInfo,
      page: doc.page ?? null,
      preview: content.substring(0, 100) + "…",
    };
  });

  return { context: contextStr, citations };
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatMessageContent = (content: any): string => {
  if (typeof content === "string") return content;
  if (typeof content === "object" && content !== null) {
    let text = "";
    if (content.assessment) text += `Assessment: ${content.assessment}\n`;
    if (content.applicableLaws?.length) {
      text += "Laws: " + content.applicableLaws.map((l: any) => `${l.law} s.${l.section}`).join(", ") + "\n";
    }
    if (content.actionPlan?.length) {
      text += "Steps: " + content.actionPlan.map((s: any) => s.stepTitle).join(" → ") + "\n";
    }
    return text.trim();
  }
  return String(content || "");
};

const hasPriorStructuredAnalysis = (messages: any[]): boolean =>
  (messages || []).some(
    m => m.role === "assistant" && typeof m.content === "object" && m.content !== null && "assessment" in m.content
  );

// ── Authority mapping by category ─────────────────────────────────────────────
const AUTHORITY_MAP: Record<string, string> = {
  POSH: "Internal Complaints Committee (ICC) if employer >10 employees, else Local Complaints Committee (LCC) at District level",
  SALARY_DISPUTE: "Inspector-cum-Facilitator under The Code on Wages, 2019; or Labour Court for recovery",
  WRONGFUL_TERMINATION: "Industrial Tribunal / Labour Court under The Industrial Relations Code, 2020; or High Court for writ if public employer",
  LEAVE_DENIAL: "Inspector-cum-Facilitator under Occupational Safety, Health and Working Conditions Code, 2020",
  STATUTORY_BENEFITS: "EPFO / ESIC / Gratuity authorities under Code on Social Security, 2020",
  CONTRACT_DISPUTE: "Labour Court under Industrial Relations Code, 2020 or Civil Court depending on contract type",
  OTHER_LABOUR: "Relevant Inspector-cum-Facilitator under the applicable New Labour Codes",
};

const getCategoryLabel = (cat: string) => ({
  POSH: "Sexual Harassment / POSH",
  SALARY_DISPUTE: "Salary / Wage Dispute",
  WRONGFUL_TERMINATION: "Wrongful Termination",
  LEAVE_DENIAL: "Leave Denial",
  STATUTORY_BENEFITS: "PF / ESI / Gratuity",
  CONTRACT_DISPUTE: "Contract / Bond Dispute",
  OTHER_LABOUR: "Labour Issue",
}[cat] ?? cat);

// ── Prompt Builder ─────────────────────────────────────────────────────────────
const getPrompt = (state: typeof ChatStateAnnotation.State, task: string) => {
  const categories = Array.isArray(state.classification) ? state.classification : [state.classification];
  const issueLabels = categories.map(getCategoryLabel).join(", ");
  const authorities = categories
    .filter(c => AUTHORITY_MAP[c])
    .map(c => `- ${getCategoryLabel(c)}: ${AUTHORITY_MAP[c]}`)
    .join("\n");

  // Keep history short for small model
  const recentHistory = (state.messages || []).slice(-4)
    .map(m => `${m.role}: ${formatMessageContent(m.content)}`)
    .join("\n");

  return `You are NyayaBot, an Indian labour law assistant. Be concise and accurate. You must apply the New Labour Codes of 2019/2020 (Code on Wages, Industrial Relations Code, Code on Social Security, OSHWC Code) and the POSH Act 2013 where applicable. Do not cite repealed acts like the Industrial Disputes Act or Minimum Wages Act if they are covered by the new codes.

ISSUE TYPE: ${issueLabels}
USER QUERY: ${state.input}

RELEVANT AUTHORITIES (use these specifically, do NOT default to ICC/LCC unless POSH):
${authorities || "Labour Commissioner / relevant authority"}

LEGAL CONTEXT (use this):
${state.context}

RECENT HISTORY:
${recentHistory}

${task}`;
};

// ── Node: Generate Assessment ──────────────────────────────────────────────────
const AssessmentSchema = z.object({
  assessment: z.string().describe("1-2 sentence plain-English summary of the legal position.")
});
const generateAssessment = async (state: typeof ChatStateAnnotation.State) => {
  const model = getModel().withStructuredOutput(AssessmentSchema);
  const result = await model.invoke(
    getPrompt(state, "TASK: Write a 1-2 sentence assessment of the user's legal position. Be direct.")
  );
  return { assessment: result.assessment };
};

// ── Node: Generate Laws ────────────────────────────────────────────────────────
const LawsSchema = z.object({
  applicableLaws: z.array(
    z.object({
      law: z.string().describe("Short Act/Code name, e.g. 'The Code on Wages, 2019'"),
      section: z.string().describe("Section number only, e.g. '4'"),
      meaning: z.string().describe("A 1-2 sentence detailed explanation of what this law means and exactly how it protects the user in this specific scenario."),
    })
  ).describe("1 to 3 most relevant laws only.")
});
const generateLaws = async (state: typeof ChatStateAnnotation.State) => {
  const model = getModel().withStructuredOutput(LawsSchema);
  const result = await model.invoke(
    getPrompt(state, "TASK: List 1-3 most directly applicable laws with section numbers. For the meaning, provide a thorough 1-2 sentence explanation connecting the law directly to the user's situation.")
  );
  return { applicableLaws: result.applicableLaws };
};

// ── Node: Generate Action Plan (includes evidence + deadlines) ─────────────────
const ActionPlanSchema = z.object({
  actionPlan: z.array(
    z.object({
      stepTitle: z.string().describe("Short step name, e.g. 'File Written Complaint'"),
      action: z.string().describe("Concrete action in max 25 words. Name the exact office/authority."),
    })
  ).describe("Exactly 4 to 7 practical steps tailored to the user's situation."),
  evidence: z.array(
    z.object({
      item: z.string().describe("PERSONAL document to collect (e.g., 'Salary slips', 'Emails', 'WhatsApp chats'). Do NOT list laws or PDF names."),
      reason: z.string().describe("Why needed in max 8 words"),
    })
  ).describe("2-4 key personal evidence documents for the user to collect. MUST NOT be laws, sections, or PDFs."),
  deadlines: z.array(
    z.string().describe("One deadline per string, e.g. '90 days from termination to file under ID Act'")
  ).describe("2-3 key legal deadlines. REQUIRED — always populate this."),
});
const generateActionPlan = async (state: typeof ChatStateAnnotation.State) => {
  const model = getModel().withStructuredOutput(ActionPlanSchema);
  const result = await model.invoke(
    getPrompt(
      state,
      `TASK: Generate a practical action plan.
IMPORTANT:
1. Name the EXACT authority relevant to this issue (see RELEVANT AUTHORITIES above). Do NOT say ICC or LCC unless the issue is POSH/harassment.
2. Provide exactly 4 to 7 steps in the action plan.
3. Populate evidence[] with 2-4 PERSONAL evidence documents (like emails, payslips, WhatsApp chats, formal letters) the user must collect. DO NOT put legal acts or PDFs in the evidence list.
4. Populate deadlines[] with 2-3 key statutory deadlines.
All three fields (actionPlan, evidence, deadlines) are mandatory.`
    )
  );
  return {
    actionPlan: result.actionPlan,
    evidence: result.evidence ?? [],
    deadlines: result.deadlines ?? [],
  };
};

// ── Node: Conversational / Greeting ───────────────────────────────────────────
const generateConversationalResponse = async (state: typeof ChatStateAnnotation.State) => {
  const model = getModel();
  const result = await model.invoke(
    `You are NyayaBot, an Indian labour law assistant. Respond warmly and briefly.
If the user greeted you, greet back and ask how you can help with their workplace issue.
If non-legal, politely redirect to workplace/labour topics.

User: ${state.input}`
  );
  return { response: result.content.toString() };
};

// ── Node: Follow-up (after structured analysis exists) ────────────────────────
const generateFollowUpResponse = async (state: typeof ChatStateAnnotation.State) => {
  const model = getModel();
  const recentHistory = (state.messages || []).slice(-6)
    .map(m => `${m.role}: ${formatMessageContent(m.content)}`)
    .join("\n");

  const result = await model.invoke(
    `You are NyayaBot, an Indian labour law assistant.
Answer the user's follow-up question directly and concisely in Markdown.
Base your answer on the legal context and prior conversation.

LEGAL CONTEXT:
${state.context}

CONVERSATION:
${recentHistory}

USER: ${state.input}

Respond in clear Markdown. Do not output JSON.`
  );
  return { response: result.content.toString() };
};

// ── Routing ───────────────────────────────────────────────────────────────────
const routeAfterClassification = (state: typeof ChatStateAnnotation.State) => {
  const cats = Array.isArray(state.classification) ? state.classification : [state.classification];
  if (cats.includes("GREETING") || (cats.length === 1 && cats[0] === "NON_LEGAL")) {
    return "generateConversationalResponse";
  }
  return "retrieveDocuments";
};

const routeAfterBuildContext = (state: typeof ChatStateAnnotation.State) => {
  if (hasPriorStructuredAnalysis(state.messages)) {
    return "generateFollowUpResponse";
  }
  return "generateAssessment";
};

// ── Graph ─────────────────────────────────────────────────────────────────────
const workflow = new StateGraph(ChatStateAnnotation)
  .addNode("validateInput", validateInput)
  .addNode("classifyIssue", classifyIssue)
  .addNode("retrieveDocuments", retrieveDocuments)
  .addNode("buildContext", buildContext)
  .addNode("generateAssessment", generateAssessment)
  .addNode("generateLaws", generateLaws)
  .addNode("generateActionPlan", generateActionPlan)
  .addNode("generateConversationalResponse", generateConversationalResponse)
  .addNode("generateFollowUpResponse", generateFollowUpResponse)
  .addEdge("__start__", "validateInput")
  .addEdge("validateInput", "classifyIssue")
  .addConditionalEdges("classifyIssue", routeAfterClassification)
  .addEdge("retrieveDocuments", "buildContext")
  .addConditionalEdges("buildContext", routeAfterBuildContext)
  .addEdge("generateAssessment", "generateLaws")
  .addEdge("generateLaws", "generateActionPlan")
  .addEdge("generateActionPlan", "__end__")
  .addEdge("generateFollowUpResponse", "__end__")
  .addEdge("generateConversationalResponse", "__end__");

export const appGraph = workflow.compile();