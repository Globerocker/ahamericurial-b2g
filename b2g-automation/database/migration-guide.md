# CRM Database Migration Guide

## 🎯 Purpose

This extends the B2G system with a **local CRM database** for:
1. **Frontend Dashboard** - Display companies, contacts, deals, pipeline
2. **HubSpot Sync** - Two-way sync with controlled queue
3. **Offline Capability** - Full data access without HubSpot
4. **Performance** - Fast queries for web app
5. **Custom Fields** - Store extra data not in HubSpot

---

## 📋 Execution Order

### Step 1: Execute Core Schema
```bash
# Already done ✅
psql -h [supabase-host] -d postgres -f database/schema.sql
psql -h [supabase-host] -d postgres -f database/indexes.sql
```

### Step 2: Execute CRM Extension
```bash
# New tables for CRM
psql -h [supabase-host] -d postgres -f database/crm-schema.sql
```

### Step 3: Verify Tables
```sql
-- Should show 11 total tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected:
-- 1. opportunities
-- 2. contractors
-- 3. matches
-- 4. failed_opportunities
-- 5. workflow_logs
-- 6. workflow_errors
-- 7. companies (NEW)
-- 8. contacts (NEW)
-- 9. deals (NEW)
-- 10. activities (NEW)
-- 11. sync_queue (NEW)
```

---

## 🔄 Data Flow Changes

### OLD (Current):
```
SAM Opportunity
  ↓
AI Enrich → opportunities table
  ↓
SAM Vendor Search → contractors table
  ↓
Match Engine → matches table
  ↓
HubSpot API (direct) ❌ No local tracking
```

### NEW (With CRM):
```
SAM Opportunity
  ↓
AI Enrich → opportunities table
  ↓
SAM Vendor Search → contractors table
  ↓
Match Engine → matches table
  ↓
CREATE/UPDATE company (from contractor)
  ↓
CREATE deal (from opportunity + match + company)
  ↓
Add to sync_queue → HubSpot API
  ↓
Update hubspot_deal_id ✅ Full tracking
```

---

## 🔧 Required Workflow Updates

### Module 4 Changes (CRM Sync)

**Before Module 4 runs, add these steps:**

#### Step A: Create Company (if new contractor)
```javascript
// After a contractor is inserted
const contractor = $input.item.json;

// Check if company exists
const existingCompany = await supabase
  .from('companies')
  .select('id')
  .eq('contractor_id', contractor.id)
  .single();

if (!existingCompany) {
  // Create company from contractor
  await supabase.from('companies').insert({
    contractor_id: contractor.id,
    source: contractor.source,
    name: contractor.name,
    uei: contractor.uei,
    cage_code: contractor.cage_code,
    website: contractor.website,
    phone: contractor.phone,
    address: contractor.address,
    city: contractor.city,
    state: contractor.state,
    zip: contractor.zip,
    primary_naics: contractor.primary_naics,
    sam_registered: contractor.sam_registered,
    readiness_score: contractor.readiness_score,
    qualification_status: contractor.readiness_score >= 80 ? 'qualified' : 'unqualified',
    lifecycle_stage: 'lead',
    hubspot_sync_status: 'pending'
  });
}
```

#### Step B: Create Deal (from match)
```javascript
// After match is created
const match = $input.item.json;
const opportunity = await getOpportunity(match.opportunity_id);
const company = await getCompanyByContractor(match.contractor_id);

// Create deal
const deal = await supabase.from('deals').insert({
  opportunity_id: match.opportunity_id,
  company_id: company.id,
  match_id: match.id,
  deal_name: `${opportunity.title.substring(0, 50)} - ${company.name}`,
  deal_value: opportunity.estimated_value,
  expected_close_date: opportunity.deadline,
  pipeline: 'b2g_opportunities',
  stage: 'new_match',
  match_score: match.match_score,
  win_probability: Math.round(match.match_score * 0.8), // 80% of match score
  priority: opportunity.priority_flag === 'FAST_TRACK' ? 'high' : 'medium',
  hubspot_sync_status: 'pending'
});

// Add to sync queue
await supabase.from('sync_queue').insert({
  entity_type: 'deal',
  entity_id: deal.id,
  operation: 'create',
  status: 'pending',
  payload: {
    deal_id: deal.id,
    company_id: company.id,
    opportunity_id: opportunity.notice_id
  }
});
```

#### Step C: Process Sync Queue (separate workflow or scheduled)
```javascript
// Get pending syncs
const pendingSyncs = await supabase
  .from('sync_queue')
  .select('*')
  .eq('status', 'pending')
  .order('created_at', { ascending: true })
  .limit(10);

for (const sync of pendingSyncs) {
  try {
    // Update status to in_progress
    await updateSyncStatus(sync.id, 'in_progress');

    if (sync.entity_type === 'company') {
      // Sync company to HubSpot
      const company = await getCompany(sync.entity_id);
      const hubspotResponse = await createOrUpdateHubSpotCompany(company);

      // Update company with HubSpot ID
      await supabase.from('companies')
        .update({
          hubspot_company_id: hubspotResponse.id,
          hubspot_sync_status: 'synced',
          last_hubspot_sync: new Date()
        })
        .eq('id', company.id);

      // Mark sync complete
      await updateSyncStatus(sync.id, 'completed');
    }

    if (sync.entity_type === 'deal') {
      // Sync deal to HubSpot
      const deal = await getDeal(sync.entity_id);
      const company = await getCompany(deal.company_id);

      const hubspotDeal = await createHubSpotDeal({
        dealname: deal.deal_name,
        amount: deal.deal_value,
        dealstage: mapStageToHubSpot(deal.stage),
        closedate: deal.expected_close_date,
        pipeline: 'default',
        match_score: deal.match_score,
        opportunity_id: deal.opportunity_id
      }, company.hubspot_company_id);

      // Update deal with HubSpot ID
      await supabase.from('deals')
        .update({
          hubspot_deal_id: hubspotDeal.id,
          hubspot_sync_status: 'synced',
          last_hubspot_sync: new Date()
        })
        .eq('id', deal.id);

      // Mark sync complete
      await updateSyncStatus(sync.id, 'completed');
    }

  } catch (error) {
    // Mark sync failed, schedule retry
    await updateSyncStatus(sync.id, 'failed', error.message);
  }
}
```

---

## 📊 Frontend Benefits

With this CRM structure, your frontend can now:

### Dashboard Queries
```sql
-- Pipeline Overview
SELECT
  stage,
  COUNT(*) as count,
  SUM(deal_value) as total_value
FROM deals
WHERE stage NOT IN ('closed_won', 'closed_lost')
GROUP BY stage
ORDER BY
  CASE stage
    WHEN 'new_match' THEN 1
    WHEN 'initial_outreach' THEN 2
    WHEN 'contact_made' THEN 3
    WHEN 'qualified' THEN 4
    WHEN 'proposal_sent' THEN 5
    WHEN 'negotiation' THEN 6
  END;

-- Top Companies
SELECT
  c.name,
  c.readiness_score,
  COUNT(d.id) as active_deals,
  SUM(d.deal_value) as pipeline_value
FROM companies c
LEFT JOIN deals d ON c.id = d.company_id
WHERE d.stage NOT IN ('closed_won', 'closed_lost')
GROUP BY c.id
ORDER BY pipeline_value DESC
LIMIT 10;

-- Recent Activities
SELECT
  a.activity_type,
  a.subject,
  c.name as company_name,
  con.full_name as contact_name,
  a.created_at
FROM activities a
LEFT JOIN companies c ON a.company_id = c.id
LEFT JOIN contacts con ON a.contact_id = con.id
ORDER BY a.created_at DESC
LIMIT 20;

-- Win Rate Analysis
SELECT
  DATE_TRUNC('month', closed_at) as month,
  COUNT(*) FILTER (WHERE stage = 'closed_won') as won,
  COUNT(*) FILTER (WHERE stage = 'closed_lost') as lost,
  ROUND(
    COUNT(*) FILTER (WHERE stage = 'closed_won')::numeric /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as win_rate_pct
FROM deals
WHERE closed_at IS NOT NULL
GROUP BY month
ORDER BY month DESC;
```

### REST API Endpoints (for frontend)
```
GET  /api/deals?stage=new_match&limit=20
GET  /api/companies?qualification_status=qualified
GET  /api/contacts?company_id=xxx
GET  /api/activities?deal_id=xxx
POST /api/deals/:id/stage (move deal to next stage)
POST /api/activities (log new activity)
GET  /api/dashboard/stats
```

---

## ⚡ Performance Considerations

1. **Indexes already created** in crm-schema.sql
2. **Views for common queries** (v_active_deals, v_company_engagement)
3. **Pagination** for large result sets
4. **Caching** recommended for dashboard stats (5-minute cache)

---

## 🔄 HubSpot Sync Strategy

### Two-Way Sync
```
Local DB ←→ Sync Queue ←→ HubSpot
```

### Sync Frequency
- **Outbound** (Local → HubSpot): Every 5 minutes via sync queue
- **Inbound** (HubSpot → Local): Webhook on HubSpot changes (optional)

### Conflict Resolution
- **Local is source of truth** for automated matches
- **HubSpot is source of truth** for manual sales updates
- Use `updated_at` timestamp to resolve conflicts

---

## ✅ Next Steps

1. ✅ Execute crm-schema.sql in Supabase
2. ⏳ Update Module 4 workflow to use CRM tables
3. ⏳ Create HubSpot sync workflow (separate from main workflow)
4. ⏳ Build frontend dashboard with these tables
5. ⏳ Add manual data entry UI (for contacts, notes, activities)

---

**Questions?** Check CONTEXT.md or ask!
