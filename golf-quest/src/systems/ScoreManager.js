export class ScoreManager {
    static calculateHoleScore(strokes, par) {
        return strokes;
    }

    static getParLabel(strokes, par) {
        const diff = strokes - par;
        if (diff <= -3) return 'Albatross!';
        if (diff === -2) return 'Eagle!';
        if (diff === -1) return 'Birdie!';
        if (diff === 0) return 'Par';
        if (diff === 1) return 'Bogey';
        if (diff === 2) return 'Double Bogey';
        return `+${diff}`;
    }

    static calculateCoins(strokes, par, enemiesKilled, waterPenalties) {
        let coins = 0;
        coins += waterPenalties * 10;
        coins += enemiesKilled * 5;
        const diff = strokes - par;
        if (diff <= 0) coins += 3;
        else coins += Math.max(0, 5 - diff);
        return Math.max(coins, 1);
    }

    static getTotalScore(scores) {
        return scores.reduce((a, b) => a + b, 0);
    }

    static getTotalParLabel(totalScore, totalPar) {
        const diff = totalScore - totalPar;
        if (diff < 0) return `${diff} (Under Par)`;
        if (diff === 0) return 'Even Par';
        return `+${diff} (Over Par)`;
    }
}
