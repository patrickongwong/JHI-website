import { PhysicsConfig } from '../systems/PhysicsConfig.js';

/**
 * Player entity with Matter.js body, WASD/arrow movement, jumping,
 * ground detection, animations, health, and equipment-based stats.
 */
export class Player {
    constructor(scene, x, y, character = 'jj') {
        this.scene = scene;
        this.character = character;

        const p = PhysicsConfig.player;

        // Create Matter.js sprite
        this.sprite = scene.matter.add.sprite(x, y, character, 0, {
            shape: { type: 'rectangle', width: p.width, height: p.height },
            fixedRotation: true,
            restitution: 0,
            frictionAir: p.frictionAir,
            label: 'player'
        });
        this.sprite.setDepth(10);
        this.sprite.setOrigin(0.5, 0.5);

        // Movement config
        this.speed = p.speed;
        this.jumpForce = p.jumpForce;

        // Ground / jump state
        this.isGrounded = false;
        this.maxJumps = 1;
        this.jumpsRemaining = this.maxJumps;

        // Health state
        this.maxHealth = 3;
        this.health = this.maxHealth;
        this.invincible = false;
        this.alive = true;

        // Stroke penalty applied on KO
        this.koPenalty = 1;

        // Input
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keys = scene.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.justJumped = false;

        // Create animations (only if they don't already exist)
        this.createAnimations();

        // Psychic aura for Patrick
        if (this.character === 'patrick') {
            this.createPsychicAura();
        }

        // Start idle
        this.sprite.play(`${this.character}-idle`);

        // Ground detection via collision events
        this.setupCollisionDetection();
    }

    createAnimations() {
        const anims = this.scene.anims;

        // JJ animations
        if (!anims.exists('jj-idle')) {
            anims.create({
                key: 'jj-idle',
                frames: anims.generateFrameNumbers('jj', { start: 0, end: 3 }),
                frameRate: 6,
                repeat: -1
            });
        }

        if (!anims.exists('jj-walk')) {
            anims.create({
                key: 'jj-walk',
                frames: anims.generateFrameNumbers('jj', { start: 4, end: 9 }),
                frameRate: 10,
                repeat: -1
            });
        }

        if (!anims.exists('jj-jump')) {
            anims.create({
                key: 'jj-jump',
                frames: anims.generateFrameNumbers('jj', { start: 10, end: 11 }),
                frameRate: 6,
                repeat: 0
            });
        }

        if (!anims.exists('jj-swing')) {
            anims.create({
                key: 'jj-swing',
                frames: anims.generateFrameNumbers('jj', { start: 12, end: 15 }),
                frameRate: 12,
                repeat: 0
            });
        }

        if (!anims.exists('jj-hurt')) {
            anims.create({
                key: 'jj-hurt',
                frames: anims.generateFrameNumbers('jj', { start: 16, end: 17 }),
                frameRate: 8,
                repeat: 0
            });
        }

        // Patrick animations
        if (!anims.exists('patrick-idle')) {
            anims.create({
                key: 'patrick-idle',
                frames: anims.generateFrameNumbers('patrick', { start: 0, end: 3 }),
                frameRate: 6,
                repeat: -1
            });
        }

        if (!anims.exists('patrick-walk')) {
            anims.create({
                key: 'patrick-walk',
                frames: anims.generateFrameNumbers('patrick', { start: 4, end: 9 }),
                frameRate: 10,
                repeat: -1
            });
        }

        if (!anims.exists('patrick-jump')) {
            anims.create({
                key: 'patrick-jump',
                frames: anims.generateFrameNumbers('patrick', { start: 10, end: 11 }),
                frameRate: 6,
                repeat: 0
            });
        }

        if (!anims.exists('patrick-swing')) {
            anims.create({
                key: 'patrick-swing',
                frames: anims.generateFrameNumbers('patrick', { start: 12, end: 15 }),
                frameRate: 12,
                repeat: 0
            });
        }

        if (!anims.exists('patrick-hurt')) {
            anims.create({
                key: 'patrick-hurt',
                frames: anims.generateFrameNumbers('patrick', { start: 16, end: 17 }),
                frameRate: 8,
                repeat: 0
            });
        }

        if (!anims.exists('patrick-psychic')) {
            anims.create({
                key: 'patrick-psychic',
                frames: anims.generateFrameNumbers('patrick', { start: 18, end: 19 }),
                frameRate: 4,
                repeat: -1
            });
        }
    }

    createPsychicAura() {
        // Purple particle emitter attached to sprite for psychic aura
        this.psychicEmitter = this.scene.add.particles(0, 0, 'particle-purple', {
            x: 0,
            y: 0,
            follow: this.sprite,
            speed: { min: 5, max: 15 },
            angle: { min: 250, max: 290 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 0.6, end: 0 },
            lifespan: 600,
            frequency: 80,
            tint: [0x9b59b6, 0x8e44ad, 0x7d3c98],
            blendMode: 'ADD',
            emitting: true
        });
        this.psychicEmitter.setDepth(9);
    }

    setupCollisionDetection() {
        this.scene.matter.world.on('collisionstart', (event) => {
            for (const pair of event.pairs) {
                if (!this.isPlayerBody(pair)) continue;

                const playerBody = pair.bodyA === this.sprite.body ? pair.bodyA : pair.bodyB;
                const otherBody = pair.bodyA === this.sprite.body ? pair.bodyB : pair.bodyA;

                // Check if collision is from below (player landing on top of something)
                if (this.isTileBody(otherBody) && playerBody.position.y < otherBody.position.y) {
                    this.isGrounded = true;
                    this.jumpsRemaining = this.maxJumps;
                }
            }
        });

        this.scene.matter.world.on('collisionend', (event) => {
            for (const pair of event.pairs) {
                if (!this.isPlayerBody(pair)) continue;

                const playerBody = pair.bodyA === this.sprite.body ? pair.bodyA : pair.bodyB;
                const otherBody = pair.bodyA === this.sprite.body ? pair.bodyB : pair.bodyA;

                if (this.isTileBody(otherBody) && playerBody.position.y < otherBody.position.y) {
                    this.isGrounded = false;
                }
            }
        });
    }

    isPlayerBody(pair) {
        return pair.bodyA === this.sprite.body || pair.bodyB === this.sprite.body;
    }

    isTileBody(body) {
        // Tilemap bodies created by convertTilemapLayer are static and have
        // a gameObject that is a Tile, or they have the 'Body' label pattern.
        // Static bodies from tilemaps have isStatic = true.
        return body.isStatic && body.label !== 'player';
    }

    /**
     * Apply equipment stats from the equipment object { club, shaft, boots, shirt }.
     * Tier indices: 0 = base tier.
     */
    setEquipment(equipment) {
        if (!equipment) return;

        // Boots determine max jumps: tier 0 = 1, tier 1 = 2, tier 2 = 3, tier 3 = 999 (infinite)
        const bootsJumps = [1, 2, 3, 999];
        const bootsTier = equipment.boots || 0;
        this.maxJumps = bootsJumps[Math.min(bootsTier, bootsJumps.length - 1)];
        this.jumpsRemaining = this.maxJumps;

        // Shirt determines max health: tier 0 = 2, tier 1 = 3, tier 2 = 4, tier 3 = 6
        const shirtHealth = [2, 3, 4, 6];
        const shirtTier = equipment.shirt || 0;
        this.maxHealth = shirtHealth[Math.min(shirtTier, shirtHealth.length - 1)];
        this.health = this.maxHealth;
    }

    update() {
        if (!this.alive) return;

        const body = this.sprite.body;
        const velocity = body.velocity;

        // Horizontal movement
        let moveX = 0;
        if (this.cursors.left.isDown || this.keys.a.isDown) {
            moveX = -this.speed;
        } else if (this.cursors.right.isDown || this.keys.d.isDown) {
            moveX = this.speed;
        }

        // Check mobile input alongside keyboard
        if (this.mobileControls && this.mobileControls.isMobile) {
            const mv = this.mobileControls.getMovement();
            if (mv.x !== 0) moveX = mv.x * this.speed;
            if (this.mobileControls.consumeJump() && this.jumpsRemaining > 0) {
                this.sprite.setVelocityY(this.jumpForce);
                this.jumpsRemaining--;
                this.isGrounded = false;
            }
        }

        // Apply horizontal velocity (preserve vertical from gravity)
        this.sprite.setVelocityX(moveX);

        // Flip sprite based on direction
        if (moveX < 0) {
            this.sprite.setFlipX(true);
        } else if (moveX > 0) {
            this.sprite.setFlipX(false);
        }

        // Jump
        const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                            Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
                            Phaser.Input.Keyboard.JustDown(this.keys.w);

        if (jumpPressed && this.jumpsRemaining > 0) {
            this.sprite.setVelocityY(this.jumpForce);
            this.jumpsRemaining--;
            this.isGrounded = false;
        }

        // Animations (don't interrupt hurt or swing)
        const currentAnim = this.sprite.anims.currentAnim;
        const isPlaying = this.sprite.anims.isPlaying;
        const animKey = currentAnim ? currentAnim.key : '';

        if (animKey === `${this.character}-hurt` && isPlaying) return;
        if (animKey === `${this.character}-swing` && isPlaying) return;
        if (animKey === `${this.character}-psychic` && isPlaying) return;

        if (!this.isGrounded) {
            this.sprite.play(`${this.character}-jump`, true);
        } else if (moveX !== 0) {
            this.sprite.play(`${this.character}-walk`, true);
        } else {
            this.sprite.play(`${this.character}-idle`, true);
        }
    }

    /**
     * Deal damage to the player. Respects invincibility frames.
     */
    takeDamage(amount = 1) {
        if (this.invincible || !this.alive) return;

        this.health -= amount;
        this.sprite.play(`${this.character}-hurt`);

        // Damage particles
        if (this.scene.textures.exists('particle-red')) {
            const emitter = this.scene.add.particles(this.sprite.x, this.sprite.y, 'particle-red', {
                speed: { min: 20, max: 80 },
                scale: { start: 1, end: 0 },
                lifespan: 300,
                quantity: 10,
                emitting: false
            });
            emitter.explode();
            this.scene.time.delayedCall(400, () => emitter.destroy());
        }

        if (this.health <= 0) {
            this.ko();
            return;
        }

        // Invincibility frames
        this.invincible = true;
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: { from: 0.3, to: 1 },
            duration: 150,
            repeat: 5, // ~900ms total
            yoyo: true,
            onComplete: () => {
                this.invincible = false;
                this.sprite.setAlpha(1);
            }
        });
    }

    /**
     * Handle KO: reset health, add stroke penalty, respawn.
     */
    ko() {
        this.alive = false;
        this.sprite.setVelocity(0, 0);
        this.sprite.play(`${this.character}-hurt`);

        // Add stroke penalty
        const strokes = this.scene.registry.get('strokes') || 0;
        this.scene.registry.set('strokes', strokes + this.koPenalty);

        // Respawn after a short delay
        this.scene.time.delayedCall(800, () => {
            const spawn = this.scene.playerSpawn;
            this.sprite.setPosition(spawn.x, spawn.y);
            this.sprite.setVelocity(0, 0);
            this.health = this.maxHealth;
            this.alive = true;
            this.invincible = true;
            this.sprite.setAlpha(1);

            // Brief invincibility after respawn
            this.scene.tweens.add({
                targets: this.sprite,
                alpha: { from: 0.3, to: 1 },
                duration: 150,
                repeat: 5,
                yoyo: true,
                onComplete: () => {
                    this.invincible = false;
                    this.sprite.setAlpha(1);
                }
            });
        });
    }

    /**
     * Play the swing animation (used when hitting the ball).
     */
    swing() {
        this.sprite.play(`${this.character}-swing`);
    }

    /**
     * Clean up input and listeners.
     */
    destroy() {
        if (this.psychicEmitter) {
            this.psychicEmitter.destroy();
        }
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}
