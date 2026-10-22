import { test, expect, type APIRequestContext } from '@playwright/test';

const ADMIN_EMAIL = 'e2e-admin@example.com';
const ADMIN_PASSWORD = 'E2eOnly!Passw0rd';
const PAGE_SLUG = 'e2e-overlay-page';

test.describe.configure({ mode: 'serial' });

async function loginApi(request: APIRequestContext): Promise<string> {
  const response = await request.post('/api/auth/login', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = await response.json();
  return body.token;
}

async function seedPublishedOverlayPage(request: APIRequestContext, token: string) {
  const settingsRes = await request.post('/api/settings/draft', {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      header: {
        isTransparentOnHero: true,
        overlayTransparency: 40,
        navbarTransparencyOnScroll: 0,
        overlayBackgroundColor: '#171B2C',
      },
    },
  });
  expect(settingsRes.ok(), await settingsRes.text()).toBeTruthy();

  const publishSettingsRes = await request.post('/api/settings/publish', {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(publishSettingsRes.ok(), await publishSettingsRes.text()).toBeTruthy();

  const pageRes = await request.post(`/api/pages/${PAGE_SLUG}/draft`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      slug: PAGE_SLUG,
      title: 'E2E Overlay Page',
      metaDescription: 'Overlay and footer automated verification page.',
      isPublished: false,
      sections: [
        {
          id: 'e2e-hero',
          type: 'hero',
          title: 'Overlay Hero',
          subtitle: 'Navbar overlay verification',
          bgMode: 'image-gradient',
          bannerImageUrl: '/uploads/e2e-overlay-banner.png',
          bgGradientFrom: '#171B2C',
          bgGradientTo: '#910B2C',
          bgGradientAngle: 135,
          bgOverlayOpacity: 70,
        },
        {
          id: 'e2e-features',
          type: 'feature_grid',
          title: 'Finishing Section',
          bgMode: 'surface',
        },
      ],
    },
  });
  expect(pageRes.ok(), await pageRes.text()).toBeTruthy();

  const publishPageRes = await request.post(`/api/pages/${PAGE_SLUG}/publish`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(publishPageRes.ok(), await publishPageRes.text()).toBeTruthy();
}

test('published hero overlay renders the navbar with the configured transparency', async ({ page, request }) => {
  const token = await loginApi(request);
  await seedPublishedOverlayPage(request, token);

  await page.goto(`/${PAGE_SLUG}`);
  const navbar = page.getByTestId('navbar');
  await expect(navbar).toBeVisible();
  await expect(navbar).toHaveAttribute('data-overlay', 'true');
  await expect(navbar).toHaveAttribute('data-bg-mode', 'overlay');
  await expect(navbar).toHaveAttribute('data-transparency', '40');

  const topColor = await navbar.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(topColor).toBe('rgba(23, 27, 44, 0.6)');

  await page.evaluate(() => window.scrollTo(0, 240));
  await expect
    .poll(() => navbar.evaluate((element) => getComputedStyle(element).backgroundColor))
    .toMatch(/^rgba?\(23,\s*27,\s*44(?:,\s*1)?\)$/);

  await expect(page.getByTestId('footer')).toBeVisible();
  await expect(page.getByTestId('footer-social-linkedin')).toBeVisible();
  const year = new Date().getFullYear();
  await expect(page.getByTestId('footer-copyright')).toContainText(String(year));
});

test('overlay header styling applies to every public page', async ({ page }) => {
  for (const route of ['/product', '/services']) {
    await page.goto(route);
    const navbar = page.getByTestId('navbar');
    await expect(navbar).toBeVisible();
    await expect(navbar).toHaveAttribute('data-overlay', 'true');
    await expect(navbar).toHaveAttribute('data-bg-mode', 'overlay');
    await expect(navbar).toHaveAttribute('data-transparency', '40');

    await expect
      .poll(() => navbar.evaluate((element) => getComputedStyle(element).backgroundColor))
      .toBe('rgba(23, 27, 44, 0.6)');
  }
});

test('footer edits save as draft and publish to the public site', async ({ page, request }) => {
  const unique = `E2E Footer ${Date.now()}`;
  const copyright = `© {year} E2E Holdings. All rights reserved.`;

  await page.goto('/admin/login');
  await page.getByTestId('admin-email').fill(ADMIN_EMAIL);
  await page.getByTestId('admin-password').fill(ADMIN_PASSWORD);
  await page.getByTestId('admin-login-submit').click();
  await expect(page).toHaveURL(/\/admin(\/dashboard)?$/);

  await page.goto('/admin/footer');
  await page.getByTestId('footer-tab-elements').click();
  await page.getByTestId('footer-newsletter-title-input').fill(unique);
  await page.getByTestId('footer-copyright-input').fill(copyright);

  await page.getByTestId('footer-publish').click();
  await expect(page.getByTestId('footer-feedback')).toContainText('published to live website');

  const publishedSettings = await request.get('/api/settings');
  expect(publishedSettings.ok(), await publishedSettings.text()).toBeTruthy();
  const publishedBody = await publishedSettings.json();
  expect(publishedBody.footer.newsletterTitle).toBe(unique);
  expect(publishedBody.footer.copyrightText).toContain('E2E Holdings');

  await page.goto('/');
  await expect(page.getByTestId('footer-copyright')).toContainText(`${new Date().getFullYear()} E2E Holdings`);
  await expect(page.getByTestId('footer-copyright')).not.toContainText('{year}');
});

test('mobile navigation drawer opens over the overlay navbar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/${PAGE_SLUG}`);
  await page.getByTestId('mobile-nav-toggle').click();
  await expect(page.getByTestId('mobile-nav-drawer')).toBeVisible();
});

test('RTL footer brand lockup stays flush with the right edge of its column', async ({ page, request }) => {
  const token = await loginApi(request);
  const settingsRes = await request.post('/api/settings/draft', {
    headers: { Authorization: `Bearer ${token}` },
    data: { footer: { direction: 'rtl' } },
  });
  expect(settingsRes.ok(), await settingsRes.text()).toBeTruthy();

  const publishRes = await request.post('/api/settings/publish', {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(publishRes.ok(), await publishRes.text()).toBeTruthy();

  await page.goto('/');
  const brandWrapper = page.getByTestId('footer-brand');
  const brandLockup = page.getByTestId('footer-brand-logo');
  await expect(brandWrapper).toBeVisible();
  await expect(brandLockup).toBeVisible();

  const wrapperBox = await brandWrapper.boundingBox();
  const lockupBox = await brandLockup.boundingBox();
  expect(wrapperBox).not.toBeNull();
  expect(lockupBox).not.toBeNull();

  const wrapperRight = wrapperBox!.x + wrapperBox!.width;
  const lockupRight = lockupBox!.x + lockupBox!.width;
  expect(Math.abs(wrapperRight - lockupRight)).toBeLessThan(2);

  const footerDirection = await page.getByTestId('footer').getAttribute('dir');
  expect(footerDirection).toBe('rtl');
});

test('disabling every social platform keeps the Follow Us block visible in the public footer', async ({ page, request }) => {
  const token = await loginApi(request);
  const platforms = [
    'linkedin',
    'x',
    'facebook',
    'instagram',
    'youtube',
    'github',
    'whatsapp',
    'tiktok',
    'pinterest',
    'discord',
  ];
  const settingsRes = await request.post('/api/settings/draft', {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      footer: {
        socialItems: platforms.map((platform) => ({
          id: `soc-${platform}`,
          platform,
          url: platform === 'linkedin' ? 'https://linkedin.com/company/e2e' : '',
          enabled: false,
          label: platform,
        })),
      },
    },
  });
  expect(settingsRes.ok(), await settingsRes.text()).toBeTruthy();

  const publishRes = await request.post('/api/settings/publish', {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(publishRes.ok(), await publishRes.text()).toBeTruthy();

  await page.goto('/');
  await expect(page.getByTestId('footer')).toBeVisible();
  await expect(page.getByTestId('footer-social')).toBeVisible();
  await expect(page.getByTestId('footer-social-linkedin')).toHaveCount(0);
});
