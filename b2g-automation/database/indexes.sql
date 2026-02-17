-- ============================================
-- B2G SYSTEM - DATABASE INDEXES
-- Performance optimization
-- ============================================

-- ============================================
-- OPPORTUNITIES INDEXES
-- ============================================

CREATE INDEX idx_opportunities_notice_id ON opportunities(notice_id);
CREATE INDEX idx_opportunities_state ON opportunities(state);
CREATE INDEX idx_opportunities_deadline ON opportunities(deadline);
CREATE INDEX idx_opportunities_estimated_value ON opportunities(estimated_value DESC);
CREATE INDEX idx_opportunities_contractor_type ON opportunities(contractor_type);
CREATE INDEX idx_opportunities_complexity_score ON opportunities(complexity_score);
CREATE INDEX idx_opportunities_created_at ON opportunities(created_at DESC);
CREATE INDEX idx_opportunities_service_tags ON opportunities USING GIN(service_tags);
CREATE INDEX idx_opportunities_required_capabilities ON opportunities USING GIN(required_capabilities);
CREATE INDEX idx_opportunities_risk_flags ON opportunities USING GIN(risk_flags);
CREATE INDEX idx_opportunities_raw_json ON opportunities USING GIN(raw_json);

-- Priority indexes
CREATE INDEX idx_opportunities_priority_flag ON opportunities(priority_flag);
CREATE INDEX idx_opportunities_priority_score ON opportunities(priority_score DESC);
CREATE INDEX idx_opportunities_ai_parse_error ON opportunities(ai_parse_error) WHERE ai_parse_error = TRUE;


-- ============================================
-- CONTRACTORS INDEXES (Updated for SAM + Bing)
-- ============================================

-- Source tracking
CREATE INDEX idx_contractors_source ON contractors(source);
CREATE INDEX idx_contractors_sam_registered ON contractors(sam_registered) WHERE sam_registered = TRUE;

-- SAM.gov specific
CREATE INDEX idx_contractors_uei ON contractors(uei) WHERE uei IS NOT NULL;
CREATE INDEX idx_contractors_cage_code ON contractors(cage_code) WHERE cage_code IS NOT NULL;
CREATE INDEX idx_contractors_primary_naics ON contractors(primary_naics);

-- General lookup
CREATE INDEX idx_contractors_name ON contractors(name);
CREATE INDEX idx_contractors_state ON contractors(state);
CREATE INDEX idx_contractors_readiness_score ON contractors(readiness_score DESC);
CREATE INDEX idx_contractors_created_at ON contractors(created_at DESC);

-- Array indexes
CREATE INDEX idx_contractors_certifications ON contractors USING GIN(certifications);
CREATE INDEX idx_contractors_business_types ON contractors USING GIN(business_types);


-- ============================================
-- MATCHES INDEXES
-- ============================================

CREATE INDEX idx_matches_opportunity_id ON matches(opportunity_id);
CREATE INDEX idx_matches_contractor_id ON matches(contractor_id);
CREATE INDEX idx_matches_match_score ON matches(match_score DESC);
CREATE INDEX idx_matches_created_at ON matches(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_matches_opp_score ON matches(opportunity_id, match_score DESC);
CREATE INDEX idx_matches_contractor_score ON matches(contractor_id, match_score DESC);


-- ============================================
-- FAILED OPPORTUNITIES INDEXES
-- ============================================

CREATE INDEX idx_failed_opportunities_notice_id ON failed_opportunities(notice_id);
CREATE INDEX idx_failed_opportunities_resolved ON failed_opportunities(resolved) WHERE resolved = FALSE;
CREATE INDEX idx_failed_opportunities_created_at ON failed_opportunities(created_at DESC);
CREATE INDEX idx_failed_opportunities_error_type ON failed_opportunities(error_type);


-- ============================================
-- WORKFLOW LOGS INDEXES
-- ============================================

CREATE INDEX idx_workflow_logs_timestamp ON workflow_logs(timestamp DESC);
CREATE INDEX idx_workflow_logs_event_type ON workflow_logs(event_type);
CREATE INDEX idx_workflow_logs_notice_id ON workflow_logs(notice_id) WHERE notice_id IS NOT NULL;


-- ============================================
-- WORKFLOW ERRORS INDEXES
-- ============================================

CREATE INDEX idx_workflow_errors_timestamp ON workflow_errors(timestamp DESC);
CREATE INDEX idx_workflow_errors_workflow ON workflow_errors(workflow_name);
CREATE INDEX idx_workflow_errors_node_name ON workflow_errors(node_name);
