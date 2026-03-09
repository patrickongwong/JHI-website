# Golf Adventure Equipment System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an equipment shop, combat system, health, and two storm levels to the golf adventure game.

**Architecture:** All changes are in the single file `golf-adventure/golf-adventure.html`. New game state variables track equipment, health, coins, enemies, and shop mode. The game loop gains a new `gameMode` variable (`'play'`, `'shop'`) to switch between golf gameplay and the pro shop scene. Each system (equipment, combat, weather) is added incrementally.

**Tech Stack:** Vanilla JS, Canvas 2D, localStorage for coin persistence.

---

### Task 1: Equipment State & Coin System

**Files:**
- Modify: `golf-adventure/golf-adventure.html` (after line 245, game state section)

**Step 1: Add equipment and coin state variables**

After `let gameTime = 0;` (line 245), add:

```javascript
// ==================== EQUIPMENT & ECONOMY ====================
let coins = parseInt(localStorage.getItem('jhi-golf-coins') || '0');
let gameMode = 'play'; // 'play' or 'shop'

const equipment = {
    club: parseInt(localStorage.getItem('jhi-equip-club') || '0'),    // 0-4: copper,silver,steel,gold,diamond
    shaft: parseInt(localStorage.getItem('jhi-equip-shaft') || '0'),  // 0-1: standard, autoflex
    boots: parseInt(localStorage.getItem('jhi-equip-boots') || '0'),  // 0-3: standard,double,triple,flying
    shirt: parseInt(localStorage.getItem('jhi-equip-shirt') || '0')   // 0-4: white,navy,striped,gold,diamond
};

function saveProgress() {
    localStorage.setItem('jhi-golf-coins', coins);
    localStorage.setItem('jhi-equip-club', equipment.club);
    localStorage.setItem('jhi-equip-shaft', equipment.shaft);
    localStorage.setItem('jhi-equip-boots', equipment.boots);
    localStorage.setItem('jhi-equip-shirt', equipment.shirt);
}

const CLUB_TIERS = [
    { name: 'Copper', power: 1.0, damage: 1, color: '#b87333' },
    { name: 'Silver', power: 1.2, damage: 2, color: '#c0c0c0' },
    { name: 'Steel',  power: 1.4, damage: 3, color: '#71797E' },
    { name: 'Gold',   power: 1.7, damage: 4, color: '#c9a84c' },
    { name: 'Diamond',power: 2.0, damage: 5, color: '#b9f2ff' }
];

const SHAFT_TIERS = [
    { name: 'Standard', color: '#ccc' },
    { name: 'Autoflex', color: '#ff69b4' }
];

const BOOT_TIERS = [
    { name: 'Standard',    maxJumps: 1, color: '#2a2a2a', wings: false },
    { name: 'Double-Jump', maxJumps: 2, color: '#4a3a2a', wings: false },
    { name: 'Triple-Jump', maxJumps: 3, color: '#5a4a3a', wings: false },
    { name: 'Flying',      maxJumps: Infinity, color: '#eee', wings: true }
];

const SHIRT_TIERS = [
    { name: 'Plain White',    hearts: 2, colors: ['#f0f0f0','#e8e8e8','#ddd'] },
    { name: 'Navy Polo',      hearts: 3, colors: ['#4080b8','#3a6fa8','#2d5a8c'] },
    { name: 'Striped',        hearts: 4, colors: ['#3a5a8c','#f0f0f0','#3a5a8c'] },
    { name: 'Gold-Trimmed',   hearts: 5, colors: ['#2d5a8c','#3a6fa8','#c9a84c'] },
    { name: 'Diamond Argyle', hearts: 6, colors: ['#1a1a3a','#b9f2ff','#1a1a3a'] }
];

const SHOP_PRICES = {
    club:  [0, 3, 5, 8, 12],
    shaft: [0, 6],
    boots: [0, 4, 7, 12],
    shirt: [0, 3, 5, 8, 12]
};

function getMaxHearts() { return SHIRT_TIERS[equipment.shirt].hearts; }
function getMaxJumps() { return BOOT_TIERS[equipment.boots].maxJumps; }
function getClubPower() { return CLUB_TIERS[equipment.club].power; }
function getClubDamage() { return CLUB_TIERS[equipment.club].damage; }
```

**Step 2: Add health state to player object**

Change the player object (line 274) to include health and jump tracking:

```javascript
const player = {
    x: 0, y: 0, vx: 0, vy: 0,
    w: 20, h: 50,
    onGround: false, facing: 1,
    walking: false, walkFrame: 0,
    hp: 2, maxHp: 2,
    jumpsLeft: 1,
    invincible: 0 // invincibility frames countdown
};
```

**Step 3: Award coins on hole completion**

In the `onHoleSunk()` function (around line 1342), add coin awarding after `scores.push(strokes)`:

```javascript
    // Award coins based on performance
    let earned = 0;
    if (strokes === 1) earned = 5;
    else if (diff <= -2) earned = 4;
    else if (diff === -1) earned = 3;
    else if (diff === 0) earned = 2;
    else if (diff === 1) earned = 1;
    coins += earned;
    saveProgress();
```

Update the holeSummary text to include coins earned:

```javascript
    document.getElementById('holeSummary').textContent =
        `Hole ${currentHole + 1}: ${strokes} stroke${strokes !== 1 ? 's' : ''} (Par ${par}) | +${earned} coins`;
```

**Step 4: Update header HTML to show coins and hearts**

Change the header info div (line 97-101) to include coins:

```html
    <div class="info">
        <span id="heartsDisplay"></span>
        <span>Hole <strong id="holeNum">1</strong>/8</span>
        <span>Par <strong id="parNum">3</strong></span>
        <span>Strokes <strong id="strokeNum">0</strong></span>
        <span id="coinDisplay" style="color:#c9a84c;">0 coins</span>
    </div>
```

**Step 5: Update initHole to reset health and show coins**

In `initHole()`, add after particles reset:

```javascript
    player.maxHp = getMaxHearts();
    player.hp = player.maxHp;
    player.jumpsLeft = getMaxJumps() === Infinity ? 99 : getMaxJumps();
    player.invincible = 0;
    updateHeartsDisplay();
    document.getElementById('coinDisplay').textContent = coins + ' coins';
```

Add the hearts display helper:

```javascript
function updateHeartsDisplay() {
    const el = document.getElementById('heartsDisplay');
    let s = '';
    for (let i = 0; i < player.maxHp; i++) {
        s += i < player.hp ? '\u2764\uFE0F' : '\uD83E\uDE76';
    }
    el.textContent = s;
}
```

**Step 6: Commit**

```
git add golf-adventure/golf-adventure.html
git commit -m "feat: add equipment state, coin system, and health tracking"
```

---

### Task 2: Multi-Jump System

**Files:**
- Modify: `golf-adventure/golf-adventure.html` (player movement section, ~line 503)

**Step 1: Replace single jump with multi-jump**

Change the jump input handling (line 503) from:

```javascript
    if ((keys['w'] || keys['arrowup'] || keys[' ']) && player.onGround) {
        player.vy = JUMP_FORCE;
        player.onGround = false;
    }
```

To:

```javascript
    // Jump - track key press to prevent holding
    const jumpPressed = keys['w'] || keys['arrowup'] || keys[' '];
    if (jumpPressed && !player.jumpHeld) {
        const maxJ = getMaxJumps();
        if (player.onGround || player.jumpsLeft > 0) {
            player.vy = JUMP_FORCE;
            player.onGround = false;
            if (maxJ !== Infinity) {
                player.jumpsLeft--;
            }
            // Wing flutter particles for flying boots
            if (BOOT_TIERS[equipment.boots].wings && !player.onGround) {
                spawnParticles(player.x, player.y + player.h * 0.8, '#fff', 4, 1.5);
            }
        }
        player.jumpHeld = true;
    }
    if (!jumpPressed) player.jumpHeld = false;
```

**Step 2: Reset jumps on ground contact**

In the player ground collision section (~line 520), after `player.onGround = true;`, add:

```javascript
            player.jumpsLeft = getMaxJumps() === Infinity ? 99 : getMaxJumps();
```

**Step 3: Add `jumpHeld` to player object**

Add `jumpHeld: false` to the player object.

**Step 4: Commit**

```
git add golf-adventure/golf-adventure.html
git commit -m "feat: add multi-jump system with boot tier support"
```

---

### Task 3: Apply Club Power to Ball Hits

**Files:**
- Modify: `golf-adventure/golf-adventure.html` (hit mechanics)

**Step 1: Scale mouse/touch hit power by club tier**

In `endAim()` (~line 459), change:

```javascript
    const power = Math.min(dist / 8, MAX_HIT_POWER);
```

To:

```javascript
    const power = Math.min(dist / 8, MAX_HIT_POWER) * getClubPower();
```

**Step 2: Scale mobile hit power by club tier**

In `handleMobileHit()`, in the power execution section (~line 402), change:

```javascript
        ball.vx = Math.cos(mobileAimAngle) * mobileAimPower * dir;
        ball.vy = Math.sin(mobileAimAngle) * mobileAimPower;
```

To:

```javascript
        const clubPow = getClubPower();
        ball.vx = Math.cos(mobileAimAngle) * mobileAimPower * dir * clubPow;
        ball.vy = Math.sin(mobileAimAngle) * mobileAimPower * clubPow;
```

**Step 3: Commit**

```
git add golf-adventure/golf-adventure.html
git commit -m "feat: apply club power multiplier to ball hits"
```

---

### Task 4: Autoflex Shaft Trajectory Preview

**Files:**
- Modify: `golf-adventure/golf-adventure.html` (aim visualization section)

**Step 1: Add trajectory simulation function**

Add before the draw function:

```javascript
function simulateTrajectory(startX, startY, vx, vy, steps) {
    const points = [];
    let x = startX, y = startY;
    for (let i = 0; i < steps; i++) {
        vy += GRAVITY;
        vx *= BALL_AIR_DRAG;
        vy *= BALL_AIR_DRAG;
        x += vx;
        y += vy;
        points.push({ x, y });
        // Stop if hits ground
        const gy = getGroundY(x);
        if (gy !== null && y >= gy) break;
    }
    return points;
}
```

**Step 2: Draw trajectory dots when Autoflex equipped**

In the aim line drawing section (~line 1279), after the existing aim line code but before the closing of the `if (aiming)` block, add:

```javascript
        // Autoflex trajectory preview
        if (equipment.shaft >= 1) {
            const simVx = Math.cos(angle) * power;
            const simVy = Math.sin(angle) * power;
            const pts = simulateTrajectory(ball.x, ball.y, simVx, simVy, 25);
            ctx.fillStyle = 'rgba(255, 105, 180, 0.5)';
            pts.forEach((p, i) => {
                if (i % 2 === 0) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }
```

Add similar code in the mobile aim visualization block for `mobileHitMode`.

**Step 3: Commit**

```
git add golf-adventure/golf-adventure.html
git commit -m "feat: add Autoflex shaft trajectory preview"
```

---

### Task 5: Player Health & Damage System

**Files:**
- Modify: `golf-adventure/golf-adventure.html` (player update, fall detection)

**Step 1: Add damage function**

Add after `updateHeartsDisplay()`:

```javascript
function damagePlayer(amount) {
    if (player.invincible > 0) return;
    player.hp -= amount;
    player.invincible = 90; // ~1.5 seconds at 60fps
    updateHeartsDisplay();
    spawnParticles(player.x, player.y + player.h / 2, '#f44', 8, 3);

    if (player.hp <= 0) {
        // Reset hole with penalty
        strokes++;
        document.getElementById('strokeNum').textContent = strokes;
        document.getElementById('statusText').textContent = 'KO! +1 penalty';
        player.hp = player.maxHp;
        updateHeartsDisplay();
        const level = levels[currentHole];
        const pGY = getGroundY(level.playerStart.x) || (canvas.height - 80 * S);
        player.x = level.playerStart.x;
        player.y = pGY - player.h;
        player.vx = 0; player.vy = 0;
    }
}
```

**Step 2: Cliff fall deals damage instead of free reset**

Change the player void fall section (~line 528). Replace the free reset with:

```javascript
    if (player.y > canvas.height + 50) {
        damagePlayer(1);
        if (player.hp > 0) {
            const pGY = getGroundY(level.playerStart.x) || (canvas.height - 80 * S);
            player.x = level.playerStart.x;
            player.y = pGY - player.h;
            player.vx = 0; player.vy = 0;
        }
    }
```

**Step 3: Add invincibility countdown and flash to update**

In the update function, add:

```javascript
    if (player.invincible > 0) player.invincible--;
```

**Step 4: Add flash effect to drawPlayer**

At the start of `drawPlayer()`, add:

```javascript
    if (player.invincible > 0 && Math.floor(player.invincible / 4) % 2 === 0) {
        ctx.globalAlpha = 0.3;
    }
```

And at the end of `drawPlayer()`, reset: `ctx.globalAlpha = 1;`

**Step 5: Commit**

```
git add golf-adventure/golf-adventure.html
git commit -m "feat: add player health system with damage and invincibility"
```

---

### Task 6: Player Visual Updates (Shirt, Boots, Club Colors)

**Files:**
- Modify: `golf-adventure/golf-adventure.html` (drawPlayer function, ~line 1380)

**Step 1: Update shirt rendering to use equipment tier**

Replace the hardcoded shirt gradient colors (~line 1438-1441) with:

```javascript
    const shirtColors = SHIRT_TIERS[equipment.shirt].colors;
    const shirtGrad = ctx.createLinearGradient(-8 * u, torsoTop, 8 * u, torsoBot);
    shirtGrad.addColorStop(0, shirtColors[0]);
    shirtGrad.addColorStop(0.5, shirtColors[1]);
    shirtGrad.addColorStop(1, shirtColors[2]);
```

For the Striped tier (index 2), add horizontal stripe lines after filling the shirt body:

```javascript
    // Striped pattern for tier 2
    if (equipment.shirt === 2) {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1.5 * u;
        for (let sy = torsoTop + 4 * u; sy < torsoBot - 2 * u; sy += 4 * u) {
            ctx.beginPath();
            ctx.moveTo(-8 * u, sy);
            ctx.lineTo(8 * u, sy);
            ctx.stroke();
        }
    }
    // Gold trim for tier 3
    if (equipment.shirt === 3) {
        ctx.strokeStyle = '#c9a84c';
        ctx.lineWidth = 1.5 * u;
        ctx.strokeRect(-9 * u, torsoTop, 18 * u, torsoBot - torsoTop);
    }
    // Diamond argyle for tier 4
    if (equipment.shirt === 4) {
        ctx.strokeStyle = 'rgba(185, 242, 255, 0.4)';
        ctx.lineWidth = 1 * u;
        for (let dy = torsoTop + 5 * u; dy < torsoBot - 5 * u; dy += 8 * u) {
            ctx.beginPath();
            ctx.moveTo(0, dy - 4 * u);
            ctx.lineTo(5 * u, dy);
            ctx.lineTo(0, dy + 4 * u);
            ctx.lineTo(-5 * u, dy);
            ctx.closePath();
            ctx.stroke();
        }
    }
```

Also update the sleeve color references (`#3a6fa8`) to use `shirtColors[1]`.

**Step 2: Update shoe rendering to use boot tier colors**

Replace the hardcoded shoe color `#2a2a2a` (~line 1429) with:

```javascript
    ctx.fillStyle = BOOT_TIERS[equipment.boots].color;
```

For Flying Boots, draw small white wings:

```javascript
    if (BOOT_TIERS[equipment.boots].wings) {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        // Left boot wing
        ctx.beginPath();
        ctx.moveTo(lFootX - 3 * u, footY - 4 * u);
        ctx.lineTo(lFootX - 8 * u, footY - 8 * u);
        ctx.lineTo(lFootX - 2 * u, footY - 6 * u);
        ctx.closePath();
        ctx.fill();
        // Right boot wing
        ctx.beginPath();
        ctx.moveTo(rFootX - 3 * u, footY - 4 * u);
        ctx.lineTo(rFootX - 8 * u, footY - 8 * u);
        ctx.lineTo(rFootX - 2 * u, footY - 6 * u);
        ctx.closePath();
        ctx.fill();
    }
```

**Step 3: Update club colors**

In the club rendering section (~line 1516), replace the hardcoded shaft/head colors:

```javascript
        // Golf club shaft (use shaft tier color)
        ctx.strokeStyle = SHAFT_TIERS[equipment.shaft].color;
        ctx.lineWidth = 2 * u;
        // ...
        // Club head (use club tier color)
        ctx.fillStyle = CLUB_TIERS[equipment.club].color;
```

**Step 4: Commit**

```
git add golf-adventure/golf-adventure.html
git commit -m "feat: update player visuals based on equipment tier"
```

---

### Task 7: Sand Bagger Enemies

**Files:**
- Modify: `golf-adventure/golf-adventure.html`

**Step 1: Add enemy state and level definitions**

Add `enemies` array to level definitions for holes 5-8. Add to levels array:

```javascript
    // Hole 5 - add:
    enemies: [
        { x: 600, hp: 2, patrol: [550, 700] },
        { x: 850, hp: 3, patrol: [800, 950] }
    ]
    // Hole 6 - add:
    enemies: [
        { x: 500, hp: 2, patrol: [450, 600] },
        { x: 800, hp: 3, patrol: [750, 900] },
        { x: 1050, hp: 2, patrol: [1000, 1150] }
    ]
```

Add runtime enemy state:

```javascript
let activeEnemies = [];

function initEnemies() {
    const level = levels[currentHole];
    activeEnemies = (level.enemies || []).map(e => ({
        x: e.x,
        y: 0, // set in initHole after ground calc
        hp: e.hp,
        maxHp: e.hp,
        patrol: e.patrol,
        dir: 1,
        speed: getTimeOfDay() === 'storm' ? 1.5 : 1,
        throwCooldown: 0,
        frame: 0,
        dead: false,
        deathTimer: 0
    }));
}
```

**Step 2: Add enemy update logic**

Add `updateEnemies()` function:

```javascript
function updateEnemies() {
    const level = levels[currentHole];
    const tod = getTimeOfDay();
    const attackRange = canvas.width * 0.35; // ~1/4 of level visible width

    activeEnemies.forEach(e => {
        if (e.dead) {
            e.deathTimer--;
            return;
        }

        // Patrol movement
        e.x += e.dir * e.speed;
        if (e.x <= e.patrol[0]) e.dir = 1;
        if (e.x >= e.patrol[1]) e.dir = -1;
        e.frame += 0.05;

        const gy = getGroundY(e.x);
        if (gy !== null) e.y = gy;

        // Throw sand at player if in range
        e.throwCooldown = Math.max(0, e.throwCooldown - 1);
        const dist = Math.abs(player.x - e.x);
        if (dist < attackRange && e.throwCooldown <= 0) {
            // Throw sand projectile
            const angle = Math.atan2(
                (player.y + player.h / 2) - (e.y - 20),
                player.x - e.x
            );
            const throwSpeed = 4;
            sandProjectiles.push({
                x: e.x,
                y: e.y - 20,
                vx: Math.cos(angle) * throwSpeed,
                vy: Math.sin(angle) * throwSpeed - 2,
                damage: tod === 'storm' ? 2 : 1
            });
            e.throwCooldown = 120 + Math.random() * 60; // 2-3 sec
        }

        // Check ball collision
        if (ball.active && !ball.sunk) {
            const bdx = ball.x - e.x;
            const bdy = (ball.y) - (e.y - 15);
            const bdist = Math.sqrt(bdx * bdx + bdy * bdy);
            if (bdist < 20 && (Math.abs(ball.vx) > 1 || Math.abs(ball.vy) > 1)) {
                e.hp -= getClubDamage();
                // Ball loses some momentum
                ball.vx *= 0.5;
                ball.vy *= 0.5;
                spawnParticles(e.x, e.y - 15, '#d4a853', 10, 3);

                if (e.hp <= 0) {
                    e.dead = true;
                    e.deathTimer = 60;
                    spawnParticles(e.x, e.y - 15, '#d4a853', 20, 5);
                }
            }
        }
    });

    // Remove fully dead enemies
    activeEnemies = activeEnemies.filter(e => !e.dead || e.deathTimer > 0);
}
```

**Step 3: Add sand projectile system**

```javascript
let sandProjectiles = [];

function updateSandProjectiles() {
    sandProjectiles.forEach(p => {
        p.vy += GRAVITY * 0.5;
        p.x += p.vx;
        p.y += p.vy;

        // Hit player
        const dx = p.x - player.x;
        const dy = p.y - (player.y + player.h / 2);
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
            damagePlayer(p.damage);
            p.hit = true;
            spawnParticles(p.x, p.y, '#d4a853', 6, 2);
        }

        // Hit ground or go offscreen
        const gy = getGroundY(p.x);
        if ((gy !== null && p.y > gy) || p.y > canvas.height + 20) {
            p.hit = true;
        }
    });
    sandProjectiles = sandProjectiles.filter(p => !p.hit);
}
```

**Step 4: Add enemy and projectile drawing**

```javascript
function drawEnemies() {
    const tod = getTimeOfDay();
    const isStorm = tod === 'storm';

    activeEnemies.forEach(e => {
        if (e.dead) {
            // Death burst - fading sandbag pieces
            ctx.globalAlpha = e.deathTimer / 60;
            ctx.fillStyle = '#d4a853';
            for (let i = 0; i < 5; i++) {
                const ox = Math.sin(i * 1.3 + e.deathTimer * 0.1) * (60 - e.deathTimer);
                const oy = -Math.abs(Math.cos(i * 0.9 + e.deathTimer * 0.15)) * (60 - e.deathTimer);
                ctx.beginPath();
                ctx.arc(e.x + ox, e.y - 10 + oy, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            return;
        }

        // Sandbag body
        ctx.fillStyle = '#d4a853';
        ctx.beginPath();
        ctx.moveTo(e.x - 12, e.y);
        ctx.lineTo(e.x - 14, e.y - 22);
        ctx.quadraticCurveTo(e.x, e.y - 32, e.x + 14, e.y - 22);
        ctx.lineTo(e.x + 12, e.y);
        ctx.closePath();
        ctx.fill();

        // Tied top
        ctx.strokeStyle = '#8a6a30';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(e.x - 4, e.y - 28);
        ctx.lineTo(e.x, e.y - 32);
        ctx.lineTo(e.x + 4, e.y - 28);
        ctx.stroke();

        // Texture lines on bag
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(e.x - 8, e.y - 8);
        ctx.lineTo(e.x + 8, e.y - 8);
        ctx.moveTo(e.x - 10, e.y - 16);
        ctx.lineTo(e.x + 10, e.y - 16);
        ctx.stroke();

        // Simple legs
        const legSwing = Math.sin(e.frame * 4) * 3;
        ctx.strokeStyle = '#8a6a30';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(e.x - 5, e.y);
        ctx.lineTo(e.x - 5 - legSwing, e.y + 8);
        ctx.moveTo(e.x + 5, e.y);
        ctx.lineTo(e.x + 5 + legSwing, e.y + 8);
        ctx.stroke();

        // Eyes
        if (isStorm) {
            // Red glowing eyes
            const glowGrad = ctx.createRadialGradient(e.x - 4, e.y - 18, 1, e.x - 4, e.y - 18, 6);
            glowGrad.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
            glowGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(e.x - 4, e.y - 18, 6, 0, Math.PI * 2);
            ctx.fill();
            glowGrad = ctx.createRadialGradient(e.x + 4, e.y - 18, 1, e.x + 4, e.y - 18, 6);
            glowGrad.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
            glowGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(e.x + 4, e.y - 18, 6, 0, Math.PI * 2);
            ctx.fill();
            // Core
            ctx.fillStyle = '#ff0000';
        } else {
            ctx.fillStyle = '#2a2a2a';
        }
        ctx.beginPath();
        ctx.arc(e.x - 4, e.y - 18, 2, 0, Math.PI * 2);
        ctx.arc(e.x + 4, e.y - 18, 2, 0, Math.PI * 2);
        ctx.fill();

        // HP bar
        if (e.hp < e.maxHp) {
            const barW = 24, barH = 3;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(e.x - barW / 2, e.y - 38, barW, barH);
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(e.x - barW / 2, e.y - 38, barW * (e.hp / e.maxHp), barH);
        }
    });

    // Sand projectiles
    sandProjectiles.forEach(p => {
        ctx.fillStyle = '#c4a040';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(200, 160, 60, 0.4)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.fill();
    });
}
```

**Step 5: Wire into game loop**

In `update()`, add calls to `updateEnemies()` and `updateSandProjectiles()`.
In `draw()`, call `drawEnemies()` after drawing terrain but before drawing player.
In `initHole()`, call `initEnemies()` and reset `sandProjectiles = []`.

**Step 6: Commit**

```
git add golf-adventure/golf-adventure.html
git commit -m "feat: add Sand Bagger enemies with combat system"
```

---

### Task 8: New Levels 7-8 (Storm) & Weather System

**Files:**
- Modify: `golf-adventure/golf-adventure.html`

**Step 1: Add storm time-of-day**

Update `getTimeOfDay()`:

```javascript
function getTimeOfDay() {
    if (currentHole <= 1) return 'day';
    if (currentHole <= 3) return 'afternoon';
    if (currentHole <= 5) return 'night';
    return 'storm';
}
```

**Step 2: Add storm theme to `getTheme()`**

Add a new theme block for `'storm'` after the night theme:

```javascript
    if (tod === 'storm') return {
        sky: ['#0a0f18', '#141c28', '#0d1520', '#1a3028', '#0d1a12'],
        starAlpha: 0,
        cloudAlpha: 0,
        sunMoon: 'none',
        sunY: 0,
        hillFar: 'rgba(15, 35, 25, 0.6)',
        hillNear: 'rgba(20, 45, 30, 0.5)',
        grassTop: '#2a7a48',
        grassMid: '#1d5a35',
        grassBot: '#144028',
        grassBlade: '#35904a',
        dirt: '#4a3218',
        earth: '#30200d',
        platGrass: '#2a7a48',
        platDark: '#1d5a35',
        platBlade: '#40a558',
        ambientTint: 'rgba(80, 120, 200, 0.04)',
    };
```

**Step 3: Add wind state**

```javascript
let wind = { direction: 0, strength: 0 }; // direction: -1 left, 1 right

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

Call `initWind()` in `initHole()`.

**Step 4: Apply wind to ball physics**

In the ball physics section, when ball is airborne (inside `if (!ball.onGround)`), add:

```javascript
            // Wind force
            if (wind.strength > 0) {
                ball.vx += wind.direction * wind.strength;
            }
```

**Step 5: Add rain and lightning rendering**

Add `drawStormEffects()` function, called after vignette in `draw()`:

```javascript
function drawStormEffects() {
    if (getTimeOfDay() !== 'storm') return;
    const W = canvas.width, H = canvas.height;

    // Rain
    ctx.strokeStyle = 'rgba(180, 200, 255, 0.3)';
    ctx.lineWidth = 1;
    const rainAngle = wind.direction * 3;
    for (let i = 0; i < 80; i++) {
        const rx = (i * 17 + gameTime * 3 * (1 + (i % 3) * 0.3)) % (W + 100) - 50;
        const ry = (i * 31 + gameTime * 8 * (1 + (i % 2) * 0.5)) % (H + 50) - 25;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + rainAngle, ry + 12 + (i % 4) * 2);
        ctx.stroke();
    }

    // Lightning flash (random every 5-10 sec)
    if (Math.random() < 0.003) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(0, 0, W, H);
    }

    // Wind indicator in HUD
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = 'bold 14px Georgia';
    ctx.textAlign = 'center';
    const windArrow = wind.direction > 0 ? 'Wind >>>' : '<<< Wind';
    ctx.fillText(windArrow, W / 2, 20);
    ctx.textAlign = 'left';
}
```

**Step 6: Add level definitions for holes 7 and 8**

```javascript
    { // Hole 7 - Storm: The Ridge
        par: 4,
        playerStart: { x: 60, y: 0 },
        ballStart: { x: 180, y: 0 },
        holePos: { x: 1000, y: -30 },
        terrain: [
            { x: 0, y: 0, w: 250, h: 0 },
            { x: 250, y: 0, w: 100, h: -50 },
            { x: 350, y: -50, w: 150, h: 0 },
            { x: 600, y: -30, w: 150, h: 0 },
            { x: 850, y: -30, w: 100, h: 0 },
            { x: 950, y: -30, w: 50, h: 0 },
            { x: 1000, y: -30, w: 300, h: 0 }
        ],
        platforms: [{ x: 500, y: -40, w: 80 }],
        water: [{ x: 500, w: 100 }, { x: 750, w: 100 }],
        sand: [],
        enemies: [
            { x: 400, hp: 4, patrol: [360, 490] },
            { x: 1050, hp: 5, patrol: [1000, 1200] }
        ]
    },
    { // Hole 8 - Storm: The Gauntlet
        par: 5,
        playerStart: { x: 40, y: 0 },
        ballStart: { x: 160, y: 0 },
        holePos: { x: 1200, y: -50 },
        terrain: [
            { x: 0, y: 0, w: 300, h: 0 },
            { x: 300, y: 0, w: 150, h: -40 },
            { x: 450, y: -40, w: 200, h: 0 },
            { x: 750, y: -20, w: 150, h: 0 },
            { x: 1000, y: -50, w: 100, h: 0 },
            { x: 1100, y: -50, w: 50, h: 0 },
            { x: 1150, y: -50, w: 300, h: 0 }
        ],
        platforms: [
            { x: 650, y: -40, w: 80 },
            { x: 900, y: -35, w: 80 }
        ],
        water: [{ x: 650, w: 100 }, { x: 1100, w: 50 }],
        sand: [{ x: 500, w: 80 }],
        enemies: [
            { x: 500, hp: 4, patrol: [460, 640] },
            { x: 800, hp: 5, patrol: [750, 890] },
            { x: 1200, hp: 5, patrol: [1150, 1350] }
        ]
    }
```

**Step 7: Update header hole count from /6 to /8**

**Step 8: Commit**

```
git add golf-adventure/golf-adventure.html
git commit -m "feat: add storm levels 7-8 with rain, lightning, and wind"
```

---

### Task 9: Pro Shop Scene

**Files:**
- Modify: `golf-adventure/golf-adventure.html`

**Step 1: Change hole complete flow**

Change the "Next Hole" button handler. After showing hole results, instead of going directly to next hole, transition to shop:

```javascript
document.getElementById('nextBtn').addEventListener('click', () => {
    document.getElementById('holeOverlay').classList.add('hidden');
    if (currentHole >= levels.length - 1) {
        showEnd();
    } else {
        // Enter shop before next hole
        gameMode = 'shop';
        initShop();
    }
});
```

**Step 2: Add shop state and initialization**

```javascript
const shopPedestals = [
    { type: 'club',  label: '+ Power',   x: 200 },
    { type: 'shaft', label: '+ Control', x: 400 },
    { type: 'boots', label: '+ Jump',    x: 600 },
    { type: 'shirt', label: '+ Health',  x: 800 }
];

let shopMessage = '';
let shopMessageTimer = 0;

function initShop() {
    const baseY = canvas.height - 80 * S;
    player.x = 100;
    player.y = baseY - player.h;
    player.vx = 0; player.vy = 0;
    player.onGround = true;
    player.facing = 1;
    cameraX = 0;
    shopMessage = '';
    shopMessageTimer = 0;
}
```

**Step 3: Add shop update logic**

```javascript
function updateShop() {
    // Player movement (horizontal only, no jumping needed)
    player.walking = false;
    if (keys['a'] || keys['arrowleft']) {
        player.vx = -PLAYER_SPEED;
        player.facing = -1;
        player.walking = true;
    } else if (keys['d'] || keys['arrowright']) {
        player.vx = PLAYER_SPEED;
        player.facing = 1;
        player.walking = true;
    } else {
        player.vx = 0;
    }
    player.x += player.vx;
    player.x = Math.max(30, Math.min(player.x, 1050));
    if (player.walking) player.walkFrame += 0.15;
    else player.walkFrame = 0;

    if (shopMessageTimer > 0) shopMessageTimer--;

    // Buy with up/W key
    if (keys['w'] || keys['arrowup']) {
        if (!player.buyHeld) {
            player.buyHeld = true;
            tryBuy();
        }
    } else {
        player.buyHeld = false;
    }

    // Continue with right edge
    if (player.x >= 1020) {
        gameMode = 'play';
        currentHole++;
        initHole();
    }

    // Camera
    const targetCX = Math.max(0, player.x - canvas.width / 2);
    cameraX += (targetCX - cameraX) * 0.1;
}

function tryBuy() {
    for (const ped of shopPedestals) {
        if (Math.abs(player.x - ped.x) > 50) continue;

        const tier = equipment[ped.type];
        const prices = SHOP_PRICES[ped.type];
        const nextTier = tier + 1;

        if (nextTier >= prices.length) {
            shopMessage = 'MAXED!';
            shopMessageTimer = 90;
            return;
        }

        const cost = prices[nextTier];
        if (coins < cost) {
            shopMessage = 'Not enough coins!';
            shopMessageTimer = 90;
            return;
        }

        coins -= cost;
        equipment[ped.type] = nextTier;
        saveProgress();
        shopMessage = 'Purchased!';
        shopMessageTimer = 90;
        document.getElementById('coinDisplay').textContent = coins + ' coins';
        return;
    }
}
```

**Step 4: Add shop drawing**

```javascript
function drawShop() {
    const W = canvas.width, H = canvas.height;
    const baseY = H - 80 * S;

    // Background - indoor shop
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(0, 0, W, H);

    // Back wall
    const wallGrad = ctx.createLinearGradient(0, 0, 0, baseY);
    wallGrad.addColorStop(0, '#3a2818');
    wallGrad.addColorStop(1, '#2a1a0a');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, W, baseY);

    // Wall shelves
    ctx.fillStyle = '#4a3020';
    for (let sy = 60; sy < baseY - 40; sy += 80) {
        ctx.fillRect(20 - cameraX, sy, W + cameraX * 2, 6);
    }

    // Wooden floor
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(0, baseY, W, H - baseY);
    // Floor planks
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    for (let fx = -cameraX % 60; fx < W; fx += 60) {
        ctx.beginPath();
        ctx.moveTo(fx, baseY);
        ctx.lineTo(fx, H);
        ctx.stroke();
    }

    ctx.save();
    ctx.translate(-cameraX, 0);

    // Pedestals with items
    shopPedestals.forEach(ped => {
        const tier = equipment[ped.type];
        const prices = SHOP_PRICES[ped.type];
        const nextTier = tier + 1;
        const isMaxed = nextTier >= prices.length;

        // Pedestal
        ctx.fillStyle = '#6a5a4a';
        ctx.fillRect(ped.x - 20, baseY - 40, 40, 40);
        ctx.fillStyle = '#7a6a5a';
        ctx.fillRect(ped.x - 24, baseY - 44, 48, 6);

        // Floating item (bob animation)
        const bobY = baseY - 70 + Math.sin(gameTime * 0.04 + ped.x * 0.01) * 4;

        if (ped.type === 'club') {
            const nextClub = CLUB_TIERS[Math.min(nextTier, CLUB_TIERS.length - 1)];
            ctx.fillStyle = nextClub.color;
            ctx.fillRect(ped.x - 2, bobY - 15, 4, 30);
            ctx.fillRect(ped.x - 6, bobY + 12, 12, 5);
        } else if (ped.type === 'shaft') {
            ctx.fillStyle = '#ff69b4';
            ctx.fillRect(ped.x - 2, bobY - 15, 4, 30);
        } else if (ped.type === 'boots') {
            const nextBoot = BOOT_TIERS[Math.min(nextTier, BOOT_TIERS.length - 1)];
            ctx.fillStyle = nextBoot.color;
            ctx.beginPath();
            ctx.roundRect(ped.x - 8, bobY, 16, 8, 3);
            ctx.fill();
            if (nextBoot.wings) {
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.moveTo(ped.x - 8, bobY);
                ctx.lineTo(ped.x - 16, bobY - 8);
                ctx.lineTo(ped.x - 4, bobY - 3);
                ctx.closePath();
                ctx.fill();
            }
        } else if (ped.type === 'shirt') {
            const nextShirt = SHIRT_TIERS[Math.min(nextTier, SHIRT_TIERS.length - 1)];
            ctx.fillStyle = nextShirt.colors[0];
            ctx.fillRect(ped.x - 8, bobY - 10, 16, 20);
            ctx.fillStyle = nextShirt.colors[1];
            ctx.fillRect(ped.x - 6, bobY - 8, 12, 4);
        }

        // Label
        ctx.fillStyle = '#c9a84c';
        ctx.font = 'bold 12px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(ped.label, ped.x, baseY - 50);

        // Price or MAXED
        if (isMaxed) {
            ctx.fillStyle = '#4ade80';
            ctx.fillText('MAXED', ped.x, baseY + 20);
        } else {
            ctx.fillStyle = coins >= prices[nextTier] ? '#fff' : '#e57373';
            ctx.fillText(prices[nextTier] + ' coins', ped.x, baseY + 20);
        }

        // Current tier name
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '10px Georgia';
        const tierNames = {
            club: CLUB_TIERS, shaft: SHAFT_TIERS,
            boots: BOOT_TIERS, shirt: SHIRT_TIERS
        };
        ctx.fillText('Equipped: ' + tierNames[ped.type][tier].name, ped.x, baseY + 34);
    });

    // Continue sign
    ctx.fillStyle = '#c9a84c';
    ctx.font = 'bold 16px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('Continue \u2192', 1030, baseY - 20);
    ctx.textAlign = 'left';

    // Draw player
    drawPlayer();

    ctx.restore();

    // Coin display
    ctx.fillStyle = '#c9a84c';
    ctx.font = 'bold 16px Georgia';
    ctx.textAlign = 'right';
    ctx.fillText(coins + ' coins', W - 20, 30);
    ctx.textAlign = 'left';

    // Shop title
    ctx.fillStyle = '#c9a84c';
    ctx.font = 'bold 20px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('PRO SHOP', W / 2, 30);
    ctx.textAlign = 'left';

    // Instruction
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '13px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('Walk to an item and press UP to buy', W / 2, H - 15);
    ctx.textAlign = 'left';

    // Shop message
    if (shopMessageTimer > 0) {
        ctx.fillStyle = shopMessage === 'Purchased!' ? '#4ade80' : '#e57373';
        ctx.font = 'bold 18px Georgia';
        ctx.textAlign = 'center';
        ctx.globalAlpha = Math.min(1, shopMessageTimer / 30);
        ctx.fillText(shopMessage, W / 2, H / 2 - 60);
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
    }
}
```

**Step 5: Update game loop**

Change the main `loop()` function to respect game mode:

```javascript
function loop() {
    if (gameMode === 'shop') {
        updateShop();
        drawShop();
    } else {
        update();
        draw();
    }
    requestAnimationFrame(loop);
}
```

**Step 6: Add `buyHeld` to player object**

**Step 7: Commit**

```
git add golf-adventure/golf-adventure.html
git commit -m "feat: add interactive pro shop scene between rounds"
```

---

### Task 10: HUD Updates & Draw Hearts/Club/Wind

**Files:**
- Modify: `golf-adventure/golf-adventure.html` (draw function)

**Step 1: Draw hearts in HUD during gameplay**

After the vignette effect in `draw()`, add:

```javascript
    // HUD - Hearts
    for (let i = 0; i < player.maxHp; i++) {
        const hx = 15 + i * 22;
        ctx.fillStyle = i < player.hp ? '#e53e3e' : 'rgba(255,255,255,0.2)';
        // Simple heart shape
        ctx.beginPath();
        ctx.moveTo(hx, 20);
        ctx.bezierCurveTo(hx, 17, hx - 5, 12, hx - 8, 15);
        ctx.bezierCurveTo(hx - 13, 20, hx, 28, hx, 30);
        ctx.bezierCurveTo(hx, 28, hx + 13, 20, hx + 8, 15);
        ctx.bezierCurveTo(hx + 5, 12, hx, 17, hx, 20);
        ctx.fill();
    }

    // HUD - Coins
    ctx.fillStyle = '#c9a84c';
    ctx.font = 'bold 14px Georgia';
    ctx.textAlign = 'right';
    ctx.fillText(coins + ' coins', W - 15, 25);
    ctx.textAlign = 'left';

    // HUD - Club tier
    ctx.fillStyle = CLUB_TIERS[equipment.club].color;
    ctx.font = '11px Georgia';
    ctx.fillText(CLUB_TIERS[equipment.club].name + ' Club', 15, H - 12);
```

**Step 2: Commit**

```
git add golf-adventure/golf-adventure.html
git commit -m "feat: add HUD hearts, coins, and club tier display"
```

---

### Task 11: Update Share Score Image

**Files:**
- Modify: `golf-adventure/golf-adventure.html` (generateScoreImage function)

**Step 1: Update scorecard to handle 8 holes**

Adjust `colW` and `startX` in `generateScoreImage()` to fit 8 holes + total column. Change:

```javascript
    const colW = 55, startX = 55, rowY = 120;
```

Update loops to use `levels.length` (already does). Update hole count in header from `/6` to `/8`.

**Step 2: Commit**

```
git add golf-adventure/golf-adventure.html
git commit -m "feat: update score image for 8 holes"
```

---

### Task 12: Final Integration & Polish

**Files:**
- Modify: `golf-adventure/golf-adventure.html`

**Step 1: Reset enemies and projectiles in initHole**

Ensure `initHole()` calls `initEnemies()`, `initWind()`, and resets `sandProjectiles = []`.

**Step 2: Set correct enemy Y positions after ground calculation**

In `initEnemies()`, calculate Y from ground:

```javascript
    activeEnemies.forEach(e => {
        const gy = getGroundY(e.x);
        if (gy !== null) e.y = gy;
    });
```

**Step 3: Test all 8 holes play through correctly**

Verify: day levels (1-2), afternoon (3-4), night with enemies (5-6), storm with enemies+weather (7-8).

**Step 4: Final commit**

```
git add golf-adventure/golf-adventure.html
git commit -m "feat: complete equipment system integration and polish"
```
