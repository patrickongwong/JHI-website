export class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const { width, height } = this.cameras.main;

        // Dark green gradient background
        const bg = this.add.graphics();
        const topColor = Phaser.Display.Color.IntegerToColor(0x1a472a);
        const bottomColor = Phaser.Display.Color.IntegerToColor(0x2d6a4f);
        for (let y = 0; y < height; y++) {
            const t = y / height;
            const r = Phaser.Math.Linear(topColor.red, bottomColor.red, t);
            const g = Phaser.Math.Linear(topColor.green, bottomColor.green, t);
            const b = Phaser.Math.Linear(topColor.blue, bottomColor.blue, t);
            const color = Phaser.Display.Color.GetColor(r, g, b);
            bg.fillStyle(color, 1);
            bg.fillRect(0, y, width, 1);
        }

        // Title text
        this.add.text(width / 2, height * 0.25, 'JHI GOLF QUEST', {
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '48px',
            color: '#c9a84c',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, height * 0.35, 'A 9-Hole Adventure', {
            fontFamily: 'Georgia, serif',
            fontSize: '18px',
            color: '#b7e4c7'
        }).setOrigin(0.5);

        // Start Game button
        const btnX = width / 2;
        const btnY = height * 0.55;
        const btnW = 200;
        const btnH = 50;

        const btnBg = this.add.graphics();
        btnBg.fillStyle(0xc9a84c, 1);
        btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);

        const btnText = this.add.text(btnX, btnY, 'Start Game', {
            fontFamily: 'Georgia, serif',
            fontSize: '22px',
            color: '#1a472a'
        }).setOrigin(0.5);

        // Interactive hit zone
        const hitZone = this.add.zone(btnX, btnY, btnW, btnH).setInteractive({ useHandCursor: true });

        hitZone.on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(0xe0c872, 1);
            btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
        });

        hitZone.on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(0xc9a84c, 1);
            btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
        });

        hitZone.on('pointerdown', () => {
            this.scene.start('HoleScene', { hole: 1 });
        });

        // Controls hint
        this.add.text(width / 2, height * 0.88, 'WASD to move | SPACE to jump | Drag ball to hit', {
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            color: '#ffffff',
            alpha: 0.5
        }).setOrigin(0.5).setAlpha(0.5);
    }
}
