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

        // Create hazard sensor bodies
        this.createHazardSensors();

        // Hole completion state
        this.holeComplete = false;

        // Create player at spawn point
        const gs = this.registry.get('equipment');
        this.player = new Player(this, this.playerSpawn.x, this.playerSpawn.y);
        this.player.setEquipment(gs);
        this.cameras.main.startFollow(this.player.sprite, false, 0.1, 0.1);

        // Create ball at spawn point
        this.ball = new Ball(this, this.ballSpawn.x, this.ballSpawn.y);

        // Set up hazard collision events
        this.setupHazardCollisions();

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

    createHazardSensors() {
        // Water sensors
        this.waterZones.forEach(zone => {
            this.matter.add.rectangle(
                zone.x + zone.width / 2, zone.y + zone.height / 2,
                zone.width, zone.height,
                { isSensor: true, isStatic: true, label: 'water' }
            );
        });

        // Sand sensors
        this.sandZones.forEach(zone => {
            this.matter.add.rectangle(
                zone.x + zone.width / 2, zone.y + zone.height / 2,
                zone.width, zone.height,
                { isSensor: true, isStatic: true, label: 'sand' }
            );
        });

        // Ice sensors
        this.iceZones.forEach(zone => {
            this.matter.add.rectangle(
                zone.x + zone.width / 2, zone.y + zone.height / 2,
                zone.width, zone.height,
                { isSensor: true, isStatic: true, label: 'ice' }
            );
        });

        // Hole sensor (the golf hole)
        if (this.holePosition) {
            this.holeSensor = this.matter.add.circle(
                this.holePosition.x, this.holePosition.y, 20,
                { isSensor: true, isStatic: true, label: 'hole' }
            );
        }
    }

    setupHazardCollisions() {
        this.matter.world.on('collisionstart', (event) => {
            event.pairs.forEach(pair => {
                const labels = [pair.bodyA.label, pair.bodyB.label];

                if (!labels.includes('ball')) return;

                if (labels.includes('water')) {
                    this.onWaterHazard();
                }
                if (labels.includes('sand')) {
                    this.ball.setInSand(true);
                    this.showStatus('Sand trap!');
                }
                if (labels.includes('ice')) {
                    this.ball.setOnIce(true);
                    this.showStatus('Ice!');
                }
            });
        });

        this.matter.world.on('collisionend', (event) => {
            event.pairs.forEach(pair => {
                const labels = [pair.bodyA.label, pair.bodyB.label];

                if (!labels.includes('ball')) return;

                if (labels.includes('sand')) {
                    this.ball.setInSand(false);
                }
                if (labels.includes('ice')) {
                    this.ball.setOnIce(false);
                }
            });
        });
    }

    onWaterHazard() {
        // Reset ball to spawn, add penalty stroke, award coins
        this.ball.strokes += PhysicsConfig.ball.waterResetPenalty;
        this.ball.reset(this.ballSpawn.x, this.ballSpawn.y);

        const gs = this.registry.get('gameState');
        if (gs) {
            gs.coins = (gs.coins || 0) + 10;
            this.registry.set('gameState', gs);
        }

        this.showStatus('Water! +1 penalty');
    }

    showStatus(message) {
        const text = this.add.text(
            this.cameras.main.worldView.centerX,
            this.cameras.main.worldView.centerY - 60,
            message,
            {
                fontFamily: 'Georgia, serif',
                fontSize: '24px',
                color: '#fff',
                stroke: '#000',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setDepth(200);

        this.tweens.add({
            targets: text,
            y: text.y - 40,
            alpha: 0,
            duration: 1500,
            onComplete: () => text.destroy()
        });
    }

    checkHoleCompletion() {
        if (this.holeComplete) return;

        const ball = this.ball.sprite;
        const dx = ball.position.x - this.holePosition.x;
        const dy = ball.position.y - this.holePosition.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = this.ball.getSpeed();

        if (dist < 40 && speed < PhysicsConfig.ball.holeSpeedThreshold) {
            this.holeComplete = true;
            this.onHoleComplete();
        }
    }

    onHoleComplete() {
        // Play applause sound
        if (this.cache.audio.exists('applause')) {
            this.sound.play('applause');
        }

        // Calculate score
        const strokes = this.ball.strokes;
        const par = this.holeConfig.par;
        const scoreDiff = strokes - par;
        const coinsEarned = Math.max(10, 50 - scoreDiff * 10);

        // Save to gameState
        const gs = this.registry.get('gameState') || {};
        if (!gs.scores) gs.scores = [];
        gs.scores[this.holeNumber - 1] = strokes;
        gs.coins = (gs.coins || 0) + coinsEarned;
        this.registry.set('gameState', gs);

        // Determine score label
        let label = `${strokes} strokes`;
        if (scoreDiff === 0) label = 'Par!';
        else if (scoreDiff === -1) label = 'Birdie!';
        else if (scoreDiff === -2) label = 'Eagle!';
        else if (scoreDiff <= -3) label = 'Albatross!';
        else if (scoreDiff === 1) label = 'Bogey';
        else if (scoreDiff === 2) label = 'Double Bogey';

        // Show completion overlay
        const cx = this.cameras.main.worldView.centerX;
        const cy = this.cameras.main.worldView.centerY;

        const overlay = this.add.rectangle(cx, cy, 300, 180, 0x000000, 0.7)
            .setDepth(300).setOrigin(0.5);

        const title = this.add.text(cx, cy - 50, 'Hole Complete!', {
            fontFamily: 'Georgia, serif',
            fontSize: '28px',
            color: '#ffd700',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(301);

        const scoreText = this.add.text(cx, cy, label, {
            fontFamily: 'Georgia, serif',
            fontSize: '22px',
            color: '#fff',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(301);

        const coinText = this.add.text(cx, cy + 35, `+${coinsEarned} coins`, {
            fontFamily: 'Georgia, serif',
            fontSize: '18px',
            color: '#ffd700',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(301);

        // Auto-advance after delay
        this.time.delayedCall(2500, () => {
            overlay.destroy();
            title.destroy();
            scoreText.destroy();
            coinText.destroy();

            const totalHoles = 9;
            if (this.holeNumber < totalHoles) {
                this.scene.restart({ hole: this.holeNumber + 1 });
            } else {
                this.scene.start('MenuScene');
            }
        });
    }

    checkOutOfBounds() {
        if (!this.ball || !this.map) return;
        const ballY = this.ball.sprite.position.y;
        if (ballY > this.map.heightInPixels + 50) {
            this.ball.strokes += 1;
            this.ball.reset(this.ballSpawn.x, this.ballSpawn.y);
            this.showStatus('Out of bounds! +1 penalty');
        }
    }

    update(time, delta) {
        if (this.player) this.player.update();
        if (this.ball) this.ball.update();

        // Check hazard/completion logic
        if (!this.holeComplete) {
            this.checkHoleCompletion();
            this.checkOutOfBounds();
        }

        const gs = this.registry.get('gameState');
        if (this.hud && this.player) {
            this.hud.update(this.holeConfig, this.player, gs);
        }
    }
}
