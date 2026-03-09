import { EquipmentData, getNextTierPrice } from '../systems/EquipmentSystem.js';

export class ShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShopScene' });
    }

    init(data) {
        this.nextHole = data.nextHole || 2;
    }

    create() {
        const { width, height } = this.cameras.main;

        // Background: wooden floor and walls
        this.createBackground(width, height);

        // Title
        this.add.text(width / 2, 40, 'PRO SHOP', {
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '36px',
            color: '#c9a84c',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Coins display
        this.coinsText = this.add.text(width - 20, 20, '', {
            fontFamily: 'Georgia, serif',
            fontSize: '20px',
            color: '#ffd700',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(1, 0);
        this.updateCoinsDisplay();

        // Equipment pedestals
        this.pedestals = {};
        this.infoPopups = {};
        const slots = ['club', 'shaft', 'boots', 'shirt'];
        const pedestalXPositions = [200, 400, 600, 800];

        slots.forEach((slot, i) => {
            this.createPedestal(slot, pedestalXPositions[i], height * 0.55);
        });

        // Shopkeeper NPC
        this.createShopkeeper(1000, height * 0.45);

        // Exit button
        this.createExitButton(width - 80, height - 40);

        // Keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();

        // Player indicator for pedestal proximity
        this.playerX = width / 2;
        this.playerMarker = this.add.circle(this.playerX, height * 0.75, 10, 0xc9a84c);
        this.playerMarkerLabel = this.add.text(this.playerX, height * 0.75 + 20, 'You', {
            fontFamily: 'Georgia, serif',
            fontSize: '12px',
            color: '#c9a84c'
        }).setOrigin(0.5, 0);

        // Movement keys
        this.keyA = this.input.keyboard.addKey('A');
        this.keyD = this.input.keyboard.addKey('D');
        this.keyLeft = this.input.keyboard.addKey('LEFT');
        this.keyRight = this.input.keyboard.addKey('RIGHT');
    }

    createBackground(width, height) {
        const bg = this.add.graphics();

        // Wall (darker brown)
        const wallTop = 0x4a3222;
        const wallBot = 0x5c3d2e;
        for (let y = 0; y < height * 0.4; y++) {
            const t = y / (height * 0.4);
            const topC = Phaser.Display.Color.IntegerToColor(wallTop);
            const botC = Phaser.Display.Color.IntegerToColor(wallBot);
            const r = Phaser.Math.Linear(topC.red, botC.red, t);
            const g = Phaser.Math.Linear(topC.green, botC.green, t);
            const b = Phaser.Math.Linear(topC.blue, botC.blue, t);
            bg.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
            bg.fillRect(0, y, width, 1);
        }

        // Floor (lighter brown wood)
        const floorTop = 0x8b6f47;
        const floorBot = 0x6b5233;
        for (let y = Math.floor(height * 0.4); y < height; y++) {
            const t = (y - height * 0.4) / (height * 0.6);
            const topC = Phaser.Display.Color.IntegerToColor(floorTop);
            const botC = Phaser.Display.Color.IntegerToColor(floorBot);
            const r = Phaser.Math.Linear(topC.red, botC.red, t);
            const g = Phaser.Math.Linear(topC.green, botC.green, t);
            const b = Phaser.Math.Linear(topC.blue, botC.blue, t);
            bg.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
            bg.fillRect(0, y, width, 1);
        }

        // Window with scenic view
        const winX = 80, winY = 60, winW = 160, winH = 120;
        bg.fillStyle(0x87ceeb, 1);
        bg.fillRect(winX, winY, winW, winH);
        // Green hills in window
        bg.fillStyle(0x4caf50, 1);
        bg.fillRect(winX, winY + winH * 0.6, winW, winH * 0.4);
        // Window frame
        bg.lineStyle(4, 0x3e2a1a, 1);
        bg.strokeRect(winX, winY, winW, winH);
        bg.lineBetween(winX + winW / 2, winY, winX + winW / 2, winY + winH);
        bg.lineBetween(winX, winY + winH / 2, winX + winW, winY + winH / 2);

        // Floor line separator
        bg.lineStyle(2, 0x3e2a1a, 0.5);
        bg.lineBetween(0, height * 0.4, width, height * 0.4);
    }

    createPedestal(slot, x, y) {
        const equipment = this.registry.get('equipment');
        const currentTier = equipment[slot];
        const data = EquipmentData[slot];

        const gfx = this.add.graphics();

        // Pedestal platform
        gfx.fillStyle(0x8b7355, 1);
        gfx.fillRect(x - 40, y + 10, 80, 12);
        gfx.fillStyle(0x6b5335, 1);
        gfx.fillRect(x - 30, y + 22, 60, 20);

        // Item icon (colored rectangle representing the item)
        const itemColors = {
            club: 0xb87333,
            shaft: 0x888888,
            boots: 0x654321,
            shirt: 0xffffff
        };
        gfx.fillStyle(itemColors[slot], 1);
        gfx.fillRect(x - 15, y - 25, 30, 35);

        // Slot name
        this.add.text(x, y - 40, slot.charAt(0).toUpperCase() + slot.slice(1), {
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            color: '#c9a84c',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Current tier label
        const tierText = this.add.text(x, y + 50, data.tiers[currentTier], {
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000',
            strokeThickness: 1
        }).setOrigin(0.5);

        // Info popup (hidden by default)
        const popup = this.createInfoPopup(slot, x, y - 90);
        popup.setVisible(false);

        // Click to buy zone
        const hitZone = this.add.zone(x, y, 100, 100).setInteractive({ useHandCursor: true });
        hitZone.on('pointerdown', () => {
            this.tryBuy(slot);
        });

        this.pedestals[slot] = { x, y, tierText, popup, gfx };
    }

    createInfoPopup(slot, x, y) {
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.8);
        bg.fillRoundedRect(-80, -40, 160, 80, 6);

        const text = this.add.text(0, 0, '', {
            fontFamily: 'Georgia, serif',
            fontSize: '12px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 150 }
        }).setOrigin(0.5);

        container.add([bg, text]);
        container.setDepth(100);

        // Store text reference for updates
        container.infoText = text;

        return container;
    }

    updatePopupText(slot) {
        const equipment = this.registry.get('equipment');
        const currentTier = equipment[slot];
        const data = EquipmentData[slot];
        const popup = this.pedestals[slot].popup;

        let info = `${data.tiers[currentTier]}`;

        // Show effect info
        if (data.powerMultiplier) info += `\nPower: x${data.powerMultiplier[currentTier]}`;
        if (data.maxJumps) info += `\nJumps: ${data.maxJumps[currentTier] >= 999 ? 'Fly' : data.maxJumps[currentTier]}`;
        if (data.maxHealth) info += `\nHP: ${data.maxHealth[currentTier]}`;
        if (data.damage) info += `\nDmg: ${data.damage[currentTier]}`;

        const nextPrice = getNextTierPrice(slot, currentTier);
        if (nextPrice !== null) {
            info += `\n\nUpgrade: ${nextPrice} coins`;
            info += `\n[Up/Click to buy]`;
        } else {
            info += `\n\nMAX TIER`;
        }

        popup.infoText.setText(info);
    }

    tryBuy(slot) {
        const equipment = this.registry.get('equipment');
        const currentTier = equipment[slot];
        const nextPrice = getNextTierPrice(slot, currentTier);
        const gs = this.registry.get('gameState') || { coins: 0 };
        const coins = gs.coins || 0;

        if (nextPrice !== null && coins >= nextPrice) {
            gs.coins = coins - nextPrice;
            equipment[slot] = currentTier + 1;
            this.registry.set('gameState', gs);
            this.registry.set('equipment', equipment);

            // Update display
            const data = EquipmentData[slot];
            this.pedestals[slot].tierText.setText(data.tiers[equipment[slot]]);
            this.updateCoinsDisplay();
            this.updatePopupText(slot);

            // Purchase flash
            this.cameras.main.flash(200, 201, 168, 76);
        }
    }

    createShopkeeper(x, y) {
        const gfx = this.add.graphics();

        // Body
        gfx.fillStyle(0x2d6a4f, 1);
        gfx.fillRect(x - 15, y, 30, 40);

        // Head
        gfx.fillStyle(0xdeb887, 1);
        gfx.fillCircle(x, y - 10, 15);

        // Hat (visor)
        gfx.fillStyle(0x1a472a, 1);
        gfx.fillRect(x - 18, y - 25, 36, 8);

        // Label
        this.add.text(x, y + 50, 'Shopkeeper', {
            fontFamily: 'Georgia, serif',
            fontSize: '12px',
            color: '#b7e4c7'
        }).setOrigin(0.5);

        // Dialogue popup (hidden)
        this.shopkeeperDialogue = this.add.container(x, y - 60);
        const dialogBg = this.add.graphics();
        dialogBg.fillStyle(0x000000, 0.8);
        dialogBg.fillRoundedRect(-100, -25, 200, 50, 6);
        const dialogText = this.add.text(0, 0, 'Welcome! Browse the wares.', {
            fontFamily: 'Georgia, serif',
            fontSize: '13px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 190 }
        }).setOrigin(0.5);
        this.shopkeeperDialogue.add([dialogBg, dialogText]);
        this.shopkeeperDialogue.setDepth(100);
        this.shopkeeperDialogue.setVisible(false);

        // Cheat code hint
        this.cheatHint = this.add.text(x, y + 65, '[Down] Secret code', {
            fontFamily: 'Georgia, serif',
            fontSize: '10px',
            color: '#888'
        }).setOrigin(0.5);
        this.cheatHint.setVisible(false);

        // Character swap text
        this.swapText = this.add.text(x, y + 80, '', {
            fontFamily: 'Georgia, serif',
            fontSize: '11px',
            color: '#ffd700'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.swapText.on('pointerdown', () => this.swapCharacter());
        this.swapText.setVisible(false);

        this.shopkeeperX = x;
    }

    createExitButton(x, y) {
        const btnW = 120;
        const btnH = 36;

        const btnBg = this.add.graphics();
        btnBg.fillStyle(0xc9a84c, 1);
        btnBg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 6);

        this.add.text(x, y, 'Continue >', {
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            color: '#1a472a'
        }).setOrigin(0.5);

        const hitZone = this.add.zone(x, y, btnW, btnH).setInteractive({ useHandCursor: true });

        hitZone.on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(0xe0c872, 1);
            btnBg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 6);
        });

        hitZone.on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(0xc9a84c, 1);
            btnBg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 6);
        });

        hitZone.on('pointerdown', () => {
            this.scene.start('HoleScene', { hole: this.nextHole });
        });
    }

    updateCoinsDisplay() {
        const gs = this.registry.get('gameState') || {};
        const coins = gs.coins || 0;
        this.coinsText.setText(`Coins: ${coins}`);
    }

    swapCharacter() {
        const active = this.registry.get('activeCharacter') || 'jj';
        const usedPatrick = this.registry.get('usedPatrick');

        if (active === 'jj' || active === 'default') {
            if (!usedPatrick) {
                const confirmed = confirm(
                    'Switching to Patrick will make your run ineligible for the leaderboard. Continue?'
                );
                if (!confirmed) return;
                this.registry.set('usedPatrick', true);
            }
            this.registry.set('activeCharacter', 'patrick');
        } else {
            this.registry.set('activeCharacter', 'jj');
        }
        this.updateSwapText();
    }

    updateSwapText() {
        const patrickUnlocked = this.registry.get('patrickUnlocked');
        if (!patrickUnlocked) {
            this.swapText.setVisible(false);
            return;
        }
        const active = this.registry.get('activeCharacter') || 'jj';
        const label = active === 'patrick' ? 'Swap to JJ' : 'Swap to Patrick';
        this.swapText.setText(label);
        this.swapText.setVisible(true);
    }

    handleCheatCode() {
        const code = prompt('Enter secret code:');
        if (!code) return;

        const gs = this.registry.get('gameState') || { coins: 0 };
        const coins = gs.coins || 0;

        if (code === 'password' && coins >= 50) {
            const confirmed = confirm(
                'Unlock Patrick for 50 coins? Warning: Using Patrick makes your run ineligible for the leaderboard.'
            );
            if (!confirmed) return;

            gs.coins = coins - 50;
            this.registry.set('gameState', gs);
            this.registry.set('patrickUnlocked', true);
            this.updateCoinsDisplay();
            this.updateSwapText();
            this.cameras.main.flash(400, 201, 168, 76);
        }
    }

    update() {
        // Player movement
        const speed = 4;
        if (this.keyA.isDown || this.keyLeft.isDown) {
            this.playerX = Math.max(50, this.playerX - speed);
        }
        if (this.keyD.isDown || this.keyRight.isDown) {
            this.playerX = Math.min(1150, this.playerX + speed);
        }
        this.playerMarker.setPosition(this.playerX, this.playerMarker.y);
        this.playerMarkerLabel.setPosition(this.playerX, this.playerMarkerLabel.y);

        // Check proximity to pedestals
        const slots = ['club', 'shaft', 'boots', 'shirt'];
        slots.forEach(slot => {
            const ped = this.pedestals[slot];
            const dist = Math.abs(this.playerX - ped.x);
            const near = dist < 80;
            ped.popup.setVisible(near);
            if (near) {
                this.updatePopupText(slot);

                // Up arrow to buy
                if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
                    this.tryBuy(slot);
                }
            }
        });

        // Check proximity to shopkeeper
        const shopDist = Math.abs(this.playerX - this.shopkeeperX);
        const nearShop = shopDist < 80;
        this.shopkeeperDialogue.setVisible(nearShop);
        this.cheatHint.setVisible(nearShop);
        this.updateSwapText();

        if (nearShop && Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            this.handleCheatCode();
        }
    }
}
