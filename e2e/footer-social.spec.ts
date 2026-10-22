import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'e2e-admin@example.com';
const ADMIN_PASSWORD = 'E2eOnly!Passw0rd';
const LINKEDIN_URL = 'https://www.linkedin.com/company/azaroth-e2e';

test('an enabled social platform persists and renders in the public footer', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByTestId('admin-email').fill(ADMIN_EMAIL);
  await page.getByTestId('admin-password').fill(ADMIN_PASSWORD);
  await page.getByTestId('admin-login-submit').click();
  await expect(page).toHaveURL(/\/admin(\/dashboard)?$/);

  await page.goto('/admin/footer');
  await page.getByTestId('footer-tab-social').click();
  await page.getByTestId('footer-social-enabled-linkedin').check();
  await page.getByTestId('footer-social-url-linkedin').fill(LINKEDIN_URL);
  await expect(page.getByTestId('footer-social-hidden-warning')).toHaveCount(0);

  await expect
    .poll(async () => {
      const response = await page.request.get('/api/settings/draft', {
        headers: {
          Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('ath_token'))}`,
        },
      });
      if (!response.ok()) return false;
      const draft = await response.json();
      const linkedin = (draft.footer.socialItems || []).find(
        (item: { platform: string }) => item.platform === 'linkedin'
      );
      return linkedin?.enabled === true && linkedin?.url === LINKEDIN_URL;
    })
    .toBe(true);

  await page.reload();
  await page.getByTestId('footer-tab-social').click();
  await expect(page.getByTestId('footer-social-enabled-linkedin')).toBeChecked();
  await expect(page.getByTestId('footer-social-url-linkedin')).toHaveValue(LINKEDIN_URL);

  await page.getByTestId('footer-publish').click();
  await expect(page.getByTestId('footer-feedback')).toContainText('published to live website');

  await page.goto('/');
  const linkedin = page.getByTestId('footer-social-linkedin');
  await expect(linkedin).toBeVisible();
  await expect(linkedin.locator('a')).toHaveAttribute('href', LINKEDIN_URL);
});
