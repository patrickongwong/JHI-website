import { PhysicsConfig } from '../systems/PhysicsConfig.js';

export class Ball {
    constructor(scene, x, y, psychicMode = false) {
        this.scene = scene;
        this.psychicMode = psychicMode;
        this.psychicTarget = null;
        const cfg = PhysicsConfig.ball;

        // Create Matter.js circle body
        this.sprite = scene.matter.add.circle(x, y, cfg.radius, {
            restitution: cfg.restitution,
            friction: cfg.friction,
            frictionAir: cfg.frictionAir,
            density: cfg.density,
            label: 'ball'
        });

        // Visual representation
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(10);

        // Invisible game object that tracks ball position for camera follow
        this.followTarget = scene.add.zone(x, y, 1, 1);

        // Trajectory preview graphics
        this.trajectoryGraphics = scene.add.graphics();
        this.trajectoryGraphics.setDepth(9);

        // Aiming state
        this.isAiming = false;
        this.aimStart = { x: 0, y: 0 };
        this.aimEnd = { x: 0, y: 0 };

        // Physics config
        this.maxHitPower = cfg.maxHitPower;
        this.minHitPower = cfg.minHitPower;
        this.radius = cfg.radius;

        // State tracking
        this.strokes = 0;
        this.isMoving = false;
        this.wasMoving = false;
        this.movingThreshold = 0.2;

        // Wind force (set by HoleScene for storm biomes)
        this.windForce = 0;

        // Set up input
        this.setupInput();

        // Psychic mode particle trail
        if (this.psychicMode) {
            this.psychicTrail = scene.add.particles(0, 0, 'particle-purple', {
                speed: { min: 2, max: 8 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.3, end: 0 },
                alpha: { start: 0.5, end: 0 },
                lifespan: 400,
                frequency: 50,
                tint: [0x9b59b6, 0x8e44ad, 0x7d3c98],
                blendMode: 'ADD',
                emitting: false
            });
            this.psychicTrail.setDepth(9);
        }
    }

    setupInput() {
        const scene = this.scene;

        if (this.psychicMode) {
            // Psychic mode: click anywhere to set target
            scene.input.on('pointerdown', (pointer) => {
                if (this.isMoving) return;
                const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
                this.psychicTarget = { x: worldPoint.x, y: worldPoint.y };
                this.isMoving = true;

                // Count as a stroke
                this.strokes++;

                // Enable psychic trail
                if (this.psychicTrail) {
                    this.psychicTrail.emitting = true;
                }
            });
            return;
        }

        // Normal slingshot aiming
        scene.input.on('pointerdown', (pointer) => {
            const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
            const ballPos = this.sprite.position;
            const dist = Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, ballPos.x, ballPos.y);

            // Click must be near the ball to start aiming
            if (dist < 30 && !this.isMoving) {
                this.isAiming = true;
                this.aimStart.x = worldPoint.x;
                this.aimStart.y = worldPoint.y;
                this.aimEnd.x = worldPoint.x;
                this.aimEnd.y = worldPoint.y;
            }
        });

        scene.input.on('pointermove', (pointer) => {
            if (!this.isAiming) return;
            const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
            this.aimEnd.x = worldPoint.x;
            this.aimEnd.y = worldPoint.y;
            this.drawTrajectory();
        });

        scene.input.on('pointerup', () => {
            if (!this.isAiming) return;
            this.isAiming = false;
            this.launch();
            this.trajectoryGraphics.clear();
        });
    }

    drawTrajectory() {
        this.trajectoryGraphics.clear();

        const ballPos = this.sprite.position;
        const dx = this.aimStart.x - this.aimEnd.x;
        const dy = this.aimStart.y - this.aimEnd.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const power = Math.min(distance * 0.1, this.maxHitPower);

        if (power < this.minHitPower) return;

        const angle = Math.atan2(dy, dx);

        // Draw power/direction line (gold)
        this.trajectoryGraphics.lineStyle(2, 0xffd700, 0.8);
        this.trajectoryGraphics.beginPath();
        this.trajectoryGraphics.moveTo(ballPos.x, ballPos.y);
        this.trajectoryGraphics.lineTo(
            ballPos.x + Math.cos(angle) * power * 4,
            ballPos.y + Math.sin(angle) * power * 4
        );
        this.trajectoryGraphics.strokePath();

        // Simulate trajectory (dotted arc preview)
        const vx = Math.cos(angle) * power;
        const vy = Math.sin(angle) * power;
        const gravity = this.scene.matter.world.engine.gravity.y * 0.001;

        let simX = ballPos.x;
        let simY = ballPos.y;
        let simVx = vx;
        let simVy = vy;

        this.trajectoryGraphics.fillStyle(0xffffff, 0.6);
        for (let i = 0; i < 40; i++) {
            simVx += this.windForce * 50;
            simVy += gravity;
            simX += simVx;
            simY += simVy;

            // Draw dot every 2 steps
            if (i % 2 === 0) {
                this.trajectoryGraphics.fillCircle(simX, simY, 2);
            }
        }
    }

    launch() {
        const ballPos = this.sprite.position;
        const dx = this.aimStart.x - this.aimEnd.x;
        const dy = this.aimStart.y - this.aimEnd.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const power = Math.min(distance * 0.1, this.maxHitPower);

        if (power < this.minHitPower) return;

        const angle = Math.atan2(dy, dx);
        const vx = Math.cos(angle) * power;
        const vy = Math.sin(angle) * power;

        // Apply velocity
        this.scene.matter.body.setVelocity(this.sprite, { x: vx, y: vy });

        // Play swing sound
        if (this.scene.sound.get('swing') || this.scene.cache.audio.exists('swing')) {
            this.scene.sound.play('swing');
        }

        // Increment strokes
        this.strokes++;

        // Ball hit particles
        if (this.scene.textures.exists('particle-gold')) {
            const emitter = this.scene.add.particles(ballPos.x, ballPos.y, 'particle-gold', {
                speed: { min: 50, max: 150 },
                scale: { start: 1, end: 0 },
                lifespan: 400,
                quantity: 15,
                emitting: false
            });
            emitter.explode();
            this.scene.time.delayedCall(500, () => emitter.destroy());
        }
    }

    update() {
        const ballPos = this.sprite.position;

        // Psychic mode movement
        if (this.psychicMode && this.psychicTarget) {
            const dx = this.psychicTarget.x - ballPos.x;
            const dy = this.psychicTarget.y - ballPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 5) {
                const speed = 3;
                this.scene.matter.body.setVelocity(this.sprite, {
                    x: (dx / dist) * speed,
                    y: (dy / dist) * speed
                });
            } else {
                this.scene.matter.body.setVelocity(this.sprite, { x: 0, y: 0 });
                this.isMoving = false;
                this.psychicTarget = null;
                // Stop psychic trail
                if (this.psychicTrail) {
                    this.psychicTrail.emitting = false;
                }
            }
        }

        // Update psychic trail position
        if (this.psychicTrail) {
            this.psychicTrail.setPosition(ballPos.x, ballPos.y);
        }

        const velocity = this.sprite.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

        if (!this.psychicMode) {
            this.isMoving = speed > this.movingThreshold;
        }

        // Apply wind force when ball is moving
        if (this.windForce !== 0 && this.isMoving) {
            this.scene.matter.body.applyForce(this.sprite, this.sprite.position, { x: this.windForce, y: 0 });
        }

        // Draw ball visual
        this.graphics.clear();
        this.graphics.fillStyle(0xffffff, 1);
        this.graphics.fillCircle(ballPos.x, ballPos.y, this.radius);
        this.graphics.lineStyle(1, 0xcccccc, 1);
        this.graphics.strokeCircle(ballPos.x, ballPos.y, this.radius);

        // Update follow target position to match ball body
        this.followTarget.setPosition(ballPos.x, ballPos.y);

        // Camera follow transitions: only switch target on state change
        if (this.isMoving && !this.wasMoving) {
            // Ball just started moving — follow ball
            this.scene.cameras.main.startFollow(this.followTarget, false, 0.08, 0.08);
        }
        if (!this.isMoving && this.wasMoving) {
            // Ball just stopped — follow player
            if (this.scene.player) {
                this.scene.cameras.main.startFollow(this.scene.player.sprite, false, 0.1, 0.1);
            }
        }
        this.wasMoving = this.isMoving;
    }

    getSpeed() {
        const velocity = this.sprite.velocity;
        return Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    }

    setInSand(inSand) {
        const cfg = PhysicsConfig.ball;
        if (inSand) {
            this.sprite.friction = cfg.sandFriction;
            this.sprite.frictionAir = cfg.frictionAir * 3;
        } else {
            this.sprite.friction = cfg.friction;
            this.sprite.frictionAir = cfg.frictionAir;
        }
    }

    setWind(force) {
        this.windForce = force;
    }

    setOnIce(onIce) {
        const cfg = PhysicsConfig.ball;
        if (onIce) {
            this.sprite.friction = 0.001;
            this.sprite.frictionAir = cfg.frictionAir * 0.3;
        } else {
            this.sprite.friction = cfg.friction;
            this.sprite.frictionAir = cfg.frictionAir;
        }
    }

    reset(x, y) {
        this.scene.matter.body.setPosition(this.sprite, { x, y });
        this.scene.matter.body.setVelocity(this.sprite, { x: 0, y: 0 });
        this.isMoving = false;
    }

    getPosition() {
        return this.sprite.position;
    }

    destroy() {
        this.graphics.destroy();
        this.trajectoryGraphics.destroy();
        if (this.followTarget) {
            this.followTarget.destroy();
        }
        if (this.psychicTrail) {
            this.psychicTrail.destroy();
        }
        this.scene.matter.world.remove(this.sprite);
    }
}
