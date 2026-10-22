/**
 * Color helpers used by CMS-driven surface transparency.
 *
 * The CMS stores colors as hex strings but transparency is configured as a
 * separate 0-100 percentage. Converting to an explicit rgba() value keeps the
 * rendered result deterministic across browsers and lets the CSS transition
 * interpolate smoothly when the scrolled state changes the alpha channel.
 */

const HEX_RE = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Converts any supported color string into an rgba() string with the given
 * alpha (0-1). Values that cannot be parsed are returned unchanged so an
 * invalid CMS value degrades to a visible solid color instead of a blank bar.
 */
export function withAlpha(color: string, alpha: number): string {
  const safeAlpha = clamp(alpha, 0, 1);
  if (!color) return `rgba(23, 27, 44, ${safeAlpha})`;

  const trimmed = color.trim();
  const hexMatch = trimmed.match(HEX_RE);

  if (hexMatch) {
    const raw = hexMatch[1];
    const hex = raw.length === 3 || raw.length === 4
      ? raw.split('').map((char) => char + char).join('')
      : raw;
    const expand = (s: string) => parseInt(s, 16);
    const r = expand(hex.slice(0, 2));
    const g = expand(hex.slice(2, 4));
    const b = expand(hex.slice(4, 6));
    const sourceAlpha = hex.length === 8 ? expand(hex.slice(6, 8)) / 255 : 1;
    return `rgba(${r}, ${g}, ${b}, ${round(safeAlpha * sourceAlpha)})`;
  }

  const rgbMatch = trimmed.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(/[,/\s]+/).filter(Boolean);
    const r = parts[0] ?? '0';
    const g = parts[1] ?? '0';
    const b = parts[2] ?? '0';
    return `rgba(${r}, ${g}, ${b}, ${round(safeAlpha)})`;
  }

  // Unknown format (e.g. hsl or a CSS variable). Keep it visible and opaque.
  return trimmed;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Converts a 0-100 transparency percentage into a 0-1 background alpha.
 * 0% transparency means fully opaque, 100% transparency means fully clear.
 */
export function transparencyToAlpha(transparencyPercent: number): number {
  const safe = clamp(Number.isFinite(transparencyPercent) ? transparencyPercent : 0, 0, 100);
  return (100 - safe) / 100;
}
