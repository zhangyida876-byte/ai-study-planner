jest.mock('@lark-apaas/client-toolkit/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn() },
}));

import {
  buildClipboardHtml,
  buildClipboardPlainText,
  copyPngImage,
  copyRichContent,
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

  it('keeps both text and remote image links in rich HTML fallback', () => {
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

  it('escapes untrusted text and URL attributes in HTML fallback', () => {
    const html = buildClipboardHtml('<建议>', ['https://example.com/a.png?x=1&y=2']);

    expect(html).toContain('&lt;建议&gt;');
    expect(html).toContain('x=1&amp;y=2');
  });

  it('writes case images as PNG-only clipboard items', async () => {
    const write = jest.fn<Promise<void>, [ClipboardItem[]]>().mockResolvedValue();
    installClipboardMocks({ write });

    const result = await copyPngImage(
      Promise.resolve(new Blob(['png'], { type: 'image/png' })),
      '已复制案例图片',
    );

    expect(result.copiedImageBinary).toBe(true);
    expect(result.message).toBe('已复制案例图片');
    expect(write).toHaveBeenCalledTimes(1);
    const clipboardItem = write.mock.calls[0][0][0] as unknown as {
      items: Record<string, Blob | Promise<Blob>>;
    };
    expect(Object.keys(clipboardItem.items)).toEqual(['image/png']);
  });

  it('rejects invalid PNG payloads instead of copying a fallback link', async () => {
    const write = jest.fn<Promise<void>, [ClipboardItem[]]>(async (items: ClipboardItem[]) => {
      const clipboardItem = items[0] as unknown as {
        items: Record<string, Blob | Promise<Blob>>;
      };
      await Promise.all(Object.values(clipboardItem.items));
    });
    installClipboardMocks({ write });

    await expect(copyPngImage(
      Promise.resolve(new Blob(['not-png'], { type: 'image/jpeg' })),
    )).rejects.toThrow('Clipboard image must be a non-empty PNG');
    expect(write).toHaveBeenCalledTimes(1);
  });

  it('falls back to HTML with image links when binary image writing fails', async () => {
    const write = jest.fn<Promise<void>, [ClipboardItem[]]>()
      .mockRejectedValueOnce(new Error('image write blocked'))
      .mockResolvedValueOnce();
    const writeText = jest.fn<Promise<void>, [string]>().mockResolvedValue();
    installClipboardMocks({ write, writeText });

    const result = await copyRichContent({
      text: '家长话术',
      imageUrls: [imageUrl],
      imagePng: Promise.resolve(new Blob(['png'], { type: 'image/png' })),
    });

    expect(result.mode).toBe('html-links');
    expect(result.copiedText).toBe(true);
    expect(result.copiedImageBinary).toBe(false);
    expect(result.copiedImageLinks).toBe(true);
    expect(result.message).toContain('已复制话术和图片链接');
    expect(write).toHaveBeenCalledTimes(2);
    expect(writeText).not.toHaveBeenCalled();
  });

  it('falls back to plain text with image links when rich APIs are blocked', async () => {
    const write = jest.fn<Promise<void>, [ClipboardItem[]]>()
      .mockRejectedValue(new Error('rich clipboard blocked'));
    const writeText = jest.fn<Promise<void>, [string]>().mockResolvedValue();
    installClipboardMocks({ write, writeText });

    const result = await copyRichContent({
      text: '家长话术',
      imageUrls: [imageUrl],
      imagePng: Promise.resolve(new Blob(['png'], { type: 'image/png' })),
    });

    expect(result.mode).toBe('text-links');
    expect(result.copiedText).toBe(true);
    expect(result.copiedImageLinks).toBe(true);
    expect(write).toHaveBeenCalledTimes(2);
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining(imageUrl));
  });
});
