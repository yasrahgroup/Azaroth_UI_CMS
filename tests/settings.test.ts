/**
 * Draft vs published isolation, field allowlists and validation.
 */
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, api, loginAdmin, uniqueId } from './harness.js';
import { DEFAULT_SETTINGS } from '../src/constants/defaultSettings.js';

let token = '';

before(async () => {
  await startTestServer();
  token = await loginAdmin();
});

after(async () => {
  await stopTestServer();
});

describe('draft / publish isolation', () => {
  test('navbar overlay transparency defaults to 0 percent', () => {
    assert.equal(DEFAULT_SETTINGS.header.overlayTransparency, 0);
    assert.equal(DEFAULT_SETTINGS.header.overlayBackgroundColor, '#171B2C');
  });

  test('a draft edit does not change the published settings', async () => {
    const marker = uniqueId('brand');

    const before_ = await api('/api/settings');
    const originalBrand = before_.body.header.brandName;

    const draftRes = await api('/api/settings/draft', {
      method: 'POST',
      token,
      body: { header: { brandName: marker } },
    });
    assert.equal(draftRes.status, 200);
    assert.equal(draftRes.body.header.brandName, marker);

    // Published must be untouched while the change sits in the draft.
    const published = await api('/api/settings');
    assert.equal(published.body.header.brandName, originalBrand);

    // The draft itself must hold the new value.
    const draft = await api('/api/settings/draft', { token });
    assert.equal(draft.body.header.brandName, marker);

    // Publishing promotes exactly the draft.
    const pubRes = await api('/api/settings/publish', { method: 'POST', token, body: {} });
    assert.equal(pubRes.status, 200);
    assert.equal(pubRes.body.header.brandName, marker);

    const afterPublish = await api('/api/settings');
    assert.equal(afterPublish.body.header.brandName, marker);

    // Restore the original value so the suite is repeatable.
    await api('/api/settings/draft', {
      method: 'POST',
      token,
      body: { header: { brandName: originalBrand } },
    });
    await api('/api/settings/publish', { method: 'POST', token });
  });

  test('publishing does not accept an unreviewed body', async () => {
    const original = await api('/api/settings');
    const originalBrand = original.body.header.brandName;
    const smuggled = uniqueId('smuggled');

    const res = await api('/api/settings/publish', {
      method: 'POST',
      token,
      body: { header: { brandName: smuggled } },
    });
    assert.equal(res.status, 200);

    // The smuggled value must not have been promoted.
    const published = await api('/api/settings');
    assert.notEqual(published.body.header.brandName, smuggled);
    assert.equal(published.body.header.brandName, originalBrand);
  });

  test('a draft edit for one section does not reset an unrelated draft section', async () => {
    const markerA = uniqueId('footer-a');
    const markerB = uniqueId('footer-b');

    await api('/api/settings/draft', {
      method: 'POST',
      token,
      body: { footer: { companyDescription: markerA } },
    });
    await api('/api/settings/draft', {
      method: 'POST',
      token,
      body: { footer: { copyrightText: markerB } },
    });

    const draft = await api('/api/settings/draft', { token });
    assert.equal(draft.body.footer.companyDescription, markerA);
    assert.equal(draft.body.footer.copyrightText, markerB);

    // Restore defaults for the two mutated fields.
    const current = await api('/api/settings/draft', { token });
    await api('/api/settings/draft', {
      method: 'POST',
      token,
      body: {
        footer: {
          companyDescription: current.body.footer.companyDescription,
          copyrightText: current.body.footer.copyrightText,
        },
      },
    });
  });

  test('navbar overlay transparency is saved independently from header background color', async () => {
    const before = await api('/api/settings/draft', { token });
    const originalTransparency = before.body.header.overlayTransparency;
    const originalBackground = before.body.header.backgroundColor;
    const originalOverlayBackground = before.body.header.overlayBackgroundColor;

    const updated = await api('/api/settings/draft', {
      method: 'POST',
      token,
      body: { header: { overlayTransparency: 45, overlayBackgroundColor: '#171B2C' } },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.header.overlayTransparency, 45);
    assert.equal(updated.body.header.backgroundColor, originalBackground);
    assert.equal(updated.body.header.overlayBackgroundColor, '#171B2C');

    const restored = await api('/api/settings/draft', {
      method: 'POST',
      token,
      body: {
        header: {
          overlayTransparency: originalTransparency,
          overlayBackgroundColor: originalOverlayBackground,
        },
      },
    });
    assert.equal(restored.status, 200);
  });
});

describe('field allowlists and validation', () => {
  test('rejects a disallowed root settings field', async () => {
    const res = await api('/api/settings/draft', {
      method: 'POST',
      token,
      body: { notARealSetting: 'x' },
    });
    assert.equal(res.status, 400);
    assert.match(JSON.stringify(res.body), /Disallowed settings field/);
  });

  test('rejects a javascript: protocol in a logo url', async () => {
    const res = await api('/api/settings/draft', {
      method: 'POST',
      token,
      body: { header: { logoUrl: 'javascript:alert(1)' } },
    });
    assert.equal(res.status, 400);
  });

  test('rejects an invalid colour value', async () => {
    const res = await api('/api/settings/draft', {
      method: 'POST',
      token,
      body: { theme: { primary: 'not-a-colour' } },
    });
    assert.equal(res.status, 400);
  });

  test('rejects an out-of-range numeric setting', async () => {
    const res = await api('/api/settings/draft', {
      method: 'POST',
      token,
      body: { typography: { baseFontSize: 400 } },
    });
    assert.equal(res.status, 400);
  });

  test('rejects an invalid navbar overlay transparency', async () => {
    const res = await api('/api/settings/draft', {
      method: 'POST',
      token,
      body: { header: { overlayTransparency: 101 } },
    });
    assert.equal(res.status, 400);
  });

  test('rejects an invalid overlay navbar background color', async () => {
    const res = await api('/api/settings/draft', {
      method: 'POST',
      token,
      body: { header: { overlayBackgroundColor: 'not-a-color' } },
    });
    assert.equal(res.status, 400);
  });

  test('rejects an invalid cms appearance mode', async () => {
    const res = await api('/api/settings/draft', {
      method: 'POST',
      token,
      body: { cmsAppearance: { mode: 'neon' } },
    });
    assert.equal(res.status, 400);
  });

  test('accepts a valid partial settings update', async () => {
    const res = await api('/api/settings/draft', {
      method: 'POST',
      token,
      body: { cmsAppearance: { sidebarLogoAlt: 'Company Logo' } },
    });
    assert.equal(res.status, 200);
  });
});

describe('public dark mode gating', () => {
  test('the public dark mode flag round-trips through draft and publish', async () => {
    const original = await api('/api/settings');
    const wasEnabled = original.body.theme.enableDarkMode;

    const off = await api('/api/settings/draft', {
      method: 'POST',
      token,
      body: { theme: { enableDarkMode: false } },
    });
    assert.equal(off.status, 200);
    assert.equal(off.body.theme.enableDarkMode, false);

    await api('/api/settings/publish', { method: 'POST', token });
    const published = await api('/api/settings');
    assert.equal(published.body.theme.enableDarkMode, false);

    // Restore the original flag.
    await api('/api/settings/draft', {
      method: 'POST',
      token,
      body: { theme: { enableDarkMode: wasEnabled } },
    });
    await api('/api/settings/publish', { method: 'POST', token });
  });

  test('disabling public dark mode does not disturb the rest of the theme', async () => {
    const before_ = await api('/api/settings');
    const primary = before_.body.theme.primary;
    const wasEnabled = before_.body.theme.enableDarkMode;

    await api('/api/settings/draft', {
      method: 'POST',
      token,
      body: { theme: { enableDarkMode: false } },
    });

    const draft = await api('/api/settings/draft', { token });
    assert.equal(draft.body.theme.enableDarkMode, false);
    assert.equal(draft.body.theme.primary, primary, 'sibling theme tokens must survive a partial update');

    await api('/api/settings/draft', {
      method: 'POST',
      token,
      body: { theme: { enableDarkMode: wasEnabled } },
    });
  });
});
