export interface AddonManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  kind: 'core' | 'website';
  dependencies: string[];
  permissions: string[];
  routes: string[];
  apiRoutes: string[];
  contentTypes: string[];
  compatibility: string;
  migrationVersion: number;
  settingsSchema: { type: 'object'; properties: Record<string, unknown> };
  lifecycle: { activation: 'registered'; uninstallPolicy: 'retain-content' };
  disableable: boolean;
}

/**
 * Trusted build-time registry. Runtime uploads never become executable add-ons.
 * Add new code through the reviewed source/deployment pipeline, then register
 * its manifest here.
 */
type AddonRegistration = Omit<AddonManifest, 'apiRoutes' | 'compatibility' | 'migrationVersion' | 'settingsSchema' | 'lifecycle'> &
  Partial<Pick<AddonManifest, 'apiRoutes' | 'compatibility' | 'migrationVersion' | 'settingsSchema' | 'lifecycle'>>;

const register = (input: AddonRegistration): AddonManifest => ({
  ...input,
  apiRoutes: input.apiRoutes || [],
  compatibility: input.compatibility || '^1.0.0',
  migrationVersion: input.migrationVersion || 1,
  settingsSchema: input.settingsSchema || { type: 'object', properties: {} },
  lifecycle: input.lifecycle || { activation: 'registered', uninstallPolicy: 'retain-content' },
});

export const BUILTIN_ADDONS: AddonManifest[] = [
  register({ id: 'cms-core', name: 'CMS Core', description: 'Identity, permissions, settings, publishing and diagnostics.', version: '1.0.0', kind: 'core', dependencies: [], permissions: ['admin'], routes: ['/admin', '/api/admin'], contentTypes: [], disableable: false }),
  register({ id: 'website-pages', name: 'Website Pages', description: 'Visual page builder and published CMS pages.', version: '1.0.0', kind: 'core', dependencies: ['cms-core'], permissions: ['editor'], routes: ['/admin/pages', '/:slug'], contentTypes: ['page', 'page-section'], disableable: false }),
  register({ id: 'website-branding', name: 'Branding and Theme', description: 'Site identity, theme colors, typography, navigation and footer.', version: '1.0.0', kind: 'core', dependencies: ['cms-core'], permissions: ['editor'], routes: ['/admin/branding', '/admin/theme', '/admin/footer'], contentTypes: ['site-settings', 'navigation', 'footer'], disableable: false }),
  register({ id: 'website-products', name: 'Product Catalog', description: 'Product catalog, detail pages and product content management.', version: '1.0.0', kind: 'website', dependencies: ['cms-core'], permissions: ['editor'], routes: ['/products', '/product/:slug', '/admin/products'], apiRoutes: ['/api/products', '/api/products/:slug'], contentTypes: ['product'], disableable: true }),
  register({ id: 'website-chatbot', name: 'Chatbot and FAQs', description: 'Public FAQ assistant and its no-code content manager.', version: '1.0.0', kind: 'website', dependencies: ['cms-core'], permissions: ['editor'], routes: ['/admin/chatbot'], apiRoutes: ['/api/public/addons'], contentTypes: ['faq', 'chatbot-settings'], disableable: true }),
  register({ id: 'cms-media', name: 'Media Library', description: 'Media upload, selection, metadata and storage adapters.', version: '1.0.0', kind: 'core', dependencies: ['cms-core'], permissions: ['editor'], routes: ['/admin/media'], apiRoutes: ['/api/media'], contentTypes: ['media'], disableable: false }),
  register({ id: 'cms-enquiries', name: 'Leads and Enquiries', description: 'Contact forms, enquiry inbox and notification integration.', version: '1.0.0', kind: 'core', dependencies: ['cms-core'], permissions: ['editor'], routes: ['/contact', '/admin/inbox'], contentTypes: ['enquiry', 'lead'], disableable: false }),
];
