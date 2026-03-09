#!/usr/bin/env node
/**
 * generate-tilesets.js
 * Generates 4 tileset PNGs (meadow, desert, tundra, space) in Owlboy-inspired pixel art style.
 * Each tileset is a 16-tile-wide spritesheet of 32x32 pixel tiles.
 *
 * Usage: node golf-quest/tools/generate-tilesets.js
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const TILE = 32;
const COLS = 16;
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'tilesets');

// Ensure output directory exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ─── Utility helpers ───────────────────────────────────────────────

function px(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
}

function fillTile(ctx, col, row, color) {
    ctx.fillStyle = color;
    ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
}

function tileX(col) { return col * TILE; }
function tileY(row) { return row * TILE; }

/** Simple seeded random for reproducible art */
let seed = 42;
function srand() {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
}
function resetSeed(s) { seed = s || 42; }

/** Dither: randomly choose between two colors based on ratio */
function dither(ctx, x, y, c1, c2, ratio) {
    px(ctx, x, y, srand() < ratio ? c1 : c2);
}

/** Draw a jagged top edge for ground tiles. Returns height array (0-based from tile top). */
function jaggedTop(ctx, tx, ty, colors, baseHeight, variance) {
    const heights = [];
    for (let x = 0; x < TILE; x++) {
        const h = baseHeight + Math.floor(srand() * variance) - Math.floor(variance / 2);
        heights.push(Math.max(2, Math.min(TILE - 4, h)));
    }
    // Smooth once
    for (let i = 1; i < TILE - 1; i++) {
        heights[i] = Math.round((heights[i - 1] + heights[i] + heights[i + 1]) / 3);
    }
    return heights;
}

/** Fill body below jagged top with shading */
function fillBodyBelow(ctx, tx, ty, heights, shades) {
    for (let x = 0; x < TILE; x++) {
        const startY = heights[x];
        const depth = TILE - startY;
        for (let y = startY; y < TILE; y++) {
            const frac = (y - startY) / depth;
            let shade;
            if (frac < 0.3) shade = shades[0];
            else if (frac < 0.6) shade = shades[1];
            else if (frac < 0.85) shade = shades[2];
            else shade = shades[3] || shades[2];
            dither(ctx, tx + x, ty + y, shade, shades[Math.min(shades.length - 1, Math.floor(frac * shades.length))], 0.7);
        }
    }
}

/** Draw grass blades on top edge */
function drawGrassBlades(ctx, tx, ty, heights, tipColor, midColor) {
    for (let x = 0; x < TILE; x += 2 + Math.floor(srand() * 2)) {
        const baseY = heights[x];
        const bladeH = 2 + Math.floor(srand() * 3);
        for (let b = 0; b < bladeH; b++) {
            const by = baseY - b - 1;
            if (by >= 0) {
                px(ctx, tx + x, ty + by, b < bladeH / 2 ? tipColor : midColor);
            }
        }
    }
}

/** Draw a wave pattern for water surface */
function drawWaveSurface(ctx, tx, ty, colors) {
    const [deep, mid, light, highlight] = colors;
    fillTile(ctx, tx / TILE, ty / TILE, mid);
    // Wave crests
    for (let x = 0; x < TILE; x++) {
        const waveY = Math.floor(4 + Math.sin(x * 0.5) * 3);
        px(ctx, tx + x, ty + waveY, highlight);
        px(ctx, tx + x, ty + waveY + 1, light);
        if (waveY + 2 < TILE) px(ctx, tx + x, ty + waveY + 2, mid);
    }
    // Foam highlights
    for (let x = 0; x < TILE; x += 3) {
        const fy = 2 + Math.floor(srand() * 3);
        px(ctx, tx + x, ty + fy, highlight);
    }
}

/** Draw platform section */
function drawPlatform(ctx, tx, ty, topColor, bodyColor, shadowColor, edgeType) {
    // Body fill
    for (let y = 4; y < TILE - 2; y++) {
        for (let x = 0; x < TILE; x++) {
            dither(ctx, tx + x, ty + y, bodyColor, shadowColor, 0.7);
        }
    }
    // Top surface with highlight
    for (let x = 0; x < TILE; x++) {
        for (let y = 0; y < 4; y++) {
            px(ctx, tx + x, ty + y, y < 2 ? topColor : bodyColor);
        }
    }
    // Bottom shadow
    for (let x = 0; x < TILE; x++) {
        px(ctx, tx + x, ty + TILE - 1, shadowColor);
        px(ctx, tx + x, ty + TILE - 2, shadowColor);
    }
    // Edge caps
    if (edgeType === 'left') {
        for (let y = 0; y < TILE; y++) {
            px(ctx, tx, ty + y, shadowColor);
            px(ctx, tx + 1, ty + y, bodyColor);
        }
    } else if (edgeType === 'right') {
        for (let y = 0; y < TILE; y++) {
            px(ctx, tx + TILE - 1, ty + y, shadowColor);
            px(ctx, tx + TILE - 2, ty + y, bodyColor);
        }
    }
}

// ─── MEADOW TILESET ────────────────────────────────────────────────

function generateMeadow() {
    const ROWS = 2;
    const canvas = createCanvas(COLS * TILE, ROWS * TILE);
    const ctx = canvas.getContext('2d');
    resetSeed(101);

    const greens = ['#3a7d44', '#2d6a4f', '#40916c', '#69b578'];
    const darkGreen = '#1b4332';
    const lightGreen = '#95d5b2';
    const browns = ['#8B6914', '#6B4F12', '#5a3e0e', '#4a3009'];
    const wood = ['#A0522D', '#8B4513', '#6B3410', '#D2691E'];
    const waterColors = ['#1a759f', '#2196F3', '#64B5F6', '#E0F7FA'];

    // Row 0
    // Tile 0: grass top flat
    {
        const tx = tileX(0), ty = tileY(0);
        const h = jaggedTop(ctx, tx, ty, greens, 8, 4);
        fillBodyBelow(ctx, tx, ty, h, greens);
        drawGrassBlades(ctx, tx, ty, h, lightGreen, greens[3]);
    }

    // Tile 1: grass top left-slope
    {
        const tx = tileX(1), ty = tileY(0);
        const heights = [];
        for (let x = 0; x < TILE; x++) {
            heights.push(Math.max(2, Math.floor(TILE - 4 - (x / TILE) * 20) + Math.floor(srand() * 2)));
        }
        fillBodyBelow(ctx, tx, ty, heights, greens);
        drawGrassBlades(ctx, tx, ty, heights, lightGreen, greens[3]);
    }

    // Tile 2: grass top right-slope
    {
        const tx = tileX(2), ty = tileY(0);
        const heights = [];
        for (let x = 0; x < TILE; x++) {
            heights.push(Math.max(2, Math.floor(4 + (x / TILE) * 20) + Math.floor(srand() * 2)));
        }
        fillBodyBelow(ctx, tx, ty, heights, greens);
        drawGrassBlades(ctx, tx, ty, heights, lightGreen, greens[3]);
    }

    // Tile 3: grass body (solid)
    {
        const tx = tileX(3), ty = tileY(0);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                dither(ctx, tx + x, ty + y, greens[1], greens[2], 0.6);
            }
        }
    }

    // Tile 4: dirt fill
    {
        const tx = tileX(4), ty = tileY(0);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                dither(ctx, tx + x, ty + y, browns[0], browns[1], 0.6);
            }
        }
        // Pebble details
        for (let i = 0; i < 8; i++) {
            const px2 = Math.floor(srand() * 28) + 2;
            const py2 = Math.floor(srand() * 28) + 2;
            px(ctx, tx + px2, ty + py2, browns[2]);
        }
    }

    // Tile 5: dirt underground (darker)
    {
        const tx = tileX(5), ty = tileY(0);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                dither(ctx, tx + x, ty + y, browns[2], browns[3], 0.5);
            }
        }
    }

    // Tile 6: empty/transparent — leave blank

    // Tile 7-9: wooden platform left, middle, right
    drawPlatform(ctx, tileX(7), tileY(0), wood[3], wood[0], wood[2], 'left');
    drawPlatform(ctx, tileX(8), tileY(0), wood[3], wood[0], wood[2], 'middle');
    drawPlatform(ctx, tileX(9), tileY(0), wood[3], wood[0], wood[2], 'right');

    // Tile 10: flower1
    {
        const tx = tileX(10), ty = tileY(0);
        // Stem
        for (let y = 12; y < 28; y++) px(ctx, tx + 16, ty + y, '#2d6a4f');
        // Petals (red)
        const petalColor = '#E63946';
        const centerColor = '#FFD60A';
        for (let dx = -3; dx <= 3; dx++) {
            for (let dy = -3; dy <= 3; dy++) {
                if (dx * dx + dy * dy <= 10) {
                    px(ctx, tx + 16 + dx, ty + 10 + dy, petalColor);
                }
            }
        }
        px(ctx, tx + 16, ty + 10, centerColor);
        px(ctx, tx + 15, ty + 10, centerColor);
        px(ctx, tx + 16, ty + 9, centerColor);
        // Leaf
        px(ctx, tx + 17, ty + 18, '#40916c');
        px(ctx, tx + 18, ty + 19, '#40916c');
        px(ctx, tx + 19, ty + 18, '#40916c');
    }

    // Tile 11: flower2
    {
        const tx = tileX(11), ty = tileY(0);
        // Stem
        for (let y = 14; y < 28; y++) px(ctx, tx + 15, ty + y, '#2d6a4f');
        // Petals (blue)
        const petalColor = '#4895EF';
        const centerColor = '#FFD60A';
        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
                if (Math.abs(dx) + Math.abs(dy) <= 3) {
                    px(ctx, tx + 15 + dx, ty + 12 + dy, petalColor);
                }
            }
        }
        px(ctx, tx + 15, ty + 12, centerColor);
    }

    // Tile 12: tree trunk
    {
        const tx = tileX(12), ty = tileY(0);
        for (let y = 0; y < TILE; y++) {
            for (let x = 12; x < 20; x++) {
                const shade = x < 15 ? wood[2] : x < 17 ? wood[1] : wood[0];
                dither(ctx, tx + x, ty + y, shade, wood[1], 0.6);
            }
        }
        // Bark texture
        for (let i = 0; i < 6; i++) {
            const bx = 12 + Math.floor(srand() * 8);
            const by = Math.floor(srand() * 30) + 1;
            px(ctx, tx + bx, ty + by, wood[2]);
        }
    }

    // Tile 13: tree canopy
    {
        const tx = tileX(13), ty = tileY(0);
        for (let y = 2; y < 30; y++) {
            const halfW = Math.floor(14 * Math.sin((y / 30) * Math.PI));
            for (let x = 16 - halfW; x < 16 + halfW; x++) {
                if (x >= 0 && x < TILE) {
                    const edgeDist = Math.min(x - (16 - halfW), (16 + halfW) - x);
                    const shade = edgeDist < 2 ? darkGreen : (y < 15 ? greens[3] : greens[0]);
                    dither(ctx, tx + x, ty + y, shade, greens[1], 0.5 + srand() * 0.3);
                }
            }
        }
        // Light spots
        for (let i = 0; i < 12; i++) {
            const lx = 6 + Math.floor(srand() * 20);
            const ly = 4 + Math.floor(srand() * 22);
            px(ctx, tx + lx, ty + ly, lightGreen);
        }
    }

    // Tile 14: water surface
    drawWaveSurface(ctx, tileX(14), tileY(0), waterColors);

    // Tile 15: water body
    {
        const tx = tileX(15), ty = tileY(0);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                dither(ctx, tx + x, ty + y, waterColors[0], waterColors[1], 0.6);
            }
        }
        // Light caustics
        for (let i = 0; i < 10; i++) {
            const cx = Math.floor(srand() * 30) + 1;
            const cy = Math.floor(srand() * 30) + 1;
            px(ctx, tx + cx, ty + cy, waterColors[2]);
        }
    }

    // Row 1: variants
    // Tile 0: grass with flowers
    {
        const tx = tileX(0), ty = tileY(1);
        const h = jaggedTop(ctx, tx, ty, greens, 8, 4);
        fillBodyBelow(ctx, tx, ty, h, greens);
        drawGrassBlades(ctx, tx, ty, h, lightGreen, greens[3]);
        // Small flowers
        const flowerColors = ['#E63946', '#FFD60A', '#4895EF', '#FF6B6B'];
        for (let i = 0; i < 5; i++) {
            const fx = Math.floor(srand() * 28) + 2;
            const fy = h[fx] - 1 - Math.floor(srand() * 2);
            if (fy > 0) {
                px(ctx, tx + fx, ty + fy, flowerColors[Math.floor(srand() * flowerColors.length)]);
                px(ctx, tx + fx + 1, ty + fy, flowerColors[Math.floor(srand() * flowerColors.length)]);
            }
        }
    }

    // Tile 1: dirt top
    {
        const tx = tileX(1), ty = tileY(1);
        const h = jaggedTop(ctx, tx, ty, browns, 6, 3);
        fillBodyBelow(ctx, tx, ty, h, browns);
    }

    // Tile 2: dirt variant with stones
    {
        const tx = tileX(2), ty = tileY(1);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                dither(ctx, tx + x, ty + y, browns[0], browns[1], 0.5);
            }
        }
        // Embedded stones
        const stoneColor = '#808080';
        for (let i = 0; i < 4; i++) {
            const sx = Math.floor(srand() * 24) + 4;
            const sy = Math.floor(srand() * 24) + 4;
            for (let dx = -1; dx <= 1; dx++)
                for (let dy = -1; dy <= 1; dy++)
                    px(ctx, tx + sx + dx, ty + sy + dy, stoneColor);
        }
    }

    // Tile 3-5: more grass/dirt variants with dithering
    for (let t = 3; t < 6; t++) {
        const tx = tileX(t), ty = tileY(1);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                const c1 = t === 3 ? greens[2] : t === 4 ? browns[0] : greens[0];
                const c2 = t === 3 ? greens[0] : t === 4 ? browns[2] : browns[0];
                dither(ctx, tx + x, ty + y, c1, c2, 0.5);
            }
        }
    }

    // Fill remaining row 1 tiles with useful variants
    // Tile 6: grass-to-dirt transition
    {
        const tx = tileX(6), ty = tileY(1);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                const ratio = y / TILE;
                dither(ctx, tx + x, ty + y, greens[1], browns[0], 1 - ratio);
            }
        }
    }

    return { canvas, rows: ROWS, name: 'meadow' };
}

// ─── DESERT TILESET ────────────────────────────────────────────────

function generateDesert() {
    const ROWS = 2;
    const canvas = createCanvas(COLS * TILE, ROWS * TILE);
    const ctx = canvas.getContext('2d');
    resetSeed(202);

    const sands = ['#D4A76A', '#C2956A', '#E8C98A', '#B8960A'];
    const sandstones = ['#B8860B', '#8B7355', '#6B5335', '#4B3315'];
    const rockColors = ['#8B7355', '#6B5335', '#A09070', '#D2B48C'];
    const waterColors = ['#1a759f', '#2196F3', '#64B5F6', '#E0F7FA'];
    const cactusGreens = ['#2d6a4f', '#40916c', '#69b578', '#1b4332'];

    // Tile 0: sand top flat
    {
        const tx = tileX(0), ty = tileY(0);
        const h = jaggedTop(ctx, tx, ty, sands, 6, 3);
        fillBodyBelow(ctx, tx, ty, h, sands);
        // Wind ripple detail on top
        for (let x = 0; x < TILE; x += 4) {
            const ry = h[x] - 1;
            if (ry > 0) px(ctx, tx + x, ty + ry, sands[2]);
        }
    }

    // Tile 1: sand top left-slope
    {
        const tx = tileX(1), ty = tileY(0);
        const heights = [];
        for (let x = 0; x < TILE; x++) {
            heights.push(Math.max(2, Math.floor(TILE - 4 - (x / TILE) * 20) + Math.floor(srand() * 2)));
        }
        fillBodyBelow(ctx, tx, ty, heights, sands);
    }

    // Tile 2: sand top right-slope
    {
        const tx = tileX(2), ty = tileY(0);
        const heights = [];
        for (let x = 0; x < TILE; x++) {
            heights.push(Math.max(2, Math.floor(4 + (x / TILE) * 20) + Math.floor(srand() * 2)));
        }
        fillBodyBelow(ctx, tx, ty, heights, sands);
    }

    // Tile 3: sand body
    {
        const tx = tileX(3), ty = tileY(0);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                dither(ctx, tx + x, ty + y, sands[0], sands[1], 0.6);
            }
        }
    }

    // Tile 4: sandstone fill
    {
        const tx = tileX(4), ty = tileY(0);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                dither(ctx, tx + x, ty + y, sandstones[0], sandstones[1], 0.5);
            }
        }
        // Horizontal strata lines
        for (let y = 8; y < TILE; y += 8) {
            for (let x = 0; x < TILE; x++) {
                px(ctx, tx + x, ty + y, sandstones[2]);
            }
        }
    }

    // Tile 5: sandstone underground
    {
        const tx = tileX(5), ty = tileY(0);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                dither(ctx, tx + x, ty + y, sandstones[2], sandstones[3], 0.5);
            }
        }
    }

    // Tile 6: empty

    // Tile 7-9: rock platforms
    drawPlatform(ctx, tileX(7), tileY(0), rockColors[2], rockColors[0], rockColors[1], 'left');
    drawPlatform(ctx, tileX(8), tileY(0), rockColors[2], rockColors[0], rockColors[1], 'middle');
    drawPlatform(ctx, tileX(9), tileY(0), rockColors[2], rockColors[0], rockColors[1], 'right');

    // Tile 10: cactus1 (tall)
    {
        const tx = tileX(10), ty = tileY(0);
        // Main stem
        for (let y = 6; y < 30; y++) {
            for (let x = 13; x < 19; x++) {
                const shade = x < 15 ? cactusGreens[3] : x < 17 ? cactusGreens[0] : cactusGreens[1];
                px(ctx, tx + x, ty + y, shade);
            }
        }
        // Left arm
        for (let x = 8; x < 14; x++) px(ctx, tx + x, ty + 14, cactusGreens[0]);
        for (let y = 10; y < 15; y++) { px(ctx, tx + 8, ty + y, cactusGreens[0]); px(ctx, tx + 9, ty + y, cactusGreens[1]); }
        // Right arm
        for (let x = 18; x < 24; x++) px(ctx, tx + x, ty + 18, cactusGreens[0]);
        for (let y = 14; y < 19; y++) { px(ctx, tx + 23, ty + y, cactusGreens[0]); px(ctx, tx + 22, ty + y, cactusGreens[1]); }
        // Spines
        px(ctx, tx + 12, ty + 12, '#FFD60A');
        px(ctx, tx + 19, ty + 8, '#FFD60A');
        px(ctx, tx + 24, ty + 16, '#FFD60A');
    }

    // Tile 11: cactus2 (round barrel)
    {
        const tx = tileX(11), ty = tileY(0);
        for (let y = 10; y < 28; y++) {
            const halfW = Math.floor(9 * Math.sin(((y - 10) / 18) * Math.PI));
            for (let x = 16 - halfW; x < 16 + halfW; x++) {
                if (x >= 0 && x < TILE) {
                    const edgeDist = Math.min(x - (16 - halfW), (16 + halfW) - x);
                    const shade = edgeDist < 2 ? cactusGreens[3] : cactusGreens[0];
                    px(ctx, tx + x, ty + y, shade);
                }
            }
        }
        // Ridges
        for (let y = 10; y < 28; y++) {
            px(ctx, tx + 14, ty + y, cactusGreens[3]);
            px(ctx, tx + 18, ty + y, cactusGreens[3]);
        }
        // Flower on top
        px(ctx, tx + 15, ty + 9, '#FF6B6B');
        px(ctx, tx + 16, ty + 8, '#FF6B6B');
        px(ctx, tx + 17, ty + 9, '#FF6B6B');
        px(ctx, tx + 16, ty + 9, '#FFD60A');
    }

    // Tile 12: sand trap surface
    {
        const tx = tileX(12), ty = tileY(0);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                dither(ctx, tx + x, ty + y, '#E8C98A', '#D4A76A', 0.5);
            }
        }
        // Concentric depression rings
        for (let r = 4; r < 14; r += 3) {
            for (let a = 0; a < 64; a++) {
                const ax = Math.floor(16 + r * Math.cos(a * Math.PI / 32));
                const ay = Math.floor(16 + r * 0.6 * Math.sin(a * Math.PI / 32));
                if (ax >= 0 && ax < TILE && ay >= 0 && ay < TILE) {
                    px(ctx, tx + ax, ty + ay, sands[1]);
                }
            }
        }
    }

    // Tile 13: water surface
    drawWaveSurface(ctx, tileX(13), tileY(0), waterColors);

    // Tile 14: water body
    {
        const tx = tileX(14), ty = tileY(0);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                dither(ctx, tx + x, ty + y, waterColors[0], waterColors[1], 0.6);
            }
        }
    }

    // Row 1 variants
    // Sand dune variant
    {
        const tx = tileX(0), ty = tileY(1);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                const wave = Math.sin(x * 0.3 + y * 0.1) * 0.3;
                dither(ctx, tx + x, ty + y, sands[0], sands[2], 0.5 + wave);
            }
        }
    }

    // Cracked sandstone
    {
        const tx = tileX(1), ty = tileY(1);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                dither(ctx, tx + x, ty + y, sandstones[0], sandstones[1], 0.5);
            }
        }
        // Crack lines
        let cx = 5, cy = 2;
        for (let i = 0; i < 20; i++) {
            px(ctx, tx + cx, ty + cy, sandstones[3]);
            cx += Math.floor(srand() * 3) - 1;
            cy += 1 + Math.floor(srand() * 2);
            cx = Math.max(0, Math.min(TILE - 1, cx));
            if (cy >= TILE) break;
        }
    }

    return { canvas, rows: ROWS, name: 'desert' };
}

// ─── TUNDRA TILESET ────────────────────────────────────────────────

function generateTundra() {
    const ROWS = 2;
    const canvas = createCanvas(COLS * TILE, ROWS * TILE);
    const ctx = canvas.getContext('2d');
    resetSeed(303);

    const whites = ['#E8F4FD', '#D0E8F5', '#B0C4DE', '#87CEEB'];
    const stones = ['#708090', '#4A5568', '#3A4558', '#2A3548'];
    const iceBlue = ['#87CEEB', '#6BB5D6', '#4A9CC0', '#2E86AB'];
    const waterDark = ['#0D3B66', '#1a759f', '#2196F3', '#4FC3F7'];

    // Tile 0: snow top flat
    {
        const tx = tileX(0), ty = tileY(0);
        const h = jaggedTop(ctx, tx, ty, whites, 8, 5);
        fillBodyBelow(ctx, tx, ty, h, whites);
        // Sparkle highlights
        for (let i = 0; i < 8; i++) {
            const sx = Math.floor(srand() * TILE);
            const sy = h[sx] + Math.floor(srand() * 4);
            if (sy < TILE) px(ctx, tx + sx, ty + sy, '#FFFFFF');
        }
    }

    // Tile 1: snow top left-slope
    {
        const tx = tileX(1), ty = tileY(0);
        const heights = [];
        for (let x = 0; x < TILE; x++) {
            heights.push(Math.max(2, Math.floor(TILE - 4 - (x / TILE) * 20) + Math.floor(srand() * 2)));
        }
        fillBodyBelow(ctx, tx, ty, heights, whites);
    }

    // Tile 2: snow top right-slope
    {
        const tx = tileX(2), ty = tileY(0);
        const heights = [];
        for (let x = 0; x < TILE; x++) {
            heights.push(Math.max(2, Math.floor(4 + (x / TILE) * 20) + Math.floor(srand() * 2)));
        }
        fillBodyBelow(ctx, tx, ty, heights, whites);
    }

    // Tile 3: snow body
    {
        const tx = tileX(3), ty = tileY(0);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                dither(ctx, tx + x, ty + y, whites[0], whites[1], 0.6);
            }
        }
        // Snow texture dots
        for (let i = 0; i < 6; i++) {
            px(ctx, tx + Math.floor(srand() * TILE), ty + Math.floor(srand() * TILE), '#FFFFFF');
        }
    }

    // Tile 4: frozen ground
    {
        const tx = tileX(4), ty = tileY(0);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                dither(ctx, tx + x, ty + y, whites[2], stones[0], 0.5);
            }
        }
        // Ice crack details
        for (let i = 0; i < 3; i++) {
            let cx = Math.floor(srand() * TILE);
            let cy = Math.floor(srand() * TILE);
            for (let j = 0; j < 8; j++) {
                px(ctx, tx + cx, ty + cy, iceBlue[2]);
                cx += Math.floor(srand() * 3) - 1;
                cy += Math.floor(srand() * 3) - 1;
                cx = Math.max(0, Math.min(TILE - 1, cx));
                cy = Math.max(0, Math.min(TILE - 1, cy));
            }
        }
    }

    // Tile 5: stone underground
    {
        const tx = tileX(5), ty = tileY(0);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                dither(ctx, tx + x, ty + y, stones[1], stones[2], 0.5);
            }
        }
    }

    // Tile 6: empty

    // Tile 7-9: stone platforms
    drawPlatform(ctx, tileX(7), tileY(0), stones[0], stones[1], stones[2], 'left');
    drawPlatform(ctx, tileX(8), tileY(0), stones[0], stones[1], stones[2], 'middle');
    drawPlatform(ctx, tileX(9), tileY(0), stones[0], stones[1], stones[2], 'right');

    // Tile 10: icicle
    {
        const tx = tileX(10), ty = tileY(0);
        // Multiple icicles hanging from top
        const starts = [6, 12, 16, 22, 28];
        starts.forEach(sx => {
            const len = 10 + Math.floor(srand() * 14);
            for (let y = 0; y < len; y++) {
                const width = Math.max(1, Math.floor((1 - y / len) * 3));
                for (let dx = -width; dx <= width; dx++) {
                    const px2 = sx + dx;
                    if (px2 >= 0 && px2 < TILE) {
                        const shade = dx === 0 ? iceBlue[3] : iceBlue[1];
                        px(ctx, tx + px2, ty + y, shade);
                    }
                }
            }
            // Highlight
            px(ctx, tx + sx, ty + 0, '#FFFFFF');
            px(ctx, tx + sx, ty + 1, '#E0F7FA');
        });
    }

    // Tile 11: frozen bush
    {
        const tx = tileX(11), ty = tileY(0);
        for (let y = 8; y < 28; y++) {
            const halfW = Math.floor(10 * Math.sin(((y - 8) / 20) * Math.PI));
            for (let x = 16 - halfW; x < 16 + halfW; x++) {
                if (x >= 0 && x < TILE) {
                    const c = srand() > 0.5 ? whites[2] : iceBlue[0];
                    px(ctx, tx + x, ty + y, c);
                }
            }
        }
        // Trunk
        for (let y = 22; y < 30; y++) {
            px(ctx, tx + 15, ty + y, stones[1]);
            px(ctx, tx + 16, ty + y, stones[0]);
        }
        // Frost sparkles
        for (let i = 0; i < 6; i++) {
            px(ctx, tx + 10 + Math.floor(srand() * 12), ty + 10 + Math.floor(srand() * 14), '#FFFFFF');
        }
    }

    // Tile 12: ice surface
    {
        const tx = tileX(12), ty = tileY(0);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                dither(ctx, tx + x, ty + y, iceBlue[0], iceBlue[1], 0.6);
            }
        }
        // Reflection streaks
        for (let i = 0; i < 5; i++) {
            const sx = Math.floor(srand() * 24) + 4;
            const sy = Math.floor(srand() * TILE);
            for (let dx = 0; dx < 4; dx++) {
                if (sx + dx < TILE) px(ctx, tx + sx + dx, ty + sy, '#FFFFFF');
            }
        }
    }

    // Tile 13: water surface (dark)
    {
        const tx = tileX(13), ty = tileY(0);
        ctx.fillStyle = waterDark[1];
        ctx.fillRect(tx, ty, TILE, TILE);
        for (let x = 0; x < TILE; x++) {
            const waveY = Math.floor(5 + Math.sin(x * 0.4) * 3);
            px(ctx, tx + x, ty + waveY, waterDark[3]);
            px(ctx, tx + x, ty + waveY + 1, waterDark[2]);
        }
    }

    // Tile 14: water body (dark)
    {
        const tx = tileX(14), ty = tileY(0);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                dither(ctx, tx + x, ty + y, waterDark[0], waterDark[1], 0.6);
            }
        }
    }

    // Row 1: variants
    {
        // Snowy rock
        const tx = tileX(0), ty = tileY(1);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                const ratio = y / TILE;
                dither(ctx, tx + x, ty + y, whites[0], stones[0], ratio);
            }
        }
    }
    {
        // Frozen ground variant
        const tx = tileX(1), ty = tileY(1);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                dither(ctx, tx + x, ty + y, iceBlue[0], whites[2], 0.5);
            }
        }
    }

    return { canvas, rows: ROWS, name: 'tundra' };
}

// ─── SPACE TILESET ─────────────────────────────────────────────────

function generateSpace() {
    const ROWS = 2;
    const canvas = createCanvas(COLS * TILE, ROWS * TILE);
    const ctx = canvas.getContext('2d');
    resetSeed(404);

    const grays = ['#A0A0A0', '#808080', '#606060', '#404040'];
    const metalBlue = ['#4A6FA5', '#5B7FBA', '#3A5F95', '#2A4F85'];
    const darkBg = '#0A0A1A';

    // Tile 0: lunar regolith top flat
    {
        const tx = tileX(0), ty = tileY(0);
        const h = jaggedTop(ctx, tx, ty, grays, 8, 4);
        fillBodyBelow(ctx, tx, ty, h, grays);
        // Micro-crater pits
        for (let i = 0; i < 4; i++) {
            const cx2 = Math.floor(srand() * 24) + 4;
            const cy2 = h[cx2] + 2 + Math.floor(srand() * 6);
            if (cy2 < TILE) {
                px(ctx, tx + cx2, ty + cy2, grays[3]);
                px(ctx, tx + cx2 + 1, ty + cy2, grays[2]);
            }
        }
    }

    // Tile 1: regolith top left-slope
    {
        const tx = tileX(1), ty = tileY(0);
        const heights = [];
        for (let x = 0; x < TILE; x++) {
            heights.push(Math.max(2, Math.floor(TILE - 4 - (x / TILE) * 20) + Math.floor(srand() * 2)));
        }
        fillBodyBelow(ctx, tx, ty, heights, grays);
    }

    // Tile 2: regolith top right-slope
    {
        const tx = tileX(2), ty = tileY(0);
        const heights = [];
        for (let x = 0; x < TILE; x++) {
            heights.push(Math.max(2, Math.floor(4 + (x / TILE) * 20) + Math.floor(srand() * 2)));
        }
        fillBodyBelow(ctx, tx, ty, heights, grays);
    }

    // Tile 3: moon rock body
    {
        const tx = tileX(3), ty = tileY(0);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                dither(ctx, tx + x, ty + y, grays[1], grays[2], 0.5);
            }
        }
    }

    // Tile 4: crater fill
    {
        const tx = tileX(4), ty = tileY(0);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                dither(ctx, tx + x, ty + y, grays[2], grays[3], 0.5);
            }
        }
        // Crater rim highlight
        for (let a = 0; a < 64; a++) {
            const ax = Math.floor(16 + 10 * Math.cos(a * Math.PI / 32));
            const ay = Math.floor(16 + 10 * Math.sin(a * Math.PI / 32));
            if (ax >= 0 && ax < TILE && ay >= 0 && ay < TILE) {
                px(ctx, tx + ax, ty + ay, grays[0]);
            }
        }
    }

    // Tile 5: deep rock
    {
        const tx = tileX(5), ty = tileY(0);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                dither(ctx, tx + x, ty + y, grays[3], '#202020', 0.6);
            }
        }
    }

    // Tile 6: empty

    // Tile 7-9: metal platforms
    drawPlatform(ctx, tileX(7), tileY(0), metalBlue[1], metalBlue[0], metalBlue[2], 'left');
    // Add rivets to metal platforms
    {
        const tx = tileX(7), ty = tileY(0);
        px(ctx, tx + 4, ty + 6, metalBlue[1]);
        px(ctx, tx + 4, ty + TILE - 6, metalBlue[1]);
    }
    drawPlatform(ctx, tileX(8), tileY(0), metalBlue[1], metalBlue[0], metalBlue[2], 'middle');
    {
        const tx = tileX(8), ty = tileY(0);
        // Rivet line across middle platform
        for (let x = 4; x < TILE; x += 6) {
            px(ctx, tx + x, ty + 6, metalBlue[1]);
            px(ctx, tx + x, ty + TILE - 6, metalBlue[1]);
        }
    }
    drawPlatform(ctx, tileX(9), tileY(0), metalBlue[1], metalBlue[0], metalBlue[2], 'right');
    {
        const tx = tileX(9), ty = tileY(0);
        px(ctx, tx + TILE - 5, ty + 6, metalBlue[1]);
        px(ctx, tx + TILE - 5, ty + TILE - 6, metalBlue[1]);
    }

    // Tile 10: small rock
    {
        const tx = tileX(10), ty = tileY(0);
        for (let y = 16; y < 28; y++) {
            const halfW = Math.floor(8 * Math.sin(((y - 16) / 12) * Math.PI));
            for (let x = 16 - halfW; x < 16 + halfW; x++) {
                if (x >= 0 && x < TILE) {
                    const edgeDist = Math.min(x - (16 - halfW), (16 + halfW) - x);
                    const shade = edgeDist < 2 ? grays[3] : (y < 22 ? grays[0] : grays[1]);
                    px(ctx, tx + x, ty + y, shade);
                }
            }
        }
        // Highlight
        px(ctx, tx + 14, ty + 18, '#C0C0C0');
        px(ctx, tx + 15, ty + 17, '#C0C0C0');
    }

    // Tile 11: antenna
    {
        const tx = tileX(11), ty = tileY(0);
        // Base
        for (let x = 12; x < 20; x++) {
            for (let y = 26; y < 30; y++) {
                px(ctx, tx + x, ty + y, metalBlue[0]);
            }
        }
        // Pole
        for (let y = 4; y < 27; y++) {
            px(ctx, tx + 15, ty + y, metalBlue[0]);
            px(ctx, tx + 16, ty + y, metalBlue[1]);
        }
        // Dish
        for (let y = 4; y < 12; y++) {
            const w = Math.floor((y - 4) * 1.2);
            for (let dx = -w; dx <= w; dx++) {
                const ax = 16 + dx;
                if (ax >= 0 && ax < TILE) {
                    px(ctx, tx + ax, ty + y, dx < 0 ? metalBlue[2] : metalBlue[1]);
                }
            }
        }
        // Blinking light at top
        px(ctx, tx + 15, ty + 3, '#FF0000');
        px(ctx, tx + 16, ty + 3, '#FF4444');
    }

    // Tile 12: crater detail
    {
        const tx = tileX(12), ty = tileY(0);
        ctx.fillStyle = grays[2];
        ctx.fillRect(tx, ty, TILE, TILE);
        // Crater bowl
        for (let y = 4; y < 28; y++) {
            const halfW = Math.floor(12 * Math.sin(((y - 4) / 24) * Math.PI));
            for (let x = 16 - halfW; x < 16 + halfW; x++) {
                if (x >= 0 && x < TILE) {
                    const depth = Math.abs(y - 16) / 12;
                    const shade = depth < 0.3 ? grays[3] : grays[2];
                    px(ctx, tx + x, ty + y, shade);
                }
            }
        }
        // Rim highlight
        for (let a = 0; a < 64; a++) {
            const ax = Math.floor(16 + 12 * Math.cos(a * Math.PI / 32));
            const ay = Math.floor(16 + 12 * Math.sin(a * Math.PI / 32));
            if (ax >= 0 && ax < TILE && ay >= 0 && ay < TILE && ay < 16) {
                px(ctx, tx + ax, ty + ay, grays[0]);
            }
        }
    }

    // Row 1: starfield background variant, more rocks
    {
        const tx = tileX(0), ty = tileY(1);
        ctx.fillStyle = darkBg;
        ctx.fillRect(tx, ty, TILE, TILE);
        // Stars
        for (let i = 0; i < 12; i++) {
            const sx = Math.floor(srand() * TILE);
            const sy = Math.floor(srand() * TILE);
            const brightness = srand() > 0.7 ? '#FFFFFF' : '#AAAAAA';
            px(ctx, tx + sx, ty + sy, brightness);
        }
    }
    {
        // Nebula bg variant
        const tx = tileX(1), ty = tileY(1);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                const dist = Math.sqrt((x - 16) * (x - 16) + (y - 16) * (y - 16));
                if (dist < 14) {
                    dither(ctx, tx + x, ty + y, '#1A0A2E', '#2D1B69', 0.5 + dist / 28);
                } else {
                    px(ctx, tx + x, ty + y, darkBg);
                }
            }
        }
        // Stars
        for (let i = 0; i < 6; i++) {
            px(ctx, tx + Math.floor(srand() * TILE), ty + Math.floor(srand() * TILE), '#FFFFFF');
        }
    }

    return { canvas, rows: ROWS, name: 'space' };
}

// ─── MAIN ──────────────────────────────────────────────────────────

function saveTileset({ canvas, rows, name }) {
    const pngPath = path.join(OUTPUT_DIR, `${name}.png`);
    const buf = canvas.toBuffer('image/png');
    fs.writeFileSync(pngPath, buf);
    console.log(`  Wrote ${pngPath} (${buf.length} bytes)`);

    // Tiled-compatible JSON
    const json = {
        columns: COLS,
        image: `${name}.png`,
        imageheight: rows * TILE,
        imagewidth: COLS * TILE,
        margin: 0,
        name: name,
        spacing: 0,
        tilecount: rows * COLS,
        tileheight: TILE,
        tilewidth: TILE
    };
    const jsonPath = path.join(OUTPUT_DIR, `${name}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(json, null, 4) + '\n');
    console.log(`  Wrote ${jsonPath}`);
}

console.log('Generating tilesets...');
saveTileset(generateMeadow());
saveTileset(generateDesert());
saveTileset(generateTundra());
saveTileset(generateSpace());
console.log('Done!');
