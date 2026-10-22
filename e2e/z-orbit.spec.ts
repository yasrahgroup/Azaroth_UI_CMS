import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'e2e-admin@example.com';
const ADMIN_PASSWORD = 'E2eOnly!Passw0rd';

test('a saved site-wide orbital animation does not render an orb over public pages', async ({
  page,
  request,
}) => {
  const login = await request.post('/api/auth/login', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(login.ok(), await login.text()).toBeTruthy();
  const { token } = await login.json();
  const headers = { Authorization: ['Bearer', token].join(' ') };

  const settingsResponse = await request.get('/api/settings/draft', { headers });
  expect(settingsResponse.ok(), await settingsResponse.text()).toBeTruthy();
  const draft = await settingsResponse.json();
  const animations = draft.animation.animations.filter(
    (animation: { id: string }) => animation.id !== 'e2e-global-orbit'
  );
  animations.push({
    id: 'e2e-global-orbit',
    name: 'Disc Drift',
    category: 'continuous',
    type: 'orbit-spin',
    targetScope: 'global',
    targetComponent: 'all',
    durationMs: 4200,
    enabled: true,
    repeatCount: 'infinite',
  });

  const updateResponse = await request.post('/api/settings/draft', {
    headers,
    data: { animation: { animationsEnabled: true, animations } },
  });
  expect(updateResponse.ok(), await updateResponse.text()).toBeTruthy();

  const publishResponse = await request.post('/api/settings/publish', { headers });
  expect(publishResponse.ok(), await publishResponse.text()).toBeTruthy();

  for (const route of ['/contact', '/products']) {
    await page.goto(route);
    await expect(
      page.locator('.fixed.inset-0.z-\\[5\\] [aria-label="Decorative three-dimensional sphere"]')
    ).toHaveCount(0);
  }
});
