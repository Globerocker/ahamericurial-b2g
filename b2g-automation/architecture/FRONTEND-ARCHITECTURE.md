# 🎨 Frontend Architecture - B2G Dashboard

> **Tech Stack**: Next.js 14 + Supabase + shadcn/ui
> **Purpose**: Sales Dashboard + Contractor Portal
> **Users**: Sales Team + Contractors

---

## 🎯 Frontend Goals

1. **Sales Dashboard**: Pipeline visualization, deal management
2. **Contractor Portal**: Application form, profile management
3. **Admin Panel**: System monitoring, settings
4. **Analytics**: Win rates, revenue forecasting

---

## 📱 Page Structure

### Public Pages (No Auth)

#### 1. **Landing Page** (`/`)
- Hero: "Automatisch Government Contracts gewinnen"
- Features: SAM.gov Integration, AI Matching, CRM
- CTA: "Jetzt als Contractor bewerben"
- CTA: "Sales Team Login"

#### 2. **Contractor Application** (`/apply`)
- **Multi-step Form**:
  - Step 1: Company Info (name, website, contact)
  - Step 2: Government Status (UEI, CAGE, SAM registered, certifications)
  - Step 3: Capabilities (service categories, past contracts, revenue range)
  - Step 4: Why Us? (motivation, additional info)
- **Auto-save** progress to localStorage
- **AI Scoring** on submit → Instant feedback
- **Auto-approval** if score ≥85 + SAM registered

**Form Fields** (maps to contractor_applications table):
```typescript
interface ApplicationForm {
  // Step 1: Company Info
  companyName: string;
  legalBusinessName?: string;
  website?: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  state: string;
  zip: string;

  // Step 2: Government Status
  uei?: string;
  cageCode?: string;
  samRegistered: boolean;
  samRegistrationStatus: 'not_registered' | 'in_progress' | 'active' | 'expired';
  certifications: string[]; // Multi-select: 8A, SDVOSB, WOSB, HUBZone, etc.

  // Step 3: Capabilities
  primaryNaics: string;
  yearsInBusiness: number;
  annualRevenueRange: string;
  employeeCountRange: string;
  serviceCategories: string[]; // Multi-select: IT, Construction, etc.
  pastGovernmentContracts: boolean;
  pastContractDetails?: string;

  // Step 4: Why Us
  motivation: string; // Textarea
  additionalNotes?: string;
}
```

**API Endpoint**:
```typescript
POST /api/applications
→ Insert into contractor_applications
→ Trigger AI scoring (OpenAI)
→ Check auto-approval rules
→ Send confirmation email
→ Return { applicationId, status, score }
```

---

### Authenticated Pages (Sales Team)

#### 3. **Login** (`/login`)
- Email + Password (Supabase Auth)
- Magic Link option
- "Forgot Password" flow

#### 4. **Dashboard** (`/dashboard`)
- **Hero Metrics** (Cards):
  - Active Deals: Count + Total Value
  - New Matches (Last 24h): Count
  - Pending Applications: Count
  - Win Rate (This Month): Percentage

- **Pipeline Overview** (Kanban Board):
  - Columns: new_match, initial_outreach, contact_made, qualified, proposal_sent, negotiation
  - Drag & drop to move deals
  - Each card: Company name, Deal value, Match score, Days in stage

- **Recent Activity Feed**:
  - "New match: TechPro Solutions - $250K (Score: 92)"
  - "Deal moved to Proposal Sent: BuildCo Inc"
  - "New application: IT Services LLC (Score: 88)"

**Data Queries**:
```sql
-- Hero metrics
SELECT
  COUNT(*) FILTER (WHERE stage NOT IN ('closed_won', 'closed_lost')) as active_deals,
  SUM(deal_value) FILTER (WHERE stage NOT IN ('closed_won', 'closed_lost')) as active_value,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_matches,
  COUNT(*) FILTER (WHERE status = 'new') as pending_applications
FROM deals
LEFT JOIN contractor_applications ON 1=1;

-- Pipeline
SELECT * FROM v_active_deals;

-- Activity feed
SELECT * FROM activities
ORDER BY created_at DESC
LIMIT 20;
```

#### 5. **Deals** (`/deals`)
- **List View** (Table):
  - Columns: Company, Opportunity, Value, Stage, Match Score, Expected Close, Actions
  - Filters: Stage, Date range, Min value
  - Sort: By value, score, date
  - Search: Company name, opportunity title

- **Detail View** (`/deals/[id]`):
  - Deal info: Value, stage, dates, match score
  - Company info: Name, website, contact, SAM status
  - Opportunity info: Title, agency, deadline, requirements
  - Contact person: Name, email, phone, LinkedIn
  - Activity timeline: All emails, calls, meetings
  - Actions: Move stage, Add note, Schedule meeting, Send email

**Deal Stage Flow**:
```typescript
const DEAL_STAGES = [
  { id: 'new_match', label: 'New Match', color: 'blue' },
  { id: 'initial_outreach', label: 'Initial Outreach', color: 'purple' },
  { id: 'contact_made', label: 'Contact Made', color: 'yellow' },
  { id: 'qualified', label: 'Qualified', color: 'orange' },
  { id: 'proposal_sent', label: 'Proposal Sent', color: 'pink' },
  { id: 'negotiation', label: 'Negotiation', color: 'green' },
  { id: 'closed_won', label: 'Closed Won', color: 'emerald' },
  { id: 'closed_lost', label: 'Closed Lost', color: 'red' },
];
```

#### 6. **Companies** (`/companies`)
- **List View**:
  - Cards: Company name, Readiness score, Qualification status, Total deals, Active deals
  - Filters: Qualification status, State, SAM registered
  - Sort: By score, deals count

- **Detail View** (`/companies/[id]`):
  - Company profile: Name, website, address, UEI, CAGE code
  - Metrics: Total deals, Won deals, Total revenue, Win rate
  - Contacts: List of all contacts at company
  - Deals: All deals (current + past)
  - Activities: Communication history
  - Actions: Add contact, Add note, Create deal

#### 7. **Applications** (`/applications`)
- **List View** (Table):
  - Columns: Company, Contact, Score, Status, Submitted, Actions
  - Filters: Status, Min score, Date range
  - Bulk actions: Approve, Reject, Assign

- **Detail View** (`/applications/[id]`):
  - Application details: All form fields
  - AI Score: Score + Reasoning + Key strengths/concerns
  - Actions:
    - Approve → Create company + contact
    - Reject → Set status + rejection reason
    - Request more info → Send email
    - Assign to rep

**Auto-Actions**:
```typescript
// On approval
async function approveApplication(applicationId: string) {
  // 1. Create company
  const company = await createCompany(application);

  // 2. Create contact
  const contact = await createContact(application, company.id);

  // 3. Update application
  await updateApplication(applicationId, {
    status: 'approved',
    company_id: company.id,
    contact_id: contact.id
  });

  // 4. Send welcome email
  await sendEmail({
    to: application.contact_email,
    subject: 'Welcome to B2G System',
    template: 'contractor_welcome'
  });
}
```

#### 8. **Opportunities** (`/opportunities`)
- **List View**:
  - Table: Title, Agency, Value, Deadline, Priority, State, Match Count
  - Filters: State, Priority flag, Min value, Deadline range
  - Search: Title, agency

- **Detail View** (`/opportunities/[id]`):
  - Opportunity info: Full SAM.gov data
  - AI Enrichment: Tags, complexity, contractor type
  - Matches: All matched contractors (sorted by score)
  - Actions: Create manual match, Hide opportunity

#### 9. **Analytics** (`/analytics`)
- **Dashboard Widgets**:
  - Win Rate Trend (Line chart)
  - Revenue Forecast (Bar chart)
  - Deal Velocity (Avg days per stage)
  - Top Companies (Table)
  - Application Conversion Funnel
  - Match Score Distribution (Histogram)

**Example Queries**:
```sql
-- Win rate trend
SELECT
  DATE_TRUNC('week', closed_at) as week,
  COUNT(*) FILTER (WHERE stage = 'closed_won') as won,
  COUNT(*) as total,
  ROUND(COUNT(*) FILTER (WHERE stage = 'closed_won')::numeric / COUNT(*) * 100, 1) as win_rate
FROM deals
WHERE closed_at >= NOW() - INTERVAL '3 months'
GROUP BY week
ORDER BY week;

-- Revenue forecast
SELECT
  DATE_TRUNC('month', expected_close_date) as month,
  SUM(deal_value * win_probability / 100) as forecasted_revenue
FROM deals
WHERE stage NOT IN ('closed_won', 'closed_lost')
  AND expected_close_date <= NOW() + INTERVAL '6 months'
GROUP BY month
ORDER BY month;
```

#### 10. **Settings** (`/settings`)
- **Profile**: Name, email, password
- **Team**: Invite users, manage permissions
- **Integrations**: HubSpot API key, Slack webhook
- **Notifications**: Email preferences, Slack alerts
- **Workflow**: Adjust match threshold, priority rules

---

## 🏗️ Tech Stack

### Framework
**Next.js 14** (App Router)
- Server components for data fetching
- Server actions for mutations
- Streaming for large lists

### Database & Auth
**Supabase**
- PostgreSQL (already set up - 12 tables)
- Realtime subscriptions (for live updates)
- Auth (email/password + magic links)
- Row Level Security (RLS)

### UI Components
**shadcn/ui** + **Tailwind CSS**
- Pre-built components (Button, Card, Dialog, etc.)
- Accessible (Radix UI primitives)
- Customizable (Tailwind)

### Charts
**Recharts** or **Tremor**
- Line charts (trends)
- Bar charts (revenue)
- Pie charts (distribution)

### Forms
**React Hook Form** + **Zod**
- Type-safe validation
- Good UX (instant feedback)

### State Management
**Zustand** (minimal) or **TanStack Query**
- Cache Supabase queries
- Optimistic updates

---

## 📁 Project Structure

```
b2g-dashboard/
├── app/
│   ├── (public)/
│   │   ├── page.tsx              # Landing page
│   │   ├── apply/
│   │   │   └── page.tsx          # Application form
│   │   └── login/
│   │       └── page.tsx          # Login
│   ├── (authenticated)/
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Main dashboard
│   │   ├── deals/
│   │   │   ├── page.tsx          # Deals list
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Deal detail
│   │   ├── companies/
│   │   │   ├── page.tsx          # Companies list
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Company detail
│   │   ├── applications/
│   │   │   ├── page.tsx          # Applications list
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Application detail
│   │   ├── opportunities/
│   │   │   ├── page.tsx          # Opportunities list
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Opportunity detail
│   │   ├── analytics/
│   │   │   └── page.tsx          # Analytics dashboard
│   │   └── settings/
│   │       └── page.tsx          # Settings
│   └── api/
│       ├── applications/
│       │   └── route.ts          # POST /api/applications
│       ├── deals/
│       │   ├── route.ts          # GET/POST /api/deals
│       │   └── [id]/
│       │       └── route.ts      # PUT/DELETE /api/deals/[id]
│       └── webhooks/
│           └── hubspot/
│               └── route.ts      # HubSpot webhook handler
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── deals/
│   │   ├── pipeline-board.tsx   # Kanban board
│   │   ├── deal-card.tsx        # Deal card
│   │   └── deal-form.tsx        # Create/edit deal
│   ├── applications/
│   │   ├── application-form.tsx # Multi-step form
│   │   └── score-badge.tsx      # AI score display
│   └── analytics/
│       ├── win-rate-chart.tsx   # Chart components
│       └── revenue-forecast.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Supabase client
│   │   ├── server.ts            # Supabase server client
│   │   └── queries.ts           # Reusable queries
│   ├── utils.ts                 # Utility functions
│   └── validations.ts           # Zod schemas
└── types/
    └── database.ts              # TypeScript types (auto-generated)
```

---

## 🔐 Authentication & Security

### Supabase Auth Setup

```typescript
// lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const supabase = createClientComponentClient<Database>();

// lib/supabase/server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const createClient = () => {
  return createServerComponentClient<Database>({ cookies });
};
```

### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
-- etc.

-- Policy: Users can only see data
CREATE POLICY "Users can read all data"
ON companies FOR SELECT
TO authenticated
USING (true);

-- Policy: Users can update deals assigned to them
CREATE POLICY "Users can update assigned deals"
ON deals FOR UPDATE
TO authenticated
USING (assigned_to = auth.email());
```

---

## 📊 Key Features

### 1. Real-time Updates

```typescript
// Subscribe to new deals
useEffect(() => {
  const channel = supabase
    .channel('deals-changes')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'deals' },
      (payload) => {
        // Add new deal to list
        setDeals(prev => [payload.new, ...prev]);
        // Show toast notification
        toast.success(`New deal: ${payload.new.deal_name}`);
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, []);
```

### 2. Drag & Drop Pipeline

```typescript
import { DndContext, DragOverlay } from '@dnd-kit/core';

function PipelineBoard({ deals }) {
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const dealId = active.id;
    const newStage = over.id;

    // Optimistic update
    updateDealStage(dealId, newStage);

    // API call
    await fetch(`/api/deals/${dealId}`, {
      method: 'PUT',
      body: JSON.stringify({ stage: newStage })
    });
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {DEAL_STAGES.map(stage => (
        <Column key={stage.id} stage={stage}>
          {deals.filter(d => d.stage === stage.id).map(deal => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </Column>
      ))}
    </DndContext>
  );
}
```

### 3. Multi-Step Form with Auto-Save

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const applicationSchema = z.object({
  companyName: z.string().min(2),
  contactEmail: z.string().email(),
  // ... all fields
});

export function ApplicationForm() {
  const [step, setStep] = useState(1);
  const form = useForm({
    resolver: zodResolver(applicationSchema),
    defaultValues: getFromLocalStorage('application_draft') || {}
  });

  // Auto-save to localStorage
  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem('application_draft', JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data) => {
    const response = await fetch('/api/applications', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    const { applicationId, status, score } = await response.json();

    // Clear draft
    localStorage.removeItem('application_draft');

    // Show success
    if (status === 'approved') {
      router.push('/application/success?score=' + score);
    } else {
      router.push('/application/pending?id=' + applicationId);
    }
  };

  return (
    <Form {...form}>
      <FormStep step={1} currentStep={step}>
        {/* Company Info fields */}
      </FormStep>
      <FormStep step={2} currentStep={step}>
        {/* Government Status fields */}
      </FormStep>
      {/* ... */}
    </Form>
  );
}
```

---

## 🚀 Development Plan

### Phase 1: Core Setup (Week 1)
- [ ] Next.js project setup
- [ ] Supabase connection + Auth
- [ ] shadcn/ui installation
- [ ] Database types generation
- [ ] Layout + Navigation

### Phase 2: Public Pages (Week 1-2)
- [ ] Landing page
- [ ] Contractor application form (multi-step)
- [ ] Application submission API
- [ ] Thank you / pending pages

### Phase 3: Dashboard (Week 2-3)
- [ ] Authentication (login/logout)
- [ ] Dashboard overview
- [ ] Deals list + detail
- [ ] Pipeline Kanban board
- [ ] Activity feed

### Phase 4: CRM Pages (Week 3-4)
- [ ] Companies list + detail
- [ ] Applications review
- [ ] Opportunities list + detail
- [ ] Contact management

### Phase 5: Advanced Features (Week 4-5)
- [ ] Analytics dashboard
- [ ] Real-time updates
- [ ] Email notifications
- [ ] Settings page

### Phase 6: Polish (Week 5-6)
- [ ] Mobile responsive
- [ ] Performance optimization
- [ ] Error handling
- [ ] Loading states
- [ ] Testing

---

## 🎨 Design System

### Colors
```typescript
const colors = {
  primary: 'blue',     // CTAs, links
  success: 'green',    // Closed won, approved
  warning: 'yellow',   // Under review
  danger: 'red',       // Closed lost, rejected
  info: 'purple',      // New matches
};
```

### Typography
- Headings: Inter (bold)
- Body: Inter (regular)
- Code: JetBrains Mono

### Spacing
- Tailwind default scale (4px base)
- Consistent padding/margins

---

## 📦 Deployment

**Vercel** (Recommended)
- Push to GitHub
- Connect repo to Vercel
- Auto-deploy on push to main
- Environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

---

## ✅ Frontend Checklist

- [ ] Design system finalized
- [ ] All pages wireframed
- [ ] Database queries tested
- [ ] API routes implemented
- [ ] Real-time subscriptions working
- [ ] Authentication flows tested
- [ ] Mobile responsive
- [ ] Performance optimized (<3s load time)
- [ ] Error handling comprehensive
- [ ] Deployed to production

---

**Ready to build?** Let me know if you want me to generate the initial Next.js project or use v0! 🚀
