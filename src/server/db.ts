import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import type {
  SiteSettings,
  PageRecord,
  ProductRecord,
  ContactEnquiry,
  ChatbotLead,
  MediaItem,
  User,
  PublicDarkThemeColors,
  CursorStudioConfig,
  CmsAppearanceConfig,
  ThemeColors,
  AnimationConfig,
} from '../types/index.js';
import { normalizeFooterConfig } from '../utils/footerConfig.js';
import { runMigrations } from './migrations.js';
import { BUILTIN_ADDONS } from './addons.js';

const { Pool } = pg;

import { DEFAULT_SETTINGS } from '../constants/defaultSettings.js';
export { DEFAULT_SETTINGS };


// Initial 4 Products
export const INITIAL_PRODUCTS: ProductRecord[] = [
  {
    id: 'prod-gym-mgmt',
    name: 'Azaroth Gym Management',
    slug: 'gym-management',
    summary:
      'Unified athletic facility operations, biometric turnstile integration, recurring subscription debit, and member mobile experience.',
    description:
      'Azaroth Gym Management delivers comprehensive digital infrastructure for boutique fitness studios, CrossFit boxes, and multi-campus athletic clubs. Features automated gate check-ins, automated billing, trainer scheduling, equipment lifecycle management, and predictive member retention analytics.',
    heroImage: '/src/assets/images/product_gym_mgmt_1792419734268.jpg',
    heroImageAlt: 'Azaroth Gym Management tablet dashboard in high-end club',
    galleryImages: [
      '/src/assets/images/product_gym_mgmt_1792419734268.jpg',
      '/uploads/product_gym_mgmt_modern_1792473384005.jpg',
    ],
    features: [
      'Biometric & RFID Turnstile Access Integration',
      'Automated Recurring Direct Debit & Payment Retry Logic',
      'Class Capacity Management & Dynamic Trainer Scheduling',
      'Member Mobile Self-Service & Workout Tracking App',
      'Facility Equipment Maintenance & Lifecycle Telemetry',
      'Real-Time Member Churn Prediction & Retention Alerts',
    ],
    benefits: [
      'Reduce recurring billing failure and churn by up to 34%',
      'Eliminate front-desk queues with automated contactless turnstile check-in',
      'Optimize class schedules and trainer compensation with real-time occupancy data',
    ],
    useCases: [
      'Commercial Health & Racquet Clubs',
      'Boutique Pilates, Yoga & High-Intensity Studios',
      'University Athletic Complexes',
      'Corporate Wellness Centers',
    ],
    ctaLabel: 'Request Gym Suite Demo',
    ctaDestination: '#contact',
    metaTitle: 'Azaroth Gym Management | Unified Athletic & Fitness Club Software',
    metaDescription:
      'Automate memberships, biometric gate access, trainer scheduling, and recurring billing with Azaroth Gym Management.',
    isPublished: true,
    stage: 'Live',
    displayOrder: 1,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-ecommerce',
    name: 'Azaroth Enterprise Commerce',
    slug: 'e-commerce',
    summary:
      'High-throughput headless commerce engine engineered for omni-channel retail, B2B wholesale pricing, and international multi-currency transactions.',
    description:
      'Azaroth Enterprise Commerce empowers high-volume merchants with sub-100ms checkout times, multi-warehouse inventory orchestration, custom wholesale pricing tiers, and ERP connector middleware. Built to handle massive flash-sale traffic spikes without degradation.',
    heroImage: '/src/assets/images/product_ecommerce_1792419735805.jpg',
    heroImageAlt: 'Azaroth Enterprise E-commerce analytics on ultra-wide display',
    galleryImages: [
      '/src/assets/images/product_ecommerce_1792419735805.jpg',
      '/uploads/product_ecommerce_modern_1792473408571.jpg',
    ],
    features: [
      'Headless Microservices Architecture with Instant API Caching',
      'Multi-Warehouse Real-Time Inventory & Routing Sync',
      'Tiered Wholesale & B2B Customer Account Portals',
      'Multi-Currency, Multi-Language & Automated Tax Jurisdiction Logic',
      'Omnichannel POS & Marketplace Inventory Federation',
      'Rule-Based Dynamic Promotion & Volume Discount Engine',
    ],
    benefits: [
      'Maintain 99.99% uptime and sub-second rendering during global sales peaks',
      'Consolidate B2C retail and B2B wholesale order lifecycles into one interface',
      'Expand into foreign markets effortlessly with native cross-border compliance',
    ],
    useCases: [
      'Global Direct-to-Consumer (DTC) Brands',
      'Industrial Wholesale & B2B Parts Distributors',
      'Multi-Vendor Enterprise Marketplaces',
      'Omnichannel Luxury Retail Franchises',
    ],
    ctaLabel: 'Explore Commerce Architecture',
    ctaDestination: '#contact',
    metaTitle: 'Azaroth Enterprise Commerce | High-Throughput Headless B2B/B2C Platform',
    metaDescription:
      'Scale global digital commerce with ultra-fast checkout, multi-warehouse sync, and enterprise B2B tiered wholesale pricing.',
    isPublished: true,
    stage: 'Commercial Launch',
    displayOrder: 2,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-lms',
    name: 'Azaroth Enterprise LMS',
    slug: 'learning-management-system',
    summary:
      'Adaptive corporate learning and compliance platform featuring interactive curriculum authoring, SCORM/xAPI support, and executive skill matrix analytics.',
    description:
      'Azaroth Enterprise LMS streamlines employee onboarding, regulatory compliance certifications, and continuing executive education. Built for distributed enterprises with interactive video modules, assessments, automated audit reporting, and verifiable digital badges.',
    heroImage: '/src/assets/images/product_lms_1792419736269.jpg',
    heroImageAlt: 'Azaroth Enterprise LMS executive course interface on laptop',
    galleryImages: [
      '/src/assets/images/product_lms_1792419736269.jpg',
      '/uploads/product_lms_modern_1792473427764.jpg',
    ],
    features: [
      'SCORM 1.2 / 2004 & xAPI Compliant Course Player',
      'Interactive Video, Quiz, and Practical Assessment Authoring',
      'Automated Compliance Recertification & Grace Period Workflows',
      'Organizational Skills Matrix & Competency Gap Heatmaps',
      'White-Label Multi-Tenant Department & Partner Portals',
      'Cryptographically Verifiable Digital Badges & Transcripts',
    ],
    benefits: [
      'Ensure 100% audit readiness for mandatory industry compliance',
      'Accelerate new hire ramp time by up to 45% through self-paced learning paths',
      'Identify skill deficits across engineering and executive units before project kickoffs',
    ],
    useCases: [
      'Regulated Financial & Healthcare Institutions',
      'Distributed Global Technology Organizations',
      'Accredited Professional Certification Bodies',
      'National Retail & Franchise Operator Networks',
    ],
    ctaLabel: 'Request LMS Demonstration',
    ctaDestination: '#contact',
    metaTitle: 'Azaroth Enterprise LMS | Compliance, Training & Skill Matrix Platform',
    metaDescription:
      'Empower workforce learning with automated compliance certifications, SCORM compatibility, and executive skill matrix heatmaps.',
    isPublished: true,
    stage: 'Ready for Deployment',
    displayOrder: 3,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-medicare',
    name: 'Azaroth MediCare Clinical Suite',
    slug: 'medicare-healthcare-management',
    summary:
      'Secure clinic operations, electronic health records (EHR), telemedicine consultations, and HIPAA-compliant patient communication.',
    description:
      'Azaroth MediCare Clinical Suite bridges clinical workflows, telemetry, and patient outcomes. Designed with end-to-end encrypted medical charting, provider scheduling, e-prescriptions, lab order tracking, patient portal, and insurance claim adjudication.',
    heroImage: '/src/assets/images/product_medicare_1792419736208.jpg',
    heroImageAlt: 'Azaroth MediCare clinical EHR workstation in hospital',
    galleryImages: [
      '/src/assets/images/product_medicare_1792419736208.jpg',
      '/uploads/product_medicare_modern_1792473449716.jpg',
    ],
    features: [
      'HIPAA-Aligned Encrypted Electronic Health Records (EHR)',
      'Integrated High-Definition Telehealth Video Consultations',
      'Bidirectional E-Prescription & Diagnostic Lab Integration',
      'Automated Appointment Reminders & Secure SMS Notifications',
      'Provider Multi-Room Allocation & Operational Schedule Engine',
      'Insurance Real-Time Eligibility Verification & Claims Tracking',
    ],
    benefits: [
      'Reduce clinic patient no-show rates by up to 40%',
      'Cut physician charting time in half with specialty-tailored clinical encounter macros',
      'Ensure end-to-end auditability and patient data confidentiality',
    ],
    useCases: [
      'Outpatient Multi-Specialty Medical Practices',
      'Primary Care & Family Medicine Groups',
      'Telemedicine Virtual Healthcare Networks',
      'Specialized Diagnostic & Ambulatory Surgery Centers',
    ],
    ctaLabel: 'Schedule Clinical Walkthrough',
    ctaDestination: '#contact',
    metaTitle: 'Azaroth MediCare Clinical Suite | HIPAA-Compliant EHR & Clinic Platform',
    metaDescription:
      'Modernize clinical workflows with encrypted EHR, integrated telehealth consultations, automated lab orders, and provider scheduling.',
    isPublished: true,
    stage: 'Under Development',
    displayOrder: 4,
    updatedAt: new Date().toISOString(),
  },
];

// Initial Homepage Page Record
export const INITIAL_HOMEPAGE: PageRecord = {
  id: 'page-home',
  slug: 'home',
  title: 'Azaroth Tech-Hive | Enterprise Technology Architecture',
  metaDescription:
    'Azaroth Tech-Hive architects mission-critical digital systems, scalable software platforms, and enterprise solutions.',
  isPublished: true,
  publishedAt: new Date().toISOString(),
  sections: [
    {
      id: 'sec-hero',
      type: 'hero',
      title: 'Architecting Enterprise Digital Foundations',
      subtitle:
        'Azaroth Tech-Hive engineers high-performance software platforms, robust infrastructure, and intelligent business ecosystems for ambitious global organizations.',
      content:
        'From high-throughput commerce engines and biometric gym operations to clinical healthcare suites and enterprise learning platforms, we turn complex technical friction into enduring competitive velocity.',
      alignment: 'left',
      bgTreatment: 'default',
      imageUrl: '/src/assets/images/hero_tech_enterprise_1792419734209.jpg',
      imageAlt: 'Azaroth Tech-Hive enterprise innovation architecture',
      ctaText: 'Explore Solutions',
      ctaUrl: '#products',
    },
    {
      id: 'sec-stats',
      type: 'statistics',
      title: 'Engineered for Performance & Scale',
      subtitle: 'Quantifiable operational outcomes delivered across our enterprise platforms.',
      bgTreatment: 'surface',
      items: [
        { label: 'Uptime Reliability', value: '99.99%', detail: 'High-availability clustered deployment' },
        { label: 'Transactions Processed', value: '45M+', detail: 'Annual secure financial events' },
        { label: 'Operational Reduction', value: '38%', detail: 'Average administrative overhead saved' },
        { label: 'Latency Baseline', value: '<85ms', detail: 'Global edge-cached response' },
      ],
    },
    {
      id: 'sec-product-showcase',
      type: 'product_showcase',
      title: 'Flagship Enterprise Platforms',
      subtitle:
        'Discover our four core operational suites, each customizable and ready for on-premise or cloud deployment.',
      bgTreatment: 'default',
      items: [
        { productSlug: 'gym-management' },
        { productSlug: 'e-commerce' },
        { productSlug: 'learning-management-system' },
        { productSlug: 'medicare-healthcare-management' },
      ],
    },
    {
      id: 'sec-capabilities',
      type: 'feature_grid',
      title: 'Core Architectural Capabilities',
      subtitle: 'End-to-end engineering rigor built into every system we deploy.',
      bgTreatment: 'surface',
      items: [
        {
          title: '01. Sovereign Data & Cloud Portability',
          description:
            'Deploy to customer-owned Kubernetes, on-premise bare metal, or managed cloud instances without vendor lock-in. Full Neon PostgreSQL compatibility.',
        },
        {
          title: '02. Zero-Trust Security & RBAC',
          description:
            'Granular role-based access control, encrypted session authentication, parameterized query enforcement, and cryptographic data integrity.',
        },
        {
          title: '03. Bidirectional Integration Middleware',
          description:
            'Pre-engineered connectors for enterprise ERPs, biometric RFID turnstiles, hospital EHRs, banking payment networks, and third-party APIs.',
        },
        {
          title: '04. Visual No-Code CMS & Governance',
          description:
            'Empower marketing and administrative teams with visual page builders, typography palettes, and product catalog controls without code changes.',
        },
      ],
    },
    {
      id: 'sec-testimonials',
      type: 'testimonials',
      title: 'Validated by Industry Leaders',
      subtitle: 'How enterprises transform their operations with Azaroth architectures.',
      bgTreatment: 'default',
      items: [
        {
          quote:
            'Deploying Azaroth Gym Management across our 18 club locations eliminated member check-in friction completely. Churn decreased by 31% in our first two quarters.',
          author: 'Marcus Vance',
          role: 'Chief Operating Officer',
          organization: 'Apex Fitness Holdings',
        },
        {
          quote:
            'During Black Friday peak traffic, our previous commerce setup buckled. Azaroth Enterprise Commerce handled 14,000 requests per minute with zero downtime and sub-100ms response.',
          author: 'Elena Rostova',
          role: 'VP of Digital Technology',
          organization: 'Meridian Global Retail',
        },
      ],
    },
    {
      id: 'sec-cta',
      type: 'cta',
      title: 'Ready to Modernize Your Enterprise Infrastructure?',
      subtitle:
        'Discuss your requirements with our principal software architects. We provide turnkey deployments and tailored technical proposals.',
      ctaText: 'Schedule Technical Discovery',
      ctaUrl: '#contact',
      bgTreatment: 'burgundy-subtle',
    },
  ],
  updatedAt: new Date().toISOString(),
};

// Database state container (holds memory/file cache and handles Neon Postgres when available)
interface DbState {
  settings: SiteSettings;
  draftSettings: SiteSettings;
  products: ProductRecord[];
  pages: PageRecord[];
  draftPages: PageRecord[];
  media: MediaItem[];
  enquiries: ContactEnquiry[];
  leads: ChatbotLead[];
  users: User[];
  passwordHashes: Record<string, string>;
  revisions: { id: string; timestamp: string; note: string; data: any }[];
  addons: Record<string, { enabled: boolean; settings: Record<string, unknown> }>;
}

let pool: pg.Pool | null = null;
let isNeonConnected = false;
const DATA_DIR = path.resolve(process.cwd(), process.env.DATA_DIR || 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Deeply merge stored settings with DEFAULT_SETTINGS so newly added fields and default theme tokens are never dropped or left undefined
function normalizeLogoUrl(value: any): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof value.url === 'string') return value.url;
  return '';
}

export function deepMergeSettings(stored: any): SiteSettings {
  if (!stored || typeof stored !== 'object') {
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  }
  const merged = {
    ...DEFAULT_SETTINGS,
    ...stored,
    header: { ...DEFAULT_SETTINGS.header, ...(stored.header || {}) },
    footer: { ...DEFAULT_SETTINGS.footer, ...(stored.footer || {}) },
    theme: {
      ...DEFAULT_SETTINGS.theme,
      ...(stored.theme || {}),
      darkTheme: {
        ...(DEFAULT_SETTINGS.theme?.darkTheme || {}),
        ...(stored.theme?.darkTheme || {}),
      } as PublicDarkThemeColors,
    },
    typography: { ...DEFAULT_SETTINGS.typography, ...(stored.typography || {}) },
    animation: {
      ...DEFAULT_SETTINGS.animation,
      ...(stored.animation || {}),
      cursorStudio: {
        ...(DEFAULT_SETTINGS.animation?.cursorStudio || {}),
        ...(stored.animation?.cursorStudio || {}),
      } as CursorStudioConfig,
      animations:
        Array.isArray(stored.animation?.animations) && stored.animation.animations.length > 0
          ? stored.animation.animations
          : DEFAULT_SETTINGS.animation?.animations || [],
    },
    productGrid: { ...DEFAULT_SETTINGS.productGrid, ...(stored.productGrid || {}) },
    chatbot: { ...DEFAULT_SETTINGS.chatbot, ...(stored.chatbot || {}) },
    cmsAppearance: { ...DEFAULT_SETTINGS.cmsAppearance, ...(stored.cmsAppearance || {}) } as CmsAppearanceConfig,
  };

  // Migrate the previous release's baked-in brand palette when existing
  // settings are loaded. Custom colors outside this exact legacy palette stay intact.
  const legacyBrandColors: Record<string, string> = {
    '#910b2c': '#35123F', '#780824': '#24102D', '#46213f': '#35123F',
    '#c49a50': '#D5A13C', '#b56bcb': '#A855F7', '#fbf7ef': '#FAF7F2',
    '#faf8f4': '#FAF7F2', '#351a32': '#24102D', '#513f4c': '#62576A',
    '#806d79': '#62576A', '#f2b6a0': '#F4A7A3',
  };
  const migrateColor = (value: unknown) => typeof value === 'string'
    ? legacyBrandColors[value.toLowerCase()] || value
    : value;
  const siteColorFields = ['primary', 'secondary', 'accent', 'background', 'surface', 'headerBg', 'footerBg',
    'headingInk', 'bodyText', 'mutedText', 'linkText', 'buttonBg', 'buttonText', 'borderColor', 'gradientStart', 'gradientEnd'];
  for (const field of siteColorFields) merged.theme[field as keyof ThemeColors] = migrateColor(merged.theme[field as keyof ThemeColors]) as never;
  for (const field of ['background', 'surface', 'headingInk', 'bodyText', 'mutedText', 'borderColor', 'headerBg', 'footerBg', 'buttonBg', 'buttonText'] as const) {
    if (merged.theme.darkTheme?.[field]) merged.theme.darkTheme[field] = migrateColor(merged.theme.darkTheme[field]) as string;
  }
  if (merged.cmsAppearance) {
    for (const field of ['sidebarBg', 'sidebarText', 'sidebarActiveBg', 'sidebarActiveText', 'accentColor', 'topbarBg', 'primaryBrand'] as const) {
      if (merged.cmsAppearance[field]) merged.cmsAppearance[field] = migrateColor(merged.cmsAppearance[field]) as string;
    }
  }
  if (merged.animation.cursorColor) merged.animation.cursorColor = migrateColor(merged.animation.cursorColor) as string;
  if (merged.animation.cursorStudio?.color) merged.animation.cursorStudio.color = migrateColor(merged.animation.cursorStudio.color) as string;

  // Normalize legacy object logoUrl to string
  if (merged.header && merged.header.logoUrl) {
    merged.header.logoUrl = normalizeLogoUrl(merged.header.logoUrl);
  }
  if (merged.footer && merged.footer.logoUrl) {
    merged.footer.logoUrl = normalizeLogoUrl(merged.footer.logoUrl);
  }
  if (merged.footer) {
    merged.footer = normalizeFooterConfig(merged.footer).config;
  }

  return merged;
}

// Memory state cache
let state: DbState = {
  settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
  draftSettings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
  products: JSON.parse(JSON.stringify(INITIAL_PRODUCTS)),
  pages: [JSON.parse(JSON.stringify(INITIAL_HOMEPAGE))],
  draftPages: [JSON.parse(JSON.stringify(INITIAL_HOMEPAGE))],
  media: [],
  enquiries: [],
  leads: [],
  users: [],
  passwordHashes: {},
  revisions: [],
  addons: {},
};

// Ensure local persistence directory exists
function ensureLocalStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };

      state.settings = deepMergeSettings(parsed.settings || state.settings);
      state.draftSettings = deepMergeSettings(parsed.draftSettings || parsed.settings || state.draftSettings);

      // Ensure all products have their designated stage
      if (Array.isArray(state.products)) {
        state.products = state.products.map(p => {
          if (!p.stage) {
            if (p.slug.includes('gym')) p.stage = 'Live';
            else if (p.slug.includes('commerce') || p.slug.includes('ecommerce')) p.stage = 'Commercial Launch';
            else if (p.slug.includes('lms') || p.slug.includes('learning')) p.stage = 'Ready for Deployment';
            else if (p.slug.includes('medicare') || p.slug.includes('clinical')) p.stage = 'Under Development';
            else p.stage = 'Ready for Deployment';
          }
          return p;
        });
      }
    } else {
      persistLocalStore();
    }

    // Automatically synchronize existing website images from assets and uploads into Media Library
    syncWebsiteAssets();
  } catch (err) {
    console.warn('[DB] Local store read note:', err);
  }
}

// Automatically scans and registers existing website images and uploaded assets into the Media Library
function syncWebsiteAssets() {
  if (!Array.isArray(state.media)) {
    state.media = [];
  }

  const existingUrls = new Set(state.media.map(m => m.url));
  const existingFilenames = new Set(state.media.map(m => m.filename));
  let hasNewAssets = false;

  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
  };

  const humanTitles: Record<string, string> = {
    'hero_tech_enterprise_1792419734209.jpg': 'Azaroth Architectural Engineering Hero Banner',
    'product_ecommerce_1792419735805.jpg': 'Azaroth Enterprise Commerce Platform Suite',
    'product_gym_mgmt_1792419734268.jpg': 'Azaroth Gym Management Facility Platform',
    'product_lms_1792419736269.jpg': 'Azaroth Enterprise LMS Learning Portal',
    'product_medicare_1792419736208.jpg': 'Azaroth MediCare Clinical EHR Suite',
    'soc_cyber_security_1792489059050.jpg': 'Azaroth Security Operations Center & Cyber Telemetry Hub',
    'ai_data_intelligence_1792489080244.jpg': 'Azaroth Neural Intelligence & Enterprise Big Data Engine',
    'logistics_supply_chain_1792489101302.jpg': 'Azaroth Autonomous Supply Chain & Logistics Operations Hub',
    'fintech_ledger_gateway_1792489121763.jpg': 'Azaroth Global Financial Settlement & Trading Ledger Gateway',
  };

  // 1. Scan src/assets/images
  const ASSETS_IMAGES_DIR = path.resolve(process.cwd(), 'src/assets/images');
  if (fs.existsSync(ASSETS_IMAGES_DIR)) {
    try {
      const files = fs.readdirSync(ASSETS_IMAGES_DIR);
      for (const file of files) {
        const url = `/src/assets/images/${file}`;
        if (!existingUrls.has(url) && !existingFilenames.has(file)) {
          const filePath = path.join(ASSETS_IMAGES_DIR, file);
          const stat = fs.statSync(filePath);
          const ext = path.extname(file).toLowerCase();
          const cleanName = file.replace(/_\d+\.[^/.]+$/, '').replace(/[_-]/g, ' ') + ext;
          const altText = humanTitles[file] || cleanName.replace(/\.[^/.]+$/, '');
          const isVideo = ext === '.mp4' || ext === '.webm';

          const item: MediaItem = {
            id: 'media-asset-' + file.replace(/[^a-zA-Z0-9]/g, '-'),
            filename: file,
            originalName: file.replace(/_\d+\.[^/.]+$/, ext),
            mimeType: mimeMap[ext] || 'image/jpeg',
            sizeBytes: stat.size,
            url,
            altText,
            mediaType: isVideo ? 'video' : 'image',
            uploadedAt: new Date(stat.mtime).toISOString(),
          };

          state.media.push(item);
          existingUrls.add(url);
          existingFilenames.add(file);
          hasNewAssets = true;
        }
      }
    } catch (e) {
      console.warn('[DB] syncWebsiteAssets assets dir scan note:', e);
    }
  }

  // 2. Scan uploads directory
  const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
  if (fs.existsSync(UPLOAD_DIR)) {
    try {
      const files = fs.readdirSync(UPLOAD_DIR);
      for (const file of files) {
        const url = `/uploads/${file}`;
        if (!existingUrls.has(url) && !existingFilenames.has(file)) {
          const filePath = path.join(UPLOAD_DIR, file);
          const stat = fs.statSync(filePath);
          const ext = path.extname(file).toLowerCase();
          const isVideo = ext === '.mp4' || ext === '.webm';

          const item: MediaItem = {
            id: 'media-up-' + file.replace(/[^a-zA-Z0-9]/g, '-'),
            filename: file,
            originalName: file.replace(/_\d+_[a-z0-9]+\.[^/.]+$/, ext),
            mimeType: mimeMap[ext] || 'image/png',
            sizeBytes: stat.size,
            url,
            altText: file.replace(/\.[^/.]+$/, '').replace(/_\d+_[a-z0-9]+$/, ''),
            mediaType: isVideo ? 'video' : 'image',
            uploadedAt: new Date(stat.mtime).toISOString(),
          };

          state.media.push(item);
          existingUrls.add(url);
          existingFilenames.add(file);
          hasNewAssets = true;
        }
      }
    } catch (e) {
      console.warn('[DB] syncWebsiteAssets uploads scan note:', e);
    }
  }

  if (hasNewAssets) {
    persistLocalStore();
    for (const m of state.media) {
      syncMediaToNeon(m);
    }
  }
}

export function persistLocalStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Local store write error:', err);
  }
}

// Initialize database (Neon PostgreSQL if DATABASE_URL present, plus robust local sync)
export async function initDatabase() {
  ensureLocalStore();

  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && !databaseUrl.includes('example.com') && !databaseUrl.includes('sample-pooler')) {
    try {
      pool = new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 20000,
        max: 10,
      });

      pool.on('error', (err) => {
        console.warn('[DB] Neon pool idle client error (handled safely):', err.message);
      });

      // Test connection
      const client = await pool.connect();
      console.log('[DB] Successfully connected to Neon PostgreSQL database.');
      isNeonConnected = true;

      await runMigrations(client);

      const addonRows = await client.query(`SELECT id, enabled, settings FROM ath_addons`);
      const registeredAddonIds = new Set<string>();
      for (const row of addonRows.rows) {
        registeredAddonIds.add(row.id);
        if (BUILTIN_ADDONS.some((addon) => addon.id === row.id)) {
          state.addons[row.id] = { enabled: row.enabled, settings: row.settings || {} };
        }
      }
      for (const addon of BUILTIN_ADDONS) {
        if (!registeredAddonIds.has(addon.id)) {
          await client.query(
            `INSERT INTO ath_addons (id, enabled, settings) VALUES ($1, TRUE, '{}'::jsonb) ON CONFLICT (id) DO NOTHING`,
            [addon.id]
          );
          state.addons[addon.id] = { enabled: true, settings: {} };
        }
      }

      // 1. Sync / Load Settings from Neon (deep-merge nested config objects so
      // newly added fields such as sidebar logo are never dropped)
      const settingsRes = await client.query(`SELECT id, data FROM ath_site_settings`);
      const publishedRow = settingsRes.rows.find(r => r.id === 'published');
      const draftRow = settingsRes.rows.find(r => r.id === 'draft');

      if (publishedRow && publishedRow.data) {
        state.settings = deepMergeSettings(publishedRow.data);
        if (JSON.stringify(state.settings) !== JSON.stringify(publishedRow.data)) {
          await client.query(
            `UPDATE ath_site_settings SET data = $1, updated_at = NOW() WHERE id = 'published'`,
            [JSON.stringify(state.settings)]
          );
        }
      } else {
        await client.query(
          `INSERT INTO ath_site_settings (id, data, is_draft, updated_at) VALUES ('published', $1, FALSE, NOW()) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
          [JSON.stringify(state.settings)]
        );
      }

      if (draftRow && draftRow.data) {
        state.draftSettings = deepMergeSettings(draftRow.data);
        if (JSON.stringify(state.draftSettings) !== JSON.stringify(draftRow.data)) {
          await client.query(
            `UPDATE ath_site_settings SET data = $1, updated_at = NOW() WHERE id = 'draft'`,
            [JSON.stringify(state.draftSettings)]
          );
        }
      } else {
        await client.query(
          `INSERT INTO ath_site_settings (id, data, is_draft, updated_at) VALUES ('draft', $1, TRUE, NOW()) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
          [JSON.stringify(state.draftSettings)]
        );
      }

      // 2. Sync / Load Products from Neon
      const productsRes = await client.query(`SELECT * FROM ath_products ORDER BY display_order ASC`);
      if (productsRes.rows.length > 0) {
        state.products = productsRes.rows.map(r => ({
          id: r.id,
          slug: r.slug,
          name: r.name,
          summary: r.summary,
          description: r.description,
          heroImage: r.hero_image,
          heroImageAlt: r.hero_image_alt,
          galleryImages: typeof r.gallery_images === 'string' ? JSON.parse(r.gallery_images) : r.gallery_images,
          features: typeof r.features === 'string' ? JSON.parse(r.features) : r.features,
          benefits: typeof r.benefits === 'string' ? JSON.parse(r.benefits) : r.benefits,
          useCases: typeof r.use_cases === 'string' ? JSON.parse(r.use_cases) : r.use_cases,
          ctaLabel: r.cta_label,
          ctaDestination: r.cta_destination,
          metaTitle: r.meta_title,
          metaDescription: r.meta_description,
          isPublished: r.is_published,
          displayOrder: r.display_order,
          stage: r.stage || 'Ready for Deployment',
          updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
        }));
      } else {
        for (const p of state.products) {
          await client.query(
            `INSERT INTO ath_products (id, slug, name, summary, description, hero_image, hero_image_alt, gallery_images, features, benefits, use_cases, cta_label, cta_destination, meta_title, meta_description, is_published, display_order, stage, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
             ON CONFLICT (id) DO NOTHING`,
            [
              p.id, p.slug, p.name, p.summary, p.description, p.heroImage, p.heroImageAlt,
              JSON.stringify(p.galleryImages || []), JSON.stringify(p.features || []),
              JSON.stringify(p.benefits || []), JSON.stringify(p.useCases || []),
              p.ctaLabel, p.ctaDestination, p.metaTitle, p.metaDescription,
              p.isPublished, p.displayOrder, p.stage || 'Ready for Deployment', p.updatedAt
            ]
          );
        }
      }

      // 3. Sync / Load Media from Neon
      const mediaRes = await client.query(`SELECT * FROM ath_media ORDER BY uploaded_at DESC`);
      if (mediaRes.rows.length > 0) {
        const neonMedia = mediaRes.rows.map(r => ({
          id: r.id,
          filename: r.filename,
          originalName: r.original_name,
          mimeType: r.mime_type,
          sizeBytes: Number(r.size_bytes),
          url: r.url,
          altText: r.alt_text,
          mediaType: r.media_type as 'image' | 'video',
          uploadedAt: new Date(r.uploaded_at).toISOString(),
        }));
        const existingUrls = new Set(neonMedia.map(m => m.url));
        const existingFilenames = new Set(neonMedia.map(m => m.filename));
        for (const local of state.media) {
          if (!existingUrls.has(local.url) && !existingFilenames.has(local.filename)) {
            neonMedia.push(local);
            syncMediaToNeon(local);
          }
        }
        state.media = neonMedia;
        persistLocalStore();
      } else {
        for (const m of state.media) {
          await client.query(
            `INSERT INTO ath_media (id, filename, original_name, mime_type, size_bytes, url, alt_text, media_type, uploaded_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (id) DO NOTHING`,
            [m.id, m.filename, m.originalName, m.mimeType, m.sizeBytes, m.url, m.altText, m.mediaType, m.uploadedAt]
          );
        }
      }

      // 4. Sync / Load Enquiries from Neon
      const enqRes = await client.query(`SELECT * FROM ath_enquiries ORDER BY created_at DESC`);
      if (enqRes.rows.length > 0) {
        state.enquiries = enqRes.rows.map(r => ({
          id: r.id,
          name: r.name,
          email: r.email,
          subject: r.subject,
          message: r.message,
          productInterest: r.product_interest,
          status: r.status,
          createdAt: new Date(r.created_at).toISOString(),
        }));
      }

      // 5. Sync / Load Leads from Neon
      const leadsRes = await client.query(`SELECT * FROM ath_leads ORDER BY created_at DESC`);
      if (leadsRes.rows.length > 0) {
        state.leads = leadsRes.rows.map(r => ({
          id: r.id,
          name: r.name,
          email: r.email,
          phone: r.phone,
          company: r.company,
          businessType: r.business_type,
          productInterest: r.product_interest,
          requirements: r.requirements,
          status: r.status,
          createdAt: new Date(r.created_at).toISOString(),
        }));
      }

      // 5b. Sync / Load Pages from Neon
      const pagesRes = await client.query(`SELECT * FROM ath_pages`);
      if (pagesRes.rows.length > 0) {
        state.pages = pagesRes.rows.map(r => ({
          id: r.id,
          slug: r.slug,
          title: r.title,
          metaDescription: r.meta_description,
          sections: typeof r.sections === 'string' ? JSON.parse(r.sections) : r.sections,
          isPublished: r.is_published,
          publishedAt: r.published_at ? new Date(r.published_at).toISOString() : undefined,
          updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
        }));
      } else {
        for (const p of state.pages) {
          await client.query(
            `INSERT INTO ath_pages (id, slug, title, meta_description, sections, is_published, published_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (slug) DO NOTHING`,
            [
              p.id, p.slug, p.title, p.metaDescription,
              JSON.stringify(p.sections), p.isPublished,
              p.publishedAt || new Date().toISOString(), p.updatedAt
            ]
          );
        }
      }

      // Drafts have their own durable table and can never overwrite live pages.
      const draftsRes = await client.query(`SELECT * FROM ath_page_drafts`);
      if (draftsRes.rows.length > 0) {
        state.draftPages = draftsRes.rows.map(r => ({
          id: r.id,
          slug: r.slug,
          title: r.title,
          metaDescription: r.meta_description,
          sections: typeof r.sections === 'string' ? JSON.parse(r.sections) : r.sections,
          isPublished: false,
          updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
        }));
      } else {
        for (const draft of state.draftPages) {
          await client.query(
            `INSERT INTO ath_page_drafts (id, slug, title, meta_description, sections, is_published, updated_at)
             VALUES ($1, $2, $3, $4, $5, FALSE, $6) ON CONFLICT (slug) DO NOTHING`,
            [draft.id, draft.slug, draft.title, draft.metaDescription, JSON.stringify(draft.sections), draft.updatedAt]
          );
        }
      }

      // 6. Sync / Load Users from Neon
      const usersRes = await client.query(`SELECT * FROM ath_users`);
      if (usersRes.rows.length > 0) {
        state.users = usersRes.rows.map(r => ({
          id: r.id,
          email: r.email,
          name: r.name,
          role: r.role,
          createdAt: new Date(r.created_at).toISOString(),
        }));
        usersRes.rows.forEach(r => {
          state.passwordHashes[r.id] = r.password_hash;
        });
      }

      client.release();
      persistLocalStore();
      console.log('[DB] Neon PostgreSQL tables verified & state synchronized successfully.');
    } catch (err) {
      console.warn('[DB] Neon connection attempted but not established.', (err as Error).message);
      isNeonConnected = false;
      await pool?.end().catch(() => undefined);
      pool = null;
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Production startup aborted because the required PostgreSQL database is unavailable.');
      }
    }
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Production startup aborted: DATABASE_URL is required.');
    }
    console.log('[DB] No production Neon DATABASE_URL configured. Initialized with local persistent file store (data/db.json).');
  }

  // Ensure default administrator exists
  const adminEmail = process.env.ADMIN_EMAIL || process.env.INITIAL_ADMIN_EMAIL || 'admin@azaroth-techhive.com';
  const existingAdmin = state.users.find(u => u.email.toLowerCase() === adminEmail.toLowerCase());
  if (!existingAdmin) {
    const rawPass = process.env.ADMIN_PASSWORD || process.env.INITIAL_ADMIN_PASSWORD;
    if (!rawPass || rawPass === 'Admin') {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          '[Security Fatal] Production startup aborted: INITIAL_ADMIN_PASSWORD must be configured in environment variables and cannot use the default "Admin" password.'
        );
      }
      console.warn('[Security Warning] INITIAL_ADMIN_PASSWORD not set or using default. Permitted for local development only.');
    }
    const effectivePass = rawPass || 'Admin';
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(effectivePass, salt);
    const adminUser: User = {
      id: 'usr-admin-' + Date.now(),
      email: adminEmail,
      name: 'Azaroth Tech-Hive Admin',
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    state.users.push(adminUser);
    state.passwordHashes[adminUser.id] = hash;
    persistLocalStore();

    if (pool && isNeonConnected) {
      pool.query(
        `INSERT INTO ath_users (id, email, name, password_hash, role, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
        [adminUser.id, adminUser.email, adminUser.name, hash, adminUser.role, adminUser.createdAt]
      ).catch(e => console.warn('[DB] User sync warning:', e.message));
    }
    console.log(`[DB] Seeded initial administrator: ${adminEmail}`);
  }


  // Ensure initial products exist
  if (state.products.length === 0) {
    state.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
    persistLocalStore();
  }

  // Ensure initial homepage exists
  if (state.pages.length === 0) {
    state.pages = [JSON.parse(JSON.stringify(INITIAL_HOMEPAGE))];
    state.draftPages = [JSON.parse(JSON.stringify(INITIAL_HOMEPAGE))];
    persistLocalStore();
  }
}

// Background sync helpers to Neon PostgreSQL
export async function syncSettingsToNeon(id: 'published' | 'draft', data: SiteSettings) {
  if (!pool || !isNeonConnected) return;
  try {
    await pool.query(
      `INSERT INTO ath_site_settings (id, data, is_draft, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [id, JSON.stringify(data), id === 'draft']
    );
  } catch (err) {
    console.warn(`[DB] Async Neon syncSettings failed (${id}):`, (err as Error).message);
  }
}

export async function syncProductToNeon(p: ProductRecord) {
  if (!pool || !isNeonConnected) return;
  try {
    await pool.query(
      `INSERT INTO ath_products (id, slug, name, summary, description, hero_image, hero_image_alt, gallery_images, features, benefits, use_cases, cta_label, cta_destination, meta_title, meta_description, is_published, display_order, stage, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       ON CONFLICT (id) DO UPDATE SET
         slug = EXCLUDED.slug,
         name = EXCLUDED.name,
         summary = EXCLUDED.summary,
         description = EXCLUDED.description,
         hero_image = EXCLUDED.hero_image,
         hero_image_alt = EXCLUDED.hero_image_alt,
         gallery_images = EXCLUDED.gallery_images,
         features = EXCLUDED.features,
         benefits = EXCLUDED.benefits,
         use_cases = EXCLUDED.use_cases,
         cta_label = EXCLUDED.cta_label,
         cta_destination = EXCLUDED.cta_destination,
         meta_title = EXCLUDED.meta_title,
         meta_description = EXCLUDED.meta_description,
         is_published = EXCLUDED.is_published,
         display_order = EXCLUDED.display_order,
         stage = EXCLUDED.stage,
         updated_at = EXCLUDED.updated_at`,
      [
        p.id, p.slug, p.name, p.summary, p.description, p.heroImage, p.heroImageAlt,
        JSON.stringify(p.galleryImages || []), JSON.stringify(p.features || []),
        JSON.stringify(p.benefits || []), JSON.stringify(p.useCases || []),
        p.ctaLabel, p.ctaDestination, p.metaTitle, p.metaDescription,
        p.isPublished, p.displayOrder, p.stage || 'Ready for Deployment', p.updatedAt
      ]
    );
  } catch (err) {
    console.warn(`[DB] Async Neon syncProduct failed (${p.slug}):`, (err as Error).message);
  }
}

export async function deleteProductFromNeon(id: string) {
  if (!pool || !isNeonConnected) return;
  try {
    await pool.query(`DELETE FROM ath_products WHERE id = $1`, [id]);
  } catch (err) {
    console.warn(`[DB] Async Neon deleteProduct failed:`, (err as Error).message);
  }
}

export async function syncPageToNeon(page: PageRecord) {
  if (!pool || !isNeonConnected) return;
  try {
    await pool.query(
      `INSERT INTO ath_pages (id, slug, title, meta_description, sections, is_published, published_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         meta_description = EXCLUDED.meta_description,
         sections = EXCLUDED.sections,
         is_published = EXCLUDED.is_published,
         published_at = EXCLUDED.published_at,
         updated_at = EXCLUDED.updated_at`,
      [
        page.id, page.slug, page.title, page.metaDescription,
        JSON.stringify(page.sections), page.isPublished,
        page.publishedAt || new Date().toISOString(), page.updatedAt
      ]
    );
  } catch (err) {
    console.warn(`[DB] Async Neon syncPage failed (${page.slug}):`, (err as Error).message);
  }
}

export async function syncPageDraftToNeon(page: PageRecord) {
  if (!pool || !isNeonConnected) return;
  await pool.query(
    `INSERT INTO ath_page_drafts (id, slug, title, meta_description, sections, is_published, updated_at)
     VALUES ($1, $2, $3, $4, $5, FALSE, $6)
     ON CONFLICT (slug) DO UPDATE SET id = EXCLUDED.id, title = EXCLUDED.title,
       meta_description = EXCLUDED.meta_description, sections = EXCLUDED.sections, updated_at = EXCLUDED.updated_at`,
    [page.id, page.slug, page.title, page.metaDescription, JSON.stringify(page.sections), page.updatedAt]
  );
}

export async function deletePageFromNeon(slug: string) {
  if (!pool || !isNeonConnected) return;
  try {
    await pool.query(`DELETE FROM ath_pages WHERE slug = $1`, [slug]);
  } catch (err) {
    console.warn(`[DB] Async Neon deletePage failed (${slug}):`, (err as Error).message);
  }
}

export async function syncMediaToNeon(m: MediaItem) {
  if (!pool || !isNeonConnected) return;
  try {
    await pool.query(
      `INSERT INTO ath_media (id, filename, original_name, mime_type, size_bytes, url, alt_text, media_type, uploaded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET original_name = EXCLUDED.original_name, alt_text = EXCLUDED.alt_text`,
      [m.id, m.filename, m.originalName, m.mimeType, m.sizeBytes, m.url, m.altText, m.mediaType, m.uploadedAt]
    );
  } catch (err) {
    console.warn(`[DB] Async Neon syncMedia failed:`, (err as Error).message);
  }
}

export async function deleteMediaFromNeon(id: string) {
  if (!pool || !isNeonConnected) return;
  try {
    await pool.query(`DELETE FROM ath_media WHERE id = $1`, [id]);
  } catch (err) {
    console.error(`[DB] Async Neon deleteMedia failed:`, (err as Error).message);
    throw err;
  }
}


export async function syncEnquiryToNeon(enq: ContactEnquiry) {
  if (!pool || !isNeonConnected) return;
  try {
    await pool.query(
      `INSERT INTO ath_enquiries (id, name, email, subject, message, product_interest, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status`,
      [enq.id, enq.name, enq.email, enq.subject, enq.message, enq.productInterest, enq.status, enq.createdAt]
    );
  } catch (err) {
    console.warn(`[DB] Async Neon syncEnquiry failed:`, (err as Error).message);
  }
}

export async function syncLeadToNeon(lead: ChatbotLead) {
  if (!pool || !isNeonConnected) return;
  try {
    await pool.query(
      `INSERT INTO ath_leads (id, name, email, phone, company, business_type, product_interest, requirements, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status`,
      [lead.id, lead.name, lead.email, lead.phone, lead.company, lead.businessType, lead.productInterest, lead.requirements, lead.status, lead.createdAt]
    );
  } catch (err) {
    console.warn(`[DB] Async Neon syncLead failed:`, (err as Error).message);
  }
}

export async function syncUserToNeon(user: User, passwordHash?: string) {
  if (!pool || !isNeonConnected) return;
  try {
    await pool.query(
      `INSERT INTO ath_users (id, email, name, password_hash, role, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         name = EXCLUDED.name,
         role = EXCLUDED.role,
         password_hash = COALESCE(NULLIF(EXCLUDED.password_hash, ''), ath_users.password_hash)`,
      [user.id, user.email, user.name, passwordHash || '', user.role, user.createdAt]
    );
  } catch (err) {
    console.warn('[DB] Async Neon syncUser failed:', (err as Error).message);
  }
}

export async function updateUserPasswordInNeon(id: string, passwordHash: string) {
  if (!pool || !isNeonConnected) return;
  try {
    await pool.query('UPDATE ath_users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
  } catch (err) {
    console.warn('[DB] Async Neon updateUserPassword failed:', (err as Error).message);
  }
}

export async function deleteUserFromNeon(id: string) {
  if (!pool || !isNeonConnected) return;
  try {
    await pool.query('DELETE FROM ath_users WHERE id = $1', [id]);
  } catch (err) {
    console.warn('[DB] Async Neon deleteUser failed:', (err as Error).message);
  }
}

// Database helper functions
export const db = {
  async getAddons() {
    if (pool && isNeonConnected) {
      const result = await pool.query(`SELECT id, enabled, settings, updated_at FROM ath_addons`);
      for (const row of result.rows) {
        if (BUILTIN_ADDONS.some((addon) => addon.id === row.id)) {
          state.addons[row.id] = { enabled: row.enabled, settings: row.settings || {} };
        }
      }
    }
    return BUILTIN_ADDONS.map((manifest) => ({
      ...manifest,
      enabled: state.addons[manifest.id]?.enabled ?? true,
      settings: state.addons[manifest.id]?.settings || {},
    }));
  },

  async setAddonEnabled(id: string, enabled: boolean) {
    const manifest = BUILTIN_ADDONS.find((addon) => addon.id === id);
    if (!manifest) throw new Error('Unknown add-on');
    if (!manifest.disableable && !enabled) throw new Error('Core add-ons cannot be disabled');
    const current = state.addons[id] || { enabled: true, settings: {} };
    if (enabled) {
      const dependencyStates = await this.getAddons();
      const unavailable = manifest.dependencies.find((dependency) =>
        !dependencyStates.find((addon) => addon.id === dependency)?.enabled
      );
      if (unavailable) throw new Error(`Required add-on "${unavailable}" is disabled`);
    }
    if (pool && isNeonConnected) {
      await pool.query(
        `INSERT INTO ath_addons (id, enabled, settings, updated_at) VALUES ($1, $2, $3, NOW())
         ON CONFLICT (id) DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = NOW()`,
        [id, enabled, JSON.stringify(current.settings)]
      );
    }
    state.addons[id] = { ...current, enabled };
    persistLocalStore();
    return { ...manifest, ...state.addons[id] };
  },

  async checkConnection(): Promise<boolean> {
    if (!pool || !isNeonConnected) return process.env.NODE_ENV !== 'production';
    try {
      await pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  },

  getStatus() {
    return {
      type: isNeonConnected ? 'neon-postgresql' : 'local-persistent-store',
      connected: isNeonConnected || process.env.NODE_ENV !== 'production',
      hasPostgresPool: !!pool,
      productsCount: state.products.length,
      pagesCount: state.pages.length,
      enquiriesCount: state.enquiries.length,
      leadsCount: state.leads.length,
      mediaCount: state.media.length,
    };
  },

  // Settings
  getSettings(isDraft = false): SiteSettings {
    const raw = isDraft ? state.draftSettings : state.settings;
    return deepMergeSettings(raw);
  },

  saveDraftSettings(settings: Partial<SiteSettings>): SiteSettings {
    state.draftSettings = deepMergeSettings({
      ...state.draftSettings,
      ...settings,
      header: settings.header ? { ...state.draftSettings.header, ...settings.header } : state.draftSettings.header,
      footer: settings.footer ? { ...state.draftSettings.footer, ...settings.footer } : state.draftSettings.footer,
      theme: settings.theme ? {
        ...state.draftSettings.theme,
        ...settings.theme,
        darkTheme: { ...(state.draftSettings.theme?.darkTheme || {}), ...(settings.theme.darkTheme || {}) },
      } : state.draftSettings.theme,
      animation: settings.animation ? {
        ...state.draftSettings.animation,
        ...settings.animation,
        cursorStudio: { ...(state.draftSettings.animation?.cursorStudio || {}), ...(settings.animation.cursorStudio || {}) },
      } : state.draftSettings.animation,
      cmsAppearance: settings.cmsAppearance ? { ...state.draftSettings.cmsAppearance, ...settings.cmsAppearance } : state.draftSettings.cmsAppearance,
      version: (state.draftSettings.version || 1) + 1,
      updatedAt: new Date().toISOString(),
    });
    persistLocalStore();
    syncSettingsToNeon('draft', state.draftSettings);
    return state.draftSettings;
  },

  publishSettings(): SiteSettings {
    // Atomically promote the validated draft to published
    state.settings = JSON.parse(JSON.stringify(state.draftSettings));
    state.settings.updatedAt = new Date().toISOString();
    
    // Add revision
    state.revisions.unshift({
      id: 'rev-' + Date.now(),
      timestamp: new Date().toISOString(),
      note: 'Settings published',
      data: JSON.parse(JSON.stringify(state.settings)),
    });
    if (state.revisions.length > 50) state.revisions.pop();

    persistLocalStore();
    syncSettingsToNeon('draft', state.draftSettings);
    syncSettingsToNeon('published', state.settings);
    return state.settings;
  },


  restoreDefaultSettings(): SiteSettings {
    state.draftSettings = deepMergeSettings(DEFAULT_SETTINGS);
    state.settings = deepMergeSettings(DEFAULT_SETTINGS);
    persistLocalStore();
    syncSettingsToNeon('draft', state.draftSettings);
    syncSettingsToNeon('published', state.settings);
    return state.settings;
  },

  // Products
  getProducts(includeUnpublished = false): ProductRecord[] {
    const list = includeUnpublished ? state.products : state.products.filter(p => p.isPublished);
    return list.sort((a, b) => a.displayOrder - b.displayOrder);
  },

  getProductBySlug(slug: string, includeUnpublished = false): ProductRecord | undefined {
    return state.products.find(
      p => p.slug === slug && (includeUnpublished || p.isPublished)
    );
  },

  saveProduct(prod: Partial<ProductRecord> & { name: string; slug: string }): ProductRecord {
    const existingIndex = state.products.findIndex(p => p.id === prod.id || p.slug === prod.slug);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const updated: ProductRecord = {
        ...state.products[existingIndex],
        ...prod,
        stage: prod.stage || state.products[existingIndex].stage || 'Ready for Deployment',
        updatedAt: now,
      };
      state.products[existingIndex] = updated;
      persistLocalStore();
      syncProductToNeon(updated);
      return updated;
    } else {
      const newProd: ProductRecord = {
        id: prod.id || 'prod-' + Date.now(),
        name: prod.name,
        slug: prod.slug,
        summary: prod.summary || '',
        description: prod.description || '',
        heroImage: prod.heroImage || '',
        heroImageAlt: prod.heroImageAlt || prod.name,
        galleryImages: prod.galleryImages || [],
        features: prod.features || [],
        benefits: prod.benefits || [],
        useCases: prod.useCases || [],
        ctaLabel: prod.ctaLabel || 'Request Solution',
        ctaDestination: prod.ctaDestination || '#contact',
        metaTitle: prod.metaTitle || `${prod.name} | Azaroth Tech-Hive`,
        metaDescription: prod.metaDescription || prod.summary || '',
        isPublished: prod.isPublished !== undefined ? prod.isPublished : true,
        displayOrder: prod.displayOrder ?? state.products.length + 1,
        stage: prod.stage || 'Ready for Deployment',
        updatedAt: now,
      };
      state.products.push(newProd);
      persistLocalStore();
      syncProductToNeon(newProd);
      return newProd;
    }
  },

  deleteProduct(id: string): boolean {
    const initialLen = state.products.length;
    state.products = state.products.filter(p => p.id !== id);
    persistLocalStore();
    deleteProductFromNeon(id);
    return state.products.length < initialLen;
  },

  // Pages
  getPages(includeUnpublished = false): PageRecord[] {
    if (!includeUnpublished) {
      return state.pages.filter(p => p.isPublished);
    }
    const map = new Map<string, PageRecord>();
    for (const p of state.pages) {
      map.set(p.slug, p);
    }
    for (const d of state.draftPages) {
      map.set(d.slug, d);
    }
    return Array.from(map.values());
  },

  getPage(slug: string, isDraft = false): PageRecord | undefined {
    if (isDraft) {
      const draft = state.draftPages.find(p => p.slug === slug);
      if (draft) return draft;
    }
    return state.pages.find(p => p.slug === slug);
  },

  async saveDraftPage(page: PageRecord): Promise<PageRecord> {
    const idx = state.draftPages.findIndex(p => p.slug === page.slug);
    const updated = { ...page, updatedAt: new Date().toISOString() };
    await syncPageDraftToNeon(updated);
    if (idx >= 0) {
      state.draftPages[idx] = updated;
    } else {
      state.draftPages.push(updated);
    }
    persistLocalStore();
    return updated;
  },

  async publishPage(slug: string): Promise<PageRecord | null> {
    const draft = state.draftPages.find(p => p.slug === slug);
    if (!draft) {
      const existing = state.pages.find(p => p.slug === slug);
      if (existing) return existing;
      return null;
    }
    const published = {
      ...draft,
      isPublished: true,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (pool && isNeonConnected) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO ath_pages (id, slug, title, meta_description, sections, is_published, published_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, TRUE, $6, $7)
           ON CONFLICT (slug) DO UPDATE SET id = EXCLUDED.id, title = EXCLUDED.title,
             meta_description = EXCLUDED.meta_description, sections = EXCLUDED.sections,
             is_published = TRUE, published_at = EXCLUDED.published_at, updated_at = EXCLUDED.updated_at`,
          [published.id, published.slug, published.title, published.metaDescription,
            JSON.stringify(published.sections), published.publishedAt, published.updatedAt]
        );
        await client.query('DELETE FROM ath_page_drafts WHERE slug = $1', [slug]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
    const idx = state.pages.findIndex(p => p.slug === slug);
    if (idx >= 0) {
      state.pages[idx] = published;
    } else {
      state.pages.push(published);
    }
    state.draftPages = state.draftPages.filter(p => p.slug !== slug);
    persistLocalStore();
    return published;
  },

  deletePage(slug: string): boolean {
    if (slug === 'home') return false;
    const initialLen = state.pages.length + state.draftPages.length;
    state.pages = state.pages.filter(p => p.slug !== slug);
    state.draftPages = state.draftPages.filter(p => p.slug !== slug);
    persistLocalStore();
    deletePageFromNeon(slug);
    return (state.pages.length + state.draftPages.length) < initialLen;
  },

  // Media
  getMedia(): MediaItem[] {
    syncWebsiteAssets();
    return [...state.media].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  },

  addMedia(item: MediaItem): MediaItem {
    state.media.unshift(item);
    persistLocalStore();
    syncMediaToNeon(item);
    return item;
  },

  updateMediaAlt(id: string, altText: string): MediaItem | null {
    const item = state.media.find(m => m.id === id);
    if (item) {
      item.altText = altText;
      persistLocalStore();
      syncMediaToNeon(item);
      return item;
    }
    return null;
  },

  updateMediaName(id: string, originalName: string): MediaItem | null {
    const item = state.media.find(m => m.id === id);
    if (item) {
      item.originalName = originalName;
      persistLocalStore();
      syncMediaToNeon(item);
      return item;
    }
    return null;
  },

  async deleteMedia(id: string): Promise<boolean> {
    const idx = state.media.findIndex(m => m.id === id);
    if (idx < 0) return false;

    if (pool && isNeonConnected) {
      try {
        await deleteMediaFromNeon(id);
      } catch (err) {
        console.error(`[DB] Async Neon deleteMedia error (${id}):`, (err as Error).message);
        throw new Error('Authoritative database deletion failed for media asset.');
      }
    }

    state.media.splice(idx, 1);
    persistLocalStore();
    return true;
  },


  // Enquiries (Contact Us)
  getEnquiries(): ContactEnquiry[] {
    return [...state.enquiries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  addEnquiry(enquiry: Omit<ContactEnquiry, 'id' | 'createdAt' | 'status'>): ContactEnquiry {
    const record: ContactEnquiry = {
      ...enquiry,
      id: 'enq-' + Date.now(),
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    state.enquiries.unshift(record);
    persistLocalStore();
    syncEnquiryToNeon(record);
    return record;
  },

  updateEnquiryStatus(id: string, status: 'new' | 'in_progress' | 'resolved'): ContactEnquiry | null {
    const item = state.enquiries.find(e => e.id === id);
    if (item) {
      item.status = status;
      persistLocalStore();
      syncEnquiryToNeon(item);
      return item;
    }
    return null;
  },

  // Leads (Chatbot)
  getLeads(): ChatbotLead[] {
    return [...state.leads].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  addLead(lead: Omit<ChatbotLead, 'id' | 'createdAt' | 'status'>): ChatbotLead {
    const record: ChatbotLead = {
      ...lead,
      id: 'lead-' + Date.now(),
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    state.leads.unshift(record);
    persistLocalStore();
    syncLeadToNeon(record);
    return record;
  },

  updateLeadStatus(id: string, status: 'new' | 'in_progress' | 'resolved'): ChatbotLead | null {
    const item = state.leads.find(l => l.id === id);
    if (item) {
      item.status = status;
      persistLocalStore();
      syncLeadToNeon(item);
      return item;
    }
    return null;
  },

  // Users & Auth
  getUserByEmail(email: string): { user: User; passwordHash: string } | null {
    const user = state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    return {
      user,
      passwordHash: state.passwordHashes[user.id] || '',
    };
  },

  getUserById(id: string): User | null {
    return state.users.find(u => u.id === id) || null;
  },

  getUsers(): User[] {
    return state.users;
  },

  createUser(user: User, passwordHash: string): User {
    state.users.push(user);
    state.passwordHashes[user.id] = passwordHash;
    persistLocalStore();
    syncUserToNeon(user, passwordHash);
    return user;
  },

  updateUser(
    id: string,
    updates: Partial<Pick<User, 'name' | 'email' | 'role'>>
  ): User | null {
    const index = state.users.findIndex((user) => user.id === id);
    if (index < 0) return null;
    const updated: User = { ...state.users[index], ...updates };
    state.users[index] = updated;
    persistLocalStore();
    syncUserToNeon(updated);
    return updated;
  },

  updateUserPassword(id: string, passwordHash: string): boolean {
    if (!state.users.some((user) => user.id === id)) return false;
    state.passwordHashes[id] = passwordHash;
    persistLocalStore();
    updateUserPasswordInNeon(id, passwordHash);
    return true;
  },

  deleteUser(id: string): boolean {
    const initialLength = state.users.length;
    state.users = state.users.filter((user) => user.id !== id);
    delete state.passwordHashes[id];
    persistLocalStore();
    deleteUserFromNeon(id);
    return state.users.length < initialLength;
  },

  // Revisions
  getRevisions() {
    return state.revisions;
  },
};
