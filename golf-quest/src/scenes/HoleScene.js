import { HoleConfig, SkyConfig } from '../config/HoleConfig.js';
import { PhysicsConfig } from '../systems/PhysicsConfig.js';
import { Player } from '../entities/Player.js';
import { Ball } from '../entities/Ball.js';
import { HUD } from '../ui/HUD.js';

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

        // Sky background (fixed, fills screen)
        this.createSky(skyConfig);

        // Load tilemap
        const map = this.make.tilemap({ key: config.tilemap });

        // IMPORTANT: The tileset name in addTilesetImage must match the "name" field
        // in the tileset JSON file. The second argument is the Phaser cache key.
        const tileset = map.addTilesetImage(config.tileset, `tileset-${config.tileset}`);

        // Ground layer with collision
        const groundLayer = map.createLayer('ground', tileset, 0, 0);
        if (groundLayer) {
            groundLayer.setCollisionByExclusion([-1, 0]);
            this.matter.world.convertTilemapLayer(groundLayer);
        }

        // Platform layer with collision
        const platformLayer = map.createLayer('platforms', tileset, 0, 0);
        if (platformLayer) {
            platformLayer.setCollisionByExclusion([-1, 0]);
            this.matter.world.convertTilemapLayer(platformLayer);
        }

        // Decoration layer (no collision)
        map.createLayer('decorations', tileset, 0, 0);

        // Parse object layers
        this.parseObjectLayers(map);

        // Camera setup
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // Store map reference
        this.map = map;

        // Create player at spawn point
        const gs = this.registry.get('equipment');
        this.player = new Player(this, this.playerSpawn.x, this.playerSpawn.y);
        this.player.setEquipment(gs);
        this.cameras.main.startFollow(this.player.sprite, false, 0.1, 0.1);

        // Create ball at spawn point
        this.ball = new Ball(this, this.ballSpawn.x, this.ballSpawn.y);

        // HUD overlay
        this.hud = new HUD(this);
    }

    createSky(skyConfig) {
        const { width, height } = this.scale;
        const sky = this.add.graphics();
        sky.fillGradientStyle(skyConfig.top, skyConfig.top, skyConfig.bottom, skyConfig.bottom, 1);
        sky.fillRect(0, 0, width * 3, height);
        sky.setScrollFactor(0);
        sky.setDepth(-10);
    }

    parseObjectLayers(map) {
        // Parse spawn points
        this.playerSpawn = { x: 64, y: 416 };
        this.ballSpawn = { x: 128, y: 430 };
        this.holePosition = { x: 1150, y: 440 };

        const spawns = map.getObjectLayer('spawns');
        if (spawns) {
            spawns.objects.forEach(obj => {
                if (obj.name === 'playerSpawn') {
                    this.playerSpawn = { x: obj.x, y: obj.y };
                } else if (obj.name === 'ballSpawn') {
                    this.ballSpawn = { x: obj.x, y: obj.y };
                } else if (obj.name === 'holePosition') {
                    this.holePosition = { x: obj.x, y: obj.y };
                } else if (obj.name === 'bossSpawn') {
                    this.bossSpawn = { x: obj.x, y: obj.y };
                }
            });
        }

        // Parse hazards
        this.waterZones = [];
        this.sandZones = [];
        this.iceZones = [];
        this.asteroidZones = [];
        const hazards = map.getObjectLayer('hazards');
        if (hazards) {
            hazards.objects.forEach(obj => {
                const zone = { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
                if (obj.type === 'water') this.waterZones.push(zone);
                else if (obj.type === 'sand') this.sandZones.push(zone);
                else if (obj.type === 'ice') this.iceZones.push(zone);
                else if (obj.type === 'asteroid_zone') this.asteroidZones.push(zone);
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
        if (this.player) this.player.update();
        if (this.ball) this.ball.update();

        const gs = this.registry.get('gameState');
        if (this.hud && this.player) {
            this.hud.update(this.holeConfig, this.player, gs);
        }
    }
}
