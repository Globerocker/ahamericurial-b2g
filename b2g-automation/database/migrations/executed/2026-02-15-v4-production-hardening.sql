-- ============================================
-- MIGRATION: Production Hardening v4
-- Date: 2026-02-15
-- Purpose: Processing state, CRM sync tracking,
--          deduplication, error handling
-- ============================================

-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/udilwmuanpkuqmktmrst/sql/new

BEGIN;

-- ============================================
-- 1. OPPORTUNITIES: Processing State Fields
-- ============================================

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS matched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS vendors_processed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS crm_synced BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN opportunities.matched_at IS 'Timestamp when matching was completed - NULL means unmatched';
COMMENT ON COLUMN opportunities.vendors_processed IS 'TRUE after vendor discovery has run for this opportunity';
COMMENT ON COLUMN opportunities.crm_synced IS 'TRUE after all matches synced to HubSpot';

-- Index for fast filtering of unmatched opportunities
CREATE INDEX IF NOT EXISTS idx_opportunities_unmatched
  ON opportunities (matched_at)
  WHERE matched_at IS NULL;

-- Index for unprocessed vendor discovery
CREATE INDEX IF NOT EXISTS idx_opportunities_unprocessed
  ON opportunities (vendors_processed)
  WHERE vendors_processed = FALSE;


-- ============================================
-- 2. MATCHES: CRM Sync Tracking
-- ============================================

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS crm_synced BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS crm_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS location_score INTEGER,
  ADD COLUMN IF NOT EXISTS naics_match BOOLEAN,
  ADD COLUMN IF NOT EXISTS readiness_score INTEGER,
  ADD COLUMN IF NOT EXISTS is_sam_vendor BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS matched_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS match_metadata JSONB;

COMMENT ON COLUMN matches.crm_synced IS 'TRUE after deal created in HubSpot';
COMMENT ON COLUMN matches.crm_synced_at IS 'Timestamp of HubSpot deal creation';

-- Index for deal deduplication check
CREATE INDEX IF NOT EXISTS idx_matches_crm_synced
  ON matches (opportunity_id, crm_synced)
  WHERE crm_synced = TRUE;


-- ============================================
-- 3. FAILED_OPPORTUNITIES: Add module column
-- ============================================

ALTER TABLE failed_opportunities
  ADD COLUMN IF NOT EXISTS module TEXT,
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON COLUMN failed_opportunities.module IS 'Which module failed: MEGA_WORKFLOW, VENDOR_DISCOVERY, etc.';


-- ============================================
-- 4. CONTRACTORS: Expand contractor_type CHECK
-- ============================================
-- The workflow uses more types than the current CHECK allows
-- Drop old constraint and add broader one

ALTER TABLE opportunities
  DROP CONSTRAINT IF EXISTS opportunities_contractor_type_check;

ALTER TABLE opportunities
  ADD CONSTRAINT opportunities_contractor_type_check
  CHECK (contractor_type IN (
    'IT', 'IT Services', 'Construction', 'Engineering',
    'Facilities', 'Environmental', 'Security',
    'Landscaping', 'Professional Services',
    'Other', 'Unknown'
  ));


-- ============================================
-- 5. RLS POLICIES (ensure they exist)
-- ============================================

-- Enable RLS on new/modified tables if not already enabled
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_opportunities ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (n8n uses service role key)
DO $$
BEGIN
  -- Opportunities
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'opportunities' AND policyname = 'service_role_all_opportunities'
  ) THEN
    CREATE POLICY service_role_all_opportunities ON opportunities
      FOR ALL USING (auth.role() = 'service_role');
  END IF;

  -- Matches
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'matches' AND policyname = 'service_role_all_matches'
  ) THEN
    CREATE POLICY service_role_all_matches ON matches
      FOR ALL USING (auth.role() = 'service_role');
  END IF;

  -- Failed opportunities
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'failed_opportunities' AND policyname = 'service_role_all_failed'
  ) THEN
    CREATE POLICY service_role_all_failed ON failed_opportunities
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;


-- ============================================
-- 6. VERIFY
-- ============================================

-- Check all columns exist
SELECT
  'opportunities.matched_at' AS field,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='opportunities' AND column_name='matched_at') AS exists
UNION ALL
SELECT 'opportunities.vendors_processed',
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='opportunities' AND column_name='vendors_processed')
UNION ALL
SELECT 'opportunities.crm_synced',
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='opportunities' AND column_name='crm_synced')
UNION ALL
SELECT 'matches.crm_synced',
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='crm_synced')
UNION ALL
SELECT 'matches.crm_synced_at',
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='crm_synced_at');

COMMIT;

-- ============================================
-- EXPECTED OUTPUT: All fields show "exists = true"
-- ============================================
