# HubSpot + Vendor Discovery Integration Guide

## 🎯 Ziel
Integration von:
1. Vendor Discovery Workflow (SAM.gov + Google Places + AI Screening)
2. HubSpot CRM (Sync von Opportunities und Contractors)

---

## Step 1: HubSpot Credentials in n8n

### 1.1 Environment Variables hinzufügen
Gehe zu: **n8n → Settings → Variables**

```bash
HUBSPOT_API_KEY=na2-d10d-4d74-4405-8c2a-b60ff58b55c6
HUBSPOT_PORTAL_ID=245197783
```

### 1.2 HubSpot Credential erstellen
1. **n8n → Credentials → Add Credential → HubSpot**
2. Name: `HubSpot`
3. **Authentication Method**: API Key
4. **API Key**: `{{$env.HUBSPOT_API_KEY}}`
5. **Save**

---

## Step 2: Vendor Discovery Workflow deployen

### 2.1 Workflow importieren
1. **n8n → Workflows → Import from File**
2. Wähle: `b2g-automation/workflows/02-vendor-discovery.json`
3. **Import**

### 2.2 Webhook Node konfigurieren
Die JSON-Datei enthält jetzt einen echten Webhook-Node (`🌐 Webhook Trigger`) gefolgt von einem Parser (`📨 Parse Opportunity`).

Nach dem Import:
1. **Prüfe**, dass der Webhook-Node den Path `vendor-discovery` hat
2. **Aktiviere** den Workflow (Toggle auf "Active")
3. **Production URL kopieren**: `https://n8n.srv1113360.hstgr.cloud/webhook/vendor-discovery`

> **Hinweis**: SAM.gov Sync (Opportunities holen) läuft automatisch alle 6h über den Mega-Workflow mit Cron-Trigger. Der Vendor-Discovery-Workflow wird nur vom Frontend per "Find Contractors" Button getriggert.

### 2.3 Frontend ENV Variable setzen
In `/Users/andreschuler/Ahamericurial B2G /b2g-frontend/.env.local`:

```bash
N8N_VENDOR_DISCOVERY_WEBHOOK_URL=https://n8n.srv1113360.hstgr.cloud/webhook/vendor-discovery
```

---

## Step 3: HubSpot Sync Nodes hinzufügen

### 3.1 Zum Mega-Workflow (b2g-complete-mega-workflow.json)

Füge einen **HubSpot** Node hinzu nach dem `💾 Insert Opportunity` Node:

**Node Name**: `🔗 Sync to HubSpot Deal`

**Configuration**:
- **Resource**: Deals
- **Operation**: Create
- **Deal Properties**:
  - `dealname`: `={{ $('💾 Insert Opportunity').item.json.title }}`
  - `amount`: `={{ $('💾 Insert Opportunity').item.json.estimated_value }}`
  - `closedate`: `={{ $('💾 Insert Opportunity').item.json.deadline }}`
  - `dealstage`: `qualifiedtobuy` (oder anderer Standard-Stage)
  - `pipeline`: `default`

**Additional Properties** (Custom Fields):
- `notice_id`: `={{ $('💾 Insert Opportunity').item.json.notice_id }}`
- `agency`: `={{ $('💾 Insert Opportunity').item.json.agency }}`
-contract_type`: `={{ $('💾 Insert Opportunity').item.json.contractor_type }}`

### 3.2 Contractors zu HubSpot Companies syncen

Im **Vendor Discovery Workflow**, füge nach `💾 Insert SAM Vendor` einen Node hinzu:

**Node Name**: `🔗 Sync to HubSpot Company`

**Configuration**:
- **Resource**: Companies
- **Operation**: Create or Update
- **Company Properties**:
  - `name`: `={{ $('💾 Insert SAM Vendor').item.json.name }}`
  - `city`: `={{ $('💾 Insert SAM Vendor').item.json.city }}`
  - `state`: `={{ $('💾 Insert SAM Vendor').item.json.state }}`
  - `zip`: `={{ $('💾 Insert SAM Vendor').item.json.zip }}`

**Additional Properties** (Custom Fields):
- `uei`: `={{ $('💾 Insert SAM Vendor').item.json.uei }}`
- `sam_registered`: `true`
- `readiness_score`: `={{ $('💾 Insert SAM Vendor').item.json.readiness_score }}`

---

## Step 4: Frontend Testing

### 4.1 Server neu starten
```bash
cd b2g-frontend
npm run dev
```

### 4.2 Test Flow
1. Öffne: `http://localhost:3000/opportunities`
2. Klicke auf eine Opportunity
3. Im Detail-Dialog: **"Find Contractors"** Button klicken
4. Warte ~5-10 Sekunden
5. Die Contractors sollten automatisch erscheinen

### 4.3 HubSpot verifizieren
1. Öffne: `https://app.hubspot.com/contacts/245197783`
2. **Deals** → Solltest du die Opportunities sehen
3. **Companies** → Solltest du die Contractors sehen

---

## Step 5: Workflow URL für den Workflow-Link

Der Workflow ist unter dieser URL verfügbar:
`https://n8n.srv1113360.hstgr.cloud/workflow/nHnUprASEu85qJ6G?projectId=CT1OzvTwI7fJDc4H`

Falls du diesen Workflow noch nicht in n8n siehst:
1. **Prüfe**, ob du im richtigen Projekt (`CT1OzvTwI7fJDc4H`) bist
2. **Importiere** die JSON-Datei manuell (siehe Step 2.1)

---

## ✅ Checkliste

- [x] HubSpot API Key + Portal ID in n8n Environment Variables
- [ ] HubSpot Credential in n8n erstellt
- [x] Frontend ENV Variable gesetzt (`N8N_VENDOR_DISCOVERY_WEBHOOK_URL`)
- [ ] OpenAI Credentials in n8n konfigurieren (KRITISCH - siehe unten)
- [ ] OpenAI Nodes konfigurieren (Prompt + Model setzen)
- [ ] Supabase Credentials vereinheitlichen (aktuell 2 verschiedene)
- [ ] Vendor Discovery Workflow importieren + aktivieren
- [ ] Frontend Testing erfolgreich

---

## Production Hardening v4 (Stand: 2026-02-15)

### Behobene Probleme

1. **OpenAI Nodes** - Ersetzt durch HTTP Request Nodes (kein `n8n-nodes-base.openAi` noetig)
   - AI Enrich + AI Screen nutzen direkt die OpenAI API via HTTP POST
   - API Key kommt aus `$env.AI_API_KEY`
   - Prompts sind vollstaendig konfiguriert

2. **Alle Connections** - Komplett verbunden, inklusive AI-Ketten und Match Engine

3. **Supabase Credentials** - Vereinheitlicht auf `Amaricural APP`

4. **API Keys** - ALLE ueber Environment Variables:
   - `$env.SAM_API_KEY` (SAM.gov)
   - `$env.GOOGLE_API_KEY` (Google Places)
   - `$env.AI_API_KEY` (OpenAI)
   - `$env.HUBSPOT_TOKEN` (HubSpot)

5. **HubSpot Deal Deduplication** - Check vor Deal-Erstellung verhindert Duplikate

6. **Processing State** - `matched_at`, `vendors_processed`, `crm_synced` Felder
   - Matching nur fuer `matched_at IS NULL` Opportunities
   - Keine Re-Evaluierung bereits gematchter Opportunities

7. **Rate Limiting** - Wait Nodes zwischen API-Aufrufen (SAM: 1s, Google: 0.5s, AI: 0.3s)

8. **Google Places** - Nur bei < 3 SAM-Treffern (vorher < 5)

9. **Batch Control** - SplitInBatches mit batchSize = 5

10. **Error Handling** - Fehlgeschlagene Opportunities werden in `failed_opportunities` geloggt

### n8n Environment Variables (ERFORDERLICH)

| Variable | Beschreibung |
|----------|-------------|
| `SAM_API_KEY` | SAM.gov API Key |
| `GOOGLE_API_KEY` | Google Places API Key |
| `AI_API_KEY` | OpenAI API Key |
| `HUBSPOT_TOKEN` | HubSpot Private App Token |
| `SLACK_WEBHOOK_URL` | Slack Incoming Webhook (optional) |

### SQL Migration

Vor dem Import der neuen Workflow-Version:
```bash
# In Supabase SQL Editor ausfuehren:
b2g-automation/database/migration-v4-production-hardening.sql
```

---

**Status**: Mega-Workflow ist production-hardened (v4)
