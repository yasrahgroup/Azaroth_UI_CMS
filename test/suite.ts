import assert from 'assert';
import { cleanHtml, sanitizeSvg } from '../src/server/sanitize.js';
import {
  validateSiteSettingsDraft,
  validateProduct,
  validatePage,
  isSafeUrl,
  isValidColor,
} from '../src/server/validators.js';
import { generateToken } from '../src/server/auth.js';
import { brandDocumentTitle } from '../src/utils/branding.js';
import {
  buildSectionsFromLegacyColumns,
  getEffectiveSocialItems,
  normalizeFooterConfig,
  normalizeSocialItems,
  resolveFooterAlignment,
  validateFooterConfig,
} from '../src/utils/footerConfig.js';
import { resolveNavbarAppearance, resolveNavbarTransparency } from '../src/utils/headerOverlay.js';
import { transparencyToAlpha, withAlpha } from '../src/utils/color.js';
import {
  buildMediaFilename,
  buildS3PublicUrl,
  normalizeStoragePrefix,
  resolveMediaStorageConfig,
} from '../src/server/mediaStorage.js';
import { DEFAULT_SETTINGS } from '../src/constants/defaultSettings.js';
import { createGlossyEffect, GLOSSY_PRESETS } from '../src/utils/glossyEffects.js';
import { getAnimationClass } from '../src/utils/animationEffects.js';
import type { FooterConfig, PageSection, User } from '../src/types/index.js';

let passed = 0;
let failed = 0;

function it(description: string, fn: () => void | Promise<void>) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res.then(() => {
        console.log(`  ✓ ${description}`);
        passed++;
      }).catch((err) => {
        console.error(`  ✗ ${description}`);
        console.error(`    ${err.message}`);
        failed++;
      });
    } else {
      console.log(`  ✓ ${description}`);
      passed++;
    }
  } catch (err: any) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n=== RUNNING AUTOMATED UNIT & REGRESSION TEST SUITE ===\n');

  console.log('--- Animation and Glossy Effects ---');

  it('exposes all 12 unique glossy presets with valid defaults', () => {
    assert.strictEqual(GLOSSY_PRESETS.length, 12);
    assert.strictEqual(new Set(GLOSSY_PRESETS.map(({ id }) => id)).size, 12);
    for (const preset of GLOSSY_PRESETS) {
      const effect = createGlossyEffect(preset.id);
      assert.strictEqual(effect.preset, preset.id);
      assert.strictEqual(effect.enabled, true);
      assert.ok(effect.shineDurationMs > 0);
      assert.match(effect.baseColor, /^#[0-9A-F]{6}$/i);
    }
  });

  it('maps the requested animation types to public CSS classes', () => {
    const mappings: Record<string, string> = {
      'fade-up': 'anim-fade-up', 'slide-down': 'anim-fade-down', 'slide-right': 'anim-slide-in-right',
      'zoom-out': 'anim-zoom-out', 'pulse-focus': 'anim-pulse-focus', 'disc-drift': 'anim-disc-drift',
      'disc-float': 'anim-disc-float', 'orbit-spin': 'anim-orbit-spin',
      'orbit-reverse-spin': 'anim-orbit-reverse-spin', 'sphere-float': 'anim-sphere-float',
      'media-zoom': 'anim-media-zoom', tilt: 'anim-pointer-tilt', 'text-reveal': 'anim-text-reveal',
    };
    for (const [type, className] of Object.entries(mappings)) {
      assert.strictEqual(getAnimationClass(type), className, `${type} mapping`);
    }
  });

  console.log('--- 1. Sanitization & XSS Neutralization ---');

  it('cleanHtml strips script tags, onerror handlers, and javascript: links', () => {
    const dirty = '<p>Clean</p><script>alert("XSS")</script><img src="x" onerror="alert(1)"><a href="javascript:void(0)">Link</a>';
    const cleaned = cleanHtml(dirty);
    assert.ok(!cleaned.includes('<script>'), 'Must not contain script tags');
    assert.ok(!cleaned.includes('onerror'), 'Must not contain onerror handlers');
    assert.ok(!cleaned.includes('javascript:'), 'Must not contain javascript: schemes');
    assert.ok(cleaned.includes('<p>Clean</p>'), 'Must preserve clean HTML');
  });

  it('sanitizeSvg neutralizes active content, scripts, and event handlers in SVGs', () => {
    const maliciousSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" onload="alert('XSS')">
        <script>alert(1)</script>
        <circle cx="50" cy="50" r="40" fill="red" onclick="alert(2)" />
        <foreignObject width="100" height="100">
          <iframe src="javascript:alert(3)"></iframe>
        </foreignObject>
        <path d="M10 10 H 90 V 90 H 10 Z" fill="#910B2C" />
      </svg>
    `;
    const safeSvg = sanitizeSvg(maliciousSvg);
    assert.ok(!safeSvg.includes('<script>'), 'Must not contain script elements');
    assert.ok(!safeSvg.includes('onload'), 'Must not contain onload handlers');
    assert.ok(!safeSvg.includes('onclick'), 'Must not contain onclick handlers');
    assert.ok(!safeSvg.includes('<foreignObject>'), 'Must not contain foreignObject elements');
    assert.ok(!safeSvg.includes('javascript:'), 'Must not contain javascript: schemes');
    assert.ok(safeSvg.includes('<svg'), 'Must preserve svg element');
    assert.ok(safeSvg.includes('<path'), 'Must preserve valid vector paths');
  });

  console.log('\n--- 2. Server-Side Validation & Mass Assignment Prevention ---');

  it('validateSiteSettingsDraft rejects disallowed/unauthorized root properties', () => {
    const maliciousPayload = {
      header: { brandName: 'Legitimate Brand' },
      users: [{ id: 'hacker', role: 'admin' }], // unauthorized field injection
      passwordHashes: { usr1: 'hash' },
    };
    const result = validateSiteSettingsDraft(maliciousPayload);
    assert.strictEqual(result.isValid, false, 'Payload with unknown root keys must be rejected');
    assert.ok(result.errors.some(e => e.includes('users')), 'Must report disallowed field users');
  });

  it('validateSiteSettingsDraft rejects unsafe URL schemes in logos and links', () => {
    const payload = {
      cmsAppearance: {
        sidebarLogoUrl: 'javascript:alert(1)',
        sidebarLogoWidth: 150,
      },
    };
    const result = validateSiteSettingsDraft(payload);
    assert.strictEqual(result.isValid, false, 'Payload with javascript: URL must be rejected');
    assert.ok(result.errors.some(e => e.includes('unsafe URL scheme')));
  });

  it('validateSiteSettingsDraft accepts valid nested settings and sanitizes inputs', () => {
    const payload = {
      header: {
        brandName: 'Acme Corp',
        logoUrl: '/uploads/logo.png',
        logoWidth: 140,
        backgroundColor: '#FFFFFF',
      },
      theme: {
        primary: '#910B2C',
        accent: '#D5A13C',
      },
    };
    const result = validateSiteSettingsDraft(payload);
    assert.strictEqual(result.isValid, true, 'Valid payload must be accepted');
    assert.strictEqual(result.data?.header?.brandName, 'Acme Corp');
    assert.strictEqual(result.data?.theme?.primary, '#910B2C');
  });

  it('validateProduct enforces slug formatting and rejects unknown fields', () => {
    const badProduct = {
      name: 'Test Product',
      slug: 'Invalid Slug With Spaces!',
      extraInjectedField: 'malicious',
    };
    const result = validateProduct(badProduct);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some(e => e.includes('slug') || e.includes('extraInjectedField')));

    const goodProduct = {
      name: 'Enterprise Cloud Gateway',
      slug: 'enterprise-cloud-gateway',
      summary: 'High throughput API proxy',
      description: '<p>Valid description</p>',
      isPublished: true,
      updatedAt: '2026-10-20T10:00:00.000Z',
    };
    const goodResult = validateProduct(goodProduct);
    assert.strictEqual(goodResult.isValid, true);
    assert.strictEqual(goodResult.data?.slug, 'enterprise-cloud-gateway');
    assert.strictEqual(goodResult.data?.updatedAt, '2026-10-20T10:00:00.000Z');
  });

  it('validateProduct supports both isPublished and published flags', () => {
    const p1 = validateProduct({ name: 'Alpha', slug: 'alpha', isPublished: false });
    assert.strictEqual(p1.isValid, true);
    assert.strictEqual(p1.data?.isPublished, false);

    const p2 = validateProduct({ name: 'Beta', slug: 'beta', published: true });
    assert.strictEqual(p2.isValid, true);
    assert.strictEqual(p2.data?.isPublished, true);
  });

  it('validatePage enforces slug formatting and validates sections', () => {
    const goodPage = {
      slug: 'capabilities',
      title: 'Enterprise Architecture & Capabilities',
      metaDescription: 'Summary of capabilities',
      sections: [{ id: 'sec-1', type: 'hero', title: 'Hero' }],
      isPublished: true,
    };
    const result = validatePage(goodPage);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.data?.slug, 'capabilities');
  });

  console.log('\n--- 3. URL and Color Helpers ---');

  it('brandDocumentTitle replaces platform branding and prefixes unbranded titles', () => {
    assert.strictEqual(
      brandDocumentTitle('Azaroth Tech-Hive | Enterprise Architecture', 'Company A'),
      'Company A | Enterprise Architecture'
    );
    assert.strictEqual(brandDocumentTitle('Contact', 'Company A'), 'Company A | Contact');
    assert.strictEqual(brandDocumentTitle('Azaroth | Enterprise Architecture', ''), 'Azaroth | Enterprise Architecture');
  });

  it('isSafeUrl allows relative and http/https URLs and rejects javascript/data:text/html', () => {
    assert.strictEqual(isSafeUrl('/uploads/image.png'), true);
    assert.strictEqual(isSafeUrl('https://example.com/logo.png'), true);
    assert.strictEqual(isSafeUrl('#capabilities'), true);
    assert.strictEqual(isSafeUrl('mailto:support@example.com'), true);
    assert.strictEqual(isSafeUrl('javascript:alert(document.cookie)'), false);
    assert.strictEqual(isSafeUrl('data:text/html,<script>alert(1)</script>'), false);
  });

  it('isValidColor validates hex and css colors and rejects injection strings', () => {
    assert.strictEqual(isValidColor('#910B2C'), true);
    assert.strictEqual(isValidColor('#fff'), true);
    assert.strictEqual(isValidColor('rgba(255, 0, 0, 0.5)'), true);
    assert.strictEqual(isValidColor('transparent'), true);
    assert.strictEqual(isValidColor('red; background: url(javascript:alert(1))'), false);
    assert.strictEqual(isValidColor('<script>'), false);
  });

  console.log('\n--- 4. Media Storage Configuration ---');

  it('media filenames are sanitized, bounded, and preserve safe extensions', () => {
    assert.strictEqual(
      buildMediaFilename('My Logo (1).PNG', 123, 'ABC123'),
      'my_logo__1_123_abc123.png'
    );
    assert.strictEqual(buildMediaFilename('../../evil.svg', 456, 'x'), 'evil_456_x.svg');
    assert.strictEqual(buildMediaFilename('!!!.exe', 789, 'y'), 'media_789_y.exe');
  });

  it('storage prefixes and public URLs are normalized for CDN and path-style endpoints', () => {
    assert.strictEqual(normalizeStoragePrefix('/uploads/'), 'uploads');
    assert.strictEqual(normalizeStoragePrefix(' ../media// '), 'media');

    const base = {
      bucket: 'azaroth-media',
      region: 'us-east-1',
      prefix: 'uploads',
      forcePathStyle: false,
    };
    assert.strictEqual(
      buildS3PublicUrl({ ...base, publicBaseUrl: 'https://cdn.example.com' }, 'logo.png'),
      'https://cdn.example.com/uploads/logo.png'
    );
    assert.strictEqual(
      buildS3PublicUrl(
        { ...base, endpoint: 'https://account.r2.cloudflarestorage.com', forcePathStyle: true },
        'logo.png'
      ),
      'https://account.r2.cloudflarestorage.com/azaroth-media/uploads/logo.png'
    );
    assert.strictEqual(
      buildS3PublicUrl(base, 'logo.png'),
      'https://azaroth-media.s3.us-east-1.amazonaws.com/uploads/logo.png'
    );
  });

  it('media storage defaults to disk and rejects incomplete S3 configuration', () => {
    const disk = resolveMediaStorageConfig('D:\\uploads', {});
    assert.strictEqual(disk.kind, 'disk');

    assert.throws(
      () => resolveMediaStorageConfig('D:\\uploads', { MEDIA_STORAGE: 's3' }),
      /requires S3_BUCKET/
    );
    assert.throws(
      () =>
        resolveMediaStorageConfig('D:\\uploads', {
          MEDIA_STORAGE: 's3',
          S3_BUCKET: 'bad/bucket',
          S3_ACCESS_KEY_ID: 'key',
          S3_SECRET_ACCESS_KEY: 'secret',
        }),
      /S3_BUCKET contains invalid characters/
    );

    const s3 = resolveMediaStorageConfig('D:\\uploads', {
      MEDIA_STORAGE: 's3',
      S3_BUCKET: 'azaroth-media',
      S3_ACCESS_KEY_ID: 'key',
      S3_SECRET_ACCESS_KEY: 'secret',
      S3_ENDPOINT: 'https://account.r2.cloudflarestorage.com/',
      S3_PREFIX: '/uploads/',
    });
    assert.strictEqual(s3.kind, 's3');
    if (s3.kind === 's3') {
      assert.strictEqual(s3.forcePathStyle, true);
      assert.strictEqual(s3.prefix, 'uploads');
      assert.strictEqual(s3.endpoint, 'https://account.r2.cloudflarestorage.com');
    }
  });

  console.log('\n--- 5. Authentication & Token Security ---');

  it('generateToken creates valid JWT with user claims and expiration', () => {
    const user: User = {
      id: 'usr-1',
      name: 'Test Administrator',
      email: 'admin@azaroth-techhive.com',
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    const token = generateToken(user);
    assert.ok(typeof token === 'string' && token.length > 20, 'Token must be a non-empty JWT string');
    assert.strictEqual(token.split('.').length, 3, 'JWT must have header, payload, and signature components');
  });

  console.log('\n--- 6. Footer Normalization & Navbar Overlay ---');

  it('legacy footer social links keep disabled state and do not enable unused platforms', () => {
    const cfg = {
      ...DEFAULT_SETTINGS.footer,
      socialItems: undefined,
      socialLinks: [
        { platform: 'linkedin', url: 'https://linkedin.com/company/acme', enabled: true, label: 'LinkedIn' },
        { platform: 'facebook', url: 'https://facebook.com/acme', enabled: false, label: 'Facebook' },
      ],
    } as FooterConfig;
    const items = getEffectiveSocialItems(cfg);
    assert.strictEqual(items.find((item) => item.platform === 'linkedin')?.enabled, true);
    assert.strictEqual(items.find((item) => item.platform === 'facebook')?.enabled, false);
    assert.strictEqual(items.find((item) => item.platform === 'twitter' || item.platform === 'x')?.enabled, false);
    assert.strictEqual(items.find((item) => item.platform === 'instagram')?.enabled, false);
  });

  it('legacy enabled social links survive placeholder socialItems during normalization', () => {
    const cfg = {
      ...DEFAULT_SETTINGS.footer,
      socialItems: [
        { id: 'soc-linkedin', platform: 'linkedin', url: '', enabled: false, label: 'LinkedIn' },
      ],
      socialLinks: [
        { platform: 'linkedin', url: 'https://linkedin.com/company/acme', enabled: true, label: 'LinkedIn' },
      ],
    } as FooterConfig;

    const items = normalizeSocialItems(cfg);
    const linkedin = items.find((item) => item.platform === 'linkedin');
    assert.strictEqual(linkedin?.enabled, true);
    assert.strictEqual(linkedin?.url, 'https://linkedin.com/company/acme');

    const normalized = normalizeFooterConfig(cfg);
    assert.strictEqual(normalized.config.socialItems?.find((item) => item.platform === 'linkedin')?.enabled, true);
  });

  it('legacy footer columns generate deterministic sections and normalize idempotently', () => {
    const cfg = {
      ...DEFAULT_SETTINGS.footer,
      sections: undefined,
      columns: [
        {
          id: 'col-company',
          title: 'Company',
          links: [{ id: 'lnk-about', label: 'About', url: '/about' }],
        },
      ],
    } as FooterConfig;
    const first = normalizeFooterConfig(cfg);
    assert.ok(first.config.sections && first.config.sections.length > 0);
    assert.strictEqual(first.config.sections?.[0].id, 'sec-main');
    assert.ok(first.config.sections?.[0].columns.some((column) => column.elements.some((el) => el.type === 'nav_column')));
    assert.strictEqual(first.config.columns?.length, 1, 'Legacy columns must be preserved');

    const second = normalizeFooterConfig(first.config);
    assert.strictEqual(second.changed, false, 'Normalization must be idempotent');
    assert.deepStrictEqual(second.config.sections, first.config.sections);
  });

  it('footer validation rejects unsafe link protocols and bad layout types', () => {
    const unsafe = {
      ...DEFAULT_SETTINGS.footer,
      columns: [
        { id: 'col-1', title: 'Bad', links: [{ id: 'lnk-1', label: 'Bad', url: 'javascript:alert(1)' }] },
      ],
    } as FooterConfig;
    const unsafeResult = validateFooterConfig(unsafe);
    assert.strictEqual(unsafeResult.isValid, false);
    assert.ok(unsafeResult.errors.some((error) => error.includes('unsafe protocol')));

    const badLayout = {
      ...DEFAULT_SETTINGS.footer,
      sections: [
        { id: 'sec-1', type: 'main', columns: [{ id: 'col-1', elements: [{ id: 'el-1', type: 'iframe' }] }] },
      ],
    } as unknown as FooterConfig;
    const layoutResult = validateFooterConfig(badLayout);
    assert.strictEqual(layoutResult.isValid, false);
    assert.ok(layoutResult.errors.some((error) => error.includes('type is invalid')));
  });

  it('settings validation persists canonical footer sections from legacy columns', () => {
    const result = validateSiteSettingsDraft({
      footer: {
        brandName: 'Acme',
        columns: [
          {
            id: 'col-products',
            title: 'Products',
            links: [{ id: 'lnk-1', label: 'One', url: '/products' }],
          },
        ],
      },
    });
    assert.strictEqual(result.isValid, true);
    assert.ok(Array.isArray(result.data?.footer?.sections));
    assert.ok((result.data?.footer?.sections || []).length > 0);
    assert.strictEqual(result.data?.footer?.columns?.length, 1);
  });

  it('footer alignment is logical for RTL and column widths are honored', () => {
    assert.strictEqual(resolveFooterAlignment('left', 'ltr'), 'left');
    assert.strictEqual(resolveFooterAlignment('left', 'rtl'), 'right');
    assert.strictEqual(resolveFooterAlignment('right', 'rtl'), 'left');
    assert.strictEqual(resolveFooterAlignment('center', 'rtl'), 'center');
    assert.deepStrictEqual(buildSectionsFromLegacyColumns(undefined, []).map((section) => section.id), ['sec-main', 'sec-bottom']);
  });

  it('navbar overlay activates only for a visible image-gradient hero and respects saved transparency', () => {
    const hero = {
      id: 'hero-1',
      type: 'hero',
      title: 'Hero',
      bgMode: 'image-gradient',
      bannerImageUrl: '/uploads/hero.jpg',
      isHidden: false,
    } as PageSection;
    const appearance = resolveNavbarAppearance({
      sections: [hero],
      header: { ...DEFAULT_SETTINGS.header, overlayTransparency: 35, navbarTransparencyOnScroll: 0 },
      isScrolled: false,
    });
    assert.strictEqual(appearance.active, true);
    assert.strictEqual(appearance.mode, 'overlay');
    assert.strictEqual(appearance.transparency, 35);
    assert.strictEqual(appearance.alpha, 0.65);
    assert.strictEqual(appearance.backgroundCss, 'rgba(23, 27, 44, 0.65)');

    const hidden = resolveNavbarAppearance({
      sections: [{ ...hero, isHidden: true }, { ...hero, id: 'hero-2', type: 'feature_grid', bgMode: 'surface' }],
      header: DEFAULT_SETTINGS.header,
      isScrolled: false,
    });
    assert.strictEqual(hidden.active, false);
    assert.strictEqual(hidden.mode, 'surface');

    const missingImage = resolveNavbarAppearance({
      sections: [{ ...hero, bannerImageUrl: '' }],
      header: DEFAULT_SETTINGS.header,
      isScrolled: false,
    });
    assert.strictEqual(missingImage.active, false);

    const videoBanner = resolveNavbarAppearance({
      sections: [{ ...hero, bannerImageUrl: '', bannerVideoUrl: '/uploads/hero.mp4' }],
      header: DEFAULT_SETTINGS.header,
      isScrolled: false,
    });
    assert.strictEqual(videoBanner.active, true);
    assert.strictEqual(videoBanner.mode, 'overlay');
  });

  it('transparency conversion never alters the configured color and uses alpha=1-percent/100', () => {
    assert.strictEqual(transparencyToAlpha(0), 1);
    assert.strictEqual(transparencyToAlpha(40), 0.6);
    assert.strictEqual(transparencyToAlpha(100), 0);
    assert.strictEqual(transparencyToAlpha(-20), 1);
    assert.strictEqual(transparencyToAlpha(140), 0);
    assert.strictEqual(withAlpha('#171B2C', 0.6), 'rgba(23, 27, 44, 0.6)');
    assert.strictEqual(
      resolveNavbarTransparency({ ...DEFAULT_SETTINGS.header, overlayTransparency: 20, navbarTransparencyOnScroll: 55 }, true),
      55
    );
  });

  console.log('\n======================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
