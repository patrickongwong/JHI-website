/**
 * Boss Entity — Lunar Dragon
 *
 * Three-phase boss fight for hole 9. The dragon cycles through dive bomb,
 * breath attack, and tail slam patterns. The weak point (glowing mouth)
 * appears during the breath attack for bonus damage.
 */
export class Boss {
    constructor(scene, x, y) {
        this.scene = scene;
        this.startX = x;
        this.startY = y;

        // Create sprite from boss spritesheet (128x128 frames)
        this.sprite = scene.add.sprite(x, y, 'boss', 0);
        this.sprite.setDepth(15);
        this.sprite.setOrigin(0.5, 0.5);

        // HP
        this.maxHP = 20;
        this.hp = this.maxHP;

        // State machine
        this.state = 'idle';
        this.phase = 1;
        this.attackIndex = 0;
        this.attackTimer = 0;
        this.attackCooldown = 3000; // ms between attacks
        this.weakPointActive = false;
        this.dead = false;

        // Weak point sensor (Matter circle, created once, repositioned each frame)
        this.weakPointSensor = scene.matter.add.circle(x, y - 30, 30, {
            isSensor: true,
            isStatic: true,
            label: 'bossWeakPoint'
        });

        // Boss body sensor for general contact damage
        this.bodySensor = scene.matter.add.rectangle(x, y, 80, 80, {
            isSensor: true,
            isStatic: true,
            label: 'bossBody'
        });

        // Weak point visual (pulsing glow)
        this.weakPointGfx = scene.add.graphics();
        this.weakPointGfx.setDepth(16);

        // Health bar graphics
        this.healthBarGfx = scene.add.graphics();
        this.healthBarGfx.setDepth(20);

        // Ice patches spawned by breath attacks
        this.icePatches = [];

        // Mini-asteroids spawned in phase 3
        this.asteroids = [];

        // Create animations
        this.createAnimations();
        this.sprite.play('boss-idle');
    }

    createAnimations() {
        const anims = this.scene.anims;

        if (!anims.exists('boss-idle')) {
            anims.create({
                key: 'boss-idle',
                frames: anims.generateFrameNumbers('boss', { start: 0, end: 3 }),
                frameRate: 6,
                repeat: -1
            });
        }

        if (!anims.exists('boss-dive')) {
            anims.create({
                key: 'boss-dive',
                frames: anims.generateFrameNumbers('boss', { start: 4, end: 6 }),
                frameRate: 10,
                repeat: 0
            });
        }

        if (!anims.exists('boss-breath')) {
            anims.create({
                key: 'boss-breath',
                frames: anims.generateFrameNumbers('boss', { start: 7, end: 9 }),
                frameRate: 6,
                repeat: 0
            });
        }

        if (!anims.exists('boss-slam')) {
            anims.create({
                key: 'boss-slam',
                frames: anims.generateFrameNumbers('boss', { start: 10, end: 11 }),
                frameRate: 8,
                repeat: 0
            });
        }

        if (!anims.exists('boss-hurt')) {
            anims.create({
                key: 'boss-hurt',
                frames: anims.generateFrameNumbers('boss', { start: 12, end: 14 }),
                frameRate: 8,
                repeat: 0
            });
        }
    }

    // ─── Phase determination ────────────────────────────────────────────

    getPhase() {
        const pct = this.hp / this.maxHP;
        if (pct > 0.6) return 1;
        if (pct > 0.3) return 2;
        return 3;
    }

    getAttackSequence() {
        if (this.phase === 1) return ['dive', 'breath'];
        if (this.phase === 2) return ['dive', 'breath', 'slam'];
        return ['dive', 'breath', 'slam'];
    }

    getCooldown() {
        if (this.phase === 3) return 1800;
        if (this.phase === 2) return 2500;
        return 3000;
    }

    // ─── Update loop ────────────────────────────────────────────────────

    update(time, player, ball) {
        if (this.dead) return;

        // Update phase
        this.phase = this.getPhase();

        // Phase 3 red pulsing tint
        if (this.phase === 3 && !this._redTween) {
            this._redTween = this.scene.tweens.add({
                targets: this.sprite,
                alpha: { from: 1, to: 0.6 },
                duration: 400,
                yoyo: true,
                repeat: -1
            });
            this.sprite.setTint(0xff4444);
        }

        // State machine
        switch (this.state) {
            case 'idle':
                this.updateIdle(time, player, ball);
                break;
            case 'diving':
            case 'breathing':
            case 'slamming':
            case 'hurt':
                // These states are driven by tweens / timers — just wait
                break;
        }

        // Move sensors to sprite position
        this.scene.matter.body.setPosition(this.bodySensor, {
            x: this.sprite.x,
            y: this.sprite.y
        });

        const wpX = this.sprite.x + (this.sprite.flipX ? -30 : 30);
        const wpY = this.sprite.y - 10;
        this.scene.matter.body.setPosition(this.weakPointSensor, { x: wpX, y: wpY });

        // Draw weak point glow
        this.weakPointGfx.clear();
        if (this.weakPointActive) {
            const pulse = 0.5 + 0.5 * Math.sin(time * 0.008);
            this.weakPointGfx.fillStyle(0xffff66, pulse);
            this.weakPointGfx.fillCircle(wpX, wpY, 20);
            this.weakPointGfx.fillStyle(0xffffff, pulse * 0.5);
            this.weakPointGfx.fillCircle(wpX, wpY, 10);
        }

        // Phase 3: spawn mini-asteroids during idle
        if (this.phase === 3 && this.state === 'idle' && Math.random() < 0.02) {
            this.spawnAsteroid();
        }

        // Update asteroids
        this.updateAsteroids();

        // Clean expired ice patches
        this.cleanIcePatches(time);

        // Health bar
        this.drawHealthBar();

        // Contact damage: boss body hurts player
        if (player && player.alive) {
            const dx = player.sprite.x - this.sprite.x;
            const dy = player.sprite.y - this.sprite.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 50 && (this.state === 'diving' || this.state === 'slamming')) {
                player.takeDamage(2);
            }
        }
    }

    updateIdle(time, player, ball) {
        if (!this.attackTimer) {
            this.attackTimer = time + this.getCooldown();
        }

        if (time >= this.attackTimer) {
            const seq = this.getAttackSequence();
            const attack = seq[this.attackIndex % seq.length];
            this.attackIndex++;
            this.attackTimer = 0;

            switch (attack) {
                case 'dive':
                    this.startDive(player);
                    break;
                case 'breath':
                    this.startBreath();
                    break;
                case 'slam':
                    this.startSlam(player);
                    break;
            }
        }
    }

    // ─── Dive bomb ──────────────────────────────────────────────────────

    startDive(player) {
        this.state = 'diving';
        this.sprite.play('boss-dive');

        const targetY = player ? player.sprite.y : this.startY + 100;
        const speed = this.phase >= 2 ? 600 : 1000;

        // Swoop from left side to right side at player height
        const mapWidth = this.scene.map ? this.scene.map.widthInPixels : 1280;

        this.scene.tweens.add({
            targets: this.sprite,
            x: { from: -64, to: mapWidth + 64 },
            y: targetY,
            duration: speed,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                // Return to hover position
                this.sprite.setPosition(this.startX, this.startY);
                this.sprite.play('boss-idle');
                this.state = 'idle';
            }
        });
    }

    // ─── Breath attack ──────────────────────────────────────────────────

    startBreath() {
        this.state = 'breathing';
        this.sprite.play('boss-breath');
        this.weakPointActive = true;

        const weakDuration = this.phase === 3 ? 800 : 1500;

        // Weak point window
        this.scene.time.delayedCall(weakDuration, () => {
            this.weakPointActive = false;
        });

        // Spawn ice patches after short delay (mouth opens)
        this.scene.time.delayedCall(400, () => {
            this.spawnIcePatches();
        });

        // Return to idle after breath animation completes
        const totalDuration = this.phase === 3 ? 1200 : 2000;
        this.scene.time.delayedCall(totalDuration, () => {
            if (this.dead) return;
            this.sprite.play('boss-idle');
            this.state = 'idle';
        });
    }

    spawnIcePatches() {
        const count = this.phase >= 2 ? 2 : 1;
        const patchW = this.phase >= 2 ? 120 : 80;
        const patchH = 20;
        const now = this.scene.time.now;

        for (let i = 0; i < count; i++) {
            const px = this.sprite.x + (this.sprite.flipX ? -1 : 1) * (60 + i * 100);
            const py = this.sprite.y + 80;

            // Visual
            const gfx = this.scene.add.graphics();
            gfx.fillStyle(0x88ccff, 0.5);
            gfx.fillRect(px - patchW / 2, py - patchH / 2, patchW, patchH);
            gfx.setDepth(5);

            // Matter sensor
            const sensor = this.scene.matter.add.rectangle(px, py, patchW, patchH, {
                isSensor: true,
                isStatic: true,
                label: 'ice'
            });

            this.icePatches.push({
                gfx,
                sensor,
                expireTime: now + 10000
            });
        }
    }

    cleanIcePatches(time) {
        const now = this.scene.time.now;
        this.icePatches = this.icePatches.filter(patch => {
            if (now >= patch.expireTime) {
                patch.gfx.destroy();
                this.scene.matter.world.remove(patch.sensor);
                return false;
            }
            return true;
        });
    }

    // ─── Tail slam ──────────────────────────────────────────────────────

    startSlam(player) {
        this.state = 'slamming';
        this.sprite.play('boss-slam');

        const targetX = player ? player.sprite.x : this.startX;
        const targetY = player ? player.sprite.y - 120 : this.startY;

        // Fly above player then slam down
        this.scene.tweens.add({
            targets: this.sprite,
            x: targetX,
            y: targetY,
            duration: 400,
            ease: 'Quad.easeIn',
            onComplete: () => {
                // Slam down
                this.scene.tweens.add({
                    targets: this.sprite,
                    y: targetY + 120,
                    duration: 200,
                    ease: 'Quad.easeIn',
                    onComplete: () => {
                        this.createShockwave(this.sprite.x, this.sprite.y);

                        // Return to hover
                        this.scene.tweens.add({
                            targets: this.sprite,
                            x: this.startX,
                            y: this.startY,
                            duration: 600,
                            ease: 'Quad.easeOut',
                            onComplete: () => {
                                if (this.dead) return;
                                this.sprite.play('boss-idle');
                                this.state = 'idle';
                            }
                        });
                    }
                });
            }
        });
    }

    createShockwave(x, y) {
        // Camera shake
        this.scene.cameras.main.shake(200, 0.01);

        // Visual expanding ring
        const ring = this.scene.add.graphics();
        ring.setDepth(8);
        let radius = 10;

        const ringTimer = this.scene.time.addEvent({
            delay: 30,
            repeat: 15,
            callback: () => {
                radius += 12;
                ring.clear();
                ring.lineStyle(3, 0xffffff, 1 - radius / 200);
                ring.strokeCircle(x, y, radius);
            }
        });

        // Shockwave sensor (damages grounded player)
        const sensor = this.scene.matter.add.circle(x, y, 10, {
            isSensor: true,
            isStatic: true,
            label: 'shockwave'
        });

        // Expand sensor and check player proximity
        let shockRadius = 10;
        const expandTimer = this.scene.time.addEvent({
            delay: 30,
            repeat: 15,
            callback: () => {
                shockRadius += 12;
                const player = this.scene.player;
                if (player && player.alive && player.isGrounded) {
                    const dx = player.sprite.x - x;
                    const dy = player.sprite.y - y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < shockRadius && dist > shockRadius - 15) {
                        player.takeDamage(2);
                    }
                }
            }
        });

        // Cleanup
        this.scene.time.delayedCall(600, () => {
            ring.destroy();
            this.scene.matter.world.remove(sensor);
        });
    }

    // ─── Mini-asteroids (Phase 3) ───────────────────────────────────────

    spawnAsteroid() {
        const x = this.sprite.x + Phaser.Math.Between(-200, 200);
        const y = this.sprite.y - 60;
        const gfx = this.scene.add.graphics();
        gfx.fillStyle(0x888888, 0.8);
        gfx.fillCircle(0, 0, 8);
        gfx.setPosition(x, y);
        gfx.setDepth(7);

        this.asteroids.push({ gfx, x, y, vy: 1.5 });
    }

    updateAsteroids() {
        const player = this.scene.player;
        const mapH = this.scene.map ? this.scene.map.heightInPixels : 600;

        this.asteroids = this.asteroids.filter(ast => {
            ast.y += ast.vy;
            ast.gfx.setPosition(ast.x, ast.y);

            // Damage player on contact
            if (player && player.alive) {
                const dx = player.sprite.x - ast.x;
                const dy = player.sprite.y - ast.y;
                if (Math.sqrt(dx * dx + dy * dy) < 20) {
                    player.takeDamage(1);
                    ast.gfx.destroy();
                    return false;
                }
            }

            // Remove if off screen
            if (ast.y > mapH + 50) {
                ast.gfx.destroy();
                return false;
            }
            return true;
        });
    }

    // ─── Damage & Death ─────────────────────────────────────────────────

    takeDamage(amount, isWeakPoint = false) {
        if (this.dead) return;
        if (this.state === 'hurt') return;

        const dmg = isWeakPoint ? 5 : amount;
        this.hp = Math.max(0, this.hp - dmg);

        // Flash tween
        const prevState = this.state;
        this.state = 'hurt';
        this.sprite.play('boss-hurt');

        this.scene.tweens.add({
            targets: this.sprite,
            alpha: { from: 0.3, to: 1 },
            duration: 100,
            repeat: 3,
            yoyo: true,
            onComplete: () => {
                if (this.dead) return;
                this.sprite.setAlpha(1);
                this.state = 'idle';
                this.sprite.play('boss-idle');
            }
        });

        // Status message
        this.scene.showStatus(isWeakPoint ? 'Critical hit! -5 HP' : `-${amount} HP`);

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.dead = true;
        this.state = 'dead';

        // Boss death particles — gold + red explosion
        ['particle-gold', 'particle-red'].forEach(texture => {
            if (this.scene.textures.exists(texture)) {
                const emitter = this.scene.add.particles(this.sprite.x, this.sprite.y, texture, {
                    speed: { min: 50, max: 200 },
                    scale: { start: 2, end: 0 },
                    lifespan: 800,
                    quantity: 30,
                    emitting: false
                });
                emitter.explode();
                this.scene.time.delayedCall(900, () => emitter.destroy());
            }
        });

        // Stop any phase 3 tween
        if (this._redTween) {
            this._redTween.stop();
        }

        // Flash white
        this.sprite.setTint(0xffffff);
        this.scene.cameras.main.shake(500, 0.02);

        // Flash sequence
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            duration: 1500,
            ease: 'Steps',
            easeParams: [8],
            onComplete: () => {
                this.sprite.setVisible(false);
            }
        });

        // Victory text
        const cam = this.scene.cameras.main;
        const victoryText = this.scene.add.text(
            cam.worldView.centerX,
            cam.worldView.centerY - 80,
            'Victory!',
            {
                fontFamily: 'Georgia, serif',
                fontSize: '48px',
                color: '#ffd700',
                stroke: '#000',
                strokeThickness: 5
            }
        ).setOrigin(0.5).setDepth(200);

        this.scene.tweens.add({
            targets: victoryText,
            scale: { from: 0.5, to: 1.2 },
            duration: 800,
            ease: 'Back.easeOut'
        });

        // After 3 seconds, let HoleScene handle the transition
        this.scene.time.delayedCall(3000, () => {
            victoryText.destroy();
            // Mark boss defeated — HoleScene can check this.boss.dead
            // Trigger ending cinematic
            this.scene.scene.start('CinematicScene', { type: 'ending' });
        });

        // Cleanup spawned objects
        this.icePatches.forEach(p => {
            p.gfx.destroy();
            this.scene.matter.world.remove(p.sensor);
        });
        this.icePatches = [];

        this.asteroids.forEach(a => a.gfx.destroy());
        this.asteroids = [];
    }

    // ─── Health Bar ─────────────────────────────────────────────────────

    drawHealthBar() {
        this.healthBarGfx.clear();
        if (this.dead) return;

        const barW = 100;
        const barH = 8;
        const x = this.sprite.x - barW / 2;
        const y = this.sprite.y - 80;
        const pct = this.hp / this.maxHP;

        // Background
        this.healthBarGfx.fillStyle(0x333333, 0.8);
        this.healthBarGfx.fillRect(x, y, barW, barH);

        // Fill color based on phase
        let color = 0x00cc00; // green
        if (pct <= 0.3) color = 0xcc0000; // red
        else if (pct <= 0.6) color = 0xcccc00; // yellow

        this.healthBarGfx.fillStyle(color, 1);
        this.healthBarGfx.fillRect(x, y, barW * pct, barH);
    }

    // ─── Cleanup ────────────────────────────────────────────────────────

    destroy() {
        if (this._redTween) this._redTween.stop();

        this.icePatches.forEach(p => {
            p.gfx.destroy();
            this.scene.matter.world.remove(p.sensor);
        });
        this.asteroids.forEach(a => a.gfx.destroy());

        this.weakPointGfx.destroy();
        this.healthBarGfx.destroy();
        this.scene.matter.world.remove(this.weakPointSensor);
        this.scene.matter.world.remove(this.bodySensor);
        this.sprite.destroy();
    }
}
