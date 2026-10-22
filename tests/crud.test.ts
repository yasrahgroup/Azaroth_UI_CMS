/**
 * Full CRUD round-trips against the real persistence layer.
 * Every module follows: create -> read back -> update -> read back -> delete
 * -> confirm gone, each verified through a fresh read of the API.
 */
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, api, loginAdmin, uniqueId } from './harness.js';

let token = '';

before(async () => {
  await startTestServer();
  token = await loginAdmin();
});

after(async () => {
  await stopTestServer();
});

describe('products CRUD', () => {
  test('create, read, update and delete a product', async () => {
    const slug = uniqueId('crud-product').toLowerCase();

    // CREATE
    const createRes = await api('/api/products', {
      method: 'POST',
      token,
      body: {
        name: 'CRUD Test Product',
        slug,
        summary: 'Created by the automated regression suite.',
        description: '<p>Body</p><script>alert(1)</script>',
        heroImage: '/uploads/test.png',
        heroImageAlt: 'Test hero',
        features: ['Feature one'],
        benefits: ['Benefit one'],
        useCases: ['Use case one'],
        metaTitle: 'CRUD Test Product',
        metaDescription: 'Meta description',
        isPublished: false,
        displayOrder: 99,
        stage: 'Live',
      },
    });
    assert.equal(createRes.status, 200);
    assert.equal(createRes.body.slug, slug);
    // HTML must be sanitised on the way in.
    assert.ok(!String(createRes.body.description).includes('<script>'));

    // READ
    const list = await api('/api/products/all', { token });
    assert.ok(list.body.some((p: any) => p.slug === slug), 'new product must appear in the list');

    const single = await api(`/api/products/${slug}?draft=true`, { token });
    assert.equal(single.status, 200);
    assert.equal(single.body.name, 'CRUD Test Product');

    const withoutDraftPreview = await api(`/api/products/${slug}`, { token });
    assert.equal(withoutDraftPreview.status, 404, 'unpublished products must be hidden outside draft preview');

    const anonymousDraft = await api(`/api/products/${slug}?draft=true`);
    assert.equal(anonymousDraft.status, 404, 'anonymous callers must not read unpublished products');

    // UPDATE
    const updateRes = await api('/api/products', {
      method: 'POST',
      token,
      body: { ...single.body, name: 'CRUD Test Product (Updated)' },
    });
    assert.equal(updateRes.status, 200);

    const afterUpdate = await api(`/api/products/${slug}?draft=true`, { token });
    assert.equal(afterUpdate.body.name, 'CRUD Test Product (Updated)');
    assert.equal(afterUpdate.body.id, single.body.id, 'an update must not create a duplicate record');

    // DELETE
    const deleteRes = await api(`/api/products/${single.body.id}`, { method: 'DELETE', token });
    assert.equal(deleteRes.status, 200);

    const afterDelete = await api(`/api/products/${slug}`, { token });
    assert.equal(afterDelete.status, 404, 'the product must be gone after delete');

    const listAfter = await api('/api/products/all', { token });
    assert.ok(!listAfter.body.some((p: any) => p.slug === slug));
  });

  test('rejects a product with a missing name', async () => {
    const res = await api('/api/products', { method: 'POST', token, body: { slug: 'no-name-here' } });
    assert.equal(res.status, 400);
  });

  test('rejects a product with an invalid slug', async () => {
    const res = await api('/api/products', {
      method: 'POST',
      token,
      body: { name: 'Bad Slug', slug: 'Not A Valid Slug!' },
    });
    assert.equal(res.status, 400);
  });

  test('rejects a product with a disallowed field', async () => {
    const res = await api('/api/products', {
      method: 'POST',
      token,
      body: { name: 'Injection', slug: 'injection-test', passwordHash: 'x' },
    });
    assert.equal(res.status, 400);
    assert.match(JSON.stringify(res.body), /Disallowed product field/);
  });

  test('deleting an unknown product returns 404', async () => {
    const res = await api('/api/products/does-not-exist', { method: 'DELETE', token });
    assert.equal(res.status, 404);
  });
});

describe('pages CRUD', () => {
  test('create, read, publish and delete a page', async () => {
    const slug = uniqueId('crud-page').toLowerCase();

    // CREATE (draft)
    const createRes = await api(`/api/pages/${slug}/draft`, {
      method: 'POST',
      token,
      body: {
        slug,
        title: 'CRUD Test Page',
        metaDescription: 'Created by the automated regression suite.',
        sections: [{
          id: 'sec-1',
          type: 'hero',
          title: 'Hello',
          bgMode: 'image-gradient',
          bannerImageUrl: '/uploads/overlay-banner.png',
          bannerImagePosition: 'top',
          bannerImageOpacity: 90,
          bgGradientFrom: '#171B2C',
          bgGradientTo: '#910B2C',
          bgGradientAngle: 135,
          bgOverlayOpacity: 75,
        }],
        isPublished: false,
      },
    });
    assert.equal(createRes.status, 200);

    // READ
    const pageList = await api('/api/pages', { token });
    assert.ok(pageList.body.some((p: any) => p.slug === slug), 'the page must appear in the list');

    const draftRead = await api(`/api/pages/${slug}?draft=true`, { token });
    assert.equal(draftRead.status, 200);
    assert.equal(draftRead.body.title, 'CRUD Test Page');
    assert.equal(draftRead.body.sections[0].bgMode, 'image-gradient');
    assert.equal(draftRead.body.sections[0].bannerImageUrl, '/uploads/overlay-banner.png');
    assert.equal(draftRead.body.sections[0].bgOverlayOpacity, 75);

    // UPDATE
    const updateRes = await api(`/api/pages/${slug}/draft`, {
      method: 'POST',
      token,
      body: { ...draftRead.body, title: 'CRUD Test Page (Updated)' },
    });
    assert.equal(updateRes.status, 200);

    const afterUpdate = await api(`/api/pages/${slug}?draft=true`, { token });
    assert.equal(afterUpdate.body.title, 'CRUD Test Page (Updated)');

    // PUBLISH
    const publishRes = await api(`/api/pages/${slug}/publish`, { method: 'POST', token });
    assert.equal(publishRes.status, 200);
    assert.equal(publishRes.body.isPublished, true);
    assert.equal(publishRes.body.sections[0].bgGradientFrom, '#171B2C');
    assert.equal(publishRes.body.sections[0].bgGradientTo, '#910B2C');

    const anonymous = await api(`/api/pages/${slug}`);
    assert.equal(anonymous.status, 200, 'a published page must be publicly readable');

    // DELETE
    const deleteRes = await api(`/api/pages/${slug}`, { method: 'DELETE', token });
    assert.equal(deleteRes.status, 200);

    const afterDelete = await api(`/api/pages/${slug}`, { token });
    assert.equal(afterDelete.status, 404);
  });

  test('rejects a page with a missing title', async () => {
    const res = await api('/api/pages/no-title-page/draft', {
      method: 'POST',
      token,
      body: { slug: 'no-title-page', sections: [] },
    });
    assert.equal(res.status, 400);
  });

  test('refuses to delete the default homepage', async () => {
    const res = await api('/api/pages/home', { method: 'DELETE', token });
    assert.equal(res.status, 400);
  });
});

describe('media CRUD', () => {
  test('upload, read, update alt text and delete a media asset', async () => {
    // CREATE (upload)
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], { type: 'image/png' }), 'regression.png');
    form.append('altText', 'regression asset');

    const uploadRes = await fetch(`${(await import('./harness.js')).url('/api/media/upload')}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    assert.equal(uploadRes.status, 201);
    const created = await uploadRes.json();
    assert.ok(created.id);
    assert.ok(created.url.startsWith('/uploads/'));

    // READ
    const list = await api('/api/media', { token });
    assert.ok(list.body.some((m: any) => m.id === created.id), 'the uploaded asset must be listed');

    // UPDATE (alt text)
    const altRes = await api(`/api/media/${created.id}/alt`, {
      method: 'PATCH',
      token,
      body: { altText: 'updated alt text' },
    });
    assert.equal(altRes.status, 200);
    assert.equal(altRes.body.altText, 'updated alt text');

    // DELETE
    const deleteRes = await api(`/api/media/${created.id}`, { method: 'DELETE', token });
    assert.equal(deleteRes.status, 200);

    const listAfter = await api('/api/media', { token });
    assert.ok(!listAfter.body.some((m: any) => m.id === created.id), 'the asset must be gone');
  });

  test('rejects an unsupported upload type', async () => {
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'application/x-msdownload' }), 'payload.exe');

    const res = await fetch(`${(await import('./harness.js')).url('/api/media/upload')}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    assert.equal(res.status, 400);
  });

  test('updating alt text for an unknown asset returns 404', async () => {
    const res = await api('/api/media/does-not-exist/alt', {
      method: 'PATCH',
      token,
      body: { altText: 'nope' },
    });
    assert.equal(res.status, 404);
  });

  test('deleting an unknown asset returns 404', async () => {
    const res = await api('/api/media/does-not-exist', { method: 'DELETE', token });
    assert.equal(res.status, 404);
  });
});

describe('leads and enquiries', () => {
  test('a public enquiry is stored and its status can be updated', async () => {
    const createRes = await api('/api/enquiries', {
      method: 'POST',
      body: {
        name: 'Regression Tester',
        email: 'regression@example.com',
        message: 'Created by the automated regression suite.',
      },
    });
    assert.equal(createRes.status, 201);

    const list = await api('/api/enquiries', { token });
    const record = list.body.find((e: any) => e.id === createRes.body.enquiryId);
    assert.ok(record, 'the enquiry must be stored');

    const updateRes = await api(`/api/enquiries/${record.id}/status`, {
      method: 'PATCH',
      token,
      body: { status: 'in_progress' },
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.status, 'in_progress');
  });

  test('an invalid enquiry status is rejected', async () => {
    const res = await api('/api/enquiries/anything/status', {
      method: 'PATCH',
      token,
      body: { status: 'nonsense' },
    });
    assert.equal(res.status, 400);
  });

  test('a public lead is stored and its status can be updated', async () => {
    const createRes = await api('/api/leads', {
      method: 'POST',
      body: {
        name: 'Regression Tester',
        email: 'regression@example.com',
        requirements: 'Created by the automated regression suite.',
      },
    });
    assert.equal(createRes.status, 201);

    const list = await api('/api/leads', { token });
    const record = list.body.find((l: any) => l.id === createRes.body.leadId);
    assert.ok(record, 'the lead must be stored');

    const updateRes = await api(`/api/leads/${record.id}/status`, {
      method: 'PATCH',
      token,
      body: { status: 'resolved' },
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.status, 'resolved');
  });
});

describe('public form validation', () => {
  test('rejects a malformed email address', async () => {
    const res = await api('/api/enquiries', {
      method: 'POST',
      body: { name: 'Tester', email: 'invalid-email@', message: 'Hello' },
    });
    assert.equal(res.status, 400);
  });

  test('rejects a submission with no message', async () => {
    const res = await api('/api/enquiries', {
      method: 'POST',
      body: { name: 'Tester', email: 'tester@example.com' },
    });
    assert.equal(res.status, 400);
  });
});
