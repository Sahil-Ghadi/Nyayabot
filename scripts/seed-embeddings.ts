import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { getEmbeddings } from "../lib/rag/embeddings";
const pdfParse = require("pdf-parse-fork");

// Load .env so Gemini API key is available
dotenv.config();

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// Cleans common noise from India Code PDFs
const cleanIndiaCodeText = (text: string): string => {
  let cleaned = text;

  // 1. Remove Table of Contents (often labelled ARRANGEMENT OF SECTIONS)
  const tocRegex = /ARRANGEMENT OF SECTIONS[\s\S]*?(?=CHAPTER I\b|THE [A-Z ]+ ACT)/i;
  cleaned = cleaned.replace(tocRegex, "");

  // 2. Remove typical official gazette headers/footers
  cleaned = cleaned.replace(/THE GAZETTE OF INDIA EXTRAORDINARY/ig, "");
  cleaned = cleaned.replace(/\[PART II—SEC\. \d\(i\)\]/ig, "");
  
  // 3. Remove legislative footnotes (e.g., "1. Ins. by Act 20 of 1983...")
  const footnoteRegex = /^\s*\d+\.\s*(Ins\.|Subs\.|Omitted|Added)[^\n]+/gm;
  cleaned = cleaned.replace(footnoteRegex, "");

  // 4. Normalize spacing
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

  return cleaned;
};

const parseChunks = async (text: string, filename: string) => {
  const cleanedText = cleanIndiaCodeText(text);

  // Use LangChain's intelligent text splitter to automatically chunk any raw PDF
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await splitter.createDocuments([cleanedText]);
  
  // Format the output to match what the embeddings script expects
  return docs.map(doc => ({
    pageContent: doc.pageContent,
    metadata: {
      source: filename,
      title: filename.replace(".pdf", ""), // Default title to filename
      keywords: "",
    }
  }));
};

const run = async () => {
  console.log("Starting embedding generation...");
  const docsDir = path.join(process.cwd(), "docs");
  
  if (!fs.existsSync(docsDir)) {
    console.error("docs directory not found.");
    return;
  }
  
  const files = fs.readdirSync(docsDir).filter(f => f.endsWith(".pdf"));
  const allDocs: any[] = [];

  for (const file of files) {
    try {
      const buffer = fs.readFileSync(path.join(docsDir, file));
      const data = await pdfParse(buffer);
      const chunks = await parseChunks(data.text, file);

      if (chunks.length > 0) {
        allDocs.push(...chunks);
        console.log(`✅ ${file}: ${chunks.length} chunks extracted`);
      } else {
        console.log(`⚠️ ${file}: no chunks found (check PDF formatting)`);
      }
    } catch (err: any) {
      console.error(`❌ ${file}: failed to read/parse — ${err.message}`);
    }
  }

  if (allDocs.length === 0) {
    console.log("No chunks found to embed.");
    return;
  }

  console.log(`Generating embeddings for ${allDocs.length} total chunks...`);
  const embeddingsService = getEmbeddings();
  const texts = allDocs.map(d => d.pageContent);
  
  // Create embeddings
  const embeddings = await embeddingsService.embedDocuments(texts);
  
  const finalData = allDocs.map((doc, idx) => ({
    pageContent: doc.pageContent,
    metadata: doc.metadata,
    embedding: embeddings[idx]
  }));

  const outPath = path.join(process.cwd(), "lib/rag/precomputed-embeddings.json");
  fs.writeFileSync(outPath, JSON.stringify(finalData, null, 2));
  
  console.log(`✅ Successfully saved ${finalData.length} embeddings to ${outPath}`);
};

run().catch(console.error);
