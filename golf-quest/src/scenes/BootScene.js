export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        // Initialize shared game state in the Phaser registry
        this.registry.set('currentHole', 1);
        this.registry.set('scores', []);
        this.registry.set('strokes', 0);
        this.registry.set('coins', 0);
        this.registry.set('activeCharacter', 'default');
        this.registry.set('patrickUnlocked', false);
        this.registry.set('usedPatrick', false);

        // Equipment tier indices (0 = base tier)
        this.registry.set('equipment', {
            club: 0,
            shaft: 0,
            boots: 0,
            shirt: 0
        });

        this.scene.start('PreloadScene');
    }
}
