import { logger } from '@lark-apaas/client-toolkit/logger';

export type ClipboardMode =
  | 'image-only'
  | 'image-with-text'
  | 'html-with-image'
  | 'text-with-image-link'
  | 'text-only'
  | 'failed';

export interface ClipboardResult {
  ok: boolean;
  mode: ClipboardMode;
  imageWritten: boolean;
  textWritten: boolean;
  message: string;
  error?: string;
}

export interface CopyImageOptions {
  imageUrl: string;
  imageBlob?: Blob | Promise<Blob>;
  plainText?: string;
  html?: string;
  title?: string;
}

export interface CopyPngOptions {
  imageBlob: Blob | Promise<Blob>;
  containsText?: boolean;
}

export interface RichClipboardOptions {
  plainText?: string;
  html?: string;
  imageUrl?: string | string[];
  imageBlob?: Blob | Promise<Blob>;
  title?: string;
  tags?: string[];
  sourceUrl?: string;
  imageContainsText?: boolean;
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

function normalizeUrls(value?: string | string[]): string[] {
  const urls = Array.isArray(value) ? value : value ? [value] : [];
  return urls.filter(Boolean).map((url: string) => {
    try {
      return typeof window === 'undefined' ? url : new URL(url, window.location.href).toString();
    } catch {
      return url;
    }
  });
}

export function buildClipboardHtml(text: string, imageUrls: string[]): string {
  const paragraphs = text.trim()
    ? `<p style="white-space:pre-wrap;line-height:1.7">${escapeHtml(text.trim()).replace(/\n/gu, '<br>')}</p>`
    : '';
  const images = imageUrls.map((url: string) => (
    `<p><img src="${escapeHtml(url)}" style="display:block;max-width:720px;width:100%;height:auto" /></p>`
  )).join('');
  const links = imageUrls.length
    ? `<p>${imageUrls.map((url: string, index: number) => (
      `<a href="${escapeHtml(url)}">图片${index + 1}</a>`
    )).join('　')}</p>`
    : '';
  return `<div>${paragraphs}${images}${links}</div>`;
}

export function buildClipboardPlainText(text: string, imageUrls: string[]): string {
  return [text.trim(), imageUrls.length ? `图片链接：\n${imageUrls.join('\n')}` : '']
    .filter(Boolean)
    .join('\n\n');
}

function buildFallbackText(options: RichClipboardOptions, imageUrls: string[]): string {
  return [
    options.title?.trim() ? `案例：${options.title.trim()}` : '',
    options.tags?.filter(Boolean).length ? `标签：${options.tags.filter(Boolean).join('、')}` : '',
    options.plainText?.trim() || '',
    imageUrls.length ? `图片链接：\n${imageUrls.join('\n')}` : '',
    options.sourceUrl?.trim() ? `素材来源：${options.sourceUrl.trim()}` : '',
  ].filter(Boolean).join('\n\n');
}

function execCommandCopyText(text: string): boolean {
  if (typeof document === 'undefined' || !document.body) return false;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.setAttribute('aria-hidden', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '-10000px';
  textarea.style.top = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  try {
    return document.execCommand('copy');
  } catch (error) {
    logger.error('clipboard.execCommand failed', errorText(error));
    return false;
  } finally {
    textarea.remove();
  }
}

export async function copyText(text: string): Promise<ClipboardResult> {
  const normalizedText = text.trim();
  if (!normalizedText) {
    return {
      ok: false,
      mode: 'failed',
      imageWritten: false,
      textWritten: false,
      message: '没有可复制的内容',
      error: 'Clipboard text is empty',
    };
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(normalizedText);
      return {
        ok: true,
        mode: 'text-only',
        imageWritten: false,
        textWritten: true,
        message: '已复制文本',
      };
    }
  } catch (error) {
    logger.error('clipboard.writeText failed', errorText(error));
  }

  if (execCommandCopyText(normalizedText)) {
    return {
      ok: true,
      mode: 'text-only',
      imageWritten: false,
      textWritten: true,
      message: '已复制文本',
    };
  }

  const error = 'Text clipboard unavailable';
  logger.error('clipboard text fallback failed', error);
  return {
    ok: false,
    mode: 'failed',
    imageWritten: false,
    textWritten: false,
    message: '复制失败，请手动选择内容',
    error,
  };
}

function canWriteRichClipboard(): boolean {
  return typeof navigator !== 'undefined'
    && Boolean(navigator.clipboard?.write)
    && typeof ClipboardItem !== 'undefined';
}

async function writeClipboardRepresentations(
  data: Record<string, Blob | Promise<Blob>>,
): Promise<void> {
  if (!canWriteRichClipboard()) throw new Error('Rich clipboard API unavailable');
  await navigator.clipboard.write([
    new ClipboardItem(data, { presentationStyle: 'inline' }),
  ]);
}

async function writePngImage(imageBlob: Blob | Promise<Blob>): Promise<void> {
  if (!canWriteRichClipboard()) throw new Error('Image clipboard API unavailable');
  if (typeof ClipboardItem.supports === 'function' && !ClipboardItem.supports('image/png')) {
    throw new Error('PNG clipboard format unsupported');
  }
  const validatePng = (blob: Blob): Blob => {
    if (blob.size === 0 || blob.type !== 'image/png') {
      throw new Error('Clipboard image must be a non-empty PNG');
    }
    return blob;
  };

  if (imageBlob instanceof Blob) {
    const pngBlob = validatePng(imageBlob);
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
    return;
  }

  const pngPromise = Promise.resolve(imageBlob).then(validatePng);
  try {
    // Safari needs the ClipboardItem to be created before async image work
    // finishes so that the write remains associated with the click gesture.
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngPromise })]);
  } catch (promiseError) {
    // Chromium works more reliably with a resolved Blob. This second path is
    // especially important when the image was still being prepared on click.
    const pngBlob = await pngPromise;
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
    } catch (blobError) {
      throw new Error(
        `Promise write failed: ${errorText(promiseError)}; Blob write failed: ${errorText(blobError)}`,
      );
    }
  }
}

/**
 * Writes only PNG binary data. This intentionally has no text or URL fallback:
 * callers using an "image" action must never report a copied link as success.
 */
export async function copyPngBlob(options: CopyPngOptions): Promise<ClipboardResult> {
  const mode: ClipboardMode = options.containsText ? 'image-with-text' : 'image-only';
  try {
    logger.info(`clipboard capabilities secure=${typeof window !== 'undefined' ? window.isSecureContext : false} write=${typeof navigator !== 'undefined' && Boolean(navigator.clipboard?.write)} item=${typeof ClipboardItem !== 'undefined'}`);
    await writePngImage(options.imageBlob);
    return {
      ok: true,
      mode,
      imageWritten: true,
      textWritten: false,
      message: options.containsText ? '已复制图文图片' : '已复制图片',
    };
  } catch (error) {
    const reason = errorText(error);
    logger.error('clipboard strict PNG write failed', reason);
    const message = typeof window !== 'undefined' && !window.isSecureContext
      ? '当前页面不是安全上下文，图片复制需要 HTTPS'
      : !canWriteRichClipboard()
        ? '当前浏览器或内嵌环境不支持图片剪贴板，请在外部 Chrome 或 Edge 中打开'
        : /Image request|not an image|empty|decode|Canvas|Composite/iu.test(reason)
          ? '素材图片读取或 PNG 转换失败，请稍后重试'
          : '图片剪贴板写入被浏览器拒绝，请确认页面位于前台后重试';
    return {
      ok: false,
      mode: 'failed',
      imageWritten: false,
      textWritten: false,
      message,
      error: reason,
    };
  }
}

function richMessage(mode: ClipboardMode, hasText: boolean): string {
  if (mode === 'image-with-text') return '已复制图文图片';
  if (mode === 'image-only') return '已复制图片';
  if (mode === 'html-with-image') return '已复制图文，粘贴效果取决于目标应用';
  if (mode === 'text-with-image-link') return '已复制话术和图片链接，图片未能直接写入';
  return '已复制话术，图片请手动保存';
}

export async function copyRichContent(
  options: RichClipboardOptions,
): Promise<ClipboardResult> {
  const imageUrls = normalizeUrls(options.imageUrl);
  const fallbackText = buildFallbackText(options, imageUrls);
  const html = options.html?.trim() || buildClipboardHtml(fallbackText, imageUrls);
  const errors: string[] = [];

  if (options.imageBlob) {
    try {
      // ClipboardItem is constructed before awaiting the image promise so the
      // browser still sees this operation inside the original click gesture.
      await writePngImage(options.imageBlob);
      const mode: ClipboardMode = options.imageContainsText
        ? 'image-with-text'
        : 'image-only';
      return {
        ok: true,
        mode,
        imageWritten: true,
        textWritten: Boolean(options.imageContainsText && options.plainText?.trim()),
        message: richMessage(mode, Boolean(options.plainText?.trim())),
      };
    } catch (error) {
      const reason = errorText(error);
      errors.push(`image: ${reason}`);
      logger.error('clipboard image write failed', reason);
    }
  }

  if (imageUrls.length && canWriteRichClipboard()) {
    try {
      await writeClipboardRepresentations({
        'text/html': new Blob([html], { type: 'text/html;charset=utf-8' }),
        'text/plain': new Blob([fallbackText], { type: 'text/plain;charset=utf-8' }),
      });
      return {
        ok: true,
        mode: 'html-with-image',
        imageWritten: false,
        textWritten: Boolean(fallbackText),
        message: richMessage('html-with-image', Boolean(options.plainText?.trim())),
        error: errors.join(' | ') || undefined,
      };
    } catch (error) {
      const reason = errorText(error);
      errors.push(`html: ${reason}`);
      logger.error('clipboard HTML fallback failed', reason);
    }
  }

  const textResult = await copyText(fallbackText || options.plainText || '');
  if (textResult.ok) {
    const mode: ClipboardMode = imageUrls.length ? 'text-with-image-link' : 'text-only';
    return {
      ok: true,
      mode,
      imageWritten: false,
      textWritten: true,
      message: richMessage(mode, Boolean(options.plainText?.trim())),
      error: errors.join(' | ') || undefined,
    };
  }

  const error = [...errors, textResult.error].filter(Boolean).join(' | ');
  logger.error('clipboard all strategies failed', error);
  return {
    ok: false,
    mode: 'failed',
    imageWritten: false,
    textWritten: false,
    message: '复制失败，请手动选择内容',
    error,
  };
}

export async function copyImage(options: CopyImageOptions): Promise<ClipboardResult> {
  return copyRichContent({
    imageUrl: options.imageUrl,
    imageBlob: options.imageBlob,
    plainText: options.plainText,
    html: options.html,
    title: options.title,
  });
}
