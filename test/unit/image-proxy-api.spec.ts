jest.mock('@lark-apaas/client-toolkit/logger', () => ({
  logger: { error: jest.fn() },
}));

const axiosForBackendMock = jest.fn();

jest.mock('@lark-apaas/client-toolkit/utils/getAxiosForBackend', () => ({
  axiosForBackend: (...args: unknown[]) => axiosForBackendMock(...args),
}));

import { fetchImageProxyBlob } from '../../client/src/api/image-proxy';

describe('image proxy api', () => {
  it('uses the Miaoda backend client so the request includes platform CSRF headers', async () => {
    const blob = new Blob(['png'], { type: 'image/png' });
    axiosForBackendMock.mockResolvedValueOnce({ data: blob });

    await expect(fetchImageProxyBlob('/spark/app/app_id/runtime/image.png')).resolves.toBe(blob);
    expect(axiosForBackendMock).toHaveBeenCalledWith({
      url: '/api/image-proxy',
      method: 'GET',
      params: { path: '/spark/app/app_id/runtime/image.png' },
      responseType: 'blob',
    });
  });
});
