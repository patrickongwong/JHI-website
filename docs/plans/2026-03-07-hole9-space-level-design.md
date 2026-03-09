# Hole 9 — Space Level Design

## Overview

Add a 9th and final hole to golf-adventure.html set in outer space. Includes a Boss fight, space transition cinematic, ending cinematic, score sharing, and desktop control changes.

## Theme & Environment

- **Space setting** — lunar rock terrain, gray/silver palette, no grass/dirt
- **Massive Earth** in background (Earthrise-from-moon scale, close orbit), blue oceans, landmasses, white clouds
- **Dense starfield** with twinkling and varied star sizes, deep black sky
- **No sun/moon**, no wind
- **Reduced gravity** — GRAVITY * 0.65
- **4-6 floating asteroids** drifting in sine-wave paths, ball bounces off them, each with independent speed/direction

## Course Layout

- **Par:** 5
- **Terrain:** Lunar rock, longer course with craters/ridges
- **No water hazards or sand traps** (space)
- **Floating rock platforms** for traversal
- **Hole position:** Far right, guarded by Boss
- **2-3 regular sand baggers** (HP 4-5) in early/mid sections

## Space Transition Cinematic (~8s, after Hole 8 shop)

1. **Rumble phase** (~2s): Screen shakes, cracks in terrain, sky darkens
2. **Launch phase** (~3s): Course chunk breaks free, launches upward, clouds rush past
3. **Space transition** (~2s): Atmosphere fades to black, stars fade in, Earth appears and stabilizes at moon-orbit distance
4. **Landing phase** (~1s): Camera reveals lunar course, player lands, text: "HOLE 9 — THE FINAL FRONTIER"

Non-interactive. Skip button available.

## Frightened Character (Hole 9 only)

- Shrunken pupils, wide eyes visible all around
- Open "O" mouth
- Rapid 1-2px trembling jitter
- Animated sweat drops flying off
- Knocking knees / wobble even when standing still

## Boss — "The Sand King"

**Approach:** Gate Guardian — Boss blocks the hole, must be defeated before the ball can reach the cup.

**Appearance:**
- 2x size of regular sand baggers
- Glowing red pulsing eyes with red aura/particle trail
- Darker sand color with slight red tint
- Crown-like elaborate tied top

**Stats:**
- HP: 20
- Stationary near the hole
- Ball bounces back on hit (deals damage but deflects)

**Attack Patterns (cycles between 3):**
1. **Sand Barrage** — 3 projectiles in fan spread, longer range, 2 damage each
2. **Ground Slam** — Jumps and slams, shockwave along terrain both directions, 2 damage, knocks ball away. Player must jump to avoid.
3. **Boulder Throw** — Large slow-moving rock, arcs toward player, 3 damage, 1-second telegraphed wind-up

**Death:** Massive particle burst explosion, clears path to hole.

## Ending Cinematic (~10s, after Hole 9 completion)

1. **Victory pose** (~2s): Character celebrates, fist pump
2. **Spaceship arrival** (~2s): Rocket descends and lands, door opens
3. **Liftoff** (~2s): Character boards, ship launches toward Earth
4. **Home scene** (~3s): Cozy living room, character on couch with pizza, TV showing golf channel, relaxed expression. Text: "Home Sweet Home"
5. **Fade to score screen** (~1s)

Skip button available.

## Score Sharing Screen

- **Green and gold** color scheme (matching JHI website)
- Full 9-hole scorecard: par, strokes, +/- per hole
- Total score prominently displayed
- "Share Score" button — generates styled green & gold image card
- "Play Again" button

## Desktop Control Change

- **JJ (normal character):** Remove mouse drag aiming. Replace with spacebar-triggered mobile-style hit mechanic:
  - 1st press: starts angle rotation indicator
  - 2nd press: locks angle, power bar begins filling
  - 3rd press: locks power, ball is hit
- **Patrick Wong:** Retains cursor-based psychic control (unchanged)
