// POST /functions/v1/chat-tutor
//
// Body: { session_id?: string, certification_id, message, language?, lesson_context? }
// Auth: Bearer JWT
//
// Streams the tutor's response back as Server-Sent Events. The full assistant
// message is also persisted to chat_messages when the stream completes.
//
// `lesson_context` (optional): a short human-readable string naming what the
// learner is currently studying, e.g. "Lesson: The Agile Manifesto — section:
// The Twelve Principles". When present it is surfaced to Claude as a
// <lesson_context> block so answers can be grounded to the learner's current
// place in the course. It does NOT change retrieval — the grounding rules and
// citations still come only from <reference_material>.
//
// SSE event types sent to the client:
//   - event: "start"      data: { session_id, citations: RetrievedChunk[] }
//   - event: "token"      data: { text }
//   - event: "done"       data: { message_id, full_text, citation_indices }
//   - event: "error"      data: { message }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";
import { retrieveContext, extractCitationIndices } from "../_shared/rag.ts";
import { tutorSystemPrompt, formatReferenceMaterial, Language } from "../_shared/prompts.ts";

interface Body {
  session_id?: string;
  certification_id: string;
  message: string;
  language?: Language;
  lesson_context?: string;
}

const CLAUDE_MODEL = 'claude-sonnet-4-6';
const MAX_HISTORY = 12; // keep last 12 messages (6 turns) for context

// A lesson_context string is a short label, not free content. Cap it
// defensively so a malformed caller can't stuff the prompt.
const MAX_LESSON_CONTEXT_CHARS = 300;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const user_id = await authenticate(req);
    const body = await req.json() as Body;
    if (!body.certification_id || !body.message) {
      throw new HttpError(400, 'certification_id and message required');
    }

    const svc = getServiceClient();
    const language: Language = body.language ?? 'en';

    // Optional lesson context — trimmed and length-capped.
    const lesson_context =
      typeof body.lesson_context === 'string'
        ? body.lesson_context.trim().slice(0, MAX_LESSON_CONTEXT_CHARS)
        : '';

    // 1. Resolve or create the chat session.
    let session_id = body.session_id;
    if (!session_id) {
      const { data: session, error: sErr } = await svc
        .from('chat_sessions')
        .insert({
          user_id,
          certification_id: body.certification_id,
          language,
          title: body.message.slice(0, 80),
        })
        .select('id')
        .single();
      if (sErr || !session) throw new Error(`chat_sessions insert: ${sErr?.message}`);
      session_id = session.id;
    }

    // 2. Save the user message immediately.
    await svc.from('chat_messages').insert({
      session_id,
      user_id,
      role: 'user',
      content: body.message,
    });

    // 3. Load cert metadata for the system prompt.
    const { data: cert } = await svc
      .from('certifications')
      .select('code, name')
      .eq('id', body.certification_id)
      .single();
    if (!cert) throw new HttpError(404, 'certification not found');

    // 4. Retrieve relevant chunks via pgvector.
    const chunks = await retrieveContext(svc, body.message, body.certification_id, {
      match_count: 8,
      match_threshold: 0.4,
    });

    // 5. Load conversation history.
    const { data: history } = await svc
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: false })
      .limit(MAX_HISTORY + 1); // +1 because we just inserted the user msg
    const history_messages = (history ?? []).reverse().slice(0, -1); // drop the just-inserted user msg; we'll add it explicitly

    // 6. Build Claude request.
    const system_prompt = tutorSystemPrompt({
      cert_name: cert.name,
      cert_code: cert.code,
      language,
    });

    const reference_block = formatReferenceMaterial(chunks);

    // When the learner is inside a lesson, tell Claude where they are. This
    // block is advisory — it helps the tutor pitch the answer at the right
    // topic — but it is NOT a source of facts. Grounding/citations still come
    // only from <reference_material>.
    const lesson_context_block = lesson_context
      ? `<lesson_context>\nThe learner is currently studying: ${lesson_context}\n` +
        `Favor this topic when the question is ambiguous, and pitch the answer ` +
        `at the part of the course they are on. Still answer only from ` +
        `<reference_material>; do not treat this line as a citable source.\n` +
        `</lesson_context>\n\n`
      : '';

    const user_message_with_context =
      `${lesson_context_block}${reference_block}\n\n` +
      `<user_question>\n${body.message}\n</user_question>`;

    const claude_messages = [
      ...history_messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: user_message_with_context },
    ];

    // 7. Start the SSE stream.
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        // Surface citation metadata to the client BEFORE the tokens start
        // arriving, so the UI can render the source list immediately.
        send('start', {
          session_id,
          citations: chunks.map(c => ({
            index: c.index,
            document_title: c.document_title,
            section_path: c.section_path,
            similarity: c.similarity,
            preview: c.content.slice(0, 200),
          })),
        });

        let full_text = '';
        let input_tokens = 0;
        let output_tokens = 0;

        try {
          const upstream = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: CLAUDE_MODEL,
              max_tokens: 2048,
              temperature: 0.3,
              system: system_prompt,
              messages: claude_messages,
              stream: true,
            }),
          });

          if (!upstream.ok || !upstream.body) {
            const err_body = await upstream.text();
            send('error', { message: `Anthropic ${upstream.status}: ${err_body}` });
            controller.close();
            return;
          }

          // Parse Anthropic SSE stream and re-emit normalized tokens.
          const reader = upstream.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE events from the buffer.
            const events = buffer.split('\n\n');
            buffer = events.pop() ?? ''; // last entry may be incomplete

            for (const raw_event of events) {
              const data_line = raw_event.split('\n').find(l => l.startsWith('data: '));
              if (!data_line) continue;
              const payload = data_line.slice(6);
              if (payload === '[DONE]') continue;
              try {
                const evt = JSON.parse(payload);
                if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
                  const text = evt.delta.text as string;
                  full_text += text;
                  send('token', { text });
                } else if (evt.type === 'message_delta' && evt.usage) {
                  output_tokens = evt.usage.output_tokens ?? output_tokens;
                } else if (evt.type === 'message_start' && evt.message?.usage) {
                  input_tokens = evt.message.usage.input_tokens ?? input_tokens;
                }
              } catch {
                // ignore malformed event lines
              }
            }
          }

          // 8. Persist the assistant message.
          const citation_indices = extractCitationIndices(full_text);
          const citations = chunks
            .filter(c => citation_indices.includes(c.index))
            .map(c => ({
              source_index: c.index,
              chunk_id: (c as any).chunk_id,
              document_id: (c as any).document_id,
              document_title: c.document_title,
              section_path: c.section_path,
            }));

          const { data: saved, error: saveErr } = await svc
            .from('chat_messages')
            .insert({
              session_id,
              user_id,
              role: 'assistant',
              content: full_text,
              citations,
              token_usage: { input_tokens, output_tokens },
            })
            .select('id')
            .single();

          if (saveErr) {
            send('error', { message: `failed to save: ${saveErr.message}` });
          } else {
            send('done', {
              message_id: saved!.id,
              full_text,
              citation_indices,
            });
          }
        } catch (err) {
          send('error', { message: (err as Error).message });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: err.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
