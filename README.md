# NyayaBot: Final Project Overview

## 1. Executive Summary
**NyayaBot** is an AI-powered Employee Rights Awareness Platform designed specifically for the Indian corporate and private sector. It serves as a first-point-of-contact legal assistant, allowing employees to describe workplace issues in plain, natural language and receive structured, law-grounded guidance. 

By leveraging a completely local Retrieval-Augmented Generation (RAG) pipeline, NyayaBot ensures that its advice is grounded in actual Indian employment legislation (e.g., POSH Act, Code on Wages, Industrial Relations Code) rather than relying solely on an AI's pre-trained memory.

## 2. Core Features
*   **Conversational Legal Assistant:** A chat interface where users can ask complex legal questions and receive structured outputs, including a situation assessment, applicable laws, and a step-by-step action plan.
*   **Intelligent Issue Routing (LangGraph):** The backend actively categorizes user intents. General greetings bypass the heavy RAG pipeline, while specific legal issues trigger document retrieval, saving computational resources.
*   **100% Local RAG Pipeline:** Document embeddings and LLM inference run entirely locally, eliminating API costs, rate limits, and data privacy concerns associated with cloud LLMs.
*   **Dynamic Admin Interface:** A dedicated dashboard for administrators to upload raw PDF legal documents, which are automatically parsed, chunked, embedded, and added to the vector store at runtime.
*   **Persistent Case History:** Secure integration with Firebase allows users to log out, log back in, and resume past legal consultations seamlessly from their dashboard.

---

## 3. Technology Stack

### Frontend Architecture
*   **Framework:** Next.js (App Router) & React
*   **Styling:** TailwindCSS with a custom dark-mode "Glassmorphism" design system (vibrant gold accents, blur effects, dynamic gradients).
*   **Animations:** Framer Motion for micro-interactions and smooth page transitions.
*   **Icons:** Lucide React

### Backend & AI Infrastructure
*   **Routing:** Next.js Serverless API Routes (`app/api/...`)
*   **Orchestration:** LangChain and LangGraph for constructing the conversational state machine and tool execution.
*   **Large Language Model (LLM):** Ollama running `qwen2.5:3b` locally. This model provides the reasoning engine while maintaining strict JSON output schemas.
*   **Embedding Model:** `@xenova/transformers` running `all-MiniLM-L6-v2` locally in Node.js.
*   **Vector Store:** A custom-built `SimpleMemoryVectorStore` that reads and writes to a persistent `precomputed-embeddings.json` file.
*   **Document Parsing:** `pdf-parse-fork` for extracting clean text buffers from complex legal PDFs.

### Database & Authentication
*   **Authentication:** Firebase Auth (Email/Password).
*   **Database:** Firebase Firestore (NoSQL) for storing user profiles, chat session metadata, and individual chat messages.

---

## 4. Implementation Details & Architecture

### The RAG (Retrieval-Augmented Generation) Flow
1. **Document Ingestion:** Admin uploads a PDF. The backend extracts text, splits it into 800-character overlapping chunks, and converts each chunk into a mathematical vector using `Transformers.js`. These are saved to disk.
2. **Query Vectorization:** When a user asks a question (e.g., "I haven't been paid"), their query is converted into a vector using the exact same `Transformers.js` model.
3. **Similarity Search:** The backend computes the Cosine Similarity between the user's query vector and all document vectors, retrieving the top 5 most relevant legal text chunks.
4. **Generation:** The retrieved legal texts are injected into a strict system prompt alongside the user's question. 
5. **Structured Output:** Ollama processes the prompt and generates a strict JSON object mapping to the `LegalResponseSchema` (Assessment, Laws, Action Plan).

### LangGraph State Management
The system utilizes a directed graph (`StateGraph`) to handle the flow of the conversation:
*   **Categorization Node:** Evaluates if the input is a standard greeting or a legal query.
*   **Conditional Edges:** Routes greetings directly to a fast, generic LLM response. Routes legal queries to the RAG retrieval node.
*   **Retrieval Node:** Fetches documents.
*   **Generation Node:** Formats the final answer using the retrieved context.

### Security & Privacy
*   **Firestore Rules:** Strict backend rules ensure that users can only read and write messages belonging to their specific `userId`. 
*   **Local Inference:** Because Ollama and Transformers.js run locally, sensitive workplace complaints are never sent to third-party APIs like OpenAI or Google, ensuring maximum confidentiality for employees.

## 5. Conclusion
NyayaBot successfully demonstrates the integration of modern web technologies with advanced, localized generative AI. It bridges the gap between complex legal jargon and everyday employees, providing an accessible, highly responsive, and architecturally robust platform for workplace rights awareness.
