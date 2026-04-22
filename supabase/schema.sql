-- ============================================================
-- VeriPitch — Supabase Schema
-- Paste this entire file into the Supabase SQL Editor and run it.
-- It is fully idempotent — safe to run multiple times.
-- ============================================================


-- 1. Enable pgvector extension
create extension if not exists vector
  with schema extensions;


-- ============================================================
-- 2. Knowledge-base chunks table
--    text-embedding-3-small  → 1536 dimensions
--    all-MiniLM-L6-v2        → 384  dimensions  ← current local stack
--
--    We use 384 here to match the local sentence-transformers model.
--    Change to vector(1536) if you switch to OpenAI embeddings.
-- ============================================================
create table if not exists public.document_chunks (
  id            uuid          primary key default gen_random_uuid(),
  filename      text          not null,
  page_number   integer       not null,
  chunk_index   integer       not null,
  chunk_text    text          not null,
  embedding     vector(384)   not null,
  char_count    integer       generated always as (char_length(chunk_text)) stored,
  created_at    timestamptz   not null default now()
);

-- Cosine similarity index (IVFFlat — fast for millions of rows)
create index if not exists document_chunks_embedding_idx
  on public.document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Lookup index for per-filename operations (list, delete)
create index if not exists document_chunks_filename_idx
  on public.document_chunks (filename, page_number);


-- ============================================================
-- 3. RFP audit / job-tracking table
--    Every processed RFP is logged here — usage data for investors.
-- ============================================================
create table if not exists public.rfp_jobs (
  id              uuid          primary key default gen_random_uuid(),
  original_name   text          not null,
  question_count  integer,
  status          text          not null default 'pending'
                  check (status in ('pending', 'processing', 'complete', 'failed')),
  error_message   text,
  created_at      timestamptz   not null default now(),
  completed_at    timestamptz
);


-- ============================================================
-- 4. Row-Level Security
--    Service-role key (used by FastAPI) bypasses RLS automatically.
--    Add user-scoped policies here when you add auth.
-- ============================================================
alter table public.document_chunks enable row level security;
alter table public.rfp_jobs       enable row level security;


-- ============================================================
-- 5. match_chunks — the RAG similarity-search function
--    Called by the backend instead of raw SQL so query logic
--    lives in one place and is easy to tune without a deploy.
-- ============================================================
create or replace function public.match_chunks(
  query_embedding  vector(384),
  match_count      int     default 3,
  match_threshold  float   default 0.35
)
returns table (
  id           uuid,
  filename     text,
  page_number  integer,
  chunk_text   text,
  similarity   float
)
language sql stable
as $$
  select
    dc.id,
    dc.filename,
    dc.page_number,
    dc.chunk_text,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  where 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;


-- ============================================================
-- 6. delete_document — remove all chunks for a filename
--    Called by DELETE /api/v1/knowledge-base/{filename}
-- ============================================================
create or replace function public.delete_document(p_filename text)
returns void language sql as $$
  delete from public.document_chunks where filename = p_filename;
$$;
