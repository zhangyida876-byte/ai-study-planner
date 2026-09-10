jest.mock('@lark-apaas/client-toolkit/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn() },
}));

jest.mock('@lark-apaas/client-toolkit/utils/getAxiosForBackend', () => ({
  axiosForBackend: jest.fn(),
}));

import {
  buildCaseMaterialProxyUrl,
  getCaseMaterialCompositePng,
  resolveCaseMaterialImageUrl,
  resolveCaseMaterialStoragePath,
} from '../../client/src/utils/case-material-clipboard';

describe('case material clipboard', () => {
  it('resolves Miaoda storage paths to absolute image URLs', () => {
    const path = '/spark/app/app_4ke0jqzqjy118/runtime/api/v1/storage/object/bucket_x/1.jpg';

    expect(resolveCaseMaterialImageUrl(path, 'https://guanghe.feishuapp.com'))
      .toBe('https://guanghe.feishuapp.com/spark/app/app_4ke0jqzqjy118/runtime/api/v1/storage/object/bucket_x/1.jpg');
  });

  it('routes storage images through the same-origin backend proxy', () => {
    const path = '/spark/app/app_4ke0jqzqjy118/runtime/api/v1/storage/object/bucket_x/1.jpg';

    expect(buildCaseMaterialProxyUrl(path, 'https://guanghe.feishuapp.com'))
      .toBe('https://guanghe.feishuapp.com/api/image-proxy?path=%2Fspark%2Fapp%2Fapp_4ke0jqzqjy118%2Fruntime%2Fapi%2Fv1%2Fstorage%2Fobject%2Fbucket_x%2F1.jpg');
    expect(buildCaseMaterialProxyUrl(
      path,
      'https://guanghe.feishuapp.com',
      '/app/app_4ke0jqzqjy118/middle/materials',
    )).toBe('https://guanghe.feishuapp.com/app/app_4ke0jqzqjy118/api/image-proxy?path=%2Fspark%2Fapp%2Fapp_4ke0jqzqjy118%2Fruntime%2Fapi%2Fv1%2Fstorage%2Fobject%2Fbucket_x%2F1.jpg');
  });

  it('extracts the storage path sent through the authenticated backend client', () => {
    const path = '/spark/app/app_4ke0jqzqjy118/runtime/api/v1/storage/object/bucket_x/1.jpg';

    expect(resolveCaseMaterialStoragePath(
      `https://guanghe.feishuapp.com${path}`,
      'https://guanghe.feishuapp.com',
    )).toBe(path);
  });

  it('rejects empty image packages before reporting copy success', async () => {
    await expect(getCaseMaterialCompositePng({
      imageUrls: [],
      text: '',
      includeText: false,
    })).rejects.toThrow('No images to copy');
  });
});
