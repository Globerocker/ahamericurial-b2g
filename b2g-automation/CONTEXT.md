# B2G Automation System - Context & Memory

> **Brain File for Claude**: Complete system context for future reference

## Project Overview

**Name**: B2G (Business-to-Government) Contract Automation System
**Goal**: Automatically find, qualify, and match government contracting opportunities with qualified contractors
**Status**: Phase 1 - Workflows 01-02 Ready for Deployment
**Next**: Web App Frontend Development

---

## System Architecture

### Module Flow

```
01 SAM Sentinel (Every 6h)
    ↓
Pull SAM.gov opportunities → Filter → AI Enrich → Store in Supabase
    ↓
02 Vendor Discovery (Webhook triggered)
    ↓
SAM Vendor Search → Google Places (if <5) → AI Screen → Store contractors
    ↓
03 Match Engine (TODO)
    ↓
Calculate match_score → Filter ≥75 → Store matches
    ↓
04 CRM Sync (TODO)
    ↓
Create HubSpot Deal → Send Slack notification
```

---

## Key Architecture Decisions

### 1. Contractor Discovery Strategy

**CHANGED from original plan:**
- ❌ ~~Bing Web Search API~~ (was planned)
- ✅ **Google Places API** (user has API key, easier integration)

**Priority**:
1. **SAM Vendor Search** (Primary) - FREE, gov-registered companies
2. **Google Places API** (Secondary) - If <5 SAM vendors found

**Why**:
- SAM vendors auto-qualify (readiness_score = 100)
- Google Places: AI screening required (readiness ≥ 60 to store)

### 2. Geographic Focus (Phase 1)

**States**: TX, FL, CA, NY only
**Reason**: Manageable volume for testing
**Future**: Expand to all 50 states

### 3. NAICS Codes (Hardcoded)

```
541512 - Computer Systems Design Services
541519 - Other Computer Related Services
236220 - Commercial Building Construction
541330 - Engineering Services
561210 - Facilities Support Services
562910 - Environmental Remediation Services
```

### 4. AI Strategy

**Model**: gpt-4o-mini (cost-effective)
**Temperature**: 0.2-0.3 (consistent output)
**Usage**:
- Opportunity enrichment (complexity_score, service_tags, contractor_type)
- Contractor screening (readiness_score 0-100)

**Robust Fallback**:
- Parse errors → NULL values + flag in database
- Logged to workflow_errors table
- No silent failures

### 5. Priority Scoring

**Opportunities get priority_flag**:
- FAST_TRACK: complexity ≤ 2
- STANDARD: complexity = 3
- REVIEW_REQUIRED: complexity ≥ 4

**priority_score** (0-100):
- Value score (max 40): $0-50K=10, $50-100K=20, $100-250K=30, $250K+=40
- Complexity score (max 30): Lower complexity = higher priority
- Deadline score (max 30): Closer deadline = higher urgency

---

## Database Schema

### Core Tables

1. **opportunities**
   - SAM.gov contract opportunities
   - AI enriched: service_tags, complexity_score, contractor_type
   - Priority fields: priority_flag, priority_score
   - Unique key: notice_id

2. **contractors**
   - From SAM.gov Entity API or Google Places
   - Source tracking: SAM_VENDOR | GOOGLE_PLACES
   - SAM-specific: uei, cage_code, registration_date
   - Readiness: readiness_score (0-100)
   - Unique key: uei (SAM) or place_id (Google)

3. **matches**
   - Opportunity ↔ Contractor pairings
   - match_score calculation (0-100)
   - SAM vendors get +10 bonus
   - Only store if match_score ≥ 75

4. **failed_opportunities**
   - Dead letter queue
   - Stores failed inserts for retry
   - Prevents data loss

5. **workflow_logs**
   - Audit trail

6. **workflow_errors**
   - Error tracking for debugging

---

## API Integrations

### Required APIs

| API | Purpose | Cost | Status |
|-----|---------|------|--------|
| **SAM.gov Opportunities API** | Pull contract opportunities | FREE | ✅ Have key |
| **SAM.gov Entity Management API** | Search registered vendors | FREE | ✅ Same key |
| **Google Places API** | Find local contractors | ~$0.032 per search + details | ✅ Have key |
| **OpenAI API** | AI enrichment + screening | ~$15/month | ⚠️ Need Tier 1 |
| **Supabase** | PostgreSQL database | FREE (500MB) | ✅ Configured |
| **HubSpot API** (future) | CRM deal creation | FREE | ⏳ TODO |
| **Slack Webhooks** (future) | Notifications | FREE | ⏳ TODO |

### Credentials (Reference)

```bash
SUPABASE_URL=https://udilwmuanpkuqmktmrst.supabase.co
SUPABASE_KEY=[service_role_key provided]
GOOGLE_PLACES_API_KEY=AIzaSyA3Cp7JXWH0O7pnqxfUCS2JmX_ia0tLuV0
N8N_API_KEY=[provided]
SAM_API_KEY=[user needs to add]
AI_API_KEY=[user needs to add + upgrade to Tier 1]
```

---

## Expected Costs (Monthly)

### Phase 1 (Current)

| Service | Usage | Cost |
|---------|-------|------|
| SAM.gov APIs | 720 requests | FREE |
| Google Places Text Search | ~150 searches/day × 30 | $153 |
| Google Places Details | ~1,500 details/day × 30 | $1,530 |
| OpenAI (gpt-4o-mini) | ~60k calls | $15 |
| Supabase | 10MB/month | FREE |
| **TOTAL** | | **~$1,698/month** |

**Note**: Google Places is expensive! Consider:
- Caching contractors (dedup before API call)
- Limit to Top 5 results instead of 10
- Only fetch Details if preliminary score >70

### Optimization Potential

If we limit Google Places to 5 results and cache aggressively:
- Text Search: 150/day → $153/month
- Place Details: 750/day → $765/month
- **Total: ~$933/month** (45% savings)

---

## Deployment Status

### ✅ Completed

- [x] Database schema defined (schema.sql)
- [x] Indexes optimized (indexes.sql)
- [x] Workflow 02 (Vendor Discovery) with Google Places
- [x] Architecture documentation
- [x] Clean project structure

### ⏳ Pending

- [ ] Workflow 01 (SAM Sentinel) - needs to be extracted/created
- [ ] Workflow 03 (Match Engine)
- [ ] Workflow 04 (CRM Sync)
- [ ] Web frontend (Next step!)

### 🔧 Required Actions (User)

1. **Supabase Setup** (2 min)
   - Execute `/database/schema.sql`
   - Execute `/database/indexes.sql`

2. **n8n Environment Variables** (3 min)
   - Add all API keys to n8n

3. **Import Workflows** (5 min)
   - Import 02-vendor-discovery.json
   - Configure credentials

4. **OpenAI Tier 1 Upgrade** (5 min)
   - Add $5 credit → Tier 1 (500 RPM)

---

## Known Issues & Considerations

### 1. Google Places Costs

**Problem**: $1,698/month is expensive
**Mitigation**:
- Aggressive caching (check contractors table before API call)
- Limit results to 5 instead of 10
- Only call Place Details if basic info promising

### 2. SAM.gov Rate Limits

**Limit**: 1,000 requests/day
**Current Usage**: ~10-20/day (safe)
**Risk**: LOW

### 3. OpenAI Rate Limits

**Free Tier**: 3 RPM (too slow)
**Tier 1**: 500 RPM (required)
**Action**: User must deposit $5

### 4. Deduplication

**Opportunities**: By notice_id ✅
**Contractors (SAM)**: By uei ✅
**Contractors (Google)**: By place_id ✅

### 5. Error Handling

**Strategy**:
- All API calls: Retry 3x with backoff
- Continue on fail (don't stop entire workflow)
- Dead letter queue for failed inserts
- Slack alerts if >5 errors in single run

---

## Future Enhancements

### Phase 2
- [ ] Workflow 03: Match Engine with intelligent scoring
- [ ] Workflow 04: HubSpot CRM integration
- [ ] Multi-region support (all 50 states)
- [ ] Contractor caching to reduce API costs

### Phase 3
- [ ] Web frontend (React/Next.js)
- [ ] User dashboard
- [ ] Manual opportunity review
- [ ] Contractor profile enrichment
- [ ] Historical analytics

### Phase 4
- [ ] Auto-proposal generation
- [ ] Compliance checks
- [ ] Win-rate tracking
- [ ] Mobile app

---

## Troubleshooting Guide

### Common Issues

**1. No opportunities ingested**
- Check SAM_API_KEY valid
- Verify hard filters not too strict
- Check workflow_errors table

**2. No SAM vendors found**
- NAICS codes may not match state
- Try broader search (remove state filter for test)

**3. Google Places 401 Unauthorized**
- Verify GOOGLE_PLACES_API_KEY
- Check API enabled in Google Console
- Verify billing enabled

**4. AI parse errors**
- Check OpenAI Tier 1 active
- Review workflow_errors for AI responses
- Fallback values automatically applied

**5. High Google Places costs**
- Implement contractor caching
- Reduce results from 10 to 5
- Add preliminary screening before Place Details

---

## Next Steps (Immediate)

### For Deployment:

1. User provides SAM.gov API key
2. User upgrades OpenAI to Tier 1
3. Execute Supabase SQL scripts
4. Import workflow to n8n
5. Test workflow execution
6. Monitor costs & errors

### For Development:

1. Start web frontend (React/Next.js)
2. Dashboard for opportunities
3. Contractor management UI
4. Match review interface

---

## Testing Checklist

After deployment:

- [ ] Workflow 01 runs every 6 hours
- [ ] Opportunities appear in Supabase
- [ ] SAM vendors discovered (source='SAM_VENDOR')
- [ ] Google Places contractors if needed (source='GOOGLE_PLACES')
- [ ] All contractors have readiness_score ≥ 60 or = 100
- [ ] No critical errors in workflow_errors
- [ ] Costs within expected range

---

**Last Updated**: 2026-02-13
**System Version**: 1.0.0 (Phase 1)
**Status**: Ready for initial deployment + frontend development
