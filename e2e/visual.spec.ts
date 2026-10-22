import { test, expect, type APIRequestContext } from '@playwright/test';

const ADMIN_EMAIL = 'e2e-admin@example.com';
const ADMIN_PASSWORD = 'E2eOnly!Passw0rd';
const VISUAL_PAGE_SLUG = 'visual-overlay-page';
const HERO_IMAGE = '/src/assets/images/hero_tech_enterprise_1792419734209.jpg';

test.describe.configure({ mode: 'serial' });
test.skip(
  process.platform !== 'win32',
  'Visual baselines are generated on Windows; regenerate them on the target platform.'
);

async function loginApi(request: APIRequestContext): Promise<string> {
  const response = await request.post('/api/auth/login', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = await response.json();
  return body.token;
}

async function seedVisualPage(request: APIRequestContext, token: string) {
  const headers = { Authorization: `Bearer ${token}` };

  const settingsRes = await request.post('/api/settings/draft', {
    headers,
    data: {
      header: {
        brandName: 'Azaroth Tech-Hive',
        brandSubName: 'ENTERPRISE SYSTEMS',
        overlayTransparency: 40,
        navbarTransparencyOnScroll: 0,
        overlayBackgroundColor: '#171B2C',
      },
    },
  });
  expect(settingsRes.ok(), await settingsRes.text()).toBeTruthy();
  const publishSettingsRes = await request.post('/api/settings/publish', { headers });
  expect(publishSettingsRes.ok(), await publishSettingsRes.text()).toBeTruthy();

  const pageRes = await request.post(`/api/pages/${VISUAL_PAGE_SLUG}/draft`, {
    headers,
    data: {
      slug: VISUAL_PAGE_SLUG,
      title: 'Visual Regression Page',
      metaDescription: 'Stable page used for visual regression checks.',
      isPublished: false,
      sections: [
        {
          id: 'visual-hero',
          type: 'hero',
          title: 'Enterprise Digital Foundations',
          subtitle: 'Stable overlay rendering for visual regression coverage.',
          content: 'Deterministic hero content.',
          bgMode: 'image-gradient',
          bannerImageUrl: HERO_IMAGE,
          bgGradientFrom: '#171B2C',
          bgGradientTo: '#910B2C',
          bgGradientAngle: 135,
          bgOverlayOpacity: 70,
          ctaText: 'Explore',
          ctaUrl: '#products',
        },
        {
          id: 'visual-surface',
          type: 'feature_grid',
          title: 'Stable Surface Section',
          bgMode: 'surface',
        },
      ],
    },
  });
  expect(pageRes.ok(), await pageRes.text()).toBeTruthy();
  const publishPageRes = await request.post(`/api/pages/${VISUAL_PAGE_SLUG}/publish`, { headers });
  expect(publishPageRes.ok(), await publishPageRes.text()).toBeTruthy();
}

async function waitForStablePage(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete));
}

test('desktop overlay navbar matches the visual baseline', async ({ page, request }) => {
  const token = await loginApi(request);
  await seedVisualPage(request, token);

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`/${VISUAL_PAGE_SLUG}`);
  await waitForStablePage(page);

  await expect(page.getByTestId('navbar')).toHaveScreenshot('overlay-navbar-desktop.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.01,
  });
});

test('mobile navigation drawer matches the visual baseline', async ({ page, request }) => {
  const token = await loginApi(request);
  await seedVisualPage(request, token);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/${VISUAL_PAGE_SLUG}`);
  await waitForStablePage(page);

  await page.getByTestId('mobile-nav-toggle').click();
  const drawer = page.getByTestId('mobile-nav-drawer');
  await expect(drawer).toBeVisible();

  await expect(drawer).toHaveScreenshot('mobile-nav-drawer.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.01,
  });
});
