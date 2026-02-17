# 🤖 AI ASSISTANT BRIEFING - AMERICURIAL B2G PROJECT

**Purpose**: Dieses Dokument enthält ALLE Informationen, die eine KI braucht, um autonom am B2G-Projekt zu arbeiten.
**Created**: 2026-02-16
**Owner**: Andres Schuler

---

## 🔐 CREDENTIALS & ACCESS

### Supabase Database
```
Project ID: udilwmuanpkuqmktmrst
Dashboard: https://supabase.com/dashboard/project/udilwmuanpkuqmktmrst

NEXT_PUBLIC_SUPABASE_URL=https://udilwmuanpkuqmktmrst.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkaWx3bXVhbnBrdXFta3RtcnN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwODcwMzAsImV4cCI6MjA4NjY2MzAzMH0.U-uOHXYN6L_jRTHdGq8n2UkzIFp_C3JcQHEXPpCDZEk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkaWx3bXVhbnBrdXFta3RtcnN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA4NzAzMCwiZXhwIjoyMDg2NjYzMDMwfQ.a6qBLGKL0_qdu-ye7OYc6ZUD1vxdkRt3ahcYP9lbaSo
```

**SQL Editor**: https://supabase.com/dashboard/project/udilwmuanpkuqmktmrst/sql/new

### n8n Workflow Server
```
Server URL: https://n8n.srv1113360.hstgr.cloud
Dashboard: https://n8n.srv1113360.hstgr.cloud

N8N_URL=https://n8n.srv1113360.hstgr.cloud
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZDg5MWM0MS1hNTQ3LTRjMmItODVkOS0zYWFjZWI4OGJkY2MiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiN2ViMmEzNTktOTIwYS00ZjVjLTgxMjktYWYyYmQ1YjY5ZWU0IiwiaWF0IjoxNzcxMjU1MDM0fQ.bSxuM8llJPf1L5jNnuEy4QXJr5OHB6ge8mfvXRSw6sI
N8N_WORKFLOW_ID=nHnUprASEu85qJ6G

# Main Workflow
Workflow Name: "B2G Complete System – SAM → Vendors → Matching → CRM (No HubSpot)"
Workflow ID: nHnUprASEu85qJ6G

# Webhook URLs
N8N_VENDOR_DISCOVERY_WEBHOOK_URL=https://n8n.srv1113360.hstgr.cloud/webhook/vendor-discovery
```

**API Endpoint**: `https://n8n.srv1113360.hstgr.cloud/api/v1`
**Header**: `X-N8N-API-KEY: <N8N_API_KEY>`

### HubSpot CRM
```
HUBSPOT_API_KEY=na2-d10d-4d74-4405-8c2a-b60ff58b55c6
HUBSPOT_PORTAL_ID=245197783
```

### SAM.gov API
```
API Key: SAM-6507bbc9-5e20-463b-97b7-fe4f55493147
Base URL: https://api.sam.gov/opportunities/v2/search
```

**NAICS Codes** (14 aktive):
```
541511,541512,541513,541519,518210,611420,541330,561210,562910,541620,541618,541690,561621,561730
```

---

## 📁 PROJECT STRUCTURE

### Main Directory
```
/Users/andreschuler/Ahamericurial B2G /
├── b2g-frontend/              # Next.js Frontend
├── b2g-automation/            # n8n Workflows & Database Migrations
├── AI_ASSISTANT_BRIEFING.md   # THIS FILE
├── READY_FOR_LAUNCH.md        # Deployment Status
├── IMPLEMENTATION_CHECKLIST.md # Implementation Guide
└── N8N_NAICS_UPDATE.md        # NAICS Update Guide
```

### Frontend (Next.js 14)
```
/Users/andreschuler/Ahamericurial B2G /b2g-frontend/
├── .env.local                 # Environment variables (ALL CREDENTIALS)
├── src/
│   ├── app/
│   │   ├── opportunities/page.tsx       # Main opportunities dashboard
│   │   ├── settings/page.tsx            # Settings hub
│   │   ├── settings/profile/page.tsx    # Profile settings
│   │   ├── settings/notifications/page.tsx # Notification settings
│   │   └── api/
│   │       ├── trigger-sam-sync/route.ts    # SAM.gov sync trigger
│   │       └── match-opportunities/route.ts  # Matching algorithm
│   ├── components/
│   │   ├── opportunities/
│   │   │   ├── opportunities-list.tsx   # Grid display (200 opps)
│   │   │   └── opportunity-details.tsx  # Opportunity interface
│   │   └── layout/
│   │       ├── notification-center.tsx  # Bell icon notification center
│   │       └── sidebar.tsx              # Left navigation
│   └── lib/
│       └── supabase.ts                  # Supabase client
└── package.json
```

**Dev Server**: `cd b2g-frontend && npm run dev` → http://localhost:3000
**Production Build**: `npm run build`

### Database Schema (Supabase PostgreSQL)

**Main Tables**:
- `opportunities` - Government contract opportunities from SAM.gov
- `contractors` - Registered vendors/contractors
- `matches` - AI-matched opportunities to contractors
- `leads` - Landing page quiz leads
- `failed_opportunities` - Error tracking

**Key Columns Added** (2026-02-16):
```sql
-- opportunities table
ai_summary TEXT
key_requirements TEXT[]
win_probability INTEGER (0-100)
competition_level TEXT ('Low'|'Medium'|'High')
recommended_action TEXT
estimated_bidders TEXT

-- contractors table
ai_summary TEXT
ceo_name TEXT
ceo_linkedin TEXT
company_size TEXT
specializations TEXT[]
```

---

## 🛠️ COMMON TASKS FOR AI ASSISTANCE

### 1. Update n8n Workflow NAICS Codes

**API Method** (versuchen):
```bash
# Fetch workflow
curl -X GET "https://n8n.srv1113360.hstgr.cloud/api/v1/workflows/nHnUprASEu85qJ6G" \
  -H "X-N8N-API-KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Node to update: id="sam-api", name="📡 SAM.gov API"
# Parameter: queryParameters.parameters[] where name="naics"
# New value: 541511,541512,541513,541519,518210,611420,541330,561210,562910,541620,541618,541690,561621,561730
```

**Manual Method** (falls API nicht klappt):
1. n8n Dashboard öffnen
2. Workflow "B2G Complete System" öffnen
3. Node "📡 SAM.gov API" klicken
4. Query Parameters → naics parameter updaten
5. Save

### 2. Execute Database Migration

**Via Supabase SQL Editor**:
```sql
-- Template für neue Spalten
ALTER TABLE <table_name> ADD COLUMN IF NOT EXISTS <column_name> <type>;

-- Template für Indexes
CREATE INDEX IF NOT EXISTS <index_name> ON <table> (<column>);

-- Template für RLS Policies
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
CREATE POLICY <policy_name> ON <table> FOR ALL USING (auth.role() = 'service_role');
```

**Migration Files Location**:
```
/Users/andreschuler/Ahamericurial B2G /b2g-automation/database/
```

### 3. Update Frontend Components

**Wichtige Dateien**:
- Opportunities Grid: `/b2g-frontend/src/components/opportunities/opportunities-list.tsx`
- Opportunity Limit: `/b2g-frontend/src/app/opportunities/page.tsx` (line 25: `.limit(200)`)
- Settings: `/b2g-frontend/src/app/settings/`

**Nach Änderungen**:
```bash
cd "/Users/andreschuler/Ahamericurial B2G /b2g-frontend"
npm run build  # Test build
npm run dev    # Start dev server
```

### 4. Trigger SAM.gov Sync

**Via Frontend**:
- http://localhost:3000/opportunities → "Sync SAM.gov" button

**Via API**:
```bash
curl -X POST "http://localhost:3000/api/trigger-sam-sync"
```

**Via n8n**:
- Manual trigger in n8n workflow execution

### 5. Check Database Records

**Quick Queries**:
```sql
-- Count opportunities
SELECT COUNT(*) FROM opportunities;

-- Recent opportunities
SELECT notice_id, title, agency, created_at
FROM opportunities
ORDER BY created_at DESC
LIMIT 10;

-- NAICS distribution
SELECT naics, COUNT(*)
FROM opportunities
GROUP BY naics
ORDER BY COUNT(*) DESC;

-- Matches overview
SELECT COUNT(*) FROM matches;
SELECT COUNT(*) FROM matches WHERE crm_synced = TRUE;
```

---

## 🚀 QUICK START COMMANDS

### Start Development
```bash
cd "/Users/andreschuler/Ahamericurial B2G /b2g-frontend"
npm run dev
# Open http://localhost:3000
```

### Run Production Build
```bash
cd "/Users/andreschuler/Ahamericurial B2G /b2g-frontend"
npm run build
npm run start
```

### Execute Database Migration
1. Open: https://supabase.com/dashboard/project/udilwmuanpkuqmktmrst/sql/new
2. Paste SQL from migration file
3. Click RUN

### Update n8n Workflow
1. Open: https://n8n.srv1113360.hstgr.cloud
2. Find workflow: nHnUprASEu85qJ6G
3. Edit node parameters
4. Save workflow

---

## 📊 CURRENT STATE (2026-02-16)

### ✅ Completed
- Frontend: 100% implemented
  - 200 opportunities grid display
  - Profile settings page
  - Notifications settings page
  - Notification center (bell icon)
  - Settings hub
- Database: Schema enhanced with AI columns
- Build: Production-ready, all tests passed
- Security: Credentials moved to .env.local

### 🔄 In Progress
- n8n NAICS codes: Needs update to 14 codes
- SAM.gov sync: Ready to test with new codes

### 📋 Todo
- AI enrichment workflow (Phase 2)
- Landing page quiz funnel (Phase 3)
- Advanced analytics (Phase 4)

---

## 🎯 TYPICAL AI TASKS

### When User Says: "Update the workflow"
1. Connect to n8n API
2. Fetch workflow nHnUprASEu85qJ6G
3. Find and update the specified node
4. Save back via API
5. Report success

### When User Says: "Add database column"
1. Create ALTER TABLE statement with IF NOT EXISTS
2. Add appropriate indexes
3. Provide SQL for Supabase SQL Editor
4. Or attempt to execute via Supabase API

### When User Says: "Fix frontend issue"
1. Read relevant component files
2. Identify issue
3. Propose fix
4. Update files
5. Run build to verify

### When User Says: "Check database"
1. Provide SQL queries to run in Supabase
2. Or explain what to check in Table Editor
3. Interpret results

---

## 🔧 TROUBLESHOOTING REFERENCE

### Frontend won't build
```bash
cd b2g-frontend
rm -rf .next node_modules/.cache
npm install
npm run build
```

### Database connection fails
1. Check Supabase project is active
2. Verify credentials in .env.local
3. Test with simple query in SQL Editor

### n8n workflow errors
1. Check execution logs in n8n dashboard
2. Verify API credentials are valid
3. Check SAM.gov API rate limits

### Sync not working
1. Verify workflow is active (green toggle)
2. Check NAICS codes are updated
3. Review execution logs
4. Check database inserts happening

---

## 📞 IMPORTANT URLS

| Service | URL |
|---------|-----|
| Frontend Dev | http://localhost:3000 |
| Frontend Prod | TBD (Vercel deployment) |
| Supabase Dashboard | https://supabase.com/dashboard/project/udilwmuanpkuqmktmrst |
| Supabase SQL Editor | https://supabase.com/dashboard/project/udilwmuanpkuqmktmrst/sql/new |
| Supabase Table Editor | https://supabase.com/dashboard/project/udilwmuanpkuqmktmrst/editor |
| n8n Dashboard | https://n8n.srv1113360.hstgr.cloud |
| n8n Workflows | https://n8n.srv1113360.hstgr.cloud/workflows |
| n8n Executions | https://n8n.srv1113360.hstgr.cloud/executions |
| SAM.gov API Docs | https://open.gsa.gov/api/opportunities-api/ |

---

## 💡 AI ASSISTANT GUIDELINES

### DO:
✅ Use API credentials to automate tasks
✅ Read .env.local for latest credentials
✅ Execute SQL via Supabase SQL Editor guidance
✅ Update n8n workflows via API when possible
✅ Run builds and tests before confirming changes
✅ Provide exact commands and SQL statements
✅ Create backup/rollback procedures

### DON'T:
❌ Store credentials in cloud databases
❌ Share credentials in responses (reference .env.local instead)
❌ Make destructive changes without confirmation
❌ Skip build validation after code changes
❌ Assume database schema without checking
❌ Update production without testing

---

## 🔄 QUICK REFERENCE: Environment Variables

**File**: `/Users/andreschuler/Ahamericurial B2G /b2g-frontend/.env.local`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://udilwmuanpkuqmktmrst.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkaWx3bXVhbnBrdXFta3RtcnN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwODcwMzAsImV4cCI6MjA4NjY2MzAzMH0.U-uOHXYN6L_jRTHdGq8n2UkzIFp_C3JcQHEXPpCDZEk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkaWx3bXVhbnBrdXFta3RtcnN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA4NzAzMCwiZXhwIjoyMDg2NjYzMDMwfQ.a6qBLGKL0_qdu-ye7OYc6ZUD1vxdkRt3ahcYP9lbaSo

# n8n Configuration
N8N_URL=https://n8n.srv1113360.hstgr.cloud
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZDg5MWM0MS1hNTQ3LTRjMmItODVkOS0zYWFjZWI4OGJkY2MiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiN2ViMmEzNTktOTIwYS00ZjVjLTgxMjktYWYyYmQ1YjY5ZWU0IiwiaWF0IjoxNzcxMjU1MDM0fQ.bSxuM8llJPf1L5jNnuEy4QXJr5OHB6ge8mfvXRSw6sI
N8N_WORKFLOW_ID=nHnUprASEu85qJ6G
N8N_VENDOR_DISCOVERY_WEBHOOK_URL=https://n8n.srv1113360.hstgr.cloud/webhook/vendor-discovery

# HubSpot
HUBSPOT_API_KEY=na2-d10d-4d74-4405-8c2a-b60ff58b55c6
HUBSPOT_PORTAL_ID=245197783
```

---

**Status**: READY FOR USE ✅
**Last Updated**: 2026-02-16
**Version**: 1.0

**Usage**: Paste this entire document into a new AI conversation to give full context and access to the project.
