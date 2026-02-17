-- ============================================
-- CONTRACTOR APPLICATIONS
-- For contractors who apply via website
-- ============================================

-- ============================================
-- APPLICATION SUBMISSIONS
-- ============================================

CREATE TABLE contractor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Application source
  source TEXT NOT NULL DEFAULT 'website_form' CHECK (source IN ('website_form', 'referral', 'cold_outreach', 'linkedin', 'other')),
  source_details TEXT,

  -- Company basic info
  company_name TEXT NOT NULL,
  legal_business_name TEXT,
  dba_name TEXT,

  -- Contact person
  contact_first_name TEXT NOT NULL,
  contact_last_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  contact_title TEXT,

  -- Business info
  website TEXT,
  linkedin_company TEXT,
  address TEXT,
  city TEXT,
  state TEXT NOT NULL,
  zip TEXT,

  -- Government contracting
  uei TEXT,
  cage_code TEXT,
  sam_registered BOOLEAN DEFAULT FALSE,
  sam_registration_status TEXT CHECK (sam_registration_status IN ('not_registered', 'in_progress', 'active', 'expired')),

  -- Certifications
  certifications TEXT[], -- ['8A', 'SDVOSB', 'WOSB', 'HUBZone', etc.]

  -- Business details
  primary_naics TEXT,
  years_in_business INTEGER,
  annual_revenue_range TEXT CHECK (annual_revenue_range IN ('<100k', '100k-500k', '500k-1m', '1m-5m', '5m-10m', '10m+')),
  employee_count_range TEXT CHECK (employee_count_range IN ('1-10', '11-50', '51-200', '201-500', '501+')),

  -- Capabilities
  service_categories TEXT[] NOT NULL, -- ['IT', 'Construction', 'Engineering', etc.]
  past_government_contracts BOOLEAN DEFAULT FALSE,
  past_contract_details TEXT,

  -- Application details
  motivation TEXT, -- Why they want to work with us
  additional_notes TEXT,

  -- Auto-scoring (AI-generated)
  application_score INTEGER CHECK (application_score BETWEEN 0 AND 100),
  score_reasoning TEXT,
  key_strengths TEXT[],
  key_concerns TEXT[],

  -- Application status
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
    'new',              -- Just submitted
    'under_review',     -- Sales team reviewing
    'approved',         -- Approved, moving to onboarding
    'onboarding',       -- Creating company profile
    'active',           -- Fully onboarded, in system
    'rejected',         -- Not a good fit
    'on_hold'           -- Waitlist/future consideration
  )),

  status_changed_at TIMESTAMPTZ,
  status_changed_by TEXT,
  rejection_reason TEXT,

  -- CRM relationship
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL, -- Created after approval
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  -- Ownership
  assigned_to TEXT, -- Sales rep reviewing
  assigned_at TIMESTAMPTZ,

  -- Follow-up tracking
  last_contacted_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  follow_up_count INTEGER DEFAULT 0,

  -- Metadata
  ip_address INET,
  user_agent TEXT,
  referrer_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  custom_fields JSONB,
  internal_notes TEXT,

  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_contractor_applications_status ON contractor_applications(status);
CREATE INDEX idx_contractor_applications_submitted_at ON contractor_applications(submitted_at DESC);
CREATE INDEX idx_contractor_applications_email ON contractor_applications(contact_email);
CREATE INDEX idx_contractor_applications_company_name ON contractor_applications(company_name);
CREATE INDEX idx_contractor_applications_state ON contractor_applications(state);
CREATE INDEX idx_contractor_applications_score ON contractor_applications(application_score DESC) WHERE application_score IS NOT NULL;
CREATE INDEX idx_contractor_applications_sam_registered ON contractor_applications(sam_registered) WHERE sam_registered = TRUE;
CREATE INDEX idx_contractor_applications_company_id ON contractor_applications(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_contractor_applications_assigned_to ON contractor_applications(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_contractor_applications_new ON contractor_applications(status, submitted_at DESC) WHERE status = 'new';
CREATE INDEX idx_contractor_applications_service_categories ON contractor_applications USING GIN(service_categories);
CREATE INDEX idx_contractor_applications_certifications ON contractor_applications USING GIN(certifications);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_contractor_applications_updated_at
BEFORE UPDATE ON contractor_applications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS
-- ============================================

-- New applications needing review
CREATE VIEW v_applications_pending_review AS
SELECT
  id,
  company_name,
  contact_first_name || ' ' || contact_last_name AS contact_name,
  contact_email,
  contact_phone,
  state,
  sam_registered,
  certifications,
  service_categories,
  application_score,
  status,
  submitted_at,
  assigned_to
FROM contractor_applications
WHERE status IN ('new', 'under_review')
ORDER BY
  CASE WHEN status = 'new' THEN 1 ELSE 2 END,
  application_score DESC NULLS LAST,
  submitted_at DESC;

-- High-quality applications
CREATE VIEW v_applications_high_quality AS
SELECT
  id,
  company_name,
  contact_first_name || ' ' || contact_last_name AS contact_name,
  contact_email,
  state,
  sam_registered,
  certifications,
  application_score,
  score_reasoning,
  key_strengths,
  status,
  submitted_at
FROM contractor_applications
WHERE application_score >= 75
  AND status NOT IN ('rejected', 'active')
ORDER BY application_score DESC, submitted_at DESC;

-- Conversion funnel stats
CREATE VIEW v_application_funnel AS
SELECT
  status,
  COUNT(*) as count,
  ROUND(AVG(application_score), 1) as avg_score,
  COUNT(*) FILTER (WHERE sam_registered = TRUE) as sam_registered_count,
  COUNT(*) FILTER (WHERE certifications IS NOT NULL AND array_length(certifications, 1) > 0) as certified_count,
  MIN(submitted_at) as first_submission,
  MAX(submitted_at) as latest_submission
FROM contractor_applications
GROUP BY status
ORDER BY
  CASE status
    WHEN 'new' THEN 1
    WHEN 'under_review' THEN 2
    WHEN 'approved' THEN 3
    WHEN 'onboarding' THEN 4
    WHEN 'active' THEN 5
    WHEN 'rejected' THEN 6
    WHEN 'on_hold' THEN 7
  END;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to auto-approve high-quality applications
CREATE OR REPLACE FUNCTION auto_approve_high_quality_applications()
RETURNS TRIGGER AS $$
BEGIN
  -- If score >= 85, SAM registered, and has certifications → auto-approve
  IF NEW.application_score >= 85
     AND NEW.sam_registered = TRUE
     AND NEW.certifications IS NOT NULL
     AND array_length(NEW.certifications, 1) > 0
     AND NEW.status = 'new' THEN

    NEW.status = 'approved';
    NEW.status_changed_at = NOW();
    NEW.status_changed_by = 'system_auto_approve';

    -- Add internal note
    NEW.internal_notes = COALESCE(NEW.internal_notes || E'\n\n', '') ||
      'Auto-approved: Score ' || NEW.application_score ||
      ', SAM registered, ' || array_length(NEW.certifications, 1) || ' certification(s). ' ||
      'Submitted: ' || NEW.submitted_at;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-approval
CREATE TRIGGER trigger_auto_approve_applications
BEFORE INSERT OR UPDATE ON contractor_applications
FOR EACH ROW EXECUTE FUNCTION auto_approve_high_quality_applications();

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- Uncomment to insert test data:
/*
INSERT INTO contractor_applications (
  company_name,
  contact_first_name,
  contact_last_name,
  contact_email,
  contact_phone,
  state,
  uei,
  sam_registered,
  certifications,
  service_categories,
  years_in_business,
  annual_revenue_range,
  past_government_contracts,
  motivation,
  application_score,
  score_reasoning,
  key_strengths
) VALUES (
  'TechPro Solutions LLC',
  'John',
  'Smith',
  'john.smith@techpro.com',
  '+1-512-555-0123',
  'TX',
  'ABC123DEF456',
  TRUE,
  ARRAY['8A', 'SDVOSB'],
  ARRAY['IT', 'Cybersecurity'],
  8,
  '1m-5m',
  TRUE,
  'We specialize in cybersecurity for federal agencies and have 10+ years experience.',
  92,
  'Excellent fit: SAM registered, strong certifications, proven track record, high-growth market segment',
  ARRAY['SAM registered with 8A + SDVOSB', 'Past federal contracts', '8 years in business', 'High-demand service category']
);
*/
