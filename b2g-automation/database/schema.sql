-- ============================================
-- B2G SYSTEM - DATABASE SCHEMA
-- Phase 1: SAM Sentinel + Vendor Discovery
-- ============================================

-- ============================================
-- 1. OPPORTUNITIES TABLE
-- ============================================

CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  agency TEXT,
  naics TEXT,
  state TEXT,
  city TEXT,
  estimated_value NUMERIC DEFAULT 0,
  deadline TIMESTAMPTZ,
  days_until_deadline INTEGER,
  raw_json JSONB,

  -- AI Enrichment Fields
  service_tags TEXT[] DEFAULT '{}',
  required_capabilities TEXT[] DEFAULT '{}',
  complexity_score INTEGER CHECK (complexity_score BETWEEN 1 AND 5 OR complexity_score IS NULL),
  contractor_type TEXT CHECK (contractor_type IN ('IT', 'IT Services', 'Construction', 'Engineering', 'Facilities', 'Environmental', 'Security', 'Landscaping', 'Professional Services', 'Other', 'Unknown')),
  risk_flags TEXT[] DEFAULT '{}',

  -- Priority Fields
  priority_flag TEXT CHECK (priority_flag IN ('FAST_TRACK', 'STANDARD', 'REVIEW_REQUIRED')) DEFAULT 'STANDARD',
  priority_score INTEGER DEFAULT 0,

  -- Error Tracking
  ai_parse_error BOOLEAN DEFAULT FALSE,

  -- Processing State (v4)
  matched_at TIMESTAMPTZ,
  vendors_processed BOOLEAN DEFAULT FALSE,
  crm_synced BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE opportunities IS 'SAM.gov contract opportunities with AI enrichment';
COMMENT ON COLUMN opportunities.matched_at IS 'Set after matching completes - NULL means unmatched';
COMMENT ON COLUMN opportunities.notice_id IS 'Unique SAM.gov notice identifier';
COMMENT ON COLUMN opportunities.priority_flag IS 'FAST_TRACK (≤2), STANDARD (3), REVIEW_REQUIRED (≥4)';
COMMENT ON COLUMN opportunities.priority_score IS 'Value (40) + Complexity (30) + Deadline (30) = max 100';


-- ============================================
-- 2. CONTRACTORS TABLE (UPDATED for SAM + Bing)
-- ============================================

CREATE TABLE contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source tracking
  source TEXT NOT NULL CHECK (source IN ('SAM_VENDOR', 'BING_SEARCH', 'GOOGLE_PLACES')),

  -- SAM.gov specific fields
  uei TEXT UNIQUE,  -- Unique Entity Identifier (SAM.gov)
  cage_code TEXT,   -- CAGE code (SAM.gov)
  dba_name TEXT,    -- Doing Business As name
  primary_naics TEXT,
  registration_date TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,
  business_types TEXT[],

  -- General contractor info
  name TEXT NOT NULL,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'USA',
  phone TEXT,
  email TEXT,

  -- Web search specific
  snippet TEXT,  -- Bing search snippet

  -- Readiness assessment
  sam_registered BOOLEAN DEFAULT FALSE,
  readiness_score INTEGER CHECK (readiness_score BETWEEN 0 AND 100),
  readiness_reasoning TEXT,
  certifications TEXT[] DEFAULT '{}',
  red_flags TEXT[] DEFAULT '{}',

  -- Metadata
  primary_tag TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE contractors IS 'Contractors from SAM.gov, Bing Search, or Google Places';
COMMENT ON COLUMN contractors.source IS 'SAM_VENDOR (primary), BING_SEARCH (secondary), GOOGLE_PLACES (future)';
COMMENT ON COLUMN contractors.uei IS 'SAM.gov Unique Entity Identifier - only for SAM vendors';
COMMENT ON COLUMN contractors.sam_registered IS 'TRUE if federal contractor registration verified';
COMMENT ON COLUMN contractors.readiness_score IS '0-100 score, SAM vendors auto-qualify with 100';


-- ============================================
-- 3. MATCHES TABLE
-- ============================================

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id TEXT NOT NULL,
  contractor_id UUID NOT NULL,

  -- Match scoring
  match_score INTEGER CHECK (match_score BETWEEN 0 AND 100),
  service_score INTEGER,
  region_score INTEGER,
  complexity_score INTEGER,
  risk_penalty INTEGER,
  sam_bonus INTEGER DEFAULT 0,  -- NEW: Bonus for SAM-registered contractors

  -- Match details (v4)
  location_score INTEGER,
  naics_match BOOLEAN,
  readiness_score INTEGER,
  is_sam_vendor BOOLEAN DEFAULT FALSE,
  match_metadata JSONB,

  -- CRM integration
  hubspot_deal_id TEXT,
  crm_synced BOOLEAN DEFAULT FALSE,
  crm_synced_at TIMESTAMPTZ,

  matched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (opportunity_id) REFERENCES opportunities(notice_id) ON DELETE CASCADE,
  FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE,
  UNIQUE(opportunity_id, contractor_id)
);

COMMENT ON TABLE matches IS 'High-quality matches (score ≥75) between opportunities and contractors';
COMMENT ON COLUMN matches.sam_bonus IS 'Bonus points for SAM-registered contractors (max 10)';


-- ============================================
-- 4. FAILED OPPORTUNITIES TABLE (Dead Letter Queue)
-- ============================================

CREATE TABLE failed_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id TEXT NOT NULL,
  title TEXT,
  error_type TEXT NOT NULL,
  error_message TEXT,
  module TEXT,
  opportunity_data JSONB,
  failed_at TIMESTAMPTZ DEFAULT NOW(),
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE failed_opportunities IS 'Dead letter queue for failed opportunity processing';


-- ============================================
-- 5. WORKFLOW LOGS
-- ============================================

CREATE TABLE workflow_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  notice_id TEXT,
  status TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

COMMENT ON TABLE workflow_logs IS 'Audit log for all workflow events';


-- ============================================
-- 6. WORKFLOW ERRORS
-- ============================================

CREATE TABLE workflow_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name TEXT NOT NULL,
  node_name TEXT,
  error_message TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  context JSONB
);

COMMENT ON TABLE workflow_errors IS 'Error tracking for debugging and monitoring';
