import { HoleConfig, SkyConfig } from '../config/HoleConfig.js';
import { PhysicsConfig } from '../systems/PhysicsConfig.js';
import { ScoreManager } from '../systems/ScoreManager.js';
import { BackgroundSystem } from '../systems/BackgroundSystem.js';
import { Player } from '../entities/Player.js';
import { Ball } from '../entities/Ball.js';
import { HUD } from '../ui/HUD.js';
import { MobileControls } from '../ui/MobileControls.js';
import { Enemy } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';

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

        // Create reusable particle textures
        this.createParticleTextures();

        // Set gravity for biome
        const biomePhysics = PhysicsConfig.biomes[config.biome];
        this.matter.world.setGravity(0, biomePhysics.gravity);

        // Sky & background system (gradient, stars, sun/moon, hills, clouds, rain)
        this.background = new BackgroundSystem(this, skyConfig, config.biome);

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

        // Draw golf hole and flag
        if (this.holePosition) {
            const hx = this.holePosition.x;
            const hy = this.holePosition.y;

            const holeGfx = this.add.graphics();
            // Dark hole (ellipse on ground)
            holeGfx.fillStyle(0x111111);
            holeGfx.fillEllipse(hx, hy, 30, 12);
            holeGfx.setDepth(1);

            // Flagpole
            holeGfx.lineStyle(2, 0xcccccc);
            holeGfx.beginPath();
            holeGfx.moveTo(hx, hy);
            holeGfx.lineTo(hx, hy - 60);
            holeGfx.strokePath();

            // Flag triangle (red)
            holeGfx.fillStyle(0xff3333);
            holeGfx.fillTriangle(hx, hy - 60, hx + 20, hy - 52, hx, hy - 44);
        }

        // Draw water zone visuals
        this.waterGraphics = [];
        this.waterZones.forEach(zone => {
            const waterGfx = this.add.graphics();
            waterGfx.setDepth(2);
            waterGfx.fillStyle(0x1a6ea0, 0.7);
            waterGfx.fillRect(zone.x, zone.y + 10, zone.width, zone.height - 10);
            this.waterGraphics.push({ gfx: waterGfx, zone: zone });
        });

        // Draw sand trap visuals
        this.sandZones.forEach(zone => {
            const sandGfx = this.add.graphics();
            sandGfx.fillStyle(0xD4A76A, 0.4);
            sandGfx.fillRect(zone.x, zone.y, zone.width, zone.height);
            sandGfx.setDepth(2);
        });

        // Hole completion state
        this.holeComplete = false;

        // Range finder zoom state
        this.isZoomedOut = false;

        // Create player at spawn point
        const gs = this.registry.get('gameState') || {};
        const activeCharacter = gs.activeCharacter || 'jj';
        const isPsychic = activeCharacter === 'patrick';
        const equipment = this.registry.get('equipment');
        this.player = new Player(this, this.playerSpawn.x, this.playerSpawn.y, activeCharacter);
        this.player.setEquipment(equipment);
        this.cameras.main.startFollow(this.player.sprite, false, 0.1, 0.1);

        // Create ball at spawn point
        this.ball = new Ball(this, this.ballSpawn.x, this.ballSpawn.y, isPsychic);

        // Set wind from biome config
        if (biomePhysics.wind !== 0) {
            this.ball.setWind(biomePhysics.wind);
        }

        // Set up hazard collision events
        this.setupHazardCollisions();

        // Spawn asteroids for space biome
        if (config.biome === 'space') {
            this.asteroids = [];
            this.asteroidZones.forEach(zone => {
                const count = 3 + Math.floor(Math.random() * 3); // 3-5
                for (let i = 0; i < count; i++) {
                    const x = zone.x + Math.random() * zone.width;
                    const y = zone.y + Math.random() * zone.height;
                    const ast = this.matter.add.sprite(x, y, 'asteroid');
                    ast.setCircle(15);
                    ast.setStatic(true);
                    ast.setBounce(0.8);
                    ast.startX = x;
                    ast.startY = y;
                    ast.phase = Math.random() * Math.PI * 2;
                    ast.amplitude = 30 + Math.random() * 50;
                    this.asteroids.push(ast);
                }
            });
        }

        // Spawn enemies from tilemap object layer
        this.enemies = [];
        this.enemySpawns.forEach(spawn => {
            const enemy = new Enemy(this, spawn.x, spawn.y, spawn.patrolWidth);
            this.enemies.push(enemy);
        });

        // Set up enemy collision detection (ball-enemy and projectile-player)
        this.setupEnemyCollisions();

        // Spawn boss for hole 9
        this.boss = null;
        if (this.holeConfig.hasBoss && this.bossSpawn) {
            this.boss = new Boss(this, this.bossSpawn.x, this.bossSpawn.y);
            this.setupBossCollisions();
        }

        // Mobile controls
        this.mobileControls = new MobileControls(this);
        this.player.mobileControls = this.mobileControls;

        // HUD overlay
        this.hud = new HUD(this);

        // Scene fade-in transition
        this.cameras.main.fadeIn(500, 0, 0, 0);
    }

    createParticleTextures() {
        const colors = {
            'particle-white': 0xffffff,
            'particle-gold': 0xc9a84c,
            'particle-red': 0xff3333,
            'particle-green': 0x40916c,
            'particle-purple': 0x8B00FF,
            'particle-brown': 0x8B6914
        };

        for (const [key, color] of Object.entries(colors)) {
            if (!this.textures.exists(key)) {
                const g = this.make.graphics({ add: false });
                g.fillStyle(color);
                g.fillCircle(4, 4, 4);
                g.generateTexture(key, 8, 8);
                g.destroy();
            }
        }
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

    setupEnemyCollisions() {
        this.matter.world.on('collisionstart', (event) => {
            event.pairs.forEach(pair => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;
                const labels = [bodyA.label, bodyB.label];

                // Ball hitting an enemy
                if (labels.includes('ball') && labels.includes('enemy')) {
                    const enemyBody = bodyA.label === 'enemy' ? bodyA : bodyB;
                    if (enemyBody.enemyRef) {
                        enemyBody.enemyRef.takeBallDamage();
                    }
                }

                // Sand projectile hitting player
                if (labels.includes('sandProjectile') && labels.includes('player')) {
                    if (this.player) {
                        this.player.takeDamage(1);
                    }
                    // Destroy the projectile
                    const projBody = bodyA.label === 'sandProjectile' ? bodyA : bodyB;
                    const projGO = projBody.gameObject;
                    if (projGO && projGO.enemyOwner) {
                        projGO.enemyOwner.destroyProjectile(projGO);
                    } else if (projGO) {
                        projGO.destroy();
                    }
                }

                // Sand projectile hitting ground (static tile bodies)
                if (labels.includes('sandProjectile')) {
                    const otherLabel = bodyA.label === 'sandProjectile' ? bodyB.label : bodyA.label;
                    if (otherLabel !== 'player' && otherLabel !== 'ball' && otherLabel !== 'enemy') {
                        const projBody = bodyA.label === 'sandProjectile' ? bodyA : bodyB;
                        const projGO = projBody.gameObject;
                        if (projGO && projGO.enemyOwner) {
                            projGO.enemyOwner.destroyProjectile(projGO);
                        } else if (projGO) {
                            projGO.destroy();
                        }
                    }
                }
            });
        });
    }

    setupBossCollisions() {
        this.matter.world.on('collisionstart', (event) => {
            event.pairs.forEach(pair => {
                const labels = [pair.bodyA.label, pair.bodyB.label];

                if (!labels.includes('ball')) return;
                if (!this.boss || this.boss.dead) return;

                if (labels.includes('bossWeakPoint') && this.boss.weakPointActive) {
                    this.boss.takeDamage(5, true);
                } else if (labels.includes('bossBody')) {
                    this.boss.takeDamage(1, false);
                }
            });
        });
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
        const parLabel = ScoreManager.getParLabel(strokes, par);
        const coinsEarned = Math.max(1, 5 - Math.max(0, strokes - par));

        // Save to gameState
        const gs = this.registry.get('gameState') || {};
        if (!gs.scores) gs.scores = [];
        gs.scores.push(strokes);
        gs.coins = (gs.coins || 0) + coinsEarned;
        this.registry.set('gameState', gs);

        // Show completion overlay
        const { width, height } = this.cameras.main;
        const cx = width / 2;
        const cy = height / 2;

        // Semi-transparent black overlay covering the full screen
        const overlay = this.add.rectangle(cx, cy, width, height, 0x000000, 0.6)
            .setDepth(300).setScrollFactor(0);

        // "Hole Complete!" title
        this.add.text(cx, cy - 80, 'Hole Complete!', {
            fontFamily: 'Georgia, serif',
            fontSize: '32px',
            color: '#ffd700',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(301).setScrollFactor(0);

        // Par performance label
        this.add.text(cx, cy - 40, parLabel, {
            fontFamily: 'Georgia, serif',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(301).setScrollFactor(0);

        // Strokes this hole
        this.add.text(cx, cy - 10, `${strokes} stroke${strokes !== 1 ? 's' : ''} (par ${par})  +${coinsEarned} coins`, {
            fontFamily: 'Georgia, serif',
            fontSize: '18px',
            color: '#ffffff',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(301).setScrollFactor(0);

        // Buttons depend on which hole was just completed
        if (this.holeNumber === 9) {
            // Final hole — Victory
            this.createOverlayButton(cx, cy + 50, 'Victory!', () => {
                this.scene.start('CinematicScene', { type: 'ending' });
            });
        } else if (this.holeNumber === 8) {
            // Hole 8 — Launch to Space
            this.createOverlayButton(cx, cy + 50, 'Launch to Space!', () => {
                gs.strokes = 0;
                this.registry.set('gameState', gs);
                this.scene.start('CinematicScene', { type: 'space-launch', nextHole: 9 });
            });
        } else {
            // Holes 1-7 — Next Hole + Visit Shop
            this.createOverlayButton(cx - 110, cy + 50, 'Next Hole', () => {
                gs.strokes = 0;
                this.registry.set('gameState', gs);
                this.scene.start('HoleScene', { hole: this.holeNumber + 1 });
            });

            this.createOverlayButton(cx + 110, cy + 50, 'Visit Shop', () => {
                gs.strokes = 0;
                this.registry.set('gameState', gs);
                this.scene.start('ShopScene', { nextHole: this.holeNumber + 1 });
            });
        }
    }

    createOverlayButton(x, y, label, onClick) {
        const btnW = 180;
        const btnH = 44;

        const btnBg = this.add.graphics().setDepth(302).setScrollFactor(0);
        btnBg.fillStyle(0xc9a84c, 1);
        btnBg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 6);

        const btnText = this.add.text(x, y, label, {
            fontFamily: 'Georgia, serif',
            fontSize: '20px',
            color: '#1a472a'
        }).setOrigin(0.5).setDepth(303).setScrollFactor(0);

        const hitZone = this.add.zone(x, y, btnW, btnH)
            .setInteractive({ useHandCursor: true })
            .setDepth(304).setScrollFactor(0);

        hitZone.on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(0xe0c872, 1);
            btnBg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 6);
        });

        hitZone.on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(0xc9a84c, 1);
            btnBg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 6);
        });

        hitZone.on('pointerdown', onClick);
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
        if (this.background) this.background.update(time);
        if (this.player) this.player.update();
        if (this.ball) this.ball.update();

        // Update enemies
        if (this.enemies) {
            this.enemies.forEach(e => e.update(this.player));
        }

        // Update boss
        if (this.boss) {
            this.boss.update(time, this.player, this.ball);
        }

        // Check hazard/completion logic
        if (!this.holeComplete) {
            this.checkHoleCompletion();
            this.checkOutOfBounds();
        }

        // Animate water surface waves
        if (this.waterGraphics && this.waterGraphics.length > 0) {
            this.waterGraphics.forEach(({ gfx, zone }) => {
                gfx.clear();
                gfx.fillStyle(0x1a6ea0, 0.7);
                gfx.fillRect(zone.x, zone.y + 10, zone.width, zone.height - 10);
                // Wave top
                gfx.lineStyle(3, 0x3399cc, 0.8);
                gfx.beginPath();
                for (let x = zone.x; x < zone.x + zone.width; x += 4) {
                    const y = zone.y + Math.sin((x + time * 0.003) * 0.05) * 4;
                    if (x === zone.x) gfx.moveTo(x, y);
                    else gfx.lineTo(x, y);
                }
                gfx.strokePath();
            });
        }

        // Drift asteroids sinusoidally
        if (this.asteroids) {
            this.asteroids.forEach(ast => {
                const newX = ast.startX + Math.sin(time * 0.001 + ast.phase) * ast.amplitude;
                const newY = ast.startY + Math.cos(time * 0.0008 + ast.phase) * ast.amplitude * 0.5;
                ast.setPosition(newX, newY);
            });
        }

        // Range finder: hold Down key to zoom out and see full course
        const isDown = this.input.keyboard.addKey('S').isDown ||
            this.input.keyboard.addKey('DOWN').isDown ||
            (this.mobileControls && this.mobileControls.getMovement().down);

        if (isDown && !this.isZoomedOut) {
            this.isZoomedOut = true;
            this.tweens.add({
                targets: this.cameras.main,
                zoom: 0.4,
                duration: 500,
                ease: 'Quad.easeOut'
            });
        } else if (!isDown && this.isZoomedOut) {
            this.isZoomedOut = false;
            this.tweens.add({
                targets: this.cameras.main,
                zoom: 1,
                duration: 500,
                ease: 'Quad.easeOut'
            });
        }

        const gs = this.registry.get('gameState');
        // Keep gameState.strokes in sync with ball.strokes so HUD displays correctly
        if (gs && this.ball) {
            gs.strokes = this.ball.strokes;
        }
        const windActive = PhysicsConfig.biomes[this.holeConfig.biome].wind !== 0;
        if (this.hud && this.player) {
            this.hud.update(this.holeConfig, this.player, gs, windActive);
        }
    }
}
