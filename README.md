# ⚖️ NyayaBot — AI-Powered Employee Rights Awareness Platform

**NyayaBot** is an AI-powered legal assistant built for Indian employees across the corporate and private sector. It allows users to describe workplace issues in plain, natural language and receive structured, law-grounded legal guidance — complete with applicable statutes, a step-by-step action plan, evidence checklists, and statutory deadlines.

The platform uses a fully local **Retrieval-Augmented Generation (RAG)** pipeline orchestrated through **LangGraph**, ensuring that every response is grounded in actual Indian employment legislation rather than relying on the LLM's pre-trained memory alone.

---

## 📋 Table of Contents

- [Sector & Legal Coverage](#-sector--legal-coverage)
- [Structured Output Format](#-structured-output-format)
- [Core Features](#-core-features)
- [Technology Stack](#-technology-stack)
- [Architecture & Pipeline](#-architecture--pipeline)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Security & Privacy](#-security--privacy)

---

## 🏛️ Sector & Legal Coverage

### Target Sector
NyayaBot is designed for employees in the **Indian corporate and private sector**, covering workplace issues across industries — IT/BPO, manufacturing, services, startups, and more.

### Acts & Codes in the Knowledge Base

NyayaBot's RAG vector store is pre-loaded with the full text of the following **5 key Indian labour legislations**:

| # | Act / Code | Year | Key Coverage |
|---|-----------|------|-------------|
| 1 | **The Code on Wages** | 2019 | Minimum wages, overtime, salary deductions, bonus entitlements, equal remuneration |
| 2 | **The Industrial Relations Code** | 2020 | Wrongful termination, retrenchment, layoffs, strikes & lockouts, industrial disputes, standing orders |
| 3 | **The Code on Social Security** | 2020 | Provident Fund (PF/EPFO), ESI, gratuity, maternity benefits, pension, employee compensation |
| 4 | **Occupational Safety, Health and Working Conditions Code (OSHWC)** | 2020 | Working hours, leave rights (sick/casual/earned leave), workplace safety, inter-state migrant workers |
| 5 | **The Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act (POSH)** | 2013 | Workplace sexual harassment, Internal Complaints Committee (ICC), complaint procedures |

Additionally, admins can upload new legal PDFs at runtime through the Admin Panel, which are automatically parsed, chunked, embedded, and injected into the vector store.

### Issue Categories Handled

The system classifies user queries into the following categories using regex pattern matching with LLM fallback:

- **SALARY_DISPUTE** — Wages, overtime, underpayment, arrears, bonus
- **WRONGFUL_TERMINATION** — Dismissal, retrenchment, layoff, forced retirement
- **POSH** — Sexual harassment, hostile work environment, misconduct
- **LEAVE_DENIAL** — Sick leave, casual leave, earned leave, maternity/paternity leave
- **STATUTORY_BENEFITS** — PF, ESI, ESIC, gratuity, pension
- **CONTRACT_DISPUTE** — Employment bonds, notice period, NDA, non-compete clauses

---

## 📤 Structured Output Format

When a user submits a legal query, NyayaBot does **not** return a plain text wall of advice. Instead, the response is generated in **4 distinct, structured sections** streamed to the UI in real-time:

### 1. 🔍 Legal Assessment
> A concise 1–2 sentence summary of the user's legal position.

_Example: "Your employer's unilateral salary deduction without prior notice constitutes a violation of Section 18 of The Code on Wages, 2019. You have legal recourse."_

### 2. 📜 Applicable Laws (Sidebar Panel)
> 1–3 most directly relevant laws with exact **section numbers** and a plain-English explanation of how each law protects the user in their specific scenario.

Each law entry includes:
- **Act/Code name** (e.g., _The Code on Wages, 2019_)
- **Section number** (e.g., _Section 18_)
- **Plain-English meaning** connecting the law to the user's situation

### 3. 📝 Recommended Action Plan
> A step-by-step plan of **4–7 concrete actions** the user should take, each naming the **exact authority or office** to approach.

Each step contains:
- **Step title** (e.g., _"File Written Complaint"_)
- **Action description** (e.g., _"Submit a formal written complaint to the Inspector-cum-Facilitator under your District Labour Office within 30 days."_)

### 4. 📂 Evidence to Collect
> A checklist of **2–4 personal documents** the user should gather to support their case.

Each item includes:
- **Document name** (e.g., _"Salary slips for last 6 months"_)
- **Reason** (e.g., _"Proves discrepancy in payment"_)

### Follow-Up Conversations
After the initial structured analysis, users can ask follow-up questions within the same chat session. Follow-ups are answered in conversational **Markdown format** using the same retrieved legal context, avoiding redundant structured output.

---

## ✨ Core Features

- **Conversational Legal Assistant** — Chat interface with real-time SSE streaming showing each pipeline stage (classifying → retrieving → assessing → planning)
- **Intelligent Issue Routing (LangGraph)** — Greetings and non-legal queries bypass the heavy RAG pipeline; vague queries are met with clarification prompts; legal queries trigger the full multi-stage analysis
- **Multi-Label Classification** — A single query can match multiple categories (e.g., salary dispute + wrongful termination), with all relevant authorities surfaced
- **100% Local RAG Pipeline** — Document embeddings (`all-MiniLM-L6-v2`) and LLM inference (`qwen2.5:3b` via Ollama) run entirely on the local machine — zero API costs, zero data leakage
- **Dynamic Admin Panel** — Upload raw PDF legal documents at runtime; they are automatically parsed, chunked (1000 chars with 200 char overlap), embedded, and added to the vector store
- **Persistent Case History** — Firebase Auth + Firestore integration lets users resume past consultations, track active vs. resolved cases, and manage their legal matters from a dashboard
- **Switchable LLM Backend** — Toggle between local Ollama (`qwen2.5:3b`) and cloud Gemini (`gemini-2.5-flash`) with a single variable change

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **Next.js 16** (App Router, Turbopack) | Full-stack React framework |
| **React 19** | UI component library |
| **TailwindCSS 4** | Custom dark-mode design system with glassmorphism, gold accents, and blur effects |
| **Framer Motion** | Page transitions and micro-animations |
| **Lucide React** | Icon system |
| **React Markdown** | Rendering assistant responses with rich formatting |

### Backend & AI
| Technology | Purpose |
|-----------|---------|
| **Next.js API Routes** | Serverless backend endpoints (`/api/chat`, `/api/admin/upload`, etc.) |
| **LangChain** | LLM abstraction, prompt management, structured output with Zod schemas |
| **LangGraph** | Directed state graph orchestrating the multi-stage conversation pipeline |
| **Ollama** (`qwen2.5:3b`) | Local LLM for reasoning, classification, and structured JSON generation |
| **Google Gemini** (`gemini-2.5-flash`) | Optional cloud LLM alternative |
| **Transformers.js** (`@xenova/transformers`) | Local embedding model (`all-MiniLM-L6-v2`) running in Node.js |
| **Zod** | Runtime schema validation for structured LLM outputs |

### RAG Pipeline
| Technology | Purpose |
|-----------|---------|
| **Custom `SimpleMemoryVectorStore`** | In-memory vector store with disk persistence (`precomputed-embeddings.json`) |
| **Cosine Similarity** | Custom implementation for semantic search over document embeddings |
| **`@langchain/textsplitters`** | Recursive character text splitting (1000 char chunks, 200 char overlap) |
| **`@langchain/community` PDF Loader** | PDF text extraction for admin uploads |

### Database & Auth
| Technology | Purpose |
|-----------|---------|
| **Firebase Authentication** | Google Sign-In for user identity |
| **Cloud Firestore** | NoSQL storage for user profiles, chat sessions, and message history |
| **Firestore Security Rules** | Row-level security ensuring users only access their own data |

### Observability
| Technology | Purpose |
|-----------|---------|
| **LangSmith** | Tracing and monitoring for LangGraph pipeline execution |

---

## 🏗️ Architecture & Pipeline

### LangGraph State Machine

The conversation flows through a directed acyclic graph with conditional routing:

```
┌─────────────┐
│   __start__ │
└──────┬──────┘
       │
       ▼
┌──────────────┐
│validateInput │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ classifyIssue│──── GREETING / NON_LEGAL / VAGUE ──→ generateConversationalResponse → __end__
└──────┬───────┘
       │ (Legal Query)
       ▼
┌──────────────────┐
│ retrieveDocuments │  ← Semantic search (top-5 chunks via cosine similarity)
└──────┬───────────┘
       │
       ▼
┌──────────────┐
│ buildContext │──── Has prior structured analysis? ──→ generateFollowUpResponse → __end__
└──────┬───────┘
       │ (First query)
       ▼
┌───────────────────┐
│ generateAssessment│  ← Zod-validated structured JSON
└──────┬────────────┘
       │
       ▼
┌──────────────┐
│ generateLaws │  ← 1–3 laws with section numbers & plain-English meaning
└──────┬───────┘
       │
       ▼
┌────────────────────┐
│ generateActionPlan │  ← 4–7 steps + evidence checklist + statutory deadlines
└──────┬─────────────┘
       │
       ▼
   __end__
```

### RAG (Retrieval-Augmented Generation) Flow

1. **Ingestion** — Legal PDFs are loaded, split into 1000-character overlapping chunks, and each chunk is embedded into a 384-dimensional vector using `all-MiniLM-L6-v2`
2. **Persistence** — All embeddings are serialized to `precomputed-embeddings.json` (~16 MB for 5 acts)
3. **Query** — User input is embedded using the same model, then cosine similarity identifies the top-5 most relevant chunks
4. **Context Assembly** — Retrieved chunks are formatted with source attribution and injected into the LLM prompt
5. **Structured Generation** — The LLM generates strict JSON conforming to Zod schemas (Assessment → Laws → Action Plan + Evidence + Deadlines)
6. **Streaming** — Results are streamed to the client via SSE (Server-Sent Events), with the UI updating progressively as each pipeline node completes

---

## 📁 Project Structure

```
nyayabot/
├── app/
│   ├── page.tsx                    # Landing page with Google Sign-In
│   ├── layout.tsx                  # Root layout with AuthProvider
│   ├── globals.css                 # Design system (TailwindCSS 4)
│   ├── (app)/                      # Authenticated route group
│   │   ├── layout.tsx              # App shell (SideNav + TopNav)
│   │   ├── dashboard/page.tsx      # User dashboard with stats & recent chats
│   │   ├── consultation/page.tsx   # Main chat interface with streaming UI
│   │   ├── history/page.tsx        # Full consultation history
│   │   ├── library/page.tsx        # Legal knowledge base browser
│   │   ├── admin/page.tsx          # PDF upload & vectorization panel
│   │   └── profile/page.tsx        # User profile
│   └── api/
│       ├── chat/route.ts           # SSE streaming chat endpoint
│       ├── admin/upload/route.ts   # PDF ingestion & vectorization
│       ├── library/docs/route.ts   # Uploaded documents API
│       └── documents/              # Document management APIs
├── lib/
│   ├── firebase.ts                 # Firebase app initialization
│   ├── firestore.ts                # Firestore CRUD helpers
│   ├── llm.ts                      # LLM provider (Ollama / Gemini toggle)
│   ├── langgraph.ts                # Full LangGraph state machine
│   └── rag/
│       ├── embeddings.ts           # Transformers.js embedding wrapper
│       ├── vectorStore.ts          # Custom vector store with cosine similarity
│       ├── chunkDocs.ts            # Document chunking utilities
│       └── precomputed-embeddings.json  # Serialized vector store (~16 MB)
├── contexts/
│   └── AuthContext.tsx             # Firebase Auth React context
├── components/                     # SideNav, TopNav, shared UI
├── docs/                           # Source legal PDFs (5 acts)
├── scripts/
│   └── seed-embeddings.ts          # One-time script to pre-embed legal PDFs
└── firestore.rules                 # Firestore security rules
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **Ollama** installed and running locally with `qwen2.5:3b` pulled
- **Firebase project** with Auth and Firestore enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/nyayabot.git
cd nyayabot

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your Firebase config and API keys

# (Optional) Seed embeddings from source PDFs
npx tsx scripts/seed-embeddings.ts

# Start the development server
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
GEMINI_API_KEY=              # Optional, only if using Gemini provider
LANGSMITH_API_KEY=           # Optional, for pipeline tracing
```

---

## 🔒 Security & Privacy

- **Firestore Rules** — Row-level security ensures users can only access their own profile, chats, and messages. All other documents are denied by default.
- **Local Inference** — When using Ollama, all LLM inference and embedding computation happens on the local machine. Sensitive workplace complaints are **never** sent to third-party APIs, ensuring maximum confidentiality.
- **Admin Authentication** — The document upload endpoint is protected by a server-side admin key, preventing unauthorized knowledge base modifications.

---

## 💬 Sample Questions

Try these queries to test each act in the knowledge base:

### The Code on Wages, 2019
- _"My employer has been deducting 20% of my salary every month without any written explanation. Is this legal under the Code on Wages?"_
- _"I work 12-hour shifts regularly but my company refuses to pay overtime. What does the law say?"_
- _"My company pays male and female employees different salaries for the same job role. Is this allowed?"_

### The Industrial Relations Code, 2020
- _"I was terminated without any prior notice after working at the company for 5 years. What legal options do I have?"_
- _"My company laid off 150 employees without government approval. Is this a valid retrenchment?"_
- _"My employer changed the conditions of service without giving 21 days' notice. Can I challenge this?"_

### The Code on Social Security, 2020
- _"My employer hasn't deposited my PF contributions for 6 months even though it's deducted from my salary. What can I do?"_
- _"I'm pregnant and my employer says I'm only eligible for 12 weeks of maternity leave. Isn't it supposed to be 26 weeks?"_
- _"I've completed 7 years at my company and I'm resigning. Am I entitled to gratuity?"_

### Occupational Safety, Health and Working Conditions Code (OSHWC), 2020
- _"My company rejected my sick leave application even though I submitted a valid medical certificate. Can they do that?"_
- _"I'm being forced to work more than 48 hours a week with no weekly off. What are my rights?"_
- _"My employer doesn't provide basic safety equipment at the factory. Where can I report this?"_

### Sexual Harassment of Women at Workplace (POSH) Act, 2013
- _"My manager has been making repeated inappropriate comments and sending unwanted messages after office hours. How do I file a POSH complaint?"_
- _"I reported sexual harassment to HR 2 months ago but the ICC hasn't been constituted. What should I do?"_
- _"My company has only 8 employees and no Internal Complaints Committee. Who do I complain to?"_

---

## 📄 License

This project is part of an academic submission and is not licensed for commercial use.
