# JPC CSV inline-edit design

**Date:** 2026-05-04
**Scope:** `januarius-performance-center/index.html` only.

## Problem

The Januarius Performance Center report generator now accepts CSVs (in addition to XLSX), but the CSV format omits qualitative content the XLSX has: athlete age and test date, summary paragraph, key strengths and areas to improve, quote, benchmarks, section takeaways, and a few quantitative metrics (RFD@200ms, hand grip Impulse, hand grip Max RFD). The user wants to fill these in manually after upload, see the report update live, and have the manual entries flow into the downloaded PDF.

## Approach

**Inline `contenteditable`, gated to CSV uploads.** The report itself is the form. No separate panel. XLSX behavior is unchanged.

When a CSV is loaded, an `enableInlineEditing()` pass marks specific elements `contenteditable="true"` and adds a `.editable` class. A small instructional banner appears above the report. Edits mutate the DOM directly, so the live preview is always current. PDF export adds a temporary `body.exporting` class that hides editing affordances and any empty placeholder rows; the class is removed after `html2canvas` captures the canvas.

## Editable field inventory

- **Header:** Age, Test Date, Overall Profile label (donut center)
- **Sidebar:** Summary paragraph, 3× Key Strengths slots, 3× Areas to Improve slots, Quote
- **Benchmarks (4):** CMJ, Drop Jump, PVF, RFD
- **Section takeaways (3):** Shoulder, Hip, Grip
- **IMTP RFD value** (N/s number that's currently `—`)
- **Hand Grip Impulse:** value (N·s), range, avg
- **Hand Grip Max RFD:** value (N/s), side (L/R), range, avg
- **Override-only (already populated from IMTP asymmetry midpoint):** PVF Asymmetry %, RFD Asymmetry % (donut re-draws on edit)

Not editable (out of scope): athlete name, sport, sex, height, weight (all from CSV), L/R bar values (derived from range + asymmetry direction in CSV), school, position.

## Behavior details

**Activation.** `enableInlineEditing()` runs from `parseCSV` → `populate` chain only. The XLSX path does not call it.

**Affordance.** `.editable` gets a 1px gold dashed bottom border, `cursor: text`, and a faint yellow hover background. Empty editable elements show italic grey placeholder text via `[contenteditable="true"]:empty:before { content: attr(data-placeholder) }`.

**Strengths / Improve slots.** `enableInlineEditing()` pre-renders 3 `.si` rows in each list with an icon and an empty editable text div. A `.si` row whose editable text is blank gets a `.si-empty` marker class (updated on `input`); `.exporting .si-empty { display: none }` hides them in the PDF.

**Profile label.** Currently rendered as `WORD<br/>WORD`. For editing, it becomes a single contenteditable element. On `input`, we re-split the text on whitespace and re-render the `<br/>` for display continuity. (Or simpler: leave it as plain text without auto-`<br/>`; user can hit Enter for a line break.) **Choice:** plain text, user controls line break with Enter — no auto-splitting magic.

**RFD asymmetry donut.** The `#rfdPct` element becomes editable. On `input`, parse the number; if valid, call `drawRing()` and update the colour/label (high vs target) using the same logic as `populate`.

**Banner.** A `<div id="editBanner">` injected above `.stage`, hidden by default; `enableInlineEditing` reveals it. It reads: *"Click any underlined field to edit. Empty fields are hidden in the PDF."* It is hidden during PDF capture by `body.exporting #editBanner { display: none }`.

**PDF capture.** `exportPDF` adds `document.body.classList.add('exporting')` immediately before `html2canvas(...)` and removes it in the `finally` block. No data round-tripping needed because the DOM is the source of truth.

## Files touched

- `januarius-performance-center/index.html` — CSS additions for `.editable`, `.si-empty`, `#editBanner`, `.exporting` overrides; new `enableInlineEditing()` function called from CSV branch of `handleFile`/`populate`; `exportPDF` toggles `body.exporting`.

## Risks / known limits

- No validation on numeric fields. Typing "abc N/s" stays in the DOM. The asymmetry donut silently won't redraw if the input doesn't parse — acceptable.
- `contenteditable` formatting (paste from Word, etc.) can inject styled HTML. Mitigation: listen to `paste` and intercept with `plain text only` (`document.execCommand('insertText', false, plainText)`).
- Bullet lists are limited to 3 items each. If the user wants more, they'd edit the HTML or we'd add an "+ add" affordance later. Out of scope.
