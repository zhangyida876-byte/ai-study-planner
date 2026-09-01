jest.mock('@lark-apaas/client-toolkit/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn() },
}));

import {
  buildClipboardHtml,
  buildClipboardPlainText,
  copyRichContent,
  copyText,
} from '../../client/src/utils/clipboard';

describe('clipboard fallbacks', () => {
  const imageUrl = 'https://guanghe.feishuapp.com/spark/app/example/image.png';
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const originalClipboardItem = Object.getOwnPropertyDescriptor(globalThis, 'ClipboardItem');

  function restoreClipboardGlobals(): void {
    if (originalNavigator) {
      Object.defineProperty(globalThis, 'navigator', originalNavigator);
    } else {
      Reflect.deleteProperty(globalThis, 'navigator');
    }
    if (originalClipboardItem) {
      Object.defineProperty(globalThis, 'ClipboardItem', originalClipboardItem);
    } else {
      Reflect.deleteProperty(globalThis, 'ClipboardItem');
    }
  }

  function installClipboardMocks(options: {
    write?: jest.Mock<Promise<void>, [ClipboardItem[]]>;
    writeText?: jest.Mock<Promise<void>, [string]>;
  }): void {
    class MockClipboardItem {
      static supports(type: string): boolean {
        return type === 'image/png';
      }

      constructor(
        public readonly items: Record<string, Blob | Promise<Blob>>,
      ) {}
    }

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        clipboard: {
          write: options.write,
          writeText: options.writeText,
        },
      },
    });
    Object.defineProperty(globalThis, 'ClipboardItem', {
      configurable: true,
      value: MockClipboardItem,
    });
  }

  afterEach(() => {
    restoreClipboardGlobals();
    jest.clearAllMocks();
  });

  it('keeps text and remote image links in rich HTML fallback', () => {
    const html = buildClipboardHtml('家长话术', [imageUrl]);

    expect(html).toContain('家长话术');
    expect(html).toContain(`<img src="${imageUrl}"`);
    expect(html).toContain(`<a href="${imageUrl}">图片1</a>`);
  });

  it('keeps text and absolute image links in plain-text fallback', () => {
    const text = buildClipboardPlainText('家长话术', [imageUrl]);

    expect(text).toContain('家长话术');
    expect(text).toContain('图片链接');
    expect(text).toContain(imageUrl);
  });

  it('uses writeText for the basic copy operation', async () => {
    const writeText = jest.fn<Promise<void>, [string]>().mockResolvedValue();
    installClipboardMocks({ writeText });

    const result = await copyText('学情报告');

    expect(result).toEqual({ ok: true, mode: 'text-only', message: '已复制文本' });
    expect(writeText).toHaveBeenCalledWith('学情报告');
  });

  it('writes a prepared case image as an image-only clipboard item', async () => {
    const write = jest.fn<Promise<void>, [ClipboardItem[]]>().mockResolvedValue();
    installClipboardMocks({ write });

    const result = await copyRichContent({
      title: '案例标题',
      plainText: '家长话术',
      imageUrl,
      imageBlob: Promise.resolve(new Blob(['png'], { type: 'image/png' })),
    });

    expect(result.ok).toBe(true);
    expect(result.mode).toBe('rich-image');
    const clipboardItem = write.mock.calls[0][0][0] as unknown as {
      items: Record<string, Blob | Promise<Blob>>;
    };
    expect(Object.keys(clipboardItem.items)).toEqual(['image/png']);
  });

  it('falls back to HTML and links when binary image writing is blocked', async () => {
    const write = jest.fn<Promise<void>, [ClipboardItem[]]>()
      .mockRejectedValueOnce(new Error('image write blocked'))
      .mockResolvedValueOnce();
    const writeText = jest.fn<Promise<void>, [string]>().mockResolvedValue();
    installClipboardMocks({ write, writeText });

    const result = await copyRichContent({
      title: '案例标题',
      tags: ['初中', '提分'],
      plainText: '家长话术',
      imageUrl,
      imageBlob: Promise.resolve(new Blob(['png'], { type: 'image/png' })),
      sourceUrl: 'https://example.com/source',
    });

    expect(result.ok).toBe(true);
    expect(result.mode).toBe('rich-html');
    expect(result.message).toContain('话术和图片链接');
    expect(write).toHaveBeenCalledTimes(2);
    const fallbackItem = write.mock.calls[1][0][0] as unknown as {
      items: Record<string, Blob | Promise<Blob>>;
    };
    const plainBlob = fallbackItem.items['text/plain'] as Blob;
    const fallbackText = await plainBlob.text();
    expect(fallbackText).toContain('案例：案例标题');
    expect(fallbackText).toContain('标签：初中、提分');
    expect(fallbackText).toContain(imageUrl);
    expect(fallbackText).toContain('https://example.com/source');
    expect(writeText).not.toHaveBeenCalled();
  });

  it('falls back to text and image links when rich APIs are blocked', async () => {
    const write = jest.fn<Promise<void>, [ClipboardItem[]]>()
      .mockRejectedValue(new Error('rich clipboard blocked'));
    const writeText = jest.fn<Promise<void>, [string]>().mockResolvedValue();
    installClipboardMocks({ write, writeText });

    const result = await copyRichContent({
      title: '案例标题',
      plainText: '家长话术',
      imageUrl,
      imageBlob: Promise.resolve(new Blob(['png'], { type: 'image/png' })),
    });

    expect(result.ok).toBe(true);
    expect(result.mode).toBe('text-with-image-link');
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('案例：案例标题'));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining(imageUrl));
  });

  it('copies text and links when ClipboardItem is unavailable in a webview', async () => {
    const writeText = jest.fn<Promise<void>, [string]>().mockResolvedValue();
    installClipboardMocks({ writeText });
    Reflect.deleteProperty(globalThis, 'ClipboardItem');

    const result = await copyRichContent({
      plainText: '家长话术',
      imageUrl,
      imageBlob: Promise.resolve(new Blob(['png'], { type: 'image/png' })),
    });

    expect(result.ok).toBe(true);
    expect(result.mode).toBe('text-with-image-link');
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining(imageUrl));
  });
});
