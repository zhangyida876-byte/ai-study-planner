import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';

export async function fetchImageProxyBlob(storagePath: string): Promise<Blob> {
  try {
    const response = await axiosForBackend<Blob>({
      url: '/api/image-proxy',
      method: 'GET',
      params: { path: storagePath },
      responseType: 'blob',
    });
    const blob = response.data;
    if (!(blob instanceof Blob)) {
      throw new Error('Image proxy returned non-Blob data');
    }
    return blob;
  } catch (error) {
    logger.error('读取素材图片代理失败', String(error));
    throw error;
  }
}
