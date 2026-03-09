const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS49XDtAb3svIzIoEjvpzz19aPpfjJcRxZUuxI8qFPo-xemZnWM1-VdE-wiGhtk_iS-UtZD_hk1gRbl/pub?output=csv';
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSd4E6PN9B8Ukg_aTcTXO-v9DqEyLHi5JBpFlyUZakLIcNMXGg/formResponse';
const ENTRY_GAME = 'entry.1771708931';
const ENTRY_NAME = 'entry.1133504589';
const ENTRY_SCORE = 'entry.1610870950';
const GAME_NAME = 'golf-quest';

export class LeaderboardScene extends Phaser.Scene {
    constructor() {
        super('LeaderboardScene');
        this.nameInput = null;
    }

    init() {
        this.gameState = this.registry.get('gameState') || {};
        this.scores = this.gameState.scores || [];
        this.totalScore = this.scores.reduce((sum, s) => sum + s, 0);
        this.usedPatrick = this.registry.get('usedPatrick') || false;
    }

    create() {
        this.showScoreEntry();
    }

    showScoreEntry() {
        const { width, height } = this.cameras.main;

        // Dark green background
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

        // Title
        this.add.text(width / 2, 50, 'Round Complete!', {
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '32px',
            color: '#c9a84c',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Total score
        this.add.text(width / 2, 100, `Total: ${this.totalScore} strokes`, {
            fontFamily: 'Georgia, serif',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Score breakdown per hole
        const breakdownY = 140;
        const cols = Math.min(this.scores.length, 9);
        const colWidth = 100;
        const startX = width / 2 - ((cols - 1) * colWidth) / 2;

        for (let i = 0; i < this.scores.length; i++) {
            const x = startX + i * colWidth;
            this.add.text(x, breakdownY, `Hole ${i + 1}`, {
                fontFamily: 'Georgia, serif',
                fontSize: '13px',
                color: '#b7e4c7'
            }).setOrigin(0.5);
            this.add.text(x, breakdownY + 20, `${this.scores[i]}`, {
                fontFamily: 'Georgia, serif',
                fontSize: '15px',
                color: '#ffffff'
            }).setOrigin(0.5);
        }

        if (this.usedPatrick) {
            this.add.text(width / 2, height * 0.45, 'Patrick Wong players are ineligible\nfor the leaderboard', {
                fontFamily: 'Georgia, serif',
                fontSize: '18px',
                color: '#ff9999',
                align: 'center'
            }).setOrigin(0.5);

            // Auto-advance after a brief pause
            this.time.delayedCall(2000, () => this.showLeaderboard());
        } else {
            this.showNameInput(width, height);
        }
    }

    showNameInput(width, height) {
        const inputY = height * 0.45;

        this.add.text(width / 2, inputY - 40, 'Enter your name for the leaderboard:', {
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            color: '#b7e4c7'
        }).setOrigin(0.5);

        // Create DOM input overlay
        this.nameInput = document.createElement('input');
        this.nameInput.type = 'text';
        this.nameInput.placeholder = 'Enter your name';
        this.nameInput.maxLength = 24;
        this.nameInput.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);padding:10px;font-size:16px;border:2px solid #c9a84c;border-radius:6px;background:rgba(0,0,0,0.7);color:#fff;font-family:Georgia,serif;width:250px;outline:none;text-align:center;';

        const container = document.getElementById('game-container');
        if (container) {
            container.appendChild(this.nameInput);
        }

        // Pre-fill from localStorage
        const savedName = localStorage.getItem('jhi-leaderboard-name');
        if (savedName) {
            this.nameInput.value = savedName;
        }

        this.nameInput.focus();

        // Submit button
        const btnY = inputY + 60;
        const btnW = 160;
        const btnH = 44;

        const submitBg = this.add.graphics();
        submitBg.fillStyle(0xc9a84c, 1);
        submitBg.fillRoundedRect(width / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);

        const submitText = this.add.text(width / 2, btnY, 'Submit Score', {
            fontFamily: 'Georgia, serif',
            fontSize: '18px',
            color: '#1a472a'
        }).setOrigin(0.5);

        const submitZone = this.add.zone(width / 2, btnY, btnW, btnH).setInteractive({ useHandCursor: true });

        submitZone.on('pointerover', () => {
            submitBg.clear();
            submitBg.fillStyle(0xe0c872, 1);
            submitBg.fillRoundedRect(width / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
        });

        submitZone.on('pointerout', () => {
            submitBg.clear();
            submitBg.fillStyle(0xc9a84c, 1);
            submitBg.fillRoundedRect(width / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
        });

        submitZone.on('pointerdown', () => {
            const name = this.nameInput ? this.nameInput.value.trim() : '';
            if (name.length === 0) {
                this.nameInput.style.borderColor = '#ff4444';
                return;
            }
            this.removeNameInput();
            this.submitScore(name, this.totalScore);
        });

        // Allow Enter key to submit
        this.nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const name = this.nameInput ? this.nameInput.value.trim() : '';
                if (name.length === 0) return;
                this.removeNameInput();
                this.submitScore(name, this.totalScore);
            }
        });

        // Skip button
        const skipY = btnY + 50;
        const skipText = this.add.text(width / 2, skipY, 'Skip', {
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            color: '#888888'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        skipText.on('pointerover', () => skipText.setColor('#aaaaaa'));
        skipText.on('pointerout', () => skipText.setColor('#888888'));
        skipText.on('pointerdown', () => {
            this.removeNameInput();
            this.showLeaderboard();
        });
    }

    async submitScore(name, score) {
        localStorage.setItem('jhi-leaderboard-name', name);
        const formData = new URLSearchParams();
        formData.append(ENTRY_GAME, GAME_NAME);
        formData.append(ENTRY_NAME, name);
        formData.append(ENTRY_SCORE, score);

        const { width, height } = this.cameras.main;

        // Show submitting message
        const submittingText = this.add.text(width / 2, height * 0.75, 'Submitting score...', {
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            color: '#b7e4c7'
        }).setOrigin(0.5);

        try {
            await fetch(FORM_URL, { method: 'POST', mode: 'no-cors', body: formData });
            submittingText.setText('Score submitted!');
            // Brief delay for sheet to update
            setTimeout(() => this.showLeaderboard(), 1500);
        } catch (e) {
            submittingText.setText('Error submitting score. Tap to retry.');
            submittingText.setColor('#ff9999').setInteractive({ useHandCursor: true });
            submittingText.on('pointerdown', () => {
                submittingText.destroy();
                this.submitScore(name, score);
            });
        }
    }

    async showLeaderboard() {
        // Clear everything
        this.children.removeAll(true);
        this.removeNameInput();

        const { width, height } = this.cameras.main;

        // Background
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

        // Title
        this.add.text(width / 2, 40, 'Leaderboard', {
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '32px',
            color: '#c9a84c',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Loading text
        const loadingText = this.add.text(width / 2, height / 2, 'Loading leaderboard...', {
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            color: '#b7e4c7'
        }).setOrigin(0.5);

        try {
            const entries = await this.fetchLeaderboard();
            loadingText.destroy();
            this.displayEntries(entries, width, height);
        } catch (e) {
            loadingText.setText('Could not load leaderboard.');
            loadingText.setColor('#ff9999');
        }

        this.addShareAndReplayButtons(width, height);
    }

    async fetchLeaderboard() {
        const res = await fetch(SHEET_CSV_URL + '&_t=' + Date.now());
        const csv = await res.text();
        const lines = csv.trim().split('\n').slice(1); // skip header
        const entries = lines.map(line => {
            const [timestamp, game, name, score] = line.split(',');
            return { game, name, score: parseInt(score), date: timestamp ? timestamp.split(' ')[0] : '' };
        }).filter(e => e.game === GAME_NAME && !isNaN(e.score))
          .sort((a, b) => a.score - b.score)
          .slice(0, 10);
        return entries;
    }

    displayEntries(entries, width, height) {
        const startY = 90;
        const rowHeight = 38;
        const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32'];

        // Header row
        const headerStyle = {
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            color: '#b7e4c7'
        };
        this.add.text(width * 0.15, startY, 'Rank', headerStyle).setOrigin(0.5);
        this.add.text(width * 0.4, startY, 'Name', headerStyle).setOrigin(0.5);
        this.add.text(width * 0.65, startY, 'Score', headerStyle).setOrigin(0.5);
        this.add.text(width * 0.85, startY, 'Date', headerStyle).setOrigin(0.5);

        if (entries.length === 0) {
            this.add.text(width / 2, startY + rowHeight * 2, 'No scores yet. Be the first!', {
                fontFamily: 'Georgia, serif',
                fontSize: '16px',
                color: '#ffffff'
            }).setOrigin(0.5);
            return;
        }

        entries.forEach((entry, i) => {
            const y = startY + rowHeight * (i + 1);
            const color = i < 3 ? rankColors[i] : '#ffffff';
            const style = {
                fontFamily: 'Georgia, serif',
                fontSize: '16px',
                color: color
            };

            this.add.text(width * 0.15, y, `${i + 1}`, style).setOrigin(0.5);
            this.add.text(width * 0.4, y, entry.name, style).setOrigin(0.5);
            this.add.text(width * 0.65, y, `${entry.score}`, style).setOrigin(0.5);
            this.add.text(width * 0.85, y, entry.date, { ...style, fontSize: '13px' }).setOrigin(0.5);
        });
    }

    addShareAndReplayButtons(width, height) {
        const btnW = 180;
        const btnH = 44;
        const btnY = height - 60;

        // Share Score button
        const shareX = width / 2 - 110;
        const shareBg = this.add.graphics();
        shareBg.fillStyle(0x4a7c59, 1);
        shareBg.fillRoundedRect(shareX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);

        this.add.text(shareX, btnY, 'Share Score', {
            fontFamily: 'Georgia, serif',
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const shareZone = this.add.zone(shareX, btnY, btnW, btnH).setInteractive({ useHandCursor: true });
        shareZone.on('pointerover', () => {
            shareBg.clear();
            shareBg.fillStyle(0x5a9c6a, 1);
            shareBg.fillRoundedRect(shareX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
        });
        shareZone.on('pointerout', () => {
            shareBg.clear();
            shareBg.fillStyle(0x4a7c59, 1);
            shareBg.fillRoundedRect(shareX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
        });
        shareZone.on('pointerdown', () => {
            this.shareScore();
        });

        // Play Again button
        const replayX = width / 2 + 110;
        const replayBg = this.add.graphics();
        replayBg.fillStyle(0xc9a84c, 1);
        replayBg.fillRoundedRect(replayX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);

        this.add.text(replayX, btnY, 'Play Again', {
            fontFamily: 'Georgia, serif',
            fontSize: '18px',
            color: '#1a472a'
        }).setOrigin(0.5);

        const replayZone = this.add.zone(replayX, btnY, btnW, btnH).setInteractive({ useHandCursor: true });
        replayZone.on('pointerover', () => {
            replayBg.clear();
            replayBg.fillStyle(0xe0c872, 1);
            replayBg.fillRoundedRect(replayX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
        });
        replayZone.on('pointerout', () => {
            replayBg.clear();
            replayBg.fillStyle(0xc9a84c, 1);
            replayBg.fillRoundedRect(replayX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
        });
        replayZone.on('pointerdown', () => {
            this.removeNameInput();
            // Clear gameState for fresh run
            this.registry.set('gameState', {});
            this.registry.set('scores', []);
            this.registry.set('currentHole', 1);
            this.registry.set('strokes', 0);
            this.registry.set('coins', 0);
            this.registry.set('activeCharacter', 'default');
            this.registry.set('usedPatrick', false);
            this.registry.set('equipment', { club: 0, shaft: 0, boots: 0, shirt: 0 });
            this.scene.start('MenuScene');
        });
    }

    shareScore() {
        // Create a canvas-based score card for sharing
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#1a472a';
        ctx.fillRect(0, 0, 600, 400);

        // Title
        ctx.fillStyle = '#c9a84c';
        ctx.font = 'bold 28px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('JHI Golf Quest', 300, 50);

        // Score
        ctx.fillStyle = '#ffffff';
        ctx.font = '22px Georgia, serif';
        ctx.fillText(`Total: ${this.totalScore} strokes`, 300, 100);

        // Hole breakdown
        ctx.font = '16px Georgia, serif';
        ctx.fillStyle = '#b7e4c7';
        for (let i = 0; i < this.scores.length; i++) {
            const col = i % 5;
            const row = Math.floor(i / 5);
            const x = 120 + col * 100;
            const y = 150 + row * 50;
            ctx.fillText(`Hole ${i + 1}: ${this.scores[i]}`, x, y);
        }

        // Watermark
        ctx.fillStyle = '#c9a84c';
        ctx.font = '14px Georgia, serif';
        ctx.fillText('jhigolfquest.com', 300, 370);

        // Convert to blob and share or download
        canvas.toBlob((blob) => {
            if (navigator.share && navigator.canShare) {
                const file = new File([blob], 'golf-quest-score.png', { type: 'image/png' });
                const shareData = {
                    title: 'JHI Golf Quest Score',
                    text: `I scored ${this.totalScore} strokes in JHI Golf Quest!`,
                    files: [file]
                };
                if (navigator.canShare(shareData)) {
                    navigator.share(shareData).catch(() => {});
                    return;
                }
            }
            // Fallback: download the image
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'golf-quest-score.png';
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    }

    removeNameInput() {
        if (this.nameInput && this.nameInput.parentNode) {
            this.nameInput.parentNode.removeChild(this.nameInput);
        }
        this.nameInput = null;
    }

    shutdown() {
        this.removeNameInput();
    }
}
