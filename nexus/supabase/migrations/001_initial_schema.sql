-- NEXUS v1 DATABASE SCHEMA
-- PostgreSQL 16+ with pgvector
-- From Spec §4

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_projects_name ON projects(name);

-- ============================================================
-- AGENTS
-- ============================================================
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  relevance_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  context_budget_tokens INTEGER NOT NULL DEFAULT 50000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_agent_name_per_project UNIQUE(project_id, name)
);

CREATE INDEX idx_agents_project ON agents(project_id);
CREATE INDEX idx_agents_role ON agents(role);

-- ============================================================
-- DECISIONS (nodes in the graph)
-- ============================================================
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  made_by TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'high'
    CHECK (confidence IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'superseded', 'reverted', 'pending')),
  supersedes_id UUID REFERENCES decisions(id) ON DELETE SET NULL,
  alternatives_considered JSONB NOT NULL DEFAULT '[]'::jsonb,
  affects TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(1536)
);

CREATE INDEX idx_decisions_project ON decisions(project_id);
CREATE INDEX idx_decisions_status ON decisions(status);
CREATE INDEX idx_decisions_made_by ON decisions(made_by);
CREATE INDEX idx_decisions_created ON decisions(created_at DESC);
CREATE INDEX idx_decisions_tags ON decisions USING GIN(tags);
CREATE INDEX idx_decisions_affects ON decisions USING GIN(affects);
CREATE INDEX idx_decisions_embedding ON decisions
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================
-- DECISION EDGES (relationships in the graph)
-- ============================================================
CREATE TABLE decision_edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL
    CHECK (relationship IN (
      'supersedes', 'requires', 'informs', 'blocks', 'contradicts'
    )),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_edge UNIQUE(source_id, target_id, relationship),
  CONSTRAINT no_self_edge CHECK (source_id != target_id)
);

CREATE INDEX idx_edges_source ON decision_edges(source_id);
CREATE INDEX idx_edges_target ON decision_edges(target_id);
CREATE INDEX idx_edges_relationship ON decision_edges(relationship);

-- ============================================================
-- ARTIFACTS
-- ============================================================
CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  path TEXT,
  artifact_type TEXT NOT NULL
    CHECK (artifact_type IN (
      'spec', 'code', 'design', 'report',
      'config', 'documentation', 'other'
    )),
  description TEXT,
  content_summary TEXT,
  content_hash TEXT,
  produced_by TEXT NOT NULL,
  related_decision_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(1536)
);

CREATE INDEX idx_artifacts_project ON artifacts(project_id);
CREATE INDEX idx_artifacts_type ON artifacts(artifact_type);
CREATE INDEX idx_artifacts_produced_by ON artifacts(produced_by);
CREATE INDEX idx_artifacts_embedding ON artifacts
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================
-- SESSION SUMMARIES (opt-in, post-launch priority)
-- ============================================================
CREATE TABLE session_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  topic TEXT NOT NULL,
  summary TEXT NOT NULL,
  decision_ids UUID[] NOT NULL DEFAULT '{}',
  artifact_ids UUID[] NOT NULL DEFAULT '{}',
  assumptions TEXT[] NOT NULL DEFAULT '{}',
  open_questions TEXT[] NOT NULL DEFAULT '{}',
  lessons_learned TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  embedding vector(1536)
);

CREATE INDEX idx_sessions_project ON session_summaries(project_id);
CREATE INDEX idx_sessions_agent ON session_summaries(agent_name);
CREATE INDEX idx_sessions_date ON session_summaries(session_date DESC);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  notify_on TEXT[] NOT NULL DEFAULT '{update,supersede,revert}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_subscription UNIQUE(agent_id, topic)
);

CREATE INDEX idx_subscriptions_agent ON subscriptions(agent_id);
CREATE INDEX idx_subscriptions_topic ON subscriptions(topic);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  decision_id UUID REFERENCES decisions(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL
    CHECK (notification_type IN (
      'decision_created', 'decision_updated',
      'decision_superseded', 'decision_reverted',
      'artifact_updated', 'blocked', 'unblocked'
    )),
  message TEXT NOT NULL,
  role_context TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_agent ON notifications(agent_id);
CREATE INDEX idx_notifications_unread ON notifications(agent_id)
  WHERE read_at IS NULL;

-- ============================================================
-- CONTEXT CACHE
-- ============================================================
CREATE TABLE context_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  task_hash TEXT NOT NULL,
  compiled_context JSONB NOT NULL,
  decision_ids_included UUID[] NOT NULL DEFAULT '{}',
  artifact_ids_included UUID[] NOT NULL DEFAULT '{}',
  token_count INTEGER NOT NULL,
  compiled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 hour',
  CONSTRAINT uq_cache_entry UNIQUE(agent_id, task_hash)
);

CREATE INDEX idx_cache_agent ON context_cache(agent_id);
CREATE INDEX idx_cache_expires ON context_cache(expires_at);

-- ============================================================
-- API KEYS
-- ============================================================
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_hash TEXT NOT NULL UNIQUE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- ============================================================
-- FUNCTION: Recursive graph traversal
-- Finds all decisions connected to a starting decision within N hops
-- ============================================================
CREATE OR REPLACE FUNCTION get_connected_decisions(
  start_id UUID,
  max_depth INTEGER DEFAULT 3
)
RETURNS TABLE (
  decision_id UUID,
  depth INTEGER,
  path UUID[],
  via_relationship TEXT
) AS $$
WITH RECURSIVE graph_walk AS (
  -- Base case: the starting decision
  SELECT
    d.id AS decision_id,
    0 AS depth,
    ARRAY[d.id] AS path,
    'origin'::TEXT AS via_relationship
  FROM decisions d
  WHERE d.id = start_id

  UNION ALL

  -- Recursive case: traverse edges in both directions
  SELECT
    neighbor.id AS decision_id,
    gw.depth + 1 AS depth,
    gw.path || neighbor.id AS path,
    neighbor.rel AS via_relationship
  FROM graph_walk gw
  JOIN LATERAL (
    -- Forward edges (source → target)
    SELECT e.target_id AS id, e.relationship AS rel
    FROM decision_edges e
    WHERE e.source_id = gw.decision_id
      AND NOT (e.target_id = ANY(gw.path))
    UNION ALL
    -- Reverse edges (target → source)
    SELECT e.source_id AS id, e.relationship || '_reverse' AS rel
    FROM decision_edges e
    WHERE e.target_id = gw.decision_id
      AND NOT (e.source_id = ANY(gw.path))
  ) neighbor ON true
  WHERE gw.depth < max_depth
)
SELECT DISTINCT ON (decision_id)
  decision_id,
  depth,
  path,
  via_relationship
FROM graph_walk
WHERE decision_id != start_id
ORDER BY decision_id, depth ASC;
$$ LANGUAGE SQL STABLE;

-- ============================================================
-- FUNCTION: Clean expired cache
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE deleted_count INTEGER;
BEGIN
  DELETE FROM context_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_agents_updated BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_decisions_updated BEFORE UPDATE ON decisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_artifacts_updated BEFORE UPDATE ON artifacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
