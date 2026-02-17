-- ============================================
-- B2G SYSTEM - CRM DATABASE EXTENSION
-- Local CRM tables for frontend + HubSpot sync
-- ============================================

-- ============================================
-- COMPANIES (Enhanced Contractors)
-- ============================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source tracking
  contractor_id UUID REFERENCES contractors(id) ON DELETE SET NULL,
  source TEXT NOT NULL CHECK (source IN ('SAM_VENDOR', 'GOOGLE_PLACES', 'MANUAL')),

  -- Core company info
  name TEXT NOT NULL,
  legal_name TEXT,
  dba_name TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,

  -- Address
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'USA',

  -- Business classification
  primary_naics TEXT,
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
  annual_revenue DECIMAL(15,2),

  -- Government contracting
  uei TEXT UNIQUE,
  cage_code TEXT,
  sam_registered BOOLEAN DEFAULT FALSE,
  registration_date DATE,
  expiration_date DATE,
  certifications TEXT[], -- ['8A', 'SDVOSB', 'WOSB', etc.]

  -- Scoring & qualification
  readiness_score INTEGER CHECK (readiness_score BETWEEN 0 AND 100),
  qualification_status TEXT CHECK (qualification_status IN ('unqualified', 'qualified', 'hot_lead', 'customer', 'churned')),

  -- Engagement tracking
  total_matches INTEGER DEFAULT 0,
  total_deals INTEGER DEFAULT 0,
  total_won_deals INTEGER DEFAULT 0,
  total_contract_value DECIMAL(15,2) DEFAULT 0,

  -- Sales ownership
  assigned_to TEXT, -- Sales rep name/ID
  lifecycle_stage TEXT CHECK (lifecycle_stage IN ('lead', 'mql', 'sql', 'opportunity', 'customer', 'evangelist')),

  -- HubSpot sync
  hubspot_company_id TEXT UNIQUE,
  hubspot_sync_status TEXT CHECK (hubspot_sync_status IN ('pending', 'synced', 'failed', 'disabled')),
  last_hubspot_sync TIMESTAMPTZ,
  hubspot_sync_error TEXT,

  -- Metadata
  notes TEXT,
  tags TEXT[],
  custom_fields JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ
);

-- ============================================
-- CONTACTS (People at Companies)
-- ============================================

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Company relationship
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Personal info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email TEXT NOT NULL,
  phone TEXT,
  mobile TEXT,

  -- Job info
  job_title TEXT,
  department TEXT,
  seniority TEXT CHECK (seniority IN ('entry', 'mid', 'senior', 'c_level', 'owner')),

  -- Contact preferences
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'linkedin', 'other')),
  timezone TEXT,

  -- Engagement
  is_primary_contact BOOLEAN DEFAULT FALSE,
  is_decision_maker BOOLEAN DEFAULT FALSE,
  lifecycle_stage TEXT CHECK (lifecycle_stage IN ('subscriber', 'lead', 'mql', 'sql', 'opportunity', 'customer')),

  -- HubSpot sync
  hubspot_contact_id TEXT UNIQUE,
  hubspot_sync_status TEXT CHECK (hubspot_sync_status IN ('pending', 'synced', 'failed', 'disabled')),
  last_hubspot_sync TIMESTAMPTZ,

  -- Social
  linkedin_url TEXT,
  twitter_handle TEXT,

  -- Metadata
  notes TEXT,
  tags TEXT[],

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_contacted_at TIMESTAMPTZ
);

-- ============================================
-- DEALS (Opportunities + Matches → Sales Pipeline)
-- ============================================

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  opportunity_id TEXT REFERENCES opportunities(notice_id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  primary_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  -- Deal info
  deal_name TEXT NOT NULL,
  deal_value DECIMAL(15,2) NOT NULL,
  expected_close_date DATE,
  actual_close_date DATE,

  -- Pipeline
  pipeline TEXT DEFAULT 'b2g_opportunities' CHECK (pipeline IN ('b2g_opportunities', 'inbound', 'outbound', 'partner')),
  stage TEXT NOT NULL CHECK (stage IN (
    'new_match',           -- Just matched
    'initial_outreach',    -- First contact sent
    'contact_made',        -- They responded
    'qualified',           -- Confirmed fit
    'proposal_sent',       -- Proposal/RFP submitted
    'negotiation',         -- In contract negotiation
    'closed_won',          -- Won the contract
    'closed_lost'          -- Lost or declined
  )),

  -- Scoring
  match_score INTEGER CHECK (match_score BETWEEN 0 AND 100),
  win_probability INTEGER CHECK (win_probability BETWEEN 0 AND 100),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),

  -- Loss tracking
  lost_reason TEXT CHECK (lost_reason IN (
    'price', 'timing', 'competitor', 'no_response', 'unqualified', 'other'
  )),
  lost_notes TEXT,
  competitor TEXT,

  -- Sales ownership
  assigned_to TEXT, -- Sales rep

  -- HubSpot sync
  hubspot_deal_id TEXT UNIQUE,
  hubspot_sync_status TEXT CHECK (hubspot_sync_status IN ('pending', 'synced', 'failed', 'disabled')),
  last_hubspot_sync TIMESTAMPTZ,
  hubspot_sync_error TEXT,

  -- Metadata
  notes TEXT,
  tags TEXT[],
  custom_fields JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  stage_changed_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

-- ============================================
-- ACTIVITIES (Interactions & Communication)
-- ============================================

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,

  -- Activity type
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'email_sent',
    'email_received',
    'call_made',
    'call_received',
    'meeting_scheduled',
    'meeting_completed',
    'note_added',
    'proposal_sent',
    'contract_sent',
    'document_signed',
    'status_change',
    'other'
  )),

  -- Activity details
  subject TEXT NOT NULL,
  description TEXT,
  outcome TEXT,

  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,

  -- Ownership
  created_by TEXT, -- User/rep who logged this

  -- HubSpot sync
  hubspot_activity_id TEXT UNIQUE,
  hubspot_sync_status TEXT CHECK (hubspot_sync_status IN ('pending', 'synced', 'failed', 'disabled')),

  -- Metadata
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SYNC QUEUE (HubSpot Sync Management)
-- ============================================

CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What to sync
  entity_type TEXT NOT NULL CHECK (entity_type IN ('company', 'contact', 'deal', 'activity')),
  entity_id UUID NOT NULL,

  -- Sync operation
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),

  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'skipped')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,

  -- Error tracking
  last_error TEXT,
  error_count INTEGER DEFAULT 0,

  -- Payload
  payload JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================

-- Companies
CREATE INDEX idx_companies_contractor_id ON companies(contractor_id);
CREATE INDEX idx_companies_source ON companies(source);
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_state ON companies(state);
CREATE INDEX idx_companies_uei ON companies(uei) WHERE uei IS NOT NULL;
CREATE INDEX idx_companies_qualification_status ON companies(qualification_status);
CREATE INDEX idx_companies_lifecycle_stage ON companies(lifecycle_stage);
CREATE INDEX idx_companies_hubspot_id ON companies(hubspot_company_id) WHERE hubspot_company_id IS NOT NULL;
CREATE INDEX idx_companies_hubspot_sync_pending ON companies(hubspot_sync_status) WHERE hubspot_sync_status = 'pending';
CREATE INDEX idx_companies_created_at ON companies(created_at DESC);

-- Contacts
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_full_name ON contacts(full_name);
CREATE INDEX idx_contacts_is_primary ON contacts(is_primary_contact) WHERE is_primary_contact = TRUE;
CREATE INDEX idx_contacts_hubspot_id ON contacts(hubspot_contact_id) WHERE hubspot_contact_id IS NOT NULL;

-- Deals
CREATE INDEX idx_deals_opportunity_id ON deals(opportunity_id);
CREATE INDEX idx_deals_company_id ON deals(company_id);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_pipeline ON deals(pipeline);
CREATE INDEX idx_deals_expected_close_date ON deals(expected_close_date);
CREATE INDEX idx_deals_match_score ON deals(match_score DESC);
CREATE INDEX idx_deals_deal_value ON deals(deal_value DESC);
CREATE INDEX idx_deals_hubspot_id ON deals(hubspot_deal_id) WHERE hubspot_deal_id IS NOT NULL;
CREATE INDEX idx_deals_created_at ON deals(created_at DESC);
CREATE INDEX idx_deals_closed_won ON deals(stage) WHERE stage = 'closed_won';

-- Activities
CREATE INDEX idx_activities_company_id ON activities(company_id);
CREATE INDEX idx_activities_contact_id ON activities(contact_id);
CREATE INDEX idx_activities_deal_id ON activities(deal_id);
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_activities_scheduled_at ON activities(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- Sync Queue
CREATE INDEX idx_sync_queue_status ON sync_queue(status);
CREATE INDEX idx_sync_queue_entity ON sync_queue(entity_type, entity_id);
CREATE INDEX idx_sync_queue_scheduled ON sync_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_sync_queue_failed ON sync_queue(status, attempts) WHERE status = 'failed' AND attempts < max_attempts;

-- ============================================
-- TRIGGERS (Auto-update timestamps)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS (Common Queries)
-- ============================================

-- Active deals with full context
CREATE OR REPLACE VIEW v_active_deals WITH (security_invoker = on) AS
SELECT
  d.id,
  d.deal_name,
  d.deal_value,
  d.stage,
  d.match_score,
  d.expected_close_date,
  c.name AS company_name,
  c.state AS company_state,
  c.readiness_score AS company_readiness,
  o.title AS opportunity_title,
  o.priority_flag AS opportunity_priority,
  con.full_name AS primary_contact_name,
  con.email AS primary_contact_email,
  d.created_at,
  d.updated_at
FROM deals d
LEFT JOIN companies c ON d.company_id = c.id
LEFT JOIN opportunities o ON d.opportunity_id = o.notice_id
LEFT JOIN contacts con ON d.primary_contact_id = con.id
WHERE d.stage NOT IN ('closed_won', 'closed_lost')
ORDER BY d.match_score DESC, d.expected_close_date ASC;

-- Company engagement summary
CREATE OR REPLACE VIEW v_company_engagement WITH (security_invoker = on) AS
SELECT
  c.id,
  c.name,
  c.qualification_status,
  c.lifecycle_stage,
  COUNT(DISTINCT d.id) AS total_deals,
  COUNT(DISTINCT d.id) FILTER (WHERE d.stage = 'closed_won') AS won_deals,
  SUM(d.deal_value) FILTER (WHERE d.stage = 'closed_won') AS total_revenue,
  COUNT(DISTINCT con.id) AS total_contacts,
  COUNT(DISTINCT a.id) AS total_activities,
  MAX(a.created_at) AS last_activity_date,
  c.created_at,
  c.updated_at
FROM companies c
LEFT JOIN deals d ON c.id = d.company_id
LEFT JOIN contacts con ON c.id = con.company_id
LEFT JOIN activities a ON c.id = a.company_id
GROUP BY c.id;

-- HubSpot sync status
CREATE OR REPLACE VIEW v_sync_status WITH (security_invoker = on) AS
SELECT
  entity_type,
  status,
  COUNT(*) AS count,
  MAX(created_at) AS latest_created,
  MAX(processed_at) AS latest_processed
FROM sync_queue
GROUP BY entity_type, status
ORDER BY entity_type, status;
