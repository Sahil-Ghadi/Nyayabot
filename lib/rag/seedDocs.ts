import fs from "fs";
import path from "path";
import { insertDocuments } from "./vectorStore";

const pdfParse = require("pdf-parse-fork");

let seeded = false;

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

export const seedLegalDocs = async () => {
  if (seeded) return;

  const docsDir = path.join(process.cwd(), "docs");
  const files = fs.readdirSync(docsDir).filter(f => f.endsWith(".pdf"));

  let totalChunks = 0;

  for (const file of files) {
    try {
      const buffer = fs.readFileSync(path.join(docsDir, file));
      const data = await pdfParse(buffer);
      const chunks = parseChunks(data.text, file);

      if (chunks.length > 0) {
        await insertDocuments(chunks);
        totalChunks += chunks.length;
        console.log(`✅ ${file}: ${chunks.length} chunks loaded`);
      } else {
        console.log(`⚠️ ${file}: no chunks found`);
      }
    } catch (err: any) {
      console.error(`❌ ${file}: failed to load — ${err.message}`);
      // skip this file, continue with the rest
    }
  }

  seeded = true;
  console.log(`✅ Total: ${totalChunks} chunks seeded`);
};