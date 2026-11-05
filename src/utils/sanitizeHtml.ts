import { toPersianDigits } from './persianNumbers.ts';

const ALLOWED_TAGS = new Set([
  'P',
  'BR',
  'B',
  'STRONG',
  'I',
  'EM',
  'U',
  'H2',
  'H3',
  'H4',
  'UL',
  'OL',
  'LI',
  'BLOCKQUOTE',
  'A',
  'HR',
  'DIV',
  'SPAN',
  'IMG',
  'FIGURE',
  'FIGCAPTION',
]);

const FORBIDDEN_CONTAINER_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'FORM',
  'INPUT',
  'BUTTON',
  'TEXTAREA',
  'SELECT',
  'META',
  'LINK',
  'SVG',
  'MATH',
]);

function isSafeUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  if (!trimmed) return false;
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return false;
  }
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#')
  );
}

function isSafeImageSrc(src: string): boolean {
  const trimmed = src.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('vbscript:')) {
    return false;
  }
  if (lower.startsWith('data:')) {
    return /^data:image\/(png|jpeg|jpg|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(trimmed);
  }
  return (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('/')
  );
}

function extractSafeTextAlign(styleAttr: string | null): string | null {
  if (!styleAttr) return null;
  const match = styleAttr.match(/text-align\s*:\s*(right|left|center|justify)/i);
  return match ? `text-align: ${match[1].toLowerCase()};` : null;
}

function extractSafeImageWidth(el: HTMLElement): {
  sizeKey: 'full' | 'lg' | 'md' | 'sm';
  widthCss: string;
} {
  const dataSize = (el.getAttribute('data-img-size') || '').toLowerCase();
  const styleAttr = el.getAttribute('style') || '';
  const widthAttr = el.getAttribute('width') || '';

  if (dataSize === 'sm' || /width\s*:\s*35%/i.test(styleAttr) || widthAttr === '35%') {
    return { sizeKey: 'sm', widthCss: '35%' };
  }
  if (dataSize === 'md' || /width\s*:\s*50%/i.test(styleAttr) || widthAttr === '50%') {
    return { sizeKey: 'md', widthCss: '50%' };
  }
  if (dataSize === 'lg' || /width\s*:\s*75%/i.test(styleAttr) || widthAttr === '75%') {
    return { sizeKey: 'lg', widthCss: '75%' };
  }
  return { sizeKey: 'full', widthCss: '100%' };
}

/**
 * Sanitizes rich-text HTML content using a strict allowlist of semantic tags and attributes.
 * Prevents XSS while preserving RTL formatting, headings, lists, alignment, links, blockquotes, and inline images.
 */
export function sanitizeRichHtml(rawHtml: string): string {
  const input = String(rawHtml || '').trim();
  if (!input) return '';

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return input
      .replace(/<(script|style|iframe|object|embed|form)[^>]*>[\s\S]*?<\/\1>/gi, '')
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/javascript\s*:/gi, '');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${input}</div>`, 'text/html');
  const root = doc.body.firstElementChild as HTMLElement | null;
  if (!root) return '';

  function cleanNode(node: Node): Node | DocumentFragment | null {
    if (node.nodeType === Node.TEXT_NODE) {
      return doc.createTextNode(node.textContent || '');
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toUpperCase();

    if (FORBIDDEN_CONTAINER_TAGS.has(tag)) {
      return null;
    }

    if (tag === 'IMG') {
      const rawSrc = el.getAttribute('src') || '';
      if (!isSafeImageSrc(rawSrc)) {
        return null;
      }
      const cleanImg = doc.createElement('img');
      cleanImg.setAttribute('src', rawSrc.trim());
      const altText = (el.getAttribute('alt') || 'تصویر مقاله').trim();
      cleanImg.setAttribute('alt', altText);
      cleanImg.setAttribute('loading', 'lazy');

      const { sizeKey, widthCss } = extractSafeImageWidth(el);
      cleanImg.setAttribute('data-img-size', sizeKey);
      cleanImg.setAttribute(
        'style',
        `width: ${widthCss}; max-width: 100%; height: auto; border-radius: 14px; display: block; margin: 16px auto;`
      );
      return cleanImg;
    }

    const fragment = doc.createDocumentFragment();
    for (const child of Array.from(el.childNodes)) {
      const cleanedChild = cleanNode(child);
      if (cleanedChild) {
        fragment.appendChild(cleanedChild);
      }
    }

    if (!ALLOWED_TAGS.has(tag)) {
      return fragment;
    }

    const cleanEl = doc.createElement(tag.toLowerCase());

    const safeAlign = extractSafeTextAlign(el.getAttribute('style'));
    const alignAttr = el.getAttribute('align')?.toLowerCase();
    if (safeAlign) {
      cleanEl.setAttribute('style', safeAlign);
    } else if (alignAttr && ['right', 'left', 'center', 'justify'].includes(alignAttr)) {
      cleanEl.setAttribute('style', `text-align: ${alignAttr};`);
    }

    const dirAttr = el.getAttribute('dir')?.toLowerCase();
    if (dirAttr === 'rtl' || dirAttr === 'ltr') {
      cleanEl.setAttribute('dir', dirAttr);
    }

    if (tag === 'A') {
      const rawHref = el.getAttribute('href') || '';
      if (isSafeUrl(rawHref)) {
        cleanEl.setAttribute('href', rawHref.trim());
        cleanEl.setAttribute('target', '_blank');
        cleanEl.setAttribute('rel', 'noopener noreferrer');
      }
    }

    if (tag !== 'BR' && tag !== 'HR') {
      cleanEl.appendChild(fragment);
    }

    return cleanEl;
  }

  const outputContainer = doc.createElement('div');
  for (const child of Array.from(root.childNodes)) {
    const cleaned = cleanNode(child);
    if (cleaned) {
      outputContainer.appendChild(cleaned);
    }
  }

  return outputContainer.innerHTML.trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Converts plain text (or legacy markdown-like text) into clean HTML paragraphs
 * if the content does not already contain HTML tags, and then sanitizes it.
 */
export function normalizeArticleHtml(rawContent: string): string {
  const trimmed = String(rawContent || '').trim();
  if (!trimmed) return '';

  const hasHtmlTags = /<\/?(p|div|h2|h3|h4|ul|ol|li|blockquote|strong|b|em|i|u|br|a|hr|span|img|figure|figcaption)\b/i.test(
    trimmed
  );

  if (hasHtmlTags) {
    return sanitizeRichHtml(trimmed);
  }

  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((block) => {
      const line = block.trim();
      if (!line) return '';
      if (line.startsWith('## ')) {
        return `<h2>${escapeHtml(line.slice(3).trim())}</h2>`;
      }
      if (line.startsWith('### ')) {
        return `<h3>${escapeHtml(line.slice(4).trim())}</h3>`;
      }
      if (line.startsWith('«') && line.endsWith('»')) {
        return `<blockquote>${escapeHtml(line)}</blockquote>`;
      }
      const formattedLines = escapeHtml(line).replace(/\n/g, '<br>');
      return `<p>${formattedLines}</p>`;
    })
    .filter(Boolean)
    .join('');

  return sanitizeRichHtml(paragraphs);
}

/**
 * Renders sanitized article HTML with Persian digit conversion applied only to text nodes.
 */
export function renderSanitizedArticleHtml(rawContent: string): string {
  const sanitized = normalizeArticleHtml(rawContent);
  if (!sanitized) return '';

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return toPersianDigits(sanitized);
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${sanitized}</div>`, 'text/html');
  const root = doc.body.firstElementChild as HTMLElement | null;
  if (!root) return '';

  function walkTextNodes(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent = toPersianDigits(node.textContent || '');
      return;
    }
    for (const child of Array.from(node.childNodes)) {
      walkTextNodes(child);
    }
  }

  walkTextNodes(root);
  return root.innerHTML;
}
