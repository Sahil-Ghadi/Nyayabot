import { StateGraph, Annotation } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { similaritySearch } from "./rag/vectorStore";

// Define the state for the graph
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
  })
});

// Create model instance
const getModel = () => {
  return new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.1,
  });
};

// Node: Validate Input
const validateInput = (state: typeof ChatStateAnnotation.State) => {
  if (!state.input || state.input.trim().length === 0) {
    return { response: "Please provide a valid query." };
  }
  return { input: state.input };
};

// Node: Classify Issue
const classifyIssue = async (state: typeof ChatStateAnnotation.State) => {
  const model = getModel();
  const prompt = `Classify the following workplace issue into one of these categories: SALARY_DISPUTE, WRONGFUL_TERMINATION, POSH, LEAVE_DENIAL, OTHER_LABOUR.
  
Issue: "${state.input}"
  
Respond with ONLY the category name.`;
  
  const result = await model.invoke(prompt);
  return { classification: result.content.toString().trim() };
};

// Node: Retrieve Documents
const retrieveDocuments = async (state: typeof ChatStateAnnotation.State) => {
  const docs = await similaritySearch(state.input, 5);
  return { retrievedDocs: docs };
};

// Node: Build Context
const buildContext = (state: typeof ChatStateAnnotation.State) => {
  if (state.retrievedDocs.length === 0) {
    return { context: "No context found." };
  }
  
  const contextStr = state.retrievedDocs
    .map((doc, idx) => `[Source ${idx + 1}: ${doc.source}]\n${doc.content}`)
    .join("\n\n");
    
  const citations = state.retrievedDocs.map((doc, idx) => ({
    id: idx + 1,
    source: doc.source,
    page: doc.page,
    content: doc.content.substring(0, 100) + "..."
  }));
  
  return { context: contextStr, citations };
};

// Node: Generate Response
const generateResponse = async (state: typeof ChatStateAnnotation.State) => {
  const model = getModel();
  const prompt = `You are NyayaBot, an employee rights assistant.
Use ONLY the supplied legal context below to answer the query.
If information is unavailable in the retrieved context, clearly state that the document corpus does not contain sufficient information.
Never invent legal provisions.

Context:
${state.context}

User Issue (${state.classification}): ${state.input}

Provide a structured response exactly as:
1. Legal Evaluation
2. Applicable Acts (from context)
3. Procedural Roadmap (next steps based on context)
4. Disclaimer`;

  const result = await model.invoke(prompt);
  return { 
    response: result.content.toString()
  };
};

// Build Graph
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

