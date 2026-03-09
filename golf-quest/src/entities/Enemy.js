import { EquipmentData } from '../systems/EquipmentSystem.js';

/**
 * Sand Golem enemy with patrol, detection, projectile attacks,
 * and ball-damage handling.
 */
export class Enemy {
    constructor(scene, x, y, patrolWidth = 200) {
        this.scene = scene;

        // Create Matter sprite using 'enemy' spritesheet
        this.sprite = scene.matter.add.sprite(x, y, 'enemy', 0, {
            shape: { type: 'rectangle', width: 40, height: 48 },
            isStatic: true,
            label: 'enemy'
        });
        this.sprite.setDepth(10);
        this.sprite.setOrigin(0.5, 0.5);

        // Store reference back to this entity on the body for collision lookup
        this.sprite.body.enemyRef = this;

        // Patrol zone
        this.patrolLeft = x;
        this.patrolRight = x + patrolWidth;
        this.patrolDirection = 1; // 1 = right, -1 = left
        this.patrolSpeed = 1;

        // State machine: 'patrol', 'attack', 'cooldown', 'dead'
        this.state = 'patrol';

        // Health
        this.hp = 3;

        // Detection range
        this.detectionRange = 300;

        // Cooldown timer (in frames)
        this.cooldownTimer = 0;
        this.cooldownDuration = 150; // 120-180, use midpoint

        // Active projectiles
        this.projectiles = [];

        // Create animations
        this.createAnimations();

        // Start idle
        this.sprite.play('enemy-idle');
    }

    createAnimations() {
        const anims = this.scene.anims;

        if (!anims.exists('enemy-idle')) {
            anims.create({
                key: 'enemy-idle',
                frames: anims.generateFrameNumbers('enemy', { start: 0, end: 3 }),
                frameRate: 6,
                repeat: -1
            });
        }

        if (!anims.exists('enemy-throw')) {
            anims.create({
                key: 'enemy-throw',
                frames: anims.generateFrameNumbers('enemy', { start: 4, end: 5 }),
                frameRate: 8,
                repeat: 0
            });
        }

        if (!anims.exists('enemy-death')) {
            anims.create({
                key: 'enemy-death',
                frames: anims.generateFrameNumbers('enemy', { start: 6, end: 8 }),
                frameRate: 6,
                repeat: 0
            });
        }
    }

    /**
     * Get distance to the player sprite.
     */
    distanceToPlayer(player) {
        if (!player || !player.sprite || !player.alive) return Infinity;
        const ex = this.sprite.x;
        const ey = this.sprite.y;
        const px = player.sprite.x;
        const py = player.sprite.y;
        return Math.sqrt((ex - px) ** 2 + (ey - py) ** 2);
    }

    /**
     * Main update — handles state machine, patrol, detection, cooldown timer.
     */
    update(player) {
        if (this.state === 'dead') return;

        // Update projectiles
        this.updateProjectiles();

        const dist = this.distanceToPlayer(player);

        switch (this.state) {
            case 'patrol':
                this.doPatrol();
                if (dist < this.detectionRange) {
                    this.state = 'attack';
                    this.doAttack(player);
                }
                break;

            case 'attack':
                // Attack is handled via animation callback; wait for it
                break;

            case 'cooldown':
                this.cooldownTimer--;
                if (this.cooldownTimer <= 0) {
                    if (dist < this.detectionRange) {
                        this.state = 'attack';
                        this.doAttack(player);
                    } else {
                        this.state = 'patrol';
                    }
                }
                break;
        }
    }

    /**
     * Patrol: move horizontally between patrolLeft and patrolRight.
     */
    doPatrol() {
        const x = this.sprite.x + this.patrolSpeed * this.patrolDirection;
        this.sprite.setPosition(x, this.sprite.y);

        // Flip at boundaries
        if (x >= this.patrolRight) {
            this.patrolDirection = -1;
            this.sprite.setFlipX(true);
        } else if (x <= this.patrolLeft) {
            this.patrolDirection = 1;
            this.sprite.setFlipX(false);
        }

        // Sync the static Matter body position
        this.scene.matter.body.setPosition(this.sprite.body, {
            x: this.sprite.x,
            y: this.sprite.y
        });

        this.sprite.play('enemy-idle', true);
    }

    /**
     * Attack: play throw animation, then spawn projectile aimed at player.
     */
    doAttack(player) {
        // Face toward player
        if (player.sprite.x < this.sprite.x) {
            this.sprite.setFlipX(true);
        } else {
            this.sprite.setFlipX(false);
        }

        this.sprite.play('enemy-throw');

        this.sprite.once('animationcomplete-enemy-throw', () => {
            if (this.state === 'dead') return;
            this.spawnProjectile(player);
            this.state = 'cooldown';
            // Random cooldown between 120-180 frames
            this.cooldownTimer = 120 + Math.floor(Math.random() * 61);
        });
    }

    /**
     * Spawn a sand projectile aimed at the player position.
     */
    spawnProjectile(player) {
        if (!player || !player.sprite || !player.alive) return;

        const sx = this.sprite.x;
        const sy = this.sprite.y - 10; // launch from upper body
        const px = player.sprite.x;
        const py = player.sprite.y;

        const dx = px - sx;
        const dy = py - sy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return;

        const speed = 4.5; // 4-5 range
        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;

        const proj = this.scene.matter.add.image(sx, sy, 'projectile', null, {
            shape: { type: 'circle', radius: 8 },
            label: 'sandProjectile',
            isSensor: false,
            frictionAir: 0,
            restitution: 0
        });
        proj.setDepth(10);

        // Store velocity for manual movement (affected by gravity via Matter)
        this.scene.matter.body.setVelocity(proj.body, { x: vx, y: vy });

        // Store reference for cleanup
        proj.enemyOwner = this;
        this.projectiles.push(proj);
    }

    /**
     * Update projectiles — destroy those that have gone off-screen or hit the ground.
     */
    updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            if (!proj || !proj.body) {
                this.projectiles.splice(i, 1);
                continue;
            }

            // Destroy if off-screen or fallen far below map
            const mapHeight = this.scene.map ? this.scene.map.heightInPixels + 100 : 2000;
            if (proj.y > mapHeight || proj.x < -100 || proj.x > (this.scene.map ? this.scene.map.widthInPixels + 100 : 10000)) {
                this.destroyProjectile(proj, i);
            }
        }
    }

    destroyProjectile(proj, index) {
        if (proj && proj.body) {
            proj.destroy();
        }
        if (index !== undefined) {
            this.projectiles.splice(index, 1);
        } else {
            const idx = this.projectiles.indexOf(proj);
            if (idx !== -1) this.projectiles.splice(idx, 1);
        }
    }

    /**
     * Handle ball hitting this enemy. Reduces HP based on club damage.
     */
    takeBallDamage() {
        if (this.state === 'dead') return;

        // Determine club damage from equipment
        const equipment = this.scene.registry.get('equipment');
        const clubTier = equipment ? (equipment.club || 0) : 0;
        const damage = EquipmentData.club.damage[clubTier] || 1;

        this.hp -= damage;

        // Knockback visual
        this.scene.tweens.add({
            targets: this.sprite,
            x: this.sprite.x + (this.sprite.flipX ? 20 : -20),
            duration: 100,
            yoyo: true,
            ease: 'Power1'
        });

        if (this.hp <= 0) {
            this.die();
        }
    }

    /**
     * Play death animation, award coins, then destroy.
     */
    die() {
        this.state = 'dead';
        this.sprite.play('enemy-death');

        // Death particles
        if (this.scene.textures.exists('particle-brown')) {
            const emitter = this.scene.add.particles(this.sprite.x, this.sprite.y, 'particle-brown', {
                speed: { min: 30, max: 100 },
                scale: { start: 1.5, end: 0 },
                lifespan: 600,
                quantity: 20,
                emitting: false
            });
            emitter.explode();
            this.scene.time.delayedCall(700, () => emitter.destroy());
        }

        // Award 5 coins
        const gs = this.scene.registry.get('gameState') || {};
        gs.coins = (gs.coins || 0) + 5;
        this.scene.registry.set('gameState', gs);

        this.scene.showStatus('+5 coins!');

        this.sprite.once('animationcomplete-enemy-death', () => {
            this.destroy();
        });

        // Fallback destroy in case animation event doesn't fire
        this.scene.time.delayedCall(1000, () => {
            this.destroy();
        });
    }

    /**
     * Clean up sprite and any active projectiles.
     */
    destroy() {
        // Clean up projectiles
        for (const proj of this.projectiles) {
            if (proj && proj.body) {
                proj.destroy();
            }
        }
        this.projectiles = [];

        // Clean up sprite
        if (this.sprite && this.sprite.body) {
            this.sprite.destroy();
        }

        this.state = 'dead';
    }
}
