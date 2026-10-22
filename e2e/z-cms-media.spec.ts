import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test.describe.configure({ mode: 'serial' });

const ADMIN_EMAIL = 'e2e-admin@example.com';
const ADMIN_PASSWORD = 'E2eOnly!Passw0rd';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/admin/login');
  await page.getByTestId('admin-email').fill(ADMIN_EMAIL);
  await page.getByTestId('admin-password').fill(ADMIN_PASSWORD);
  await page.getByTestId('admin-login-submit').click();
  await expect(page).toHaveURL(/\/admin(\/dashboard)?$/);
}

test('Media Library uploads, renames, downloads, and deletes an asset', async ({ page }) => {
  const originalName = `cms-media-${Date.now()}.png`;
  const displayName = `Client approved ${originalName}`;
  const fileContents = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3, 4]);

  await login(page);
  await page.goto('/admin/media');
  await page.locator('input[type="file"]').setInputFiles({
    name: originalName,
    mimeType: 'image/png',
    buffer: fileContents,
  });

  await expect(page.getByText(originalName, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: `Rename ${originalName}` }).click();
  await page.getByRole('textbox', { name: 'Media display name' }).fill(displayName);
  await page.getByRole('button', { name: 'Save media name' }).click();
  await expect(page.getByText(displayName, { exact: true })).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: `Download ${displayName}` }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(displayName);

  const downloadPath = test.info().outputPath(download.suggestedFilename());
  await download.saveAs(downloadPath);
  expect(await readFile(downloadPath)).toEqual(fileContents);

  page.once('dialog', (dialog) => dialog.accept());
  const assetCard = page.locator('div.rounded-xl.border.overflow-hidden').filter({
    hasText: displayName,
  });
  await assetCard.getByTitle('Delete Asset').click();
  await expect(page.getByText(displayName, { exact: true })).toHaveCount(0);
});

test('Branding Manager publishes a changed website name', async ({ page, request }) => {
  await login(page);
  const token = await page.evaluate(() => localStorage.getItem('ath_token'));
  expect(token).toBeTruthy();

  const originalResponse = await request.get('/api/settings');
  expect(originalResponse.ok()).toBeTruthy();
  const originalName = (await originalResponse.json()).header.brandName;
  const clientName = `Client Sign-off ${Date.now()}`;

  await page.goto('/admin/branding');
  await page.getByRole('textbox', { name: 'Main brand name' }).fill(clientName);
  await expect
    .poll(async () => {
      const response = await request.get('/api/settings/draft', {
        headers: { Authorization: ['Bearer', token].join(' ') },
      });
      return response.ok() ? (await response.json()).header.brandName : null;
    })
    .toBe(clientName);

  await page.getByRole('button', { name: 'Save & Publish' }).click();
  await expect(page.getByText('Branding published to live website!')).toBeVisible();
  await page.goto('/');
  await expect(page.getByTestId('navbar')).toContainText(clientName);

  const restoreDraft = await request.post('/api/settings/draft', {
    headers: { Authorization: ['Bearer', token].join(' ') },
    data: { header: { brandName: originalName } },
  });
  expect(restoreDraft.ok(), await restoreDraft.text()).toBeTruthy();
  const restorePublish = await request.post('/api/settings/publish', {
    headers: { Authorization: ['Bearer', token].join(' ') },
  });
  expect(restorePublish.ok(), await restorePublish.text()).toBeTruthy();
});

test('Leads Inbox exports a CSV download', async ({ page, request }) => {
  const leadName = `CSV Export Check ${Date.now()}`;
  const created = await request.post('/api/leads', {
    data: {
      name: leadName,
      email: 'csv-export@example.com',
      company: 'E2E Client',
      businessType: 'Technology',
      productInterest: 'CMS',
      requirements: 'Verify leads CSV download.',
    },
  });
  expect(created.ok(), await created.text()).toBeTruthy();

  await login(page);
  await page.goto('/admin/inbox');
  await expect(page.getByText(leadName, { exact: true })).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Leads CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^azaroth_leads_\d+\.csv$/);

  const downloadPath = test.info().outputPath(download.suggestedFilename());
  await download.saveAs(downloadPath);
  expect(await readFile(downloadPath, 'utf8')).toContain(leadName);
});
