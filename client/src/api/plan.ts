import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type {
  AdmissionPolicyListResponse,
  CreatePlanRequest,
  PlanCreateResponse,
  PlanRecord,
  PlanUpdateResponse,
  UpdatePlanRequest,
} from '@shared/api.interface';

export async function getAdmissionPolicies(
  region?: string,
  year?: number
): Promise<AdmissionPolicyListResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/admission-policies',
      method: 'GET',
      params: { region, year },
    });
    return response.data;
  } catch (error) {
    logger.error('获取升学政策失败', String(error));
    throw error;
  }
}

export async function createPlanRecord(
  data: CreatePlanRequest
): Promise<PlanCreateResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/plan-records',
      method: 'POST',
      data,
    });
    return response.data;
  } catch (error) {
    logger.error('创建规划记录失败', String(error));
    throw error;
  }
}

export async function getPlanRecord(id: string): Promise<PlanRecord> {
  try {
    const response = await axiosForBackend({
      url: `/api/plan-records/${id}`,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取规划记录详情失败', String(error));
    throw error;
  }
}

export async function updatePlanRecord(
  id: string,
  data: UpdatePlanRequest
): Promise<PlanUpdateResponse> {
  try {
    const response = await axiosForBackend({
      url: `/api/plan-records/${id}`,
      method: 'PATCH',
      data,
    });
    return response.data;
  } catch (error) {
    logger.error('更新规划记录失败', String(error));
    throw error;
  }
}
