#!/usr/bin/env node
/**
 * generate-tilemaps.js
 * Generates Tiled-format JSON tilemap files for Golf Quest holes 1-3 (Meadow biome).
 *
 * Usage: node golf-quest/tools/generate-tilemaps.js
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'tilemaps');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Tile IDs from meadow tileset (firstgid=1)
const TILE = {
    GRASS_TOP:       1,
    GRASS_SLOPE_L:   2,
    GRASS_SLOPE_R:   3,
    GRASS_BODY:      4,
    DIRT_FILL:       5,
    DIRT_UNDER:      6,
    EMPTY:           0,  // 0 means no tile in Tiled format
    PLATFORM_L:      8,
    PLATFORM_M:      9,
    PLATFORM_R:     10,
    FLOWER1:        11,
    FLOWER2:        12,
    TREE_TRUNK:     13,
    TREE_CANOPY:    14,
    WATER_SURFACE:  15,
    WATER_BODY:     16,
};

/**
 * Create a blank tile data array (all zeros).
 */
function blankData(width, height) {
    return new Array(width * height).fill(0);
}

/**
 * Set a tile in the data array.
 */
function setTile(data, width, col, row, tileId) {
    if (col >= 0 && col < width && row >= 0 && row < 19) {
        data[row * width + col] = tileId;
    }
}

/**
 * Get a tile from the data array.
 */
function getTile(data, width, col, row) {
    if (col >= 0 && col < width && row >= 0 && row < 19) {
        return data[row * width + col];
    }
    return 0;
}

/**
 * Build the Tiled JSON structure for a hole.
 */
function buildTilemap({ width, height, groundData, platformData, decorationData, hazards, spawns }) {
    return {
        compressionlevel: -1,
        height: height,
        infinite: false,
        layers: [
            {
                data: groundData,
                height: height,
                id: 1,
                name: "ground",
                opacity: 1,
                type: "tilelayer",
                visible: true,
                width: width,
                x: 0,
                y: 0
            },
            {
                data: platformData,
                height: height,
                id: 2,
                name: "platforms",
                opacity: 1,
                type: "tilelayer",
                visible: true,
                width: width,
                x: 0,
                y: 0
            },
            {
                data: decorationData,
                height: height,
                id: 3,
                name: "decorations",
                opacity: 1,
                type: "tilelayer",
                visible: true,
                width: width,
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
                objects: spawns.map((s, i) => ({
                    id: i + 1,
                    name: s.name,
                    x: s.x,
                    y: s.y,
                    width: 0,
                    height: 0
                })),
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
                objects: [],
                opacity: 1,
                type: "objectgroup",
                visible: true,
                x: 0,
                y: 0
            }
        ],
        nextlayerid: 7,
        nextobjectid: spawns.length + hazards.length + 1,
        orientation: "orthogonal",
        renderorder: "right-down",
        tiledversion: "1.10.2",
        tileheight: 32,
        tilesets: [{ firstgid: 1, source: "../tilesets/meadow.json" }],
        tilewidth: 32,
        type: "map",
        version: "1.10",
        width: width
    };
}

// ─── HOLE 1: Par 2, Flat Intro ─────────────────────────────────────

function generateHole1() {
    const W = 40, H = 19;
    const ground = blankData(W, H);
    const platforms = blankData(W, H);
    const decorations = blankData(W, H);

    // Flat terrain: grass top at row 14, grass body rows 15-16, dirt rows 17-18
    for (let col = 0; col < W; col++) {
        setTile(ground, W, col, 14, TILE.GRASS_TOP);
        setTile(ground, W, col, 15, TILE.GRASS_BODY);
        setTile(ground, W, col, 16, TILE.GRASS_BODY);
        setTile(ground, W, col, 17, TILE.DIRT_FILL);
        setTile(ground, W, col, 18, TILE.DIRT_UNDER);
    }

    // Decorations: a few flowers and trees
    // Tree at col 10
    setTile(decorations, W, 10, 12, TILE.TREE_CANOPY);
    setTile(decorations, W, 10, 13, TILE.TREE_TRUNK);

    // Tree at col 25
    setTile(decorations, W, 25, 12, TILE.TREE_CANOPY);
    setTile(decorations, W, 25, 13, TILE.TREE_TRUNK);

    // Flowers scattered
    setTile(decorations, W, 5, 13, TILE.FLOWER1);
    setTile(decorations, W, 15, 13, TILE.FLOWER2);
    setTile(decorations, W, 20, 13, TILE.FLOWER1);
    setTile(decorations, W, 32, 13, TILE.FLOWER2);

    return buildTilemap({
        width: W,
        height: H,
        groundData: ground,
        platformData: platforms,
        decorationData: decorations,
        hazards: [],
        spawns: [
            { name: "playerSpawn", x: 64, y: 416 },
            { name: "ballSpawn", x: 128, y: 430 },
            { name: "holePosition", x: 1150, y: 440 }
        ]
    });
}

// ─── HOLE 2: Par 3, Rolling Hills ──────────────────────────────────

function generateHole2() {
    const W = 60, H = 19;
    const ground = blankData(W, H);
    const platforms = blankData(W, H);
    const decorations = blankData(W, H);

    // Rolling terrain: grass top varies between rows 12-15
    // Define a height profile (row index of grass top for each column)
    const profile = [];
    for (let col = 0; col < W; col++) {
        // Create gentle rolling hills using sine waves
        const base = 14;
        const hill1 = Math.sin(col * 0.15) * 1.5;
        const hill2 = Math.sin(col * 0.08 + 1) * 1.0;
        const row = Math.round(base + hill1 + hill2);
        profile.push(Math.max(12, Math.min(15, row)));
    }

    for (let col = 0; col < W; col++) {
        const topRow = profile[col];

        // Determine if we need slope tiles at transitions
        const prevHeight = col > 0 ? profile[col - 1] : topRow;
        const nextHeight = col < W - 1 ? profile[col + 1] : topRow;

        // Place grass top tile (use slopes at transitions)
        if (prevHeight > topRow && nextHeight >= topRow) {
            // Terrain rises from left: left-slope (going up to right)
            setTile(ground, W, col, topRow, TILE.GRASS_SLOPE_L);
        } else if (nextHeight > topRow && prevHeight >= topRow) {
            // Terrain rises to right: right-slope (going up to left)
            setTile(ground, W, col, topRow, TILE.GRASS_SLOPE_R);
        } else {
            setTile(ground, W, col, topRow, TILE.GRASS_TOP);
        }

        // Fill below grass top with grass body, then dirt
        for (let row = topRow + 1; row < H; row++) {
            if (row <= topRow + 2) {
                setTile(ground, W, col, row, TILE.GRASS_BODY);
            } else if (row <= topRow + 3) {
                setTile(ground, W, col, row, TILE.DIRT_FILL);
            } else {
                setTile(ground, W, col, row, TILE.DIRT_UNDER);
            }
        }
    }

    // Trees on hilltops (local minima in profile = higher terrain = lower row number)
    const treePositions = [8, 22, 38, 52];
    for (const col of treePositions) {
        const topRow = profile[col];
        setTile(decorations, W, col, topRow - 2, TILE.TREE_CANOPY);
        setTile(decorations, W, col, topRow - 1, TILE.TREE_TRUNK);
    }

    // A few flowers
    setTile(decorations, W, 4, profile[4] - 1, TILE.FLOWER1);
    setTile(decorations, W, 15, profile[15] - 1, TILE.FLOWER2);
    setTile(decorations, W, 30, profile[30] - 1, TILE.FLOWER1);
    setTile(decorations, W, 45, profile[45] - 1, TILE.FLOWER2);
    setTile(decorations, W, 55, profile[55] - 1, TILE.FLOWER1);

    return buildTilemap({
        width: W,
        height: H,
        groundData: ground,
        platformData: platforms,
        decorationData: decorations,
        hazards: [],
        spawns: [
            { name: "playerSpawn", x: 64, y: 350 },
            { name: "ballSpawn", x: 128, y: 370 },
            { name: "holePosition", x: 1800, y: 440 }
        ]
    });
}

// ─── HOLE 3: Par 3, Water Gap ───────────────────────────────────────

function generateHole3() {
    const W = 70, H = 19;
    const ground = blankData(W, H);
    const platforms = blankData(W, H);
    const decorations = blankData(W, H);

    // Left section (cols 0-25) at row 14
    for (let col = 0; col <= 25; col++) {
        setTile(ground, W, col, 14, TILE.GRASS_TOP);
        setTile(ground, W, col, 15, TILE.GRASS_BODY);
        setTile(ground, W, col, 16, TILE.GRASS_BODY);
        setTile(ground, W, col, 17, TILE.DIRT_FILL);
        setTile(ground, W, col, 18, TILE.DIRT_UNDER);
    }

    // Right section (cols 45-69) at row 14
    for (let col = 45; col <= 69; col++) {
        setTile(ground, W, col, 14, TILE.GRASS_TOP);
        setTile(ground, W, col, 15, TILE.GRASS_BODY);
        setTile(ground, W, col, 16, TILE.GRASS_BODY);
        setTile(ground, W, col, 17, TILE.DIRT_FILL);
        setTile(ground, W, col, 18, TILE.DIRT_UNDER);
    }

    // Water gap in middle (cols 26-44): water surface at row 15, water body rows 16-18
    for (let col = 26; col <= 44; col++) {
        setTile(ground, W, col, 15, TILE.WATER_SURFACE);
        setTile(ground, W, col, 16, TILE.WATER_BODY);
        setTile(ground, W, col, 17, TILE.WATER_BODY);
        setTile(ground, W, col, 18, TILE.WATER_BODY);
    }

    // Wooden platform above water (cols 34-37, row 11)
    setTile(platforms, W, 34, 11, TILE.PLATFORM_L);
    setTile(platforms, W, 35, 11, TILE.PLATFORM_M);
    setTile(platforms, W, 36, 11, TILE.PLATFORM_M);
    setTile(platforms, W, 37, 11, TILE.PLATFORM_R);

    // Decorations: trees on both sides
    setTile(decorations, W, 6, 12, TILE.TREE_CANOPY);
    setTile(decorations, W, 6, 13, TILE.TREE_TRUNK);
    setTile(decorations, W, 18, 12, TILE.TREE_CANOPY);
    setTile(decorations, W, 18, 13, TILE.TREE_TRUNK);
    setTile(decorations, W, 52, 12, TILE.TREE_CANOPY);
    setTile(decorations, W, 52, 13, TILE.TREE_TRUNK);
    setTile(decorations, W, 62, 12, TILE.TREE_CANOPY);
    setTile(decorations, W, 62, 13, TILE.TREE_TRUNK);

    // Flowers
    setTile(decorations, W, 3, 13, TILE.FLOWER1);
    setTile(decorations, W, 12, 13, TILE.FLOWER2);
    setTile(decorations, W, 48, 13, TILE.FLOWER1);
    setTile(decorations, W, 58, 13, TILE.FLOWER2);
    setTile(decorations, W, 66, 13, TILE.FLOWER1);

    const hazards = [
        {
            id: 1,
            name: "water",
            type: "water",
            x: 832,
            y: 480,
            width: 608,
            height: 128
        }
    ];

    return buildTilemap({
        width: W,
        height: H,
        groundData: ground,
        platformData: platforms,
        decorationData: decorations,
        hazards: hazards,
        spawns: [
            { name: "playerSpawn", x: 64, y: 416 },
            { name: "ballSpawn", x: 128, y: 430 },
            { name: "holePosition", x: 2100, y: 440 }
        ]
    });
}

// ─── MAIN ──────────────────────────────────────────────────────────

function writeHole(filename, data) {
    const outPath = path.join(OUTPUT_DIR, filename);
    const json = JSON.stringify(data, null, 4) + '\n';

    // Validate JSON is parseable
    JSON.parse(json);

    fs.writeFileSync(outPath, json);
    console.log(`  Wrote ${outPath}`);
}

console.log('Generating tilemaps for holes 1-3 (Meadow)...');
writeHole('hole1.json', generateHole1());
writeHole('hole2.json', generateHole2());
writeHole('hole3.json', generateHole3());
console.log('Done!');
