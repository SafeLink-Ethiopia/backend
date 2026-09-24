import { VoyageAIClient } from "voyageai";

const voyage = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY,
});

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!texts.length) {
    return [];
  }

  const response = await voyage.embed({
    input: texts,
    model: "voyage-3.5",
    inputType: "document",
  });

  const embeddings = response.data?.map((item) => item.embedding);

  if (!embeddings || embeddings.length !== texts.length) {
    throw new Error("Voyage AI did not return embeddings for all chunks.");
  }

  return embeddings;
}
