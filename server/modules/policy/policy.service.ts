import { Injectable } from '@nestjs/common';
import type { AdmissionPolicyListResponse } from '@shared/api.interface';

@Injectable()
export class PolicyService {
  async findAll(
    region?: string,
    year?: number
  ): Promise<AdmissionPolicyListResponse> {
    return { items: [] };
  }
}
