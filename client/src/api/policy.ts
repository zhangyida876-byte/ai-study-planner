import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { SchoolSearchResponse, AdmissionPolicyListResponse } from '@shared/api.interface';

export async function searchSchools(region: string): Promise<SchoolSearchResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/admission-policies/schools',
      method: 'GET',
      params: { region },
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
