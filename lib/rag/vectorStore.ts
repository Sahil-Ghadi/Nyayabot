import { getEmbeddings } from "./embeddings";

interface EmbeddedDoc {
  pageContent: string;
  metadata: any;
  embedding: number[];
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  const length = Math.min(vecA.length, vecB.length);
  for (let i = 0; i < length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

class SimpleMemoryVectorStore {
  private documents: EmbeddedDoc[] = [];

  constructor() {}

  async addDocuments(docs: any[]) {
    const embeddingsService = getEmbeddings();
    const texts = docs.map(d => d.pageContent || d.text || "");
    const embeddings = await embeddingsService.embedDocuments(texts);
    for (let i = 0; i < docs.length; i++) {
      this.documents.push({
        pageContent: docs[i].pageContent || docs[i].text || "",
        metadata: docs[i].metadata || {},
        embedding: embeddings[i],
      });
    }
  }

  async similaritySearchWithScore(query: string, k: number = 5): Promise<Array<[any, number]>> {
    const embeddingsService = getEmbeddings();
    const queryEmbedding = await embeddingsService.embedQuery(query);

    const results: Array<[any, number]> = this.documents.map(doc => {
      const score = cosineSimilarity(queryEmbedding, doc.embedding);
      return [
        { pageContent: doc.pageContent, metadata: doc.metadata },
        score
      ];
    });

    results.sort((a, b) => b[1] - a[1]);
    return results.slice(0, k);
  }
}

let vectorStoreInstance: SimpleMemoryVectorStore | null = null;

export const getVectorStore = async () => {
  if (!vectorStoreInstance) {
    vectorStoreInstance = new SimpleMemoryVectorStore();
  }
  return vectorStoreInstance;
};

export const insertDocuments = async (docs: any[]) => {
  const store = await getVectorStore();
  await store.addDocuments(docs);
};

export const similaritySearch = async (query: string, k: number = 5) => {
  const store = await getVectorStore();
  const results = await store.similaritySearchWithScore(query, k);
  
  return results.map(([doc, score]) => ({
    content: doc.pageContent,
    source: doc.metadata?.source || "Unknown",
    page: doc.metadata?.loc?.pageNumber || "N/A",
    metadata: doc.metadata,
    relevanceScore: score,
  }));
};

