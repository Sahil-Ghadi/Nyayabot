import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";

export const chunkDocument = async (text: string, filename: string) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 150,
  });

  const docs = await splitter.createDocuments([text], [{ source: filename }]);
  return docs;
};

