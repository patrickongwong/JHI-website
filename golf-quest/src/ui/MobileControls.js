export class MobileControls {
    constructor(scene) {
        this.scene = scene;
        this.isMobile = !scene.sys.game.device.os.desktop;
        if (!this.isMobile) return;

        // Virtual joystick (left side)
        this.joystick = scene.plugins.get('rexVirtualJoystick').add(scene, {
            x: 100,
            y: 480,
            radius: 50,
            base: scene.add.circle(0, 0, 50, 0x2d6a4f, 0.5).setScrollFactor(0).setDepth(300),
            thumb: scene.add.circle(0, 0, 25, 0xc9a84c, 0.8).setScrollFactor(0).setDepth(301),
        });

        // Jump button (right side, top)
        this.jumpBtn = scene.add.circle(1100, 440, 30, 0x40916c, 0.7)
            .setScrollFactor(0).setDepth(300).setInteractive();
        this.jumpLabel = scene.add.text(1100, 440, 'Jump', {
            fontSize: '11px', fontFamily: 'Georgia, serif', color: '#fff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        // Hit button (right side, bottom)
        this.hitBtn = scene.add.circle(1100, 530, 30, 0xc9a84c, 0.7)
            .setScrollFactor(0).setDepth(300).setInteractive();
        this.hitLabel = scene.add.text(1100, 530, 'Hit', {
            fontSize: '11px', fontFamily: 'Georgia, serif', color: '#1a472a'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        this.jumpPressed = false;
        this.hitPressed = false;

        this.jumpBtn.on('pointerdown', () => { this.jumpPressed = true; });
        this.hitBtn.on('pointerdown', () => { this.hitPressed = true; });
    }

    getMovement() {
        if (!this.isMobile || !this.joystick) return { x: 0, down: false };
        const force = this.joystick.force;
        if (force < 10) return { x: 0, down: false };

        const angle = this.joystick.angle; // degrees
        const rad = Phaser.Math.DegToRad(angle);
        const horizontal = Math.cos(rad);
        const vertical = Math.sin(rad);

        return {
            x: Math.abs(horizontal) > 0.3 ? Math.sign(horizontal) : 0,
            down: vertical > 0.5 // joystick pushed down = range finder
        };
    }

    consumeJump() {
        if (this.jumpPressed) { this.jumpPressed = false; return true; }
        return false;
    }

    consumeHit() {
        if (this.hitPressed) { this.hitPressed = false; return true; }
        return false;
    }

    destroy() {
        if (!this.isMobile) return;
        if (this.joystick) this.joystick.destroy();
        if (this.jumpBtn) this.jumpBtn.destroy();
        if (this.jumpLabel) this.jumpLabel.destroy();
        if (this.hitBtn) this.hitBtn.destroy();
        if (this.hitLabel) this.hitLabel.destroy();
    }
}
