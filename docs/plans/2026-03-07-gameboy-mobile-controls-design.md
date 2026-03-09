# Gameboy-Style Mobile Controls Design

## Overview

Replace the existing mobile button row with a Gameboy-inspired controller overlay for touch devices. JHI green and gold color scheme.

## Layout

Fixed to bottom of screen, overlaying the game. Semi-transparent dark green background panel with rounded corners. ~25-30% of screen height, ~80% opacity.

**Left side:** D-pad (cross shape)
- Up: jump
- Down: crouch (lowers hitbox ~40%, player squishes visually, cannot move while crouching)
- Left: move left
- Right: move right

**Right side:** Two circular buttons in diagonal layout (classic Gameboy arrangement)
- A (upper-right): jump (same as Up)
- B (lower-left): hit ball (triggers handleMobileHit())

## Styling

- Body: dark green (#1a472a)
- Button faces: gold (#c9a84c)
- Borders: subtle gold
- Active state: brighter gold highlight when pressed
- Labels: dark text on gold buttons

## Crouch Mechanic

- Down D-pad sets `crouching` flag
- Player hitbox height reduces from 50 to 30
- Player visually squishes down
- Cannot move left/right while crouching
- Releases when D-pad down is released

## Replaces

The existing `.mobile-controls` div (LEFT, JUMP, HIT, RIGHT buttons) is completely replaced by the Gameboy layout on touch devices. Desktop keyboard controls unchanged.
