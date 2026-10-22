import React from 'react';
import { Link } from 'react-router-dom';

export interface BrandLogoProps {
  logoUrl?: string;
  logoAlt?: string;
  brandName?: string;
  brandSubName?: string;
  logoWidth?: number;
  logoHeight?: number;
  logoSpacing?: number;
  brandLayout?: 'inline' | 'stacked';
  brandNameFontSize?: number;
  brandSubNameFontSize?: number;
  brandNameColor?: string;
  brandSubNameColor?: string;
  align?: 'left' | 'center' | 'right';
  direction?: 'ltr' | 'rtl';
  size?: 'sm' | 'md';
  showText?: boolean;
  interactive?: boolean;
  testId?: string;
  className?: string;
}

const alignmentClass = (align: 'left' | 'center' | 'right'): string => {
  if (align === 'center') return 'justify-center text-center';
  if (align === 'right') return 'justify-end text-right';
  return 'justify-start text-left';
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  logoUrl,
  logoAlt,
  brandName,
  brandSubName,
  logoWidth = 140,
  logoHeight = 42,
  logoSpacing = 10,
  brandLayout = 'inline',
  brandNameFontSize,
  brandSubNameFontSize,
  brandNameColor = '#171B2C',
  brandSubNameColor = '#35123F',
  align = 'left',
  direction = 'ltr',
  size = 'md',
  showText = true,
  interactive = true,
  testId = 'brand-logo',
  className = '',
}) => {
  const resolvedAlign = direction === 'rtl'
    ? align === 'left'
      ? 'right'
      : align === 'right'
        ? 'left'
        : align
    : align;

  const markSizeClass = size === 'sm' ? 'w-8 h-8 sm:w-9 sm:h-9' : 'w-9 h-9';
  const markIconClass = size === 'sm' ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5';
  const defaultNameSize = size === 'sm' ? '1.125rem' : '1.25rem';
  const defaultSubSize = brandLayout === 'stacked' ? '0.75rem' : '0.875rem';
  const stackedItemsClass =
    resolvedAlign === 'center'
      ? 'items-center'
      : resolvedAlign === 'right'
        ? direction === 'rtl'
          ? 'items-start'
          : 'items-end'
        : direction === 'rtl'
          ? 'items-end'
          : 'items-start';

  const content = (
    <>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={logoAlt || brandName || 'Company logo'}
          style={{
            maxHeight: `${logoHeight}px`,
            maxWidth: `${Math.min(logoWidth, size === 'sm' ? 220 : 240)}px`,
            width: 'auto',
            height: 'auto',
          }}
          className="object-contain shrink-0"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className={`${markSizeClass} rounded-xl bg-gradient-to-br from-[#35123F] to-[#171B2C] border border-[#D5A13C]/40 flex items-center justify-center text-white shrink-0 shadow-xs group-hover:scale-105 transition-transform`}
          data-testid={`${testId}-fallback-mark`}
        >
          <svg viewBox="0 0 24 24" fill="none" className={markIconClass} aria-hidden="true">
            <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="#D5A13C" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M12 6L7 9V15L12 18L17 15V9L12 6Z" fill="#35123F" stroke="#FAF7F2" strokeWidth="1" />
            <circle cx="12" cy="12" r="2" fill="#D5A13C" />
          </svg>
        </div>
      )}

      {showText && (brandName || brandSubName) && (
        <div
          className={`flex ${
            brandLayout === 'stacked'
              ? `flex-col ${stackedItemsClass} justify-center leading-tight`
              : 'flex-row items-baseline gap-1.5'
          } min-w-0`}
        >
          {brandName && (
            <span
              className="font-bold tracking-tight truncate group-hover:opacity-90 transition-opacity"
              style={{
                fontSize: brandNameFontSize ? `${brandNameFontSize}px` : defaultNameSize,
                color: brandNameColor,
              }}
            >
              {brandName}
            </span>
          )}
          {brandSubName && (
            <span
              className={`font-semibold tracking-normal truncate ${brandLayout === 'stacked' ? 'mt-0.5' : ''}`}
              style={{
                fontSize: brandSubNameFontSize ? `${brandSubNameFontSize}px` : defaultSubSize,
                color: brandSubNameColor,
              }}
            >
              {brandSubName}
            </span>
          )}
        </div>
      )}
    </>
  );

  const sharedClassName = `inline-flex items-center min-w-0 max-w-full group ${alignmentClass(resolvedAlign)} ${className}`.trim();

  if (!interactive) {
    return (
      <div
        className={sharedClassName}
        style={{ gap: `${logoSpacing}px` }}
        data-testid={testId}
        dir={direction}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      to="/"
      className={`${sharedClassName} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35123F] rounded-sm`}
      style={{ gap: `${logoSpacing}px` }}
      data-testid={testId}
    >
      {content}
    </Link>
  );
};
