export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        const { width, height } = this.cameras.main;

        // Loading bar background (green box)
        const barBg = this.add.rectangle(width / 2, height / 2, 400, 40, 0x1a472a);
        barBg.setStrokeStyle(2, 0xd4af37);

        // Loading bar fill (gold progress)
        const barFill = this.add.rectangle(width / 2 - 198, height / 2, 0, 36, 0xd4af37);
        barFill.setOrigin(0, 0.5);

        // "Loading..." text
        const loadingText = this.add.text(width / 2, height / 2 - 40, 'Loading...', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#d4af37'
        }).setOrigin(0.5);

        // Update loading bar on progress
        this.load.on('progress', (value) => {
            barFill.width = 396 * value;
        });

        this.load.on('complete', () => {
            barBg.destroy();
            barFill.destroy();
            loadingText.destroy();
        });

        // Audio assets
        this.load.audio('bgMusic', 'assets/sounds/background-music.mp3');
        this.load.audio('swing', 'assets/sounds/swing.mp3');
        this.load.audio('applause', 'assets/sounds/applause.wav');

        // TODO: Load sprite sheets (will be added in later tasks)

        // TODO: Load tilemaps (will be added in later tasks)
    }

    create() {
        this.scene.start('MenuScene');
    }
}
