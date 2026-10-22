import type {
  FooterColumn,
  FooterConfig,
  FooterElementConfig,
  FooterElementType,
  FooterLayoutColumn,
  FooterLayoutSection,
  FooterSocialItem,
} from '../types/index.js';

export interface SocialPlatformDefinition {
  id: string;
  label: string;
  defaultUrl: string;
  defaultColor: string;
}

export const SUPPORTED_SOCIAL_PLATFORMS: SocialPlatformDefinition[] = [
  { id: 'linkedin', label: 'LinkedIn', defaultUrl: 'https://linkedin.com', defaultColor: '#0A66C2' },
  { id: 'x', label: 'X (Twitter)', defaultUrl: 'https://x.com', defaultColor: '#FAF7F2' },
  { id: 'facebook', label: 'Facebook', defaultUrl: 'https://facebook.com', defaultColor: '#1877F2' },
  { id: 'instagram', label: 'Instagram', defaultUrl: 'https://instagram.com', defaultColor: '#E4405F' },
  { id: 'youtube', label: 'YouTube', defaultUrl: 'https://youtube.com', defaultColor: '#FF0000' },
  { id: 'github', label: 'GitHub', defaultUrl: 'https://github.com', defaultColor: '#FAF7F2' },
  { id: 'whatsapp', label: 'WhatsApp', defaultUrl: 'https://whatsapp.com', defaultColor: '#25D366' },
  { id: 'tiktok', label: 'TikTok', defaultUrl: 'https://tiktok.com', defaultColor: '#EE1D52' },
  { id: 'pinterest', label: 'Pinterest', defaultUrl: 'https://pinterest.com', defaultColor: '#BD081C' },
  { id: 'discord', label: 'Discord', defaultUrl: 'https://discord.com', defaultColor: '#5865F2' },
];

const FOOTER_ELEMENT_TYPES: FooterElementType[] = [
  'logo',
  'brand_text',
  'social_links',
  'nav_column',
  'contact_info',
  'copyright',
  'newsletter',
  'custom_text',
  'divider',
];

export interface FooterNormalizationResult {
  config: FooterConfig;
  changed: boolean;
}

export interface FooterValidationResult {
  isValid: boolean;
  errors: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeSocialPlatform(platform: string | undefined): string {
  const raw = (platform || '').trim().toLowerCase();
  if (raw === 'twitter' || raw === 'x / twitter' || raw === 'x-twitter') return 'x';
  return raw.replace(/[^a-z0-9]/g, '');
}

function platformDefinition(platform: string): SocialPlatformDefinition | undefined {
  return SUPPORTED_SOCIAL_PLATFORMS.find((entry) => entry.id === platform);
}

/**
 * Produces the canonical social item list.
 *
 * - `socialItems` is the source of truth when present.
 * - Legacy `socialLinks` entries that do not exist in `socialItems` are
 *   imported once, preserving their URL and disabled flag.
 * - Every supported platform is present so the CMS can always re-enable it,
 *   but missing legacy platforms default to disabled instead of silently
 *   creating live social links.
 *
 * The function is deterministic and idempotent: running it on its own output
 * returns an equivalent list.
 */
export function normalizeSocialItems(cfg: FooterConfig | undefined): FooterSocialItem[] {
  const byPlatform = new Map<string, FooterSocialItem>();

  const add = (item: FooterSocialItem, source: 'canonical' | 'legacy') => {
    const platform = normalizeSocialPlatform(item.platform);
    if (!platform) return;
    const definition = platformDefinition(platform);
    const existing = byPlatform.get(platform);

    if (existing) {
      // A default URL supplied to a placeholder canonical item must not mask
      // an explicitly configured legacy link during one-time migration.
      if (source === 'legacy' && existing.url === definition?.defaultUrl && item.url) {
        existing.url = item.url;
        existing.enabled = item.enabled !== false;
      }
      if (!existing.url && item.url) {
        existing.url = item.url;
        if (source === 'legacy' && item.enabled !== false) {
          existing.enabled = true;
        }
      }
      if (!existing.url && definition?.defaultUrl) {
        existing.url = definition.defaultUrl;
      }
      if (!existing.label && (item.label || definition?.label)) {
        existing.label = item.label || definition?.label;
      }
      return;
    }

    byPlatform.set(platform, {
      id: item.id || `soc-${platform}`,
      platform,
      url: typeof item.url === 'string' && item.url.trim().length > 0 ? item.url : (definition?.defaultUrl || ''),
      enabled: source === 'canonical' ? item.enabled !== false : item.enabled !== false,
      label: item.label || definition?.label || platform,
      iconColor: item.iconColor || definition?.defaultColor,
      ...(item.bgColor ? { bgColor: item.bgColor } : {}),
    });
  };

  for (const item of cfg?.socialItems || []) {
    add(item, 'canonical');
  }

  for (const link of cfg?.socialLinks || []) {
    add(
      {
        id: `soc-legacy-${normalizeSocialPlatform(link.platform) || 'unknown'}`,
        platform: link.platform,
        url: link.url,
        enabled: link.enabled ?? Boolean(link.url && link.url.trim().length > 0),
        label: link.label,
        iconColor: link.iconColor,
        bgColor: link.bgColor,
      },
      'legacy'
    );
  }

  for (const definition of SUPPORTED_SOCIAL_PLATFORMS) {
    if (!byPlatform.has(definition.id)) {
      byPlatform.set(definition.id, {
        id: `soc-${definition.id}`,
        platform: definition.id,
        url: definition.defaultUrl,
        enabled: false,
        label: definition.label,
        iconColor: definition.defaultColor,
      });
    }
  }

  const supportedOrder = new Map(
    SUPPORTED_SOCIAL_PLATFORMS.map((entry, index) => [entry.id, index])
  );

  return Array.from(byPlatform.values()).sort((a, b) => {
    const aIndex = supportedOrder.get(a.platform) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = supportedOrder.get(b.platform) ?? Number.MAX_SAFE_INTEGER;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.platform.localeCompare(b.platform);
  });
}

function normalizeElement(element: FooterElementConfig, index: number): FooterElementConfig | null {
  if (!isRecord(element) || !FOOTER_ELEMENT_TYPES.includes(element.type)) return null;
  return {
    ...element,
    id: element.id || `el-${index + 1}`,
  };
}

function normalizeColumn(
  column: FooterLayoutColumn,
  sectionIndex: number,
  columnIndex: number
): FooterLayoutColumn {
  return {
    ...column,
    id: column.id || `sec-${sectionIndex + 1}-col-${columnIndex + 1}`,
    alignment: column.alignment || 'left',
    elements: (column.elements || [])
      .map((element, elementIndex) => normalizeElement(element, elementIndex))
      .filter((element): element is FooterElementConfig => element !== null),
  };
}

function normalizeSections(
  sections: FooterLayoutSection[]
): FooterLayoutSection[] {
  return sections.map((section, sectionIndex) => ({
    ...section,
    id: section.id || `sec-${sectionIndex + 1}`,
    type: section.type || 'main',
    columns: (section.columns || []).map((column, columnIndex) =>
      normalizeColumn(column, sectionIndex, columnIndex)
    ),
  }));
}

/**
 * Builds a deterministic section tree from the legacy `columns[]` model.
 * Stable IDs mean the generated tree can be saved, re-read and regenerated
 * without creating duplicate sections or elements.
 */
export function buildSectionsFromLegacyColumns(
  cfg: FooterConfig | undefined,
  columns: FooterColumn[]
): FooterLayoutSection[] {
  const mainColumns: FooterLayoutColumn[] = [
    {
      id: 'default-col-brand',
      width: '1/3',
      alignment: 'left',
      elements: [
        { id: 'el-brand-1', type: 'brand_text' },
        { id: 'el-contact-1', type: 'contact_info', title: 'Connect' },
        {
          id: 'el-social-1',
          type: 'social_links',
          title: cfg?.socialHeading || 'Follow Us',
        },
      ],
    },
  ];

  columns.forEach((column, index) => {
    const key = column.id || `col-${index + 1}`;
    mainColumns.push({
      id: `default-col-nav-${key}`,
      width: 'auto',
      alignment: 'left',
      elements: [
        {
          id: `el-nav-${key}`,
          type: 'nav_column',
          title: column.title,
          columnId: column.id || key,
        },
      ],
    });
  });

  return [
    {
      id: 'sec-main',
      title: 'Main Footer Content',
      type: 'main',
      paddingY: 'normal',
      borderTop: false,
      borderBottom: true,
      columns: mainColumns,
    },
    {
      id: 'sec-bottom',
      title: 'Bottom Utility Bar',
      type: 'bottom_bar',
      paddingY: 'compact',
      borderTop: false,
      borderBottom: false,
      columns: [
        {
          id: 'col-bottom-copyright',
          width: 'auto',
          alignment: 'left',
          elements: [{ id: 'el-copyright-1', type: 'copyright' }],
        },
      ],
    },
  ];
}

export function getEffectiveFooterSections(cfg: FooterConfig | undefined): FooterLayoutSection[] {
  if (cfg?.sections && cfg.sections.length > 0) {
    return normalizeSections(cfg.sections);
  }
  return buildSectionsFromLegacyColumns(cfg, cfg?.columns || []);
}

export function getEffectiveSocialItems(cfg: FooterConfig | undefined): FooterSocialItem[] {
  return normalizeSocialItems(cfg);
}

/**
 * Canonicalises a footer configuration without losing legacy data.
 * `columns` is kept intact because nav_column elements reference its IDs.
 */
export function normalizeFooterConfig(cfg: FooterConfig): FooterNormalizationResult {
  const sections = getEffectiveFooterSections(cfg);
  const socialItems = normalizeSocialItems(cfg);

  const next: FooterConfig = {
    ...cfg,
    direction: cfg.direction === 'rtl' ? 'rtl' : 'ltr',
    columns: Array.isArray(cfg.columns) ? cfg.columns : [],
    socialLinks: Array.isArray(cfg.socialLinks) ? cfg.socialLinks : [],
    sections,
    socialItems,
  };

  const changed = JSON.stringify(next) !== JSON.stringify(cfg);
  return { config: next, changed };
}

const SAFE_URL_REGEX = /^(https?:\/\/|\/|#|mailto:|tel:)/i;

function isSafeFooterUrl(url: string): boolean {
  if (!url) return true;
  const trimmed = url.trim();
  if (trimmed === '') return true;
  if (/^javascript:/i.test(trimmed) || /^data:text\/html/i.test(trimmed)) return false;
  return SAFE_URL_REGEX.test(trimmed);
}

/**
 * Structural validation for footer sections. Numeric ranges are validated
 * here as well so both the CMS and the API reject corrupt layout data.
 */
export function validateFooterConfig(cfg: FooterConfig): FooterValidationResult {
  const errors: string[] = [];

  if (cfg.direction !== undefined && !['ltr', 'rtl'].includes(cfg.direction)) {
    errors.push('footer.direction must be "ltr" or "rtl".');
  }

  const numericFields: Array<[unknown, string, number, number]> = [
    [cfg.logoWidth, 'footer.logoWidth', 10, 1000],
    [cfg.logoHeight, 'footer.logoHeight', 10, 500],
    [cfg.logoSpacing, 'footer.logoSpacing', 0, 200],
  ];
  for (const [value, name, min, max] of numericFields) {
    if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)) {
      errors.push(`${name} must be a number between ${min} and ${max}.`);
    }
  }

  for (const [index, column] of (cfg.columns || []).entries()) {
    for (const [linkIndex, link] of (column.links || []).entries()) {
      if (link.url && !isSafeFooterUrl(link.url)) {
        errors.push(`footer.columns[${index}].links[${linkIndex}].url contains an unsafe protocol.`);
      }
    }
  }

  for (const [index, item] of (cfg.socialItems || []).entries()) {
    if (item.url && !isSafeFooterUrl(item.url)) {
      errors.push(`footer.socialItems[${index}].url contains an unsafe protocol.`);
    }
  }

  if (cfg.sections !== undefined && !Array.isArray(cfg.sections)) {
    errors.push('footer.sections must be an array.');
  }

  for (const [sectionIndex, section] of (cfg.sections || []).entries()) {
    if (!section.id || typeof section.id !== 'string') {
      errors.push(`footer.sections[${sectionIndex}].id is required.`);
    }
    if (!['top_bar', 'main', 'bottom_bar'].includes(section.type)) {
      errors.push(`footer.sections[${sectionIndex}].type is invalid.`);
    }
    if (!Array.isArray(section.columns)) {
      errors.push(`footer.sections[${sectionIndex}].columns must be an array.`);
      continue;
    }
    for (const [columnIndex, column] of section.columns.entries()) {
      if (!column.id || typeof column.id !== 'string') {
        errors.push(`footer.sections[${sectionIndex}].columns[${columnIndex}].id is required.`);
      }
      if (!Array.isArray(column.elements)) {
        errors.push(`footer.sections[${sectionIndex}].columns[${columnIndex}].elements must be an array.`);
        continue;
      }
      for (const [elementIndex, element] of column.elements.entries()) {
        if (!FOOTER_ELEMENT_TYPES.includes(element.type)) {
          errors.push(
            `footer.sections[${sectionIndex}].columns[${columnIndex}].elements[${elementIndex}].type is invalid.`
          );
        }
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

export function resolveFooterAlignment(
  alignment: 'left' | 'center' | 'right' | undefined,
  direction: 'ltr' | 'rtl'
): 'left' | 'center' | 'right' {
  const value = alignment || 'left';
  if (direction !== 'rtl') return value;
  if (value === 'left') return 'right';
  if (value === 'right') return 'left';
  return value;
}

export function footerColumnWidthClass(width: FooterLayoutColumn['width']): string {
  switch (width) {
    case '1/1':
      return 'w-full';
    case '1/2':
      return 'w-full md:w-[calc(50%-1rem)]';
    case '1/3':
      return 'w-full md:w-[calc(33.333%-1.334rem)]';
    case '2/3':
      return 'w-full md:w-[calc(66.667%-0.666rem)]';
    case '1/4':
      return 'w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)]';
    case '3/4':
      return 'w-full lg:w-[calc(75%-0.5rem)]';
    case 'auto':
    default:
      return 'w-full md:flex-1';
  }
}
