import type { FooterElementType } from '../types/index.js';

export interface ElementDefinition {
  type: FooterElementType;
  label: string;
  description: string;
  defaultTitle?: string;
}

export const AVAILABLE_FOOTER_ELEMENTS: ElementDefinition[] = [
  {
    type: 'logo',
    label: 'Company Logo',
    description: 'Main or compact brand logo image',
  },
  {
    type: 'brand_text',
    label: 'Logo & Brand Header',
    description: 'Unified company logo, brand name, subtitle, and bio',
  },
  {
    type: 'social_links',
    label: 'Social Media Icons',
    description: 'Follow Us heading with social platform icons',
    defaultTitle: 'Follow Us',
  },
  {
    type: 'nav_column',
    label: 'Navigation Column',
    description: 'Column with navigation links and heading',
    defaultTitle: 'Explore Links',
  },
  {
    type: 'contact_info',
    label: 'Contact Information',
    description: 'Direct email, phone number, and physical office address',
    defaultTitle: 'Contact Us',
  },
  {
    type: 'copyright',
    label: 'Copyright Notice',
    description: 'Dynamic copyright text with current year',
  },
  {
    type: 'newsletter',
    label: 'Newsletter Signup',
    description: 'Email capture input and subscription button',
    defaultTitle: 'Stay Updated',
  },
  {
    type: 'custom_text',
    label: 'Custom Text & Notes',
    description: 'Custom rich text block or legal disclaimer',
    defaultTitle: 'Notice',
  },
  {
    type: 'divider',
    label: 'Divider & Separator',
    description: 'Horizontal divider line with spacing',
  },
];

// Re-export the canonical footer model helpers so existing imports keep
// working while every consumer uses a single implementation.
export {
  SUPPORTED_SOCIAL_PLATFORMS,
  normalizeSocialPlatform,
  normalizeSocialItems,
  buildSectionsFromLegacyColumns,
  getEffectiveFooterSections,
  getEffectiveSocialItems,
  normalizeFooterConfig,
  validateFooterConfig,
  resolveFooterAlignment,
  footerColumnWidthClass,
} from './footerConfig.js';

export type {
  FooterNormalizationResult,
  FooterValidationResult,
  SocialPlatformDefinition,
} from './footerConfig.js';
