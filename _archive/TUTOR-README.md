# Certidemy AI Tutor + Mock Exam

Builds on top of `certidemy-engine`. Adds:

- **RAG infrastructure** — pgvector tables, document chunking, embeddings
- **AI tutor chat** — streaming, grounded in Certidemy's own lesson content only, three languages
- **Mock exam generator + scorer** — blueprint-valid exam form, full analytics
- **React components** — drop-in `TutorChat` and `MockExam`

## What's in here

```
supabase/
├── migrations/
│   └── 002_rag_and_chat.sql          DB migration: pgvector + new tables
└── functions/
    ├── _shared/
    │   ├── prompts.ts                Tutor system prompts (EN/ES-419/PT-BR)
    │   ├── voyage.ts                 Voyage AI embedding client
    │   ├── rag.ts                    Retrieval + citation extraction
    │   └── chunker.ts                Recursive text splitter
    ├── ingest-document/              Admin endpoint: chunk + embed source docs
    ├── chat-tutor/                   Streaming RAG chat (SSE)
    ├── generate-mock-exam/           Builds a blueprint-valid exam form
    └── score-mock-exam/              Grades + analytics + AI recommendations

frontend/
├── TutorChat.tsx                     React chat component (SSE-aware)
└── MockExam.tsx                      Full exam flow: take → submit → results
```

## Prerequisites

You already have the engine from the first package deployed. You need:

1. **A Voyage AI API key.** Sign up at https://dash.voyageai.com, generate a key. They give 50M free tokens per month, which is enough for tens of thousands of chunk embeddings + millions of search queries.
2. **The schema migration applied to your Supabase database.**

## Step 1 — Run the migration

Open your Supabase dashboard → **SQL Editor** → **New query**. Paste the contents of `supabase/migrations/002_rag_and_chat.sql` and click **Run**.

You should see "Success. No rows returned." Verify:

```sql
select table_name from information_schema.tables
where table_schema = 'public' and table_name in (
  'source_documents', 'document_chunks', 'chat_sessions',
  'chat_messages', 'mock_exam_results'
);
```

All five should appear.

## Step 2 — Add the new files to your local project

You already have `C:\Users\Juan\Documents\certidemy` set up. Extract this tarball there. From PowerShell in that folder:

```powershell
tar -xzf $HOME\Downloads\certidemy-tutor.tar.gz
Move-Item certidemy-tutor\supabase\functions\* supabase\functions\
Move-Item certidemy-tutor\frontend .\
Remove-Item certidemy-tutor -Recurse
```

Verify:

```powershell
ls supabase\functions
```

You should now see nine function folders: the original five plus `ingest-document`, `chat-tutor`, `generate-mock-exam`, `score-mock-exam`.

## Step 3 — Set the Voyage API key as a secret

```powershell
supabase secrets set VOYAGE_API_KEY=pa-...
```

(Replace `pa-...` with your actual Voyage key. Don't paste the command back in chat.)

Verify with `supabase secrets list` — you should see `VOYAGE_API_KEY` alongside `ANTHROPIC_API_KEY` from before.

## Step 4 — Deploy the four new functions

```powershell
supabase functions deploy ingest-document
supabase functions deploy chat-tutor
supabase functions deploy generate-mock-exam
supabase functions deploy score-mock-exam
```

Each should print "Deployed Function ... on project ...". Total time: ~1-2 minutes.

## Step 5 — Ingest your first source document

The tutor refuses to answer anything that's not in the source material, so **chat will return "not covered in my materials" responses until you ingest something**. To test the pipeline, ingest a small document:

```powershell
# Get your auth token from Supabase dashboard → Authentication → Users →
# click your admin user → JWT (or get it via a frontend login flow).
$TOKEN = "YOUR_JWT_HERE"
$URL = "https://YOUR_PROJECT_REF.supabase.co/functions/v1/ingest-document"

$body = @{
  certification_id = "11111111-1111-1111-1111-111111111111"
  title = "Scrum Guide 2020 (sample)"
  source_type = "markdown"
  content_md = "# Scrum Framework`n`nScrum is a lightweight framework that helps people, teams, and organizations generate value through adaptive solutions for complex problems. The Scrum Master is accountable for establishing Scrum as defined in the Scrum Guide. They do this by helping everyone understand Scrum theory and practice, both within the Scrum Team and the organization.`n`n## Sprint Events`n`nThe Sprint is a fixed-length event of one month or less to create consistency. A new Sprint starts immediately after the conclusion of the previous Sprint."
} | ConvertTo-Json

Invoke-RestMethod -Uri $URL -Method Post -Headers @{
  Authorization = "Bearer $TOKEN"
  "Content-Type" = "application/json"
} -Body $body
```

Returns `{ document_id, chunks_created, total_tokens }`.

In production you'd build a small admin UI for this; for now PowerShell is enough to test the pipeline.

## Step 6 — Use the React components

Both components assume you've already set up a Supabase client and the user is authenticated.

```tsx
import { createClient } from '@supabase/supabase-js';
import { TutorChat } from './frontend/TutorChat';
import { MockExam } from './frontend/MockExam';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export function TutorPage() {
  return (
    <div className="h-screen p-4">
      <TutorChat
        supabase={supabase}
        certificationId="11111111-1111-1111-1111-111111111111"
        certificationName="Scrum Master Professional Certificate"
        language="es-419"
      />
    </div>
  );
}

export function ExamPage() {
  return (
    <MockExam
      supabase={supabase}
      certificationId="11111111-1111-1111-1111-111111111111"
      certificationName="Scrum Master Professional Certificate"
      language="es-419"
      onExit={() => router.push('/dashboard')}
    />
  );
}
```

The components use Tailwind classes. If you're not on Tailwind, the easiest path is `npm install -D tailwindcss` and add the standard config — or replace the classes with whatever your design system uses.

## Architectural notes

### Why pgvector and not a separate vector DB
For corpora under ~10M chunks, pgvector inside your existing Supabase Postgres is faster end-to-end than a separate Pinecone/Weaviate hop. You skip a network call, RLS works naturally, and the index lives next to the data it filters by (certification_id).

### Why Voyage and not OpenAI embeddings
Voyage's models match or beat OpenAI on retrieval benchmarks, the asymmetric encoder (separate `query` and `document` modes) noticeably improves recall, and you're paying ~half the cost. The dimensions are 1024 — if you ever switch providers, update the vector column type and re-embed.

### Why the chat streams
A 2000-token response from Claude takes ~10-15 seconds end-to-end. Streaming surfaces tokens as they arrive so the user sees progress within ~1 second. Critical for chat UX — non-streaming feels broken.

### Why the tutor refuses off-topic questions
Three reasons. (1) Hallucination defense: if Claude has nothing to cite, "I don't know" is safer than confabulation. (2) Cost: every off-topic question still bills tokens, and "explain photosynthesis" isn't what the customer is paying for. (3) Trust: B2B buyers won't ship a tutor that wanders. The grounding rule is enforced in the system prompt across all three languages.

### Why mock exams use stratified sampling
A pure random sample over 40 questions from a pool of 200 won't cover every concept. Stratified sampling allocates a quota per concept proportional to its share of the question bank, then balances difficulty within each quota. Result: every major topic appears, no surprise blind spots.

### Why scoring is split from exam generation
The generator returns ONLY question text and options — never the correct answers. The client collects answers, then `score-mock-exam` loads the correct answers server-side and grades. This is the same pattern as `submit-quiz-answer`: the answer key never reaches the browser before submission.

## What's not built (future work)

- **Streaming the recommendations.** Right now `score-mock-exam` blocks until Claude returns the JSON. For a snappier UX, return the score immediately and stream recommendations after. Maybe one Edge Function for grading, another for AI feedback.
- **Admin UI for ingestion.** PDF upload → markdown extraction → chunk preview → embed. Currently CLI-only.
- **Per-document content audit.** When a source document is updated, you want to re-embed only the changed sections, not the whole doc. Needs a content hash per chunk.
- **Translation of source material.** The tutor responds in the user's chosen language but ingested material stays in its original language. Retrieval works cross-lingually with Voyage but the citations stay in source language. For LATAM, ingest Spanish translations of source material if available.
- **Re-ranking.** For top-tier retrieval quality, run an LLM re-ranker (Cohere Rerank, or a small Claude call) on the top-20 chunks to pick the top-5. Worth it once you have thousands of users.
