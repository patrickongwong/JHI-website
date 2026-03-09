# Plot Plotter Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a client-side land plot plotter that parses Philippine Quadrantal Bearing System input and draws lot boundaries on a canvas with closure detection.

**Architecture:** Single HTML file with embedded CSS and JS at `plot-plotter/index.html`. Canvas-based rendering, regex-based parsing. No dependencies.

**Tech Stack:** Vanilla HTML5, CSS3, JavaScript, Canvas API

---

### Task 1: Create HTML scaffold with JHI styling

**Files:**
- Create: `plot-plotter/index.html`

**Step 1: Create the directory**

```bash
mkdir -p plot-plotter
```

**Step 2: Write the HTML file**

Create `plot-plotter/index.html` with:
- JHI brand colors: `--color-green-dark: #1a472a`, `--color-green: #2d6a4f`, `--color-gold: #c9a84c`, `--color-cream: #f5f1e8`
- Two-panel layout: left panel (input, 400px), right panel (canvas, flex-grow)
- Mobile responsive: stack vertically below 768px
- Header with "JHI Plot Plotter" title and link back to main site
- Left panel contains:
  - Tab switcher: "Line by Line" | "Paste"
  - Line-by-line form: Direction1 (N/S dropdown), Degrees (number), Minutes (number), Direction2 (E/W dropdown), Distance (number, meters), "Add Line" button
  - Paste textarea with "Parse" button
  - Editable line list (empty `<div id="lineList">`)
  - "Clear All" and "Download PNG" buttons
- Right panel contains:
  - `<canvas id="plotCanvas">` that fills the panel
  - Closure status bar below canvas
- Footer with copyright

**Step 3: Verify it renders**

Open in browser, verify layout appears correctly on desktop and mobile viewports.

**Step 4: Commit**

```bash
git add plot-plotter/index.html
git commit -m "feat: scaffold plot plotter HTML with JHI styling"
```

---

### Task 2: Implement line-by-line input and line list management

**Files:**
- Modify: `plot-plotter/index.html` (JS section)

**Step 1: Write the bearing data model**

```javascript
// Each line: { dir1: 'N'|'S', deg: number, min: number, dir2: 'E'|'W', dist: number }
let lines = [];
```

**Step 2: Implement addLine()**

When "Add Line" is clicked:
- Read form values, validate (degrees 0-90, minutes 0-59, distance > 0)
- Push to `lines` array
- Call `renderLineList()` and `drawPlot()`
- Clear form inputs

**Step 3: Implement renderLineList()**

For each line in `lines`:
- Display as: `N 45°30' E — 25.50 m`
- Add a delete button (🗑) that removes the line and re-renders
- Number each line (1, 2, 3...)

**Step 4: Implement deleteLine(index)**

- Remove from `lines` array
- Call `renderLineList()` and `drawPlot()`

**Step 5: Test manually**

- Add 3 lines, verify they appear in the list
- Delete the middle line, verify list updates
- Verify form validation rejects bad input

**Step 6: Commit**

```bash
git add plot-plotter/index.html
git commit -m "feat: add line-by-line input and line list management"
```

---

### Task 3: Implement paste parsing

**Files:**
- Modify: `plot-plotter/index.html` (JS section)

**Step 1: Write parseDescription(text)**

Regex pattern to match Philippine technical description formats:
```javascript
// Matches: N. 45 deg. 30 min. E., 25.50 m.
// Also: S 80°15' W, 30.00 m
// Also: N. 45 DEG. 30 MIN. E., 25.50 M.
const pattern = /([NS])\.?\s*(\d+)\s*(?:deg\.?|°)\s*(\d+)\s*(?:min\.?|['′])\s*([EW])\.?\s*[,.]?\s*(\d+\.?\d*)\s*(?:m\.?|meters?)/gi;
```

Parse all matches, push to `lines` array.

**Step 2: Wire up "Parse" button**

- Read textarea value
- Call `parseDescription(text)`
- Call `renderLineList()` and `drawPlot()`
- Show count of lines parsed

**Step 3: Test with sample Philippine technical description**

Test input:
```
N. 45 deg. 30 min. E., 25.50 m. to point 2;
S. 80 deg. 15 min. E., 30.00 m. to point 3;
S. 10 deg. 00 min. W., 28.00 m. to point 4;
N. 75 deg. 45 min. W., 32.00 m. to point 1;
```

Verify 4 lines are parsed correctly.

**Step 4: Commit**

```bash
git add plot-plotter/index.html
git commit -m "feat: add paste parsing for technical descriptions"
```

---

### Task 4: Implement canvas plot rendering

**Files:**
- Modify: `plot-plotter/index.html` (JS section)

**Step 1: Write bearingToAngle(dir1, deg, min, dir2)**

Convert quadrantal bearing to math angle (radians from east, CCW positive):
```javascript
function bearingToAngle(dir1, deg, min, dir2) {
    // Quadrantal: measured from N or S toward E or W
    // Convert to azimuth (clockwise from north) first
    let azimuth = deg + min / 60;
    if (dir1 === 'N' && dir2 === 'E') azimuth = azimuth;
    else if (dir1 === 'N' && dir2 === 'W') azimuth = 360 - azimuth;
    else if (dir1 === 'S' && dir2 === 'E') azimuth = 180 - azimuth;
    else if (dir1 === 'S' && dir2 === 'W') azimuth = 180 + azimuth;
    // Convert azimuth to math angle (east=0, CCW)
    // math_angle = 90 - azimuth (in degrees)
    const mathAngle = (90 - azimuth) * Math.PI / 180;
    return mathAngle;
}
```

**Step 2: Write computePoints()**

Starting from (0,0), compute each point by applying bearing + distance:
```javascript
function computePoints() {
    const points = [{ x: 0, y: 0 }];
    for (const line of lines) {
        const angle = bearingToAngle(line.dir1, line.deg, line.min, line.dir2);
        const last = points[points.length - 1];
        points.push({
            x: last.x + Math.cos(angle) * line.dist,
            y: last.y + Math.sin(angle) * line.dist
        });
    }
    return points;
}
```

**Step 3: Write drawPlot()**

- Compute points
- Find bounding box, calculate scale to fit canvas with padding
- Clear canvas
- Draw north arrow (top-right corner)
- Draw each line segment in dark green, 2px
- Label each point with its number
- Label each line with bearing and distance (at midpoint, rotated to match line)
- If lines.length > 0, draw closure gap (dashed red line from last point to first)

**Step 4: Handle canvas resize**

- Listen to window resize
- Redraw on resize

**Step 5: Test with sample data**

Manually add 4 lines forming a rough quadrilateral. Verify:
- Plot is visible, centered, and scaled
- Points are numbered
- Lines are labeled
- North arrow shows

**Step 6: Commit**

```bash
git add plot-plotter/index.html
git commit -m "feat: implement canvas plot rendering with labels"
```

---

### Task 5: Implement closure check

**Files:**
- Modify: `plot-plotter/index.html` (JS section)

**Step 1: Write checkClosure()**

```javascript
function checkClosure(points) {
    if (points.length < 3) return null;
    const first = points[0];
    const last = points[points.length - 1];
    const dx = last.x - first.x;
    const dy = last.y - first.y;
    const error = Math.sqrt(dx * dx + dy * dy);
    // Compute error bearing
    const azimuth = Math.atan2(dx, dy) * 180 / Math.PI;
    return { error, bearing: azimuth };
}
```

**Step 2: Update drawPlot() to show closure**

- Call `checkClosure(points)`
- Update closure status bar below canvas:
  - Green: "Plot CLOSED — Error: 0.05 m" (error < 0.10m)
  - Yellow: "Nearly closed — Error: 0.45 m" (error < 1.0m)
  - Red: "Plot OPEN — Error: 5.23 m, Bearing: N 45°30' E" (error >= 1.0m)
- If closed (< 0.10m), draw the last segment connecting to point 1 as a solid line
- If not closed, draw dashed red line from last point to point 1

**Step 3: Test with closing and non-closing plots**

- Test a known-closing rectangle (should show green)
- Remove one line (should show red with error distance)

**Step 4: Commit**

```bash
git add plot-plotter/index.html
git commit -m "feat: add closure check with visual indicators"
```

---

### Task 6: Implement PNG export and final polish

**Files:**
- Modify: `plot-plotter/index.html`

**Step 1: Implement downloadPNG()**

```javascript
function downloadPNG() {
    const link = document.createElement('a');
    link.download = 'plot.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}
```

**Step 2: Implement clearAll()**

- Reset `lines = []`
- Clear line list, clear canvas, reset closure status

**Step 3: Add tab switching**

- "Line by Line" tab shows form, hides textarea
- "Paste" tab shows textarea, hides form

**Step 4: Final polish**

- Ensure mobile layout works (stacked panels)
- Add placeholder text in textarea with example format
- Verify all buttons work end-to-end

**Step 5: Commit**

```bash
git add plot-plotter/index.html
git commit -m "feat: add PNG export, clear, tab switching, polish"
```

---

### Task 7: Link from main site and push

**Files:**
- Modify: `index.html` (footer)

**Step 1: Add footer link**

In `index.html`, add link to Plot Plotter in the footer alongside Golf Adventure:

```html
<a href="plot-plotter/index.html" style="color: var(--color-gold); text-decoration: none;">Plot Plotter</a>
```

**Step 2: Test Playwright**

Write a Playwright test that:
- Opens plot-plotter/index.html
- Adds 4 bearing lines forming a rectangle
- Verifies canvas is rendered
- Verifies closure status shows green
- Takes screenshot

**Step 3: Commit and push**

```bash
git add index.html plot-plotter/index.html
git commit -m "feat: add Plot Plotter tool for Philippine land title bearings"
git push
```
