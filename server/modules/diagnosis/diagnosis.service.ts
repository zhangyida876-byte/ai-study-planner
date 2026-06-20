import { Injectable } from '@nestjs/common';
import type {
  CreateDiagnosisRequest,
  DiagnosisCreateResponse,
  DiagnosisListResponse,
  DiagnosisRecord,
  DiagnosisUpdateResponse,
  UpdateDiagnosisRequest,
} from '@shared/api.interface';

@Injectable()
export class DiagnosisService {
  async findAll(page: number, pageSize: number): Promise<DiagnosisListResponse> {
    return { items: [], total: 0 };
  }

  async findOne(id: string): Promise<DiagnosisRecord> {
    return {
      id,
      grade: '',
      region: '',
      scores: {},
      problemDesc: '',
      report: null,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
  }

  async create(dto: CreateDiagnosisRequest): Promise<DiagnosisCreateResponse> {
    return { id: '', status: 'pending' };
  }

  async update(id: string, dto: UpdateDiagnosisRequest): Promise<DiagnosisUpdateResponse> {
    return { success: true };
  }
}
