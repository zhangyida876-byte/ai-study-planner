const MAX_COMPOSITE_WIDTH = 1200;
const MAX_COMPOSITE_HEIGHT = 14000;
const IMAGE_GAP = 16;

interface LoadedClipboardImage {
  element: HTMLImageElement;
  width: number;
  height: number;
  objectUrl: string;
}

export type CaseMaterialCopyResult = 'binary' | 'rich-html';

export function resolveCaseMaterialImageUrl(imageUrl: string, origin: string): string {
  return new URL(imageUrl, origin).toString();
}

function escapeClipboardHtml(value: string): string {
  return value
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&#039;');
}

export function buildCaseMaterialClipboardHtml(
  imageUrls: string[],
  text: string,
  includeText: boolean,
): string {
  const paragraphs = includeText && text.trim()
    ? `<p style="line-height:1.7">${escapeClipboardHtml(text).replace(/\n/gu, '<br>')}</p>`
    : '';
  const images = imageUrls
    .map((url: string) => (
      `<img src="${escapeClipboardHtml(url)}" style="display:block;max-width:720px;width:100%;margin:10px 0" />`
    ))
    .join('');
  return `<div>${paragraphs}${images}</div>`;
}

function writeClipboardEventData(html: string, text: string): boolean {
  let copied = false;
  const handleCopy = (event: ClipboardEvent): void => {
    if (!event.clipboardData) return;
    event.clipboardData.setData('text/html', html);
    if (text) event.clipboardData.setData('text/plain', text);
    event.preventDefault();
    copied = true;
  };

  document.addEventListener('copy', handleCopy, { once: true });
  const commandSucceeded = document.execCommand('copy');
  document.removeEventListener('copy', handleCopy);
  return commandSucceeded && copied;
}

function writeRenderedRichClipboard(html: string): boolean {
  const host = document.createElement('div');
  host.contentEditable = 'true';
  host.setAttribute('aria-hidden', 'true');
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.width = '720px';
  host.style.background = '#ffffff';
  host.innerHTML = html;
  document.body.appendChild(host);

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(host);
  selection?.removeAllRanges();
  selection?.addRange(range);
  host.focus();

  try {
    return document.execCommand('copy');
  } finally {
    selection?.removeAllRanges();
    host.remove();
  }
}

function writeCompatibleRichClipboard(html: string, text: string): boolean {
  return writeRenderedRichClipboard(html) || writeClipboardEventData(html, text);
}

async function loadClipboardImage(imageUrl: string): Promise<LoadedClipboardImage> {
  const response = await fetch(imageUrl, {
    credentials: 'include',
    cache: 'force-cache',
  });
  if (!response.ok) throw new Error(`Image request failed: ${response.status}`);
  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) throw new Error('Storage object is not an image');

  const objectUrl = URL.createObjectURL(blob);
  const element = new Image();
  element.decoding = 'async';
  try {
    await new Promise<void>((resolve, reject) => {
      element.onload = () => resolve();
      element.onerror = () => reject(new Error('Image decode failed'));
      element.src = objectUrl;
    });
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }

  return {
    element,
    width: element.naturalWidth,
    height: element.naturalHeight,
    objectUrl,
  };
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob: Blob | null) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas export failed'));
    }, 'image/png');
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Image data URL conversion failed'));
    };
    reader.onerror = () => reject(reader.error || new Error('Image data URL conversion failed'));
    reader.readAsDataURL(blob);
  });
}

async function clipboardContainsImage(): Promise<boolean | null> {
  if (!navigator.clipboard?.read) return null;
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      if (item.types.some((type: string) => type.startsWith('image/'))) return true;
      if (item.types.includes('text/html')) {
        const html = await (await item.getType('text/html')).text();
        if (/<img\b[^>]*src=["']data:image\//iu.test(html)) return true;
      }
    }
    return false;
  } catch {
    return null;
  }
}

async function createCompositePng(imageUrls: string[]): Promise<Blob> {
  const loaded = await Promise.all(imageUrls.map(loadClipboardImage));
  try {
    const widest = Math.max(...loaded.map((image: LoadedClipboardImage) => image.width));
    const naturalHeight = loaded.reduce(
      (total: number, image: LoadedClipboardImage) => total + image.height,
      IMAGE_GAP * Math.max(0, loaded.length - 1),
    );
    const scale = Math.min(
      1,
      MAX_COMPOSITE_WIDTH / widest,
      MAX_COMPOSITE_HEIGHT / naturalHeight,
    );
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(widest * scale));
    canvas.height = Math.max(1, Math.round(naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    let top = 0;
    loaded.forEach((image: LoadedClipboardImage) => {
      const width = Math.round(image.width * scale);
      const height = Math.round(image.height * scale);
      const left = Math.round((canvas.width - width) / 2);
      context.drawImage(image.element, left, top, width, height);
      top += height + Math.round(IMAGE_GAP * scale);
    });
    return await canvasToPng(canvas);
  } finally {
    loaded.forEach((image: LoadedClipboardImage) => URL.revokeObjectURL(image.objectUrl));
  }
}

export async function copyCaseMaterialImages(options: {
  imageUrls: string[];
  text: string;
  includeText: boolean;
}): Promise<CaseMaterialCopyResult> {
  const { imageUrls, text, includeText } = options;
  if (imageUrls.length === 0) throw new Error('No images to copy');
  const absoluteUrls = imageUrls.map((url: string) => (
    resolveCaseMaterialImageUrl(url, window.location.origin)
  ));
  const plainText = includeText ? text : '';

  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    const pngBlob = await createCompositePng(absoluteUrls);
    const embeddedHtml = buildCaseMaterialClipboardHtml(
      [await blobToDataUrl(pngBlob)],
      text,
      includeText,
    );
    if (writeCompatibleRichClipboard(embeddedHtml, plainText)) return 'rich-html';
    throw new Error('Rich clipboard unavailable');
  }

  const pngPromise = createCompositePng(absoluteUrls);
  const embeddedHtmlPromise = pngPromise
    .then(blobToDataUrl)
    .then((dataUrl: string) => buildCaseMaterialClipboardHtml([dataUrl], text, includeText));
  try {
    const clipboardPayload: Record<string, Promise<Blob>> = includeText
      ? {
        'text/html': embeddedHtmlPromise.then(
          (embeddedHtml: string) => new Blob([embeddedHtml], { type: 'text/html' }),
        ),
      }
      : { 'image/png': pngPromise };
    await navigator.clipboard.write([
      new ClipboardItem(clipboardPayload, { presentationStyle: 'inline' }),
    ]);
    const verified = await clipboardContainsImage();
    if (verified === false) throw new Error('Clipboard write did not contain image data');
    return 'binary';
  } catch (error) {
    const embeddedHtml = await embeddedHtmlPromise;
    if (writeCompatibleRichClipboard(embeddedHtml, plainText)) return 'rich-html';
    throw error;
  }
}
