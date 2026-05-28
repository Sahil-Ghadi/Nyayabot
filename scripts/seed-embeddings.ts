import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { getEmbeddings } from "../lib/rag/embeddings";
const pdfParse = require("pdf-parse-fork");

// Load .env so Gemini API key is available
dotenv.config();

const parseChunks = (text: string, filename: string) => {
  const chunks: any[] = [];
  const chunkRegex = /=== CHUNK \d+ START ===([\s\S]*?)=== CHUNK \d+ END ===/g;
  let match;

  while ((match = chunkRegex.exec(text)) !== null) {
    const chunkText = match[1].trim();
    const titleMatch = chunkText.match(/Title:\s*(.+)/);
    const keywordsMatch = chunkText.match(/Keywords:\s*(.+)/);

    chunks.push({
      pageContent: chunkText,
      metadata: {
        source: filename,
        title: titleMatch?.[1]?.trim() || "",
        keywords: keywordsMatch?.[1]?.trim() || "",
      }
    });
  }
  return chunks;
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
      const chunks = parseChunks(data.text, file);

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
