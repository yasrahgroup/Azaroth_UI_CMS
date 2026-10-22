export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface NavLink {
  id: string;
  label: string;
  url: string;
  isExternal?: boolean;
  order: number;
  children?: { id: string; label: string; url: string; isExternal?: boolean }[];
}

export interface HeaderConfig {
  logoUrl: string;
  logoAlt: string;
  logoWidth: number; // in pixels (e.g. 140)
  logoHeight?: number; // max height in pixels (default 42)
  logoSpacing?: number; // gap between logo and brand text in pixels (default 10)
  brandName: string;
  brandSubName?: string;
  brandNameFontSize?: number;
  brandSubNameFontSize?: number;
  brandNameColor?: string;
  brandSubNameColor?: string;
  brandLayout?: 'inline' | 'stacked';
  subtitle: string;
  layoutPreset:
    | 'logo-left-nav-center'
    | 'logo-right-nav-center'
    | 'logo-left-nav-right'
    | 'logo-right-nav-left'
    | 'logo-center-split';
  isSticky: boolean;
  isTransparentOnHero: boolean;
  backgroundColor: string;
  overlayBackgroundColor?: string;
  overlayTransparency?: number;
  navbarTransparencyOnScroll?: number;
  textColor: string;
  ctaText: string;
  ctaUrl: string;
  ctaStyle: 'burgundy' | 'gold' | 'outline';
  links: NavLink[];
}

export interface FooterColumn {
  id: string;
  title: string;
  links: { id: string; label: string; url: string; isExternal?: boolean }[];
}

export type FooterElementType =
  | 'logo'
  | 'brand_text'
  | 'social_links'
  | 'nav_column'
  | 'contact_info'
  | 'copyright'
  | 'newsletter'
  | 'custom_text'
  | 'divider';

export interface FooterSocialItem {
  id: string;
  platform: string;
  url: string;
  enabled?: boolean;
  label?: string;
  iconColor?: string;
  bgColor?: string;
}

export interface FooterElementConfig {
  id: string;
  type: FooterElementType;
  title?: string;
  content?: string;
  columnId?: string; // links to FooterColumn.id for 'nav_column'
  alignment?: 'left' | 'center' | 'right';
  customSettings?: {
    showHeading?: boolean;
    headingText?: string;
    style?: string;
    size?: string;
    color?: string;
    buttonText?: string;
    placeholder?: string;
    compactLogo?: boolean;
  };
}

export interface FooterLayoutColumn {
  id: string;
  width?: 'auto' | '1/1' | '1/2' | '1/3' | '1/4' | '2/3' | '3/4';
  alignment?: 'left' | 'center' | 'right';
  elements: FooterElementConfig[];
}

export interface FooterLayoutSection {
  id: string;
  title?: string;
  type: 'top_bar' | 'main' | 'bottom_bar';
  columns: FooterLayoutColumn[];
  paddingY?: 'none' | 'compact' | 'normal' | 'relaxed';
  borderTop?: boolean;
  borderBottom?: boolean;
  alignment?: 'left' | 'center' | 'right';
}

export interface FooterConfig {
  logoUrl: string;
  logoAlt?: string;
  logoWidth?: number;
  logoHeight?: number;
  logoSpacing?: number; // gap between logo and brand text in pixels (default 10)
  brandName: string;
  brandSubName?: string;
  brandNameFontSize?: number;
  brandSubNameFontSize?: number;
  brandNameColor?: string;
  brandSubNameColor?: string;
  brandLayout?: 'inline' | 'stacked';
  subtitle: string;
  companyDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  copyrightText: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  direction?: 'ltr' | 'rtl';
  layoutPreset?: 'standard' | 'reversed' | 'stacked' | 'columns-focused';
  columns: FooterColumn[];
  socialLinks: { platform: string; url: string; enabled?: boolean; iconColor?: string; bgColor?: string; label?: string }[];
  // Modular Builder Configuration
  builderEnabled?: boolean;
  sections?: FooterLayoutSection[];
  socialItems?: FooterSocialItem[];
  socialHeading?: string;
  socialStyle?: 'plain' | 'circle' | 'square' | 'outline';
  socialSize?: 'sm' | 'md' | 'lg';
  newsletterTitle?: string;
  newsletterSubtitle?: string;
  newsletterButtonText?: string;
  newsletterPlaceholder?: string;
}

export type ColorStyle = 'solid' | 'gradient' | 'outline';

export type ColorDistributionPreset =
  | 'plum-gold-luxury'
  | 'burgundy-primary'
  | 'ivory-primary'
  | 'balanced-burgundy-ivory'
  | 'gold-accented'
  | 'monochrome-accented';

export interface PublicDarkThemeColors {
  background: string;
  surface: string;
  headingInk: string;
  bodyText: string;
  mutedText: string;
  borderColor: string;
  headerBg: string;
  footerBg: string;
  buttonBg?: string;
  buttonText?: string;
}

export interface ThemeColors {
  primary: string; // default #35123F
  secondary: string;
  accent: string; // default #D5A13C
  background: string; // default #FAF7F2
  surface: string; // default #FFFFFF
  headerBg: string;
  footerBg: string;
  headingInk: string; // default #171B2C
  bodyText: string;
  mutedText: string;
  linkText: string;
  buttonBg: string;
  buttonText: string;
  borderColor: string;
  colorStyle?: ColorStyle;
  gradientStart: string;
  gradientEnd: string;
  gradientAngle?: number; // degrees, e.g. 135
  distributionPreset: ColorDistributionPreset;
  enableDarkMode?: boolean;
  darkTheme?: PublicDarkThemeColors;
}

export interface ProductGridConfig {
  columns: number; // default 2
  cardStyle?: 'standard' | 'compact' | 'detailed';
  layoutStyle?: 'grid' | 'cards' | 'list';
}

export interface ChatbotColors {
  useCustomColors: boolean;
  windowBg?: string;
  headerBg?: string;
  headerText?: string;
  botBubbleBg?: string;
  botBubbleText?: string;
  userBubbleBg?: string;
  userBubbleText?: string;
  launcherBg?: string;
  launcherIconColor?: string;
  launcherGradientEnabled?: boolean;
  launcherGradientEnd?: string;
  launcherGradientAngle?: number;
  actionButtonBg?: string;
  actionButtonText?: string;
  actionButtonBorder?: string;
  sendButtonBg?: string;
  sendButtonText?: string;
}

export interface ChatbotConfig {
  botName: string;
  subtitle?: string;
  statusText?: string;
  welcomeMessage: string;
  avatarUrl: string;
  avatarAlt?: string;
  triggerLabel?: string;
  placeholderText?: string;
  enabled: boolean;
  colors?: ChatbotColors;
}

export interface TypographyConfig {
  headingFont: 'Plus Jakarta Sans' | 'Outfit' | 'Playfair Display' | 'DM Sans';
  bodyFont: 'Plus Jakarta Sans' | 'DM Sans' | 'Outfit';
  baseFontSize: number; // 16px default
  headingScale: number; // 1.25 default
  lineHeight: number; // 1.6 default
  letterSpacing: string; // '-0.02em', '0em', '0.02em'
}

export type AnimationCategory =
  | 'entrance_exit'
  | 'scroll'
  | 'hover_interaction'
  | 'text'
  | 'image_media'
  | 'page_transition'
  | 'cursor'
  | 'continuous';

export type AnimationType =
  | 'fade'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'zoom-in'
  | 'zoom-out'
  | 'rotate'
  | 'reveal'
  | 'stagger'
  | 'tilt'
  | 'pulse-glow'
  | 'magnetic'
  | 'card-elevate'
  | 'text-typing'
  | 'text-reveal'
  | 'media-parallax'
  | 'media-zoom'
  | 'scale'
  | 'pulse-focus'
  | 'reveal'
  | 'disc-drift'
  | 'disc-float'
  | 'orbit-spin'
  | 'orbit-reverse-spin'
  | 'sphere-float';

export type GlossyPreset =
  | 'glass-surface' | 'glossy-shine' | 'glossy-button' | 'glossy-card'
  | 'glossy-image' | 'soft-glow' | 'neon-gloss' | 'liquid-glass'
  | 'top-highlight' | 'iridescent-gloss' | 'glossy-text' | 'glossy-overlay';

export type GlossyTarget = 'section' | 'buttons' | 'cards' | 'images' | 'text';

export interface GlossyEffectConfig {
  id: string;
  name: string;
  preset: GlossyPreset;
  target: GlossyTarget;
  enabled: boolean;
  intensity: number;
  opacity: number;
  highlightOpacity: number;
  baseColor: string;
  highlightColor: string;
  gradientStart: string;
  gradientEnd: string;
  borderColor: string;
  borderOpacity: number;
  borderWidth: number;
  borderRadius: number;
  transparency: number;
  blur: number;
  shadow: number;
  glowColor: string;
  glowSpread: number;
  reflectionSize: number;
  shineEnabled: boolean;
  shineDirection: 'left-right' | 'right-left' | 'top-bottom' | 'diagonal';
  shineDurationMs: number;
  shineDelayMs: number;
  shineRepeat: 'once' | 'loop' | 'hover';
  trigger: 'always' | 'hover' | 'focus' | 'scroll' | 'manual';
  hoverIntensity: number;
  hoverScale: number;
  hoverElevation: number;
  pointerHighlight: boolean;
}

export type AnimationTargetScope = 'global' | 'page' | 'section' | 'component';

export interface StudioAnimation {
  id: string;
  name: string;
  description?: string;
  category: AnimationCategory;
  type: AnimationType;
  targetScope: AnimationTargetScope;
  targetPage?: string;
  targetSection?: string;
  targetSectionId?: string;
  targetComponent?: string;
  targetComponentType?: string;
  durationMs: number;
  duration?: number;
  delayMs: number;
  delay?: number;
  easing: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  intensity: 'subtle' | 'medium' | 'expressive' | number;
  repeatCount?: number | 'infinite';
  alternate?: boolean;
  trigger: 'scroll' | 'hover' | 'load' | 'click' | 'entrance' | 'viewport';
  scrollThreshold?: number;
  scrollOnce?: boolean;
  staggerIntervalMs?: number;
  staggerInterval?: number;
  enabled: boolean;
  respectReducedMotion: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CursorStudioConfig {
  enabled: boolean;
  style: 'classic-ring' | 'neon-glow' | 'minimal-dot' | 'magnetic-circle' | 'custom-image';
  preset?: string;
  customImageUrl?: string;
  customImageAlt?: string;
  size: number;
  color: string;
  opacity: number;
  hoverTransform: 'scale-up' | 'glow' | 'color-invert' | 'ring-expand' | 'none';
  clickFeedback: 'compress' | 'ripple' | 'burst' | 'none';
  trailEffect: 'none' | 'particles' | 'fading-line' | 'dual-ring';
  trailLength?: number;
  movementSmoothing: number;
  respectReducedMotion: boolean;
}

export interface AnimationRule {
  id: string;
  name: string;
  target: 'all-buttons' | 'product-cards' | 'section-headings' | 'images' | 'navbar';
  type: 'fade-up' | 'scale-in' | 'bounce-subtle' | 'pulse-glow' | 'slide-in-right' | 'tilt-on-hover';
  trigger: 'on-load' | 'on-hover' | 'on-scroll';
  durationMs: number;
  delayMs: number;
  easing: string;
  intensity?: number;
  enabled: boolean;
}

export interface AnimationConfig {
  cursorFollower: boolean;
  cursorIntensity: 'subtle' | 'medium' | 'expressive';
  cursorStyle?: 'classic-ring' | 'neon-glow' | 'minimal-dot' | 'magnetic-circle' | 'custom-image';
  cursorColor?: string;
  cardHoverElevation: boolean;
  scrollReveals: boolean;
  scrollIntensity: 'gentle' | 'moderate' | 'dramatic';
  carouselAutoplay: boolean;
  carouselIntervalMs?: number;
  pageTransitions?: boolean;
  pageTransitionStyle?: 'fade' | 'slide-up' | 'scale';
  buttonGlow?: boolean;
  magneticButtons?: boolean;
  hoverScale?: boolean;
  respectReducedMotion: boolean;
  cursorStudio?: CursorStudioConfig;
  animations?: StudioAnimation[];
  animationsEnabled?: boolean;
  glossyEffects?: GlossyEffectConfig[];
  glossyEffectsEnabled?: boolean;
  customRules?: AnimationRule[];
}

export type SectionType =
  | 'hero'
  | 'rich_text'
  | 'image_text'
  | 'feature_grid'
  | 'product_showcase'
  | 'statistics'
  | 'testimonials'
  | 'faq'
  | 'carousel'
  | 'video'
  | 'services'
  | 'industries'
  | 'team'
  | 'tech_showcase'
  | 'cta'
  | 'contact_info'
  | 'decorative_bg';

export interface PageSection {
  id: string;
  type: SectionType;
  title: string;
  subtitle?: string;
  content?: string;
  alignment?: 'left' | 'center' | 'right';
  titleColor?: string;
  titleSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  titleWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  subtitleColor?: string;
  bgTreatment?: 'default' | 'surface' | 'burgundy-subtle' | 'gold-subtle' | 'gradient';
  bgMode?: 'surface' | 'image' | 'image-gradient';
  bgSurfaceColor?: string;
  bgGradientFrom?: string;
  bgGradientTo?: string;
  bgGradientAngle?: number;
  bgImageOpacity?: number; // 0.1 to 1.0 or 10 to 100
  bgImagePosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  bgOverlayColor?: string;
  bgOverlayOpacity?: number;
  bannerImageUrl?: string;
  bannerVideoUrl?: string;
  bannerImageOpacity?: number;
  bannerImagePosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  paddingY?: 'compact' | 'normal' | 'relaxed';
  imageUrl?: string;
  imageAlt?: string;
  videoUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  // Hero editor enhancements (all optional; absent values keep legacy rendering)
  eyebrowText?: string;
  eyebrowColor?: string;
  titleLine2?: string;
  titleLine2Color?: string;
  titleGradient?: boolean;
  titleGradientFrom?: string;
  titleGradientTo?: string;
  titleGradientAngle?: number;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  heroVisual?: 'media' | 'orbital-spheres';
  orbitalStyle?: 'classic' | 'dual-ring' | 'nebula';
  orbitalPrimaryColor?: string;
  orbitalAccentColor?: string;
  orbitalSpeedSeconds?: number;
  items?: any[];
  isHidden?: boolean;
  animationId?: string;
  animationPreset?: string;
  glossyEffectId?: string;
  glossyMode?: 'none' | 'preset' | 'custom';
  glossyEffectPreset?: GlossyPreset;
  glossyEffectOverrides?: Partial<GlossyEffectConfig>;
}

export interface PageRecord {
  id: string;
  slug: string;
  title: string;
  metaDescription: string;
  isPublished: boolean;
  publishedAt?: string;
  sections: PageSection[];
  updatedAt: string;
}

export type ProductStage =
  | 'Under Development'
  | 'Ready for Deployment'
  | 'Commercial Launch'
  | 'Live';

export interface ProductRecord {
  id: string;
  name: string;
  slug: string;
  summary: string;
  description: string;
  heroImage: string;
  heroImageAlt: string;
  galleryImages: string[];
  features: string[];
  benefits: string[];
  useCases: string[];
  stage?: ProductStage;
  ctaLabel: string;
  ctaDestination: string;
  metaTitle: string;
  metaDescription: string;
  isPublished: boolean;
  displayOrder: number;
  updatedAt: string;
}

export interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  altText: string;
  uploadedAt: string;
  mediaType: 'image' | 'video';
}

export interface ContactEnquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  productInterest?: string;
  status: 'new' | 'in_progress' | 'resolved';
  createdAt: string;
}

export interface ChatbotLead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  businessType?: string;
  productInterest?: string;
  requirements: string;
  status: 'new' | 'in_progress' | 'resolved';
  createdAt: string;
}

export interface ChatbotFaq {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

export interface CmsAppearanceConfig {
  mode: 'dark' | 'light';
  sidebarBg: string; // e.g. '#171B2C' or '#FFFFFF'
  sidebarText: string; // e.g. '#94A3B8' or '#475569'
  sidebarActiveBg: string; // e.g. '#35123F'
  sidebarActiveText: string; // e.g. '#FFFFFF'
  accentColor: string; // e.g. '#D5A13C'
  topbarBg?: string; // e.g. '#131624' or '#FFFFFF'
  primaryBrand: string; // e.g. '#35123F'
  syncWithWebsiteTheme: boolean; // default false
  // White-label display name for the CMS portal (falls back to "<brand> CMS")
  cmsName?: string;
  // CMS sidebar logo (white-label branding)
  sidebarLogoUrl?: string; // URL of the configured sidebar logo (expanded mode)
  sidebarLogoAlt?: string; // alt text for sidebar logo
  sidebarLogoWidth?: number; // display width in pixels (expanded mode)
  sidebarLogoHeight?: number; // max display height in pixels (expanded mode)
  sidebarCompactLogoUrl?: string; // optional compact brand mark for collapsed sidebar
  sidebarCompactLogoAlt?: string; // alt text for compact sidebar logo
}

export interface SiteSettings {
  header: HeaderConfig;
  footer: FooterConfig;
  theme: ThemeColors;
  typography: TypographyConfig;
  animation: AnimationConfig;
  faqs: ChatbotFaq[];
  productGrid?: ProductGridConfig;
  chatbot?: ChatbotConfig;
  cmsAppearance?: CmsAppearanceConfig;
  version: number;
  updatedAt: string;
}
