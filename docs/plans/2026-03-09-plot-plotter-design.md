# Plot Plotter — Land Technical Description Plotter

**Date:** 2026-03-09
**Status:** Approved

## Overview

A client-side web app that takes Philippine Quadrantal Bearing System input (as used in TCT/OCT technical descriptions) and draws the lot boundary on a canvas, telling the user whether the plot closes.

## Architecture

- Single HTML file at `plot-plotter/index.html`
- No dependencies, no build step — matches existing site pattern
- Linked from main site footer (alongside Golf Adventure)
- Styled with JHI brand: dark green, gold, cream
- Layout: left panel (input) + right panel (canvas). Stacked on mobile.

## Input System

### Line-by-line mode
Form fields per bearing line:
- Direction 1: N or S (dropdown)
- Degrees: number
- Minutes: number
- Direction 2: E or W (dropdown)
- Distance: meters (number)
- "Add Line" button

### Paste mode
Textarea accepting full technical descriptions, e.g.:
```
N. 45 deg. 30 min. E., 25.50 m. to point 2;
S. 80 deg. 15 min. E., 30.00 m. to point 3;
```
Parsed via regex to extract bearings and distances.

### Editable line list
- Shows all parsed lines with bearing + distance
- Delete button per line
- Reorder capability

## Canvas Plot

- Sequential drawing from origin point
- Lines labeled with bearing and distance
- Points numbered (1, 2, 3...)
- Auto-scale and center to fit canvas
- North arrow indicator

## Closure Check

- Calculates distance between last point and first point
- Displays closure error: distance (m) and bearing
- Visual indicator: green (<0.10m), yellow (<1.0m), red (>1.0m)
- Dashed red line shows gap if not closed

## Export

- "Download as PNG" button
- "Clear All" button to reset

## Integration

- Footer link in `index.html` alongside Golf Adventure
- Accessible at `januarius.ph/plot-plotter/`
