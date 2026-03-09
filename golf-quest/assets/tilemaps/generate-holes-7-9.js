#!/usr/bin/env node
/**
 * Generate Tiled-format JSON tilemaps for holes 7-9 (Tundra & Space).
 */
const fs = require('fs');
const path = require('path');

const TILE = 32;

/* ── Helper builders ─────────────────────────────────────────────── */

function makeTileLayer(name, width, height, data) {
  return {
    data,
    height,
    id: 0, // patched later
    name,
    opacity: 1,
    type: "tilelayer",
    visible: true,
    width,
    x: 0,
    y: 0
  };
}

function makeObjectLayer(name, objects) {
  return {
    draworder: "topdown",
    id: 0,
    name,
    objects,
    opacity: 1,
    type: "objectgroup",
    visible: true,
    x: 0,
    y: 0
  };
}

function makeObj(id, name, type, x, y, w, h, props) {
  const o = { id, name, type, x, y, width: w, height: h, rotation: 0, visible: true };
  if (props) {
    o.properties = Object.entries(props).map(([pname, value]) => ({
      name: pname,
      type: typeof value === 'number' ? 'float' : 'string',
      value
    }));
  }
  return o;
}

function assignIds(layers) {
  layers.forEach((l, i) => { l.id = i + 1; });
}

function buildMap(opts) {
  const { width, height, tilesetSource, tilesetFirstgid, layers, properties } = opts;
  assignIds(layers);
  const map = {
    compressionlevel: -1,
    height,
    infinite: false,
    layers,
    nextlayerid: layers.length + 1,
    nextobjectid: layers.reduce((max, l) => {
      if (l.objects) l.objects.forEach(o => { if (o.id >= max) max = o.id + 1; });
      return max;
    }, 1),
    orientation: "orthogonal",
    renderorder: "right-down",
    tiledversion: "1.10.2",
    tileheight: TILE,
    tilesets: [{ firstgid: tilesetFirstgid, source: tilesetSource }],
    tilewidth: TILE,
    type: "map",
    version: "1.10",
    width
  };
  if (properties) {
    map.properties = Object.entries(properties).map(([name, value]) => ({
      name,
      type: typeof value === 'number' ? 'float' : 'string',
      value
    }));
  }
  return map;
}

/* ── Tundra tile IDs ─────────────────────────────────────────────── */
const T = {
  SNOW_TOP: 1, SNOW_SLOPE_L: 2, SNOW_SLOPE_R: 3, SNOW_BODY: 4,
  FROZEN_GROUND: 5, STONE_UG: 6, EMPTY: 0,
  STONE_L: 8, STONE_M: 9, STONE_R: 10,
  ICICLE: 11, FROZEN_BUSH: 12, ICE_SURFACE: 13,
  WATER_SURF: 14, WATER_BODY: 15
};

/* ── Space tile IDs ──────────────────────────────────────────────── */
const S = {
  REG_TOP: 1, REG_SLOPE_L: 2, REG_SLOPE_R: 3, MOON_ROCK: 4,
  CRATER: 5, DEEP_ROCK: 6, EMPTY: 0,
  METAL_L: 8, METAL_M: 9, METAL_R: 10,
  SMALL_ROCK: 11, ANTENNA: 12
};

/* ── Fill helpers ─────────────────────────────────────────────────── */

function emptyGrid(w, h) { return new Array(w * h).fill(0); }

function setTile(data, w, col, row, id) {
  if (col >= 0 && col < w && row >= 0 && row < data.length / w) {
    data[row * w + col] = id;
  }
}

function fillRect(data, w, col, row, cw, rh, id) {
  for (let r = row; r < row + rh; r++)
    for (let c = col; c < col + cw; c++)
      setTile(data, w, c, r, id);
}

function fillGround(data, w, h, topId, bodyId, undergroundId, surfaceRow) {
  // surfaceRow: the row where the top tiles sit
  for (let c = 0; c < w; c++) {
    setTile(data, w, c, surfaceRow, topId);
    for (let r = surfaceRow + 1; r < surfaceRow + 3 && r < h; r++)
      setTile(data, w, c, r, bodyId);
    for (let r = surfaceRow + 3; r < h; r++)
      setTile(data, w, c, r, undergroundId);
  }
}

/* ════════════════════════════════════════════════════════════════════
   HOLE 7 — Par 4, Tundra Storm
   80×19 tiles (2560×608 px)
   ════════════════════════════════════════════════════════════════════ */
function generateHole7() {
  const W = 80, H = 19;
  const ground = emptyGrid(W, H);
  const platforms = emptyGrid(W, H);
  const decorations = emptyGrid(W, H);

  // Main ground at row 14 (y=448) with a gap from col 31-43 (water area at x=1000,w=400 → cols 31–43)
  // Left section: cols 0-30
  for (let c = 0; c < 31; c++) {
    setTile(ground, W, c, 14, T.SNOW_TOP);
    fillRect(ground, W, c, 15, 1, 2, T.SNOW_BODY);
    fillRect(ground, W, c, 17, 1, 2, T.STONE_UG);
  }
  // Right section: cols 44-79
  for (let c = 44; c < W; c++) {
    setTile(ground, W, c, 14, T.SNOW_TOP);
    fillRect(ground, W, c, 15, 1, 2, T.SNOW_BODY);
    fillRect(ground, W, c, 17, 1, 2, T.STONE_UG);
  }

  // Water in the gap (cols 31-43, water surface at row 15, body below)
  for (let c = 31; c < 44; c++) {
    setTile(ground, W, c, 15, T.WATER_SURF);
    fillRect(ground, W, c, 16, 1, 3, T.WATER_BODY);
  }

  // Slopes at gap edges
  setTile(ground, W, 30, 14, T.SNOW_SLOPE_R);
  setTile(ground, W, 44, 14, T.SNOW_SLOPE_L);

  // Ice patches on ground (visual) at cols 18-24 and cols 56-63
  for (let c = 18; c <= 24; c++) setTile(ground, W, c, 14, T.ICE_SURFACE);
  for (let c = 56; c <= 63; c++) setTile(ground, W, c, 14, T.ICE_SURFACE);

  // Elevated section right side: cols 70-79 raised to row 13
  for (let c = 70; c < W; c++) {
    setTile(ground, W, c, 13, T.SNOW_TOP);
    setTile(ground, W, c, 14, T.SNOW_BODY);
  }
  setTile(ground, W, 69, 13, T.SNOW_SLOPE_L);

  // Stone platforms over the water gap
  // Platform 1: cols 33-37 at row 11
  setTile(platforms, W, 33, 11, T.STONE_L);
  fillRect(platforms, W, 34, 11, 3, 1, T.STONE_M);
  setTile(platforms, W, 37, 11, T.STONE_R);

  // Platform 2: cols 39-42 at row 12
  setTile(platforms, W, 39, 12, T.STONE_L);
  fillRect(platforms, W, 40, 12, 2, 1, T.STONE_M);
  setTile(platforms, W, 42, 12, T.STONE_R);

  // Decorations: frozen bushes & icicles
  setTile(decorations, W, 5, 13, T.FROZEN_BUSH);
  setTile(decorations, W, 15, 13, T.FROZEN_BUSH);
  setTile(decorations, W, 50, 13, T.FROZEN_BUSH);
  setTile(decorations, W, 65, 13, T.FROZEN_BUSH);
  // Icicles hanging under platforms
  setTile(decorations, W, 34, 12, T.ICICLE);
  setTile(decorations, W, 36, 12, T.ICICLE);
  setTile(decorations, W, 40, 13, T.ICICLE);

  const hazards = makeObjectLayer("hazards", [
    makeObj(1, "ice1", "ice", 600, 420, 200, 40),
    makeObj(2, "ice2", "ice", 1800, 380, 250, 40),
    makeObj(3, "water1", "water", 1000, 480, 400, 128)
  ]);

  const enemies = makeObjectLayer("enemies", [
    makeObj(4, "enemy1", "enemy", 700, 280, 300, 50),
    makeObj(5, "enemy2", "enemy", 2000, 300, 250, 50)
  ]);

  const spawns = makeObjectLayer("spawns", [
    makeObj(6, "playerSpawn", "playerSpawn", 64, 416, 32, 32),
    makeObj(7, "ballSpawn", "ballSpawn", 128, 430, 16, 16),
    makeObj(8, "holePosition", "holePosition", 2400, 420, 32, 32)
  ]);

  return buildMap({
    width: W, height: H,
    tilesetSource: "../tilesets/tundra.json",
    tilesetFirstgid: 1,
    layers: [
      makeTileLayer("ground", W, H, ground),
      makeTileLayer("platforms", W, H, platforms),
      makeTileLayer("decorations", W, H, decorations),
      hazards, spawns, enemies
    ]
  });
}

/* ════════════════════════════════════════════════════════════════════
   HOLE 8 — Par 5, Tundra Storm, "The Gauntlet"
   100×19 tiles (3200×608 px)
   ════════════════════════════════════════════════════════════════════ */
function generateHole8() {
  const W = 100, H = 19;
  const ground = emptyGrid(W, H);
  const platforms = emptyGrid(W, H);
  const decorations = emptyGrid(W, H);

  // Complex terrain with multiple gaps
  // Section 1: cols 0-20, ground at row 14
  for (let c = 0; c < 21; c++) {
    setTile(ground, W, c, 14, T.SNOW_TOP);
    fillRect(ground, W, c, 15, 1, 2, T.SNOW_BODY);
    fillRect(ground, W, c, 17, 1, 2, T.STONE_UG);
  }
  setTile(ground, W, 20, 14, T.SNOW_SLOPE_R);

  // Gap 1: cols 21-28 (water)
  for (let c = 21; c < 29; c++) {
    setTile(ground, W, c, 15, T.WATER_SURF);
    fillRect(ground, W, c, 16, 1, 3, T.WATER_BODY);
  }

  // Section 2: cols 29-45, ground at row 13 (higher)
  setTile(ground, W, 29, 13, T.SNOW_SLOPE_L);
  for (let c = 29; c < 46; c++) {
    setTile(ground, W, c, 13, T.SNOW_TOP);
    fillRect(ground, W, c, 14, 1, 2, T.SNOW_BODY);
    fillRect(ground, W, c, 16, 1, 3, T.STONE_UG);
  }
  setTile(ground, W, 45, 13, T.SNOW_SLOPE_R);

  // Gap 2: cols 46-53 (water)
  for (let c = 46; c < 54; c++) {
    setTile(ground, W, c, 15, T.WATER_SURF);
    fillRect(ground, W, c, 16, 1, 3, T.WATER_BODY);
  }

  // Section 3: cols 54-70, ground at row 14
  setTile(ground, W, 54, 14, T.SNOW_SLOPE_L);
  for (let c = 54; c < 71; c++) {
    setTile(ground, W, c, 14, T.SNOW_TOP);
    fillRect(ground, W, c, 15, 1, 2, T.SNOW_BODY);
    fillRect(ground, W, c, 17, 1, 2, T.STONE_UG);
  }
  setTile(ground, W, 70, 14, T.SNOW_SLOPE_R);

  // Gap 3: cols 71-77
  for (let c = 71; c < 78; c++) {
    setTile(ground, W, c, 16, T.FROZEN_GROUND);
    fillRect(ground, W, c, 17, 1, 2, T.STONE_UG);
  }

  // Section 4: cols 78-99, ground at row 13 (elevated finish)
  setTile(ground, W, 78, 13, T.SNOW_SLOPE_L);
  for (let c = 78; c < W; c++) {
    setTile(ground, W, c, 13, T.SNOW_TOP);
    fillRect(ground, W, c, 14, 1, 2, T.SNOW_BODY);
    fillRect(ground, W, c, 16, 1, 3, T.STONE_UG);
  }

  // Ice patches
  for (let c = 5; c <= 12; c++) setTile(ground, W, c, 14, T.ICE_SURFACE);
  for (let c = 35; c <= 42; c++) setTile(ground, W, c, 13, T.ICE_SURFACE);

  // Narrow stone platforms over gaps
  // Over gap 1
  setTile(platforms, W, 23, 11, T.STONE_L);
  setTile(platforms, W, 24, 11, T.STONE_M);
  setTile(platforms, W, 25, 11, T.STONE_R);

  // Over gap 2
  setTile(platforms, W, 48, 10, T.STONE_L);
  setTile(platforms, W, 49, 10, T.STONE_M);
  setTile(platforms, W, 50, 10, T.STONE_R);

  // Over gap 3
  setTile(platforms, W, 73, 12, T.STONE_L);
  setTile(platforms, W, 74, 12, T.STONE_M);
  setTile(platforms, W, 75, 12, T.STONE_R);

  // Extra stepping-stone platforms
  setTile(platforms, W, 27, 12, T.STONE_L);
  setTile(platforms, W, 28, 12, T.STONE_R);

  // Decorations
  setTile(decorations, W, 3, 13, T.FROZEN_BUSH);
  setTile(decorations, W, 16, 13, T.FROZEN_BUSH);
  setTile(decorations, W, 33, 12, T.FROZEN_BUSH);
  setTile(decorations, W, 60, 13, T.FROZEN_BUSH);
  setTile(decorations, W, 85, 12, T.FROZEN_BUSH);
  setTile(decorations, W, 24, 10, T.ICICLE);
  setTile(decorations, W, 49, 9, T.ICICLE);
  setTile(decorations, W, 74, 11, T.ICICLE);

  const hazards = makeObjectLayer("hazards", [
    makeObj(1, "ice1", "ice", 160, 420, 250, 40),
    makeObj(2, "ice2", "ice", 1120, 380, 250, 40),
    makeObj(3, "water1", "water", 672, 480, 256, 128),
    makeObj(4, "water2", "water", 1472, 480, 256, 128)
  ]);

  const enemies = makeObjectLayer("enemies", [
    makeObj(5, "enemy1", "enemy", 500, 300, 250, 50),
    makeObj(6, "enemy2", "enemy", 1400, 260, 300, 50),
    makeObj(7, "enemy3", "enemy", 2400, 300, 250, 50)
  ]);

  const spawns = makeObjectLayer("spawns", [
    makeObj(8, "playerSpawn", "playerSpawn", 64, 416, 32, 32),
    makeObj(9, "ballSpawn", "ballSpawn", 128, 430, 16, 16),
    makeObj(10, "holePosition", "holePosition", 3050, 400, 32, 32)
  ]);

  return buildMap({
    width: W, height: H,
    tilesetSource: "../tilesets/tundra.json",
    tilesetFirstgid: 1,
    layers: [
      makeTileLayer("ground", W, H, ground),
      makeTileLayer("platforms", W, H, platforms),
      makeTileLayer("decorations", W, H, decorations),
      hazards, spawns, enemies
    ]
  });
}

/* ════════════════════════════════════════════════════════════════════
   HOLE 9 — Par 5, Space Moon, Boss Fight
   100×19 tiles (3200×608 px)
   ════════════════════════════════════════════════════════════════════ */
function generateHole9() {
  const W = 100, H = 19;
  const ground = emptyGrid(W, H);
  const platforms = emptyGrid(W, H);
  const decorations = emptyGrid(W, H);

  // Lunar surface with craters (varied heights)
  // Section 1: cols 0-22, regolith at row 14
  for (let c = 0; c < 23; c++) {
    setTile(ground, W, c, 14, S.REG_TOP);
    fillRect(ground, W, c, 15, 1, 2, S.MOON_ROCK);
    fillRect(ground, W, c, 17, 1, 2, S.DEEP_ROCK);
  }

  // Crater 1: cols 23-30, dip down to row 16
  setTile(ground, W, 23, 14, S.REG_SLOPE_R);
  for (let c = 23; c < 31; c++) {
    setTile(ground, W, c, 16, S.CRATER);
    fillRect(ground, W, c, 17, 1, 2, S.DEEP_ROCK);
  }
  setTile(ground, W, 30, 14, S.REG_SLOPE_L);

  // Section 2: cols 31-50, regolith at row 14
  for (let c = 31; c < 51; c++) {
    setTile(ground, W, c, 14, S.REG_TOP);
    fillRect(ground, W, c, 15, 1, 2, S.MOON_ROCK);
    fillRect(ground, W, c, 17, 1, 2, S.DEEP_ROCK);
  }

  // Raised area: cols 51-60, row 12
  for (let c = 51; c < 61; c++) {
    setTile(ground, W, c, 12, S.REG_TOP);
    fillRect(ground, W, c, 13, 1, 3, S.MOON_ROCK);
    fillRect(ground, W, c, 16, 1, 3, S.DEEP_ROCK);
  }
  setTile(ground, W, 50, 12, S.REG_SLOPE_L);
  setTile(ground, W, 61, 12, S.REG_SLOPE_R);

  // Crater 2: cols 61-68, dip to row 16
  for (let c = 61; c < 69; c++) {
    setTile(ground, W, c, 16, S.CRATER);
    fillRect(ground, W, c, 17, 1, 2, S.DEEP_ROCK);
  }

  // Section 3: cols 69-99, regolith at row 14 (boss arena)
  setTile(ground, W, 69, 14, S.REG_SLOPE_L);
  for (let c = 69; c < W; c++) {
    setTile(ground, W, c, 14, S.REG_TOP);
    fillRect(ground, W, c, 15, 1, 2, S.MOON_ROCK);
    fillRect(ground, W, c, 17, 1, 2, S.DEEP_ROCK);
  }

  // Metal platforms
  // Platform 1: over crater 1
  setTile(platforms, W, 25, 11, S.METAL_L);
  fillRect(platforms, W, 26, 11, 2, 1, S.METAL_M);
  setTile(platforms, W, 28, 11, S.METAL_R);

  // Platform 2: over crater 2
  setTile(platforms, W, 63, 11, S.METAL_L);
  fillRect(platforms, W, 64, 11, 2, 1, S.METAL_M);
  setTile(platforms, W, 66, 11, S.METAL_R);

  // Platform 3: high platform in boss area
  setTile(platforms, W, 80, 9, S.METAL_L);
  fillRect(platforms, W, 81, 9, 4, 1, S.METAL_M);
  setTile(platforms, W, 85, 9, S.METAL_R);

  // Decorations: small rocks & antenna
  setTile(decorations, W, 8, 13, S.SMALL_ROCK);
  setTile(decorations, W, 18, 13, S.SMALL_ROCK);
  setTile(decorations, W, 40, 13, S.SMALL_ROCK);
  setTile(decorations, W, 75, 13, S.ANTENNA);
  setTile(decorations, W, 90, 13, S.ANTENNA);
  setTile(decorations, W, 95, 13, S.SMALL_ROCK);

  const hazards = makeObjectLayer("hazards", [
    makeObj(1, "asteroid_zone1", "asteroid_zone", 800, 100, 600, 300),
    makeObj(2, "asteroid_zone2", "asteroid_zone", 2000, 80, 500, 350)
  ]);

  const spawns = makeObjectLayer("spawns", [
    makeObj(3, "playerSpawn", "playerSpawn", 64, 416, 32, 32),
    makeObj(4, "ballSpawn", "ballSpawn", 128, 430, 16, 16),
    makeObj(5, "holePosition", "holePosition", 3050, 420, 32, 32),
    makeObj(6, "bossSpawn", "bossSpawn", 2500, 200, 64, 64)
  ]);

  // No regular enemies — boss only
  const enemies = makeObjectLayer("enemies", []);

  return buildMap({
    width: W, height: H,
    tilesetSource: "../tilesets/space.json",
    tilesetFirstgid: 1,
    layers: [
      makeTileLayer("ground", W, H, ground),
      makeTileLayer("platforms", W, H, platforms),
      makeTileLayer("decorations", W, H, decorations),
      hazards, spawns, enemies
    ],
    properties: { gravity: 0.5 }
  });
}

/* ── Write files ─────────────────────────────────────────────────── */
const outDir = __dirname;

const files = [
  ['hole7.json', generateHole7()],
  ['hole8.json', generateHole8()],
  ['hole9.json', generateHole9()]
];

for (const [name, data] of files) {
  const fp = path.join(outDir, name);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n');
  console.log(`Wrote ${fp}`);
}

console.log('Done.');
