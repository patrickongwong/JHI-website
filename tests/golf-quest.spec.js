const { test, expect } = require('@playwright/test');

test.describe('Golf Quest', () => {
    test('loads and shows canvas', async ({ page }) => {
        await page.goto('/golf-quest/');
        await page.waitForSelector('canvas', { timeout: 10000 });
        const canvas = await page.locator('canvas');
        await expect(canvas).toBeVisible();
    });

    test('canvas has correct dimensions', async ({ page }) => {
        await page.goto('/golf-quest/');
        await page.waitForSelector('canvas', { timeout: 10000 });
        const canvas = await page.locator('canvas');
        const box = await canvas.boundingBox();
        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
    });
});
