import { Embeddings } from "@langchain/core/embeddings";
import { pipeline } from "@xenova/transformers";

export class XenovaEmbeddings extends Embeddings {
  private pipelinePromise: Promise<any>;

  constructor() {
    super({});
    this.pipelinePromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const extractor = await this.pipelinePromise;
    const results: number[][] = [];
    for (const text of texts) {
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      results.push(Array.from(output.data) as number[]);
    }
    return results;
  }

  async embedQuery(text: string): Promise<number[]> {
    const extractor = await this.pipelinePromise;
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data) as number[];
  }
}

let embeddingsInstance: XenovaEmbeddings | null = null;

export const getEmbeddings = () => {
  if (!embeddingsInstance) {
    embeddingsInstance = new XenovaEmbeddings();
  }
  return embeddingsInstance;
};

