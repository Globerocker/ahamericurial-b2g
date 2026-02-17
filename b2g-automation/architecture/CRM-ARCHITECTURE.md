# 🏢 CRM Architecture - B2G System

## 🎯 Warum lokale CRM-Datenbank?

**Problem ohne CRM-Tables**:
- ❌ Frontend kann nur Rohdaten anzeigen (opportunities, contractors)
- ❌ Keine Sales-Pipeline Visualisierung
- ❌ Kein Contact Management
- ❌ Keine Activity/Communication History
- ❌ HubSpot Sync = Black Box (keine lokale Kontrolle)

**Lösung mit CRM-Tables**:
- ✅ Vollständiges Dashboard mit Pipeline-Stages
- ✅ Contact & Company Management
- ✅ Activity Tracking (Emails, Calls, Meetings)
- ✅ HubSpot Sync mit Queue & Error Handling
- ✅ Offline-Fähigkeit (Frontend funktioniert ohne HubSpot)
- ✅ Custom Fields & Business Logic

---

## 📊 Datenbank-Struktur

### Core Tables (Bereits vorhanden)
```
opportunities       → SAM.gov Ausschreibungen
contractors         → Gefundene Vendors (SAM + Google Places)
matches             → Scoring zwischen Opportunity ↔ Contractor
```

### CRM Tables (NEU)
```
companies           → Strukturierte Company-Profile (aus contractors)
contacts            → Ansprechpartner bei Companies
deals               → Sales Pipeline (aus opportunities + matches)
activities          → Kommunikations-History
sync_queue          → HubSpot Sync Management
```

---

## 🔄 Data Flow

### Alt (ohne CRM):
```
SAM Opportunity
  ↓
Match Engine
  ↓
HubSpot API ❌ Keine lokale Kontrolle
```

### Neu (mit CRM):
```
SAM Opportunity
  ↓
Match Engine → match
  ↓
CREATE company (from contractor)
  ↓
CREATE deal (from opportunity + match + company)
  ↓
Sync Queue → HubSpot API ✅ Vollständige Kontrolle
```

---

## 💼 CRM Entities Erklärt

### 1. Companies
**Was**: Strukturierte Company-Profile (enhanced contractors)

**Wichtige Felder**:
- `contractor_id` → Link zu Rohdaten
- `qualification_status` → `unqualified | qualified | hot_lead | customer`
- `lifecycle_stage` → `lead | mql | sql | opportunity | customer`
- `readiness_score` → 0-100 (aus AI Screening)
- `total_deals`, `total_won_deals`, `total_revenue` → Engagement-Metriken
- `hubspot_company_id` → Link zu HubSpot
- `hubspot_sync_status` → `pending | synced | failed`

**Use Cases**:
- Dashboard: Top qualified companies
- Frontend: Company detail page
- Sales: Lead prioritization

### 2. Contacts
**Was**: Personen bei Companies

**Wichtige Felder**:
- `company_id` → Zugehörige Company
- `is_primary_contact` → Hauptansprechpartner?
- `is_decision_maker` → Entscheider?
- `job_title`, `department`, `seniority`
- `preferred_contact_method` → `email | phone | linkedin`

**Use Cases**:
- Frontend: Contact list per company
- Sales: Who to reach out to
- Activity tracking: Who did we call/email?

### 3. Deals
**Was**: Sales Pipeline (Opportunity + Match + Company kombiniert)

**Pipeline Stages**:
1. `new_match` → Gerade gematcht (automatisch)
2. `initial_outreach` → Erste Email/Call gesendet
3. `contact_made` → Sie haben geantwortet
4. `qualified` → Confirmed fit, sinnvolle Opportunity
5. `proposal_sent` → RFP/Proposal submitted
6. `negotiation` → Contract negotiation
7. `closed_won` → Gewonnen! 🎉
8. `closed_lost` → Verloren 😞

**Wichtige Felder**:
- `match_score` → Aus Match Engine (0-100)
- `win_probability` → Geschätzte Win-Chance (0-100)
- `priority` → `low | medium | high | critical`
- `lost_reason` → Wenn lost: `price | timing | competitor | no_response`
- `expected_close_date` → Aus opportunity deadline
- `deal_value` → Aus opportunity estimated_value

**Use Cases**:
- Dashboard: Pipeline-Visualisierung (Kanban Board)
- Sales: Deal tracking & forecasting
- Analytics: Win rate, average deal size, sales velocity

### 4. Activities
**Was**: Communication & Interaction History

**Activity Types**:
- `email_sent`, `email_received`
- `call_made`, `call_received`
- `meeting_scheduled`, `meeting_completed`
- `note_added`
- `proposal_sent`, `contract_sent`
- `document_signed`

**Wichtige Felder**:
- `company_id`, `contact_id`, `deal_id` → Context
- `subject`, `description`, `outcome`
- `scheduled_at`, `completed_at`, `duration_minutes`
- `created_by` → Welcher Sales Rep?

**Use Cases**:
- Frontend: Activity timeline per deal/company
- Sales: "When did we last contact them?"
- Analytics: Activity volume, response rates

### 5. Sync Queue
**Was**: HubSpot Sync Management mit Retry-Logik

**Wichtige Felder**:
- `entity_type` → `company | contact | deal | activity`
- `entity_id` → UUID des zu synchenden Records
- `operation` → `create | update | delete`
- `status` → `pending | in_progress | completed | failed`
- `attempts`, `max_attempts` → Retry counter
- `next_retry_at` → Wann nächster Versuch?

**Use Cases**:
- Robuster HubSpot Sync (auto-retry bei Fehlern)
- Monitoring: Wie viele Syncs pending/failed?
- Debugging: Warum ist Sync fehlgeschlagen?

---

## 🎨 Frontend Dashboard Möglichkeiten

### Pipeline Overview
```sql
SELECT
  stage,
  COUNT(*) as deal_count,
  SUM(deal_value) as total_value,
  AVG(win_probability) as avg_win_prob
FROM deals
WHERE stage NOT IN ('closed_won', 'closed_lost')
GROUP BY stage;
```

**Visualisierung**: Kanban Board mit Stages

### Top Companies (Hot Leads)
```sql
SELECT
  name,
  readiness_score,
  qualification_status,
  total_deals,
  (SELECT COUNT(*) FROM deals WHERE company_id = companies.id AND stage NOT IN ('closed_won', 'closed_lost')) as active_deals
FROM companies
WHERE qualification_status IN ('qualified', 'hot_lead')
ORDER BY readiness_score DESC
LIMIT 10;
```

**Visualisierung**: Company Cards mit Score

### Recent Activities
```sql
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
```

**Visualisierung**: Activity Feed

### Win Rate Analytics
```sql
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

**Visualisierung**: Line Chart

### Sales Velocity
```sql
SELECT
  stage,
  AVG(EXTRACT(EPOCH FROM (stage_changed_at - created_at))/86400) as avg_days_in_stage
FROM deals
GROUP BY stage;
```

**Visualisierung**: Bar Chart

---

## 🔧 Workflow Updates Needed

### Module 4 erweitern (nach Match Creation):

**Step 1: Create/Update Company**
```javascript
// Nach contractor insert
const contractor = $input.item.json;

// Check if company exists
let company = await supabase
  .from('companies')
  .select('*')
  .eq('contractor_id', contractor.id)
  .single();

if (!company) {
  // Create new company
  company = await supabase.from('companies').insert({
    contractor_id: contractor.id,
    source: contractor.source,
    name: contractor.name,
    uei: contractor.uei,
    sam_registered: contractor.sam_registered,
    readiness_score: contractor.readiness_score,
    qualification_status: contractor.readiness_score >= 80 ? 'qualified' : 'unqualified',
    lifecycle_stage: 'lead',
    hubspot_sync_status: 'pending'
  }).single();
} else {
  // Update existing company
  await supabase.from('companies')
    .update({
      total_matches: company.total_matches + 1,
      last_activity_at: new Date()
    })
    .eq('id', company.id);
}
```

**Step 2: Create Deal**
```javascript
// Nach match insert
const match = $input.item.json;
const opportunity = await getOpportunity(match.opportunity_id);
const company = await getCompanyByContractorId(match.contractor_id);

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
  win_probability: Math.round(match.match_score * 0.8),
  priority: opportunity.priority_flag === 'FAST_TRACK' ? 'high' : 'medium',
  hubspot_sync_status: 'pending'
}).single();

// Add to sync queue
await supabase.from('sync_queue').insert({
  entity_type: 'deal',
  entity_id: deal.id,
  operation: 'create',
  status: 'pending'
});
```

**Step 3: Log Activity**
```javascript
// Nach deal creation
await supabase.from('activities').insert({
  company_id: company.id,
  deal_id: deal.id,
  activity_type: 'note_added',
  subject: 'New match created',
  description: `Auto-matched with score ${match.match_score}/100 for opportunity: ${opportunity.title}`,
  created_by: 'system'
});
```

---

## 🚀 Deployment

### 1. Execute CRM Schema
```bash
# In Supabase SQL Editor
-- Execute: database/crm-schema.sql
```

### 2. Verify Tables
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected: 11 tables total (6 core + 5 CRM)
```

### 3. Update Workflow
- Siehe `database/migration-guide.md` für Code-Beispiele
- Füge Company/Deal Creation nach Match hinzu
- Implementiere Sync Queue Processing

---

## 📈 Next Steps

1. ✅ CRM Schema deployed
2. ⏳ Update Module 4 workflow with CRM logic
3. ⏳ Create HubSpot Sync Worker (separate workflow)
4. ⏳ Build Frontend Dashboard (React/Next.js)
5. ⏳ Add manual data entry UI

---

## 🤔 Fragen?

**"Brauchen wir wirklich alle 5 Tabellen?"**
→ Ja! Für ein vollständiges CRM-Frontend brauchst du Companies, Contacts, Deals, Activities, Sync Queue.

**"Können wir nicht einfach HubSpot direkt nutzen?"**
→ Kannst du, aber: Langsamer (API calls), teurer (API limits), keine Offline-Fähigkeit, kein Custom Logic.

**"Was ist mit Daten-Duplikation?"**
→ Korrekt - contractors + companies haben Overlap. Aber: contractors = Rohdaten, companies = CRM-enriched. Ist so designed.

**"Wie oft synchen wir mit HubSpot?"**
→ Sync Queue processed alle 5 Minuten. Bei Fehlern: Auto-retry 3x.
