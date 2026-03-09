import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { HoleScene } from './scenes/HoleScene.js';
import { ShopScene } from './scenes/ShopScene.js';
import { CinematicScene } from './scenes/CinematicScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 600,
    parent: 'game-container',
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1 },
            debug: false
        }
    },
    scene: [BootScene, PreloadScene, MenuScene, HoleScene, ShopScene, CinematicScene]
};

const game = new Phaser.Game(config);
