import { cleanHtml } from './sanitize.js';
import type { SiteSettings, ProductRecord, PageRecord, NavLink } from '../types/index.js';
import { normalizeFooterConfig, validateFooterConfig } from '../utils/footerConfig.js';

export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: string[];
}

const SAFE_URL_REGEX = /^(https?:\/\/|\/|#|mailto:|tel:)/i;
const COLOR_HEX_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isSafeUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (trimmed === '') return true;
  if (/^javascript:/i.test(trimmed) || /^data:text\/html/i.test(trimmed)) {
    return false;
  }
  return SAFE_URL_REGEX.test(trimmed);
}

export function isValidColor(color?: string): boolean {
  if (!color || typeof color !== 'string') return true;
  const trimmed = color.trim();
  if (COLOR_HEX_REGEX.test(trimmed)) return true;
  // allow rgb/rgba/hsl/transparent
  if (/^(rgb|rgba|hsl|hsla)\([0-9%,. ]+\)$/i.test(trimmed) || trimmed === 'transparent') {
    return true;
  }
  return false;
}

const ALLOWED_SETTINGS_KEYS = new Set([
  'header',
  'footer',
  'theme',
  'productGrid',
  'chatbot',
  'typography',
  'animation',
  'cmsAppearance',
  'faqs',
  'version',
  'updatedAt',
]);

export function validateSiteSettingsDraft(body: any): ValidationResult<Partial<SiteSettings>> {
  const errors: string[] = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { isValid: false, errors: ['Settings payload must be a non-empty object.'] };
  }

  // Reject unknown root fields
  for (const key of Object.keys(body)) {
    if (!ALLOWED_SETTINGS_KEYS.has(key)) {
      errors.push(`Disallowed settings field: "${key}"`);
    }
  }

  const validated: Partial<SiteSettings> = {};

  // 1. Header Validation
  if (body.header) {
    if (typeof body.header !== 'object' || Array.isArray(body.header)) {
      errors.push('header must be an object.');
    } else {
      const h = body.header;
      if (h.brandName !== undefined && typeof h.brandName !== 'string') {
        errors.push('header.brandName must be a string.');
      }
      if (h.logoUrl && !isSafeUrl(h.logoUrl)) {
        errors.push('header.logoUrl contains an unsafe protocol.');
      }
      if (h.logoWidth !== undefined && (typeof h.logoWidth !== 'number' || h.logoWidth < 10 || h.logoWidth > 1000)) {
        errors.push('header.logoWidth must be between 10 and 1000.');
      }
      if (h.logoHeight !== undefined && (typeof h.logoHeight !== 'number' || h.logoHeight < 10 || h.logoHeight > 500)) {
        errors.push('header.logoHeight must be between 10 and 500.');
      }
      if (h.backgroundColor && !isValidColor(h.backgroundColor)) {
        errors.push('header.backgroundColor has an invalid color format.');
      }
      if (h.overlayBackgroundColor && !isValidColor(h.overlayBackgroundColor)) {
        errors.push('header.overlayBackgroundColor has an invalid color format.');
      }
      if (
        h.overlayTransparency !== undefined &&
        (typeof h.overlayTransparency !== 'number' ||
          !Number.isFinite(h.overlayTransparency) ||
          h.overlayTransparency < 0 ||
          h.overlayTransparency > 100)
      ) {
        errors.push('header.overlayTransparency must be a number between 0 and 100.');
      }
      if (
        h.navbarTransparencyOnScroll !== undefined &&
        (typeof h.navbarTransparencyOnScroll !== 'number' ||
          !Number.isFinite(h.navbarTransparencyOnScroll) ||
          h.navbarTransparencyOnScroll < 0 ||
          h.navbarTransparencyOnScroll > 100)
      ) {
        errors.push('header.navbarTransparencyOnScroll must be a number between 0 and 100.');
      }
      if (h.textColor && !isValidColor(h.textColor)) {
        errors.push('header.textColor has an invalid color format.');
      }
      if (h.links && Array.isArray(h.links)) {
        for (const [idx, link] of h.links.entries()) {
          if (!link.label || typeof link.label !== 'string') {
            errors.push(`header.links[${idx}].label is required.`);
          }
          if (link.url && !isSafeUrl(link.url)) {
            errors.push(`header.links[${idx}].url contains an unsafe protocol.`);
          }
        }
      }
      // Only sanitise fields that are actually present in the payload.
      // Writing a default here would wipe the stored draft value of every
      // sibling field on a partial update.
      const sanitizedHeader = { ...h };
      if (typeof h.brandName === 'string') {
        sanitizedHeader.brandName = cleanHtml(h.brandName).trim();
      }
      if (typeof h.brandSubName === 'string') {
        sanitizedHeader.brandSubName = cleanHtml(h.brandSubName).trim();
      }
      validated.header = sanitizedHeader;
    }
  }

  // 2. Footer Validation
  if (body.footer) {
    if (typeof body.footer !== 'object' || Array.isArray(body.footer)) {
      errors.push('footer must be an object.');
    } else {
      const f = body.footer;
      if (f.logoUrl && !isSafeUrl(f.logoUrl)) {
        errors.push('footer.logoUrl contains an unsafe protocol.');
      }
      if (f.backgroundColor && !isValidColor(f.backgroundColor)) {
        errors.push('footer.backgroundColor has an invalid color format.');
      }
      if (f.textColor && !isValidColor(f.textColor)) {
        errors.push('footer.textColor has an invalid color format.');
      }
      const sanitizedFooter = { ...f };
      if (typeof f.companyDescription === 'string') {
        sanitizedFooter.companyDescription = cleanHtml(f.companyDescription);
      }
      const footerValidation = validateFooterConfig(sanitizedFooter);
      for (const error of footerValidation.errors) {
        errors.push(error);
      }
      validated.footer = normalizeFooterConfig(sanitizedFooter).config;
    }
  }

  // 3. Theme Validation
  if (body.theme) {
    if (typeof body.theme !== 'object' || Array.isArray(body.theme)) {
      errors.push('theme must be an object.');
    } else {
      const t = body.theme;
      const colorKeys = ['primary', 'secondary', 'accent', 'background', 'surface', 'headerBg', 'footerBg', 'headingInk', 'bodyText', 'buttonBg', 'buttonText'];
      for (const ck of colorKeys) {
        if (t[ck] && !isValidColor(t[ck])) {
          errors.push(`theme.${ck} has an invalid color format.`);
        }
      }
      validated.theme = { ...t };
    }
  }

  // 4. CMS Appearance (white-label logo and styles)
  if (body.cmsAppearance) {
    if (typeof body.cmsAppearance !== 'object' || Array.isArray(body.cmsAppearance)) {
      errors.push('cmsAppearance must be an object.');
    } else {
      const c = body.cmsAppearance;
      if (c.sidebarLogoUrl && !isSafeUrl(c.sidebarLogoUrl)) {
        errors.push('cmsAppearance.sidebarLogoUrl contains an unsafe URL scheme.');
      }
      if (c.sidebarCompactLogoUrl && !isSafeUrl(c.sidebarCompactLogoUrl)) {
        errors.push('cmsAppearance.sidebarCompactLogoUrl contains an unsafe URL scheme.');
      }
      if (c.sidebarLogoWidth !== undefined && (typeof c.sidebarLogoWidth !== 'number' || c.sidebarLogoWidth < 10 || c.sidebarLogoWidth > 600)) {
        errors.push('cmsAppearance.sidebarLogoWidth must be between 10 and 600.');
      }
      if (c.sidebarLogoHeight !== undefined && (typeof c.sidebarLogoHeight !== 'number' || c.sidebarLogoHeight < 10 || c.sidebarLogoHeight > 300)) {
        errors.push('cmsAppearance.sidebarLogoHeight must be between 10 and 300.');
      }
      if (c.mode && !['dark', 'light'].includes(c.mode)) {
        errors.push('cmsAppearance.mode must be either "dark" or "light".');
      }
      if (c.cmsName !== undefined && typeof c.cmsName !== 'string') {
        errors.push('cmsAppearance.cmsName must be a string.');
      }
      const sanitizedCms = { ...c };
      if (typeof c.cmsName === 'string') {
        sanitizedCms.cmsName = cleanHtml(c.cmsName).trim().slice(0, 60);
      }
      if (typeof c.sidebarLogoAlt === 'string') {
        sanitizedCms.sidebarLogoAlt = cleanHtml(c.sidebarLogoAlt).trim();
      }
      if (typeof c.sidebarCompactLogoAlt === 'string') {
        sanitizedCms.sidebarCompactLogoAlt = cleanHtml(c.sidebarCompactLogoAlt).trim();
      }
      validated.cmsAppearance = sanitizedCms;
    }
  }

  // 5. Typography Validation
  if (body.typography) {
    if (typeof body.typography !== 'object' || Array.isArray(body.typography)) {
      errors.push('typography must be an object.');
    } else {
      const typo = body.typography;
      if (typo.baseFontSize !== undefined && (typeof typo.baseFontSize !== 'number' || typo.baseFontSize < 10 || typo.baseFontSize > 36)) {
        errors.push('typography.baseFontSize must be a number between 10 and 36.');
      }
      validated.typography = { ...typo };
    }
  }

  // Pass-through remaining permitted sections
  if (body.productGrid) validated.productGrid = { ...body.productGrid };
  if (body.chatbot) validated.chatbot = { ...body.chatbot };
  if (body.animation) validated.animation = { ...body.animation };
  if (body.faqs && Array.isArray(body.faqs)) validated.faqs = [...body.faqs];

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? validated : undefined,
    errors,
  };
}

const ALLOWED_PRODUCT_KEYS = new Set([
  'id',
  'name',
  'slug',
  'summary',
  'description',
  'heroImage',
  'heroImageAlt',
  'galleryImages',
  'features',
  'benefits',
  'useCases',
  'ctaLabel',
  'ctaDestination',
  'metaTitle',
  'metaDescription',
  'isPublished',
  'published',
  'displayOrder',
  'stage',
  'createdAt',
  'updatedAt',
]);

export function validateProduct(body: any): ValidationResult<ProductRecord> {
  const errors: string[] = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { isValid: false, errors: ['Product payload must be an object.'] };
  }

  for (const key of Object.keys(body)) {
    if (!ALLOWED_PRODUCT_KEYS.has(key)) {
      errors.push(`Disallowed product field: "${key}"`);
    }
  }

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.push('Product name is required.');
  }

  if (!body.slug || typeof body.slug !== 'string' || !SLUG_REGEX.test(body.slug.trim())) {
    errors.push('Product slug must contain only lowercase alphanumeric characters and hyphens (e.g. "my-product").');
  }

  if (body.heroImage && !isSafeUrl(body.heroImage)) {
    errors.push('Product heroImage contains an unsafe URL.');
  }

  if (body.galleryImages && !Array.isArray(body.galleryImages)) {
    errors.push('galleryImages must be an array of image URLs.');
  }

  const cleanDescription = body.description ? cleanHtml(String(body.description)) : '';

  const isPub = body.isPublished !== undefined
    ? Boolean(body.isPublished)
    : body.published !== undefined
    ? Boolean(body.published)
    : true;

  const record: any = {
    id: body.id || 'prod-' + Date.now(),
    name: body.name ? cleanHtml(String(body.name)).trim() : '',
    slug: body.slug ? body.slug.trim().toLowerCase() : '',
    summary: body.summary ? cleanHtml(String(body.summary)).trim() : '',
    description: cleanDescription,
    heroImage: body.heroImage || '',
    heroImageAlt: body.heroImageAlt ? cleanHtml(String(body.heroImageAlt)).trim() : body.name || '',
    galleryImages: Array.isArray(body.galleryImages) ? body.galleryImages : [],
    features: Array.isArray(body.features) ? body.features.map((f: any) => cleanHtml(String(f)).trim()) : [],
    benefits: Array.isArray(body.benefits) ? body.benefits.map((b: any) => cleanHtml(String(b)).trim()) : [],
    useCases: Array.isArray(body.useCases) ? body.useCases.map((u: any) => cleanHtml(String(u)).trim()) : [],
    ctaLabel: body.ctaLabel || 'Request Solution',
    ctaDestination: body.ctaDestination || '#contact',
    metaTitle: body.metaTitle || '',
    metaDescription: body.metaDescription || '',
    isPublished: isPub,
    displayOrder: typeof body.displayOrder === 'number' ? body.displayOrder : 1,
    stage: body.stage || 'Ready for Deployment',
    updatedAt: body.updatedAt || new Date().toISOString(),
  };

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? record : undefined,
    errors,
  };
}

const ALLOWED_PAGE_KEYS = new Set([
  'id',
  'slug',
  'title',
  'metaDescription',
  'sections',
  'isPublished',
  'publishedAt',
  'updatedAt',
]);

export function validatePage(body: any): ValidationResult<PageRecord> {
  const errors: string[] = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { isValid: false, errors: ['Page payload must be an object.'] };
  }

  for (const key of Object.keys(body)) {
    if (!ALLOWED_PAGE_KEYS.has(key)) {
      errors.push(`Disallowed page field: "${key}"`);
    }
  }

  if (!body.slug || typeof body.slug !== 'string' || (body.slug !== 'home' && !SLUG_REGEX.test(body.slug.trim()))) {
    errors.push('Page slug must contain only lowercase alphanumeric characters and hyphens.');
  }

  if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
    errors.push('Page title is required.');
  }

  if (body.sections && !Array.isArray(body.sections)) {
    errors.push('Page sections must be an array.');
  }

  const record: PageRecord = {
    id: body.id || 'page-' + (body.slug || Date.now()),
    slug: body.slug ? body.slug.trim().toLowerCase() : '',
    title: body.title ? cleanHtml(String(body.title)).trim() : '',
    metaDescription: body.metaDescription ? cleanHtml(String(body.metaDescription)).trim() : '',
    sections: Array.isArray(body.sections) ? body.sections : [],
    isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : false,
    publishedAt: body.publishedAt || undefined,
    updatedAt: new Date().toISOString(),
  };

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? record : undefined,
    errors,
  };
}
