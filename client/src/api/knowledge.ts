import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type {
  KnowledgePoint,
  KnowledgePointListResponse,
  KnowledgePointSearchResponse,
  ChapterListResponse,
} from '@shared/api.interface';

export async function getKnowledgePoints(params: {
  version?: string;
  subject?: string;
  chapter?: string;
  grade?: string;
  semester?: string;
  page?: number;
  pageSize?: number;
}): Promise<KnowledgePointListResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/knowledge-points',
      method: 'GET',
      params,
    });
    return response.data;
  } catch (error) {
    logger.error('获取知识点列表失败', String(error));
    throw error;
  }
}

export async function searchKnowledgePoints(
  keyword: string,
  page: number = 1,
  pageSize: number = 20
): Promise<KnowledgePointSearchResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/knowledge-points/search',
      method: 'GET',
      params: { keyword, page, pageSize },
    });
    return response.data;
  } catch (error) {
    logger.error('搜索知识点失败', String(error));
    throw error;
  }
}

export async function searchKnowledgePointsFiltered(params: {
  keyword: string;
  version?: string;
  subject?: string;
  chapter?: string;
  grade?: string;
  semester?: string;
  page: number;
  pageSize: number;
}): Promise<KnowledgePointSearchResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/knowledge-points/search',
      method: 'GET',
      params,
    });
    return response.data;
  } catch (error) {
    logger.error('搜索知识点失败', String(error));
    throw error;
  }
}

export async function getKnowledgePoint(id: string): Promise<KnowledgePoint> {
  try {
    const response = await axiosForBackend({
      url: `/api/knowledge-points/${id}`,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取知识点详情失败', String(error));
    throw error;
  }
}

export async function getChapters(params: {
  version?: string;
  subject?: string;
  grade?: string;
}): Promise<ChapterListResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/knowledge-points/chapters',
      method: 'GET',
      params,
    });
    return response.data;
  } catch (error) {
    logger.error('获取章节列表失败', String(error));
    throw error;
  }
}
