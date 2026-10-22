import sanitizeHtml from 'sanitize-html';

export function cleanHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';

  return sanitizeHtml(dirty, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
      'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
      'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'span'
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel', 'class'],
      div: ['class'],
      span: ['class'],
      p: ['class'],
      h1: ['class'],
      h2: ['class'],
      h3: ['class'],
      h4: ['class'],
      table: ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' })
    }
  });
}

/**
 * Strict SVG Sanitizer:
 * Strips active content, executable scripts, event handlers, and dangerous external entities
 * while preserving legitimate vector artwork (paths, shapes, gradients, viewBox, styles).
 */
export function sanitizeSvg(rawSvg: string): string {
  if (!rawSvg || typeof rawSvg !== 'string') return '';

  // 1. Pre-filter dangerous patterns (e.g. script tags, foreignObject, event handlers, data/javascript URIs)
  let cleaned = rawSvg
    .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*foreignObject[^>]*>[\s\S]*?<\s*\/\s*foreignObject\s*>/gi, '')
    .replace(/\bon\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\bon\w+\s*=\s*[^ >]+/gi, '')
    .replace(/javascript\s*:/gi, 'blocked-scheme:')
    .replace(/data\s*:\s*text\/html/gi, 'blocked-scheme:');

  // 2. Strict XML/SVG whitelist sanitization using sanitizeHtml
  const safeSvg = sanitizeHtml(cleaned, {
    allowedTags: [
      'svg', 'g', 'path', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
      'rect', 'text', 'tspan', 'defs', 'lineargradient', 'radialgradient', 'stop',
      'clippath', 'mask', 'pattern', 'symbol', 'use', 'title', 'desc'
    ],
    allowedAttributes: {
      '*': [
        'id', 'class', 'style', 'transform',
        'fill', 'fill-opacity', 'fill-rule',
        'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-opacity',
        'opacity', 'd', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
        'width', 'height', 'viewbox', 'preserveaspectratio', 'points', 'dx', 'dy',
        'text-anchor', 'font-family', 'font-size', 'font-weight', 'letter-spacing',
        'offset', 'stop-color', 'stop-opacity', 'gradientunits', 'gradienttransform',
        'clip-path', 'clip-rule', 'mask', 'patternunits', 'href', 'xlink:href'
      ]
    },
    allowedSchemes: ['http', 'https'],
    disallowedTagsMode: 'discard',
  });

  // Ensure root contains an svg tag
  if (!/<svg[^>]*>[\s\S]*<\/svg>/i.test(safeSvg.trim())) {
    return '';
  }

  return safeSvg;
}
