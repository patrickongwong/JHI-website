# Golf Quest Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build Golf Quest — a Phaser 3 recreation of JHI Golf Adventure with Matter.js physics, Tiled tilemaps, Owlboy-style pixel art, and a Lunar Dragon boss fight.

**Architecture:** Modular ES modules loaded via `<script type="module">`. Phaser 3 from CDN with Matter.js physics. Each scene is a separate file. Game state persisted via Phaser registry. Tiled-format JSON tilemaps with PNG tilesets. All sprites as replaceable PNG files in assets/.

**Tech Stack:** Phaser 3 (CDN), Matter.js (Phaser built-in), Rex Virtual Joystick plugin (CDN), ES modules, vanilla HTML/CSS, Google Sheets leaderboard.

**Reference:** Design doc at `docs/plans/2026-03-09-golf-quest-design.md`. Original game at `golf-adventure/golf-adventure.html`.

---

## Task 1: Project Scaffold & Phaser Boot

**Files:**
- Create: `golf-quest/index.html`
- Create: `golf-quest/src/main.js`
- Create: `golf-quest/src/scenes/BootScene.js`
- Create: `golf-quest/src/scenes/PreloadScene.js`

**Step 1: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>JHI Golf Quest</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: #1a472a;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            overflow: hidden;
        }
        #game-container { position: relative; }
        canvas { display: block; }
    </style>
</head>
<body>
    <div id="game-container"></div>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"></script>
    <script type="module" src="src/main.js"></script>
</body>
</html>
```

**Step 2: Create main.js with Phaser config**

```js
// golf-quest/src/main.js
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1.5 },
            debug: false
        }
    },
    scene: [BootScene, PreloadScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        max: { width: 1200, height: 600 }
    },
    render: {
        pixelArt: true,
        antialias: false,
        roundPixels: true
    }
};

const game = new Phaser.Game(config);
```

**Step 3: Create BootScene.js**

Initializes game state in Phaser registry, then transitions to PreloadScene.

```js
// golf-quest/src/scenes/BootScene.js
export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        // Initialize shared game state
        this.registry.set('gameState', {
            currentHole: 0,
            scores: [],
            strokes: 0,
            coins: 0,
            activeCharacter: 'jj',
            patrickUnlocked: false,
            usedPatrick: false,
            equipment: {
                club: 0,   // tier index
                shaft: 0,
                boots: 0,
                shirt: 0
            }
        });

        this.scene.start('PreloadScene');
    }
}
```

**Step 4: Create PreloadScene.js**

Loads all assets, shows loading bar, then transitions to MenuScene.

```js
// golf-quest/src/scenes/PreloadScene.js
export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // Loading bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x2d6a4f, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 15, 320, 30);

        const loadingText = this.add.text(width / 2, height / 2 - 40, 'Loading...', {
            fontFamily: 'Georgia, serif',
            fontSize: '20px',
            color: '#c9a84c'
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xc9a84c, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 10, 300 * value, 20);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // Audio
        this.load.audio('bgMusic', 'assets/sounds/background-music.mp3');
        this.load.audio('swing', 'assets/sounds/swing.mp3');
        this.load.audio('applause', 'assets/sounds/applause.wav');

        // Placeholder: will add sprite and tilemap loads in later tasks
    }

    create() {
        this.scene.start('MenuScene');
    }
}
```

**Step 5: Verify game boots**

Open `golf-quest/index.html` in a browser (or local server). Confirm Phaser canvas renders with dark green background and loading bar briefly appears. Console should show no errors (except MenuScene not found — expected, built in next task).

**Step 6: Commit**

```bash
git add golf-quest/index.html golf-quest/src/
git commit -m "feat(golf-quest): scaffold project with Phaser 3 boot and preload scenes"
```

---

## Task 2: Menu Scene & Scene Flow

**Files:**
- Create: `golf-quest/src/scenes/MenuScene.js`
- Modify: `golf-quest/src/main.js` (add MenuScene import)

**Step 1: Create MenuScene.js**

Title screen with "JHI GOLF QUEST" heading, "Start Game" button, and golf-themed background.

```js
// golf-quest/src/scenes/MenuScene.js
export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // Background gradient (dark green)
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a472a, 0x1a472a, 0x2d6a4f, 0x2d6a4f, 1);
        bg.fillRect(0, 0, width, height);

        // Title
        this.add.text(width / 2, height / 3, 'JHI GOLF QUEST', {
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '48px',
            color: '#c9a84c',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, height / 3 + 50, 'A 9-Hole Adventure', {
            fontFamily: 'Georgia, serif',
            fontSize: '18px',
            color: '#b7e4c7'
        }).setOrigin(0.5);

        // Start button
        const btnBg = this.add.rectangle(width / 2, height / 2 + 60, 200, 50, 0xc9a84c)
            .setInteractive({ useHandCursor: true });
        const btnText = this.add.text(width / 2, height / 2 + 60, 'Start Game', {
            fontFamily: 'Georgia, serif',
            fontSize: '22px',
            color: '#1a472a'
        }).setOrigin(0.5);

        btnBg.on('pointerover', () => btnBg.setFillStyle(0xe0c872));
        btnBg.on('pointerout', () => btnBg.setFillStyle(0xc9a84c));
        btnBg.on('pointerdown', () => {
            this.scene.start('HoleScene', { hole: 1 });
        });

        // Controls hint
        this.add.text(width / 2, height - 60, 'WASD to move | SPACE to jump | Drag ball to hit', {
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            color: 'rgba(255,255,255,0.5)'
        }).setOrigin(0.5);
    }
}
```

**Step 2: Update main.js to import MenuScene**

Add `import { MenuScene } from './scenes/MenuScene.js';` and add it to the scene array.

**Step 3: Verify menu renders**

Open in browser. Confirm title, subtitle, and start button appear. Button hover should change color. Click logs console error for missing HoleScene (expected).

**Step 4: Commit**

```bash
git add golf-quest/src/scenes/MenuScene.js golf-quest/src/main.js
git commit -m "feat(golf-quest): add menu scene with title and start button"
```

---

## Task 3: Pixel Art Asset Generation — Tilesets

**Files:**
- Create: `golf-quest/assets/tilesets/meadow.png`
- Create: `golf-quest/assets/tilesets/desert.png`
- Create: `golf-quest/assets/tilesets/tundra.png`
- Create: `golf-quest/assets/tilesets/space.png`

**Step 1: Create a Node.js sprite generation script**

Create `golf-quest/tools/generate-tilesets.js` — a script using the `canvas` npm package (or browser Canvas API via a temp HTML page) to programmatically generate 32x32 pixel art tileset PNGs.

Each tileset should be a spritesheet arranged in a grid (16 tiles wide). Tiles needed per biome:

**Meadow tileset (minimum tiles):**
- Grass top (flat, left slope, right slope)
- Grass body / dirt fill
- Dirt / underground
- Wooden platform (left, middle, right)
- Flowers (2-3 variants)
- Tree trunk, tree canopy
- Water surface, water body
- Golf hole/flag
- Empty/transparent

**Desert tileset:**
- Sand top (flat, slopes)
- Sand body / sandstone fill
- Sandstone / underground
- Rock platform (left, middle, right)
- Cactus (2 variants)
- Sand trap (surface)
- Water surface, water body
- Golf hole/flag

**Tundra tileset:**
- Snow top (flat, slopes)
- Snow body / frozen ground
- Ice / stone underground
- Stone platform (left, middle, right)
- Icicles, frozen bushes
- Water (dark/frozen)
- Golf hole/flag

**Space tileset:**
- Lunar regolith top (flat, slopes)
- Moon rock body
- Crater surface
- Metal platform (left, middle, right)
- Small rocks, antenna
- Golf hole/flag

Style: Owlboy-inspired — rich shading, 3-4 shade levels per color, subtle dithering on transitions, warm highlights on edges.

**Step 2: Run the script to generate PNGs**

```bash
cd golf-quest/tools && node generate-tilesets.js
```

Verify each PNG is created in `golf-quest/assets/tilesets/` and looks reasonable (open in image viewer).

**Step 3: Commit**

```bash
git add golf-quest/assets/tilesets/ golf-quest/tools/
git commit -m "feat(golf-quest): generate Owlboy-style tileset PNGs for all 4 biomes"
```

---

## Task 4: Pixel Art Asset Generation — Character & Entity Sprites

**Files:**
- Create: `golf-quest/assets/sprites/jj.png` (spritesheet: 32x48 per frame)
- Create: `golf-quest/assets/sprites/patrick.png` (spritesheet: 32x48 per frame)
- Create: `golf-quest/assets/sprites/enemy.png` (spritesheet: 48x48 per frame)
- Create: `golf-quest/assets/sprites/boss.png` (spritesheet: 128x128 per frame)
- Create: `golf-quest/assets/sprites/ball.png` (16x16 single frame)
- Create: `golf-quest/assets/sprites/projectile.png` (16x16)
- Create: `golf-quest/assets/sprites/asteroid.png` (32x32)

**Step 1: Create sprite generation script**

Create `golf-quest/tools/generate-sprites.js`. Generate each spritesheet:

**JJ Atencio spritesheet (32x48 per frame, arranged horizontally):**
- Frames 0-3: Idle (subtle breathing animation)
- Frames 4-9: Walk cycle (6 frames)
- Frames 10-11: Jump (up, fall)
- Frames 12-15: Swing (windup, mid, contact, follow-through)
- Frames 16-17: Hurt (flinch, recover)

Owlboy style: Brown skin, curly dark hair, polo shirt (white default), khaki pants, golf shoes. Rich shading with 3-4 tones per color, small but detailed.

**Patrick Wong spritesheet (same frame layout):**
- Purple polo, glasses, dark straight hair, same animations
- Frame 18-19: Psychic pose (arms raised, aura)

**Sand Golem spritesheet (48x48):**
- Frames 0-3: Idle/patrol (swaying)
- Frames 4-5: Throw (windup, release)
- Frames 6-8: Death (crumble)

**Lunar Dragon spritesheet (128x128):**
- Frames 0-3: Idle (hovering, wings flap)
- Frames 4-6: Dive attack
- Frames 7-9: Breath attack (mouth open = weak point)
- Frames 10-11: Tail slam
- Frames 12-14: Hurt/enraged

**Ball:** Simple white golf ball with dimple detail, 16x16.
**Projectile:** Sandy brown rock, 16x16.
**Asteroid:** Gray with craters, 32x32.

**Step 2: Run script**

```bash
cd golf-quest/tools && node generate-sprites.js
```

Verify all PNGs created and visually correct.

**Step 3: Commit**

```bash
git add golf-quest/assets/sprites/ golf-quest/tools/generate-sprites.js
git commit -m "feat(golf-quest): generate Owlboy-style character and entity sprite sheets"
```

---

## Task 5: Tilemap Creation — Holes 1-3 (Meadow)

**Files:**
- Create: `golf-quest/assets/tilemaps/hole1.json`
- Create: `golf-quest/assets/tilemaps/hole2.json`
- Create: `golf-quest/assets/tilemaps/hole3.json`

**Step 1: Create tilemap generation script**

Create `golf-quest/tools/generate-tilemaps.js`. Generates Tiled-format JSON files. Each tilemap has these layers:

- `ground` — tile layer for terrain (grass, dirt, slopes)
- `platforms` — tile layer for floating platforms
- `decorations` — tile layer for flowers, trees, etc.
- `hazards` — object layer with rectangles for water zones, sand traps
- `spawns` — object layer with points: `playerSpawn`, `ballSpawn`, `holePosition`
- `enemies` — object layer with points: enemy patrol zones (only holes 5+)

**Hole 1 (Par 2, Meadow Day):**
- Width: 40 tiles (1280px), Height: 19 tiles (608px)
- Flat terrain, gentle rolling grass, hole on right side
- No hazards, no enemies — pure intro level
- Player spawn left, ball near player, hole right

**Hole 2 (Par 3, Meadow Day):**
- Width: 60 tiles (1920px), Height: 19 tiles
- Rolling hills — terrain height varies 3-5 tiles
- Slight elevation change to reach hole
- No hazards

**Hole 3 (Par 3, Meadow Afternoon):**
- Width: 70 tiles (2240px), Height: 19 tiles
- Water gap in the middle (requires arc shot)
- Terrain splits into two sections with water between
- One wooden platform above water as optional mid-route

Each JSON follows Tiled format:
```json
{
    "width": N,
    "height": 19,
    "tilewidth": 32,
    "tileheight": 32,
    "orientation": "orthogonal",
    "tilesets": [{ "firstgid": 1, "source": "meadow.json" }],
    "layers": [...]
}
```

Also create `golf-quest/assets/tilesets/meadow.json` (Tiled tileset JSON referencing meadow.png).

**Step 2: Run script**

```bash
cd golf-quest/tools && node generate-tilemaps.js
```

**Step 3: Verify JSON structure is valid**

```bash
cat golf-quest/assets/tilemaps/hole1.json | python3 -m json.tool > /dev/null
```

**Step 4: Commit**

```bash
git add golf-quest/assets/tilemaps/ golf-quest/assets/tilesets/*.json golf-quest/tools/generate-tilemaps.js
git commit -m "feat(golf-quest): create Tiled-format tilemaps for holes 1-3 (meadow)"
```

---

## Task 6: Tilemap Creation — Holes 4-6 (Desert)

**Files:**
- Create: `golf-quest/assets/tilemaps/hole4.json`
- Create: `golf-quest/assets/tilemaps/hole5.json`
- Create: `golf-quest/assets/tilemaps/hole6.json`
- Create: `golf-quest/assets/tilesets/desert.json`

**Step 1: Add desert tilemaps to generation script**

Update `golf-quest/tools/generate-tilemaps.js` (or create a separate script) for desert holes.

**Hole 4 (Par 3, Desert Afternoon):**
- Width: 60 tiles, Height: 19 tiles
- Elevated green — terrain rises significantly on right side
- Rock platforms providing vertical stepping stones
- Sand trap near the hole

**Hole 5 (Par 4, Desert Sunset):**
- Width: 80 tiles, Height: 19 tiles
- Multi-platform layout with gaps
- Water hazard between platforms
- 2 enemy spawn points in object layer (patrol zones defined as rectangles)

**Hole 6 (Par 5, Desert Sunset):**
- Width: 100 tiles, Height: 19 tiles
- Complex terrain with multiple elevation changes
- 3 enemy spawn points
- Sand traps at key landing zones
- Water hazard mid-course

**Step 2: Run script and verify**

**Step 3: Commit**

```bash
git add golf-quest/assets/tilemaps/hole{4,5,6}.json golf-quest/assets/tilesets/desert.json golf-quest/tools/
git commit -m "feat(golf-quest): create Tiled-format tilemaps for holes 4-6 (desert)"
```

---

## Task 7: Tilemap Creation — Holes 7-9 (Tundra & Space)

**Files:**
- Create: `golf-quest/assets/tilemaps/hole7.json`
- Create: `golf-quest/assets/tilemaps/hole8.json`
- Create: `golf-quest/assets/tilemaps/hole9.json`
- Create: `golf-quest/assets/tilesets/tundra.json`
- Create: `golf-quest/assets/tilesets/space.json`

**Step 1: Add tundra and space tilemaps**

**Hole 7 (Par 4, Tundra Storm):**
- Width: 80 tiles, Height: 19 tiles
- Ice patches (low-friction zones in hazards layer)
- 2 enemy spawn points
- Stone platforms over gaps

**Hole 8 (Par 5, Tundra Storm):**
- Width: 100 tiles, Height: 19 tiles
- "The Gauntlet" — most complex terrain layout
- 3 enemies, multiple water/ice hazards
- Narrow platforms requiring precise ball control

**Hole 9 (Par 5, Space Moon):**
- Width: 100 tiles, Height: 19 tiles
- Lunar surface with craters
- Metal platforms
- Boss spawn point in object layer
- Asteroid zones defined as rectangles in object layer
- Reduced gravity noted in custom properties: `{ "gravity": 0.5 }`

**Step 2: Run script and verify**

**Step 3: Commit**

```bash
git add golf-quest/assets/tilemaps/hole{7,8,9}.json golf-quest/assets/tilesets/tundra.json golf-quest/assets/tilesets/space.json golf-quest/tools/
git commit -m "feat(golf-quest): create Tiled-format tilemaps for holes 7-9 (tundra, space)"
```

---

## Task 8: Copy Sound Assets

**Files:**
- Create: `golf-quest/assets/sounds/background-music.mp3` (copy)
- Create: `golf-quest/assets/sounds/swing.mp3` (copy)
- Create: `golf-quest/assets/sounds/applause.wav` (copy)

**Step 1: Copy sound files**

```bash
mkdir -p golf-quest/assets/sounds
cp golf-adventure/sounds/background-music.mp3 golf-quest/assets/sounds/
cp golf-adventure/sounds/swing.mp3 golf-quest/assets/sounds/
cp golf-adventure/sounds/applause.wav golf-quest/assets/sounds/
```

**Step 2: Commit**

```bash
git add golf-quest/assets/sounds/
git commit -m "feat(golf-quest): copy sound assets from golf-adventure"
```

---

## Task 9: Physics Configuration & Hole Config Data

**Files:**
- Create: `golf-quest/src/systems/PhysicsConfig.js`
- Create: `golf-quest/src/config/HoleConfig.js`

**Step 1: Create PhysicsConfig.js**

Central place for all physics constants, tunable per biome.

```js
// golf-quest/src/systems/PhysicsConfig.js
export const PhysicsConfig = {
    ball: {
        radius: 8,
        restitution: 0.5,
        friction: 0.05,
        frictionAir: 0.002,
        density: 0.002,
        maxHitPower: 16,
        minHitPower: 0.5,
        sandFriction: 0.15,     // higher = more drag in sand
        waterResetPenalty: 1,
        holeGravityRadius: 40,  // pixels — ball pulled in when this close
        holeGravityForce: 0.002,
        holeSpeedThreshold: 2   // ball speed must be below this to be captured
    },
    player: {
        speed: 3.8,
        jumpForce: -10,
        width: 24,
        height: 40,
        frictionAir: 0.05
    },
    biomes: {
        meadow: { gravity: 1.5, wind: 0 },
        desert: { gravity: 1.5, wind: 0 },
        tundra: { gravity: 1.5, wind: 0.0008 },
        space:  { gravity: 0.5, wind: 0 }
    }
};
```

**Step 2: Create HoleConfig.js**

Per-hole configuration data.

```js
// golf-quest/src/config/HoleConfig.js
export const HoleConfig = [
    { hole: 1, par: 2, biome: 'meadow', time: 'day',       tilemap: 'hole1', tileset: 'meadow', enemies: 0, hasBoss: false },
    { hole: 2, par: 3, biome: 'meadow', time: 'day',       tilemap: 'hole2', tileset: 'meadow', enemies: 0, hasBoss: false },
    { hole: 3, par: 3, biome: 'meadow', time: 'afternoon', tilemap: 'hole3', tileset: 'meadow', enemies: 0, hasBoss: false },
    { hole: 4, par: 3, biome: 'desert', time: 'afternoon', tilemap: 'hole4', tileset: 'desert', enemies: 0, hasBoss: false },
    { hole: 5, par: 4, biome: 'desert', time: 'sunset',    tilemap: 'hole5', tileset: 'desert', enemies: 2, hasBoss: false },
    { hole: 6, par: 5, biome: 'desert', time: 'sunset',    tilemap: 'hole6', tileset: 'desert', enemies: 3, hasBoss: false },
    { hole: 7, par: 4, biome: 'tundra', time: 'storm',     tilemap: 'hole7', tileset: 'tundra', enemies: 2, hasBoss: false },
    { hole: 8, par: 5, biome: 'tundra', time: 'storm',     tilemap: 'hole8', tileset: 'tundra', enemies: 3, hasBoss: false },
    { hole: 9, par: 5, biome: 'space',  time: 'moon',      tilemap: 'hole9', tileset: 'space',  enemies: 0, hasBoss: true  }
];

// Sky gradient colors per time-of-day
export const SkyConfig = {
    day:       { top: 0x87CEEB, bottom: 0xE0F7FA, hasSun: true,  hasStars: false, hasClouds: true,  hasRain: false },
    afternoon: { top: 0xFF8C42, bottom: 0xFFD700, hasSun: true,  hasStars: false, hasClouds: true,  hasRain: false },
    sunset:    { top: 0x8B1A1A, bottom: 0xFF6347, hasSun: true,  hasStars: true,  hasClouds: true,  hasRain: false },
    storm:     { top: 0x1C1C2E, bottom: 0x2D2D44, hasSun: false, hasStars: false, hasClouds: true,  hasRain: true  },
    moon:      { top: 0x000011, bottom: 0x0A0A2E, hasSun: false, hasStars: true,  hasClouds: false, hasRain: false }
};
```

**Step 3: Commit**

```bash
git add golf-quest/src/systems/PhysicsConfig.js golf-quest/src/config/HoleConfig.js
git commit -m "feat(golf-quest): add physics and hole configuration data"
```

---

## Task 10: HoleScene — Tilemap Loading & Rendering

**Files:**
- Create: `golf-quest/src/scenes/HoleScene.js`
- Modify: `golf-quest/src/scenes/PreloadScene.js` (add tilemap/tileset loads)
- Modify: `golf-quest/src/main.js` (add HoleScene import)

**Step 1: Update PreloadScene to load all tilemaps and tilesets**

Add to `preload()`:
```js
// Tilesets
this.load.image('tileset-meadow', 'assets/tilesets/meadow.png');
this.load.image('tileset-desert', 'assets/tilesets/desert.png');
this.load.image('tileset-tundra', 'assets/tilesets/tundra.png');
this.load.image('tileset-space', 'assets/tilesets/space.png');

// Tilemaps
for (let i = 1; i <= 9; i++) {
    this.load.tilemapTiledJSON(`hole${i}`, `assets/tilemaps/hole${i}.json`);
}

// Spritesheets
this.load.spritesheet('jj', 'assets/sprites/jj.png', { frameWidth: 32, frameHeight: 48 });
this.load.spritesheet('patrick', 'assets/sprites/patrick.png', { frameWidth: 32, frameHeight: 48 });
this.load.spritesheet('enemy', 'assets/sprites/enemy.png', { frameWidth: 48, frameHeight: 48 });
this.load.spritesheet('boss', 'assets/sprites/boss.png', { frameWidth: 128, frameHeight: 128 });
this.load.image('ball', 'assets/sprites/ball.png');
this.load.image('projectile', 'assets/sprites/projectile.png');
this.load.image('asteroid', 'assets/sprites/asteroid.png');
```

**Step 2: Create HoleScene.js**

The core gameplay scene. Loads the tilemap for the current hole, creates Matter collision bodies from the ground layer, renders sky background, positions camera.

```js
// golf-quest/src/scenes/HoleScene.js
import { HoleConfig, SkyConfig } from '../config/HoleConfig.js';
import { PhysicsConfig } from '../systems/PhysicsConfig.js';

export class HoleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HoleScene' });
    }

    init(data) {
        this.holeNumber = data.hole || 1;
        this.holeConfig = HoleConfig[this.holeNumber - 1];
    }

    create() {
        const config = this.holeConfig;
        const skyConfig = SkyConfig[config.time];

        // Set gravity for biome
        const biomePhysics = PhysicsConfig.biomes[config.biome];
        this.matter.world.setGravity(0, biomePhysics.gravity);

        // Sky background
        this.createSky(skyConfig);

        // Load tilemap
        const map = this.make.tilemap({ key: config.tilemap });
        const tileset = map.addTilesetImage(config.tileset, `tileset-${config.tileset}`);

        // Ground layer with collision
        const groundLayer = map.createLayer('ground', tileset, 0, 0);
        groundLayer.setCollisionByExclusion([-1]);
        this.matter.world.convertTilemapLayer(groundLayer);

        // Platform layer with collision
        const platformLayer = map.createLayer('platforms', tileset, 0, 0);
        if (platformLayer) {
            platformLayer.setCollisionByExclusion([-1]);
            this.matter.world.convertTilemapLayer(platformLayer);
        }

        // Decoration layer (no collision)
        map.createLayer('decorations', tileset, 0, 0);

        // Parse object layers for spawns, hazards, enemies
        this.parseObjectLayers(map);

        // Camera setup
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // Store map reference
        this.map = map;

        // Temporary: display hole info
        this.add.text(16, 16, `Hole ${config.hole} | Par ${config.par} | ${config.biome}`, {
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            color: '#fff'
        }).setScrollFactor(0).setDepth(100);
    }

    createSky(skyConfig) {
        // Render sky gradient as a fixed background
        const { width, height } = this.cameras.main;
        const sky = this.add.graphics();
        sky.fillGradientStyle(skyConfig.top, skyConfig.top, skyConfig.bottom, skyConfig.bottom, 1);
        sky.fillRect(0, 0, this.map ? this.map.widthInPixels : 2000, 608);
        sky.setScrollFactor(0);
        sky.setDepth(-10);
    }

    parseObjectLayers(map) {
        // Parse spawn points
        const spawns = map.getObjectLayer('spawns');
        if (spawns) {
            spawns.objects.forEach(obj => {
                if (obj.name === 'playerSpawn') {
                    this.playerSpawn = { x: obj.x, y: obj.y };
                } else if (obj.name === 'ballSpawn') {
                    this.ballSpawn = { x: obj.x, y: obj.y };
                } else if (obj.name === 'holePosition') {
                    this.holePosition = { x: obj.x, y: obj.y };
                }
            });
        }

        // Parse hazards
        this.waterZones = [];
        this.sandZones = [];
        const hazards = map.getObjectLayer('hazards');
        if (hazards) {
            hazards.objects.forEach(obj => {
                if (obj.type === 'water') {
                    this.waterZones.push({ x: obj.x, y: obj.y, width: obj.width, height: obj.height });
                } else if (obj.type === 'sand') {
                    this.sandZones.push({ x: obj.x, y: obj.y, width: obj.width, height: obj.height });
                }
            });
        }

        // Parse enemy spawns
        this.enemySpawns = [];
        const enemies = map.getObjectLayer('enemies');
        if (enemies) {
            enemies.objects.forEach(obj => {
                this.enemySpawns.push({
                    x: obj.x, y: obj.y,
                    patrolWidth: obj.width || 200,
                    patrolHeight: obj.height || 0
                });
            });
        }
    }

    update(time, delta) {
        // Will be filled in with entity updates
    }
}
```

**Step 3: Update main.js imports**

Add HoleScene to scene array.

**Step 4: Verify tilemap renders**

Open browser, click Start Game. Should see the sky gradient and tilemap for hole 1 rendered. Ground tiles should be visible.

**Step 5: Commit**

```bash
git add golf-quest/src/
git commit -m "feat(golf-quest): implement HoleScene with tilemap loading and Matter.js collision"
```

---

## Task 11: Player Entity — Movement & Jumping

**Files:**
- Create: `golf-quest/src/entities/Player.js`
- Modify: `golf-quest/src/scenes/HoleScene.js` (instantiate Player)

**Step 1: Create Player.js**

Player entity using Matter.js body. Handles movement, jumping, health, and invincibility.

```js
// golf-quest/src/entities/Player.js
import { PhysicsConfig } from '../systems/PhysicsConfig.js';

export class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        const cfg = PhysicsConfig.player;

        // Create Matter.js body
        this.sprite = scene.matter.add.sprite(x, y, 'jj', 0);
        this.sprite.setFixedRotation();
        this.sprite.setFrictionAir(cfg.frictionAir);
        this.sprite.setBounce(0);

        // Player state
        this.maxJumps = 1; // updated by equipment
        this.jumpsRemaining = this.maxJumps;
        this.isGrounded = false;
        this.maxHealth = 2; // updated by equipment
        this.health = this.maxHealth;
        this.isInvincible = false;
        this.facingRight = true;
        this.speed = cfg.speed;
        this.jumpForce = cfg.jumpForce;

        // Ground detection sensor (small rectangle at feet)
        const Bodies = Phaser.Physics.Matter.Matter.Bodies;
        const groundSensor = Bodies.rectangle(0, cfg.height / 2 + 2, cfg.width - 4, 4, { isSensor: true });
        const compoundBody = Phaser.Physics.Matter.Matter.Body.create({
            parts: [this.sprite.body, groundSensor],
            frictionAir: cfg.frictionAir
        });
        // Note: compound body approach — may need adjustment based on Phaser Matter API

        // Input
        this.cursors = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
            arrowUp: Phaser.Input.Keyboard.KeyCodes.UP,
            arrowDown: Phaser.Input.Keyboard.KeyCodes.DOWN,
            arrowLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
            arrowRight: Phaser.Input.Keyboard.KeyCodes.RIGHT
        });

        // Animations
        this.createAnimations(scene);

        // Collision events for ground detection
        scene.matter.world.on('collisionstart', (event) => {
            event.pairs.forEach(pair => {
                if (pair.bodyA === groundSensor || pair.bodyB === groundSensor) {
                    this.isGrounded = true;
                    this.jumpsRemaining = this.maxJumps;
                }
            });
        });
        scene.matter.world.on('collisionend', (event) => {
            event.pairs.forEach(pair => {
                if (pair.bodyA === groundSensor || pair.bodyB === groundSensor) {
                    this.isGrounded = false;
                }
            });
        });
    }

    createAnimations(scene) {
        if (scene.anims.exists('jj-idle')) return;

        scene.anims.create({
            key: 'jj-idle',
            frames: scene.anims.generateFrameNumbers('jj', { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1
        });
        scene.anims.create({
            key: 'jj-walk',
            frames: scene.anims.generateFrameNumbers('jj', { start: 4, end: 9 }),
            frameRate: 10,
            repeat: -1
        });
        scene.anims.create({
            key: 'jj-jump',
            frames: scene.anims.generateFrameNumbers('jj', { start: 10, end: 11 }),
            frameRate: 6,
            repeat: 0
        });
        scene.anims.create({
            key: 'jj-swing',
            frames: scene.anims.generateFrameNumbers('jj', { start: 12, end: 15 }),
            frameRate: 12,
            repeat: 0
        });
        scene.anims.create({
            key: 'jj-hurt',
            frames: scene.anims.generateFrameNumbers('jj', { start: 16, end: 17 }),
            frameRate: 8,
            repeat: 0
        });
    }

    update() {
        const vel = this.sprite.body.velocity;
        let moveX = 0;

        // Horizontal movement
        if (this.cursors.left.isDown || this.cursors.arrowLeft.isDown) {
            moveX = -this.speed;
            this.sprite.setFlipX(true);
            this.facingRight = false;
        } else if (this.cursors.right.isDown || this.cursors.arrowRight.isDown) {
            moveX = this.speed;
            this.sprite.setFlipX(false);
            this.facingRight = true;
        }

        this.sprite.setVelocityX(moveX);

        // Jump
        if (Phaser.Input.Keyboard.JustDown(this.cursors.jump) ||
            Phaser.Input.Keyboard.JustDown(this.cursors.arrowUp) ||
            Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            if (this.jumpsRemaining > 0) {
                this.sprite.setVelocityY(this.jumpForce);
                this.jumpsRemaining--;
            }
        }

        // Animations
        if (!this.isGrounded) {
            this.sprite.anims.play('jj-jump', true);
        } else if (Math.abs(moveX) > 0) {
            this.sprite.anims.play('jj-walk', true);
        } else {
            this.sprite.anims.play('jj-idle', true);
        }
    }

    takeDamage(amount) {
        if (this.isInvincible) return;
        this.health -= amount;
        this.isInvincible = true;

        // Flash tween for invincibility
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: { from: 0.3, to: 1 },
            duration: 100,
            repeat: 8,
            yoyo: true,
            onComplete: () => {
                this.isInvincible = false;
                this.sprite.setAlpha(1);
            }
        });

        if (this.health <= 0) {
            this.onKO();
        }
    }

    onKO() {
        // Reset health, add stroke penalty
        this.health = this.maxHealth;
        const gs = this.scene.registry.get('gameState');
        gs.strokes++;
        // Respawn at player spawn
        this.sprite.setPosition(this.scene.playerSpawn.x, this.scene.playerSpawn.y);
        this.sprite.setVelocity(0, 0);
    }

    setEquipment(equipment) {
        // Update stats based on equipment
        const bootsJumps = [1, 2, 3, 999]; // Standard, Double, Triple, Flying
        this.maxJumps = bootsJumps[equipment.boots] || 1;
        const shirtHealth = [2, 3, 4, 5, 6];
        this.maxHealth = shirtHealth[equipment.shirt] || 2;
        this.health = this.maxHealth;
    }

    destroy() {
        this.sprite.destroy();
    }
}
```

**Step 2: Instantiate Player in HoleScene.create()**

After parsing object layers:
```js
// Create player
this.player = new Player(this, this.playerSpawn.x, this.playerSpawn.y);
const gs = this.registry.get('gameState');
this.player.setEquipment(gs.equipment);
this.cameras.main.startFollow(this.player.sprite, false, 0.1, 0.1);
```

In `update()`:
```js
this.player.update();
```

**Step 3: Verify player moves and jumps on the tilemap**

Open hole 1. Player should spawn, walk with WASD, jump with Space, and collide with ground tiles.

**Step 4: Commit**

```bash
git add golf-quest/src/entities/Player.js golf-quest/src/scenes/HoleScene.js
git commit -m "feat(golf-quest): implement Player entity with movement, jumping, and ground detection"
```

---

## Task 12: Ball Entity — Slingshot Aiming & Physics

**Files:**
- Create: `golf-quest/src/entities/Ball.js`
- Modify: `golf-quest/src/scenes/HoleScene.js` (instantiate Ball, add aim rendering)

**Step 1: Create Ball.js**

Ball entity with Matter.js physics, slingshot aiming via mouse/touch drag, trajectory preview.

```js
// golf-quest/src/entities/Ball.js
import { PhysicsConfig } from '../systems/PhysicsConfig.js';

export class Ball {
    constructor(scene, x, y) {
        this.scene = scene;
        const cfg = PhysicsConfig.ball;

        this.sprite = scene.matter.add.sprite(x, y, 'ball');
        this.sprite.setCircle(cfg.radius);
        this.sprite.setBounce(cfg.restitution);
        this.sprite.setFriction(cfg.friction);
        this.sprite.setFrictionAir(cfg.frictionAir);
        this.sprite.setDensity(cfg.density);

        // Aiming state
        this.isAiming = false;
        this.aimStart = null;
        this.aimEnd = null;
        this.isMoving = false;

        // Trajectory preview graphics
        this.trajectoryGraphics = scene.add.graphics();
        this.trajectoryGraphics.setDepth(50);

        // Input: detect drag on ball
        this.sprite.setInteractive();
        this.sprite.on('pointerdown', (pointer) => {
            if (this.isMoving) return;
            this.isAiming = true;
            this.aimStart = { x: pointer.worldX, y: pointer.worldY };
        });

        scene.input.on('pointermove', (pointer) => {
            if (!this.isAiming) return;
            this.aimEnd = { x: pointer.worldX, y: pointer.worldY };
            this.drawTrajectory();
        });

        scene.input.on('pointerup', (pointer) => {
            if (!this.isAiming) return;
            this.isAiming = false;
            this.trajectoryGraphics.clear();

            if (this.aimStart && this.aimEnd) {
                this.hit();
            }
            this.aimStart = null;
            this.aimEnd = null;
        });
    }

    drawTrajectory() {
        this.trajectoryGraphics.clear();
        if (!this.aimStart || !this.aimEnd) return;

        const dx = this.aimStart.x - this.aimEnd.x;
        const dy = this.aimStart.y - this.aimEnd.y;
        const power = Math.min(Math.sqrt(dx * dx + dy * dy) * 0.1, PhysicsConfig.ball.maxHitPower);

        if (power < PhysicsConfig.ball.minHitPower) return;

        const angle = Math.atan2(dy, dx);
        const vx = Math.cos(angle) * power;
        const vy = Math.sin(angle) * power;

        // Simulate trajectory
        const gravity = this.scene.matter.world.engine.gravity;
        let sx = this.sprite.x;
        let sy = this.sprite.y;
        let svx = vx;
        let svy = vy;

        this.trajectoryGraphics.fillStyle(0xffffff, 0.6);
        for (let i = 0; i < 40; i++) {
            svx *= 0.998;
            svy += gravity.y * 0.03; // approximate Matter timestep
            svy *= 0.998;
            sx += svx;
            sy += svy;

            if (i % 2 === 0) {
                this.trajectoryGraphics.fillCircle(sx, sy, 2);
            }
        }

        // Power indicator line
        this.trajectoryGraphics.lineStyle(2, 0xc9a84c, 0.8);
        this.trajectoryGraphics.beginPath();
        this.trajectoryGraphics.moveTo(this.sprite.x, this.sprite.y);
        this.trajectoryGraphics.lineTo(this.sprite.x + vx * 3, this.sprite.y + vy * 3);
        this.trajectoryGraphics.strokePath();
    }

    hit() {
        const dx = this.aimStart.x - this.aimEnd.x;
        const dy = this.aimStart.y - this.aimEnd.y;
        const power = Math.min(Math.sqrt(dx * dx + dy * dy) * 0.1, PhysicsConfig.ball.maxHitPower);

        if (power < PhysicsConfig.ball.minHitPower) return;

        const angle = Math.atan2(dy, dx);
        const vx = Math.cos(angle) * power;
        const vy = Math.sin(angle) * power;

        this.sprite.setVelocity(vx, vy);
        this.isMoving = true;

        // Play swing sound
        this.scene.sound.play('swing', { volume: 0.6 });

        // Increment strokes
        const gs = this.scene.registry.get('gameState');
        gs.strokes++;

        // Play swing animation on player
        if (this.scene.player) {
            this.scene.player.sprite.anims.play('jj-swing', true);
        }
    }

    update() {
        // Check if ball has stopped moving
        if (this.isMoving) {
            const vel = this.sprite.body.velocity;
            const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
            if (speed < 0.2) {
                this.isMoving = false;
            }

            // Camera follow ball when moving
            this.scene.cameras.main.startFollow(this.sprite, false, 0.1, 0.1);
        } else {
            // Camera follow player when ball stopped
            if (this.scene.player) {
                this.scene.cameras.main.startFollow(this.scene.player.sprite, false, 0.1, 0.1);
            }
        }
    }

    reset(x, y) {
        this.sprite.setPosition(x, y);
        this.sprite.setVelocity(0, 0);
        this.isMoving = false;
    }

    destroy() {
        this.trajectoryGraphics.destroy();
        this.sprite.destroy();
    }
}
```

**Step 2: Instantiate Ball in HoleScene and add hole detection**

Add to HoleScene.create():
```js
this.ball = new Ball(this, this.ballSpawn.x, this.ballSpawn.y);
```

Add to HoleScene.update():
```js
this.ball.update();
this.checkHoleCompletion();
this.checkHazards();
```

Implement `checkHoleCompletion()` — checks distance between ball and hole position, captures ball if close + slow enough.

Implement `checkHazards()` — checks ball position against water zones, resets with penalty.

**Step 3: Verify slingshot aiming works**

Click and drag on ball, see trajectory preview. Release to launch ball. Ball should bounce on terrain with Matter.js physics.

**Step 4: Commit**

```bash
git add golf-quest/src/entities/Ball.js golf-quest/src/scenes/HoleScene.js
git commit -m "feat(golf-quest): implement Ball entity with slingshot aiming and trajectory preview"
```

---

## Task 13: HUD Overlay

**Files:**
- Create: `golf-quest/src/ui/HUD.js`
- Modify: `golf-quest/src/scenes/HoleScene.js` (instantiate HUD)

**Step 1: Create HUD.js**

Fixed UI overlay showing hole info, hearts, strokes, coins, and status text.

```js
// golf-quest/src/ui/HUD.js
export class HUD {
    constructor(scene) {
        this.scene = scene;
        const depth = 200;

        // Title
        this.titleText = scene.add.text(600, 8, 'JHI GOLF QUEST', {
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '16px',
            color: '#c9a84c'
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(depth);

        // Hole & Par
        this.holeText = scene.add.text(16, 8, '', {
            fontFamily: 'Georgia, serif', fontSize: '14px', color: '#fff'
        }).setScrollFactor(0).setDepth(depth);

        // Strokes
        this.strokesText = scene.add.text(16, 28, '', {
            fontFamily: 'Georgia, serif', fontSize: '14px', color: '#fff'
        }).setScrollFactor(0).setDepth(depth);

        // Hearts
        this.heartsText = scene.add.text(1184, 8, '', {
            fontFamily: 'Georgia, serif', fontSize: '14px', color: '#ff4444'
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(depth);

        // Coins
        this.coinsText = scene.add.text(1184, 28, '', {
            fontFamily: 'Georgia, serif', fontSize: '14px', color: '#c9a84c'
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(depth);

        // Status text (bottom center)
        this.statusText = scene.add.text(600, 575, '', {
            fontFamily: 'Georgia, serif', fontSize: '16px', color: '#fff',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(depth);

        this.statusTimer = 0;
    }

    update(holeConfig, player, gameState) {
        this.holeText.setText(`Hole ${holeConfig.hole}/9  |  Par ${holeConfig.par}`);
        this.strokesText.setText(`Strokes: ${gameState.strokes}`);

        // Hearts display
        const full = player.health;
        const max = player.maxHealth;
        let hearts = '';
        for (let i = 0; i < max; i++) {
            hearts += i < full ? '❤️' : '♡';
        }
        this.heartsText.setText(hearts);

        this.coinsText.setText(`Coins: ${gameState.coins}`);

        // Status timer
        if (this.statusTimer > 0) {
            this.statusTimer--;
            if (this.statusTimer === 0) {
                this.statusText.setText('');
            }
        }
    }

    showStatus(text, duration = 120) {
        this.statusText.setText(text);
        this.statusTimer = duration;
    }

    destroy() {
        this.titleText.destroy();
        this.holeText.destroy();
        this.strokesText.destroy();
        this.heartsText.destroy();
        this.coinsText.destroy();
        this.statusText.destroy();
    }
}
```

**Step 2: Instantiate in HoleScene, call update() in game loop**

**Step 3: Verify HUD displays correctly, updates with strokes/health changes**

**Step 4: Commit**

```bash
git add golf-quest/src/ui/HUD.js golf-quest/src/scenes/HoleScene.js
git commit -m "feat(golf-quest): implement HUD overlay with hole info, hearts, strokes, coins"
```

---

## Task 14: Hazard Zones — Water, Sand, Hole Completion

**Files:**
- Modify: `golf-quest/src/scenes/HoleScene.js` (add hazard & hole completion logic)
- Modify: `golf-quest/src/entities/Ball.js` (add sand friction handling)

**Step 1: Create Matter sensor bodies for water and sand zones**

In HoleScene.create(), after parsing object layers, create Matter sensors:
```js
// Water sensors
this.waterZones.forEach(zone => {
    const sensor = this.matter.add.rectangle(
        zone.x + zone.width / 2, zone.y + zone.height / 2,
        zone.width, zone.height,
        { isSensor: true, isStatic: true, label: 'water' }
    );
});

// Sand sensors
this.sandZones.forEach(zone => {
    const sensor = this.matter.add.rectangle(
        zone.x + zone.width / 2, zone.y + zone.height / 2,
        zone.width, zone.height,
        { isSensor: true, isStatic: true, label: 'sand' }
    );
});

// Hole sensor
if (this.holePosition) {
    this.holeSensor = this.matter.add.circle(
        this.holePosition.x, this.holePosition.y, 20,
        { isSensor: true, isStatic: true, label: 'hole' }
    );
}
```

**Step 2: Handle collision events**

Listen for `collisionstart` between ball body and sensors. Water: reset ball + penalty + coins. Sand: increase ball friction while overlapping. Hole: check ball speed, if slow enough → hole complete.

**Step 3: Add hole completion overlay**

When ball enters hole at low speed:
- Play applause sound
- Show "Hole Complete!" overlay with par performance text (birdie, par, bogey, etc.)
- "Next Hole" / "Shop" button
- Award coins based on performance

**Step 4: Test water resets ball, sand slows ball, hole captures ball**

**Step 5: Commit**

```bash
git add golf-quest/src/scenes/HoleScene.js golf-quest/src/entities/Ball.js
git commit -m "feat(golf-quest): implement water, sand, and hole completion hazard zones"
```

---

## Task 15: Scene Transitions — Hole Flow & Shop Entry

**Files:**
- Modify: `golf-quest/src/scenes/HoleScene.js` (add next-hole / shop transitions)

**Step 1: Implement hole complete → next hole flow**

After hole completion overlay, two paths:
- "Next Hole" button → `this.scene.start('HoleScene', { hole: this.holeNumber + 1 })`
- "Shop" button → `this.scene.start('ShopScene', { nextHole: this.holeNumber + 1 })`

Reset strokes to 0 for new hole. Save score for completed hole to gameState.scores array.

**Step 2: Handle final hole (9) → cinematic instead of next hole**

If hole 9 complete, transition to `CinematicScene` with type 'ending'.

**Step 3: Handle hole 8 complete → space cinematic**

If hole 8 complete, transition to `CinematicScene` with type 'space-launch', which then transitions to HoleScene hole 9.

**Step 4: Verify full hole flow works (1 → shop → 2 → ...)**

**Step 5: Commit**

```bash
git add golf-quest/src/scenes/HoleScene.js
git commit -m "feat(golf-quest): implement hole completion flow with shop and cinematic transitions"
```

---

## Task 16: Shop Scene

**Files:**
- Create: `golf-quest/src/scenes/ShopScene.js`
- Create: `golf-quest/src/systems/EquipmentSystem.js`
- Modify: `golf-quest/src/main.js` (add ShopScene import)

**Step 1: Create EquipmentSystem.js**

Defines equipment tiers, prices, stats, and purchase logic.

```js
// golf-quest/src/systems/EquipmentSystem.js
export const EquipmentData = {
    club: {
        tiers: ['Copper', 'Silver', 'Steel', 'Gold', 'Diamond'],
        prices: [0, 3, 5, 8, 12],
        powerMultiplier: [1.0, 1.25, 1.5, 1.75, 2.0],
        damage: [1, 2, 3, 4, 5]
    },
    shaft: {
        tiers: ['Standard', 'Autoflex Pink'],
        prices: [0, 4],
        // Visual only
    },
    boots: {
        tiers: ['Standard', 'Double-Jump', 'Triple-Jump', 'Flying'],
        prices: [0, 4, 7, 12],
        maxJumps: [1, 2, 3, 999]
    },
    shirt: {
        tiers: ['Plain White', 'Navy Polo', 'Striped', 'Gold-Trimmed', 'Diamond Argyle'],
        prices: [0, 3, 5, 8, 12],
        maxHealth: [2, 3, 4, 5, 6]
    }
};

export function getNextTierPrice(slot, currentTier) {
    const data = EquipmentData[slot];
    const nextTier = currentTier + 1;
    if (nextTier >= data.tiers.length) return null; // maxed out
    return data.prices[nextTier];
}

export function canAfford(coins, slot, currentTier) {
    const price = getNextTierPrice(slot, currentTier);
    return price !== null && coins >= price;
}
```

**Step 2: Create ShopScene.js**

Interior scene with pedestals for each equipment slot. Player walks around, approaches pedestals to see item info, presses Up to buy.

- Background: wooden floor, walls, window
- 4-5 pedestals with floating item icons
- Shopkeeper NPC on the right with dialogue
- Equipment info popup when near pedestal
- Buy confirmation
- Cheat code entry via shopkeeper interaction
- "Exit Shop" button/zone to proceed to next hole

**Step 3: Implement cheat code for Patrick Wong**

When interacting with shopkeeper, prompt for code. If "password" entered and coins >= 50, unlock Patrick.

**Step 4: Test buying equipment updates gameState, exiting shop starts next hole**

**Step 5: Commit**

```bash
git add golf-quest/src/systems/EquipmentSystem.js golf-quest/src/scenes/ShopScene.js golf-quest/src/main.js
git commit -m "feat(golf-quest): implement shop scene with equipment purchasing and cheat code"
```

---

## Task 17: Enemy Entity — Sand Golems

**Files:**
- Create: `golf-quest/src/entities/Enemy.js`
- Modify: `golf-quest/src/scenes/HoleScene.js` (spawn enemies from tilemap data)

**Step 1: Create Enemy.js**

Sand Golem entity: patrols a zone, detects player proximity, throws projectiles, takes damage from ball hits.

Key behaviors:
- Patrol: walk back and forth within defined zone
- Detect: when player within 300px, switch to attack mode
- Attack: wind up → throw sand projectile (Matter body aimed at player)
- Cooldown: 120-180 frames between throws
- Damage: takes hits from ball, HP based on club damage tier
- Death: crumble tween, particle burst, award coins

**Step 2: Create projectile logic**

Sand projectiles are Matter circle bodies with gravity. On collision with player → player.takeDamage(1). On collision with ground → destroy.

**Step 3: Spawn enemies in HoleScene based on enemySpawns data**

Loop through `this.enemySpawns` and create Enemy instances. Store in `this.enemies` array. Call `enemy.update()` in game loop.

**Step 4: Test enemies patrol, throw projectiles, take damage from ball, award coins on death**

**Step 5: Commit**

```bash
git add golf-quest/src/entities/Enemy.js golf-quest/src/scenes/HoleScene.js
git commit -m "feat(golf-quest): implement Sand Golem enemies with patrol, attack, and death"
```

---

## Task 18: Boss Entity — Lunar Dragon

**Files:**
- Create: `golf-quest/src/entities/Boss.js`
- Modify: `golf-quest/src/scenes/HoleScene.js` (spawn boss on hole 9)

**Step 1: Create Boss.js**

Lunar Dragon with three-phase attack patterns.

```
Phase 1 (100-60% HP):
- Dive bomb: tween dragon position across screen, damage on contact
- Breath attack: create ice patch zones (low-friction Matter sensors)
- Weak point: mouth opens during breath → glowing circle sensor
  - Ball hitting weak point = major damage (5 HP)
  - Ball hitting body = minor damage (1 HP)

Phase 2 (60-30% HP):
- All Phase 1 attacks, faster
- Tail slam: fly to position, slam down, create expanding shockwave sensor
  - Shockwave damages player (2 HP) and pushes ball away

Phase 3 (30-0% HP):
- All Phase 2 attacks, even faster
- Spawn mini-asteroids (small Matter circles drifting down)
- Weak point appears for shorter duration
- Pulsing red aura tween on sprite
```

**Step 2: Implement health bar**

Render above dragon sprite using Phaser Graphics. Green → yellow → red gradient based on HP percentage.

**Step 3: Implement death sequence**

Explosion particle burst, screen shake, victory fanfare, transition to ending cinematic.

**Step 4: Test all three phases, ball damage to weak point vs body, death triggers cinematic**

**Step 5: Commit**

```bash
git add golf-quest/src/entities/Boss.js golf-quest/src/scenes/HoleScene.js
git commit -m "feat(golf-quest): implement Lunar Dragon boss with 3-phase attack patterns"
```

---

## Task 19: Asteroids (Hole 9)

**Files:**
- Modify: `golf-quest/src/scenes/HoleScene.js` (add asteroid spawning for hole 9)

**Step 1: Add asteroid spawning**

For hole 9, read asteroid zone rectangles from tilemap object layer. Spawn asteroid sprites as Matter circle bodies with sinusoidal drift (using `update()` to apply oscillating forces).

**Step 2: Ball-asteroid collision**

Ball bounces off asteroids with 0.8x energy retention (reduce velocity by 20% on bounce). Matter handles the collision response; just tweak restitution.

**Step 3: Test asteroids drift, ball bounces off them**

**Step 4: Commit**

```bash
git add golf-quest/src/scenes/HoleScene.js
git commit -m "feat(golf-quest): add drifting asteroids for hole 9 space level"
```

---

## Task 20: Patrick Wong — Secret Character & Psychic Mode

**Files:**
- Modify: `golf-quest/src/entities/Player.js` (add Patrick character support)
- Modify: `golf-quest/src/entities/Ball.js` (add psychic levitation mode)

**Step 1: Add Patrick animations to Player.js**

Create 'patrick-idle', 'patrick-walk', etc. animations from the patrick spritesheet. Switch sprite texture based on `gameState.activeCharacter`.

**Step 2: Implement psychic ball control in Ball.js**

When active character is Patrick:
- Disable slingshot mechanic
- Instead: click/touch sets a target position
- Ball smoothly levitates toward target with purple particle trail
- Each "move" counts as a stroke
- Purple particle emitter follows ball during levitation

**Step 3: Add purple aura particle effect to Patrick's sprite**

Phaser particle emitter attached to Patrick sprite, purple/violet colors.

**Step 4: Test character swap in shop, psychic mode works, leaderboard disqualification flag set**

**Step 5: Commit**

```bash
git add golf-quest/src/entities/Player.js golf-quest/src/entities/Ball.js
git commit -m "feat(golf-quest): implement Patrick Wong secret character with psychic ball control"
```

---

## Task 21: Sky & Background System

**Files:**
- Create: `golf-quest/src/systems/BackgroundSystem.js`
- Modify: `golf-quest/src/scenes/HoleScene.js` (use BackgroundSystem)

**Step 1: Create BackgroundSystem.js**

Renders sky gradients, parallax hills, sun/moon, stars, clouds, rain, and Earth (for space level) based on the hole's time-of-day config.

Features:
- Sky: vertical gradient fill, full map width
- Stars: small white dots with blinking alpha tween (night, moon)
- Sun: yellow circle with glow (day, afternoon)
- Moon: gray circle with craters (night)
- Earth: blue/green sphere with cloud layer (space level only)
- Clouds: white ellipses scrolling at 0.3x parallax
- Rain: particle emitter with gray streaks (storm)
- Parallax hills: 2 layers at 0.15x and 0.3x scroll factor
- Wind visual: slight particle drift in storm levels

All rendered as Phaser game objects at appropriate depths and scroll factors.

**Step 2: Integrate into HoleScene.create()**

Replace the simple `createSky()` call with BackgroundSystem instantiation.

**Step 3: Verify each time-of-day looks correct across hole configs**

**Step 4: Commit**

```bash
git add golf-quest/src/systems/BackgroundSystem.js golf-quest/src/scenes/HoleScene.js
git commit -m "feat(golf-quest): add sky and parallax background system with weather effects"
```

---

## Task 22: Wind Physics (Storm Levels)

**Files:**
- Modify: `golf-quest/src/entities/Ball.js` (apply wind force)
- Modify: `golf-quest/src/scenes/HoleScene.js` (set wind from biome config)

**Step 1: Apply wind force to ball in update()**

For storm biome, apply constant horizontal force to ball Matter body each frame:
```js
if (this.windForce !== 0 && this.isMoving) {
    this.sprite.applyForce({ x: this.windForce, y: 0 });
}
```

**Step 2: Add wind indicator to HUD**

Show arrow and "WIND →" text when wind is active.

**Step 3: Test ball drifts in storm levels, trajectory preview accounts for wind**

**Step 4: Commit**

```bash
git add golf-quest/src/entities/Ball.js golf-quest/src/scenes/HoleScene.js golf-quest/src/ui/HUD.js
git commit -m "feat(golf-quest): implement wind physics for storm levels"
```

---

## Task 23: Mobile Controls — Virtual Joystick

**Files:**
- Create: `golf-quest/src/ui/MobileControls.js`
- Modify: `golf-quest/index.html` (add Rex plugin CDN)
- Modify: `golf-quest/src/scenes/HoleScene.js` (integrate mobile controls)

**Step 1: Add Rex Virtual Joystick plugin to index.html**

```html
<script src="https://cdn.jsdelivr.net/npm/phaser3-rex-plugins@1.80.0/dist/rexvirtualjoystickplugin.min.js"></script>
```

**Step 2: Create MobileControls.js**

Detects if device is mobile. If so:
- Creates Rex virtual joystick on left side of screen
- Creates two floating circle buttons on right: Jump (top), Hit (bottom)
- Joystick feeds into Player movement (replaces keyboard)
- Jump button triggers player jump
- Hit button activates ball slingshot mode (then user drags on ball)
- Down on joystick triggers range finder zoom

```js
// golf-quest/src/ui/MobileControls.js
export class MobileControls {
    constructor(scene) {
        this.scene = scene;
        this.isMobile = !scene.sys.game.device.os.desktop;
        if (!this.isMobile) return;

        // Virtual joystick
        this.joystick = scene.plugins.get('rexvirtualjoystickplugin').add(scene, {
            x: 100,
            y: 500,
            radius: 50,
            base: scene.add.circle(0, 0, 50, 0x2d6a4f, 0.5).setScrollFactor(0).setDepth(300),
            thumb: scene.add.circle(0, 0, 25, 0xc9a84c, 0.8).setScrollFactor(0).setDepth(300),
        });

        // Jump button
        this.jumpBtn = scene.add.circle(1100, 460, 30, 0x40916c, 0.7)
            .setScrollFactor(0).setDepth(300).setInteractive();
        scene.add.text(1100, 460, 'Jump', {
            fontSize: '12px', color: '#fff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        // Hit button
        this.hitBtn = scene.add.circle(1100, 540, 30, 0xc9a84c, 0.7)
            .setScrollFactor(0).setDepth(300).setInteractive();
        scene.add.text(1100, 540, 'Hit', {
            fontSize: '12px', color: '#1a472a'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        // Button events
        this.jumpBtn.on('pointerdown', () => {
            this.jumpPressed = true;
        });
        this.hitBtn.on('pointerdown', () => {
            this.hitPressed = true;
        });

        this.jumpPressed = false;
        this.hitPressed = false;
    }

    getMovement() {
        if (!this.isMobile || !this.joystick) return { x: 0, y: 0, down: false };
        const force = this.joystick.force;
        const angle = this.joystick.angle;
        if (force < 10) return { x: 0, y: 0, down: false };

        const rad = Phaser.Math.DegToRad(angle);
        return {
            x: Math.cos(rad) * (force > 30 ? 1 : 0.5),
            y: Math.sin(rad),
            down: angle > 45 && angle < 135 // joystick pointing down
        };
    }

    consumeJump() {
        if (this.jumpPressed) {
            this.jumpPressed = false;
            return true;
        }
        return false;
    }

    consumeHit() {
        if (this.hitPressed) {
            this.hitPressed = false;
            return true;
        }
        return false;
    }

    destroy() {
        if (this.joystick) this.joystick.destroy();
        if (this.jumpBtn) this.jumpBtn.destroy();
        if (this.hitBtn) this.hitBtn.destroy();
    }
}
```

**Step 3: Integrate into Player.update() — check mobile input alongside keyboard**

**Step 4: Test on mobile (or Chrome DevTools device emulation)**

**Step 5: Commit**

```bash
git add golf-quest/src/ui/MobileControls.js golf-quest/index.html golf-quest/src/scenes/HoleScene.js golf-quest/src/entities/Player.js
git commit -m "feat(golf-quest): add virtual joystick and mobile touch controls"
```

---

## Task 24: Camera System — Range Finder & Ball Follow

**Files:**
- Modify: `golf-quest/src/scenes/HoleScene.js` (add range finder zoom)

**Step 1: Implement range finder**

When player holds Down (or joystick down):
- Tween camera zoom from 1.0 to 0.4 over 500ms
- Show full course layout
- When released, tween back to 1.0

```js
// In HoleScene.update()
const isDown = this.cursors.down.isDown || this.cursors.arrowDown.isDown ||
    (this.mobileControls && this.mobileControls.getMovement().down);

if (isDown && !this.isZoomedOut) {
    this.isZoomedOut = true;
    this.tweens.add({
        targets: this.cameras.main,
        zoom: 0.4,
        duration: 500,
        ease: 'Quad.easeOut'
    });
} else if (!isDown && this.isZoomedOut) {
    this.isZoomedOut = false;
    this.tweens.add({
        targets: this.cameras.main,
        zoom: 1,
        duration: 500,
        ease: 'Quad.easeOut'
    });
}
```

**Step 2: Improve camera follow transitions**

When ball is hit, smooth transition to follow ball. When ball stops, smooth transition back to player. Use Phaser camera lerp and `startFollow()` / `stopFollow()`.

**Step 3: Test range finder zooms out/in, camera smoothly switches between player and ball**

**Step 4: Commit**

```bash
git add golf-quest/src/scenes/HoleScene.js
git commit -m "feat(golf-quest): implement range finder zoom and smooth camera transitions"
```

---

## Task 25: Cinematic Scenes — Space Launch & Ending

**Files:**
- Create: `golf-quest/src/scenes/CinematicScene.js`
- Modify: `golf-quest/src/main.js` (add CinematicScene import)

**Step 1: Create CinematicScene.js**

Handles two cinematic types via init data:

**Space Launch (type: 'space-launch'):**
- ~8 seconds of Phaser tweens
- Phase 1: Ground rumbles (camera shake), cracks appear
- Phase 2: Rocket rises (sprite tween upward), clouds rush by
- Phase 3: Stars fade in, Earth appears below
- Phase 4: Lunar surface rises from bottom
- Title text: "HOLE 9 - THE FINAL FRONTIER"
- Auto-transition to HoleScene hole 9

**Ending (type: 'ending'):**
- ~10 seconds
- Phase 1: Character celebrating on moon surface (particle burst)
- Phase 2: Rocket lands, door opens
- Phase 3: Rocket flies toward Earth (tween to center)
- Phase 4: Indoor scene — couch, TV, pizza, "Home Sweet Home"
- Phase 5: Fade to black → transition to LeaderboardScene

All rendered with Phaser Graphics, text objects, and tweens. No external assets needed beyond existing sprites.

**Step 2: Test space launch plays after hole 8, ending plays after hole 9 boss defeated**

**Step 3: Commit**

```bash
git add golf-quest/src/scenes/CinematicScene.js golf-quest/src/main.js
git commit -m "feat(golf-quest): implement space launch and ending cinematic scenes"
```

---

## Task 26: Score Manager & Coin Economy

**Files:**
- Create: `golf-quest/src/systems/ScoreManager.js`
- Modify: `golf-quest/src/scenes/HoleScene.js` (use ScoreManager)

**Step 1: Create ScoreManager.js**

Centralized scoring logic:
```js
export class ScoreManager {
    static calculateHoleScore(strokes, par) {
        return strokes; // raw strokes stored
    }

    static getParLabel(strokes, par) {
        const diff = strokes - par;
        if (diff <= -2) return 'Eagle!';
        if (diff === -1) return 'Birdie!';
        if (diff === 0) return 'Par';
        if (diff === 1) return 'Bogey';
        if (diff === 2) return 'Double Bogey';
        return `+${diff}`;
    }

    static calculateCoins(strokes, par, enemiesKilled, waterPenalties) {
        let coins = 0;
        coins += waterPenalties * 10;
        coins += enemiesKilled * 5;
        // Bonus for good performance
        const diff = strokes - par;
        if (diff <= 0) coins += 3;
        else coins += Math.max(0, 5 - diff);
        return Math.max(coins, 1); // minimum 1 coin per hole
    }

    static getTotalScore(scores) {
        return scores.reduce((a, b) => a + b, 0);
    }
}
```

**Step 2: Integrate into hole completion flow**

When hole completes, use ScoreManager to calculate coins, display par label, update gameState.

**Step 3: Test coin awards match expected values**

**Step 4: Commit**

```bash
git add golf-quest/src/systems/ScoreManager.js golf-quest/src/scenes/HoleScene.js
git commit -m "feat(golf-quest): implement score manager and coin economy system"
```

---

## Task 27: Leaderboard Scene

**Files:**
- Create: `golf-quest/src/scenes/LeaderboardScene.js`
- Modify: `golf-quest/src/main.js` (add import)

**Step 1: Create LeaderboardScene.js**

Three-step flow (matching original):

**Step 1 UI: Score Entry**
- "Round Complete!" header
- Score summary text
- Name input field (DOM element overlaid on canvas)
- Submit button
- Skip button
- If usedPatrick: hide form, show "ineligible" note

**Step 2 UI: Leaderboard Display**
- Fetch from Google Sheets CSV URL: `https://docs.google.com/spreadsheets/d/e/2PACX-1vS49XDtAb3svIzIoEjvpzz19aPpfjJcRxZUuxI8qFPo-xemZnWM1-VdE-wiGhtk_iS-UtZD_hk1gRbl/pub?output=csv`
- Parse CSV, filter to game='golf-quest', sort by score ascending
- Display top 10 with medals (gold/silver/bronze text color)
- Continue button

**Step 3 UI: Share & Replay**
- Share button (generates score card image using Phaser's `game.renderer.snapshot()`)
- Play Again button → restart at MenuScene

**Submit logic:**
- POST to Google Forms: `https://docs.google.com/forms/d/e/1FAIpQLSd4E6PN9B8Ukg_aTcTXO-v9DqEyLHi5JBpFlyUZakLIcNMXGg/formResponse`
- Entry fields: `entry.1771708931` (game name = 'golf-quest'), `entry.1133504589` (player name), `entry.1610870950` (score)
- Save name to localStorage: `jhi-leaderboard-name`

**Step 2: Test submit and fetch from Google Sheets**

**Step 3: Commit**

```bash
git add golf-quest/src/scenes/LeaderboardScene.js golf-quest/src/main.js
git commit -m "feat(golf-quest): implement leaderboard scene with Google Sheets integration"
```

---

## Task 28: Audio Integration

**Files:**
- Modify: `golf-quest/src/scenes/HoleScene.js` (add background music)
- Modify: `golf-quest/src/scenes/MenuScene.js` (start music on interaction)

**Step 1: Start background music**

In MenuScene, on first click/touch:
```js
if (!this.sound.get('bgMusic')?.isPlaying) {
    this.sound.play('bgMusic', { loop: true, volume: 0.225 });
}
```

Music continues across scenes (Phaser sound manager persists).

**Step 2: Ensure swing and applause sounds play at correct moments**

Already wired in Ball.hit() and hole completion. Verify they work.

**Step 3: Test audio plays, loops, transitions between scenes correctly**

**Step 4: Commit**

```bash
git add golf-quest/src/scenes/HoleScene.js golf-quest/src/scenes/MenuScene.js
git commit -m "feat(golf-quest): integrate background music and sound effects"
```

---

## Task 29: Particle Effects

**Files:**
- Modify: `golf-quest/src/entities/Ball.js` (hit particles)
- Modify: `golf-quest/src/entities/Enemy.js` (death particles)
- Modify: `golf-quest/src/entities/Boss.js` (attack and death particles)
- Modify: `golf-quest/src/entities/Player.js` (damage particles, psychic aura)

**Step 1: Add Phaser particle emitters**

Ball hit: gold/white sparkles burst at hit point.
Ball land: green grass particles on ground impact (meadow), sand puff (desert), snow puff (tundra), gray dust (space).
Enemy death: brown/tan crumble particles.
Boss death: gold + red explosion.
Player damage: red cloud.
Patrick psychic: purple trail on ball during levitation.

Use Phaser's built-in particle system with generated textures (small colored rectangles/circles via `scene.add.graphics()` → `generateTexture()`).

**Step 2: Test particles appear at correct events**

**Step 3: Commit**

```bash
git add golf-quest/src/entities/
git commit -m "feat(golf-quest): add particle effects for hits, deaths, damage, and psychic mode"
```

---

## Task 30: Golf Hole Flag & Visual Polish

**Files:**
- Modify: `golf-quest/src/scenes/HoleScene.js` (add hole flag rendering, visual polish)

**Step 1: Render golf hole and flag**

At `this.holePosition`, draw:
- Dark circle (the hole) as a Phaser Graphics ellipse
- Flagpole (thin rectangle) extending upward
- Small triangle flag at top, waving tween (subtle rotation oscillation)

**Step 2: Add water rendering**

For water zones, render animated water surface using Phaser Graphics:
- Blue fill with wave sine pattern on top edge
- Subtle alpha variation for depth

**Step 3: Add sand trap rendering**

Tan/brown overlay on sand zones with subtle texture.

**Step 4: Visual polish pass**

- Add vignette overlay (dark corners)
- Smooth scene transition fades (camera fadeIn/fadeOut)
- Button hover effects in menus

**Step 5: Commit**

```bash
git add golf-quest/src/scenes/HoleScene.js
git commit -m "feat(golf-quest): add golf flag, water/sand rendering, and visual polish"
```

---

## Task 31: Footer Link & Final Integration

**Files:**
- Modify: `index.html` (add Golf Quest to footer nav)
- Modify: `golf-quest/index.html` (final meta tags, favicon)

**Step 1: Add "Golf Quest" link to main site footer**

In `index.html`, next to existing "Golf Adventure" and "Lot Plotter" links, add:
```html
| <a href="golf-quest/" style="color: var(--color-gold);">Golf Quest</a>
```

**Step 2: Add meta tags to golf-quest/index.html**

Open Graph tags, description, proper title for sharing.

**Step 3: Verify full game flow end-to-end**

Play through all 9 holes:
1. Menu → Start
2. Holes 1-3 (meadow, no enemies)
3. Hole 4 (desert, elevated green)
4. Holes 5-6 (desert, enemies)
5. Holes 7-8 (tundra, storm/wind)
6. Space launch cinematic
7. Hole 9 (boss fight)
8. Ending cinematic
9. Leaderboard → Share → Replay

**Step 4: Commit**

```bash
git add index.html golf-quest/index.html
git commit -m "feat(golf-quest): add footer link and finalize game integration"
```

---

## Task 32: Playwright Smoke Test

**Files:**
- Create: `tests/golf-quest.spec.js`

**Step 1: Write basic smoke test**

```js
const { test, expect } = require('@playwright/test');

test('Golf Quest loads and shows menu', async ({ page }) => {
    await page.goto('http://localhost:8080/golf-quest/');
    // Wait for Phaser canvas to render
    await page.waitForSelector('canvas');
    const canvas = await page.locator('canvas');
    await expect(canvas).toBeVisible();
});

test('Golf Quest starts game on click', async ({ page }) => {
    await page.goto('http://localhost:8080/golf-quest/');
    await page.waitForSelector('canvas');
    // Click center of canvas (where Start button is)
    const canvas = await page.locator('canvas');
    const box = await canvas.boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2 + 60);
    // Game should transition — no errors in console
});
```

**Step 2: Run tests**

```bash
npx playwright test tests/golf-quest.spec.js
```

**Step 3: Commit**

```bash
git add tests/golf-quest.spec.js
git commit -m "test(golf-quest): add Playwright smoke tests for game loading and start"
```

---

## Summary

32 tasks total. Approximate grouping:

| Tasks | Category | Description |
|-------|----------|-------------|
| 1-2 | Scaffold | Project setup, Phaser boot, menu |
| 3-4 | Assets | Tileset and sprite generation |
| 5-8 | Levels | Tilemap creation for all 9 holes + sounds |
| 9-10 | Core | Physics config, HoleScene with tilemap rendering |
| 11-12 | Gameplay | Player movement, Ball slingshot aiming |
| 13-14 | UI/Hazards | HUD overlay, water/sand/hole zones |
| 15-16 | Flow | Scene transitions, shop scene |
| 17-19 | Combat | Enemies, boss, asteroids |
| 20 | Character | Patrick Wong secret character |
| 21-22 | Visual | Sky/background system, wind physics |
| 23-24 | Mobile | Virtual joystick, camera system |
| 25-26 | Story | Cinematics, score manager |
| 27-28 | Integration | Leaderboard, audio |
| 29-31 | Polish | Particles, visual polish, site integration |
| 32 | Testing | Playwright smoke tests |
