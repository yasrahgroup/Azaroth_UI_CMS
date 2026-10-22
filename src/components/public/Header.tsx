import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight, Eye, Shield, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { withAlpha } from '../../utils/color';
import { BrandLogo } from '../shared/BrandLogo';
import { resolveNavbarAppearance, resolveNavbarTransparency } from '../../utils/headerOverlay';
import type { PageSection } from '../../types';

export const Header: React.FC<{ overlay?: boolean; sections?: PageSection[] }> = ({
  overlay = false,
  sections,
}) => {
  const {
    activeSettings,
    previewDraft,
    setPreviewDraft,
    isPublicDarkModeEnabled,
    isPublicDarkActive,
    publicMode,
    togglePublicMode,
  } = useTheme();
  const { isAdmin, isEditor, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const noticeRef = useRef<HTMLElement | null>(null);
  const [noticeHeight, setNoticeHeight] = useState(0);
  const location = useLocation();

  const cfg = activeSettings?.header;
  const isSticky = cfg?.isSticky ?? true;
  const isTransparent = cfg?.isTransparentOnHero ?? false;
  const appearance = resolveNavbarAppearance({
    sections,
    header: cfg,
    isScrolled,
    isEditor,
    previewDraft,
  });
  // The configured "transparent over hero" treatment is a global header
  // behaviour: when enabled in Branding & Header it must apply to every
  // public page, not just the homepage. Pages whose first section is not an
  // image-gradient hero (including CMS-added pages) therefore fall back to
  // the same overlay navbar styling.
  const globalOverlayEnabled = cfg?.isTransparentOnHero ?? false;
  const overlayActive = sections ? appearance.active || globalOverlayEnabled : overlay || globalOverlayEnabled;
  const overlayTransparency =
    sections && appearance.active
      ? appearance.transparency
      : resolveNavbarTransparency(cfg, isScrolled);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isEditor) {
      setNoticeHeight(0);
      return;
    }
    const el = noticeRef.current;
    if (!el) return;

    const measure = () => setNoticeHeight(el.getBoundingClientRect().height);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [isEditor]);

  const brandName = cfg?.brandName ?? 'Azaroth';
  const brandSubName = cfg?.brandSubName ?? 'Tech-Hive';
  const isPublicDark = isPublicDarkActive;
  const brandNameColor = cfg?.brandNameColor || '#35123F';
  const brandSubNameColor = cfg?.brandSubNameColor || '#D5A13C';
  const headerTextColor = cfg?.textColor || '#35123F';
  const overlayBackgroundColor = cfg?.overlayBackgroundColor || '#171B2C';
  const overlayGradientColor = sections ? appearance.backgroundColor : overlayBackgroundColor;
  const overlayAlpha = (100 - overlayTransparency) / 100;
  const overlayBackgroundCss =
    sections && appearance.active
      ? appearance.backgroundCss
      : withAlpha(overlayBackgroundColor, overlayAlpha);
  const headerTop = overlayActive && isEditor && !isScrolled ? noticeHeight : 0;
  const navLinks = (cfg?.links || []).slice().sort((a, b) => a.order - b.order);
  const layoutPreset = cfg?.layoutPreset || 'logo-left-nav-right';

  const midPoint = Math.ceil(navLinks.length / 2);
  const leftLinks = navLinks.slice(0, midPoint);
  const rightLinks = navLinks.slice(midPoint);

  let headerBgClass: string;
  if (overlayActive) {
    headerBgClass = '';
  } else if (isTransparent && !isScrolled) {
    headerBgClass = 'bg-transparent border-b border-transparent';
  } else if (isPublicDark) {
    headerBgClass = 'bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-800';
  } else if (cfg?.backgroundColor && !isPublicDark) {
    headerBgClass = 'border-b border-[#E2E8F0]/70';
  } else {
    headerBgClass = 'bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E2E8F0]/70';
  }

  const renderNavLink = (link: { id: string; label: string; url: string; isExternal?: boolean }) => {
    const isAnchor = link.url.startsWith('#') || link.url.includes('/#');
    const linkColorStyle = { color: headerTextColor };
    if (link.isExternal) {
      return (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          style={linkColorStyle}
          className="min-w-0 break-words [overflow-wrap:anywhere] hover:opacity-75 transition-opacity hover:underline underline-offset-4"
        >
          {link.label}
        </a>
      );
    }
    if (isAnchor) {
      return (
        <a
          key={link.id}
          href={link.url}
          style={linkColorStyle}
          className="min-w-0 break-words [overflow-wrap:anywhere] hover:opacity-75 transition-opacity hover:underline underline-offset-4"
        >
          {link.label}
        </a>
      );
    }
    return (
      <Link
        key={link.id}
        to={link.url}
        style={linkColorStyle}
        className={`min-w-0 break-words [overflow-wrap:anywhere] transition-colors hover:underline underline-offset-4 ${
          location.pathname === link.url ? 'font-bold' : ''
        }`}
      >
        {link.label}
      </Link>
    );
  };

  const BrandBlock = (
    <BrandLogo
      logoUrl={cfg?.logoUrl}
      logoAlt={cfg?.logoAlt || brandName || 'Header Logo'}
      brandName={brandName}
      brandSubName={brandSubName}
      logoWidth={cfg?.logoWidth}
      logoHeight={cfg?.logoHeight}
      logoSpacing={cfg?.logoSpacing}
      brandLayout={cfg?.brandLayout}
      brandNameFontSize={cfg?.brandNameFontSize}
      brandSubNameFontSize={cfg?.brandSubNameFontSize}
      brandNameColor={brandNameColor}
      brandSubNameColor={brandSubNameColor}
      size="sm"
      testId="navbar-brand"
    />
  );

  const ActionButtonsBlock = (
    <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
      {/* Public Visitor Dark Mode Toggle (Rendered ONLY when client enabled dark mode in CMS) */}
      {isPublicDarkModeEnabled && (
        <button
          onClick={togglePublicMode}
          className={`p-2 rounded-lg border shadow-2xs transition-all cursor-pointer flex items-center justify-center ${
            isPublicDark
              ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200'
              : 'border-slate-300 hover:border-slate-400 bg-white/80 hover:bg-white text-slate-700'
          }`}
          title={isPublicDarkActive ? 'Switch website to Light Mode' : 'Switch website to Dark Mode'}
          aria-label={isPublicDarkActive ? 'Switch website to Light Mode' : 'Switch website to Dark Mode'}
        >
          {isPublicDarkActive ? (
            <Sun className="w-4 h-4 text-amber-500 animate-in spin-in-180 duration-200" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 animate-in spin-in-180 duration-200" />
          )}
        </button>
      )}

      {isAdmin && (
        <Link
          to="/admin"
          className={`px-3.5 py-2 text-xs font-semibold rounded transition-all duration-200 flex items-center gap-1.5 shadow-2xs ${
            isPublicDark
              ? 'text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-[#D5A13C]/50'
              : 'text-slate-700 hover:text-[#35123F] bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#35123F]/40'
          }`}
          title="Open CMS Admin Portal"
        >
          <Shield className="w-3.5 h-3.5 text-[#D5A13C]" />
          <span>CMS Admin</span>
        </Link>
      )}

      {cfg?.ctaText && (
        <a
          href={cfg.ctaUrl || '/contact'}
          className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap shadow-sm hover:shadow active:scale-98"
          style={{
            backgroundColor:
              cfg.ctaStyle === 'gold'
                ? '#D5A13C'
                : cfg.ctaStyle === 'outline'
                ? 'transparent'
                : '#35123F',
            color: cfg.ctaStyle === 'outline' && !overlayActive ? '#35123F' : '#FFFFFF',
            border: cfg.ctaStyle === 'outline'
              ? `1.5px solid ${overlayActive ? '#FFFFFF' : '#35123F'}`
              : 'none',
          }}
        >
          <span>{cfg.ctaText}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );

  return (
    <>
      {/* Editor Draft Preview Notice Bar - Only shown for authenticated admin users */}
      {isEditor && (
        <aside
          ref={noticeRef}
          aria-label="Administrator Preview Notice"
          className="bg-[#171B2C] text-[#FAF7F2] px-4 py-2 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-3 border-b border-[#D5A13C]/40 z-40 relative"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
            <span className="flex items-center gap-1 font-semibold text-[#D5A13C]">
              <Shield className="w-3.5 h-3.5" />
              {brandName} Staff Mode:
            </span>
            <span className="min-w-0 break-words">Signed in as {user?.name || user?.email} ({user?.role})</span>
            {previewDraft && (
              <span className="bg-[#35123F] text-white px-2 py-0.5 rounded text-[11px] font-medium tracking-wide">
                Live Draft Preview Active
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:shrink-0">
            <button
              onClick={() => setPreviewDraft(!previewDraft)}
              className="flex items-center gap-1 hover:text-[#D5A13C] transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{previewDraft ? 'Exit Preview' : 'Preview Unpublished Draft'}</span>
            </button>
            <span className="text-slate-500">|</span>
            <Link to="/admin" className="text-[#D5A13C] hover:underline font-medium">
              Open CMS Workspace →
            </Link>
          </div>
        </aside>
      )}

      {/* Main Top Bar */}
      <header
        role="banner"
        data-testid="navbar"
        data-overlay={overlayActive ? 'true' : 'false'}
        data-layout={layoutPreset}
        data-bg-mode={overlayActive ? 'overlay' : sections ? appearance.mode : 'surface'}
        data-transparency={overlayActive ? overlayTransparency : 0}
        className={`w-full z-50 transition-colors duration-200 ${
          overlayActive
            ? isSticky
              ? 'fixed left-0 right-0'
              : 'absolute left-0 right-0'
            : isSticky
              ? 'sticky top-0'
              : 'relative'
        } ${headerBgClass}`}
        style={{
          backgroundColor:
            overlayActive
              ? overlayBackgroundCss
              : isTransparent && !isScrolled
              ? 'transparent'
              : isPublicDark
              ? (activeSettings?.theme?.darkTheme?.headerBg || '#0F172A')
              : (cfg?.backgroundColor || undefined),
          ...(overlayActive ? { top: `${headerTop}px` } : {}),
        }}
      >
        {overlayActive && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-full h-16"
            style={{
              backgroundImage: `linear-gradient(to bottom, ${withAlpha(
                overlayGradientColor,
                overlayAlpha
              )} 0%, ${withAlpha(overlayGradientColor, 0)} 100%)`,
            }}
          />
        )}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 min-h-20 py-3 flex items-center justify-between gap-4 sm:gap-8">
          {/* Header Layout Preset Arrangements */}
          {layoutPreset === 'logo-left-nav-center' ? (
            /* Layout 1: Logo Left, Navigation Center, CTA Right */
            <div className="w-full flex items-center justify-between gap-4 sm:gap-8">
              {/* Left: Brand */}
              <div className="flex-1 flex items-center justify-start min-w-0">
                {BrandBlock}
              </div>

              {/* Center: Nav links */}
              <nav className="hidden lg:flex flex-1 min-w-0 flex-wrap items-center justify-center gap-x-6 xl:gap-x-8 gap-y-2 text-sm font-medium">
                {navLinks.map(renderNavLink)}
              </nav>

              {/* Right: Actions */}
              <div className="flex-1 hidden lg:flex items-center justify-end">
                {ActionButtonsBlock}
              </div>

              {/* Mobile hamburger button */}
              <div className="lg:hidden flex items-center gap-2">
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="p-2 transition-colors cursor-pointer hover:text-[#D5A13C]"
                  style={{ color: headerTextColor }}
                  data-testid="mobile-nav-toggle"
                  aria-label="Toggle navigation menu"
                  aria-expanded={mobileOpen}
                >
                  {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          ) : layoutPreset === 'logo-right-nav-center' ? (
            /* Layout 2: Logo Right, Navigation Center, CTA Left */
            <div className="w-full flex items-center justify-between gap-4 sm:gap-8">
              {/* Left: Actions */}
              <div className="flex-1 hidden lg:flex items-center justify-start">
                {ActionButtonsBlock}
              </div>

              {/* Center: Nav links */}
              <nav className="hidden lg:flex flex-1 min-w-0 flex-wrap items-center justify-center gap-x-6 xl:gap-x-8 gap-y-2 text-sm font-medium">
                {navLinks.map(renderNavLink)}
              </nav>

              {/* Right: Brand */}
              <div className="flex-1 flex items-center justify-end min-w-0">
                {BrandBlock}
              </div>

              {/* Mobile hamburger button */}
              <div className="lg:hidden flex items-center gap-2">
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="p-2 transition-colors cursor-pointer hover:text-[#D5A13C]"
                  style={{ color: headerTextColor }}
                  data-testid="mobile-nav-toggle"
                  aria-label="Toggle navigation menu"
                  aria-expanded={mobileOpen}
                >
                  {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          ) : layoutPreset === 'logo-right-nav-left' ? (
            /* Layout 4: Logo Right, CTA and Navigation Left */
            <div className="w-full flex items-center justify-between gap-4 sm:gap-8">
              {/* Left: CTA followed by Nav links */}
              <div className="hidden lg:flex min-w-0 flex-1 items-center gap-6 xl:gap-8">
                {ActionButtonsBlock}
                <nav className="flex flex-1 min-w-0 flex-wrap items-center gap-x-6 xl:gap-x-8 gap-y-2 text-sm font-medium">
                  {navLinks.map(renderNavLink)}
                </nav>
              </div>

              {/* Right: Brand */}
              <div className="flex items-center justify-end ml-auto">
                {BrandBlock}
              </div>

              {/* Mobile hamburger button */}
              <div className="lg:hidden flex items-center gap-2">
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="p-2 transition-colors cursor-pointer hover:text-[#D5A13C]"
                  style={{ color: headerTextColor }}
                  data-testid="mobile-nav-toggle"
                  aria-label="Toggle navigation menu"
                  aria-expanded={mobileOpen}
                >
                  {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          ) : layoutPreset === 'logo-center-split' ? (
            /* Legacy/Optional: logo-center-split */
            <div className="w-full flex items-center justify-between gap-4">
              <nav className="hidden lg:flex min-w-0 flex-1 flex-wrap items-center justify-start gap-x-6 xl:gap-x-8 gap-y-2 text-sm font-medium">
                {leftLinks.map(renderNavLink)}
              </nav>
              <div className="flex justify-center shrink-0">
                {BrandBlock}
              </div>
              <div className="hidden lg:flex min-w-0 items-center gap-6 xl:gap-8 flex-1 justify-end">
                <nav className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-6 xl:gap-x-8 gap-y-2 text-sm font-medium">
                  {rightLinks.map(renderNavLink)}
                </nav>
                {ActionButtonsBlock}
              </div>
              <div className="lg:hidden flex items-center gap-2">
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="p-2 transition-colors cursor-pointer hover:text-[#D5A13C]"
                  style={{ color: headerTextColor }}
                  data-testid="mobile-nav-toggle"
                  aria-label="Toggle navigation menu"
                  aria-expanded={mobileOpen}
                >
                  {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          ) : (
            /* Layout 3: Logo Left, Navigation and CTA Right (Default: logo-left-nav-right) */
            <div className="w-full flex items-center justify-between gap-4 sm:gap-8">
              {/* Left: Brand */}
              {BrandBlock}

              {/* Right: Nav links pushed right, next to Action buttons */}
              <div className="hidden lg:flex min-w-0 flex-1 items-center gap-6 xl:gap-8 ml-auto">
                <nav className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-6 xl:gap-x-8 gap-y-2 text-sm font-medium">
                  {navLinks.map(renderNavLink)}
                </nav>
                {ActionButtonsBlock}
              </div>

              {/* Mobile hamburger button */}
              <div className="lg:hidden flex items-center gap-2">
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="p-2 transition-colors cursor-pointer hover:text-[#D5A13C]"
                  style={{ color: headerTextColor }}
                  data-testid="mobile-nav-toggle"
                  aria-label="Toggle navigation menu"
                  aria-expanded={mobileOpen}
                >
                  {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div
            data-testid="mobile-nav-drawer"
            className={`lg:hidden relative z-50 border-b px-4 sm:px-6 py-6 space-y-4 shadow-lg max-h-[calc(100dvh-4rem)] overflow-y-auto ${
              overlayActive || isPublicDark ? 'bg-[#131624] border-slate-800' : 'bg-[#FAF7F2] border-[#E2E8F0]'
            }`}
          >
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  onClick={() => setMobileOpen(false)}
                  style={{ color: headerTextColor }}
                  className={`min-w-0 break-words [overflow-wrap:anywhere] text-base font-medium py-1 border-b transition-colors ${
                    overlayActive || isPublicDark
                      ? 'border-slate-800 hover:text-[#D5A13C]'
                      : 'border-slate-100 hover:text-[#35123F]'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="pt-2 flex flex-col gap-2.5">
              {isPublicDarkModeEnabled && (
                <button
                  type="button"
                  onClick={togglePublicMode}
                  className={`w-full py-2.5 px-4 rounded border flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer transition-colors ${
                    overlayActive || isPublicDark
                      ? 'border-slate-700 bg-[#1E2337] text-slate-200 hover:bg-[#282F49]'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {isPublicDarkActive ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-700" />}
                  <span>Switch to {isPublicDarkActive ? 'Light Theme' : 'Dark Theme'}</span>
                </button>
              )}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className={`w-full text-center block px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded border transition-colors ${
                    overlayActive || isPublicDark
                      ? 'text-slate-200 bg-[#1E2337] border-slate-700 hover:border-[#D5A13C]'
                      : 'text-slate-800 bg-white border-slate-300 hover:border-[#35123F]'
                  }`}
                >
                  Access CMS Admin Portal
                </Link>
              )}
              {cfg?.ctaText && (
                <a
                  href={cfg.ctaUrl || '/contact'}
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center block px-4 py-3 text-xs font-semibold uppercase tracking-wider rounded text-white bg-[#35123F] hover:bg-[#740822] transition-colors"
                >
                  {cfg.ctaText}
                </a>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};
