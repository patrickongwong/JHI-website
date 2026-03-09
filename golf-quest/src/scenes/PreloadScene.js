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

        // Tilesets
        this.load.image('tileset-meadow', 'assets/tilesets/meadow.png');
        this.load.image('tileset-desert', 'assets/tilesets/desert.png');
        this.load.image('tileset-tundra', 'assets/tilesets/tundra.png');
        this.load.image('tileset-space', 'assets/tilesets/space.png');

        // Tilemaps
        for (let i = 1; i <= 9; i++) {
            this.load.tilemapTiledJSON(`hole${i}`, `assets/tilemaps/hole${i}.json`);
        }

        // Spritesheets
        this.load.spritesheet('jj', 'assets/sprites/jj.png', { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet('patrick', 'assets/sprites/patrick.png', { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet('enemy', 'assets/sprites/enemy.png', { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('boss', 'assets/sprites/boss.png', { frameWidth: 128, frameHeight: 128 });
        this.load.image('ball', 'assets/sprites/ball.png');
        this.load.image('projectile', 'assets/sprites/projectile.png');
        this.load.image('asteroid', 'assets/sprites/asteroid.png');
    }

    create() {
        this.scene.start('MenuScene');
    }
}
