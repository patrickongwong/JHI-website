#!/usr/bin/env node
/**
 * generate-desert-tilemaps.js
 * Generates Tiled-format JSON tilemap files for holes 4-6 (Desert theme).
 *
 * Desert Tile IDs (firstgid=1):
 *   1: sand top flat       2: sand top left-slope   3: sand top right-slope
 *   4: sand body            5: sandstone fill        6: sandstone underground
 *   7: empty (use 0)        8: rock platform left    9: rock platform middle
 *  10: rock platform right 11: cactus1              12: cactus2
 *  13: sand trap surface   14: water surface         15: water body
 *
 * Usage: node golf-quest/tools/generate-desert-tilemaps.js
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'tilemaps');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const TILE = 32;

// Tile IDs
const SAND_TOP   = 1;
const SAND_LSLOPE = 2;
const SAND_RSLOPE = 3;
const SAND_BODY  = 4;
const SANDSTONE  = 5;
const SANDSTONE_DEEP = 6;
const EMPTY      = 0;
const ROCK_L     = 8;
const ROCK_M     = 9;
const ROCK_R     = 10;
const CACTUS1    = 11;
const CACTUS2    = 12;
const SAND_TRAP  = 13;
const WATER_SURF = 14;
const WATER_BODY = 15;

/**
 * Build a Tiled-format tilemap JSON.
 */
function buildTilemap({ width, height, groundData, platformData, decorationData, hazards, spawns, enemies }) {
    const tilewidth = TILE;
    const tileheight = TILE;

    return {
        compressionlevel: -1,
        height,
        infinite: false,
        layers: [
            {
                data: groundData,
                height,
                id: 1,
                name: "ground",
                opacity: 1,
                type: "tilelayer",
                visible: true,
                width,
                x: 0,
                y: 0
            },
            {
                data: platformData,
                height,
                id: 2,
                name: "platforms",
                opacity: 1,
                type: "tilelayer",
                visible: true,
                width,
                x: 0,
                y: 0
            },
            {
                data: decorationData,
                height,
                id: 3,
                name: "decorations",
                opacity: 1,
                type: "tilelayer",
                visible: true,
                width,
                x: 0,
                y: 0
            },
            {
                draworder: "topdown",
                id: 4,
                name: "hazards",
                objects: hazards,
                opacity: 1,
                type: "objectgroup",
                visible: true,
                x: 0,
                y: 0
            },
            {
                draworder: "topdown",
                id: 5,
                name: "spawns",
                objects: spawns,
                opacity: 1,
                type: "objectgroup",
                visible: true,
                x: 0,
                y: 0
            },
            {
                draworder: "topdown",
                id: 6,
                name: "enemies",
                objects: enemies,
                opacity: 1,
                type: "objectgroup",
                visible: true,
                x: 0,
                y: 0
            }
        ],
        nextlayerid: 7,
        nextobjectid: hazards.length + spawns.length + enemies.length + 1,
        orientation: "orthogonal",
        renderorder: "right-down",
        tiledversion: "1.10.2",
        tileheight,
        tilesets: [
            {
                firstgid: 1,
                source: "../tilesets/desert.json"
            }
        ],
        tilewidth,
        type: "map",
        version: "1.10",
        width
    };
}

/** Create a zero-filled tile array */
function emptyLayer(w, h) {
    return new Array(w * h).fill(0);
}

/** Set a tile in the data array */
function setTile(data, w, col, row, tileId) {
    if (col >= 0 && col < w && row >= 0) {
        data[row * w + col] = tileId;
    }
}

/** Fill a horizontal span of tiles in data */
function fillRow(data, w, row, colStart, colEnd, tileId) {
    for (let c = colStart; c <= colEnd; c++) {
        setTile(data, w, c, row, tileId);
    }
}

/** Fill a rectangular region */
function fillRect(data, w, colStart, colEnd, rowStart, rowEnd, tileId) {
    for (let r = rowStart; r <= rowEnd; r++) {
        fillRow(data, w, r, colStart, colEnd, tileId);
    }
}

// ─── HOLE 4 ───────────────────────────────────────────────────────
// Par 3, Desert Afternoon, Elevated Green
// Width: 60 tiles, Height: 19 tiles
// Left flat at row 15, right elevated at row 10, slopes between
function generateHole4() {
    const W = 60, H = 19;
    const ground = emptyLayer(W, H);
    const platforms = emptyLayer(W, H);
    const decorations = emptyLayer(W, H);

    // Left flat terrain: cols 0-30, surface at row 15
    fillRow(ground, W, 15, 0, 30, SAND_TOP);
    fillRect(ground, W, 0, 30, 16, 17, SAND_BODY);
    fillRect(ground, W, 0, 30, 18, 18, SANDSTONE);

    // Slope transition: cols 31-40, rising from row 15 to row 10
    // Gradual slope using left-slope tiles
    const slopeStart = 31;
    const slopeEnd = 40;
    for (let c = slopeStart; c <= slopeEnd; c++) {
        const progress = (c - slopeStart) / (slopeEnd - slopeStart);
        const surfaceRow = Math.round(15 - progress * 5); // 15 down to 10
        setTile(ground, W, c, surfaceRow, SAND_LSLOPE);
        // Fill below with body/sandstone
        for (let r = surfaceRow + 1; r <= 17; r++) {
            setTile(ground, W, c, r, SAND_BODY);
        }
        setTile(ground, W, c, 18, SANDSTONE);
    }

    // Right elevated terrain: cols 41-59, surface at row 10
    fillRow(ground, W, 10, 41, 59, SAND_TOP);
    fillRect(ground, W, 41, 59, 11, 17, SAND_BODY);
    fillRect(ground, W, 41, 59, 18, 18, SANDSTONE);

    // Rock platforms as stepping stones (3 platforms)
    // Platform 1: row 13, cols 18-22
    setTile(platforms, W, 18, 13, ROCK_L);
    fillRow(platforms, W, 13, 19, 21, ROCK_M);
    setTile(platforms, W, 22, 13, ROCK_R);

    // Platform 2: row 11, cols 28-31
    setTile(platforms, W, 28, 11, ROCK_L);
    fillRow(platforms, W, 11, 29, 30, ROCK_M);
    setTile(platforms, W, 31, 11, ROCK_R);

    // Platform 3: row 9, cols 36-39
    setTile(platforms, W, 36, 9, ROCK_L);
    fillRow(platforms, W, 9, 37, 38, ROCK_M);
    setTile(platforms, W, 39, 9, ROCK_R);

    // Decorations: cacti on left flat section
    setTile(decorations, W, 5, 14, CACTUS1);
    setTile(decorations, W, 12, 14, CACTUS2);
    setTile(decorations, W, 25, 14, CACTUS1);
    // Cactus on elevated section
    setTile(decorations, W, 50, 9, CACTUS2);

    // Sand trap near hole (on elevated section)
    fillRow(ground, W, 10, 52, 56, SAND_TRAP);

    // Hazards
    const hazards = [
        {
            id: 1,
            name: "sand",
            type: "sand",
            x: 52 * TILE,
            y: 10 * TILE,
            width: 5 * TILE,
            height: 1 * TILE,
            rotation: 0,
            visible: true
        }
    ];

    // Spawns
    const spawns = [
        { id: 2, name: "playerSpawn", type: "playerSpawn", x: 64, y: 448, width: 0, height: 0, rotation: 0, visible: true },
        { id: 3, name: "ballSpawn", type: "ballSpawn", x: 128, y: 460, width: 0, height: 0, rotation: 0, visible: true },
        { id: 4, name: "holePosition", type: "holePosition", x: 1750, y: 296, width: 0, height: 0, rotation: 0, visible: true }
    ];

    return buildTilemap({
        width: W, height: H,
        groundData: ground,
        platformData: platforms,
        decorationData: decorations,
        hazards, spawns, enemies: []
    });
}

// ─── HOLE 5 ───────────────────────────────────────────────────────
// Par 4, Desert Sunset, Multi-platform
// Width: 80 tiles, Height: 19 tiles
// Left terrain (0-20, row 15), water gap (21-30), middle section, gap, right terrain (60-79, row 14)
function generateHole5() {
    const W = 80, H = 19;
    const ground = emptyLayer(W, H);
    const platforms = emptyLayer(W, H);
    const decorations = emptyLayer(W, H);

    // Left terrain section: cols 0-20, surface at row 15
    fillRow(ground, W, 15, 0, 20, SAND_TOP);
    fillRect(ground, W, 0, 20, 16, 17, SAND_BODY);
    fillRect(ground, W, 0, 20, 18, 18, SANDSTONE);

    // Water hazard: cols 21-30
    fillRow(ground, W, 15, 21, 30, WATER_SURF);
    fillRect(ground, W, 21, 30, 16, 17, WATER_BODY);
    fillRect(ground, W, 21, 30, 18, 18, SANDSTONE_DEEP);

    // Middle terrain section: cols 31-50, surface at row 14
    // Left edge slope up
    setTile(ground, W, 31, 15, SAND_LSLOPE);
    fillRect(ground, W, 31, 31, 16, 17, SAND_BODY);
    setTile(ground, W, 31, 18, SANDSTONE);

    fillRow(ground, W, 14, 32, 50, SAND_TOP);
    fillRect(ground, W, 32, 50, 15, 17, SAND_BODY);
    fillRect(ground, W, 32, 50, 18, 18, SANDSTONE);

    // Gap: cols 51-59 (empty)

    // Right terrain section: cols 60-79, surface at row 14
    fillRow(ground, W, 14, 60, 79, SAND_TOP);
    fillRect(ground, W, 60, 79, 15, 17, SAND_BODY);
    fillRect(ground, W, 60, 79, 18, 18, SANDSTONE);

    // Rock platforms bridging gaps
    // Over water: row 13, cols 24-28
    setTile(platforms, W, 24, 13, ROCK_L);
    fillRow(platforms, W, 13, 25, 27, ROCK_M);
    setTile(platforms, W, 28, 13, ROCK_R);

    // Between middle and right: row 12, cols 52-56
    setTile(platforms, W, 52, 12, ROCK_L);
    fillRow(platforms, W, 12, 53, 55, ROCK_M);
    setTile(platforms, W, 56, 12, ROCK_R);

    // Higher stepping stone: row 10, cols 55-58
    setTile(platforms, W, 55, 10, ROCK_L);
    fillRow(platforms, W, 10, 56, 57, ROCK_M);
    setTile(platforms, W, 58, 10, ROCK_R);

    // Decorations
    setTile(decorations, W, 5, 14, CACTUS1);
    setTile(decorations, W, 15, 14, CACTUS2);
    setTile(decorations, W, 38, 13, CACTUS1);
    setTile(decorations, W, 45, 13, CACTUS2);
    setTile(decorations, W, 70, 13, CACTUS1);

    // Hazards: water
    const hazards = [
        {
            id: 1,
            name: "water",
            type: "water",
            x: 21 * TILE,
            y: 15 * TILE,
            width: 10 * TILE,
            height: 3 * TILE,
            rotation: 0,
            visible: true
        }
    ];

    // Enemies: 2 patrol zones
    const enemies = [
        { id: 2, name: "enemy1", type: "enemy", x: 700, y: 300, width: 300, height: 50, rotation: 0, visible: true },
        { id: 3, name: "enemy2", type: "enemy", x: 1800, y: 350, width: 250, height: 50, rotation: 0, visible: true }
    ];

    // Spawns
    const spawns = [
        { id: 4, name: "playerSpawn", type: "playerSpawn", x: 64, y: 448, width: 0, height: 0, rotation: 0, visible: true },
        { id: 5, name: "ballSpawn", type: "ballSpawn", x: 128, y: 460, width: 0, height: 0, rotation: 0, visible: true },
        { id: 6, name: "holePosition", type: "holePosition", x: 2400, y: 420, width: 0, height: 0, rotation: 0, visible: true }
    ];

    return buildTilemap({
        width: W, height: H,
        groundData: ground,
        platformData: platforms,
        decorationData: decorations,
        hazards, spawns, enemies
    });
}

// ─── HOLE 6 ───────────────────────────────────────────────────────
// Par 5, Desert Sunset, Complex
// Width: 100 tiles, Height: 19 tiles
// 3 terrain sections with gaps, sand traps, water hazard, 3 enemies
function generateHole6() {
    const W = 100, H = 19;
    const ground = emptyLayer(W, H);
    const platforms = emptyLayer(W, H);
    const decorations = emptyLayer(W, H);

    // Section 1: cols 0-25, surface at row 15
    fillRow(ground, W, 15, 0, 25, SAND_TOP);
    fillRect(ground, W, 0, 25, 16, 17, SAND_BODY);
    fillRect(ground, W, 0, 25, 18, 18, SANDSTONE);

    // Sand trap in section 1 landing zone
    fillRow(ground, W, 15, 12, 16, SAND_TRAP);

    // Gap 1: cols 26-34 (some water)
    // Water hazard: cols 28-33
    fillRow(ground, W, 15, 28, 33, WATER_SURF);
    fillRect(ground, W, 28, 33, 16, 17, WATER_BODY);
    fillRect(ground, W, 28, 33, 18, 18, SANDSTONE_DEEP);

    // Section 2: cols 35-60, surface at row 13 (elevated)
    // Slope up at entry
    setTile(ground, W, 35, 15, SAND_LSLOPE);
    setTile(ground, W, 36, 14, SAND_LSLOPE);
    for (let r = 16; r <= 18; r++) {
        setTile(ground, W, 35, r, SAND_BODY);
        setTile(ground, W, 36, r, SAND_BODY);
    }

    fillRow(ground, W, 13, 37, 60, SAND_TOP);
    fillRect(ground, W, 37, 60, 14, 17, SAND_BODY);
    fillRect(ground, W, 37, 60, 18, 18, SANDSTONE);

    // Sand trap in section 2
    fillRow(ground, W, 13, 48, 53, SAND_TRAP);

    // Gap 2: cols 61-70

    // Section 3: cols 71-99, surface at row 14
    // Slope down at entry
    setTile(ground, W, 71, 13, SAND_RSLOPE);
    for (let r = 14; r <= 18; r++) {
        setTile(ground, W, 71, r, SAND_BODY);
    }

    fillRow(ground, W, 14, 72, 99, SAND_TOP);
    fillRect(ground, W, 72, 99, 15, 17, SAND_BODY);
    fillRect(ground, W, 72, 99, 18, 18, SANDSTONE);

    // Rock platforms bridging gaps
    // Gap 1 bridge: row 13, cols 27-31
    setTile(platforms, W, 27, 13, ROCK_L);
    fillRow(platforms, W, 13, 28, 30, ROCK_M);
    setTile(platforms, W, 31, 13, ROCK_R);

    // Gap 2 bridges: two stepping stones
    // Lower: row 13, cols 63-66
    setTile(platforms, W, 63, 13, ROCK_L);
    fillRow(platforms, W, 13, 64, 65, ROCK_M);
    setTile(platforms, W, 66, 13, ROCK_R);

    // Higher: row 11, cols 67-70
    setTile(platforms, W, 67, 11, ROCK_L);
    fillRow(platforms, W, 11, 68, 69, ROCK_M);
    setTile(platforms, W, 70, 11, ROCK_R);

    // Decorations: cacti spread across sections
    setTile(decorations, W, 4, 14, CACTUS1);
    setTile(decorations, W, 10, 14, CACTUS2);
    setTile(decorations, W, 22, 14, CACTUS1);
    setTile(decorations, W, 40, 12, CACTUS2);
    setTile(decorations, W, 55, 12, CACTUS1);
    setTile(decorations, W, 80, 13, CACTUS2);
    setTile(decorations, W, 92, 13, CACTUS1);

    // Hazards: 2 sand + 1 water
    const hazards = [
        {
            id: 1,
            name: "sand1",
            type: "sand",
            x: 12 * TILE,
            y: 15 * TILE,
            width: 5 * TILE,
            height: 1 * TILE,
            rotation: 0,
            visible: true
        },
        {
            id: 2,
            name: "sand2",
            type: "sand",
            x: 48 * TILE,
            y: 13 * TILE,
            width: 6 * TILE,
            height: 1 * TILE,
            rotation: 0,
            visible: true
        },
        {
            id: 3,
            name: "water",
            type: "water",
            x: 28 * TILE,
            y: 15 * TILE,
            width: 6 * TILE,
            height: 3 * TILE,
            rotation: 0,
            visible: true
        }
    ];

    // Enemies: 3 patrol zones
    const enemies = [
        { id: 4, name: "enemy1", type: "enemy", x: 500, y: 300, width: 200, height: 50, rotation: 0, visible: true },
        { id: 5, name: "enemy2", type: "enemy", x: 1500, y: 280, width: 250, height: 50, rotation: 0, visible: true },
        { id: 6, name: "enemy3", type: "enemy", x: 2500, y: 320, width: 200, height: 50, rotation: 0, visible: true }
    ];

    // Spawns
    const spawns = [
        { id: 7, name: "playerSpawn", type: "playerSpawn", x: 64, y: 448, width: 0, height: 0, rotation: 0, visible: true },
        { id: 8, name: "ballSpawn", type: "ballSpawn", x: 128, y: 460, width: 0, height: 0, rotation: 0, visible: true },
        { id: 9, name: "holePosition", type: "holePosition", x: 3050, y: 400, width: 0, height: 0, rotation: 0, visible: true }
    ];

    return buildTilemap({
        width: W, height: H,
        groundData: ground,
        platformData: platforms,
        decorationData: decorations,
        hazards, spawns, enemies
    });
}

// ─── MAIN ──────────────────────────────────────────────────────────

function writeHole(filename, data) {
    const filePath = path.join(OUTPUT_DIR, filename);
    const json = JSON.stringify(data, null, 4) + '\n';
    fs.writeFileSync(filePath, json);
    console.log(`  Wrote ${filePath} (${json.length} bytes)`);
}

console.log('Generating desert tilemaps (holes 4-6)...');
writeHole('hole4.json', generateHole4());
writeHole('hole5.json', generateHole5());
writeHole('hole6.json', generateHole6());
console.log('Done!');
