import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const EMPTY_SHA256 = crypto.createHash('sha256').update('').digest('hex');

export type MediaStorageKind = 'disk' | 's3';

export type MediaStorageMode = 'local' | 'test' | 'prod';

export interface DiskStorageConfig {
  kind: 'disk';
  uploadDir: string;
}

export interface S3StorageConfig {
  kind: 's3';
  bucket: string;
  region: string;
  endpoint?: string;
  forcePathStyle: boolean;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  publicBaseUrl?: string;
  prefix: string;
}

export type MediaStorageConfig = DiskStorageConfig | S3StorageConfig;

export interface SaveMediaInput {
  filename: string;
  mimeType: string;
  buffer?: Buffer;
  tempPath?: string;
}

export interface MediaStorage {
  kind: MediaStorageKind;
  save(input: SaveMediaInput): Promise<{ url: string }>;
  read(filename: string): Promise<Buffer>;
  remove(filename: string): Promise<void>;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

export function normalizeStoragePrefix(prefix: string | undefined): string {
  return (prefix || 'uploads')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-zA-Z0-9/_-]/g, '')
    .replace(/^\/+|\/+$/g, '');
}

export function sanitizeMediaBaseName(originalName: string): string {
  const extension = path.extname(originalName).toLowerCase();
  const base = path
    .basename(originalName, path.extname(originalName))
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);

  return base || 'media';
}

export function buildMediaFilename(
  originalName: string,
  timestamp = Date.now(),
  randomSuffix = Math.random().toString(36).substring(2, 8)
): string {
  const extension = path.extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, '');
  const safeExtension = /^\.[a-z0-9]+$/.test(extension) ? extension : '';
  const prefix = sanitizeMediaBaseName(originalName);
  const suffix = randomSuffix.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'asset';
  return `${prefix}_${timestamp}_${suffix}${safeExtension}`;
}

function parseS3Config(env: NodeJS.ProcessEnv): S3StorageConfig {
  const bucket = (env.S3_BUCKET || '').trim();
  const accessKeyId = (env.S3_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = (env.S3_SECRET_ACCESS_KEY || '').trim();

  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'S3 storage requires S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY.'
    );
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{1,61}[a-zA-Z0-9]$/.test(bucket)) {
    throw new Error('S3_BUCKET contains invalid characters or an invalid length.');
  }

  const endpoint = (env.S3_ENDPOINT || '').trim().replace(/\/+$/, '') || undefined;
  if (endpoint) {
    try {
      const parsed = new URL(endpoint);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        throw new Error('unsupported protocol');
      }
    } catch {
      throw new Error('S3_ENDPOINT must be a valid http(s) URL.');
    }
  }

  // Cloudflare R2 is a special case: its real region is "auto". Signing with any
  // other region (e.g. the default us-east-1) makes R2 reject the request with a
  // 403 signature-mismatch, so uploads silently fail in production while the
  // identical local disk path keeps working. Detect R2 endpoints and default the
  // region to "auto" unless the operator explicitly overrides it.
  const isR2Endpoint = Boolean(
    env.S3_R2 === 'true' ||
    (endpoint && /r2\.cloudflarestorage\.com$/i.test(new URL(endpoint).hostname))
  );
  const regionRaw = (env.S3_REGION || '').trim();
  const region =
    regionRaw ||
    (isR2Endpoint ? 'auto' : '') ||
    'us-east-1';

  return {
    kind: 's3',
    bucket,
    region,
    endpoint,
    // Cloudflare R2 only supports path-style URLs; virtual-hosted style is
    // rejected. Default to path-style for R2 even when S3_FORCE_PATH_STYLE is
    // unset, otherwise the public URL is unreachable.
    forcePathStyle: parseBoolean(env.S3_FORCE_PATH_STYLE, isR2Endpoint || Boolean(endpoint)),
    accessKeyId,
    secretAccessKey,
    sessionToken: (env.S3_SESSION_TOKEN || '').trim() || undefined,
    publicBaseUrl: (env.S3_PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '') || undefined,
    prefix: normalizeStoragePrefix(env.S3_PREFIX),
  };
}

/**
 * Resolves the active media storage backend.
 *
 * Three deployment modes are supported, each with its own environment profile:
 *
 * - `local`  — local disk. Default for development. Uses `UPLOAD_DIR`.
 * - `test`   — isolated local disk. Used by Vercel test deployments and the E2E
 *              suite. NEVER uses S3/R2, so test images and videos cannot leak
 *              into the production Cloudflare bucket.
 * - `prod`   — S3-compatible object store (Cloudflare R2). Only this mode is
 *              allowed to touch the production bucket.
 *
 * The mode is selected by `MEDIA_STORAGE_MODE`. For backwards compatibility,
 * `MEDIA_STORAGE=s3` still selects S3, but it is not recommended: set the mode
 * explicitly so a test deployment can never accidentally write to production.
 */
export function resolveMediaStorageConfig(
  uploadDir: string,
  env: NodeJS.ProcessEnv = process.env
): MediaStorageConfig {
  const mode = (env.MEDIA_STORAGE_MODE || '').trim().toLowerCase() as MediaStorageMode;

  if (mode === 'test') {
    // Test deployments always use an isolated local disk. S3/R2 credentials are
    // ignored so a misconfigured test env can never reach a production bucket.
    return { kind: 'disk', uploadDir };
  }

  if (mode === 'prod') {
    return parseS3Config(env);
  }

  // mode === 'local' or unset
  const legacy = (env.MEDIA_STORAGE || '').trim().toLowerCase();
  if (legacy === 's3') {
    return parseS3Config(env);
  }

  return { kind: 'disk', uploadDir };
}

export function storageObjectKey(prefix: string, filename: string): string {
  const safeFilename = path.basename(filename);
  return prefix ? `${prefix}/${safeFilename}` : safeFilename;
}

export function buildS3PublicUrl(
  config: Pick<
    S3StorageConfig,
    'bucket' | 'region' | 'endpoint' | 'forcePathStyle' | 'publicBaseUrl' | 'prefix'
  >,
  filename: string
): string {
  const key = storageObjectKey(config.prefix, filename);

  if (config.publicBaseUrl) {
    return `${config.publicBaseUrl}/${key}`;
  }

  if (config.endpoint) {
    const endpoint = new URL(config.endpoint);
    const basePath = endpoint.pathname.replace(/\/+$/, '');
    // Cloudflare R2 does not support virtual-hosted style; always use
    // path-style for it, otherwise the public URL is unreachable.
    const isR2 = /r2\.cloudflarestorage\.com$/i.test(endpoint.hostname);
    if (config.forcePathStyle || isR2) {
      endpoint.pathname = `${basePath}/${config.bucket}/${key}`;
    } else {
      endpoint.hostname = `${config.bucket}.${endpoint.hostname}`;
      endpoint.pathname = `${basePath}/${key}`;
    }
    return endpoint.toString();
  }

  return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
}

function sha256Hex(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function hmac(key: string | Buffer, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data).digest();
}

function signingKey(secretAccessKey: string, dateStamp: string, region: string): Buffer {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, 's3');
  return hmac(serviceKey, 'aws4_request');
}

function buildSignedUrl(
  config: S3StorageConfig,
  method: string,
  key: string,
  payloadHash: string,
  now: Date
): { url: URL; headers: Record<string, string> } {
  const endpoint = new URL(config.endpoint || `https://s3.${config.region}.amazonaws.com`);
  const basePath = endpoint.pathname.replace(/\/+$/, '');
  // Cloudflare R2 only supports path-style requests; virtual-hosted style is
  // rejected, so signing must match the URL style the bucket actually accepts.
  const isR2 = /r2\.cloudflarestorage\.com$/i.test(endpoint.hostname);

  if (config.forcePathStyle || isR2) {
    endpoint.pathname = `${basePath}/${config.bucket}/${key}`;
  } else {
    endpoint.hostname = `${config.bucket}.${endpoint.hostname}`;
    endpoint.pathname = `${basePath}/${key}`;
  }

  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const canonicalUri = endpoint.pathname || '/';
  const canonicalQuery = endpoint.searchParams.toString();

  const baseHeaders: Record<string, string> = {
    host: endpoint.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
  if (config.sessionToken) {
    baseHeaders['x-amz-security-token'] = config.sessionToken;
  }

  const sortedHeaderNames = Object.keys(baseHeaders).sort();
  const canonicalHeaders = sortedHeaderNames
    .map((name) => `${name}:${baseHeaders[name].trim()}\n`)
    .join('');
  const signedHeaders = sortedHeaderNames.join(';');

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const signature = crypto
    .createHmac('sha256', signingKey(config.secretAccessKey, dateStamp, config.region))
    .update(stringToSign)
    .digest('hex');

  const headers = {
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    ...(config.sessionToken ? { 'x-amz-security-token': config.sessionToken } : {}),
    Authorization:
      `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };

  return { url: endpoint, headers };
}

async function s3Request(
  config: S3StorageConfig,
  method: 'PUT' | 'DELETE',
  filename: string,
  body?: Buffer,
  contentType?: string
): Promise<void> {
  const key = storageObjectKey(config.prefix, filename);
  const payloadHash = body ? sha256Hex(body) : EMPTY_SHA256;
  const { url, headers } = buildSignedUrl(config, method, key, payloadHash, new Date());

  const response = await fetch(url.toString(), {
    method,
    headers: {
      ...headers,
      ...(contentType ? { 'Content-Type': contentType } : {}),
    },
    body: body ? (body as unknown as BodyInit) : undefined,
  });

  if (method === 'DELETE' && response.status === 404) {
    return;
  }

  if (!response.ok) {
    const detail = (await response.text().catch(() => '')).slice(0, 500);
    throw new Error(`S3 ${method} failed (${response.status})${detail ? `: ${detail}` : ''}`);
  }
}

async function readFromS3(config: S3StorageConfig, filename: string): Promise<Buffer> {
  const key = storageObjectKey(config.prefix, filename);
  const { url, headers } = buildSignedUrl(config, 'GET', key, EMPTY_SHA256, new Date());
  const response = await fetch(url.toString(), { method: 'GET', headers });

  if (!response.ok) {
    const detail = (await response.text().catch(() => '')).slice(0, 500);
    throw new Error(`S3 GET failed (${response.status})${detail ? `: ${detail}` : ''}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

export function createMediaStorage(config: MediaStorageConfig): MediaStorage {
  if (config.kind === 'disk') {
    return {
      kind: 'disk',
      async save(input) {
        const destination = path.join(config.uploadDir, path.basename(input.filename));
        if (input.buffer) {
          await fs.promises.writeFile(destination, input.buffer);
        }
        return { url: `/uploads/${path.basename(input.filename)}` };
      },
      async read(filename) {
        return fs.promises.readFile(path.join(config.uploadDir, path.basename(filename)));
      },
      async remove(filename) {
        const destination = path.join(config.uploadDir, path.basename(filename));
        try {
          await fs.promises.unlink(destination);
        } catch (error: any) {
          if (error?.code !== 'ENOENT') throw error;
        }
      },
    };
  }

  return {
    kind: 's3',
    async save(input) {
      const body =
        input.buffer ?? (input.tempPath ? await fs.promises.readFile(input.tempPath) : Buffer.alloc(0));
      await s3Request(config, 'PUT', input.filename, body, input.mimeType);
      return { url: buildS3PublicUrl(config, input.filename) };
    },
    async read(filename) {
      return readFromS3(config, filename);
    },
    async remove(filename) {
      await s3Request(config, 'DELETE', filename);
    },
  };
}
