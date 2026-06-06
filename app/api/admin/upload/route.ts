import { NextResponse } from 'next/server';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { insertDocuments } from '@/lib/rag/vectorStore';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string || file.name.replace('.pdf', '');
    const desc = formData.get('desc') as string || 'Uploaded document';
    const adminKey = formData.get('adminKey') as string;

    if (adminKey !== 'nyayabot-admin-2026') {
      return NextResponse.json({ error: 'Unauthorized: Invalid Admin Key provided.' }, { status: 401 });
    }
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 1. Extract text using Langchain's PDFLoader
    const { PDFLoader } = await import("@langchain/community/document_loaders/fs/pdf");
    const loader = new PDFLoader(file);
    const loadedDocs = await loader.load();
    const textContent = loadedDocs.map(doc => doc.pageContent).join("\n\n");

    if (!textContent || textContent.trim() === '') {
      return NextResponse.json({ error: 'Could not extract text from PDF' }, { status: 400 });
    }

    // 2. Chunk the text
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    const chunks = await splitter.createDocuments([textContent]);
    
    // 3. Add metadata to chunks
    const sourceName = file.name;
    const docsToEmbed = chunks.map((chunk, i) => ({
      pageContent: chunk.pageContent,
      metadata: {
        source: sourceName,
        title: title,
        loc: { pageNumber: Math.floor(i / 3) + 1 } // Rough approximation
      }
    }));

    // 4. Insert into vector store
    await insertDocuments(docsToEmbed);

    // 5. Update uploaded-documents registry
    const registryPath = path.join(process.cwd(), 'lib/rag/uploaded-documents.json');
    let registry: any[] = [];
    if (fs.existsSync(registryPath)) {
      registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
    }
    
    // Check if already exists to avoid duplicates
    if (!registry.find(r => r.source === sourceName)) {
      registry.push({
        id: Date.now().toString(),
        source: sourceName,
        title: title,
        desc: desc,
        uploadDate: new Date().toISOString()
      });
      fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
    }

    return NextResponse.json({ success: true, message: 'Document processed and vectorized successfully!' });
  } catch (error: any) {
    console.error('Error processing PDF upload:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
