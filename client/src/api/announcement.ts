import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { AnnouncementListResponse } from '@shared/api.interface';

export async function getAnnouncements(): Promise<AnnouncementListResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/announcements',
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取公告列表失败', String(error));
    throw error;
  }
}
