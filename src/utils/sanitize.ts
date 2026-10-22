/**
 * Client-Side Safe HTML Sanitizer
 * Strips dangerous executable tags (<script>, <object>, <embed>, <iframe>),
 * dangerous schemes (javascript:, vbscript:, data:text/html),
 * and all inline event handlers (onerror, onclick, onload, etc.)
 */
export function sanitizeClientHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';
  if (typeof window === 'undefined') return dirty;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(dirty, 'text/html');

    // Remove executable tags
    const blockedTags = ['script', 'object', 'embed', 'iframe', 'form', 'base', 'meta', 'link'];
    blockedTags.forEach((tag) => {
      const elements = doc.querySelectorAll(tag);
      elements.forEach((el) => el.remove());
    });

    // Walk all elements and strip inline event attributes and dangerous URLs
    const allElements = doc.body.querySelectorAll('*');
    allElements.forEach((el) => {
      // Remove event handlers like onclick, onerror, onload, onmouseover
      Array.from(el.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (name.startsWith('on')) {
          el.removeAttribute(attr.name);
        }
        // Disallow dangerous href or src schemes
        if (['href', 'src', 'action', 'formaction'].includes(name)) {
          const val = attr.value.trim().toLowerCase();
          if (
            val.startsWith('javascript:') ||
            val.startsWith('vbscript:') ||
            val.startsWith('data:text/html') ||
            val.startsWith('data:application')
          ) {
            el.removeAttribute(attr.name);
          }
        }
      });

      // Target external links safely
      if (el.tagName === 'A') {
        el.setAttribute('rel', 'noopener noreferrer');
      }
    });

    return doc.body.innerHTML;
  } catch {
    // If parsing fails, return plain text escaped
    return dirty.replace(/[<>&"']/g, (m) => {
      switch (m) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '"': return '&quot;';
        case "'": return '&#39;';
        default: return m;
      }
    });
  }
}
