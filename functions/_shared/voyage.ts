// Voyage AI embedding client.
//
// Voyage is Anthropic's recommended embedding provider. We use voyage-3
// (1024 dims) — good quality at low cost. Switch to voyage-3-large if you
// want top retrieval quality and don't mind 3x the cost.
//
// API docs: https://docs.voyageai.com/reference/embeddings-api
// Get a key at: https://dash.voyageai.com/api-keys

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';
const DEFAULT_MODEL = 'voyage-3';

export type InputType = 'document' | 'query';

interface VoyageResponse {
  data: Array<{ embedding: number[]; index: number }>;
  usage: { total_tokens: number };
}

/**
 * Embed a single text. Use input_type='query' for search queries and
 * 'document' for content being indexed. Voyage's asymmetric encoder
 * gives noticeably better retrieval when you label them correctly.
 */
export async function embedText(
  text: string,
  input_type: InputType = 'document',
): Promise<number[]> {
  const embeddings = await embedBatch([text], input_type);
  return embeddings[0];
}

/**
 * Embed up to 128 texts per call. Voyage charges per token, so batching is
 * cheaper than one-at-a-time. Returns embeddings in the same order as input.
 */
export async function embedBatch(
  texts: string[],
  input_type: InputType = 'document',
  model = DEFAULT_MODEL,
): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (texts.length > 128) throw new Error('Voyage allows max 128 inputs per call');

  const apiKey = Deno.env.get('VOYAGE_API_KEY');
  if (!apiKey) throw new Error('VOYAGE_API_KEY not configured');

  const res = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: texts,
      input_type,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Voyage API ${res.status}: ${body}`);
  }

  const data = await res.json() as VoyageResponse;
  // Re-sort by index just in case (API should preserve order but be safe).
  return data.data.sort((a, b) => a.index - b.index).map(d => d.embedding);
}
