/**
 * Authentication, protected-route access control and authorization matrix.
 */
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, api, loginAdmin, uniqueId, ADMIN_EMAIL, ADMIN_PASSWORD } from './harness.js';

before(async () => {
  await startTestServer();
});

after(async () => {
  await stopTestServer();
});

describe('authentication', () => {
  test('rejects a missing password with 400', async () => {
    const res = await api('/api/auth/login', { method: 'POST', body: { email: ADMIN_EMAIL } });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  test('rejects invalid credentials with 401 and does not leak which field was wrong', async () => {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: { email: ADMIN_EMAIL, password: 'definitely-not-the-password' },
    });
    assert.equal(res.status, 401);
    assert.match(String(res.body.error), /Invalid email or password/i);
  });

  test('rejects an unknown account with the same 401 message', async () => {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'nobody@nowhere.test', password: ADMIN_PASSWORD },
    });
    assert.equal(res.status, 401);
    assert.match(String(res.body.error), /Invalid email or password/i);
  });

  test('logs in with the seeded administrator credentials and returns a token', async () => {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    assert.equal(res.status, 200);
    assert.ok(res.body.token, 'expected a JWT token');
    assert.equal(res.body.user.role, 'admin');
    assert.equal(res.body.user.email, ADMIN_EMAIL.toLowerCase());
  });

  test('GET /api/auth/me returns the session user for a valid token', async () => {
    const token = await loginAdmin();
    const res = await api('/api/auth/me', { token });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, ADMIN_EMAIL.toLowerCase());
  });

  test('GET /api/auth/me returns 401 without a token', async () => {
    const res = await api('/api/auth/me');
    assert.equal(res.status, 401);
  });

  test('GET /api/auth/me returns 401 for a garbage token', async () => {
    const res = await api('/api/auth/me', { token: 'not-a-real-jwt' });
    assert.equal(res.status, 401);
  });
});

describe('route protection', () => {
  test('editor-only routes reject anonymous callers', async () => {
    for (const route of [
      '/api/settings/draft',
      '/api/products/all',
      '/api/media',
      '/api/leads',
      '/api/enquiries',
      '/api/revisions',
    ]) {
      const res = await api(route);
      assert.equal(res.status, 401, `${route} should require authentication`);
    }
  });

  test('admin-only route rejects an anonymous caller', async () => {
    const res = await api('/api/settings/restore-defaults', { method: 'POST' });
    assert.equal(res.status, 401);
  });

  test('editor-only writes reject anonymous callers', async () => {
    const res = await api('/api/settings/draft', { method: 'POST', body: { theme: {} } });
    assert.equal(res.status, 401);
  });
});

describe('public routes', () => {
  test('published settings are readable without authentication', async () => {
    const res = await api('/api/settings');
    assert.equal(res.status, 200);
    assert.ok(res.body.theme);
    assert.ok(res.body.header);
  });

  test('published products are readable without authentication', async () => {
    const res = await api('/api/products');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });

  test('published pages are readable without authentication', async () => {
    const res = await api('/api/pages');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });

  test('a draft page is not exposed to anonymous callers', async () => {
    const slug = `draft-only-${Date.now()}`;
    const token = await loginAdmin();

    // Create an unpublished page.
    await api(`/api/pages/${slug}/draft`, {
      method: 'POST',
      token,
      body: {
        slug,
        title: 'Unpublished Page',
        metaDescription: 'Must never be publicly readable.',
        sections: [{ id: 's1', type: 'hero', title: 'Secret' }],
        isPublished: false,
      },
    });

    // Anonymous callers must not be able to read it, even with ?draft=true.
    const anonymous = await api(`/api/pages/${slug}`);
    assert.equal(anonymous.status, 404, 'an unpublished page must not be publicly readable');

    const anonymousDraft = await api(`/api/pages/${slug}?draft=true`);
    assert.equal(anonymousDraft.status, 404, 'an anonymous ?draft=true read must not expose a draft');

    // An editor can read it.
    const asEditor = await api(`/api/pages/${slug}?draft=true`, { token });
    assert.equal(asEditor.status, 200);

    const viewerEmail = `${uniqueId('draft-viewer')}@example.test`;
    const viewerPassword = 'ViewerOnly!Pass1';
    const createdViewer = await api('/api/users', {
      method: 'POST',
      token,
      body: { name: 'Draft Viewer', email: viewerEmail, role: 'viewer', password: viewerPassword },
    });
    assert.equal(createdViewer.status, 201);
    const viewerLogin = await api('/api/auth/login', {
      method: 'POST',
      body: { email: viewerEmail, password: viewerPassword },
    });
    assert.equal(viewerLogin.status, 200);
    const viewerDraft = await api(`/api/pages/${slug}?draft=true`, { token: viewerLogin.body.token });
    assert.equal(viewerDraft.status, 404, 'a viewer must not retrieve a draft by direct API request');
    const viewerPages = await api('/api/pages', { token: viewerLogin.body.token });
    assert.equal(viewerPages.status, 200);
    assert.equal(viewerPages.body.some((page: { slug: string }) => page.slug === slug), false);

    await api(`/api/pages/${slug}`, { method: 'DELETE', token });
    await api(`/api/users/${createdViewer.body.user.id}`, { method: 'DELETE', token });
  });
});

describe('RBAC and user profile', () => {
  test('administrators can create accounts and editors cannot manage users', async () => {
    const adminToken = await loginAdmin();
    const email = `${uniqueId('editor')}@example.test`;
    const password = 'EditorOnly!Pass1';

    const created = await api('/api/users', {
      method: 'POST',
      token: adminToken,
      body: { name: 'Test Editor', email, role: 'editor', password },
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.user.role, 'editor');
    assert.equal(created.body.user.email, email);

    try {
      const editorLogin = await api('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      assert.equal(editorLogin.status, 200);

      const editorUsers = await api('/api/users', { token: editorLogin.body.token });
      assert.equal(editorUsers.status, 403);

      const anonymousUsers = await api('/api/users');
      assert.equal(anonymousUsers.status, 401);

      const draftAccess = await api('/api/settings/draft', { token: editorLogin.body.token });
      assert.equal(draftAccess.status, 200);
    } finally {
      const deleted = await api(`/api/users/${created.body.user.id}`, {
        method: 'DELETE',
        token: adminToken,
      });
      assert.equal(deleted.status, 200);
    }
  });

  test('viewers can read the dashboard but not editor-only APIs', async () => {
    const adminToken = await loginAdmin();
    const email = `${uniqueId('viewer')}@example.test`;
    const password = 'ViewerOnly!Pass1';

    const created = await api('/api/users', {
      method: 'POST',
      token: adminToken,
      body: { name: 'Test Viewer', email, role: 'viewer', password },
    });
    assert.equal(created.status, 201);

    try {
      const viewerLogin = await api('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      assert.equal(viewerLogin.status, 200);

      const products = await api('/api/products/all', { token: viewerLogin.body.token });
      assert.equal(products.status, 403);

      const users = await api('/api/users', { token: viewerLogin.body.token });
      assert.equal(users.status, 403);

      const profile = await api('/api/auth/me', { token: viewerLogin.body.token });
      assert.equal(profile.status, 200);
    } finally {
      await api(`/api/users/${created.body.user.id}`, { method: 'DELETE', token: adminToken });
    }
  });

  test('a signed-in user can update their profile and change their password', async () => {
    const adminToken = await loginAdmin();
    const email = `${uniqueId('profile')}@example.test`;
    const updatedEmail = `${uniqueId('profile-updated')}@example.test`;
    const password = 'ProfileStart!Pass1';
    const newPassword = 'ProfileNew!Pass2';

    const created = await api('/api/users', {
      method: 'POST',
      token: adminToken,
      body: { name: 'Profile Tester', email, role: 'editor', password },
    });
    assert.equal(created.status, 201);

    try {
      const login = await api('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      assert.equal(login.status, 200);

      const updated = await api('/api/auth/profile', {
        method: 'PATCH',
        token: login.body.token,
        body: { name: 'Profile Tester Updated', email: updatedEmail },
      });
      assert.equal(updated.status, 200);
      assert.equal(updated.body.user.name, 'Profile Tester Updated');
      assert.equal(updated.body.user.email, updatedEmail);

      const wrongCurrent = await api('/api/auth/change-password', {
        method: 'POST',
        token: login.body.token,
        body: { currentPassword: 'not-the-password', newPassword },
      });
      assert.equal(wrongCurrent.status, 401);

      const changed = await api('/api/auth/change-password', {
        method: 'POST',
        token: login.body.token,
        body: { currentPassword: password, newPassword },
      });
      assert.equal(changed.status, 200);

      const oldLogin = await api('/api/auth/login', {
        method: 'POST',
        body: { email: updatedEmail, password },
      });
      assert.equal(oldLogin.status, 401);

      const newLogin = await api('/api/auth/login', {
        method: 'POST',
        body: { email: updatedEmail, password: newPassword },
      });
      assert.equal(newLogin.status, 200);
    } finally {
      await api(`/api/users/${created.body.user.id}`, { method: 'DELETE', token: adminToken });
    }
  });

  test('administrators cannot delete their own account or remove the last admin', async () => {
    const adminToken = await loginAdmin();
    const me = await api('/api/auth/me', { token: adminToken });
    assert.equal(me.status, 200);

    const selfDelete = await api(`/api/users/${me.body.user.id}`, {
      method: 'DELETE',
      token: adminToken,
    });
    assert.equal(selfDelete.status, 400);

    const selfDemote = await api(`/api/users/${me.body.user.id}`, {
      method: 'PATCH',
      token: adminToken,
      body: { role: 'editor' },
    });
    assert.equal(selfDemote.status, 400);
  });
});
