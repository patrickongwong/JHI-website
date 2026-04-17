# Philippine Transportation Infrastructure Map — Design

**Path:** `januarius.ph/infra/`
**Date:** 2026-04-17
**Author:** Patrick Wong (with Claude)

## Purpose

A personal map tool for visualising upcoming Philippine transportation infrastructure projects (roads, bridges, expressways, rail, airports, seaports). The intent is to identify projects whose completion will likely move surrounding property prices, allowing the user to act before the market reprices.

## Scope

**In scope:** Transportation projects in the Philippines that have a credible go-signal (defined below).

**Out of scope:**
- Non-transportation infrastructure (water, power, telecoms, flood control).
- Projects outside the Philippines.
- Projects in pre-feasibility, unsolicited-but-unapproved status, or that have been formally shelved.

## Inclusion Rules

A project is included in `projects.json` only if at least one of the following is true:

- NEDA Board approved
- NEDA-ICC (Investment Coordination Committee) approved
- Notice of Award issued (PPP)
- Construction contract awarded
- Currently under construction
- Partially operational (with remaining segments still in construction)

Excluded: pre-feasibility studies, unsolicited proposals not yet approved, suspended/shelved projects (e.g., PAREX after Manila City withdrew).

## Data Sources

Two seed sources for v1, both tagged on every record:

1. **NEDA Infrastructure Flagship Projects (IFP) list.** ~185 priority projects, funding-modality-agnostic (covers ODA, GAA, PPP, locally-funded GOCC).
2. **PPP Center pipeline (ppp.gov.ph).** Captures PPP projects not yet elevated to IFP — smaller toll road extensions, regional airports, provincial PPPs.

Coordinate geometry is hand-traced from press-release alignment maps, project briefs, and Google Maps satellite reference. Each project must cite its sources with clickable URLs.

## File Structure

```
/infra/
  index.html       # Page shell, Leaflet container, side panel, filter rail
  styles.css       # Standalone — no shared CSS with parent site
  app.js           # Map setup, JSON load, filter + click logic
  data/
    projects.json  # The dataset
    schema.json    # JSON Schema documenting the record shape
```

Static site, no build step. Matches the existing `plot-plotter/` pattern.

## Data Model — `projects.json`

A single JSON file containing a top-level array of project records. Each record:

```json
{
  "id": "ifp-001",
  "name": "NLEX-SLEX Connector Road",
  "type": "expressway",
  "status": "under_construction",
  "implementing_agency": "DPWH",
  "concessionaire": "Metro Pacific Tollways Corp.",
  "funding_modality": "PPP",
  "region": "NCR",
  "provinces": ["Metro Manila"],
  "estimated_completion": "2026-12-31",
  "completion_confidence": "official_target",
  "cost_php_billions": 23.3,
  "geometry": {
    "type": "LineString",
    "coordinates": [[121.0123, 14.6543], [121.0156, 14.6601]]
  },
  "description": "8km elevated expressway connecting NLEX in Caloocan to SLEX in Paco, Manila.",
  "sources": [
    {"label": "NEDA IFP list 2024", "url": "https://neda.gov.ph/..."},
    {"label": "MPTC investor presentation Q3 2024", "url": "https://..."}
  ],
  "last_updated": "2026-04-17"
}
```

### Field semantics

| Field | Type | Notes |
|---|---|---|
| `id` | string | Stable identifier. Format: `<source-prefix>-<seq>` (e.g., `ifp-001`, `ppp-014`). |
| `name` | string | Project name as used by the implementing agency. |
| `type` | enum | `road` \| `bridge` \| `expressway` \| `rail` \| `airport` \| `seaport` |
| `status` | enum | `approved` \| `under_construction` \| `partially_operational` |
| `implementing_agency` | string | Government agency (DPWH, DOTr, MWSS, etc.) |
| `concessionaire` | string \| null | Private partner for PPPs; null otherwise. |
| `funding_modality` | enum | `ODA` \| `GAA` \| `PPP` \| `Hybrid` |
| `region` | string | Standard PSA region code or name (e.g., NCR, Region IV-A). |
| `provinces` | string[] | One or more provinces the project crosses. |
| `estimated_completion` | ISO date | Target completion date. |
| `completion_confidence` | enum | `official_target` \| `analyst_estimate` \| `delayed_likely` |
| `cost_php_billions` | number \| null | Project cost in PHP billions. |
| `geometry` | GeoJSON | `LineString` for linear, `Point` for stations/airports/seaports, `MultiLineString` for branched alignments. |
| `description` | string | 1–3 sentences. |
| `sources` | object[] | Each entry has `label` and `url`. |
| `last_updated` | ISO date | Date the record was last touched. |

GeoJSON-compatible geometry means the dataset can later migrate to MapLibre or Mapbox without reshaping.

## Map UI

**Library:** Leaflet (CDN-loaded, no bundler).

**Base layers (toggle in top-right control):**
- Esri World Imagery (satellite) — default
- OpenStreetMap (street) — secondary

**Project rendering:**
- Lines: 4px stroke, color by completion bucket (see below). White outline halo for contrast on satellite imagery.
- Points (airports, seaports, stations): circle markers, same color scheme.
- Hover: stroke thickens to 6px, tooltip shows project name.
- Click: line highlights (8px stroke + brighter color), right-side detail panel opens.

**Color buckets** (computed from `estimated_completion` vs. today):
- ≤ 1 year: **green** (#22c55e) — urgent; price impact imminent.
- 1–3 years: **amber** (#f59e0b) — medium horizon.
- 3+ years: **blue** (#3b82f6) — long horizon.

A small inline legend explains the color scheme.

**Default view:** Centered on the Philippines (~12.8°N, 121.7°E), zoom 6.

## Detail Panel

A right-side panel (~380px wide) that slides in when a project line is clicked. Contents:

- Project name (heading)
- Status badge + completion bucket badge
- Type, implementing agency, concessionaire, funding modality
- Region + provinces
- Estimated completion date + confidence label
- Cost (formatted, e.g. "₱23.3B")
- Description paragraph
- Sources: bulleted list of clickable links
- Last updated date

Panel has a close button (×) in its header. Clicking another line replaces the contents.

## Filter UI

A collapsible rail on the left (~260px wide, collapsible to a 32px strip with a hamburger icon). Filters:

- **Region** (multi-select checkboxes, populated from data)
- **Province** (multi-select checkboxes, populated from data, scrollable)
- **Implementing agency** (multi-select)
- **Funding modality** (PPP / ODA / GAA / Hybrid checkboxes)
- **Project type** (road / bridge / expressway / rail / airport / seaport checkboxes)
- **Status** (approved / under_construction / partially_operational checkboxes)
- **Completion bucket** (≤1yr / 1-3yr / 3+yr checkboxes — with the same color swatches as the map)

A "Reset all" button at the bottom clears every filter. Filter logic is AND across categories, OR within a category. The map updates live as filters toggle. A small text counter shows "Showing X of Y projects."

## Update Workflow

The user manually edits `projects.json` to add, modify, or remove projects. No build step, no admin UI.

To support this, the v1 ships with:
- A `schema.json` documenting allowed values for each enum field.
- A header comment block in `projects.json` (or a sibling `README.md` in `data/`) explaining the inclusion rules so future-you doesn't lose the criteria.

Each record's `last_updated` field should be bumped when a project is touched.

## v1 Seed Data

Initial dataset will include 20–30 of the largest in-scope IFP transport projects. Indicative list:

- Metro Manila Subway (DOTr, ODA, partially operational)
- North-South Commuter Railway / NSCR (DOTr, ODA, under construction)
- MRT-7 (DOTr, PPP, under construction)
- LRT-1 Cavite Extension (LRMC, PPP, under construction)
- NLEX-SLEX Connector (MPTC, PPP, under construction)
- CALAX (MPTC, PPP, partially operational)
- CTBEX (Cavite-Tagaytay-Batangas Expressway, PPP, approved)
- Cebu BRT (DOTr, ODA, under construction)
- Davao BRT (DOTr, ODA, under construction)
- NAIA Rehabilitation (San Miguel-led PPP, under construction)
- Bulacan/Bulakan Airport access roads (under construction)
- Sangley Point International Airport (PPP, approved)
- Plus ~10–15 additional bridges, expressways, regional airports.

## Non-Goals

- No backend, no database, no auth — single-user static site.
- No automated scraping of NEDA/PPP Center sites in v1 (data quality from those sources isn't reliable enough for unattended ingest).
- No mobile-first design — desktop-primary, mobile-tolerable.
- No analytics or telemetry.
- No search box — filters cover the navigation need at this dataset size.
- No project-overlap heatmap, no property-listings integration. Those are future work.

## Future Work (Explicitly Deferred)

- Layer DPWH/OSM `highway=construction` ways for smaller local projects.
- Per-project status-change history (track when an estimate slips).
- Property-listing overlay (link in Lamudi/Carousell listings near each project).
- Mobile-first refactor.
