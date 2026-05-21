// POST /functions/v1/ingest-document
//
// Body: { certification_id, title, source_type, source_url?, content_md }
// Auth: Bearer JWT (must be platform_admin)
//
// Takes raw markdown content for a CertiProf source document, chunks it,
// embeds each chunk, and stores them. The chat-tutor function will only ever
// cite from chunks ingested through this endpoint.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";
import { embedBatch } from "../_shared/voyage.ts";
import { chunkText } from "../_shared/chunker.ts";

interface Body {
  certification_id: string;
  title: string;
  source_type: 'pdf' | 'markdown' | 'web' | 'video_transcript' | 'slide_deck';
  source_url?: string;
  content_md: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  try {
    const user_id = await authenticate(req);
    const body = await req.json() as Body;
    if (!body.certification_id || !body.title || !body.content_md) {
      throw new HttpError(400, 'certification_id, title, and content_md are required');
    }

    const svc = getServiceClient();

    // Gate: only platform admins can ingest source material.
    const { data: profile } = await svc
      .from('profiles')
      .select('platform_role')
      .eq('id', user_id)
      .single();
    if (profile?.platform_role !== 'platform_admin') {
      throw new HttpError(403, 'platform_admin role required');
    }

    // 1. Create the source_documents row.
    const { data: doc, error: docErr } = await svc
      .from('source_documents')
      .insert({
        certification_id: body.certification_id,
        title: body.title,
        source_type: body.source_type,
        source_url: body.source_url ?? null,
        content_md: body.content_md,
        uploaded_by: user_id,
      })
      .select('id')
      .single();
    if (docErr || !doc) throw new Error(`source_documents insert: ${docErr?.message}`);

    // 2. Chunk.
    const chunks = chunkText(body.content_md);
    if (chunks.length === 0) {
      return jsonResponse({ document_id: doc.id, chunks_created: 0 });
    }

    // 3. Embed in batches of 100 (Voyage allows up to 128 per call; 100 leaves headroom).
    const all_embeddings: number[][] = [];
    for (let i = 0; i < chunks.length; i += 100) {
      const batch = chunks.slice(i, i + 100);
      const embs = await embedBatch(batch.map(c => c.content), 'document');
      all_embeddings.push(...embs);
    }

    // 4. Heuristic section paths: pull the nearest markdown heading above each chunk.
    const lines = body.content_md.split('\n');
    const heading_at_offset = new Map<number, string>();
    let current_heading = '';
    let offset = 0;
    for (const line of lines) {
      const m = line.match(/^(#{1,4})\s+(.+)/);
      if (m) current_heading = m[2].trim();
      heading_at_offset.set(offset, current_heading);
      offset += line.length + 1;
    }
    const headingFor = (chunk_content: string): string | null => {
      const idx = body.content_md.indexOf(chunk_content.slice(0, 80));
      if (idx < 0) return null;
      // Walk back to find the most recent recorded heading.
      let best: string | null = null;
      for (const [pos, heading] of heading_at_offset) {
        if (pos <= idx) best = heading || best;
      }
      return best;
    };

    // 5. Insert chunk rows.
    const rows = chunks.map((c, i) => ({
      document_id: doc.id,
      certification_id: body.certification_id,
      chunk_index: c.index,
      content: c.content,
      token_count: c.token_count,
      section_path: headingFor(c.content),
      embedding: all_embeddings[i],
    }));
    // Supabase's PostgREST handles vector columns as JSON arrays — works directly.
    const { error: insErr } = await svc.from('document_chunks').insert(rows);
    if (insErr) throw new Error(`document_chunks insert: ${insErr.message}`);

    // 6. Update source_documents totals.
    const total_tokens = chunks.reduce((s, c) => s + c.token_count, 0);
    await svc.from('source_documents').update({
      total_chunks: chunks.length,
      total_tokens,
    }).eq('id', doc.id);

    return jsonResponse({
      document_id: doc.id,
      chunks_created: chunks.length,
      total_tokens,
    });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
