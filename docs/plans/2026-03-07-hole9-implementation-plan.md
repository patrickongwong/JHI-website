# Hole 9 — Space Level Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a 9th space-themed hole with Boss fight, cinematics, score sharing redesign, and desktop control changes to golf-adventure.html.

**Architecture:** All changes are in a single file: `golf-adventure/golf-adventure.html`. The game is a canvas-based 2D platformer-golf hybrid. New systems (Boss, asteroids, cinematics) are added as extensions of existing patterns (enemies, particles, game modes).

**Tech Stack:** Vanilla JavaScript, HTML5 Canvas, no dependencies.

---

### Task 1: Desktop Spacebar Hit Mechanic for JJ

**Files:**
- Modify: `golf-adventure/golf-adventure.html:99` (controls hint text)
- Modify: `golf-adventure/golf-adventure.html:668-706` (keydown handler)
- Modify: `golf-adventure/golf-adventure.html:796-801` (mouse/touch aim handlers)
- Modify: `golf-adventure/golf-adventure.html:807-858` (startAim/moveAim/endAim)
- Modify: `golf-adventure/golf-adventure.html:862-879` (update - aim animation)
- Modify: `golf-adventure/golf-adventure.html:895` (jump key binding — remove spacebar from jump)
- Modify: `golf-adventure/golf-adventure.html:1147-1155` (status text)

**Step 1: Remove spacebar from jump binding**

In the `update()` function at line 895, spacebar is currently bound to jump. Remove `keys[' ']` from the jump check:

```javascript
// Line 895: change from
const jumpPressed = keys['w'] || keys['arrowup'] || keys[' '];
// to
const jumpPressed = keys['w'] || keys['arrowup'];
```

**Step 2: Add spacebar hit handler for JJ in keydown**

In the keydown handler (after line 704), add spacebar handling for JJ's hit mechanic. This reuses the existing `mobileHitMode`/`mobileAimPhase` system:

```javascript
// After line 704 (keys[e.key.toLowerCase()] = true;), add:
if (e.key === ' ' && gameMode === 'play' && activeCharacter === 'jj') {
    e.preventDefault();
    handleMobileHit(); // reuse the same mobile hit logic
}
```

**Step 3: Disable mouse drag aim for JJ on desktop**

In `startAim()` (line 807), add a guard that prevents mouse drag for JJ on non-touch devices:

```javascript
function startAim(pos) {
    if (activeCharacter === 'patrick') {
        // ... existing Patrick psychic code unchanged ...
        return;
    }
    // Only allow mouse/touch drag aim on mobile for JJ
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isMobile) return; // Desktop JJ uses spacebar instead
    // ... rest of existing JJ drag aim code ...
}
```

**Step 4: Show spacebar aim visualization on desktop**

The `mobileHitMode` visualization (lines 1804-1857) already draws the angle/power indicators. It works for both mobile and desktop since it reads from the same `mobileHitMode`/`mobileAimPhase` variables. No changes needed to drawing code.

**Step 5: Update the HIT button text for spacebar phases**

In `handleMobileHit()` (line 729), the button text updates (`btnHit.textContent`) are fine for mobile. For desktop, we need to also update the status text. Add after each phase change in `handleMobileHit()`:

```javascript
// At the start of handleMobileHit, after the Patrick check (line 745):
// After "mobileHitMode = true;" block:
document.getElementById('statusText').textContent = 'Press SPACE to set angle';

// After "mobileAimPhase = 'power';" block:
document.getElementById('statusText').textContent = 'Press SPACE to set power';

// After the execute hit block:
document.getElementById('statusText').textContent = '';
```

**Step 6: Update controls hint text**

Change line 109:
```html
<span>A/D or Arrow Keys to move | W or Up to jump | Space to hit</span>
```

**Step 7: Verify and commit**

Test in browser:
- JJ: spacebar triggers angle→power→hit sequence
- JJ: mouse drag no longer works on desktop
- JJ: mobile touch still works via HIT button
- Patrick: mouse drag still works for psychic control
- Spacebar no longer jumps

```bash
git add golf-adventure/golf-adventure.html
git commit -m "feat: replace mouse drag with spacebar hit mechanic for JJ on desktop"
```

---

### Task 2: Add Space Theme and Hole 9 Level Definition

**Files:**
- Modify: `golf-adventure/golf-adventure.html:99` (hole count display: /8 → /9)
- Modify: `golf-adventure/golf-adventure.html:161-297` (levels array — add hole 9)
- Modify: `golf-adventure/golf-adventure.html:1160-1165` (getTimeOfDay — add space)
- Modify: `golf-adventure/golf-adventure.html:1167-1245` (getTheme — add space theme)

**Step 1: Update hole count in HTML**

Line 99: Change `/8` to `/9`:
```html
<span>Hole <strong id="holeNum">1</strong>/9</span>
```

**Step 2: Add Hole 9 level definition**

After line 296 (closing `}` of hole 8), add the new level:

```javascript
    { // Hole 9 - Space: The Final Frontier
        par: 5,
        playerStart: { x: 60, y: 0 },
        ballStart: { x: 180, y: 0 },
        holePos: { x: 1400, y: -60 },
        terrain: [
            { x: 0, y: 0, w: 250, h: 0 },         // starting flat
            { x: 250, y: 0, w: 150, h: -30 },       // crater rim up
            { x: 400, y: -30, w: 100, h: 30 },      // crater down
            { x: 500, y: 0, w: 200, h: 0 },         // flat mid
            { x: 700, y: 0, w: 100, h: -40 },       // ridge up
            { x: 800, y: -40, w: 150, h: 0 },       // ridge top
            { x: 950, y: -40, w: 100, h: 40 },      // ridge down
            { x: 1050, y: 0, w: 150, h: -20 },      // gentle rise
            { x: 1200, y: -20, w: 100, h: -40 },    // steep rise to boss arena
            { x: 1300, y: -60, w: 300, h: 0 }       // boss arena flat
        ],
        platforms: [
            { x: 480, y: -50, w: 80 },   // over crater
            { x: 920, y: -70, w: 70 }    // above ridge
        ],
        water: [],
        sand: [],
        enemies: [
            { x: 550, hp: 4, patrol: [500, 700] },
            { x: 850, hp: 5, patrol: [800, 950] },
            { x: 1100, hp: 5, patrol: [1050, 1200] }
        ],
        boss: {
            x: 1400,
            hp: 20,
            attackCycle: ['barrage', 'slam', 'boulder']
        },
        asteroids: [
            { x: 350, y: -80, driftSpeed: 0.3, driftRange: 60, phase: 0, radius: 18 },
            { x: 620, y: -100, driftSpeed: 0.2, driftRange: 45, phase: 1.5, radius: 22 },
            { x: 880, y: -60, driftSpeed: 0.35, driftRange: 50, phase: 3.0, radius: 15 },
            { x: 1050, y: -90, driftSpeed: 0.25, driftRange: 55, phase: 4.2, radius: 20 },
            { x: 1250, y: -110, driftSpeed: 0.15, driftRange: 40, phase: 5.5, radius: 16 }
        ]
    }
```

**Step 3: Update getTimeOfDay()**

At line 1160-1165, add space time of day:

```javascript
function getTimeOfDay() {
    if (currentHole <= 1) return 'day';
    if (currentHole <= 3) return 'afternoon';
    if (currentHole <= 5) return 'night';
    if (currentHole <= 7) return 'storm';
    return 'space';
}
```

**Step 4: Add space theme to getTheme()**

Add a new case in `getTheme()` for space (before the default night return at line 1226):

```javascript
if (tod === 'space') return {
    sky: ['#000005', '#020210', '#050520', '#080830', '#0a0a20'],
    starAlpha: 0.9,
    cloudAlpha: 0,
    sunMoon: 'earth',
    sunY: 0,
    hillFar: 'rgba(40, 40, 50, 0.4)',
    hillNear: 'rgba(50, 50, 60, 0.35)',
    grassTop: '#8a8a8e',
    grassMid: '#6a6a70',
    grassBot: '#4a4a52',
    grassBlade: '#9a9aa0',
    dirt: '#5a5a60',
    earth: '#3a3a42',
    platGrass: '#8a8a8e',
    platDark: '#5a5a62',
    platBlade: '#a0a0a8',
    ambientTint: 'rgba(50, 80, 200, 0.03)',
};
```

**Step 5: Commit**

```bash
git add golf-adventure/golf-adventure.html
git commit -m "feat: add Hole 9 level definition and space theme"
```

---

### Task 3: Space Background — Earth, Dense Starfield, No Hills/Clouds

**Files:**
- Modify: `golf-adventure/golf-adventure.html:1273-1444` (draw function — sky, stars, sun/moon, hills, clouds sections)

**Step 1: Add dense starfield for space**

Replace the star rendering section (lines 1283-1296). When `tod === 'space'`, render 80+ stars of varied sizes:

```javascript
// Stars
if (theme.starAlpha > 0) {
    const starCount = tod === 'space' ? 80 : 20;
    const starSeed = tod === 'space'
        ? Array.from({length: 80}, (_, i) => (i * 97 + 31) % 800)
        : [23, 67, 134, 201, 278, 345, 412, 489, 556, 623, 690, 45, 112, 179, 246, 313, 380, 447, 514, 581];
    starSeed.forEach((sx, i) => {
        const sy = 10 + (i * 37 + sx) % (H * (tod === 'space' ? 0.7 : 0.35));
        const blink = 0.3 + 0.7 * Math.abs(Math.sin(gameTime * 0.01 + i));
        ctx.globalAlpha = blink * theme.starAlpha;
        ctx.fillStyle = i % 7 === 0 ? 'rgba(200,220,255,0.8)' : 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        const starSize = tod === 'space' ? (1 + (i % 4) * 0.5) : (1 + (i % 3) * 0.3);
        ctx.arc(sx % W, sy, starSize, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}
```

**Step 2: Draw Earth in background**

In the sun/moon rendering section (lines 1298-1369), add an `'earth'` case in the `sunMoon` checks. Draw a large Earth:

```javascript
if (tod === 'space') {
    // Massive Earth in background (Earthrise from moon)
    const earthX = W * 0.75;
    const earthY = H * 0.35;
    const earthR = H * 0.45; // very large

    // Earth glow
    const earthGlow = ctx.createRadialGradient(earthX, earthY, earthR * 0.9, earthX, earthY, earthR * 1.3);
    earthGlow.addColorStop(0, 'rgba(100, 180, 255, 0.15)');
    earthGlow.addColorStop(1, 'rgba(100, 180, 255, 0)');
    ctx.fillStyle = earthGlow;
    ctx.beginPath();
    ctx.arc(earthX, earthY, earthR * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Earth body
    ctx.save();
    ctx.beginPath();
    ctx.arc(earthX, earthY, earthR, 0, Math.PI * 2);
    ctx.clip();

    // Ocean base
    const oceanGrad = ctx.createRadialGradient(earthX - earthR * 0.2, earthY - earthR * 0.2, earthR * 0.1, earthX, earthY, earthR);
    oceanGrad.addColorStop(0, '#4a90d9');
    oceanGrad.addColorStop(0.5, '#2a6ab0');
    oceanGrad.addColorStop(1, '#1a4a80');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(earthX - earthR, earthY - earthR, earthR * 2, earthR * 2);

    // Landmasses (simplified continent shapes)
    ctx.fillStyle = '#3a8a4a';
    // Large continent (top-right area)
    ctx.beginPath();
    ctx.ellipse(earthX + earthR * 0.2, earthY - earthR * 0.15, earthR * 0.35, earthR * 0.25, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Smaller continent (bottom-left)
    ctx.beginPath();
    ctx.ellipse(earthX - earthR * 0.3, earthY + earthR * 0.3, earthR * 0.2, earthR * 0.15, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // Island cluster (center)
    ctx.beginPath();
    ctx.ellipse(earthX - earthR * 0.05, earthY + earthR * 0.05, earthR * 0.12, earthR * 0.08, 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Cloud swirls
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    const cloudPhase = gameTime * 0.0005; // very slow rotation
    for (let i = 0; i < 6; i++) {
        const cx = earthX + Math.cos(i * 1.1 + cloudPhase) * earthR * 0.5;
        const cy = earthY + Math.sin(i * 0.8 + cloudPhase) * earthR * 0.4;
        ctx.beginPath();
        ctx.ellipse(cx, cy, earthR * 0.18, earthR * 0.06, i * 0.5 + cloudPhase, 0, Math.PI * 2);
        ctx.fill();
    }

    // Atmosphere edge glow
    ctx.restore();
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(earthX, earthY, earthR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.15)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(earthX, earthY, earthR + 3, 0, Math.PI * 2);
    ctx.stroke();
}
```

**Step 3: Skip hills, trees, and clouds for space**

Wrap the hills/trees/clouds sections (lines 1371-1443) in a `tod !== 'space'` check:

```javascript
if (tod !== 'space') {
    // Distant hills (parallax) ... existing code ...
    // Trees on distant hills ... existing code ...
    // Closer hills ... existing code ...
    // Clouds ... existing code ...
    // Afternoon tint on clouds ... existing code ...
}
```

**Step 4: Commit**

```bash
git add golf-adventure/golf-adventure.html
git commit -m "feat: add space background with Earth, dense starfield"
```

---

### Task 4: Lunar Terrain Rendering and Reduced Gravity

**Files:**
- Modify: `golf-adventure/golf-adventure.html:1448-1526` (terrain drawing — lunar style)
- Modify: `golf-adventure/golf-adventure.html:1529-1549` (platform drawing — lunar style)
- Modify: `golf-adventure/golf-adventure.html:959-960` (gravity — reduce for space)
- Modify: `golf-adventure/golf-adventure.html:912` (player gravity)

**Step 1: Apply reduced gravity for space**

At line 912 (player gravity) and line 960 (ball gravity), use a gravity multiplier:

```javascript
// Add helper near constants (after line 158):
function getGravity() {
    return getTimeOfDay() === 'space' ? GRAVITY * 0.65 : GRAVITY;
}
```

Then replace all `GRAVITY` references in physics with `getGravity()`:
- Line 912: `player.vy += getGravity();`
- Line 960: `ball.vy += getGravity();`
- Line 488: `p.vy += getGravity() * 0.5;` (sand projectiles)
- Line 1251: `vy += getGravity();` (trajectory simulation)

**Step 2: Add lunar terrain rendering**

In the terrain drawing (lines 1448-1526), when `tod === 'space'`, replace grass/dirt rendering with rocky lunar surface. Add crater details instead of grass blades and flowers:

```javascript
// Inside the terrain forEach, after drawing the base layers but before grass blades:
if (tod === 'space') {
    // Skip grass blades and flowers for space
    // Instead add crater marks on surface
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for (let cx = t.x + 30; cx < t.x + t.w - 30; cx += 50 + (cx * 7 % 40)) {
        const progress = (cx - t.x) / t.w;
        const cy = startY + t.h * progress + 2;
        const cr = 4 + (cx * 3 % 6);
        ctx.beginPath();
        ctx.ellipse(cx, cy, cr, cr * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    // Rocky texture dots
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let rx = t.x + 5; rx < t.x + t.w - 5; rx += 8 + (rx * 11 % 7)) {
        const progress = (rx - t.x) / t.w;
        const ry = startY + t.h * progress + 1 + (rx * 3 % 4);
        ctx.beginPath();
        ctx.arc(rx, ry, 1 + (rx % 2), 0, Math.PI * 2);
        ctx.fill();
    }
} else {
    // existing grass blades and flowers code
}
```

**Step 3: Lunar platform rendering**

In the platform drawing (lines 1529-1549), when space, use gray rock instead of grass:

```javascript
// Inside platforms forEach, the existing code already uses theme colors
// which are gray for space. The grass blades on platforms should be skipped:
if (tod !== 'space') {
    // existing grass on platform code
}
```

**Step 4: Disable wind for space**

In `initWind()` (line 389), ensure space has no wind:

```javascript
function initWind() {
    const tod = getTimeOfDay();
    if (tod === 'storm') {
        wind.direction = Math.random() < 0.5 ? -1 : 1;
        wind.strength = 0.08 + Math.random() * 0.04;
    } else {
        wind.direction = 0;
        wind.strength = 0;
    }
}
```
(Already correct — no changes needed, space falls into the else.)

**Step 5: Skip storm effects for space**

In `drawStormEffects()` (line 2027), it already checks `getTimeOfDay() !== 'storm'` and returns early. No change needed.

**Step 6: Commit**

```bash
git add golf-adventure/golf-adventure.html
git commit -m "feat: add lunar terrain rendering and reduced gravity for space"
```

---

### Task 5: Floating Asteroids System

**Files:**
- Modify: `golf-adventure/golf-adventure.html` — add asteroid state, update, draw, and ball collision

**Step 1: Add asteroid state**

Near the enemy state variables (after line 402), add:

```javascript
let activeAsteroids = [];
```

**Step 2: Initialize asteroids in initHole()**

In `initHole()` (around line 656, after `initEnemies()`), add:

```javascript
// Init asteroids
const asteroidDefs = level.asteroids || [];
activeAsteroids = asteroidDefs.map(a => ({
    baseX: a.x,
    baseY: canvas.height - 80 * S + a.y,
    x: a.x,
    y: canvas.height - 80 * S + a.y,
    driftSpeed: a.driftSpeed,
    driftRange: a.driftRange,
    phase: a.phase,
    radius: a.radius
}));
```

**Step 3: Update asteroids in update()**

In `update()`, after `updateSandProjectiles()` (line 1108), add:

```javascript
// Update asteroids
activeAsteroids.forEach(a => {
    a.x = a.baseX + Math.sin(gameTime * 0.008 * a.driftSpeed + a.phase) * a.driftRange;
    a.y = a.baseY + Math.cos(gameTime * 0.006 * a.driftSpeed + a.phase * 0.7) * (a.driftRange * 0.5);
});

// Ball-asteroid collision
if (ball.active && !ball.sunk) {
    activeAsteroids.forEach(a => {
        const dx = ball.x - a.x;
        const dy = ball.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < a.radius + ball.r) {
            // Bounce ball off asteroid
            const nx = dx / dist;
            const ny = dy / dist;
            const dot = ball.vx * nx + ball.vy * ny;
            if (dot < 0) {
                ball.vx -= 2 * dot * nx;
                ball.vy -= 2 * dot * ny;
                ball.vx *= 0.8;
                ball.vy *= 0.8;
                // Push ball outside asteroid
                ball.x = a.x + nx * (a.radius + ball.r + 1);
                ball.y = a.y + ny * (a.radius + ball.r + 1);
                spawnParticles(ball.x, ball.y, '#888', 5, 2);
            }
        }
    });
}
```

**Step 4: Draw asteroids**

In `draw()`, after drawing terrain/platforms but before enemies (around line 1644), add:

```javascript
// Asteroids
activeAsteroids.forEach(a => {
    // Shadow on ground
    const gy = getGroundY(a.x);
    if (gy !== null) {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(a.x, gy, a.radius * 0.6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Asteroid body (irregular rock)
    ctx.save();
    ctx.translate(a.x, a.y);
    const rockGrad = ctx.createRadialGradient(-a.radius * 0.3, -a.radius * 0.3, a.radius * 0.1, 0, 0, a.radius);
    rockGrad.addColorStop(0, '#8a8080');
    rockGrad.addColorStop(0.6, '#6a6060');
    rockGrad.addColorStop(1, '#4a4040');
    ctx.fillStyle = rockGrad;
    ctx.beginPath();
    // Irregular shape using multiple arcs
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const r = a.radius * (0.8 + 0.2 * Math.sin(i * 2.5 + a.phase));
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Crater marks
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.arc(a.radius * 0.2, -a.radius * 0.1, a.radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-a.radius * 0.3, a.radius * 0.2, a.radius * 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
});
```

**Step 5: Commit**

```bash
git add golf-adventure/golf-adventure.html
git commit -m "feat: add floating asteroid obstacles with ball collision"
```

---

### Task 6: Boss — "The Sand King"

**Files:**
- Modify: `golf-adventure/golf-adventure.html` — add boss state, AI, attacks, rendering, and ball interaction

**Step 1: Add boss state variables**

After the `activeAsteroids` declaration, add:

```javascript
let boss = null;
let bossProjectiles = []; // for barrage and boulder
let bossShockwave = null; // { x, leftX, rightX, speed, damage, active }
```

**Step 2: Initialize boss in initHole()**

In `initHole()`, after asteroid init, add:

```javascript
// Init boss
if (level.boss) {
    const bossGroundY = getGroundY(level.boss.x) || (canvas.height - 80 * S);
    boss = {
        x: level.boss.x,
        y: bossGroundY,
        hp: level.boss.hp,
        maxHp: level.boss.hp,
        attackCycle: level.boss.attackCycle,
        attackIndex: 0,
        attackTimer: 180, // frames until first attack
        attackPhase: 'idle', // 'idle', 'windup', 'attacking'
        windupTimer: 0,
        dead: false,
        deathTimer: 0,
        slamY: 0, // for slam animation
        slamActive: false
    };
    bossProjectiles = [];
    bossShockwave = null;
} else {
    boss = null;
    bossProjectiles = [];
    bossShockwave = null;
}
```

**Step 3: Boss update logic**

Add a `updateBoss()` function:

```javascript
function updateBoss() {
    if (!boss || boss.dead) {
        if (boss && boss.dead) {
            boss.deathTimer--;
            if (boss.deathTimer <= 0) boss = null;
        }
        // Update shockwave even after death
        updateBossShockwave();
        updateBossProjectiles();
        return;
    }

    boss.attackTimer--;

    // Attack cycle
    if (boss.attackTimer <= 0 && boss.attackPhase === 'idle') {
        const attack = boss.attackCycle[boss.attackIndex % boss.attackCycle.length];
        boss.attackIndex++;

        if (attack === 'barrage') {
            // Fire 3 sand projectiles in fan spread
            const baseAngle = Math.atan2(
                (player.y + player.h / 2) - (boss.y - 40),
                player.x - boss.x
            );
            for (let i = -1; i <= 1; i++) {
                const angle = baseAngle + i * 0.3;
                bossProjectiles.push({
                    x: boss.x,
                    y: boss.y - 40,
                    vx: Math.cos(angle) * 5,
                    vy: Math.sin(angle) * 5 - 3,
                    damage: 2,
                    type: 'sand',
                    radius: 5
                });
            }
            boss.attackTimer = 150;
        } else if (attack === 'slam') {
            boss.attackPhase = 'windup';
            boss.windupTimer = 30; // 0.5s windup
            boss.slamActive = true;
        } else if (attack === 'boulder') {
            boss.attackPhase = 'windup';
            boss.windupTimer = 60; // 1s telegraph
        }
    }

    // Windup phase
    if (boss.attackPhase === 'windup') {
        boss.windupTimer--;
        const attack = boss.attackCycle[(boss.attackIndex - 1) % boss.attackCycle.length];

        if (attack === 'slam' && boss.windupTimer <= 0) {
            // Jump up then slam
            boss.slamY = -40;
            boss.attackPhase = 'attacking';
            boss.windupTimer = 15; // slam duration
        } else if (attack === 'slam' && boss.windupTimer > 0) {
            // Rising during windup
            boss.slamY = -40 * (1 - boss.windupTimer / 30);
        }

        if (attack === 'boulder' && boss.windupTimer <= 0) {
            // Launch boulder
            const angle = Math.atan2(
                (player.y + player.h / 2) - (boss.y - 40),
                player.x - boss.x
            );
            bossProjectiles.push({
                x: boss.x,
                y: boss.y - 50,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3 - 4,
                damage: 3,
                type: 'boulder',
                radius: 12
            });
            boss.attackPhase = 'idle';
            boss.attackTimer = 180;
        }
    }

    // Slam landing
    if (boss.attackPhase === 'attacking') {
        boss.windupTimer--;
        if (boss.windupTimer <= 0) {
            boss.slamY = 0;
            boss.slamActive = false;
            boss.attackPhase = 'idle';
            boss.attackTimer = 180;
            // Create shockwave
            bossShockwave = {
                leftX: boss.x,
                rightX: boss.x,
                speed: 5,
                damage: 2,
                timer: 60, // how long shockwave lasts
                hit: false
            };
            spawnParticles(boss.x, boss.y, '#d4a853', 20, 5);
            // Knock ball away if nearby
            const bdx = ball.x - boss.x;
            const bdy = ball.y - boss.y;
            const bdist = Math.sqrt(bdx * bdx + bdy * bdy);
            if (bdist < 100) {
                const pushDir = bdx > 0 ? 1 : -1;
                ball.vx += pushDir * 8;
                ball.vy -= 5;
                ball.onGround = false;
            }
        } else {
            // Descending
            boss.slamY = -40 * (boss.windupTimer / 15);
        }
    }

    // Ball collision with boss
    if (ball.active && !ball.sunk) {
        const bdx = ball.x - boss.x;
        const bdy = ball.y - (boss.y - 25);
        const bdist = Math.sqrt(bdx * bdx + bdy * bdy);
        if (bdist < 35 && (Math.abs(ball.vx) > 1 || Math.abs(ball.vy) > 1)) {
            boss.hp -= getClubDamage();
            // Bounce ball back (deflect)
            const nx = bdx / bdist;
            const ny = bdy / bdist;
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            ball.vx = nx * speed * 0.7;
            ball.vy = ny * speed * 0.7 - 2;
            ball.onGround = false;
            spawnParticles(boss.x, boss.y - 25, '#d4a853', 12, 4);

            if (boss.hp <= 0) {
                boss.dead = true;
                boss.deathTimer = 90;
                spawnParticles(boss.x, boss.y - 25, '#d4a853', 40, 8);
                spawnParticles(boss.x, boss.y - 25, '#ff4444', 20, 6);
            }
        }
    }

    // Player collision with boss (contact damage)
    const pdx = player.x - boss.x;
    const pdy = (player.y + player.h / 2) - (boss.y - 20);
    const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
    if (pdist < 40) {
        damagePlayer(1);
    }
}

function updateBossShockwave() {
    if (!bossShockwave) return;
    bossShockwave.leftX -= bossShockwave.speed;
    bossShockwave.rightX += bossShockwave.speed;
    bossShockwave.timer--;

    // Check player hit
    if (!bossShockwave.hit && player.onGround) {
        if (player.x >= bossShockwave.leftX && player.x <= bossShockwave.rightX) {
            damagePlayer(bossShockwave.damage);
            bossShockwave.hit = true;
        }
    }

    if (bossShockwave.timer <= 0) {
        bossShockwave = null;
    }
}

function updateBossProjectiles() {
    bossProjectiles.forEach(p => {
        p.vy += getGravity() * 0.5;
        p.x += p.vx;
        p.y += p.vy;

        // Player hit
        const dx = p.x - player.x;
        const dy = p.y - (player.y + player.h / 2);
        if (Math.sqrt(dx * dx + dy * dy) < p.radius + 15) {
            damagePlayer(p.damage);
            p.hit = true;
            spawnParticles(p.x, p.y, p.type === 'boulder' ? '#888' : '#d4a853', 8, 3);
        }

        // Ground hit
        const gy = getGroundY(p.x);
        if ((gy !== null && p.y > gy) || p.y > canvas.height + 20) {
            p.hit = true;
            if (p.type === 'boulder') {
                spawnParticles(p.x, p.y, '#888', 10, 3);
            }
        }
    });
    bossProjectiles = bossProjectiles.filter(p => !p.hit);
}
```

**Step 4: Call boss updates in update()**

In `update()`, after `updateSandProjectiles()` (and after asteroid updates), add:

```javascript
updateBoss();
```

**Step 5: Boss blocks hole**

In the hole check section (lines 1110-1123), add a guard:

```javascript
// Check hole — boss must be dead first
const bossAlive = boss && !boss.dead;
if (hDist < hole.r && speed < 7 && !bossAlive) {
    // ... existing hole sunk code ...
}
```

Also gate the gravity pull near hole (lines 1125-1128):
```javascript
if (hDist < hole.r + 15 && speed < 4 && ball.onGround && !bossAlive) {
    ball.vx += (hole.x - ball.x) * 0.008;
}
```

**Step 6: Draw boss**

Add a `drawBoss()` function and call it after `drawEnemies()`:

```javascript
function drawBoss() {
    if (!boss) return;

    if (boss.dead) {
        // Death explosion animation
        ctx.globalAlpha = boss.deathTimer / 90;
        for (let i = 0; i < 10; i++) {
            const ox = Math.sin(i * 1.3 + boss.deathTimer * 0.1) * (90 - boss.deathTimer) * 1.5;
            const oy = -Math.abs(Math.cos(i * 0.9 + boss.deathTimer * 0.15)) * (90 - boss.deathTimer);
            ctx.fillStyle = i % 2 === 0 ? '#d4a853' : '#ff4444';
            ctx.beginPath();
            ctx.arc(boss.x + ox, boss.y - 20 + oy, 6 + (i % 3) * 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        return;
    }

    const bx = boss.x;
    const by = boss.y + boss.slamY;

    // Glowing red aura
    const auraPulse = 0.15 + 0.1 * Math.sin(gameTime * 0.05);
    const auraGrad = ctx.createRadialGradient(bx, by - 25, 10, bx, by - 25, 50);
    auraGrad.addColorStop(0, `rgba(255, 0, 0, ${auraPulse})`);
    auraGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(bx, by - 25, 50, 0, Math.PI * 2);
    ctx.fill();

    // Body (2x size sandbag, darker color)
    ctx.fillStyle = '#b08040';
    ctx.beginPath();
    ctx.moveTo(bx - 24, by);
    ctx.lineTo(bx - 28, by - 44);
    ctx.quadraticCurveTo(bx, by - 64, bx + 28, by - 44);
    ctx.lineTo(bx + 24, by);
    ctx.closePath();
    ctx.fill();

    // Red tint overlay
    ctx.fillStyle = 'rgba(180, 30, 30, 0.15)';
    ctx.beginPath();
    ctx.moveTo(bx - 24, by);
    ctx.lineTo(bx - 28, by - 44);
    ctx.quadraticCurveTo(bx, by - 64, bx + 28, by - 44);
    ctx.lineTo(bx + 24, by);
    ctx.closePath();
    ctx.fill();

    // Crown-like tied top
    ctx.strokeStyle = '#6a4a20';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx - 10, by - 56);
    ctx.lineTo(bx - 6, by - 66);
    ctx.lineTo(bx - 2, by - 58);
    ctx.lineTo(bx + 2, by - 68);
    ctx.lineTo(bx + 6, by - 58);
    ctx.lineTo(bx + 10, by - 56);
    ctx.stroke();

    // Texture lines
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx - 16, by - 16);
    ctx.lineTo(bx + 16, by - 16);
    ctx.moveTo(bx - 20, by - 32);
    ctx.lineTo(bx + 20, by - 32);
    ctx.stroke();

    // Legs
    ctx.strokeStyle = '#6a4a20';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bx - 10, by);
    ctx.lineTo(bx - 12, by + 14);
    ctx.moveTo(bx + 10, by);
    ctx.lineTo(bx + 12, by + 14);
    ctx.stroke();

    // Glowing red eyes
    const eyeGlow = 0.6 + 0.3 * Math.sin(gameTime * 0.08);
    [-8, 8].forEach(ex => {
        const glow = ctx.createRadialGradient(bx + ex, by - 36, 2, bx + ex, by - 36, 12);
        glow.addColorStop(0, `rgba(255, 0, 0, ${eyeGlow})`);
        glow.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(bx + ex, by - 36, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(bx + ex, by - 36, 3.5, 0, Math.PI * 2);
        ctx.fill();
    });

    // Windup indicator (telegraph for boulder)
    const currentAttack = boss.attackCycle[(boss.attackIndex - 1) % boss.attackCycle.length];
    if (boss.attackPhase === 'windup' && currentAttack === 'boulder') {
        const warningAlpha = 0.3 + 0.3 * Math.sin(gameTime * 0.2);
        ctx.fillStyle = `rgba(255, 100, 0, ${warningAlpha})`;
        ctx.font = 'bold 16px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('!', bx, by - 75);
        ctx.textAlign = 'left';
    }

    // HP bar
    if (boss.hp < boss.maxHp) {
        const barW = 50, barH = 5;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(bx - barW / 2, by - 80, barW, barH);
        const hpRatio = boss.hp / boss.maxHp;
        const barColor = hpRatio > 0.5 ? '#4ade80' : hpRatio > 0.25 ? '#fbbf24' : '#ef4444';
        ctx.fillStyle = barColor;
        ctx.fillRect(bx - barW / 2, by - 80, barW * hpRatio, barH);
    }

    // Draw shockwave
    if (bossShockwave) {
        const alpha = bossShockwave.timer / 60;
        ctx.strokeStyle = `rgba(212, 168, 83, ${alpha * 0.7})`;
        ctx.lineWidth = 3;
        // Left wave
        const gy = getGroundY(bossShockwave.leftX);
        const gyr = getGroundY(bossShockwave.rightX);
        if (gy !== null) {
            ctx.beginPath();
            ctx.moveTo(bossShockwave.leftX, gy - 10);
            ctx.lineTo(bossShockwave.leftX + 15, gy);
            ctx.stroke();
        }
        if (gyr !== null) {
            ctx.beginPath();
            ctx.moveTo(bossShockwave.rightX, gyr - 10);
            ctx.lineTo(bossShockwave.rightX - 15, gyr);
            ctx.stroke();
        }
    }

    // Boss projectiles
    bossProjectiles.forEach(p => {
        if (p.type === 'boulder') {
            ctx.fillStyle = '#6a5a4a';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.arc(p.x + 2, p.y - 2, p.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = '#c4a040';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(200, 160, 60, 0.4)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius + 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}
```

**Step 7: Call drawBoss() in draw()**

After `drawEnemies()` call (line 1645), add:
```javascript
drawBoss();
```

**Step 8: Commit**

```bash
git add golf-adventure/golf-adventure.html
git commit -m "feat: add Sand King boss with 3 attack patterns"
```

---

### Task 7: Frightened Character on Hole 9

**Files:**
- Modify: `golf-adventure/golf-adventure.html:2058-2385` (drawPlayer function)

**Step 1: Add space-frightened expression for JJ**

In the `drawPlayer()` function, in the expression section (lines 2339-2378), add a `'space'` case. Also add trembling and sweat effects:

At the start of `drawPlayer()` (after line 2068, `const u = H / 56;`), add trembling for space:

```javascript
// Space trembling
const isSpace = getTimeOfDay() === 'space' && gameMode === 'play';
if (isSpace) {
    ctx.translate((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
}
```

In the expression block (around line 2340), add a space case before the closing `}`:

```javascript
} else if (tod === 'space') {
    // Terrified! Wide eyes, open mouth, sweat
    // Wider eyes (replace normal eye draws above by overriding)
    // Open mouth - large O
    ctx.fillStyle = '#5a2a1a';
    ctx.beginPath();
    ctx.ellipse(0, headCenter + 4.5 * u, 3 * u, 2.5 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    // Raised eyebrows
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1.2 * u;
    ctx.beginPath();
    ctx.moveTo(-7 * u, headCenter - 5.5 * u);
    ctx.quadraticCurveTo(-4 * u, headCenter - 8 * u, -1 * u, headCenter - 5.5 * u);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(1 * u, headCenter - 5.5 * u);
    ctx.quadraticCurveTo(4 * u, headCenter - 8 * u, 7 * u, headCenter - 5.5 * u);
    ctx.stroke();

    // Sweat drops
    const sweatPhase = gameTime * 0.06;
    ctx.fillStyle = 'rgba(100, 180, 255, 0.7)';
    const sweatY = headCenter - 4 * u + Math.abs(Math.sin(sweatPhase)) * 10 * u;
    ctx.beginPath();
    ctx.ellipse(-10 * u, sweatY, 1.2 * u, 2 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    const sweatY2 = headCenter - 2 * u + Math.abs(Math.sin(sweatPhase + 1.5)) * 10 * u;
    ctx.beginPath();
    ctx.ellipse(10 * u, sweatY2, 1.2 * u, 2 * u, 0, 0, Math.PI * 2);
    ctx.fill();
}
```

Override the JJ eyes when in space to be wider/shrunken pupils — add right before the normal eye drawing (line 2322):

```javascript
// Eyes - override for space
if (getTimeOfDay() === 'space' && gameMode === 'play') {
    // Wide whites of eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-4 * u, headCenter - 0.5 * u, 2.5 * u, 2 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(4.5 * u, headCenter - 0.5 * u, 2.5 * u, 2 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tiny pupils
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(-4 * u, headCenter - 0.5 * u, 0.6 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4.5 * u, headCenter - 0.5 * u, 0.6 * u, 0, Math.PI * 2);
    ctx.fill();
} else {
    // Normal eyes (existing code)
    ctx.fillStyle = '#2a2a2a';
    // ... existing eye code ...
}
```

Add knocking knees in the leg drawing — when space, add extra wobble:

```javascript
// In the legs section, modify legSwing for space:
const legSwing = player.walking
    ? Math.sin(player.walkFrame * 4) * 7
    : (isSpace ? Math.sin(gameTime * 0.15) * 3 : 0);
```

(Note: `isSpace` must be available in this scope — it should be set based on getTimeOfDay() at the top of drawPlayer.)

**Step 2: Commit**

```bash
git add golf-adventure/golf-adventure.html
git commit -m "feat: add frightened character animation for Hole 9"
```

---

### Task 8: Space Transition Cinematic

**Files:**
- Modify: `golf-adventure/golf-adventure.html` — add cinematic game mode and rendering

**Step 1: Add cinematic state**

Near the game state variables (around line 309), add:

```javascript
let cinematicMode = null; // null, 'space-transition', 'ending'
let cinematicFrame = 0;
let cinematicSkipped = false;
```

**Step 2: Trigger cinematic after Hole 8 shop exit**

In the shop exit logic (where player walks through door and `gameMode = 'play'` is set — this is in the shop update), add a check: if `currentHole === 8` (about to start hole 9), trigger the space transition cinematic instead of going straight to play:

Find the shop door exit code and modify it:

```javascript
// When exiting shop and currentHole will be 8 (index for hole 9):
if (currentHole === 8) {
    cinematicMode = 'space-transition';
    cinematicFrame = 0;
    cinematicSkipped = false;
    gameMode = 'cinematic';
} else {
    gameMode = 'play';
    initHole();
}
```

**Step 3: Add cinematic update and draw functions**

```javascript
function updateCinematic() {
    cinematicFrame++;
    // Check for skip
    if (cinematicSkipped) {
        endCinematic();
        return;
    }
    if (cinematicMode === 'space-transition' && cinematicFrame > 480) { // ~8 seconds
        endCinematic();
    }
    if (cinematicMode === 'ending' && cinematicFrame > 600) { // ~10 seconds
        endCinematic();
    }
}

function endCinematic() {
    if (cinematicMode === 'space-transition') {
        cinematicMode = null;
        gameMode = 'play';
        initHole();
    } else if (cinematicMode === 'ending') {
        cinematicMode = null;
        showEnd();
    }
}

function drawCinematic() {
    const W = canvas.width, H = canvas.height;
    const f = cinematicFrame;

    if (cinematicMode === 'space-transition') {
        drawSpaceTransition(W, H, f);
    } else if (cinematicMode === 'ending') {
        drawEndingCinematic(W, H, f);
    }

    // Skip button
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '14px Georgia';
    ctx.textAlign = 'right';
    ctx.fillText('Press ESC to skip', W - 20, H - 20);
    ctx.textAlign = 'left';
}

function drawSpaceTransition(W, H, f) {
    // Phase 1: Rumble (0-120 frames, ~2s)
    // Phase 2: Launch (120-300 frames, ~3s)
    // Phase 3: Space transition (300-420 frames, ~2s)
    // Phase 4: Landing (420-480 frames, ~1s)

    if (f <= 120) {
        // RUMBLE PHASE
        const intensity = f / 120;
        const shakeX = (Math.random() - 0.5) * intensity * 12;
        const shakeY = (Math.random() - 0.5) * intensity * 8;
        ctx.save();
        ctx.translate(shakeX, shakeY);

        // Draw storm sky (current theme before space)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
        skyGrad.addColorStop(0, '#0a0f18');
        skyGrad.addColorStop(0.5, '#141c28');
        skyGrad.addColorStop(1, '#0d1a12');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, H);

        // Ground
        ctx.fillStyle = '#2a7a48';
        ctx.fillRect(0, H * 0.7, W, H * 0.3);

        // Cracks
        ctx.strokeStyle = `rgba(255, 100, 0, ${intensity * 0.8})`;
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const cx = W * (0.15 + i * 0.18);
            ctx.beginPath();
            ctx.moveTo(cx, H * 0.7);
            ctx.lineTo(cx + (Math.random() - 0.5) * 20, H * 0.85);
            ctx.lineTo(cx + (Math.random() - 0.5) * 30, H);
            ctx.stroke();
        }

        // Player standing on ground
        ctx.fillStyle = '#c4956a';
        ctx.beginPath();
        ctx.ellipse(W * 0.3, H * 0.67, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(W * 0.3 - 7, H * 0.67 + 5, 14, 18);

        // Darkening sky
        ctx.fillStyle = `rgba(0, 0, 0, ${intensity * 0.3})`;
        ctx.fillRect(0, 0, W, H);

        ctx.restore();

    } else if (f <= 300) {
        // LAUNCH PHASE
        const progress = (f - 120) / 180;

        // Sky transitioning from storm to dark
        const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
        const darkProgress = Math.min(1, progress * 1.5);
        skyGrad.addColorStop(0, `rgb(${Math.floor(10 * (1 - darkProgress))}, ${Math.floor(15 * (1 - darkProgress))}, ${Math.floor(24 * (1 - darkProgress))})`);
        skyGrad.addColorStop(1, `rgb(${Math.floor(13 * (1 - darkProgress))}, ${Math.floor(26 * (1 - darkProgress))}, ${Math.floor(18 * (1 - darkProgress))})`);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, H);

        // Clouds rushing down
        if (progress < 0.7) {
            ctx.fillStyle = `rgba(255,255,255,${0.15 * (1 - progress)})`;
            for (let i = 0; i < 8; i++) {
                const cy = (i * 80 + f * 4) % (H + 100) - 50;
                ctx.beginPath();
                ctx.ellipse(W * (0.2 + i * 0.1), cy, 60, 15, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Ground chunk floating up
        const chunkY = H * 0.7 - progress * H * 0.3;
        ctx.fillStyle = '#5a3e1b';
        ctx.beginPath();
        ctx.moveTo(W * 0.15, chunkY + 20);
        ctx.lineTo(W * 0.1, chunkY + 60);
        ctx.lineTo(W * 0.5, chunkY + 65);
        ctx.lineTo(W * 0.55, chunkY + 20);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2a7a48';
        ctx.fillRect(W * 0.15, chunkY + 10, W * 0.4, 15);

        // Player on chunk
        ctx.fillStyle = '#c4956a';
        ctx.beginPath();
        ctx.ellipse(W * 0.3, chunkY + 3, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(W * 0.3 - 7, chunkY + 8, 14, 18);

        // Stars fading in
        if (progress > 0.5) {
            const starAlpha = (progress - 0.5) * 2;
            ctx.fillStyle = `rgba(255,255,255,${starAlpha * 0.6})`;
            for (let i = 0; i < 40; i++) {
                const sx = (i * 97 + 31) % W;
                const sy = (i * 43 + 17) % (H * 0.6);
                ctx.beginPath();
                ctx.arc(sx, sy, 1 + (i % 3) * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

    } else if (f <= 420) {
        // SPACE TRANSITION
        const progress = (f - 300) / 120;

        // Full space background
        ctx.fillStyle = '#000005';
        ctx.fillRect(0, 0, W, H);

        // Stars
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        for (let i = 0; i < 60; i++) {
            const sx = (i * 97 + 31) % W;
            const sy = (i * 43 + 17) % (H * 0.8);
            ctx.beginPath();
            ctx.arc(sx, sy, 1 + (i % 4) * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Earth appearing and growing
        const earthR = progress * H * 0.4;
        const earthX = W * 0.75;
        const earthY = H * 0.35;

        // Earth glow
        ctx.fillStyle = 'rgba(100, 180, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(earthX, earthY, earthR * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Earth body
        ctx.save();
        ctx.beginPath();
        ctx.arc(earthX, earthY, earthR, 0, Math.PI * 2);
        ctx.clip();
        const oceanGrad = ctx.createRadialGradient(earthX, earthY, 0, earthX, earthY, earthR);
        oceanGrad.addColorStop(0, '#4a90d9');
        oceanGrad.addColorStop(1, '#1a4a80');
        ctx.fillStyle = oceanGrad;
        ctx.fillRect(earthX - earthR, earthY - earthR, earthR * 2, earthR * 2);
        // Continents
        ctx.fillStyle = '#3a8a4a';
        ctx.beginPath();
        ctx.ellipse(earthX + earthR * 0.2, earthY - earthR * 0.15, earthR * 0.35, earthR * 0.25, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(earthX - earthR * 0.3, earthY + earthR * 0.3, earthR * 0.2, earthR * 0.15, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Atmosphere edge
        ctx.strokeStyle = 'rgba(100, 180, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(earthX, earthY, earthR, 0, Math.PI * 2);
        ctx.stroke();

    } else {
        // LANDING PHASE
        const progress = (f - 420) / 60;

        // Full space
        ctx.fillStyle = '#000005';
        ctx.fillRect(0, 0, W, H);

        // Stars
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        for (let i = 0; i < 60; i++) {
            const sx = (i * 97 + 31) % W;
            const sy = (i * 43 + 17) % (H * 0.8);
            ctx.beginPath();
            ctx.arc(sx, sy, 1 + (i % 4) * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Earth
        const earthR = H * 0.4;
        const earthX = W * 0.75;
        const earthY = H * 0.35;
        ctx.save();
        ctx.beginPath();
        ctx.arc(earthX, earthY, earthR, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = '#2a6ab0';
        ctx.fillRect(earthX - earthR, earthY - earthR, earthR * 2, earthR * 2);
        ctx.fillStyle = '#3a8a4a';
        ctx.beginPath();
        ctx.ellipse(earthX + earthR * 0.2, earthY - earthR * 0.15, earthR * 0.35, earthR * 0.25, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Lunar surface appearing
        const surfaceY = H * 0.75 + (1 - progress) * H * 0.2;
        ctx.fillStyle = '#6a6a70';
        ctx.fillRect(0, surfaceY, W, H - surfaceY);
        ctx.fillStyle = '#8a8a8e';
        ctx.fillRect(0, surfaceY, W, 8);

        // Title text
        const textAlpha = progress;
        ctx.fillStyle = `rgba(201, 168, 76, ${textAlpha})`;
        ctx.font = 'bold 36px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('HOLE 9', W / 2, H * 0.4);
        ctx.font = '20px Georgia';
        ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha * 0.7})`;
        ctx.fillText('THE FINAL FRONTIER', W / 2, H * 0.4 + 35);
        ctx.textAlign = 'left';
    }
}
```

**Step 4: Handle skip input**

In the keydown handler, add ESC skip for cinematics:

```javascript
// In keydown handler, before cheat code check:
if (e.key === 'Escape' && gameMode === 'cinematic') {
    cinematicSkipped = true;
    return;
}
```

**Step 5: Integrate cinematic into game loop**

In the `loop()` function (line 3781), add cinematic mode:

```javascript
function loop() {
    if (gameMode === 'cinematic') {
        updateCinematic();
        drawCinematic();
    } else if (gameMode === 'shop') {
        updateShop();
        drawShop();
    } else {
        update();
        draw();
    }
    requestAnimationFrame(loop);
}
```

**Step 6: Commit**

```bash
git add golf-adventure/golf-adventure.html
git commit -m "feat: add space transition cinematic before Hole 9"
```

---

### Task 9: Ending Cinematic

**Files:**
- Modify: `golf-adventure/golf-adventure.html` — add ending cinematic draw function and trigger

**Step 1: Trigger ending cinematic after Hole 9**

In `onHoleSunk()` (line 3604), when it's the last hole, instead of going directly to `showEnd()`, trigger the ending cinematic. Modify the "Next Hole" / "See Results" button click handler (line 3640):

```javascript
document.getElementById('nextBtn').addEventListener('click', () => {
    document.getElementById('holeOverlay').classList.add('hidden');
    if (currentHole >= levels.length - 1) {
        // Trigger ending cinematic
        cinematicMode = 'ending';
        cinematicFrame = 0;
        cinematicSkipped = false;
        gameMode = 'cinematic';
    } else {
        gameMode = 'shop';
        initShop();
    }
});
```

**Step 2: Draw ending cinematic**

```javascript
function drawEndingCinematic(W, H, f) {
    // Phase 1: Victory pose (0-120, ~2s)
    // Phase 2: Spaceship arrives (120-240, ~2s)
    // Phase 3: Liftoff (240-360, ~2s)
    // Phase 4: Home scene (360-540, ~3s)
    // Phase 5: Fade (540-600, ~1s)

    if (f <= 120) {
        // VICTORY POSE - space background with character celebrating
        ctx.fillStyle = '#000005';
        ctx.fillRect(0, 0, W, H);
        drawCinematicStars(W, H);
        drawCinematicEarth(W, H);

        // Lunar surface
        ctx.fillStyle = '#6a6a70';
        ctx.fillRect(0, H * 0.75, W, H * 0.25);
        ctx.fillStyle = '#8a8a8e';
        ctx.fillRect(0, H * 0.75, W, 8);

        // Character with fist pump
        const charX = W * 0.4;
        const charY = H * 0.75 - 50;
        ctx.fillStyle = '#c4956a';
        ctx.beginPath();
        ctx.ellipse(charX, charY - 20, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(charX - 7, charY - 15, 14, 18);
        // Fist up
        ctx.strokeStyle = '#c4956a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(charX + 7, charY - 10);
        ctx.lineTo(charX + 15, charY - 35 - Math.sin(f * 0.1) * 5);
        ctx.stroke();
        // Legs
        ctx.strokeStyle = '#b09870';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(charX - 4, charY + 3);
        ctx.lineTo(charX - 6, charY + 18);
        ctx.moveTo(charX + 4, charY + 3);
        ctx.lineTo(charX + 6, charY + 18);
        ctx.stroke();

        // Celebration particles
        if (f % 5 === 0) {
            const colors = ['#c9a84c', '#4ade80', '#60a5fa'];
            ctx.fillStyle = colors[f % 3];
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(charX + (Math.random() - 0.5) * 60, charY - 30 - Math.random() * 40, 2 + Math.random() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

    } else if (f <= 240) {
        // SPACESHIP ARRIVES
        const progress = (f - 120) / 120;
        ctx.fillStyle = '#000005';
        ctx.fillRect(0, 0, W, H);
        drawCinematicStars(W, H);
        drawCinematicEarth(W, H);

        ctx.fillStyle = '#6a6a70';
        ctx.fillRect(0, H * 0.75, W, H * 0.25);
        ctx.fillStyle = '#8a8a8e';
        ctx.fillRect(0, H * 0.75, W, 8);

        // Character watching
        const charX = W * 0.4;
        const charY = H * 0.75 - 50;
        ctx.fillStyle = '#c4956a';
        ctx.beginPath();
        ctx.ellipse(charX, charY - 20, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(charX - 7, charY - 15, 14, 18);

        // Rocket descending
        const rocketX = W * 0.6;
        const rocketY = -60 + progress * (H * 0.75 - 30);
        drawRocket(rocketX, rocketY, false);

        // Thruster flame
        if (progress < 0.9) {
            ctx.fillStyle = `rgba(255, 150, 30, ${0.5 + Math.random() * 0.3})`;
            ctx.beginPath();
            ctx.moveTo(rocketX - 8, rocketY + 30);
            ctx.lineTo(rocketX, rocketY + 50 + Math.random() * 15);
            ctx.lineTo(rocketX + 8, rocketY + 30);
            ctx.fill();
        }

        // Door opens at end
        if (progress > 0.9) {
            ctx.fillStyle = '#ffa';
            ctx.fillRect(rocketX - 6, rocketY + 5, 12, 18);
        }

    } else if (f <= 360) {
        // LIFTOFF
        const progress = (f - 240) / 120;
        ctx.fillStyle = '#000005';
        ctx.fillRect(0, 0, W, H);
        drawCinematicStars(W, H);

        // Earth growing larger
        const earthR = H * 0.4 + progress * H * 0.15;
        const earthY = H * 0.35 + progress * H * 0.15;
        ctx.save();
        ctx.beginPath();
        ctx.arc(W * 0.5, earthY, earthR, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = '#2a6ab0';
        ctx.fillRect(W * 0.5 - earthR, earthY - earthR, earthR * 2, earthR * 2);
        ctx.fillStyle = '#3a8a4a';
        ctx.beginPath();
        ctx.ellipse(W * 0.5 + earthR * 0.2, earthY - earthR * 0.15, earthR * 0.35, earthR * 0.25, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Rocket flying toward earth
        const rocketX = W * 0.5;
        const rocketY = H * 0.3 + progress * H * 0.2;
        drawRocket(rocketX, rocketY, true);

        // Thruster flame
        ctx.fillStyle = `rgba(255, 150, 30, ${0.5 + Math.random() * 0.3})`;
        ctx.beginPath();
        ctx.moveTo(rocketX - 8, rocketY - 30);
        ctx.lineTo(rocketX, rocketY - 50 - Math.random() * 15);
        ctx.lineTo(rocketX + 8, rocketY - 30);
        ctx.fill();

    } else if (f <= 540) {
        // HOME SCENE
        const progress = (f - 360) / 180;

        // Living room background
        ctx.fillStyle = '#f5e6c8'; // warm walls
        ctx.fillRect(0, 0, W, H);

        // Floor
        ctx.fillStyle = '#8b6f47';
        ctx.fillRect(0, H * 0.7, W, H * 0.3);

        // Window (showing night sky)
        ctx.fillStyle = '#1a2a4a';
        ctx.fillRect(W * 0.65, H * 0.1, W * 0.25, H * 0.35);
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 3;
        ctx.strokeRect(W * 0.65, H * 0.1, W * 0.25, H * 0.35);
        ctx.beginPath();
        ctx.moveTo(W * 0.775, H * 0.1);
        ctx.lineTo(W * 0.775, H * 0.45);
        ctx.stroke();

        // Couch
        ctx.fillStyle = '#4a6a8a';
        ctx.fillRect(W * 0.2, H * 0.5, W * 0.4, H * 0.2);
        ctx.fillStyle = '#3a5a7a';
        ctx.fillRect(W * 0.18, H * 0.48, W * 0.04, H * 0.24);
        ctx.fillRect(W * 0.58, H * 0.48, W * 0.04, H * 0.24);

        // TV
        ctx.fillStyle = '#222';
        ctx.fillRect(W * 0.08, H * 0.2, W * 0.22, H * 0.18);
        ctx.fillStyle = '#3a8a4a'; // golf green on TV
        ctx.fillRect(W * 0.09, H * 0.21, W * 0.2, H * 0.16);
        // TV golf flag
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(W * 0.18, H * 0.35);
        ctx.lineTo(W * 0.18, H * 0.24);
        ctx.stroke();
        ctx.fillStyle = '#c9a84c';
        ctx.fillRect(W * 0.18, H * 0.24, 12, 8);

        // Pizza box on coffee table
        ctx.fillStyle = '#c9a84c';
        ctx.fillRect(W * 0.35, H * 0.63, W * 0.12, H * 0.05);
        // Pizza slices
        ctx.fillStyle = '#e8a030';
        ctx.beginPath();
        ctx.arc(W * 0.41, H * 0.655, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d44';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(W * 0.41 + (i - 2) * 5, H * 0.655, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Character on couch, relaxed
        const charX = W * 0.38;
        const charY = H * 0.47;
        ctx.fillStyle = '#c4956a';
        ctx.beginPath();
        ctx.ellipse(charX, charY, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(charX - 7, charY + 5, 14, 18);
        // Happy smile
        ctx.strokeStyle = '#8a5a3a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(charX, charY + 3, 3.5, 0.1, Math.PI - 0.1);
        ctx.stroke();
        // Pizza slice in hand
        ctx.fillStyle = '#e8a030';
        ctx.beginPath();
        ctx.moveTo(charX + 10, charY + 8);
        ctx.lineTo(charX + 20, charY + 2);
        ctx.lineTo(charX + 22, charY + 10);
        ctx.closePath();
        ctx.fill();

        // "Home Sweet Home" text
        if (progress > 0.3) {
            const textAlpha = Math.min(1, (progress - 0.3) * 2);
            ctx.fillStyle = `rgba(201, 168, 76, ${textAlpha})`;
            ctx.font = 'bold 32px Georgia';
            ctx.textAlign = 'center';
            ctx.fillText('Home Sweet Home', W / 2, H * 0.15);
            ctx.textAlign = 'left';
        }

    } else {
        // FADE TO BLACK
        const progress = (f - 540) / 60;
        // Redraw home scene
        // ... (same as above but with fade overlay)
        ctx.fillStyle = '#f5e6c8';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = `rgba(0, 0, 0, ${progress})`;
        ctx.fillRect(0, 0, W, H);
    }
}

function drawRocket(x, y, flipped) {
    ctx.save();
    ctx.translate(x, y);
    if (flipped) ctx.scale(1, -1);

    // Rocket body
    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(-12, 10);
    ctx.lineTo(-12, 25);
    ctx.lineTo(12, 25);
    ctx.lineTo(12, 10);
    ctx.closePath();
    ctx.fill();

    // Nose cone
    ctx.fillStyle = '#e53e3e';
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(-8, -10);
    ctx.lineTo(8, -10);
    ctx.closePath();
    ctx.fill();

    // Window
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    // Fins
    ctx.fillStyle = '#e53e3e';
    ctx.beginPath();
    ctx.moveTo(-12, 15);
    ctx.lineTo(-20, 28);
    ctx.lineTo(-12, 25);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(12, 15);
    ctx.lineTo(20, 28);
    ctx.lineTo(12, 25);
    ctx.fill();

    ctx.restore();
}

function drawCinematicStars(W, H) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 50; i++) {
        const sx = (i * 97 + 31) % W;
        const sy = (i * 43 + 17) % (H * 0.8);
        ctx.beginPath();
        ctx.arc(sx, sy, 1 + (i % 3) * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawCinematicEarth(W, H) {
    const earthR = H * 0.4;
    const earthX = W * 0.75;
    const earthY = H * 0.35;
    ctx.save();
    ctx.beginPath();
    ctx.arc(earthX, earthY, earthR, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#2a6ab0';
    ctx.fillRect(earthX - earthR, earthY - earthR, earthR * 2, earthR * 2);
    ctx.fillStyle = '#3a8a4a';
    ctx.beginPath();
    ctx.ellipse(earthX + earthR * 0.2, earthY - earthR * 0.15, earthR * 0.35, earthR * 0.25, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(earthX - earthR * 0.3, earthY + earthR * 0.3, earthR * 0.2, earthR * 0.15, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(earthX, earthY, earthR, 0, Math.PI * 2);
    ctx.stroke();
}
```

**Step 3: Commit**

```bash
git add golf-adventure/golf-adventure.html
git commit -m "feat: add ending cinematic with spaceship and home scene"
```

---

### Task 10: Green & Gold Score Sharing Screen

**Files:**
- Modify: `golf-adventure/golf-adventure.html:3663-3743` (generateScoreImage function)
- Modify: `golf-adventure/golf-adventure.html:126-131` (end overlay HTML)

**Step 1: Redesign generateScoreImage() with green & gold theme**

Replace the existing function:

```javascript
function generateScoreImage() {
    const c = document.createElement('canvas');
    c.width = 600; c.height = 480;
    const cx = c.getContext('2d');

    // Green background
    const bgGrad = cx.createLinearGradient(0, 0, 0, 480);
    bgGrad.addColorStop(0, '#1a472a');
    bgGrad.addColorStop(1, '#0d2818');
    cx.fillStyle = bgGrad;
    cx.fillRect(0, 0, 600, 480);

    // Gold border (double line)
    cx.strokeStyle = '#c9a84c';
    cx.lineWidth = 3;
    cx.strokeRect(10, 10, 580, 460);
    cx.strokeStyle = 'rgba(201, 168, 76, 0.4)';
    cx.lineWidth = 1;
    cx.strokeRect(18, 18, 564, 444);

    // Gold decorative corners
    cx.fillStyle = '#c9a84c';
    [[14, 14], [582, 14], [14, 462], [582, 462]].forEach(([x, y]) => {
        cx.beginPath();
        cx.arc(x, y, 4, 0, Math.PI * 2);
        cx.fill();
    });

    // Title
    cx.fillStyle = '#c9a84c';
    cx.font = 'bold 28px Georgia, serif';
    cx.textAlign = 'center';
    cx.fillText('JHI GOLF ADVENTURE', 300, 55);

    // Golf emoji/icon line
    cx.fillStyle = 'rgba(201, 168, 76, 0.3)';
    cx.beginPath();
    cx.moveTo(80, 70);
    cx.lineTo(520, 70);
    cx.strokeStyle = 'rgba(201, 168, 76, 0.3)';
    cx.lineWidth = 1;
    cx.stroke();

    // Scorecard header
    cx.fillStyle = 'rgba(201, 168, 76, 0.15)';
    cx.fillRect(35, 90, 530, 28);

    const colW = 50, startX = 65, rowY = 110;
    cx.font = 'bold 13px Georgia, serif';
    cx.fillStyle = '#c9a84c';
    cx.textAlign = 'center';
    cx.fillText('HOLE', 40, rowY);
    for (let i = 0; i < levels.length; i++) {
        cx.fillText(i + 1, startX + i * colW, rowY);
    }
    cx.fillText('TOT', startX + levels.length * colW, rowY);

    // Par row
    cx.fillStyle = 'rgba(255,255,255,0.5)';
    cx.font = '13px Georgia, serif';
    cx.fillText('Par', 40, rowY + 25);
    for (let i = 0; i < levels.length; i++) {
        cx.fillText(levels[i].par, startX + i * colW, rowY + 25);
    }
    const totalPar = levels.reduce((a, l) => a + l.par, 0);
    cx.fillText(totalPar, startX + levels.length * colW, rowY + 25);

    // Score row
    cx.font = 'bold 17px Georgia, serif';
    const total = scores.reduce((a, b) => a + b, 0);
    cx.fillStyle = 'rgba(255,255,255,0.5)';
    cx.fillText('Score', 40, rowY + 52);
    for (let i = 0; i < scores.length; i++) {
        const diff = scores[i] - levels[i].par;
        cx.fillStyle = diff < 0 ? '#4ade80' : diff === 0 ? '#c9a84c' : '#ef4444';
        cx.fillText(scores[i], startX + i * colW, rowY + 52);
    }
    cx.fillStyle = '#c9a84c';
    cx.fillText(total, startX + levels.length * colW, rowY + 52);

    // +/- row
    cx.font = '12px Georgia, serif';
    cx.fillStyle = 'rgba(255,255,255,0.4)';
    cx.fillText('+/-', 40, rowY + 72);
    for (let i = 0; i < scores.length; i++) {
        const diff = scores[i] - levels[i].par;
        const diffStr = diff === 0 ? 'E' : diff > 0 ? '+' + diff : '' + diff;
        cx.fillStyle = diff < 0 ? '#4ade80' : diff === 0 ? 'rgba(255,255,255,0.5)' : '#ef4444';
        cx.fillText(diffStr, startX + i * colW, rowY + 72);
    }
    const totalDiff = total - totalPar;
    const totalDiffStr = totalDiff === 0 ? 'E' : totalDiff > 0 ? '+' + totalDiff : '' + totalDiff;
    cx.fillStyle = totalDiff <= 0 ? '#4ade80' : '#ef4444';
    cx.fillText(totalDiffStr, startX + levels.length * colW, rowY + 72);

    // Divider
    cx.strokeStyle = 'rgba(201, 168, 76, 0.3)';
    cx.lineWidth = 1;
    cx.beginPath();
    cx.moveTo(50, 210);
    cx.lineTo(550, 210);
    cx.stroke();

    // Total score large
    const diff = total - totalPar;
    const diffStr = diff === 0 ? 'Even Par' : diff > 0 ? '+' + diff + ' Over' : Math.abs(diff) + ' Under';
    cx.fillStyle = '#fff';
    cx.font = 'bold 40px Georgia, serif';
    cx.fillText(total + ' Strokes', 300, 270);

    cx.fillStyle = diff <= 0 ? '#4ade80' : '#ef4444';
    cx.font = 'bold 22px Georgia, serif';
    cx.fillText(diffStr + ' (Par ' + totalPar + ')', 300, 305);

    // Achievement badges
    cx.font = '14px Georgia, serif';
    cx.fillStyle = '#c9a84c';
    let badges = [];
    if (scores.some(s => s === 1)) badges.push('Hole-in-One!');
    if (diff <= -5) badges.push('Golf Legend');
    else if (diff <= 0) badges.push('Under Par');
    if (badges.length > 0) {
        cx.fillText(badges.join(' | '), 300, 340);
    }

    // Footer
    cx.strokeStyle = 'rgba(201, 168, 76, 0.3)';
    cx.beginPath();
    cx.moveTo(150, 420);
    cx.lineTo(450, 420);
    cx.stroke();
    cx.fillStyle = 'rgba(201, 168, 76, 0.6)';
    cx.font = '14px Georgia, serif';
    cx.fillText('januarius.ph', 300, 450);

    return c;
}
```

**Step 2: Update end overlay styling**

The end overlay HTML already exists. Update the `showEnd()` function to show a styled scorecard in the overlay itself (not just the image):

```javascript
function showEnd() {
    hasCompletedGame = true;

    const total = scores.reduce((a, b) => a + b, 0);
    const totalPar = levels.reduce((a, l) => a + l.par, 0);
    const diff = total - totalPar;
    const diffStr = diff === 0 ? 'Even' : diff > 0 ? '+' + diff : '' + diff;
    document.getElementById('endSummary').textContent =
        `Total: ${total} strokes (${diffStr} | Par ${totalPar})`;
    document.getElementById('endOverlay').classList.remove('hidden');
}
```

**Step 3: Commit**

```bash
git add golf-adventure/golf-adventure.html
git commit -m "feat: redesign score sharing with green and gold theme"
```

---

### Task 11: Integration Testing and Polish

**Step 1: Manual testing checklist**

Open `golf-adventure.html` in browser and verify:

- [ ] Holes 1-8 still work correctly (no regressions)
- [ ] Desktop: spacebar triggers angle→power→hit for JJ
- [ ] Desktop: mouse drag disabled for JJ, still works for Patrick
- [ ] Mobile: HIT button still works for both characters
- [ ] Spacebar no longer triggers jump
- [ ] After Hole 8 shop, space transition cinematic plays
- [ ] Cinematic can be skipped with ESC
- [ ] Hole 9 has space background with large Earth
- [ ] Stars are dense and twinkling
- [ ] No hills, clouds, rain, or wind in space
- [ ] Terrain is gray lunar rock, no grass
- [ ] Gravity is noticeably lighter
- [ ] Asteroids float and ball bounces off them
- [ ] Regular enemies work on Hole 9
- [ ] Boss appears near the hole, blocks access
- [ ] Boss attacks cycle: barrage, slam, boulder
- [ ] Ball bounces back off boss, dealing damage
- [ ] Boss HP bar shows when damaged
- [ ] Boss death clears path to hole
- [ ] Boulder attack has visible telegraph
- [ ] Ground slam shockwave requires jumping to dodge
- [ ] Character looks frightened (trembling, wide eyes, sweat)
- [ ] After sinking on Hole 9 and clicking "See Results", ending cinematic plays
- [ ] Ending cinematic shows victory→spaceship→liftoff→home scene
- [ ] Score sharing screen uses green and gold colors
- [ ] Score image includes all 9 holes
- [ ] HUD shows "Hole X/9" correctly
- [ ] "Play Again" resets everything properly

**Step 2: Fix any issues found**

Address bugs discovered during testing.

**Step 3: Final commit**

```bash
git add golf-adventure/golf-adventure.html
git commit -m "polish: integration testing and fixes for Hole 9"
```
