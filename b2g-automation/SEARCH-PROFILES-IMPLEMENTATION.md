# 🎯 Search Profiles - Pre-Filter Implementation

**Problem**: Current workflow loads ALL opportunities (15+ minutes per sync)
**Solution**: Use user-defined Search Profiles to pre-filter SAM.gov queries
**Result**: Reduce sync time to 2-3 minutes ⚡

---

## 🚀 What We're Building

### User Flow:
```
1. User goes to: Settings → Search Profiles
2. Creates profile: "Tech Contracts > $50M"
   - Select NAICS codes: 541511, 541512, 541519
   - Set min budget: $50,000,000
   - Set max budget: (none)
3. Marks as Active
4. Clicks "Sync SAM.gov"
5. Workflow uses ACTIVE profiles to filter SAM.gov query
6. Only ~50-100 opportunities load (not 10,000+)
7. Sync completes in 2-3 minutes (not 15 minutes)
```

---

## 📊 Database Schema

### search_profiles table
```sql
CREATE TABLE search_profiles (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE,                    -- "Tech > $50M"
  naics_codes TEXT[],                  -- ['541511', '541512', ...]
  min_budget INTEGER,                  -- 50000000
  max_budget INTEGER,                  -- null (no max)
  min_days_to_deadline INTEGER,        -- 30
  set_asides TEXT[],                   -- ['Small Business', '8(a)']
  exclude_keywords TEXT[],             -- ['research', 'academic']
  is_active BOOLEAN,                   -- true (used for sync)
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🔧 Frontend Implementation

### 1. Add to Settings Navigation
File: `src/app/settings/page.tsx`

```tsx
export const settingCards = [
  // ... existing cards
  {
    title: 'Search Profiles',
    description: 'Define custom SAM.gov filters',
    href: '/settings/search-profiles',
    icon: '🔍',
    color: 'from-purple-500 to-pink-500',
  },
];
```

### 2. Components Created
- `src/app/settings/search-profiles/page.tsx` - Main page
- `src/components/search-profiles/search-profiles-manager.tsx` - Manager component
- `src/app/api/search-profiles/route.ts` - API endpoints (GET, POST, DELETE)

### 3. API Endpoints
```
GET    /api/search-profiles            # Fetch all profiles
POST   /api/search-profiles            # Create/update profile
DELETE /api/search-profiles?name=...   # Delete profile
```

---

## 🔄 n8n Workflow Changes

### Current Flow (Slow - 15 min):
```
📡 SAM.gov API
  ├─ NAICS codes: 14 codes
  ├─ Fetch: Page 1, 2, 3, ... (ALL pages)
  └─ Result: 10,000+ opportunities
     ↓
🔄 Split in Batches (splits into 10,000 items)
     ↓
💾 Insert Opp (processes each)
     ↓
Takes 15 minutes ❌
```

### New Flow (Fast - 2-3 min):
```
1️⃣ Fetch Active Search Profiles
   └─ Get from Supabase: search_profiles WHERE is_active = true
   └─ Example: ["Tech > $50M", "Construction < $20M"]

2️⃣ For Each Profile:
   📡 SAM.gov API (WITH FILTERS)
   ├─ NAICS codes: [from profile]
   ├─ Budget min: $50M, max: null
   ├─ Posted within: [min_days_to_deadline]
   ├─ Fetch: Only relevant pages
   └─ Result: 50-100 opportunities
     ↓
   🔄 Split in Batches (splits into 50-100 items)
     ↓
   💾 Insert Opp (processes each)
     ↓
   Takes 2-3 minutes ✅

3️⃣ Merge All Results
   └─ Combine opportunities from all profiles
   └─ Remove duplicates
   └─ Complete!
```

---

## 🛠️ n8n Workflow Modifications

### Step 1: Add "Get Active Profiles" Node

**Type**: Supabase (Query)

**Configuration**:
```
Table: search_profiles
Select: *
Where: is_active = true
```

**Output**:
```json
[
  {
    "name": "Tech > $50M",
    "naics_codes": ["541511", "541512"],
    "min_budget": 50000000,
    "max_budget": null
  },
  {
    "name": "Construction < $20M",
    "naics_codes": ["236220"],
    "min_budget": null,
    "max_budget": 20000000
  }
]
```

### Step 2: Modify SAM.gov API Call

**Current**:
```
Base URL: https://api.sam.gov/opportunities/v2/search
Parameters:
  - naics: 541511,541512,541513,... (all 14)
  - limit: 10
  - offset: 0
```

**New** (in loop for each profile):
```
Base URL: https://api.sam.gov/opportunities/v2/search
Parameters:
  - naics: [from profile]
  - limit: 10
  - offset: 0
  - postedFrom: [from min_days_to_deadline]
  - postedTo: today
```

**SAM.gov API Params for Budget Filter**:
```
(Note: SAM.gov API doesn't have direct budget filter)
(We'll filter in code after fetch)
```

### Step 3: Add Budget Filter Node

**Type**: Code node

**Logic**:
```javascript
// Filter opportunities by budget
const profile = $input.first().json;
const opportunities = $input.all()[1].json; // from SAM API

return opportunities.filter(opp => {
  const budget = opp.estimatedAmount || 0;

  if (profile.min_budget && budget < profile.min_budget)
    return false;
  if (profile.max_budget && budget > profile.max_budget)
    return false;

  return true;
});
```

### Step 4: Loop Structure

**Before**: Hardcoded query for all NAICS

**After**:
```
Loop through active profiles:
  ├─ Fetch opportunities for this profile
  ├─ Filter by budget
  ├─ Split into batches
  ├─ Process each batch
  └─ Continue to next profile

Merge results → Remove duplicates → Done
```

---

## 📝 Default Search Profiles

When system starts, these profiles are created:

### Profile 1: "Tech Contracts - Large ($50M+)"
- **NAICS**: 541511, 541512, 541513, 541519, 518210
- **Min Budget**: $50,000,000
- **Max Budget**: (none)
- **Active**: YES

### Profile 2: "Construction - Medium ($5-20M)"
- **NAICS**: 236220
- **Min Budget**: $5,000,000
- **Max Budget**: $20,000,000
- **Active**: YES

### Profile 3: "All Categories - All Sizes"
- **NAICS**: All 14 codes
- **Min Budget**: (none)
- **Max Budget**: (none)
- **Active**: NO (user can activate if desired)

---

## ⚡ Performance Improvement

| Scenario | Old Method | New Method | Improvement |
|----------|-----------|-----------|-------------|
| All 14 NAICS, all sizes | 15 min | - | (disabled) |
| Tech only, >$50M | 15 min | 2-3 min | **5-7x faster** |
| 2 profiles active | 30 min | 4-6 min | **5-7x faster** |
| 3 profiles active | 45 min | 6-10 min | **4-7x faster** |

---

## 🔄 How User Updates Profiles

### Scenario 1: Add new industry
```
1. User: Settings → Search Profiles
2. Clicks: Edit "Tech Contracts"
3. Adds NAICS: 541330 (Engineering)
4. Saves
5. Next sync uses new NAICS codes
```

### Scenario 2: Disable a profile
```
1. User: Settings → Search Profiles
2. Clicks: Edit "Construction"
3. Uncheck: "Active (use for syncs)"
4. Saves
5. Next sync skips this profile
```

### Scenario 3: Create custom profile
```
1. User: Settings → Search Profiles
2. Clicks: "+ New Profile"
3. Name: "Government IT Services"
4. NAICS: 541512, 518210
5. Min Budget: $1M
6. Max Budget: $100M
7. Set-Asides: Small Business, 8(a)
8. Save
9. Next sync includes this profile
```

---

## 🚀 Implementation Checklist

- [x] Create search_profiles table
- [x] Add API endpoints (/api/search-profiles)
- [x] Create frontend manager component
- [x] Add settings page: /settings/search-profiles
- [ ] Update n8n workflow to use profiles
- [ ] Add "Get Active Profiles" node to workflow
- [ ] Modify SAM.gov API call for each profile
- [ ] Add budget filtering logic
- [ ] Test with single profile
- [ ] Test with multiple profiles
- [ ] Test disabling/enabling profiles
- [ ] Verify performance improvement (2-3 min target)

---

## 🧪 Testing Plan

### Test 1: Single Profile
- Create "Tech > $50M" profile
- Activate it
- Click "Sync SAM.gov"
- Verify: Completes in 2-3 minutes
- Verify: Only Tech opportunities with budget > $50M

### Test 2: Multiple Profiles
- Activate 2 profiles: "Tech" + "Construction"
- Click "Sync SAM.gov"
- Verify: Completes in 4-6 minutes
- Verify: Both types of opportunities loaded

### Test 3: No Active Profiles
- Deactivate all profiles
- Click "Sync SAM.gov"
- Verify: Returns error or message
- Expected: "No active search profiles"

### Test 4: Custom Profile
- Create new profile with specific criteria
- Activate it
- Click "Sync SAM.gov"
- Verify: Only matching opportunities appear

---

## 📊 Expected Results

### Before Search Profiles:
```
Sync Time: 15 minutes ❌
Opportunities: 10,000+ loaded
Results: Too many, user has to manually filter
```

### After Search Profiles:
```
Sync Time: 2-3 minutes ⚡
Opportunities: 50-100 loaded
Results: Pre-filtered, exactly what user wants
User can create multiple profiles for different searches
```

---

## 🔗 Related Features

This enables future features:
- **Saved Results**: Save opportunities from a search profile
- **Smart Alerts**: "New Tech contracts > $50M available"
- **Scheduled Syncs**: "Sync Tech profile every Monday"
- **Comparison**: "Compare last week's Tech opportunities vs this week"

---

**Status**: Ready for n8n workflow implementation
**Next Step**: Modify n8n workflow to use search profiles
