CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE papers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  authors         JSONB,
  year            INT,
  raw_text        TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE paper_chunks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id        UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  chunk_index     INT NOT NULL,
  content         TEXT NOT NULL,
  embedding       vector(1536) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_paper_chunks_paper_id ON paper_chunks(paper_id);
CREATE INDEX idx_paper_chunks_embedding ON paper_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TABLE citations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id              UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  citation_key          TEXT NOT NULL,
  raw_reference         TEXT,
  context_in_paper      TEXT,
  cited_title           TEXT,
  cited_abstract        TEXT,
  cited_authors         JSONB,
  cited_year            INT,
  cited_doi             TEXT,
  cited_s2_id           TEXT,
  relevance_explanation TEXT,
  enriched              BOOLEAN NOT NULL DEFAULT FALSE,
  enrichment_failed     BOOLEAN NOT NULL DEFAULT FALSE,
  failure_reason        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  enriched_at           TIMESTAMPTZ
);

CREATE INDEX idx_citations_paper_id ON citations(paper_id);
CREATE INDEX idx_citations_lookup ON citations(paper_id, citation_key);
