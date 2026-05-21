-- =============================================================================
-- Migration 002: RAG infrastructure + AI tutor chat + mock exam analytics
-- =============================================================================
-- Run this against your existing Certidemy database AFTER certidemy_schema.sql.

-- pgvector for similarity search
create extension if not exists vector;

-- -----------------------------------------------------------------------------
-- Source documents: the CertiProf materials the tutor is allowed to cite from.
-- One row per ingested document (PDF, markdown file, video transcript, etc.).
-- The content_md is the full normalized text; chunks live in document_chunks.
-- -----------------------------------------------------------------------------
create type source_doc_type as enum ('pdf','markdown','web','video_transcript','slide_deck');

create table public.source_documents (
  id                uuid primary key default uuid_generate_v4(),
  certification_id  uuid not null references public.certifications(id) on delete cascade,
  title             text not null,
  source_type       source_doc_type not null,
  source_url        text,
  content_md        text,
  total_chunks      integer not null default 0,
  total_tokens      integer not null default 0,
  uploaded_by       uuid references public.profiles(id),
  uploaded_at       timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Document chunks: the retrieval unit. Each row is ~500-800 tokens of text
-- plus its vector embedding (voyage-3, 1024 dimensions).
-- -----------------------------------------------------------------------------
create table public.document_chunks (
  id                uuid primary key default uuid_generate_v4(),
  document_id       uuid not null references public.source_documents(id) on delete cascade,
  certification_id  uuid not null references public.certifications(id)   on delete cascade,
  chunk_index       integer not null,
  content           text not null,
  token_count       integer,
  section_path      text,            -- e.g. "Chapter 3 > Sprint Events > Sprint Planning"
  embedding         vector(1024),    -- voyage-3 dims (use vector(1536) if switching to OpenAI)
  created_at        timestamptz not null default now(),
  unique (document_id, chunk_index)
);

-- HNSW index for fast cosine-similarity retrieval. m=16, ef_construction=64 are
-- good defaults for sub-1M-row corpora. Tune up if recall feels low.
create index document_chunks_embedding_hnsw_idx
  on public.document_chunks
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

create index on public.document_chunks (certification_id);

-- -----------------------------------------------------------------------------
-- Chat sessions: a conversation between a learner and the AI tutor.
-- One session per user/cert/language tuple is the typical pattern but not
-- enforced — power users may want multiple parallel threads.
-- -----------------------------------------------------------------------------
create type chat_language as enum ('en','es-419','pt-BR');

create table public.chat_sessions (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.profiles(id)        on delete cascade,
  certification_id  uuid not null references public.certifications(id)  on delete cascade,
  language          chat_language not null default 'en',
  title             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger chat_sessions_updated_at before update on public.chat_sessions
  for each row execute function set_updated_at();

create table public.chat_messages (
  id          uuid primary key default uuid_generate_v4(),
  session_id  uuid not null references public.chat_sessions(id) on delete cascade,
  user_id     uuid not null references public.profiles(id)      on delete cascade,
  role        text not null check (role in ('user','assistant')),
  content     text not null,
  citations   jsonb,         -- [{source_index: 1, chunk_id, document_title, section_path}]
  token_usage jsonb,         -- {input_tokens, output_tokens} from the model
  created_at  timestamptz not null default now()
);
create index on public.chat_messages (session_id, created_at);

-- -----------------------------------------------------------------------------
-- Mock exam results: extends quiz_sessions with the heavier analytics that
-- only mock exams need (per-concept breakdown, pass prediction, etc.).
-- -----------------------------------------------------------------------------
create table public.mock_exam_results (
  id                  uuid primary key default uuid_generate_v4(),
  session_id          uuid not null unique references public.quiz_sessions(id) on delete cascade,
  user_id             uuid not null references public.profiles(id)             on delete cascade,
  certification_id    uuid not null references public.certifications(id)       on delete cascade,
  score_pct           numeric(5,2) not null,
  passed              boolean not null,
  total_questions     integer not null,
  correct_answers     integer not null,
  duration_seconds    integer,
  concept_breakdown   jsonb,      -- [{concept_slug, name, attempted, correct, pct}]
  difficulty_breakdown jsonb,     -- [{difficulty, attempted, correct, pct}]
  weakest_concepts    text[],     -- top 3 concept slugs by lowest score
  recommendations     text[],     -- 3-5 natural-language recommendations
  predicted_real_exam_pass_pct numeric(5,2),
  created_at          timestamptz not null default now()
);
create index on public.mock_exam_results (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Indexes for hot paths
-- -----------------------------------------------------------------------------
create index on public.source_documents (certification_id);
create index on public.chat_sessions (user_id, certification_id);

-- -----------------------------------------------------------------------------
-- Similarity search RPC. Called by the chat-tutor Edge Function.
--   - Embeds happen client-side (in the Edge Function); we just rank here.
--   - Filters to one certification so cross-cert content never leaks.
--   - Returns up to `match_count` chunks ordered by cosine similarity.
-- -----------------------------------------------------------------------------
create or replace function public.match_document_chunks(
  query_embedding vector(1024),
  filter_certification_id uuid,
  match_count int default 8,
  match_threshold float default 0.5
)
returns table (
  chunk_id uuid,
  document_id uuid,
  document_title text,
  section_path text,
  content text,
  similarity float
)
language sql stable as $$
  select
    dc.id as chunk_id,
    dc.document_id,
    sd.title as document_title,
    dc.section_path,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  join public.source_documents sd on sd.id = dc.document_id
  where dc.certification_id = filter_certification_id
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.source_documents enable row level security;
alter table public.document_chunks  enable row level security;
alter table public.chat_sessions    enable row level security;
alter table public.chat_messages    enable row level security;
alter table public.mock_exam_results enable row level security;

-- Catalog content (source docs + chunks): readable by any authenticated user;
-- only platform admins can ingest new material.
create policy "auth read source_documents" on public.source_documents
  for select using (auth.role() = 'authenticated');
create policy "admin write source_documents" on public.source_documents
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "auth read document_chunks" on public.document_chunks
  for select using (auth.role() = 'authenticated');
create policy "admin write document_chunks" on public.document_chunks
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- Chat sessions and messages: own data only, plus team admins can read for
-- their team members (useful for "what did my learners ask?" analytics).
create policy "own chat_sessions" on public.chat_sessions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "team_admin read chat_sessions" on public.chat_sessions for select
  using (public.is_team_admin_of(user_id) or public.is_platform_admin());

create policy "own chat_messages" on public.chat_messages for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "team_admin read chat_messages" on public.chat_messages for select
  using (public.is_team_admin_of(user_id) or public.is_platform_admin());

-- Mock exam results: own + team admin read-through.
create policy "own mock_exam_results" on public.mock_exam_results for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "team_admin read mock_exam_results" on public.mock_exam_results for select
  using (public.is_team_admin_of(user_id) or public.is_platform_admin());

-- =============================================================================
-- End of migration 002
-- =============================================================================
