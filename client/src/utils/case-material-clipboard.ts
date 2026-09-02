import { logger } from '@lark-apaas/client-toolkit/logger';

const MAX_COMPOSITE_WIDTH = 1200;
const MAX_COMPOSITE_HEIGHT = 14000;
const IMAGE_GAP = 16;
const TEXT_CANVAS_MIN_WIDTH = 720;
const TEXT_PADDING = 36;
const TEXT_LINE_HEIGHT = 40;
const MAX_TEXT_LINES = 18;

interface LoadedClipboardImage {
  element: HTMLImageElement;
  width: number;
  height: number;
  objectUrl?: string;
}

const compositePngCache = new Map<string, Promise<Blob>>();
const resolvedCompositePngCache = new Map<string, Blob>();
const MAX_COMPOSITE_CACHE_ENTRIES = 36;

export function resolveCaseMaterialImageUrl(imageUrl: string, origin: string): string {
  return new URL(imageUrl, origin).toString();
}

export function buildCaseMaterialProxyUrl(
  imageUrl: string,
  origin: string,
  pathname = '/',
): string {
  const absoluteUrl = new URL(imageUrl, origin);
  const appPrefix = pathname.match(/^\/app\/[^/]+/u)?.[0] || '';
  const proxyUrl = new URL(`${appPrefix}/api/image-proxy`, origin);
  proxyUrl.searchParams.set('path', absoluteUrl.pathname);
  return proxyUrl.toString();
}

async function decodeClipboardImage(src: string, objectUrl?: string): Promise<LoadedClipboardImage> {
  const element = new Image();
  element.decoding = 'async';
  try {
    await new Promise<void>((resolve, reject) => {
      element.onload = () => resolve();
      element.onerror = () => reject(new Error('Image decode failed'));
      element.src = src;
    });
  } catch (error) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    throw error;
  }

  return {
    element,
    width: element.naturalWidth,
    height: element.naturalHeight,
    objectUrl,
  };
}

async function loadClipboardImage(imageUrl: string): Promise<LoadedClipboardImage> {
  const response = await fetch(imageUrl, {
    credentials: 'include',
    cache: 'no-store',
  });
  const contentType = response.headers.get('content-type') || '';
  logger.info(`clipboard image response status=${response.status} type=${contentType || 'unknown'} url=${imageUrl}`);
  if (!response.ok) throw new Error(`Image request failed: ${response.status}`);
  const blob = await response.blob();
  logger.info(`clipboard image blob type=${blob.type || 'unknown'} size=${blob.size}`);
  if (blob.size === 0) throw new Error('Storage object is empty');
  if (!blob.type.startsWith('image/')) {
    throw new Error(`Storage response is not an image: ${blob.type || 'unknown type'}`);
  }
  const objectUrl = URL.createObjectURL(blob);
  return decodeClipboardImage(objectUrl, objectUrl);
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob: Blob | null) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas export failed'));
    }, 'image/png');
  });
}

function wrapCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  text.trim().split(/\n/gu).forEach((paragraph: string) => {
    if (!paragraph) {
      lines.push('');
      return;
    }
    let currentLine = '';
    Array.from(paragraph).forEach((character: string) => {
      const candidate = `${currentLine}${character}`;
      if (currentLine && context.measureText(candidate).width > maxWidth) {
        lines.push(currentLine);
        currentLine = character;
      } else {
        currentLine = candidate;
      }
    });
    if (currentLine) lines.push(currentLine);
  });
  if (lines.length <= MAX_TEXT_LINES) return lines;
  return [...lines.slice(0, MAX_TEXT_LINES - 1), `${lines[MAX_TEXT_LINES - 1]}...`];
}

async function createCompositePng(imageUrls: string[], text = ''): Promise<Blob> {
  const loaded = await Promise.all(imageUrls.map(loadClipboardImage));
  try {
    const widest = Math.max(...loaded.map((image: LoadedClipboardImage) => image.width));
    const naturalImageHeight = loaded.reduce(
      (total: number, image: LoadedClipboardImage) => total + image.height,
      IMAGE_GAP * Math.max(0, loaded.length - 1),
    );
    const canvasWidth = Math.min(
      MAX_COMPOSITE_WIDTH,
      Math.max(widest, text.trim() ? TEXT_CANVAS_MIN_WIDTH : 1),
    );
    const measurementCanvas = document.createElement('canvas');
    const measurementContext = measurementCanvas.getContext('2d');
    if (!measurementContext) throw new Error('Canvas unavailable');
    measurementContext.font = '28px system-ui, sans-serif';
    const textLines = text.trim()
      ? wrapCanvasText(measurementContext, text, canvasWidth - TEXT_PADDING * 2)
      : [];
    const textHeight = textLines.length
      ? TEXT_PADDING * 2 + textLines.length * TEXT_LINE_HEIGHT
      : 0;
    const scale = Math.min(
      1,
      canvasWidth / widest,
      Math.max(1, MAX_COMPOSITE_HEIGHT - textHeight) / naturalImageHeight,
    );
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, canvasWidth);
    canvas.height = Math.max(1, textHeight + Math.round(naturalImageHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (textLines.length) {
      context.fillStyle = '#fffdf4';
      context.fillRect(0, 0, canvas.width, textHeight);
      context.fillStyle = '#2d2d2d';
      context.font = '28px system-ui, sans-serif';
      context.textBaseline = 'top';
      textLines.forEach((line: string, index: number) => {
        context.fillText(line, TEXT_PADDING, TEXT_PADDING + index * TEXT_LINE_HEIGHT);
      });
      context.strokeStyle = '#d8d3c8';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(TEXT_PADDING, textHeight - 1);
      context.lineTo(canvas.width - TEXT_PADDING, textHeight - 1);
      context.stroke();
    }

    let top = textHeight;
    loaded.forEach((image: LoadedClipboardImage) => {
      const width = Math.round(image.width * scale);
      const height = Math.round(image.height * scale);
      const left = Math.round((canvas.width - width) / 2);
      context.drawImage(image.element, left, top, width, height);
      top += height + Math.round(IMAGE_GAP * scale);
    });
    return await canvasToPng(canvas);
  } finally {
    loaded.forEach((image: LoadedClipboardImage) => {
      if (image.objectUrl) URL.revokeObjectURL(image.objectUrl);
    });
  }
}

function getCompositeCacheKey(imageUrls: string[], text: string): string {
  return JSON.stringify([imageUrls, text]);
}

function getCompositePng(imageUrls: string[], text: string): Promise<Blob> {
  const cacheKey = getCompositeCacheKey(imageUrls, text);
  const resolved = resolvedCompositePngCache.get(cacheKey);
  if (resolved) return Promise.resolve(resolved);
  const cached = compositePngCache.get(cacheKey);
  if (cached) return cached;

  const composite = createCompositePng(imageUrls, text)
    .then((blob: Blob) => {
      resolvedCompositePngCache.set(cacheKey, blob);
      return blob;
    })
    .catch((error: unknown) => {
      compositePngCache.delete(cacheKey);
      resolvedCompositePngCache.delete(cacheKey);
      throw error;
    });
  compositePngCache.set(cacheKey, composite);
  if (compositePngCache.size > MAX_COMPOSITE_CACHE_ENTRIES) {
    const oldestKey = compositePngCache.keys().next().value;
    if (typeof oldestKey === 'string') {
      compositePngCache.delete(oldestKey);
      resolvedCompositePngCache.delete(oldestKey);
    }
  }
  return composite;
}

function resolveClipboardOptions(options: {
  imageUrls: string[];
  text: string;
  includeText: boolean;
}): { absoluteUrls: string[]; compositeText: string } {
  return {
    absoluteUrls: options.imageUrls.map((url: string) => (
      buildCaseMaterialProxyUrl(url, window.location.origin, window.location.pathname)
    )),
    compositeText: options.includeText ? options.text : '',
  };
}

export async function prepareCaseMaterialImages(options: {
  imageUrls: string[];
  text: string;
  includeText: boolean;
}): Promise<Blob> {
  if (options.imageUrls.length === 0) throw new Error('No images to copy');
  const { absoluteUrls, compositeText } = resolveClipboardOptions(options);
  return getCompositePng(absoluteUrls, compositeText);
}

export function getCaseMaterialCompositePng(options: {
  imageUrls: string[];
  text: string;
  includeText: boolean;
}): Promise<Blob> {
  const { imageUrls, text, includeText } = options;
  if (imageUrls.length === 0) return Promise.reject(new Error('No images to copy'));

  const { absoluteUrls, compositeText } = resolveClipboardOptions(options);
  return getCompositePng(absoluteUrls, compositeText).then((pngBlob: Blob) => {
    if (pngBlob.size === 0 || pngBlob.type !== 'image/png') {
      throw new Error('Composite image is invalid');
    }
    return pngBlob;
  });
}

export function getPreparedCaseMaterialPng(options: {
  imageUrls: string[];
  text: string;
  includeText: boolean;
}): Blob | Promise<Blob> {
  if (options.imageUrls.length === 0) return Promise.reject(new Error('No images to copy'));
  const { absoluteUrls, compositeText } = resolveClipboardOptions(options);
  const cacheKey = getCompositeCacheKey(absoluteUrls, compositeText);
  return resolvedCompositePngCache.get(cacheKey)
    || getCaseMaterialCompositePng(options);
}

export function peekPreparedCaseMaterialPng(options: {
  imageUrls: string[];
  text: string;
  includeText: boolean;
}): Blob | undefined {
  if (options.imageUrls.length === 0) return undefined;
  const { absoluteUrls, compositeText } = resolveClipboardOptions(options);
  return resolvedCompositePngCache.get(getCompositeCacheKey(absoluteUrls, compositeText));
}
