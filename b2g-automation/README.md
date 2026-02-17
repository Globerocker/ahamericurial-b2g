# B2G Government Contracting Automation

> Automatically find, qualify, and match government contracting opportunities with qualified contractors

## 🚀 Quick Start

### 1. Supabase Setup (2 minutes)

```bash
# Open Supabase SQL Editor
# Execute database/schema.sql
# Execute database/indexes.sql
```

### 2. n8n Environment Variables (3 minutes)

Copy all variables from `config/.env.example` to n8n:
- Settings → Variables → Add each variable

### 3. Import Workflows (5 minutes)

```bash
# In n8n:
# Workflows → Import from File
# Select: workflows/02-vendor-discovery.json
# Configure credentials (Supabase + OpenAI)
```

### 4. Test & Deploy

```bash
# Execute workflow manually
# Verify data in Supabase
# Activate workflow
```

---

## 📁 Project Structure

```
b2g-automation/
├── workflows/                    # n8n workflow JSON files
│   ├── 02-vendor-discovery.json
│   └── b2g-complete-mega-workflow.json  # Complete 4-module workflow
├── database/                     # Supabase SQL scripts
│   ├── schema.sql                # Core tables (6 tables)
│   ├── indexes.sql               # Performance indexes
│   ├── crm-schema.sql            # CRM extension (5 tables) ✨ NEW
│   └── migration-guide.md        # CRM setup guide
├── config/                       # Configuration files
│   └── .env.example              # All API keys & secrets
├── CONTEXT.md                    # System context & memory (for Claude)
├── DEPLOY.md                     # Step-by-step deployment guide
├── CRM-ARCHITECTURE.md           # CRM database explanation ✨ NEW
└── README.md                     # This file
```

---

## 🔑 Required API Keys

| API | Status | Cost | Notes |
|-----|--------|------|-------|
| SAM.gov | ✅ | FREE | 1,000 req/day |
| Google Places | ✅ | ~$1,700/mo | Can optimize to ~$900/mo |
| OpenAI | ⚠️ | ~$15/mo | **Must upgrade to Tier 1** |
| Supabase | ✅ | FREE | 500 MB limit |

---

## 💰 Cost Optimization

**Current**: ~$1,700/month (Google Places heavy)

**Optimized**:
- Limit Google Places to 5 results (not 10) → **-$800/month**
- Cache contractors before API call → **-$300/month**
- **Total: ~$600/month**

---

## 📊 System Flow

```
01 SAM Sentinel (Every 6h)
    ↓ Pull SAM.gov opportunities
    ↓ Filter (Value, Deadline, Location)
    ↓ AI Enrich (tags, complexity, type)
    ↓ Store in Supabase
    ↓
02 Vendor Discovery (Webhook)
    ↓ SAM Vendor Search (FREE, auto-qualify)
    ↓ Google Places (if <5 vendors)
    ↓ AI Screen (readiness ≥ 60)
    ↓ Store contractors
    ↓
03 Match Engine (TODO)
    ↓ Calculate match_score
    ↓ Filter ≥ 75
    ↓ Store matches
    ↓
04 CRM Sync (TODO)
    ↓ Create HubSpot Deal
    ↓ Send Slack notification
```

---

## 🧠 Brain File

See [CONTEXT.md](CONTEXT.md) for:
- Complete system architecture
- Key decisions & rationale
- Database schema
- API integration details
- Troubleshooting guide
- Cost analysis

---

## 📝 TODO

- [ ] Create Workflow 01 (SAM Sentinel)
- [ ] Create Workflow 03 (Match Engine)
- [ ] Create Workflow 04 (CRM Sync)
- [ ] Build web frontend (React/Next.js)
- [ ] Implement contractor caching
- [ ] Cost optimization

---

## 🔧 Troubleshooting

### No opportunities?
- Check SAM_API_KEY in n8n env vars
- Verify hard filters not too strict
- Check workflow_errors table

### Google Places 401?
- Verify GOOGLE_PLACES_API_KEY
- Check billing enabled in Google Console

### High costs?
- Implement contractor caching
- Reduce Google Places results to 5
- See CONTEXT.md for optimization tips

---

**Version**: 1.0.0
**Last Updated**: 2026-02-13
**Status**: Ready for deployment + frontend development
