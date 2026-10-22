import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ArrowRight, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  footerColumnWidthClass,
  getEffectiveFooterSections,
  getEffectiveSocialItems,
  resolveFooterAlignment,
} from '../../utils/footerLayout';
import { SocialIconRenderer } from './SocialIconRenderer';
import { BrandLogo } from '../shared/BrandLogo';
import type {
  FooterConfig,
  FooterElementConfig,
  FooterLayoutColumn,
  FooterLayoutSection,
} from '../../types';

export const Footer: React.FC<{ config?: FooterConfig }> = ({ config }) => {
  const { activeSettings, isPublicDarkActive } = useTheme();
  const { isAdmin } = useAuth();
  const cfg = config || activeSettings?.footer;
  const isPublicDark = isPublicDarkActive;
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const currentYear = new Date().getFullYear();
  const rawCopyright = cfg?.copyrightText || '© {year} Azaroth Tech-Hive Inc. All rights reserved.';
  const copyright = rawCopyright.replace(/\{year\}/g, currentYear.toString());

  const bgColor = isPublicDark
    ? activeSettings?.theme?.darkTheme?.footerBg || '#0A0F1D'
    : cfg?.backgroundColor || '#171B2C';
  const textColor = isPublicDark ? '#FAF7F2' : cfg?.textColor || '#FAF7F2';
  const accentColor = cfg?.accentColor || '#D5A13C';
  const direction = cfg?.direction === 'rtl' ? 'rtl' : 'ltr';

  const sections = getEffectiveFooterSections(cfg);
  const socialItems = getEffectiveSocialItems(cfg).filter((item) => item.enabled !== false);

  const handleNewsletterSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) return;
    setSubscribed(true);
    setTimeout(() => {
      setNewsletterEmail('');
      setSubscribed(false);
    }, 4000);
  };

  const itemsClassFor = (align: 'left' | 'center' | 'right') => {
    if (align === 'center') return 'items-center';
    if (align === 'right') return direction === 'rtl' ? 'items-start' : 'items-end';
    return direction === 'rtl' ? 'items-end' : 'items-start';
  };

  const justifyClassFor = (align: 'left' | 'center' | 'right') => {
    if (align === 'center') return 'justify-center';
    if (align === 'right') return direction === 'rtl' ? 'justify-start' : 'justify-end';
    return direction === 'rtl' ? 'justify-end' : 'justify-start';
  };

  const renderElement = (el: FooterElementConfig, col: FooterLayoutColumn) => {
    const effectiveAlign = resolveFooterAlignment(el.alignment || col.alignment, direction);
    const textAlignClass =
      effectiveAlign === 'center' ? 'text-center' : effectiveAlign === 'right' ? 'text-right' : 'text-left';
    const alignClass = `${textAlignClass} ${itemsClassFor(effectiveAlign)}`;
    const justifyClass = justifyClassFor(effectiveAlign);

    switch (el.type) {
      case 'logo':
        return (
          <div key={el.id} className={`flex flex-col w-full ${alignClass}`}>
            <BrandLogo
              logoUrl={cfg?.logoUrl}
              logoAlt={cfg?.logoAlt || cfg?.brandName || 'Footer logo'}
              logoWidth={cfg?.logoWidth}
              logoHeight={cfg?.logoHeight}
              logoSpacing={cfg?.logoSpacing}
              align={effectiveAlign}
              direction={direction}
              showText={false}
              size="md"
              testId="footer-logo"
            />
          </div>
        );

      case 'brand_text': {
        const brandName = cfg?.brandName ?? 'Azaroth';
        const brandSubName = cfg?.brandSubName;
        return (
          <div
            key={el.id}
            data-testid="footer-brand"
            className={`space-y-3 flex flex-col w-full ${alignClass}`}
          >
            <BrandLogo
              logoUrl={cfg?.logoUrl}
              logoAlt={cfg?.logoAlt || brandName || 'Footer logo'}
              brandName={brandName}
              brandSubName={brandSubName}
              logoWidth={cfg?.logoWidth}
              logoHeight={cfg?.logoHeight}
              logoSpacing={cfg?.logoSpacing}
              brandLayout={cfg?.brandLayout}
              brandNameFontSize={cfg?.brandNameFontSize}
              brandSubNameFontSize={cfg?.brandSubNameFontSize}
              brandNameColor={cfg?.brandNameColor || '#FAF7F2'}
              brandSubNameColor={cfg?.brandSubNameColor || accentColor}
              align={effectiveAlign}
              direction={direction}
              size="md"
              testId="footer-brand-logo"
            />
            {cfg?.subtitle && (
              <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: accentColor }}>
                {cfg.subtitle}
              </p>
            )}
            {cfg?.companyDescription && (
              <p className="text-sm opacity-80 leading-relaxed max-w-md">{cfg.companyDescription}</p>
            )}
          </div>
        );
      }

      case 'nav_column': {
        const allColumns = cfg?.columns || [];
        const isBound = Boolean(el.columnId);
        const targets = isBound
          ? allColumns.filter((column) => column.id === el.columnId)
          : allColumns;
        const visibleTargets = targets.filter((column) => (column.links || []).length > 0);
        if (visibleTargets.length === 0) return null;
        return (
          <React.Fragment key={el.id}>
            {visibleTargets.map((targetCol) => {
              const title = (isBound ? el.title : undefined) || targetCol.title || el.title || 'Navigation';
              return (
                <div
                  key={targetCol.id}
                  data-testid="footer-nav-column"
                  className={`space-y-3.5 flex flex-col w-full ${alignClass}`}
                >
                  <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: accentColor }}>
                    {title}
                  </h4>
                  <ul className="space-y-2 text-sm opacity-80 w-full">
                    {targetCol.links.map((link) => (
                      <li key={link.id}>
                        {link.url.startsWith('/') && !link.isExternal ? (
                          <Link
                            to={link.url}
                            data-testid={`footer-nav-link-${link.id}`}
                            className="hover:opacity-100 hover:text-white transition-opacity block py-0.5"
                          >
                            {link.label}
                          </Link>
                        ) : (
                          <a
                            href={link.url}
                            target={link.isExternal ? '_blank' : undefined}
                            rel={link.isExternal ? 'noopener noreferrer' : undefined}
                            data-testid={`footer-nav-link-${link.id}`}
                            className="hover:opacity-100 hover:text-white transition-opacity block py-0.5"
                          >
                            {link.label}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </React.Fragment>
        );
      }

      case 'social_links': {
        const title =
          (cfg?.socialHeading ?? '').trim() ||
          (el.title !== undefined ? el.title : 'Follow Us');
        return (
          <div
            key={el.id}
            data-testid="footer-social"
            className={`space-y-3 flex flex-col w-full ${alignClass}`}
          >
            {title && (
              <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: accentColor }}>
                {title}
              </h4>
            )}
            {socialItems.length > 0 && (
              <div className={`flex flex-row flex-wrap items-center gap-3 w-full ${justifyClass}`}>
                {socialItems.map((item) => (
                  <span key={item.id} data-testid={`footer-social-${item.platform}`}>
                    <SocialIconRenderer
                      platform={item.platform}
                      url={item.url}
                      label={item.label}
                      iconColor={item.iconColor}
                      bgColor={item.bgColor}
                      styleType={cfg?.socialStyle || 'plain'}
                      size={cfg?.socialSize || 'md'}
                    />
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      }

      case 'contact_info': {
        const hasContact = Boolean(cfg?.contactEmail || cfg?.contactPhone || cfg?.address);
        if (!hasContact) return null;
        return (
          <div
            key={el.id}
            data-testid="footer-contact"
            className={`space-y-2.5 text-xs opacity-90 flex flex-col w-full ${alignClass}`}
          >
            {el.title && (
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-100" style={{ color: accentColor }}>
                {el.title}
              </h4>
            )}
            {cfg?.contactEmail && (
              <div className={`flex w-full items-center gap-2.5 ${justifyClass}`}>
                <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
                <a href={`mailto:${cfg.contactEmail}`} className="hover:underline break-all">
                  {cfg.contactEmail}
                </a>
              </div>
            )}
            {cfg?.contactPhone && (
              <div className={`flex w-full items-center gap-2.5 ${justifyClass}`}>
                <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
                <a href={`tel:${cfg.contactPhone}`} className="hover:underline">
                  {cfg.contactPhone}
                </a>
              </div>
            )}
            {cfg?.address && (
              <div className={`flex w-full items-center gap-2.5 ${justifyClass}`}>
                <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
                <span className="min-w-0 break-words">{cfg.address}</span>
              </div>
            )}
          </div>
        );
      }

      case 'copyright':
        return (
          <div
            key={el.id}
            data-testid="footer-copyright"
            className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs opacity-75 w-full"
          >
            <p>{copyright}</p>
            {isAdmin && (
              <Link
                to="/admin"
                className="text-[11px] font-medium px-2 py-0.5 rounded border border-white/20 hover:border-white/50 transition-colors inline-flex items-center gap-1 shrink-0"
                title="CMS Admin Portal"
              >
                <span>Staff Portal</span>
                {direction === 'rtl' ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
              </Link>
            )}
          </div>
        );

      case 'newsletter': {
        const title = el.title || cfg?.newsletterTitle || 'Stay Connected';
        const subtitle =
          el.content ||
          cfg?.newsletterSubtitle ||
          'Subscribe for latest enterprise updates and telemetry digests.';
        const buttonText = cfg?.newsletterButtonText || 'Subscribe';
        const placeholder = cfg?.newsletterPlaceholder || 'Enter your email...';
        return (
          <div
            key={el.id}
            data-testid="footer-newsletter"
            className={`space-y-2.5 max-w-sm w-full flex flex-col ${alignClass}`}
          >
            {title && (
              <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: accentColor }}>
                {title}
              </h4>
            )}
            {subtitle && <p className="text-xs opacity-75 leading-relaxed">{subtitle}</p>}
            {subscribed ? (
              <div
                role="status"
                data-testid="footer-newsletter-success"
                className="p-2.5 bg-emerald-500/15 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Thank you for subscribing!</span>
              </div>
            ) : (
              <form
                onSubmit={handleNewsletterSubmit}
                data-testid="footer-newsletter-form"
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 pt-1 w-full"
              >
                <label htmlFor={`footer-newsletter-email-${el.id}`} className="sr-only">
                  Email address
                </label>
                <input
                  id={`footer-newsletter-email-${el.id}`}
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  data-testid="footer-newsletter-email"
                  value={newsletterEmail}
                  onChange={(event) => setNewsletterEmail(event.target.value)}
                  placeholder={placeholder}
                  className="w-full min-w-0 px-3 py-2 text-xs rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#D5A13C]"
                />
                <button
                  type="submit"
                  data-testid="footer-newsletter-submit"
                  className="w-full sm:w-auto px-3 py-2 bg-[#35123F] hover:bg-[#24102D] text-white text-xs font-semibold rounded-lg shrink-0 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span>{buttonText}</span>
                  <Send className="w-3 h-3" />
                </button>
              </form>
            )}
          </div>
        );
      }

      case 'custom_text':
        return (
          <div key={el.id} className={`space-y-2 flex flex-col w-full ${alignClass}`}>
            {el.title && (
              <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: accentColor }}>
                {el.title}
              </h4>
            )}
            {el.content && (
              <p className="text-xs opacity-80 leading-relaxed whitespace-pre-line max-w-md">
                {el.content}
              </p>
            )}
          </div>
        );

      case 'divider':
        return (
          <div key={el.id} className="w-full py-2">
            <div className="w-full border-t border-white/10" />
          </div>
        );

      default:
        return null;
    }
  };

  const getPaddingClass = (paddingY?: string) => {
    switch (paddingY) {
      case 'none':
        return 'py-0';
      case 'compact':
        return 'py-6';
      case 'relaxed':
        return 'py-16 md:py-20';
      case 'normal':
      default:
        return 'py-12 md:py-14';
    }
  };

  const renderSection = (section: FooterLayoutSection, sectionIndex: number) => {
    const borderTopClass = section.borderTop ? 'border-t border-white/10' : '';
    const borderBottomClass = section.borderBottom ? 'border-b border-white/10' : '';
    const rawColumns = (section.columns || []).filter((column) => (column.elements || []).length > 0);
    const unboundNavElements = rawColumns.flatMap((column) =>
      column.elements.filter((el) => el.type === 'nav_column' && !el.columnId)
    );

    // A single unbound nav element is the CMS representation of "show every
    // link list". Render each list as its own column instead of stacking them
    // inside one narrow column.
    const columns =
      unboundNavElements.length === 1 && (cfg?.columns || []).length > 1
        ? rawColumns.flatMap((column) => {
            const unbound = column.elements.find((el) => el.type === 'nav_column' && !el.columnId);
            if (!unbound) return [column];
            const remainingElements = column.elements.filter((el) => el !== unbound);
            const navColumns = (cfg?.columns || [])
              .filter((footerColumn) => (footerColumn.links || []).length > 0)
              .map((footerColumn) => ({
                ...column,
                id: `${column.id}-nav-${footerColumn.id}`,
                width: 'auto' as const,
                elements: [
                  {
                    ...unbound,
                    id: `${unbound.id}-${footerColumn.id}`,
                    title: footerColumn.title || unbound.title,
                    columnId: footerColumn.id,
                  },
                ],
              }));
            return [
              ...(remainingElements.length > 0
                ? [{ ...column, elements: remainingElements }]
                : []),
              ...navColumns,
            ];
          })
        : rawColumns;

    if (columns.length === 0) return null;
    return (
      <div
        key={section.id || sectionIndex}
        data-testid={`footer-section-${section.type || 'main'}`}
        className={`${getPaddingClass(section.paddingY)} ${borderTopClass} ${borderBottomClass}`}
      >
        <div className="flex flex-wrap gap-6 sm:gap-8 items-start">
          {columns.map((col, colIdx) => {
            const effectiveAlign = resolveFooterAlignment(col.alignment, direction);
            const alignClass =
              effectiveAlign === 'center'
                ? 'text-center'
                : effectiveAlign === 'right'
                  ? 'text-right'
                  : 'text-left';
            return (
              <div
                key={col.id || colIdx}
                data-testid={`footer-column-${col.id || colIdx}`}
                className={`space-y-6 min-w-0 ${footerColumnWidthClass(col.width)} ${alignClass}`}
              >
                {col.elements.map((el) => renderElement(el, col))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <footer
      dir={direction}
      data-testid="footer"
      className={`border-t border-[#E2E8F0]/20 transition-colors duration-200 ${
        direction === 'rtl' ? 'text-right' : 'text-left'
      }`}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">{sections.map(renderSection)}</div>
    </footer>
  );
};
