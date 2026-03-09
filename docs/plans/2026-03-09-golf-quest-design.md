# Golf Quest — Design Document

**Date:** 2026-03-09
**Status:** Approved

## Overview

Golf Quest is a Phaser 3 recreation of JHI Golf Adventure — a 9-hole golf platformer with equipment progression, enemies, a boss fight, and cinematics. Built with Matter.js physics, Tiled-format tilemaps, and Owlboy-style pixel art sprites. Served as static files on GitHub Pages with no build step.

## Tech Stack

- **Framework:** Phaser 3 (CDN), ES modules (`<script type="module">`)
- **Physics:** Matter.js (Phaser's built-in integration)
- **Tilemaps:** Tiled-format JSON, 32x32 tiles, loaded natively by Phaser
- **Assets:** PNG sprite sheets + tilesets in `assets/` folder
- **Audio:** Reused from golf-adventure (background-music.mp3, swing.mp3, applause.wav)
- **Hosting:** GitHub Pages (static files, no bundler)

## File Structure

```
golf-quest/
├── index.html
├── assets/
│   ├── sprites/        (character, enemy, boss PNGs)
│   ├── tilesets/       (biome tileset PNGs)
│   ├── tilemaps/       (JSON tilemap data per hole)
│   └── sounds/         (reused from golf-adventure)
├── src/
│   ├── main.js         (Phaser config, boot)
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── PreloadScene.js
│   │   ├── MenuScene.js
│   │   ├── HoleScene.js      (shared scene, loads per-hole tilemap)
│   │   ├── ShopScene.js
│   │   ├── CinematicScene.js
│   │   └── LeaderboardScene.js
│   ├── entities/
│   │   ├── Player.js
│   │   ├── Ball.js
│   │   ├── Enemy.js
│   │   └── Boss.js
│   ├── systems/
│   │   ├── PhysicsConfig.js
│   │   ├── EquipmentSystem.js
│   │   └── ScoreManager.js
│   └── ui/
│       ├── HUD.js
│       └── MobileControls.js
```

## Scene Flow

```
Boot → Preload → Menu → HoleScene(1) → Shop → HoleScene(2) → ... → CinematicScene(space) → HoleScene(9/boss) → CinematicScene(ending) → Leaderboard
```

State persisted across scenes via Phaser's registry (`GameState` object): coins, equipment, scores, character selection, strokes.

## Gameplay Mechanics

### Movement & Controls

- **Desktop:** WASD/arrows to move, Space to jump, mouse drag on ball to aim/hit
- **Mobile:** Left virtual joystick (Rex plugin) for movement, Jump button (right-top), Hit button (right-bottom) activates slingshot aim mode
- **Slingshot aiming:** Touch/click ball, drag back, dotted trajectory preview shows arc with gravity, release to launch. Pull distance = power, pull direction = inverse launch angle.

### Ball Physics (Matter.js)

- Matter circle body with restitution (bounce), friction, air resistance
- Terrain collision via Matter polygon bodies from tilemap collision layer
- Sand traps: high friction sensor zone
- Water hazards: sensor triggers reset + 1 stroke penalty
- Hole: sensor with gravity tween pulls ball in when close + slow
- Wind: constant horizontal force in storm levels

### Player Physics

- Matter rectangle body, walks on terrain, jumps with configurable max jumps
- Cannot move ball directly — must use slingshot mechanic
- Takes damage from enemy projectiles and boss attacks
- Invincibility frames after hit (flashing tween)

### Scoring

- Strokes per hole, penalties for water/void/KO
- Par per hole displayed in HUD
- Total 9-hole score at end

## Holes & Progression

| Hole | Biome | Time | Par | Features |
|------|-------|------|-----|----------|
| 1 | Meadow | Day | 2 | Flat intro, learn controls |
| 2 | Meadow | Day | 3 | Rolling hills, slope physics |
| 3 | Meadow | Afternoon | 3 | Water gap, arc shot required |
| 4 | Desert | Afternoon | 3 | Elevated green, vertical challenge |
| 5 | Desert | Sunset | 4 | Multi-platform, water, 2 enemies |
| 6 | Desert | Sunset | 5 | Complex layout, 3 enemies, sand traps |
| 7 | Tundra | Storm | 4 | Wind physics, rain particles, 2 enemies |
| 8 | Tundra | Storm | 5 | Gauntlet — 3 enemies, multiple hazards |
| 9 | Space | Moon | 5 | Lunar Dragon boss, reduced gravity, asteroids |

### Biome Tilesets (4)

- **Meadow:** green grass, dirt, flowers, trees, wooden platforms
- **Desert:** sand, sandstone, cacti, rock platforms
- **Tundra:** snow, ice, frozen ground, stone platforms
- **Space:** lunar regolith, craters, metal platforms, starfield background

### Time-of-Day

Background parallax layer system (sky gradient, sun/moon, clouds/stars). Configured per hole — same tileset can have different sky/lighting.

### Cinematics

- **Hole 8→9:** Space launch sequence (Phaser tweens + camera effects)
- **After Hole 9:** Ending cinematic (victory → rocket → home scene)

## Entities & Combat

### Player Characters

**JJ Atencio (default):**
- 32x48 sprite, animations: idle (4f), walk (6f), jump (2f), swing (4f), hurt (2f)
- Equipment visually changes appearance (different sprite frames per tier)

**Patrick Wong (secret):**
- Same size, purple polo, glasses
- Psychic mode: ball levitates toward cursor/touch with purple particle trail
- Unlocked via cheat code "password" at shopkeeper, costs 50+ coins
- Disqualifies from leaderboard

### Enemies — Sand Golems

- 48x48 sprites, patrol zones from tilemap object layer
- Throw sand projectiles (Matter bodies) at player when in range
- Defeated when hit by ball — HP scales with club tier (1-5 hits)
- Death: crumble tween + particle burst

### Boss — Lunar Dragon (Hole 9)

- 128x128 sprite, three phases by HP threshold
- **Phase 1 (100-60%):** Swooping dive bombs, breath creates ice patches (low-friction Matter zones)
- **Phase 2 (60-30%):** Adds tail slam shockwaves (expanding Matter sensor), faster dives, larger ice patches
- **Phase 3 (30-0%):** Enraged — all attacks faster, spawns mini-asteroids, weak point appears less
- **Defeat:** Dragon opens mouth to breathe → glowing weak point → hit ball into mouth for major damage. Body hits do minor chip damage.
- Health bar above dragon, pulsing red aura in Phase 3

### Asteroids (Hole 9)

- Small Matter circle bodies drifting sinusoidally
- Ball bounces off with energy loss
- Crater detail on sprites

## Shop & Equipment

### Shop Scene

- Entered between holes after sinking ball
- Owlboy-style interior: wooden floor, pedestals, window with view
- Shopkeeper NPC with dialogue bubbles (Phaser text + tween)
- Walk to pedestals, press Up/button to buy

### Equipment Tiers

| Slot | Tiers | Effect |
|------|-------|--------|
| Club | Copper → Silver → Steel → Gold → Diamond | Power 1.0→2.0, enemy damage 1→5 |
| Shaft | Standard → Autoflex Pink | Visual only |
| Boots | Standard → Double → Triple → Flying | Jumps 1→2→3→infinite + wing particles |
| Shirt | Plain → Navy → Striped → Gold-Trim → Diamond Argyle | HP 2→3→4→5→6 |

Prices: 0-12 coins per tier.

### Economy

- Water penalty: +10 coins
- Enemy defeat: +5 coins
- Above par: +varies
- Each hole guarantees some coins

### Cheat Code

- Talk to shopkeeper, enter "password"
- Requires 50+ coins + confirmation
- Unlocks Patrick Wong swap (free after unlock)

## UI & Mobile

### HUD (Phaser UI scene overlay)

- Top bar: "JHI GOLF QUEST", hearts, hole, par, strokes, coins
- Bottom center: status text
- Slingshot trajectory: dotted line via Phaser Graphics, real-time during drag

### Mobile Controls

- Rex Virtual Joystick plugin (left side)
- Two circular buttons (right): Jump (top), Hit (bottom)
- Hit activates slingshot mode, then drag on ball to aim
- Auto-detect mobile via `this.sys.game.device`

### Camera

- Follows player normally, follows ball in flight
- Range finder (hold Down): zoom out tween to show full course
- Phaser `camera.startFollow()` with lerp + `setZoom()` tweens

## Leaderboard

- Same Google Sheets integration as golf-adventure
- POST to Google Apps Script for submission
- GET top 10 scores
- Medals: Gold/Silver/Bronze for top 3
- Share: canvas-based score card image
- Patrick Wong disqualifies from submission

## Audio

- background-music.mp3: loop, 22.5% volume
- swing.mp3: on ball hit, 60% volume
- applause.wav: on hole complete, 100% volume
- Managed via Phaser sound manager (handles Web Audio / HTML5 fallback)

## Sprite Specifications

- **Characters:** 32x48 pixels, Owlboy-style pixel art
- **Enemies:** 48x48 pixels
- **Boss:** 128x128 pixels
- **Tiles:** 32x32 pixels
- **Animation frames:** 4-6 per action
- **Palette:** 16-24 colors per sprite, warm highlights, cool shadows
- All assets as PNG files in `assets/` folder, replaceable
