import { test, expect, type APIRequestContext } from '@playwright/test';

const ADMIN_EMAIL = 'e2e-admin@example.com';
const ADMIN_PASSWORD = 'E2eOnly!Passw0rd';

async function loginApi(request: APIRequestContext): Promise<string> {
  const response = await request.post('/api/auth/login', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = await response.json();
  return body.token;
}

test('CMS draft preview shows unpublished settings and pages without publishing', async ({ page, context, request }) => {
  const token = await loginApi(request);
  const headers = { Authorization: `Bearer ${token}` };
  const marker = `Draft Preview E2E ${Date.now()}`;
  const pageMarker = `Draft Page E2E ${Date.now()}`;

  const draftRes = await request.post('/api/settings/draft', {
    headers,
    data: {
      footer: {
        copyrightText: `${marker} {year}. All rights reserved.`,
      },
    },
  });
  expect(draftRes.ok(), await draftRes.text()).toBeTruthy();

  const homeDraftRes = await request.get('/api/pages/home?draft=true', { headers });
  expect(homeDraftRes.ok(), await homeDraftRes.text()).toBeTruthy();
  const homePage = await homeDraftRes.json();
  expect(Array.isArray(homePage.sections)).toBeTruthy();
  expect(homePage.sections.length).toBeGreaterThan(0);
  homePage.sections[0] = { ...homePage.sections[0], title: pageMarker };

  const savePageRes = await request.post('/api/pages/home/draft', {
    headers,
    data: {
      id: homePage.id,
      slug: 'home',
      title: homePage.title,
      metaDescription: homePage.metaDescription,
      sections: homePage.sections,
      isPublished: homePage.isPublished,
      publishedAt: homePage.publishedAt,
    },
  });
  expect(savePageRes.ok(), await savePageRes.text()).toBeTruthy();

  const publishedSettingsRes = await request.get('/api/settings');
  expect(publishedSettingsRes.ok(), await publishedSettingsRes.text()).toBeTruthy();
  const publishedSettings = await publishedSettingsRes.json();
  expect(publishedSettings.footer.copyrightText).not.toContain(marker);

  const publishedPageRes = await request.get('/api/pages/home');
  expect(publishedPageRes.ok(), await publishedPageRes.text()).toBeTruthy();
  const publishedPage = await publishedPageRes.json();
  expect(JSON.stringify(publishedPage.sections)).not.toContain(pageMarker);

  await page.addInitScript((authToken: string) => {
    localStorage.setItem('ath_token', authToken);
  }, token);

  await page.goto('/admin/footer');
  const previewPagePromise = context.waitForEvent('page');
  await page.getByTestId('admin-preview-draft').click();
  const previewPage = await previewPagePromise;

  await previewPage.waitForLoadState('domcontentloaded');
  await expect(previewPage.getByTestId('footer-copyright')).toContainText(marker);
  await expect(previewPage.getByText(pageMarker)).toBeVisible();
  await expect(previewPage.getByText('Live Draft Preview Active')).toBeVisible();

  await previewPage.reload();
  await expect(previewPage.getByTestId('footer-copyright')).toContainText(marker);
  await expect(previewPage.getByText(pageMarker)).toBeVisible();

  await page.goto('/');
  await expect(page.getByTestId('footer-copyright')).not.toContainText(marker);
  await expect(page.getByText(pageMarker)).toHaveCount(0);

  await page.goto('/admin/pages');
  await expect(page.getByTestId('page-preview-draft')).toBeVisible();
  const pageBuilderPreviewPromise = context.waitForEvent('page');
  await page.getByTestId('page-preview-draft').click();
  const pageBuilderPreview = await pageBuilderPreviewPromise;
  await pageBuilderPreview.waitForLoadState('domcontentloaded');
  expect(new URL(pageBuilderPreview.url()).searchParams.get('preview')).toBe('draft');
  await expect(pageBuilderPreview.getByText(pageMarker)).toBeVisible();
  await pageBuilderPreview.close();

  const unsavedMarker = `Unsaved Page E2E ${Date.now()}`;
  await page.getByPlaceholder('Section title').first().fill(unsavedMarker);
  await expect(page.getByText('Unsaved Edits')).toBeVisible();

  const headerPreviewPromise = context.waitForEvent('page');
  await page.getByTestId('admin-preview-draft').click();
  const headerPreview = await headerPreviewPromise;
  await headerPreview.waitForLoadState('domcontentloaded');
  expect(new URL(headerPreview.url()).searchParams.get('preview')).toBe('draft');
  await expect(headerPreview.getByText(unsavedMarker)).toBeVisible();
  await headerPreview.close();

  await previewPage.getByRole('button', { name: 'Exit Preview' }).click();
  await expect(previewPage.getByTestId('footer-copyright')).not.toContainText(marker);
  await expect(previewPage.getByText(pageMarker)).toHaveCount(0);
  await previewPage.reload();
  await expect(previewPage.getByTestId('footer-copyright')).not.toContainText(marker);
});
