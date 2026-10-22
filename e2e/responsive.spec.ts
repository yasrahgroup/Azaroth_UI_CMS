import { test, expect } from '@playwright/test';

const routes = ['/', '/products', '/contact', '/product/gym-management'];
const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'mobile-small', width: 320, height: 640 },
];

test.describe('public pages stay responsive', () => {
  for (const viewport of viewports) {
    test(`${viewport.name} view has no horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const route of routes) {
        await page.goto(route, { waitUntil: 'networkidle' });
        const sizes = await page.evaluate(() => ({
          innerWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
        }));
        expect(
          sizes.scrollWidth,
          `${route} overflows at ${viewport.width}px (${sizes.scrollWidth}px > ${sizes.innerWidth}px)`
        ).toBeLessThanOrEqual(sizes.innerWidth + 1);
      }
    });
  }

  test('navigation switches between drawer and full menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('mobile-nav-toggle')).toBeVisible();

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByTestId('mobile-nav-toggle')).toBeHidden();
  });
});
