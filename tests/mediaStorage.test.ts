import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { createMediaStorage, resolveMediaStorageConfig, type S3StorageConfig } from '../src/server/mediaStorage.js';

test('S3-compatible storage signs uploads and deletes with the configured prefix', async () => {
  const captured: { method?: string; url?: string; headers: http.IncomingHttpHeaders; body: Buffer }[] = [];

  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => {
      captured.push({
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: Buffer.concat(chunks),
      });
      res.statusCode = req.method === 'DELETE' ? 204 : 200;
      res.end(req.method === 'GET' ? 'stored-image' : undefined);
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;

  try {
    const storage = createMediaStorage({
      kind: 's3',
      bucket: 'test-bucket',
      region: 'us-east-1',
      endpoint: `http://127.0.0.1:${port}`,
      forcePathStyle: true,
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
      prefix: 'uploads',
    });

    const saved = await storage.save({
      filename: 'image_123_abc.png',
      mimeType: 'image/png',
      buffer: Buffer.from('image-bytes'),
    });

    assert.equal(
      saved.url,
      `http://127.0.0.1:${port}/test-bucket/uploads/image_123_abc.png`
    );

    const downloaded = await storage.read('image_123_abc.png');
    await storage.remove('image_123_abc.png');

    assert.equal(downloaded.toString('utf8'), 'stored-image');
    assert.equal(captured.length, 3);
    assert.equal(captured[0].method, 'PUT');
    assert.equal(captured[0].url, '/test-bucket/uploads/image_123_abc.png');
    assert.equal(captured[0].headers['content-type'], 'image/png');
    assert.match(String(captured[0].headers.authorization), /^AWS4-HMAC-SHA256 Credential=test-access-key\//);
    assert.match(String(captured[0].headers.authorization), /SignedHeaders=host;x-amz-content-sha256;x-amz-date/);
    assert.equal(captured[0].body.toString('utf8'), 'image-bytes');
    assert.equal(captured[0].headers['x-amz-content-sha256']?.length, 64);

    assert.equal(captured[1].method, 'GET');
    assert.equal(captured[1].url, '/test-bucket/uploads/image_123_abc.png');
    assert.match(String(captured[1].headers.authorization), /^AWS4-HMAC-SHA256 Credential=test-access-key\//);

    assert.equal(captured[2].method, 'DELETE');
    assert.equal(captured[2].url, '/test-bucket/uploads/image_123_abc.png');
    assert.equal(captured[2].body.length, 0);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
});

test('Cloudflare R2 defaults the region to "auto" and forces path-style URLs', () => {
  const cfg = resolveMediaStorageConfig('uploads', {
    MEDIA_STORAGE: 's3',
    S3_BUCKET: 'r2-bucket',
    S3_ENDPOINT: 'https://123456789.r2.cloudflarestorage.com',
    S3_ACCESS_KEY_ID: 'key',
    S3_SECRET_ACCESS_KEY: 'secret',
  } as NodeJS.ProcessEnv) as S3StorageConfig;

  assert.equal(cfg.kind, 's3');
  assert.equal(cfg.region, 'auto');
  assert.equal(cfg.forcePathStyle, true);
});

test('Cloudflare R2 with S3_R2=true also defaults the region to "auto"', () => {
  const cfg = resolveMediaStorageConfig('uploads', {
    MEDIA_STORAGE: 's3',
    S3_R2: 'true',
    S3_BUCKET: 'r2-bucket',
    S3_ACCESS_KEY_ID: 'key',
    S3_SECRET_ACCESS_KEY: 'secret',
  } as NodeJS.ProcessEnv) as S3StorageConfig;

  assert.equal(cfg.region, 'auto');
  assert.equal(cfg.forcePathStyle, true);
});

test('an explicit S3_REGION overrides the R2 auto default', () => {
  const cfg = resolveMediaStorageConfig('uploads', {
    MEDIA_STORAGE: 's3',
    S3_R2: 'true',
    S3_REGION: 'custom',
    S3_BUCKET: 'r2-bucket',
    S3_ACCESS_KEY_ID: 'key',
    S3_SECRET_ACCESS_KEY: 'secret',
  } as NodeJS.ProcessEnv) as S3StorageConfig;

  assert.equal(cfg.region, 'custom');
});

test('non-R2 endpoints keep the us-east-1 default region', () => {
  const cfg = resolveMediaStorageConfig('uploads', {
    MEDIA_STORAGE: 's3',
    S3_BUCKET: 'minio-bucket',
    S3_ENDPOINT: 'http://minio.local:9000',
    S3_ACCESS_KEY_ID: 'key',
    S3_SECRET_ACCESS_KEY: 'secret',
  } as NodeJS.ProcessEnv) as S3StorageConfig;

  assert.equal(cfg.region, 'us-east-1');
  assert.equal(cfg.forcePathStyle, true);
});
