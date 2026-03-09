export const EquipmentData = {
    club: {
        tiers: ['Copper', 'Silver', 'Steel', 'Gold', 'Diamond'],
        prices: [0, 3, 5, 8, 12],
        powerMultiplier: [1.0, 1.25, 1.5, 1.75, 2.0],
        damage: [1, 2, 3, 4, 5]
    },
    shaft: {
        tiers: ['Standard', 'Autoflex Pink'],
        prices: [0, 4]
    },
    boots: {
        tiers: ['Standard', 'Double-Jump', 'Triple-Jump', 'Flying'],
        prices: [0, 4, 7, 12],
        maxJumps: [1, 2, 3, 999]
    },
    shirt: {
        tiers: ['Plain White', 'Navy Polo', 'Striped', 'Gold-Trimmed', 'Diamond Argyle'],
        prices: [0, 3, 5, 8, 12],
        maxHealth: [2, 3, 4, 5, 6]
    }
};

export function getNextTierPrice(slot, currentTier) {
    const data = EquipmentData[slot];
    const nextTier = currentTier + 1;
    if (nextTier >= data.tiers.length) return null;
    return data.prices[nextTier];
}

export function canAfford(coins, slot, currentTier) {
    const price = getNextTierPrice(slot, currentTier);
    return price !== null && coins >= price;
}
