# Golf Adventure Equipment System Design

## Overview

Add an equipment/upgrade shop, combat system, and two new storm levels to the golf adventure game. Players earn coins based on hole performance, spend them in an interactive pro shop between rounds, and face Sand Bagger enemies on night/storm levels.

## Currency

Coins earned after each hole based on score:
- Hole-in-one: 5 coins
- Eagle: 4 coins
- Birdie: 3 coins
- Par: 2 coins
- Bogey: 1 coin
- Worse: 0 coins

Coins persist across runs via localStorage.

## Equipment Upgrades

### Clubs (+ Power)

Affects hit power multiplier and damage to Sand Baggers.

| Tier | Name    | Power | Damage | Cost    |
|------|---------|-------|--------|---------|
| 0    | Copper  | 1.0x  | 1      | Free    |
| 1    | Silver  | 1.2x  | 2      | 3 coins |
| 2    | Steel   | 1.4x  | 3      | 5 coins |
| 3    | Gold    | 1.7x  | 4      | 8 coins |
| 4    | Diamond | 2.0x  | 5      | 12 coins|

### Shaft (+ Control)

Single upgrade. Visual: pink colored shaft.

| Tier | Name              | Effect                              | Cost    |
|------|-------------------|-------------------------------------|---------|
| 0    | Standard          | None                                | Free    |
| 1    | Autoflex (pink)   | Shows ~25% of trajectory preview    | 6 coins |

### Boots (+ Jump)

| Tier | Name               | Effect           | Cost     |
|------|--------------------|------------------|----------|
| 0    | Standard           | Single jump      | Free     |
| 1    | Double-Jump Boots  | 2 jumps          | 4 coins  |
| 2    | Triple-Jump Boots  | 3 jumps          | 7 coins  |
| 3    | Flying Boots       | Unlimited jumps, white wings visual | 12 coins |

### Polo Shirts (+ Health)

| Tier | Name             | Look                              | Hearts | Cost     |
|------|------------------|-----------------------------------|--------|----------|
| 0    | Plain White      | Simple white polo                 | 2      | Free     |
| 1    | Navy Polo        | Current character shirt design    | 3      | 3 coins  |
| 2    | Striped Polo     | Navy/white stripes                | 4      | 5 coins  |
| 3    | Gold-Trimmed     | Gold accents                      | 5      | 8 coins  |
| 4    | Diamond Argyle   | Flashy argyle pattern             | 6      | 12 coins |

Total cost of all upgrades: 85 coins. Requires 2-3 playthroughs to max everything.

## Pro Shop (Between Rounds)

Full-canvas interactive scene. Indoor room with wooden floor, back wall with shelves, and a counter. Four item pedestals spread across the floor:

- Clubs (left) — labeled "+ Power"
- Shaft (center-left) — pink item, labeled "+ Control"
- Boots (center-right) — labeled "+ Jump"
- Polo Shirts (right) — labeled "+ Health"

Each pedestal shows the next available upgrade, its cost, and the label. Player walks left/right with same controls, presses up near a pedestal to buy. If they can't afford it: "Not enough coins." Items at max tier show "MAXED."

Coin balance displayed in top-right. "Continue" sign on far right exits to next hole.

## Combat System

### Sand Baggers

Sandbag-shaped enemies (pun on "sandbagger") that appear on night and storm levels (holes 5-8).

**Appearance:**
- Brown/tan sandbag body with tied-off top, simple shuffling legs
- Night versions (holes 5-6): normal eyes
- Storm versions (holes 7-8): red glowing eyes, slightly larger

**Behavior:**
- Patrol back and forth on their terrain segment
- When player is within ~1/4 level width, stop and throw sand projectile at player
- Cooldown: ~2-3 seconds between throws
- Storm Sand Baggers move ~1.5x faster

**Sand Projectile:**
- Small brown blob that arcs toward the player
- Night: 1 heart damage
- Storm: 2 hearts damage

**Defeating Sand Baggers:**
- Hit them with the golf ball. Damage = club tier (Copper=1, Silver=2, etc.)
- Night Sand Bagger HP: 2-3
- Storm Sand Bagger HP: 4-5
- Death effect: sandbag bursts with sand particle explosion
- Ball loses some momentum on hit but continues

### Player Health

- Start with 2 hearts (upgradeable via polo shirts up to 6)
- Damage sources: sand projectile hits, falling off cliffs (1 heart)
- Hit: player flashes with ~1.5s invincibility frames
- 0 hearts: hole resets, +1 stroke penalty, health refills

## Levels 7-8 (Storm)

### Hole 7 — The Ridge (Par 4)
- Series of narrow ridges with drops between them
- Wind blowing left-to-right
- 2 Storm Sand Baggers patrolling ridges
- Water hazard in one gap

### Hole 8 — The Gauntlet (Par 5)
- Long level with elevation changes, platforms, sand trap, water
- 3 Storm Sand Baggers spread across level
- Wind direction randomized at hole start
- Most challenging level

### Storm Weather Effects
- **Rain:** Diagonal animated streaks, angle matches wind direction
- **Thunder:** Lightning flashes every 5-10 seconds (white overlay + subtle screen shake)
- **Wind:** Constant horizontal force on ball while airborne. Visual: rain angle, grass bending harder, wind arrow indicator in HUD
- **Sky:** Darker than night, storm clouds, no moon visible

## HUD Changes

- **Hearts** — Top-left, row of heart icons
- **Coins** — Top-right, coin icon + count
- **Wind indicator** (storm levels only) — Arrow near top-center showing direction/strength
- **Club indicator** — Small label near stroke counter showing current club tier

## Game Flow Change

After hole complete overlay: "Go to Shop" button -> Pro Shop scene -> "Continue" sign -> Next hole
