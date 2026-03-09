export class HUD {
    constructor(scene) {
        this.scene = scene;
        this.statusTimer = 0;

        const depth = 200;

        // Title (top center)
        this.titleText = scene.add.text(600, 8, 'JHI GOLF QUEST', {
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '16px',
            color: '#c9a84c'
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(depth);

        // Hole & Par (top left)
        this.holeText = scene.add.text(16, 8, 'Hole 1/9 | Par 2', {
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0, 0).setScrollFactor(0).setDepth(depth);

        // Strokes (top left, below hole text)
        this.strokesText = scene.add.text(16, 28, 'Strokes: 0', {
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0, 0).setScrollFactor(0).setDepth(depth);

        // Hearts (top right)
        this.heartsText = scene.add.text(1184, 8, '', {
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            color: '#ff0000'
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(depth);

        // Coins (top right, below hearts)
        this.coinsText = scene.add.text(1184, 28, 'Coins: 0', {
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            color: '#c9a84c'
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(depth);

        // Status text (bottom center)
        this.statusText = scene.add.text(600, 575, '', {
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(depth);
    }

    update(holeConfig, player, gameState) {
        if (holeConfig) {
            this.holeText.setText(`Hole ${holeConfig.hole}/9 | Par ${holeConfig.par}`);
        }

        if (player) {
            const health = player.health !== undefined ? player.health : 3;
            const maxHealth = player.maxHealth !== undefined ? player.maxHealth : 3;
            const filled = '\u2764\uFE0F'.repeat(health);
            const empty = '\u2661'.repeat(maxHealth - health);
            this.heartsText.setText(filled + empty);
        }

        if (gameState) {
            const strokes = gameState.strokes !== undefined ? gameState.strokes : 0;
            const coins = gameState.coins !== undefined ? gameState.coins : 0;
            this.strokesText.setText(`Strokes: ${strokes}`);
            this.coinsText.setText(`Coins: ${coins}`);
        }

        // Status timer countdown
        if (this.statusTimer > 0) {
            this.statusTimer--;
            if (this.statusTimer <= 0) {
                this.statusText.setText('');
            }
        }
    }

    showStatus(text, duration) {
        const frames = duration !== undefined ? duration : 120;
        this.statusText.setText(text);
        this.statusTimer = frames;
    }

    destroy() {
        if (this.titleText) this.titleText.destroy();
        if (this.holeText) this.holeText.destroy();
        if (this.strokesText) this.strokesText.destroy();
        if (this.heartsText) this.heartsText.destroy();
        if (this.coinsText) this.coinsText.destroy();
        if (this.statusText) this.statusText.destroy();
    }
}
