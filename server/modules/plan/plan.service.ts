import { Injectable } from '@nestjs/common';
import type {
  CreatePlanRequest,
  PlanCreateResponse,
  PlanRecord,
  PlanUpdateResponse,
  UpdatePlanRequest,
} from '@shared/api.interface';

@Injectable()
export class PlanService {
  async findOne(id: string): Promise<PlanRecord> {
    return {
      id,
      region: '',
      scores: {},
      policyData: null,
      planReport: null,
      timeline: null,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
  }

  async create(dto: CreatePlanRequest): Promise<PlanCreateResponse> {
    return { id: '', status: 'pending' };
  }

  async update(id: string, dto: UpdatePlanRequest): Promise<PlanUpdateResponse> {
    return { success: true };
  }
}
