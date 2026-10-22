import type { HeaderConfig, PageSection } from '../types/index.js';
import { transparencyToAlpha, withAlpha } from './color.js';

export type NavbarBackgroundMode = 'surface' | 'banner' | 'overlay';

export interface NavbarOverlayInput {
  sections: PageSection[] | null | undefined;
  header: HeaderConfig | null | undefined;
  isScrolled: boolean;
  isEditor?: boolean;
  previewDraft?: boolean;
}

export interface NavbarAppearance {
  active: boolean;
  mode: NavbarBackgroundMode;
  layout: HeaderConfig['layoutPreset'];
  transparency: number;
  alpha: number;
  backgroundColor: string;
  backgroundCss: string;
  isSticky: boolean;
  positioning: 'fixed' | 'absolute' | 'sticky' | 'relative';
}

export function sectionBackgroundMode(section: PageSection | null | undefined): NavbarBackgroundMode {
  if (!section) return 'surface';
  if (section.bgMode === 'image-gradient') return 'overlay';
  if (section.bgMode === 'image') return 'banner';
  if (!section.bgMode && (section.bannerImageUrl || section.bannerVideoUrl)) return 'banner';
  return 'surface';
}

export function isOverlaySection(section: PageSection | null | undefined): boolean {
  return (
    Boolean(section) &&
    section!.type === 'hero' &&
    section!.bgMode === 'image-gradient' &&
    Boolean(section!.bannerImageUrl || section!.bannerVideoUrl)
  );
}

export function firstVisibleSection(sections: PageSection[] | null | undefined): PageSection | null {
  return sections?.find((section) => !section.isHidden) ?? null;
}

export function overlayHeaderForPage(sections: PageSection[] | null | undefined): boolean {
  return isOverlaySection(firstVisibleSection(sections));
}

export function resolveNavbarTransparency(
  header: HeaderConfig | null | undefined,
  isScrolled: boolean
): number {
  const base = header?.overlayTransparency ?? 0;
  if (!isScrolled) return clampPercent(base);
  const scrolled = header?.navbarTransparencyOnScroll;
  return clampPercent(scrolled === undefined || scrolled === null ? base : scrolled);
}

export function resolveNavbarAppearance(input: NavbarOverlayInput): NavbarAppearance {
  const first = firstVisibleSection(input.sections);
  const active = isOverlaySection(first);
  const mode = sectionBackgroundMode(first);
  const header = input.header;
  const transparency = active ? resolveNavbarTransparency(header, input.isScrolled) : 0;
  const alpha = transparencyToAlpha(transparency);
  const backgroundColor =
    header?.overlayBackgroundColor || header?.backgroundColor || '#171B2C';
  const isSticky = header?.isSticky ?? true;

  return {
    active,
    mode,
    layout: header?.layoutPreset || 'logo-left-nav-right',
    transparency,
    alpha,
    backgroundColor,
    backgroundCss: active ? withAlpha(backgroundColor, alpha) : 'transparent',
    isSticky,
    positioning: active
      ? isSticky
        ? 'fixed'
        : 'absolute'
      : isSticky
        ? 'sticky'
        : 'relative',
  };
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}
