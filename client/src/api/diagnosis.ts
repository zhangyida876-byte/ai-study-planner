import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type {
  CreateDiagnosisRequest,
  DiagnosisCreateResponse,
  DiagnosisListResponse,
  DiagnosisRecord,
  DiagnosisUpdateResponse,
  UpdateDiagnosisRequest,
} from '@shared/api.interface';

export async function getDiagnosisRecords(
  page: number = 1,
  pageSize: number = 20
): Promise<DiagnosisListResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/diagnosis-records',
      method: 'GET',
      params: { page, pageSize },
    });
    return response.data;
  } catch (error) {
    logger.error('获取诊断记录列表失败', String(error));
    throw error;
  }
}

export async function getDiagnosisRecord(id: string): Promise<DiagnosisRecord> {
  try {
    const response = await axiosForBackend({
      url: `/api/diagnosis-records/${id}`,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取诊断记录详情失败', String(error));
    throw error;
  }
}

export async function createDiagnosisRecord(
  data: CreateDiagnosisRequest
): Promise<DiagnosisCreateResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/diagnosis-records',
      method: 'POST',
      data,
    });
    return response.data;
  } catch (error) {
    logger.error('创建诊断记录失败', String(error));
    throw error;
  }
}

export async function updateDiagnosisRecord(
  id: string,
  data: UpdateDiagnosisRequest
): Promise<DiagnosisUpdateResponse> {
  try {
    const response = await axiosForBackend({
      url: `/api/diagnosis-records/${id}`,
      method: 'PATCH',
      data,
    });
    return response.data;
  } catch (error) {
    logger.error('更新诊断记录失败', String(error));
    throw error;
  }
}
