// RAG retrieval helper.
//
// Given a query, returns the top-K chunks most similar to it, filtered to
// the specified certification. Used by the chat-tutor Edge Function.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { embedText } from './voyage.ts';
import type { RetrievedChunk } from './prompts.ts';

export interface RetrievalOptions {
  match_count?: number;       // default 8
  match_threshold?: number;   // default 0.5 — cosine similarity floor
}

/**
 * Embed the query, search the chunk index, return the top-K with citation
 * indices assigned. Citation index is 1-based so the prompt template reads
 * [source 1], [source 2], ... naturally.
 */
export async function retrieveContext(
  svc: SupabaseClient,
  query: string,
  certification_id: string,
  opts: RetrievalOptions = {},
): Promise<RetrievedChunk[]> {
  const query_embedding = await embedText(query, 'query');

  const { data, error } = await svc.rpc('match_document_chunks', {
    query_embedding,
    filter_certification_id: certification_id,
    match_count: opts.match_count ?? 8,
    match_threshold: opts.match_threshold ?? 0.5,
  });

  if (error) throw new Error(`match_document_chunks: ${error.message}`);
  if (!data) return [];

  return (data as Array<any>).map((row, i) => ({
    index: i + 1,
    document_title: row.document_title,
    section_path: row.section_path,
    content: row.content,
    similarity: row.similarity,
    chunk_id: row.chunk_id,
    document_id: row.document_id,
  }));
}

/**
 * Extract citation references from an assistant message body. Looks for
 * [source N] or [source N, M] patterns and returns the set of indices used.
 * Lets us store citation metadata separately from the text.
 */
export function extractCitationIndices(text: string): number[] {
  const indices = new Set<number>();
  const re = /\[source\s+([\d,\s]+)\]/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    for (const part of m[1].split(',')) {
      const n = parseInt(part.trim(), 10);
      if (!isNaN(n)) indices.add(n);
    }
  }
  return [...indices].sort((a, b) => a - b);
}
