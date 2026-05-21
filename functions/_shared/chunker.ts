// Recursive character splitter.
//
// Splits text on the most natural boundaries first (paragraph → line →
// sentence → word) so chunks don't break mid-thought. Adds a configurable
// overlap so concepts spanning a chunk boundary survive retrieval.
//
// Token counts are approximated as length/4 (good enough for English/Spanish/
// Portuguese; for languages with denser scripts you'd want a real tokenizer).

export interface ChunkOptions {
  chunk_size?: number;     // target chars per chunk (default 2500 ~= 600 tokens)
  chunk_overlap?: number;  // overlap chars between adjacent chunks
  separators?: string[];   // tried in order
}

const DEFAULT_OPTS: Required<ChunkOptions> = {
  chunk_size: 2500,
  chunk_overlap: 400,
  separators: ['\n\n', '\n', '. ', '? ', '! ', '; ', ', ', ' '],
};

export interface Chunk {
  index: number;
  content: string;
  token_count: number;
}

export function chunkText(text: string, opts: ChunkOptions = {}): Chunk[] {
  const o = { ...DEFAULT_OPTS, ...opts };
  const raw = recursiveSplit(text.trim(), o);
  const merged = mergeAndOverlap(raw, o);
  return merged.map((content, i) => ({
    index: i,
    content,
    token_count: Math.ceil(content.length / 4),
  }));
}

function recursiveSplit(text: string, o: Required<ChunkOptions>): string[] {
  if (text.length <= o.chunk_size) return [text];

  // Find the largest-grain separator that actually splits this text into
  // pieces small enough to handle.
  for (const sep of o.separators) {
    if (!text.includes(sep)) continue;
    const parts = text.split(sep);
    if (parts.every(p => p.length <= o.chunk_size)) {
      // re-attach the separator to all but the last part
      return parts.map((p, i) => (i < parts.length - 1 ? p + sep : p)).filter(p => p.length > 0);
    }
    // some piece is still too big — recurse into each piece
    const result: string[] = [];
    for (const part of parts) {
      const reattached = part + (parts.indexOf(part) < parts.length - 1 ? sep : '');
      if (reattached.length <= o.chunk_size) result.push(reattached);
      else result.push(...recursiveSplit(reattached, o));
    }
    return result.filter(p => p.length > 0);
  }

  // No separator works — hard-split on chunk_size as a last resort.
  const result: string[] = [];
  for (let i = 0; i < text.length; i += o.chunk_size) {
    result.push(text.slice(i, i + o.chunk_size));
  }
  return result;
}

function mergeAndOverlap(parts: string[], o: Required<ChunkOptions>): string[] {
  const result: string[] = [];
  let current = '';
  for (const part of parts) {
    if (current.length + part.length <= o.chunk_size) {
      current += part;
    } else {
      if (current.length > 0) result.push(current);
      // Start the next chunk with the tail of the current one for overlap.
      const overlap = current.slice(Math.max(0, current.length - o.chunk_overlap));
      current = overlap + part;
    }
  }
  if (current.length > 0) result.push(current);
  return result;
}
