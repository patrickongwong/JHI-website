export class CinematicScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CinematicScene' });
    }

    init(data) {
        this.cinematicType = data.type || 'space-launch';
        this.nextHole = data.nextHole || 9;
    }

    create() {
        this.w = this.cameras.main.width;
        this.h = this.cameras.main.height;

        if (this.cinematicType === 'space-launch') {
            this.playSpaceLaunch();
        } else if (this.cinematicType === 'ending') {
            this.playEnding();
        }
    }

    // ─── SPACE LAUNCH CINEMATIC (~8 seconds) ───

    playSpaceLaunch() {
        const w = this.w;
        const h = this.h;

        // Background - dark sky
        this.add.rectangle(w / 2, h / 2, w, h, 0x000011);

        // Ground
        const ground = this.add.graphics();
        ground.fillStyle(0x2d5a1e);
        ground.fillRect(0, h - 100, w, 100);
        ground.fillStyle(0x3b2a1a);
        ground.fillRect(0, h - 40, w, 40);

        // Dark overlay for sky darkening
        const darkOverlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000);
        darkOverlay.setAlpha(0);

        // Cracks graphics (drawn in phase 1)
        const cracks = this.add.graphics();
        cracks.setAlpha(0);

        // Stars (drawn in phase 2+)
        const stars = this.add.graphics();
        stars.setAlpha(0);
        this.drawStarfield(stars, w, h);

        // Clouds
        const clouds = [];
        for (let i = 0; i < 6; i++) {
            const cx = Phaser.Math.Between(100, w - 100);
            const cloud = this.add.graphics();
            this.drawCloud(cloud, cx, h / 2 + Phaser.Math.Between(-50, 50));
            cloud.setAlpha(0);
            clouds.push(cloud);
        }

        // Rocket
        const rocket = this.add.graphics();
        this.drawRocket(rocket, w / 2, 0);
        rocket.setPosition(0, h + 80);
        rocket.setAlpha(0);

        // Character on rocket (small figure)
        const character = this.add.graphics();
        this.drawMiniCharacter(character, w / 2 + 20, -30);
        character.setPosition(0, h + 80);
        character.setAlpha(0);

        // Earth (for space phase)
        const earth = this.add.graphics();
        earth.setAlpha(0);

        // Lunar surface
        const lunar = this.add.graphics();
        lunar.fillStyle(0x888888);
        lunar.fillRect(0, 0, w, 120);
        lunar.fillStyle(0x999999);
        for (let i = 0; i < 8; i++) {
            lunar.fillCircle(Phaser.Math.Between(50, w - 50), Phaser.Math.Between(20, 100), Phaser.Math.Between(15, 40));
        }
        lunar.setPosition(0, h + 120);
        lunar.setAlpha(0);

        // Title texts
        const titleText = this.add.text(w / 2, h / 2 - 20, `HOLE ${this.nextHole}`, {
            fontSize: '48px',
            fontFamily: 'monospace',
            color: '#ffd700',
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);

        const subtitleText = this.add.text(w / 2, h / 2 + 30, 'THE FINAL FRONTIER', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5).setAlpha(0);

        // ── Phase 1: Rumble (0-2s) ──
        this.cameras.main.shake(2000, 0.01);

        // Draw orange cracks
        cracks.lineStyle(2, 0xff6600);
        for (let i = 0; i < 5; i++) {
            const cx = Phaser.Math.Between(w / 2 - 100, w / 2 + 100);
            const cy = h - Phaser.Math.Between(20, 90);
            cracks.beginPath();
            cracks.moveTo(cx, cy);
            cracks.lineTo(cx + Phaser.Math.Between(-30, 30), cy + Phaser.Math.Between(-40, 0));
            cracks.lineTo(cx + Phaser.Math.Between(-20, 20), cy + Phaser.Math.Between(-60, -20));
            cracks.strokePath();
        }

        this.tweens.add({
            targets: cracks,
            alpha: 1,
            duration: 1000,
            delay: 500
        });

        this.tweens.add({
            targets: darkOverlay,
            alpha: 0.3,
            duration: 2000
        });

        // ── Phase 2: Launch (2-5s) ──
        this.time.delayedCall(2000, () => {
            rocket.setAlpha(1);
            character.setAlpha(1);

            // Rocket rises
            this.tweens.add({
                targets: [rocket, character],
                y: -200,
                duration: 3000,
                ease: 'Quad.easeIn'
            });

            // Stars fade in
            this.tweens.add({
                targets: stars,
                alpha: 1,
                duration: 1500
            });

            // Ground and cracks disappear
            this.tweens.add({
                targets: [ground, cracks],
                alpha: 0,
                duration: 1500
            });

            // Clouds rush downward
            clouds.forEach((cloud, i) => {
                cloud.setAlpha(1);
                this.tweens.add({
                    targets: cloud,
                    y: h + 200,
                    alpha: 0,
                    duration: 2000,
                    delay: i * 200,
                    ease: 'Quad.easeIn'
                });
            });
        });

        // ── Phase 3: Space (5-7s) ──
        this.time.delayedCall(5000, () => {
            darkOverlay.setAlpha(0.7);

            // Rocket stays center
            rocket.setPosition(0, h / 2 - 40);
            character.setPosition(0, h / 2 - 40);

            // Earth appears and grows
            earth.setAlpha(1);
            const earthRadius = { value: 20 };
            this.tweens.add({
                targets: earthRadius,
                value: 80,
                duration: 2000,
                onUpdate: () => {
                    earth.clear();
                    this.drawEarth(earth, w / 2 - 150, h / 2 + 100, earthRadius.value);
                }
            });
        });

        // ── Phase 4: Landing (7-8s) ──
        this.time.delayedCall(7000, () => {
            // Rocket and earth fade
            this.tweens.add({
                targets: [rocket, character, earth],
                alpha: 0,
                duration: 500
            });

            // Lunar surface rises
            lunar.setAlpha(1);
            this.tweens.add({
                targets: lunar,
                y: h - 120,
                duration: 800,
                ease: 'Quad.easeOut'
            });

            // Title text fades in
            this.tweens.add({
                targets: titleText,
                alpha: 1,
                duration: 500,
                delay: 300
            });

            this.tweens.add({
                targets: subtitleText,
                alpha: 1,
                duration: 500,
                delay: 600
            });
        });

        // Transition to HoleScene after ~8.5s
        this.time.delayedCall(8500, () => {
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('HoleScene', { hole: this.nextHole });
            });
        });
    }

    // ─── ENDING CINEMATIC (~10 seconds) ───

    playEnding() {
        const w = this.w;
        const h = this.h;

        // ── Phase 1: Victory (0-2s) ──

        // Moon surface background
        const moonBg = this.add.graphics();
        moonBg.fillGradientStyle(0xaaaaaa, 0xaaaaaa, 0x666666, 0x666666, 1);
        moonBg.fillRect(0, 0, w, h);
        moonBg.fillStyle(0x888888);
        moonBg.fillRect(0, h - 100, w, 100);
        // Craters
        for (let i = 0; i < 6; i++) {
            moonBg.fillStyle(0x777777);
            moonBg.fillCircle(Phaser.Math.Between(50, w - 50), h - Phaser.Math.Between(10, 80), Phaser.Math.Between(10, 30));
        }

        // Character at center
        const charGraphics = this.add.graphics();
        this.drawMiniCharacter(charGraphics, w / 2, h / 2 + 50);

        // Celebrating tween (bounce up and down)
        this.tweens.add({
            targets: charGraphics,
            y: -20,
            duration: 300,
            yoyo: true,
            repeat: 5,
            ease: 'Quad.easeOut'
        });

        // Gold particle burst
        const particles = [];
        for (let i = 0; i < 20; i++) {
            const p = this.add.circle(w / 2, h / 2 + 40, Phaser.Math.Between(2, 5), 0xffd700);
            particles.push(p);
            const angle = (i / 20) * Math.PI * 2;
            const dist = Phaser.Math.Between(80, 200);
            this.tweens.add({
                targets: p,
                x: w / 2 + Math.cos(angle) * dist,
                y: h / 2 + 40 + Math.sin(angle) * dist,
                alpha: 0,
                duration: 1500,
                ease: 'Quad.easeOut'
            });
        }

        // ── Phase 2: Arrival (2-4s) ──

        const arrivalRocket = this.add.graphics();
        this.drawRocket(arrivalRocket, w / 2 + 100, 0);
        arrivalRocket.setPosition(0, -200);

        this.time.delayedCall(2000, () => {
            // Rocket descends
            this.tweens.add({
                targets: arrivalRocket,
                y: h / 2 - 30,
                duration: 1500,
                ease: 'Quad.easeOut'
            });

            // Door opens (dark rectangle on rocket body)
            this.time.delayedCall(1500, () => {
                const door = this.add.rectangle(w / 2 + 100, h / 2 + 20, 16, 30, 0x222222);
                this.tweens.add({
                    targets: door,
                    alpha: 1,
                    duration: 300
                });
            });
        });

        // ── Phase 3: Liftoff (4-6s) ──

        this.time.delayedCall(4000, () => {
            // Move character to rocket
            this.tweens.add({
                targets: charGraphics,
                x: 0,
                y: h / 2 - 30,
                duration: 500,
                onComplete: () => {
                    // Both fly upward
                    this.tweens.add({
                        targets: [arrivalRocket, charGraphics],
                        y: -400,
                        duration: 1500,
                        ease: 'Quad.easeIn'
                    });

                    // Moon shrinks (background scrolls down)
                    this.tweens.add({
                        targets: moonBg,
                        y: 200,
                        scaleX: 0.5,
                        scaleY: 0.5,
                        alpha: 0,
                        duration: 1500
                    });

                    // Stars appear
                    const spaceStars = this.add.graphics();
                    this.drawStarfield(spaceStars, w, h);
                    spaceStars.setAlpha(0);
                    spaceStars.setDepth(-1);
                    this.tweens.add({
                        targets: spaceStars,
                        alpha: 1,
                        duration: 1000
                    });

                    // Earth grows larger ahead
                    const earthHome = this.add.graphics();
                    earthHome.setAlpha(0);
                    const eRadius = { value: 30 };
                    this.tweens.add({
                        targets: earthHome,
                        alpha: 1,
                        duration: 500,
                        delay: 500
                    });
                    this.tweens.add({
                        targets: eRadius,
                        value: 120,
                        duration: 1500,
                        delay: 500,
                        onUpdate: () => {
                            earthHome.clear();
                            this.drawEarth(earthHome, w / 2, h / 2, eRadius.value);
                        }
                    });
                }
            });
        });

        // ── Phase 4: Home (6-9s) ──

        this.time.delayedCall(6000, () => {
            // Warm interior background
            const interior = this.add.rectangle(w / 2, h / 2, w, h, 0xf5e6c8);
            interior.setAlpha(0);
            interior.setDepth(10);

            this.tweens.add({
                targets: interior,
                alpha: 1,
                duration: 500,
                onComplete: () => {
                    // Floor
                    const floor = this.add.rectangle(w / 2, h - 40, w, 80, 0x8b6914);
                    floor.setDepth(11);

                    // Couch
                    const couch = this.add.rectangle(w / 2 - 50, h - 120, 180, 60, 0x6b3a2a);
                    couch.setDepth(11);
                    // Couch back
                    const couchBack = this.add.rectangle(w / 2 - 50, h - 160, 180, 20, 0x5a2a1a);
                    couchBack.setDepth(11);

                    // TV
                    const tv = this.add.rectangle(w / 2 + 180, h - 180, 80, 60, 0x333333);
                    tv.setDepth(11);
                    // TV glow
                    const tvGlow = this.add.rectangle(w / 2 + 180, h - 180, 70, 50, 0x4488ff);
                    tvGlow.setDepth(11);
                    this.tweens.add({
                        targets: tvGlow,
                        alpha: 0.5,
                        duration: 500,
                        yoyo: true,
                        repeat: -1
                    });

                    // Pizza box
                    const pizza = this.add.rectangle(w / 2 - 50, h - 85, 40, 30, 0xd4a76a);
                    pizza.setDepth(11);

                    // Window with starry night
                    const windowFrame = this.add.rectangle(w / 2 + 180, h - 300, 70, 70, 0x111133);
                    windowFrame.setDepth(11);
                    // Stars in window
                    const windowStars = this.add.graphics();
                    windowStars.setDepth(12);
                    windowStars.fillStyle(0xffffff);
                    for (let i = 0; i < 8; i++) {
                        windowStars.fillCircle(
                            w / 2 + 180 + Phaser.Math.Between(-25, 25),
                            h - 300 + Phaser.Math.Between(-25, 25),
                            1
                        );
                    }
                    // Window border
                    const windowBorder = this.add.rectangle(w / 2 + 180, h - 300, 74, 74);
                    windowBorder.setStrokeStyle(3, 0xcccccc);
                    windowBorder.setFillStyle();
                    windowBorder.setDepth(12);

                    // Character on couch
                    const homeChar = this.add.graphics();
                    homeChar.setDepth(12);
                    this.drawMiniCharacter(homeChar, w / 2 - 50, h - 155);

                    // "Home Sweet Home" text
                    const homeText = this.add.text(w / 2, h / 2 - 80, 'Home Sweet Home', {
                        fontSize: '32px',
                        fontFamily: 'monospace',
                        color: '#ffd700',
                        fontStyle: 'bold'
                    }).setOrigin(0.5).setAlpha(0).setDepth(13);

                    this.tweens.add({
                        targets: homeText,
                        alpha: 1,
                        duration: 1000,
                        delay: 500
                    });
                }
            });
        });

        // ── Phase 5: Fade (9-10s) ──

        this.time.delayedCall(9000, () => {
            const blackout = this.add.rectangle(w / 2, h / 2, w, h, 0x000000);
            blackout.setAlpha(0);
            blackout.setDepth(20);

            this.tweens.add({
                targets: blackout,
                alpha: 1,
                duration: 1000,
                onComplete: () => {
                    this.scene.start('LeaderboardScene');
                }
            });
        });
    }

    // ─── DRAWING HELPERS ───

    drawRocket(g, x, y) {
        // Body
        g.fillStyle(0xffffff);
        g.fillRect(x - 15, y, 30, 60);
        // Nose cone
        g.fillStyle(0xff3333);
        g.fillTriangle(x - 15, y, x + 15, y, x, y - 25);
        // Fins
        g.fillTriangle(x - 15, y + 60, x - 25, y + 70, x - 15, y + 45);
        g.fillTriangle(x + 15, y + 60, x + 25, y + 70, x + 15, y + 45);
        // Window
        g.fillStyle(0x87ceeb);
        g.fillCircle(x, y + 20, 8);
    }

    drawMiniCharacter(g, x, y) {
        // Head
        g.fillStyle(0xffcc99);
        g.fillCircle(x, y, 8);
        // Body
        g.fillStyle(0x3366cc);
        g.fillRect(x - 6, y + 8, 12, 16);
        // Legs
        g.fillStyle(0x333333);
        g.fillRect(x - 6, y + 24, 5, 10);
        g.fillRect(x + 1, y + 24, 5, 10);
    }

    drawStarfield(g, w, h) {
        g.fillStyle(0xffffff);
        for (let i = 0; i < 80; i++) {
            const size = Phaser.Math.Between(1, 3);
            g.fillCircle(
                Phaser.Math.Between(0, w),
                Phaser.Math.Between(0, h),
                size
            );
        }
    }

    drawCloud(g, x, y) {
        g.fillStyle(0xffffff, 0.7);
        g.fillEllipse(x, y, 80, 30);
        g.fillEllipse(x - 20, y - 10, 50, 25);
        g.fillEllipse(x + 25, y - 5, 60, 28);
    }

    drawEarth(g, x, y, radius) {
        // Ocean
        g.fillStyle(0x2266cc);
        g.fillCircle(x, y, radius);
        // Continents (simplified green patches)
        g.fillStyle(0x33aa44);
        g.fillEllipse(x - radius * 0.2, y - radius * 0.1, radius * 0.5, radius * 0.4);
        g.fillEllipse(x + radius * 0.3, y + radius * 0.2, radius * 0.35, radius * 0.3);
        g.fillEllipse(x - radius * 0.1, y + radius * 0.4, radius * 0.25, radius * 0.2);
    }
}
