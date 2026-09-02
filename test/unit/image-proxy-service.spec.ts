import { BadRequestException } from '@nestjs/common';
import {
  buildStorageObjectUrl,
  ImageProxyService,
} from '../../server/modules/image-proxy/image-proxy.service';

describe('ImageProxyService', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('only accepts the current application storage path', () => {
    expect(buildStorageObjectUrl(
      '/spark/app/app_4ke0jqzqjy118/runtime/api/v1/storage/object/bucket_x/1.jpg',
      'https://guanghe.feishuapp.com',
    )).toBe('https://guanghe.feishuapp.com/spark/app/app_4ke0jqzqjy118/runtime/api/v1/storage/object/bucket_x/1.jpg');

    expect(() => buildStorageObjectUrl('https://example.com/private')).toThrow(BadRequestException);
    expect(() => buildStorageObjectUrl('/spark/app/app_4ke0jqzqjy118/runtime/api/v1/storage/object/../secret')).toThrow(BadRequestException);
  });

  it('returns a non-empty image blob and forwards authentication headers', async () => {
    const fetchMock = jest.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { 'content-type': 'image/jpeg' },
    }));
    globalThis.fetch = fetchMock;
    const service = new ImageProxyService();

    const result = await service.fetchStorageImage({
      path: '/spark/app/app_4ke0jqzqjy118/runtime/api/v1/storage/object/bucket_x/1.jpg',
      cookie: 'session=test',
      authorization: 'Bearer test',
    });

    expect(result.contentType).toBe('image/jpeg');
    expect(result.body.byteLength).toBe(3);
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect((request.headers as Headers).get('cookie')).toBe('session=test');
    expect((request.headers as Headers).get('authorization')).toBe('Bearer test');
  });

  it('rejects login HTML instead of passing it to the clipboard pipeline', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(new Response('<html>login</html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    }));
    const service = new ImageProxyService();

    await expect(service.fetchStorageImage({
      path: '/spark/app/app_4ke0jqzqjy118/runtime/api/v1/storage/object/bucket_x/1.jpg',
    })).rejects.toThrow('素材地址返回的不是图片');
  });
});
