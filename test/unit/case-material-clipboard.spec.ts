import {
  copyCaseMaterialImages,
  resolveCaseMaterialImageUrl,
} from '../../client/src/utils/case-material-clipboard';

describe('case material clipboard', () => {
  it('resolves Miaoda storage paths to absolute image URLs', () => {
    const path = '/spark/app/app_4ke0jqzqjy118/runtime/api/v1/storage/object/bucket_x/1.jpg';

    expect(resolveCaseMaterialImageUrl(path, 'https://guanghe.feishuapp.com'))
      .toBe('https://guanghe.feishuapp.com/spark/app/app_4ke0jqzqjy118/runtime/api/v1/storage/object/bucket_x/1.jpg');
  });

  it('fails instead of reporting success when binary image clipboard is unavailable', async () => {
    const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { clipboard: { writeText: jest.fn() } },
    });

    try {
      await expect(copyCaseMaterialImages({
        imageUrls: ['/storage/object/example.png'],
        text: '家长推荐话术',
        includeText: true,
      })).rejects.toThrow('Image clipboard API unavailable');
    } finally {
      if (navigatorDescriptor) {
        Object.defineProperty(globalThis, 'navigator', navigatorDescriptor);
      } else {
        Reflect.deleteProperty(globalThis, 'navigator');
      }
    }
  });

  it('rejects empty image packages before reporting copy success', async () => {
    await expect(copyCaseMaterialImages({
      imageUrls: [],
      text: '',
      includeText: false,
    })).rejects.toThrow('No images to copy');
  });
});
