import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { SchoolSearchResponse, AdmissionPolicyListResponse } from '@shared/api.interface';

export async function searchSchools(
  region: string,
  examType?: '小升初' | '中考' | '高考',
): Promise<SchoolSearchResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/admission-policies/schools',
      method: 'GET',
      params: { region, examType },
    });
    return response.data;
  } catch (error) {
    logger.error('搜索学校失败', String(error));
    throw error;
  }
}

export async function getAdmissionPolicies(params: {
  region?: string;
  year?: number;
  examType?: '小升初' | '中考' | '高考';
}): Promise<AdmissionPolicyListResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/admission-policies',
      method: 'GET',
      params,
    });
    return response.data;
  } catch (error) {
    logger.error('获取录取政策失败', String(error));
    throw error;
  }
}
