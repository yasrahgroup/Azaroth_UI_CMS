import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Layers,
  Server,
  Sparkles,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Clock,
  HelpCircle,
  Briefcase,
} from 'lucide-react';
import type { PageSection, ProductRecord } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { ProductDetailModal } from './ProductDetailModal';
import { ProductStageBadge } from './ProductStageBadge';
import { OrbitalVisual } from './OrbitalVisual';
import { sanitizeClientHtml } from '../../utils/sanitize';
import { isOverlaySection } from '../../utils/headerOverlay';
import { createGlossyEffect } from '../../utils/glossyEffects';
import { getAnimationClass } from '../../utils/animationEffects';

interface SectionRendererProps {
  section: PageSection;
  products?: ProductRecord[];
}

const isVideoUrl = (url?: string) => Boolean(url && /\.(mp4|webm|mov)(?:$|[?#])/i.test(url));

/**
 * Section Container Helper:
 * Handles:
 * Mode 1: Surface only (solid color, theme surface, custom gradient, or presets)
 * Mode 2: Banner Image background (with positioning, opacity, and optional tint)
 * Mode 3: Banner Image with Gradient Overlay (with angle, colors, and opacity)
 * Animation Engine: Dynamic scroll / entrance animation execution via Animation Studio configurations
 */
const SectionContainer: React.FC<{
  section: PageSection;
  children: React.ReactNode;
  id?: string;
  defaultPadding?: string;
  className?: string;
  overlayHeader?: boolean;
}> = ({ section, children, id, defaultPadding = 'py-20', className = '', overlayHeader = false }) => {
  const { activeSettings, isPublicDarkActive } = useTheme();
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  const isPublicDark = isPublicDarkActive;

  const mode =
    section.bgMode || (section.bannerImageUrl || section.bannerVideoUrl ? 'image' : 'surface');
  const legacyBannerMedia =
    section.bannerImageUrl || (section.type !== 'hero' ? section.imageUrl : undefined);
  const bannerVideo =
    section.bannerVideoUrl || (isVideoUrl(legacyBannerMedia) ? legacyBannerMedia : undefined);
  const bannerImage = isVideoUrl(legacyBannerMedia) ? undefined : legacyBannerMedia;

  // 1. Resolve active animation from Studio configurations & Presets
  const studioAnimations = activeSettings?.animation?.animations || [];
  const animationsEnabled = activeSettings?.animation?.animationsEnabled !== false;
  const assignedAnim = section.animationId
    ? studioAnimations.find((a) => a.id === section.animationId && a.enabled)
    : undefined;

  const targetedAnim = !assignedAnim
    ? studioAnimations.find(
        (a) => a.enabled && a.targetScope === 'section' && a.targetSectionId === section.id
      )
    : undefined;

  // Global/ambient animations (targetScope: 'global') are page-level decoration,
  // not per-section entrance presets. They must never be folded into a section's
  // activePreset, otherwise every section inherits a continuous rotation/spin class
  // (e.g. anim-orbit-spin ... infinite) and the whole page content rotates forever.
  const activeAnim = animationsEnabled ? assignedAnim || targetedAnim : undefined;
  const activePreset = animationsEnabled ? section.animationPreset || (activeAnim ? activeAnim.type : null) : null;
  const triggerType = activeAnim?.trigger || (activePreset ? 'scroll' : 'entrance');
  const savedGlossyEffect = section.glossyEffectId
    ? activeSettings?.animation?.glossyEffects?.find((effect) => effect.id === section.glossyEffectId && effect.enabled)
    : undefined;
  const inlineGlossyEffect = section.glossyMode !== 'preset' && (section.glossyEffectPreset || section.glossyMode === 'custom')
    ? createGlossyEffect(section.glossyEffectPreset || 'glass-surface', `section-${section.id}`)
    : undefined;
  const baseGlossyEffect = savedGlossyEffect || inlineGlossyEffect;
  const glossyEffect = section.glossyMode === 'none'
    || activeSettings?.animation?.glossyEffectsEnabled === false
    ? undefined
    : baseGlossyEffect
      ? { ...baseGlossyEffect, ...(section.glossyMode === 'custom' ? section.glossyEffectOverrides : {}) }
      : undefined;

  // 2. IntersectionObserver for scroll-triggered animation execution
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const needsScrollReveal = (Boolean(activePreset) && triggerType === 'scroll') || glossyEffect?.trigger === 'scroll';
    if (prefersReducedMotion || !needsScrollReveal) {
      setIsInView(true);
      return;
    }

    const elem = containerRef.current;
    if (!elem) {
      setIsInView(true);
      return;
    }

    const threshold = (activeAnim?.scrollThreshold ?? 15) / 100;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: Math.max(0.05, Math.min(threshold, 0.75)) }
    );

    observer.observe(elem);
    return () => {
      observer.disconnect();
    };
  }, [triggerType, activeAnim?.scrollThreshold, activePreset, glossyEffect?.trigger]);

  // Determine dynamic animation classes & inline timing overrides
  let animClass = '';
  let animInlineStyle: React.CSSProperties = {};

  if (activePreset) {
    if (triggerType === 'scroll' && !isInView) {
      animClass += ' opacity-0 translate-y-4';
    } else {
      animClass += ` ${getAnimationClass(activePreset)}`;

      if (activeAnim) {
        animInlineStyle = {
          animationDuration: `${activeAnim.durationMs || activeAnim.duration || 600}ms`,
          animationDelay: `${activeAnim.delay || 0}ms`,
          animationTimingFunction: activeAnim.easing || 'cubic-bezier(0.16, 1, 0.3, 1)',
        };
      }
    }
  }

  // Padding helper
  let paddingClass = defaultPadding;
  if (section.paddingY === 'compact') paddingClass = 'py-10 md:py-14';
  if (section.paddingY === 'relaxed') paddingClass = 'py-24 md:py-32';
  if (overlayHeader) {
    paddingClass =
      section.paddingY === 'compact'
        ? 'pt-28 pb-10 md:pt-32 md:pb-14'
        : section.paddingY === 'relaxed'
          ? 'pt-28 pb-24 md:pt-32 md:pb-32'
          : 'pt-28 pb-16 md:pt-32 md:pb-24';
  }

  // Base preset background class
  let presetBgClass = isPublicDark ? 'bg-[var(--color-bg)]' : 'bg-[#FAF7F2]';
  if (section.bgTreatment === 'surface') {
    presetBgClass = isPublicDark
      ? 'bg-[var(--color-surface)] border-y border-[var(--color-border)]'
      : 'bg-white border-y border-slate-200/60';
  } else if (section.bgTreatment === 'burgundy-subtle') {
    presetBgClass = isPublicDark
      ? 'bg-[#35123F]/10 border-y border-[#35123F]/20'
      : 'bg-[#35123F]/5 border-y border-[#35123F]/15';
  } else if (section.bgTreatment === 'gold-subtle') {
    presetBgClass = isPublicDark
      ? 'bg-[#D5A13C]/15 border-y border-[#D5A13C]/25'
      : 'bg-[#D5A13C]/10 border-y border-[#D5A13C]/20';
  } else if (section.bgTreatment === 'gradient') {
    presetBgClass = isPublicDark
      ? 'bg-gradient-to-br from-[var(--color-bg)] via-[var(--color-surface)] to-[var(--color-bg)] border-y border-[var(--color-border)]'
      : 'bg-gradient-to-br from-[#FAF7F2] via-[#FFFFFF] to-[#FAF7F2] border-y border-slate-200/60';
  }

  // Surface inline styles
  let surfaceStyle: React.CSSProperties = {};
  if (mode === 'surface') {
    if (section.bgSurfaceColor) {
      surfaceStyle = { backgroundColor: section.bgSurfaceColor };
    } else if (section.bgGradientFrom && section.bgGradientTo) {
      surfaceStyle = {
        background: `linear-gradient(${section.bgGradientAngle ?? 135}deg, ${section.bgGradientFrom}, ${section.bgGradientTo})`,
      };
    }
  }

  // Opacity conversion helpers
  const getNormOpacity = (val?: number, fallback = 1) => {
    if (val === undefined || val === null) return fallback;
    return val > 1 ? val / 100 : val;
  };

  const isMediaMode = (mode === 'image' || mode === 'image-gradient') && (bannerImage || bannerVideo);
  const glossyStyle: React.CSSProperties | undefined = glossyEffect ? {
    '--gloss-base': glossyEffect.baseColor,
    '--gloss-highlight': glossyEffect.highlightColor,
    '--gloss-gradient-start': glossyEffect.gradientStart,
    '--gloss-gradient-end': glossyEffect.gradientEnd,
    '--gloss-border': glossyEffect.borderColor,
    '--gloss-border-alpha': glossyEffect.borderOpacity / 100,
    '--gloss-opacity': glossyEffect.opacity / 100,
    '--gloss-transparency': glossyEffect.transparency / 100,
    '--gloss-intensity': glossyEffect.intensity / 100,
    '--gloss-highlight-alpha': glossyEffect.highlightOpacity / 100,
    '--gloss-blur': `${glossyEffect.blur}px`,
    '--gloss-shadow-alpha': glossyEffect.shadow / 100,
    '--gloss-glow': glossyEffect.glowColor,
    '--gloss-glow-spread': `${glossyEffect.glowSpread}px`,
    '--gloss-radius': `${glossyEffect.borderRadius}px`,
    '--gloss-border-width': `${glossyEffect.borderWidth}px`,
    '--gloss-reflection-size': `${glossyEffect.reflectionSize}%`,
    '--gloss-shine-duration': `${glossyEffect.shineDurationMs}ms`,
    '--gloss-shine-delay': `${glossyEffect.shineDelayMs}ms`,
    '--gloss-shine-angle': glossyEffect.shineDirection === 'top-bottom' ? '180deg' : glossyEffect.shineDirection === 'right-left' ? '250deg' : glossyEffect.shineDirection === 'left-right' ? '110deg' : '135deg',
    '--gloss-hover-scale': glossyEffect.hoverScale,
    '--gloss-hover-lift': `${glossyEffect.hoverElevation}px`,
    '--gloss-hover-intensity': glossyEffect.hoverIntensity / 100,
  } as React.CSSProperties : undefined;

  return (
    <section
      ref={containerRef}
      id={id || section.id}
      data-section-id={section.id}
      data-background-mode={mode}
      data-animation={activeAnim?.id || activePreset || 'none'}
      data-gloss-effect={glossyEffect?.preset}
      data-gloss-target={glossyEffect?.target}
      data-gloss-trigger={glossyEffect?.trigger}
      data-gloss-shine-direction={glossyEffect?.shineDirection}
      data-gloss-shine-repeat={glossyEffect?.shineRepeat}
      data-gloss-visible={isInView}
      data-gloss-pointer-highlight={glossyEffect?.pointerHighlight}
      onPointerMove={(event) => {
        if (!glossyEffect?.pointerHighlight || event.pointerType !== 'mouse') return;
        const bounds = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty('--gloss-pointer-x', `${event.clientX - bounds.left}px`);
        event.currentTarget.style.setProperty('--gloss-pointer-y', `${event.clientY - bounds.top}px`);
      }}
      style={{ ...surfaceStyle, ...animInlineStyle, ...glossyStyle }}
      className={`relative overflow-hidden ${glossyEffect ? 'gloss-effect' : ''} ${glossyEffect?.shineEnabled ? 'gloss-effect-shine' : ''} ${!surfaceStyle.backgroundColor && !surfaceStyle.background ? presetBgClass : ''} ${paddingClass} ${animClass} ${className}`}
    >
      {/* Mode 2 & Mode 3: Background Media Layer */}
      {isMediaMode &&
        (bannerVideo ? (
          <video
            src={bannerVideo}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 z-0 h-full w-full object-cover pointer-events-none"
            style={{
              objectPosition: section.bannerImagePosition || section.bgImagePosition || 'center',
              opacity: getNormOpacity(section.bannerImageOpacity ?? section.bgImageOpacity, 1),
            }}
          />
        ) : (
          <div
            className="absolute inset-0 z-0 bg-cover bg-no-repeat pointer-events-none"
            style={{
              backgroundImage: `url(${bannerImage})`,
              backgroundPosition: section.bannerImagePosition || section.bgImagePosition || 'center',
              opacity: getNormOpacity(section.bannerImageOpacity ?? section.bgImageOpacity, 1),
            }}
          />
        ))}

      {/* Mode 3: Image with Gradient Overlay */}
      {isMediaMode && mode === 'image-gradient' && (
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: `linear-gradient(${section.bgGradientAngle ?? 135}deg, ${section.bgGradientFrom || '#171B2C'}, ${section.bgGradientTo || '#35123F'})`,
            opacity: getNormOpacity(section.bgOverlayOpacity, 0.75),
          }}
        />
      )}

      {/* Mode 2: Optional Solid Tint Overlay */}
      {isMediaMode && mode === 'image' && section.bgOverlayOpacity && section.bgOverlayOpacity > 0 && (
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundColor: section.bgOverlayColor || '#000000',
            opacity: getNormOpacity(section.bgOverlayOpacity, 0.4),
          }}
        />
      )}

      {/* Section Content */}
      <div className="relative z-10">{children}</div>
    </section>
  );
};

/**
 * Section Header Component:
 * Customizable Headline, Subtitle, Font size, weight, color, and alignment.
 */
interface SectionHeaderProps {
  section: PageSection;
  badge?: string;
  badgeColor?: string;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  section,
  badge,
  badgeColor = '#35123F',
  className = 'mb-12',
}) => {
  const { isPublicDarkActive } = useTheme();
  const isPublicDark = isPublicDarkActive;
  if (!section.title && !section.subtitle && !badge) return null;

  const alignClass =
    section.alignment === 'center'
      ? 'text-center mx-auto items-center'
      : section.alignment === 'right'
      ? 'text-right ml-auto items-end'
      : 'text-left items-start';

  const sizeClasses: Record<string, string> = {
    sm: 'text-xl sm:text-2xl',
    base: 'text-2xl sm:text-3xl',
    lg: 'text-3xl sm:text-4xl',
    xl: 'text-4xl sm:text-5xl',
    '2xl': 'text-4xl sm:text-5xl lg:text-6xl',
    '3xl': 'text-4xl sm:text-6xl',
    '4xl': 'text-4xl sm:text-6xl lg:text-7xl',
    '5xl': 'text-4xl sm:text-7xl lg:text-8xl',
  };

  const weightClasses: Record<string, string> = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold',
  };

  const titleSizeClass = section.titleSize ? sizeClasses[section.titleSize] || 'text-3xl sm:text-4xl' : 'text-3xl sm:text-4xl';
  const titleWeightClass = section.titleWeight ? weightClasses[section.titleWeight] || 'font-bold' : 'font-bold';

  // Contrast detection for dark backgrounds
  const isDarkBg =
    isPublicDark ||
    section.bgMode === 'image-gradient' ||
    (section.bgMode === 'image' && (section.bgOverlayOpacity ?? 0) > 30) ||
    (section.bgSurfaceColor &&
      ['#171b2c', '#000000', '#111827', '#0f172a', '#1e293b', '#35123F'].includes(section.bgSurfaceColor.toLowerCase()));

  const defaultTitleColor = isDarkBg ? 'var(--color-heading, #FFFFFF)' : '#171B2C';
  const defaultSubtitleColor = isDarkBg ? 'var(--color-body, #E2E8F0)' : '#334155';
  const defaultBadgeColor = isDarkBg ? '#D5A13C' : badgeColor;

  return (
    <div className={`max-w-2xl flex flex-col space-y-3 ${alignClass} ${className}`}>
      {badge && (
        <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: defaultBadgeColor }}>
          {badge}
        </span>
      )}
      {section.title && (
        <h2
          className={`${titleSizeClass} ${titleWeightClass} tracking-tight leading-tight`}
          style={{ color: section.titleColor || defaultTitleColor }}
        >
          {section.title}
        </h2>
      )}
      {section.subtitle && (
        <p className="text-sm md:text-base leading-relaxed" style={{ color: section.subtitleColor || defaultSubtitleColor }}>
          {section.subtitle}
        </p>
      )}
    </div>
  );
};

export const SectionRenderer: React.FC<SectionRendererProps> = ({ section, products = [] }) => {
  const { activeSettings, isPublicDarkActive } = useTheme();
  const isPublicDark = isPublicDarkActive;
  const [activeModalProduct, setActiveModalProduct] = useState<ProductRecord | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  if (section.isHidden) return null;

  switch (section.type) {
    case 'hero': {
      const overlayHeader =
        isOverlaySection(section) ||
        (section.type === 'hero' && Boolean(activeSettings?.header?.isTransparentOnHero));
      const isDarkBg =
        isPublicDark ||
        section.bgMode === 'image-gradient' ||
        (section.bgMode === 'image' && (section.bgOverlayOpacity ?? 0) > 30) ||
        (section.bgSurfaceColor &&
          ['#171b2c', '#000000', '#111827', '#0f172a', '#1e293b', '#35123F'].includes(
            section.bgSurfaceColor.toLowerCase()
          ));

      const defaultTitleColor = isDarkBg ? '#FFFFFF' : '#171B2C';
      const heroTitleStyle: React.CSSProperties = section.titleGradient
        ? {
            backgroundImage: `linear-gradient(${section.titleGradientAngle ?? 135}deg, ${
              section.titleGradientFrom || '#35123F'
            }, ${section.titleGradientTo || '#D5A13C'})`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            WebkitTextFillColor: 'transparent',
          }
        : { color: section.titleColor || defaultTitleColor };
      const secondLineColor =
        section.titleLine2Color || section.titleColor || defaultTitleColor;

      return (
        <SectionContainer
          section={section}
          defaultPadding="py-12 sm:py-16 md:py-24"
          overlayHeader={overlayHeader}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Text column */}
              <div
                className={`lg:col-span-7 space-y-6 ${
                  section.alignment === 'center'
                    ? 'text-center mx-auto max-w-3xl items-center flex flex-col'
                    : section.alignment === 'right'
                    ? 'text-right ml-auto items-end flex flex-col'
                    : 'text-left'
                }`}
              >
                <div
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: section.eyebrowColor || (isDarkBg ? '#D5A13C' : '#35123F') }}
                >
                  {section.eyebrowText ? (
                    <span>{section.eyebrowText}</span>
                  ) : (
                    <>
                      <span>{activeSettings?.header?.brandName || 'Enterprise'} Architecture</span>
                      <span aria-hidden="true">·</span>
                      <span>Mission-Critical Systems</span>
                    </>
                  )}
                </div>

                <h1
                  className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] max-w-2xl"
                  style={heroTitleStyle}
                >
                  {section.titleLine2 ? (
                    <>
                      <span className="block">{section.title}</span>
                      <span
                        className="block"
                        style={
                          section.titleGradient ? undefined : { color: secondLineColor }
                        }
                      >
                        {section.titleLine2}
                      </span>
                    </>
                  ) : (
                    section.title
                  )}
                </h1>

                {section.subtitle && (
                  <p
                    className="text-lg md:text-xl leading-relaxed max-w-xl font-normal"
                    style={{ color: section.subtitleColor || (isDarkBg ? '#E2E8F0' : '#334155') }}
                  >
                    {section.subtitle}
                  </p>
                )}

                {section.content && (
                  <p
                    className="text-sm md:text-base leading-relaxed max-w-lg"
                    style={{ color: isDarkBg ? '#CBD5E1' : '#64748B' }}
                  >
                    {section.content}
                  </p>
                )}

                <div className="pt-2 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
                  {section.ctaText && (
                    <a
                      href={section.ctaUrl || '#products'}
                      className="w-full sm:w-auto px-6 py-3.5 bg-[#35123F] text-white text-xs font-bold uppercase tracking-wider rounded transition-all duration-200 flex items-center justify-center gap-2 hover:bg-[#24102D] shadow-sm hover:shadow"
                    >
                      <span>{section.ctaText}</span>
                      <ArrowRight className="w-4 h-4 text-[#D5A13C]" />
                    </a>
                  )}
                  <a
                    href={section.secondaryCtaText ? section.secondaryCtaUrl || '#contact' : '#contact'}
                    className={`w-full sm:w-auto px-6 py-3.5 bg-transparent border text-xs font-semibold uppercase tracking-wider rounded transition-colors text-center ${
                      isDarkBg
                        ? 'border-white/30 hover:border-white text-white'
                        : 'border-slate-300 hover:border-[#171B2C] text-[#171B2C]'
                    }`}
                  >
                    {section.secondaryCtaText || 'Technical Inquiries'}
                  </a>
                </div>
              </div>

              {/* Hero Visual column: media or configurable 3D orbital spheres */}
              <div className="lg:col-span-5">
                {section.heroVisual === 'orbital-spheres' ? (
                  <OrbitalVisual
                    stylePreset={section.orbitalStyle}
                    primaryColor={section.orbitalPrimaryColor}
                    accentColor={section.orbitalAccentColor}
                    speedSeconds={section.orbitalSpeedSeconds}
                  />
                ) : (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-lg bg-slate-900 group">
                  {section.videoUrl || isVideoUrl(section.imageUrl) ? (
                    <video
                      src={section.videoUrl || section.imageUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-[260px] sm:h-[380px] lg:h-[460px] object-cover transition-transform duration-500 group-hover:scale-102"
                    />
                  ) : section.imageUrl ? (
                    <img
                      src={section.imageUrl}
                      alt={section.imageAlt || section.title}
                      className="w-full h-[260px] sm:h-[380px] lg:h-[460px] object-cover transition-transform duration-500 group-hover:scale-102"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-[260px] sm:h-[380px] lg:h-[460px] bg-gradient-to-br from-[#171B2C] to-[#35123F] flex items-center justify-center p-8 text-center text-white">
                      <div>
                        <Server className="w-12 h-12 text-[#D5A13C] mx-auto mb-4" />
                        <h3 className="text-lg font-bold">{activeSettings?.header?.brandName || 'Enterprise'} Core Architecture</h3>
                        <p className="text-xs text-slate-300 mt-2">Enterprise-grade cloud infrastructure</p>
                      </div>
                    </div>
                  )}
                </div>
                )}
              </div>
            </div>
          </div>
        </SectionContainer>
      );
    }

    case 'statistics':
      return (
        <SectionContainer section={section} defaultPadding="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeader section={section} className="mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-8">
              {(section.items || []).map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#35123F] font-mono tabular-nums tracking-tight">
                    {item.value}
                  </div>
                  <div className="text-sm font-semibold text-[#171B2C]">{item.label}</div>
                  {item.detail && <div className="text-xs text-[#64748B]">{item.detail}</div>}
                </div>
              ))}
            </div>
          </div>
        </SectionContainer>
      );

    case 'product_showcase': {
      const gridCols = activeSettings?.productGrid?.columns ?? 2;
      const showcaseGridClass =
        gridCols === 1
          ? 'grid grid-cols-1 gap-8 max-w-4xl mx-auto'
          : gridCols === 3
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8'
          : gridCols === 4
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6'
          : 'grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8';

      return (
        <SectionContainer section={section} id="products" defaultPadding="py-14 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
              <SectionHeader
                section={section}
                badge="Integrated Enterprise Software"
                className="mb-0"
              />

              <Link
                to="/product"
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#35123F] hover:text-[#24102D] hover:underline shrink-0"
              >
                <span>View All {activeSettings?.header?.brandName || 'Enterprise'} Platforms</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className={showcaseGridClass}>
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative aspect-16/9 overflow-hidden bg-slate-900">
                      {prod.heroImage ? (
                        <img
                          src={prod.heroImage}
                          alt={prod.heroImageAlt || prod.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#171B2C] flex items-center justify-center text-white">
                          <Layers className="w-10 h-10 text-[#D5A13C]" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <ProductStageBadge stage={prod.stage} />
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 md:p-7 space-y-4">
                      <div className="space-y-1">
                        {/* Title without unwanted raw route string */}
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="text-xl font-bold text-[#171B2C] group-hover:text-[#35123F] transition-colors">
                            {prod.name}
                          </h3>
                        </div>
                        <p className="text-xs sm:text-sm text-[#334155] leading-relaxed line-clamp-3">
                          {prod.summary}
                        </p>
                      </div>

                      {/* Top 3 Features list */}
                      <div className="pt-2 space-y-1.5">
                        {prod.features.slice(0, 3).map((feat, fidx) => (
                          <div key={fidx} className="flex items-start gap-2 text-xs text-[#64748B]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#D5A13C] shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 md:p-7 pt-0 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 mt-4">
                    <Link
                      to="/product"
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#35123F] hover:bg-[#24102D] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-2xs hover:shadow cursor-pointer"
                    >
                      <span>Learn More</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#D5A13C]" />
                    </Link>

                    <a
                      href="#contact"
                      className="flex-1 sm:flex-none text-center px-3.5 py-2 bg-[#FAF7F2] hover:bg-slate-100 text-[#171B2C] text-xs font-semibold uppercase tracking-wider rounded-lg border border-slate-200 transition-colors"
                    >
                      Demo
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Same-page detail modal for Home page */}
          <ProductDetailModal
            product={activeModalProduct}
            isOpen={!!activeModalProduct}
            onClose={() => setActiveModalProduct(null)}
          />
        </SectionContainer>
      );
    }

    case 'feature_grid':
      return (
        <SectionContainer section={section} id="capabilities" defaultPadding="py-14 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeader section={section} badge={`${activeSettings?.header?.brandName || 'Enterprise'} Software`} className="mb-0" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
              {(section.items || []).map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-[#35123F]/40 transition-colors space-y-3"
                >
                  <h3 className="text-lg font-bold text-[#171B2C]">{item.title}</h3>
                  <p className="text-sm text-[#334155] leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
            <div className="pt-4">
              <a
                href={section.ctaUrl || '#contact'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#35123F] text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-[#24102D] transition-colors shadow-sm"
              >
                {section.ctaText || `Initiate ${activeSettings?.header?.brandName || 'Technical'} Advisory`}
                <ArrowRight className="w-4 h-4 text-[#D5A13C]" />
              </a>
            </div>
          </div>
        </SectionContainer>
      );

    case 'testimonials':
      return (
        <SectionContainer section={section} defaultPadding="py-14 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeader section={section} badge="Client Success Stories" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {(section.items || []).map((t, idx) => (
                <div
                  key={idx}
                  className="p-5 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-6 flex flex-col justify-between"
                >
                  <blockquote className="text-sm md:text-base text-[#334155] italic leading-relaxed">
                    "{t.quote}"
                  </blockquote>
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-xs">
                    <div className="min-w-0">
                      <div className="font-bold text-[#171B2C]">{t.author}</div>
                      <div className="text-[#64748B]">{t.role}</div>
                    </div>
                    <div className="font-semibold text-[#35123F] sm:text-right break-words">{t.organization}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionContainer>
      );

    case 'cta':
      return (
        <SectionContainer section={section} defaultPadding="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="bg-[#171B2C] text-[#FAF7F2] rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-14 border border-[#D5A13C]/30 relative overflow-hidden">
              <div className="relative z-10 max-w-2xl space-y-4">
                <span className="text-xs font-semibold tracking-wider uppercase text-[#D5A13C]">
                  {activeSettings?.header?.brandName || 'Enterprise'} Deployment
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                  {section.title}
                </h2>
                {section.subtitle && (
                  <p className="text-sm md:text-base text-slate-300 leading-relaxed">
                    {section.subtitle}
                  </p>
                )}
                <div className="pt-4">
                  <a
                    href={section.ctaUrl || '#contact'}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#35123F] text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-[#24102D] transition-colors shadow-sm"
                  >
                    <span>{section.ctaText || `Initiate ${activeSettings?.header?.brandName || 'Technical'} Advisory`}</span>
                    <ArrowRight className="w-4 h-4 text-[#D5A13C]" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </SectionContainer>
      );

    case 'rich_text':
      return (
        <SectionContainer section={section} defaultPadding="py-12 sm:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <SectionHeader section={section} className="mb-6" />
            <div
              className="text-sm text-[#334155] leading-relaxed space-y-4 prose prose-slate"
              dangerouslySetInnerHTML={{ __html: sanitizeClientHtml(section.content || '') }}
            />
          </div>
        </SectionContainer>
      );

    case 'image_text':
      return (
        <SectionContainer section={section} defaultPadding="py-12 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <SectionHeader section={section} className="mb-0" />
                {section.content && (
                  <div
                    className="text-sm text-[#334155] leading-relaxed space-y-3"
                    dangerouslySetInnerHTML={{ __html: sanitizeClientHtml(section.content) }}
                  />
                )}
                {section.ctaText && (
                  <div>
                    <a
                      href={section.ctaUrl || '#'}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#35123F] text-white text-xs font-bold uppercase tracking-wider rounded shadow-xs hover:bg-[#24102D] transition-colors"
                    >
                      <span>{section.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#D5A13C]" />
                    </a>
                  </div>
                )}
              </div>
              <div className="lg:col-span-6">
                {section.imageUrl ? (
                  <img
                    src={section.imageUrl}
                    alt={section.imageAlt || section.title}
                    className="rounded-2xl shadow-md border border-slate-200 w-full object-cover max-h-[320px] sm:max-h-[420px]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-72 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-200">
                    No image provided
                  </div>
                )}
              </div>
            </div>
          </div>
        </SectionContainer>
      );

    case 'faq':
      return (
        <SectionContainer section={section} defaultPadding="py-14 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <SectionHeader section={section} badge="Frequently Asked Questions" />
            <div className="space-y-3">
              {(section.items || []).map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs"
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full p-4 sm:p-5 text-left font-semibold text-sm text-[#171B2C] flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span className="min-w-0 break-words">{faq.question || faq.title}</span>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${
                          isOpen ? 'rotate-180 text-[#35123F]' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-[#334155] leading-relaxed border-t border-slate-100">
                        {faq.answer || faq.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </SectionContainer>
      );

    case 'services':
      return (
        <SectionContainer section={section} defaultPadding="py-14 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeader section={section} badge="Professional Services" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              {(section.items || []).map((srv, idx) => (
                <div
                  key={idx}
                  className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-[#35123F]/40 transition-colors space-y-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#35123F]/10 flex items-center justify-center text-[#35123F]">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#171B2C]">{srv.title}</h3>
                  <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
                    {srv.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </SectionContainer>
      );

    case 'contact_info':
      return (
        <SectionContainer section={section} defaultPadding="py-14 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeader section={section} badge="Contact Information" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
                <div className="p-3 bg-[#35123F]/10 text-[#35123F] rounded-xl shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Electronic Mail
                  </h4>
                  <p className="text-sm font-semibold text-[#171B2C] mt-1 break-words">
                    {activeSettings?.footer?.contactEmail || 'contact@example.com'}
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
                <div className="p-3 bg-[#35123F]/10 text-[#35123F] rounded-xl shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Direct Line
                  </h4>
                  <p className="text-sm font-semibold text-[#171B2C] mt-1">
                    {activeSettings?.footer?.contactPhone || '+1 (800) 555-1234'}
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
                <div className="p-3 bg-[#35123F]/10 text-[#35123F] rounded-xl shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Global HQ
                  </h4>
                  <p className="text-sm font-semibold text-[#171B2C] mt-1 break-words">
                    {activeSettings?.footer?.address || 'Your Company Address'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SectionContainer>
      );

    default:
      return (
        <SectionContainer section={section} defaultPadding="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 mx-auto flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {section.title || `Custom Section (${(section as any).type})`}
              </h3>
              {section.subtitle && (
                <p className="text-xs text-slate-500">{section.subtitle}</p>
              )}
              {section.content && (
                <div
                  className="text-xs text-slate-600 mt-2"
                  dangerouslySetInnerHTML={{ __html: sanitizeClientHtml(section.content) }}
                />
              )}
            </div>
          </div>
        </SectionContainer>
      );
  }
};
