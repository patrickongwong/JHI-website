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

export const SkyConfig = {
    day:       { top: 0x87CEEB, bottom: 0xE0F7FA, hasSun: true,  hasStars: false, hasClouds: true,  hasRain: false },
    afternoon: { top: 0xFF8C42, bottom: 0xFFD700, hasSun: true,  hasStars: false, hasClouds: true,  hasRain: false },
    sunset:    { top: 0x8B1A1A, bottom: 0xFF6347, hasSun: true,  hasStars: true,  hasClouds: true,  hasRain: false },
    storm:     { top: 0x1C1C2E, bottom: 0x2D2D44, hasSun: false, hasStars: false, hasClouds: true,  hasRain: true  },
    moon:      { top: 0x000011, bottom: 0x0A0A2E, hasSun: false, hasStars: true,  hasClouds: false, hasRain: false }
};
