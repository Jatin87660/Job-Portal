import { pipeline } from "@xenova/transformers";

let embedder;

export async function generateEmbedding(text) {
  if (!embedder) {
    console.log("Loading embedding model...");
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }

  const output = await embedder(text);

  // output.data can be nested: [ [ [ ... ] ] ] or [ [ ... ] ]
  // Flatten carefully:
  let embedding;
  if (Array.isArray(output.data[0][0])) {
    // If 3D, flatten 2 levels
    embedding = output.data[0].flat(2);
  } else if (Array.isArray(output.data[0])) {
    // If 2D, flatten 1 level
    embedding = output.data[0].flat();
  } else {
    embedding = output.data[0]; // Already flat
  }

  return embedding;
}

export function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (magA * magB);
}
