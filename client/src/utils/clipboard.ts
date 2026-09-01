import { logger } from '@lark-apaas/client-toolkit/logger';

export type RichClipboardMode = 'rich' | 'html-links' | 'text-links' | 'text-only';

export interface RichClipboardResult {
  mode: RichClipboardMode;
  copiedText: boolean;
  copiedImageBinary: boolean;
  copiedImageLinks: boolean;
  message: string;
}

export interface ImageClipboardResult {
  copiedImageBinary: true;
  message: string;
}

function errorText(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&#039;');
}

export function buildClipboardHtml(text: string, imageUrls: string[]): string {
  const paragraphs = text.trim()
    ? `<p style="white-space:pre-wrap;line-height:1.7">${escapeHtml(text.trim()).replace(/\n/gu, '<br>')}</p>`
    : '';
  const images = imageUrls.map((url) => (
    `<p><img src="${escapeHtml(url)}" style="display:block;max-width:720px;width:100%;height:auto" /></p>`
  )).join('');
  const links = imageUrls.length
    ? `<p>${imageUrls.map((url, index) => `<a href="${escapeHtml(url)}">图片${index + 1}</a>`).join('　')}</p>`
    : '';
  return `<div>${paragraphs}${images}${links}</div>`;
}

export function buildClipboardPlainText(text: string, imageUrls: string[]): string {
  return [text.trim(), imageUrls.length ? `图片链接：\n${imageUrls.join('\n')}` : '']
    .filter(Boolean)
    .join('\n\n');
}

function execCommandCopyText(text: string): boolean {
  if (typeof document === 'undefined' || !document.body) return false;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '-10000px';
  textarea.style.top = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    return document.execCommand('copy');
  } finally {
    textarea.remove();
  }
}

export async function copyPlainText(text: string): Promise<void> {
  if (!text.trim()) throw new Error('Clipboard text is empty');
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch (error) {
    logger.error('clipboard.writeText failed', errorText(error));
  }
  if (execCommandCopyText(text)) return;
  const error = new Error('Text clipboard unavailable');
  logger.error('clipboard text fallback failed', error.message);
  throw error;
}

async function writeClipboardRepresentations(data: Record<string, Blob | Promise<Blob>>): Promise<void> {
  if (
    typeof navigator === 'undefined'
    || !navigator.clipboard?.write
    || typeof ClipboardItem === 'undefined'
  ) {
    throw new Error('Rich clipboard API unavailable');
  }
  await navigator.clipboard.write([new ClipboardItem(data, { presentationStyle: 'inline' })]);
}

export async function copyPngImage(
  imagePng: Blob | Promise<Blob>,
  successMessage = '已复制图片',
): Promise<ImageClipboardResult> {
  if (
    typeof navigator === 'undefined'
    || !navigator.clipboard?.write
    || typeof ClipboardItem === 'undefined'
  ) {
    throw new Error('Image clipboard API unavailable');
  }
  if (typeof ClipboardItem.supports === 'function' && !ClipboardItem.supports('image/png')) {
    throw new Error('PNG clipboard format unsupported');
  }

  const pngPromise = Promise.resolve(imagePng).then((blob: Blob) => {
    if (blob.size === 0 || blob.type !== 'image/png') {
      throw new Error('Clipboard image must be a non-empty PNG');
    }
    return blob;
  });

  try {
    // Keep this item image-only. Rich-text targets such as Feishu may otherwise
    // prefer text/html and paste a fallback link instead of the PNG bytes.
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': pngPromise }),
    ]);
  } catch (error) {
    logger.error('clipboard PNG-only write failed', errorText(error));
    throw error;
  }

  return {
    copiedImageBinary: true,
    message: successMessage,
  };
}

export async function copyRichContent(options: {
  text: string;
  imageUrls: string[];
  imagePng?: Promise<Blob>;
}): Promise<RichClipboardResult> {
  const text = options.text.trim();
  const imageUrls = options.imageUrls.filter(Boolean);
  const html = buildClipboardHtml(text, imageUrls);
  const plainTextWithLinks = buildClipboardPlainText(text, imageUrls);

  if (options.imagePng) {
    try {
      await writeClipboardRepresentations({
        'image/png': options.imagePng,
        'text/html': new Blob([html], { type: 'text/html;charset=utf-8' }),
        'text/plain': new Blob([plainTextWithLinks], { type: 'text/plain;charset=utf-8' }),
      });
      return {
        mode: 'rich',
        copiedText: Boolean(text),
        copiedImageBinary: true,
        copiedImageLinks: true,
        message: text ? '已复制图文' : '已复制图片',
      };
    } catch (error) {
      logger.error('clipboard rich image write failed', errorText(error));
    }
  }

  if (imageUrls.length) {
    try {
      await writeClipboardRepresentations({
        'text/html': new Blob([html], { type: 'text/html;charset=utf-8' }),
        'text/plain': new Blob([plainTextWithLinks], { type: 'text/plain;charset=utf-8' }),
      });
      return {
        mode: 'html-links',
        copiedText: Boolean(text),
        copiedImageBinary: false,
        copiedImageLinks: true,
        message: text ? '已复制话术和图片链接，图片未能直接写入' : '已复制图片链接，图片请打开后保存',
      };
    } catch (error) {
      logger.error('clipboard HTML link fallback failed', errorText(error));
    }

    try {
      await copyPlainText(plainTextWithLinks);
      return {
        mode: 'text-links',
        copiedText: Boolean(text),
        copiedImageBinary: false,
        copiedImageLinks: true,
        message: text ? '已复制话术和图片链接，图片未能直接写入' : '已复制图片链接，图片请打开后保存',
      };
    } catch (error) {
      logger.error('clipboard plain link fallback failed', errorText(error));
    }
  }

  if (text) {
    await copyPlainText(text);
    return {
      mode: 'text-only',
      copiedText: true,
      copiedImageBinary: false,
      copiedImageLinks: false,
      message: '已复制话术，图片请手动保存',
    };
  }

  throw new Error('No clipboard representation could be written');
}
