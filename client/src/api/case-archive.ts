import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  CaseArchiveCreateResponse,
  CaseArchiveDeleteResponse,
  CaseArchiveListResponse,
  CaseArchiveRecord,
  CaseArtifactType,
  CreateCaseArchiveRequest,
} from '@shared/api.interface';

export interface CaseArchiveListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  stage?: string;
  artifactType?: CaseArtifactType;
}

export async function getCaseArchives(
  params: CaseArchiveListParams = {},
): Promise<CaseArchiveListResponse> {
  const response = await axiosForBackend({
    url: '/api/case-archives',
    method: 'GET',
    params,
  });
  return response.data;
}

export async function getCaseArchive(id: string): Promise<CaseArchiveRecord> {
  const response = await axiosForBackend({
    url: `/api/case-archives/${id}`,
    method: 'GET',
  });
  return response.data;
}

export async function createCaseArchive(
  data: CreateCaseArchiveRequest,
): Promise<CaseArchiveCreateResponse> {
  const response = await axiosForBackend({
    url: '/api/case-archives',
    method: 'POST',
    data,
  });
  return response.data;
}

export async function deleteCaseArchive(id: string): Promise<CaseArchiveDeleteResponse> {
  const response = await axiosForBackend({
    url: `/api/case-archives/${id}`,
    method: 'DELETE',
  });
  return response.data;
}
