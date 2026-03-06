# LOC-01: Discover — Location Intelligence & Lead Discovery

**Date:** 2026-03-07
**Status:** Approved
**Phase:** LOC-01 (follows INT-04D completion)

---

## 1. Purpose

Add a Discover page to Polsya's Creative CRM that enables users to find businesses
anywhere in the world via Google Places, review results in a data table with map
visualization, and save them as Clients or Leads in bulk.

This is the first module in a broader discovery system. Future sub-modules will add
People, Companies, Designers, and Agencies discovery (not in scope here).

---

## 2. Architecture

```
User → DiscoverPage → places-search Edge Function → Google Places API (Text Search / Nearby Search)
                    → DiscoverResultsTable (left 60%)
                    → DiscoverMap (right 40%)
                    → Save → creative_clients + creative_opportunities (optional)
```

**Edge Function Proxy (Approach A):** All Google Places API calls go through a Supabase
edge function. The API key stays server-side. Auth, org membership, and billing checks
happen before calling Google.

---

## 3. Search Configuration

Two search modes via toggle:

| Mode | Input | Google API Used |
|------|-------|-----------------|
| Free text | User types any query ("art gallery", "coworking") | Text Search (New) |
| Business type | User selects from Google's ~196 place types | Nearby Search (New) |

Location controls:
- **Location input**: Autocomplete text field → geocoded to lat/lng
- **Interactive mini-map**: Draggable marker to reposition center
- **Radius slider**: 500m to 50km with labeled tick marks
- **Result count**: Optional number input (default 20, max 60)
- **Search button**: Primary CTA

---

## 4. Results View (Split Panel)

### Left Panel (60%) — DataTable

| Column | Source Field | Type |
|--------|-------------|------|
| ☐ checkbox | — | selection (hidden on saved rows) |
| Status | computed | badge: "Found" / "Already Saved" |
| Name | `displayName` | text, bold |
| Google Maps | place_id → URL | link icon |
| Website | `websiteUri` | link, truncated |
| Phone | `internationalPhoneNumber` | text |
| Address | `formattedAddress` | text, truncated |
| Rating | `rating` | number with star |
| Type | `primaryType` | lowercase badge |

**Floating bulk action bar** appears when rows are selected:
- "Save as Client (N)" button
- "Save as Lead (N)" button

### Right Panel (40%) — Google Map

- Numbered pins matching table row indices
- Radius circle overlay centered on search location
- Click pin → highlights corresponding table row
- Uses existing `@react-google-maps/api` and `VITE_GOOGLE_MAPS_API_KEY`

---

## 5. Save Flow

### Save as Client

Creates a `creative_client` row with status `prospect`:

```
name        → displayName
website     → websiteUri
status      → 'prospect'
metadata    → {
  google_place_id, phone, address, lat, lng,
  rating, google_maps_url, types[],
  discovered_at, discovery_source: 'google_places'
}
```

Deduplication: checks `creative_clients.metadata->>'google_place_id'` within the org
before insert. If already exists, returns the existing client ID.

### Save as Lead

Same client creation + creates a `creative_opportunity`:

```
client_id   → newly created client
title       → "{name} — Discover Lead"
stage       → 'lead'
source      → 'google_places'
metadata    → { discovery_query, discovery_location }
```

Both support bulk operations: selecting multiple rows saves all in one call.

---

## 6. Edge Function: `places-search`

### Request

```
POST /places-search
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "query": "art gallery",           // free text mode (mutually exclusive with type)
  "type": "art_gallery",            // business type mode
  "lat": 40.4226,
  "lng": -3.7182,
  "radiusMeters": 11000,
  "maxResults": 20,                 // optional, default 20
  "organizationId": "uuid"
}
```

### Response

```json
{
  "results": [
    {
      "placeId": "ChIJ...",
      "name": "La Fiambrera Art Gallery",
      "googleMapsUrl": "https://www.google.com/maps/place/?q=place_id:ChIJ...",
      "website": "http://www.lafiambrera...",
      "phone": "+34 917 04 60 30",
      "address": "C. del Pez, 30, Centro, 28...",
      "rating": 4.5,
      "primaryType": "art_gallery",
      "types": ["art_gallery", "store"],
      "lat": 40.4250,
      "lng": -3.7070
    }
  ],
  "alreadySavedIds": ["ChIJ..."],
  "totalResults": 10
}
```

### Auth Flow

```
handleCors() → requireOrgRoleAccess() → requireBillingAccessForOrg()
→ Google Places API call → dedup check → response
```

Uses `GOOGLE_MAPS_API_KEY` from Deno.env (already configured).

---

## 7. Sidebar Navigation Update

Add "Discover" as a new nav item after Dashboard. Positioned as the entry point for
lead discovery. Future sub-items (People, Companies, Designers, Agencies) will nest
under it as the discovery system expands.

```
Dashboard
Discover          ← NEW (LOC-01)
Reports
Analytics
...
```

The sidebar follows the power-platform grouping model:

```
Workspace
├ Dashboard
├ Discover
│   └ Local Businesses (LOC-01, first sub-module)
├ Clients
├ Projects
├ Contacts
├ Opportunities
├ Portfolios
│
├ Intelligence
│   ├ Signals
│   ├ Enrichment
│   ├ Style Intelligence
│
├ Communication
│   ├ Email
│   ├ Calendar
│
├ Operations
│   ├ Workflows
│   ├ Ingestion
│   ├ Resolution
│   ├ Knowledge Base
│
├ Analytics
│   └ Reports, Pipeline, Activity, Communication, Insights
│
└ Settings
    ├ Integrations
    ├ Billing
    └ Profile
```

Note: The sidebar restructure is tracked under UX-03, not LOC-01. LOC-01 only adds
the "Discover" nav item to the existing sidebar structure.

---

## 8. Component Tree

```
/creative/discover → DiscoverPage.tsx
├── DiscoverSearchForm.tsx
│   ├── SearchModeToggle (Free text / Business type)
│   ├── QueryInput OR BusinessTypeSelect (filterable dropdown, ~196 types)
│   ├── LocationAutocomplete + MiniMap (draggable)
│   ├── RadiusSlider (500m – 50km)
│   ├── ResultCountInput (optional)
│   └── SearchButton
├── DiscoverResults.tsx (split container)
│   ├── DiscoverResultsTable.tsx (DataTable wrapper)
│   │   ├── Checkbox column with select-all
│   │   ├── Typed columns (text, link, badge, number)
│   │   └── BulkActionBar.tsx (floating, appears on selection)
│   └── DiscoverMap.tsx (Google Map)
│       ├── Numbered MarkerF pins
│       ├── Circle overlay (radius)
│       └── Pin click → row highlight callback
├── useDiscoverSearch.ts (React Query mutation → edge function)
├── useSaveDiscoverResults.ts (bulk save mutation → Supabase)
└── discoverService.ts (edge function call wrapper)
```

---

## 9. Files to Create

| File | Type | Purpose |
|------|------|---------|
| `supabase/functions/places-search/index.ts` | Edge Function | Google Places proxy with auth + dedup |
| `src/pages/creative/CreativeDiscover.tsx` | Page | Discover page wrapper |
| `src/components/creative/discover/DiscoverSearchForm.tsx` | Component | Search controls panel |
| `src/components/creative/discover/DiscoverResultsTable.tsx` | Component | Results DataTable |
| `src/components/creative/discover/DiscoverMap.tsx` | Component | Map with pins + radius |
| `src/components/creative/discover/BulkActionBar.tsx` | Component | Floating save bar |
| `src/hooks/useDiscoverSearch.ts` | Hook | Search mutation |
| `src/hooks/useSaveDiscoverResults.ts` | Hook | Bulk save mutation |
| `src/services/discoverService.ts` | Service | Edge function calls |

## 10. Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add lazy route `/creative/discover` |
| `src/components/creative/layout/CreativeSidebar.tsx` | Add "Discover" nav item |

---

## 11. Design Principles (Clay/Linear/Notion/Figma-informed)

- **Table-centric**: Results rendered in DataTable with typed columns
- **High information density**: Compact rows, truncated URLs, minimal chrome
- **Split panel**: Table + map side by side, not stacked
- **Contextual actions**: Bulk action bar appears only when rows are selected
- **Progressive disclosure**: Search config on top, results below, map adjacent
- **Minimal visual noise**: White backgrounds, subtle borders, blue accent CTA
- **Power-user efficiency**: Keyboard-navigable table, Cmd+K searchable
- **Consistent patterns**: Same DataTable, same save flows, same auth checks as existing pages

---

## 12. Clay-Informed Roadmap Update

| Phase | Code | Feature | Status |
|-------|------|---------|--------|
| — | INT-04D | Provider Expansion (IMAP/SMTP) | ✅ Complete |
| 1 | LOC-01 | Discover — Local Businesses (Google Places) | 🔵 Current |
| 2 | UX-03 | Console Redesign (sidebar groups, visual polish) | ⏳ Next |
| 3 | SIG-01 | Signal Detection (job change, hiring, news) | 📋 Planned |
| 4 | ENR-01 | Enrichment Pipeline (Clearbit, Apollo, etc.) | 📋 Planned |
| 5 | CAM-01 | Campaign Sequences (email outreach) | 📋 Planned |
| 6 | DIS-02 | Discover — People & Companies | 📋 Planned |
| 7 | AGT-01 | AI Agent Builder (Claygents equivalent) | 📋 Planned |

---

## 13. Out of Scope (LOC-01)

- People / Companies / Designers / Agencies discovery (future DIS-02)
- Sidebar restructure / grouping (UX-03)
- Enrichment columns on results table (ENR-01)
- Campaign creation from saved leads (CAM-01)
- Signal triggers from new discoveries (SIG-01)
- "Fetch additional results" pagination (can be added later)
- Scheduled/recurring searches (future)
- Export to CSV (future)
