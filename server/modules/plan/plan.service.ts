import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq } from 'drizzle-orm';
import { planRecord } from '../../database/schema';
import type {
  CreatePlanRequest,
  PlanCreateResponse,
  PlanRecord,
  PlanUpdateResponse,
  UpdatePlanRequest,
  TimelineNode,
} from '@shared/api.interface';

@Injectable()
export class PlanService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase
  ) {}

  async findOne(id: string): Promise<PlanRecord> {
    const rows = await this.db
      .select()
      .from(planRecord)
      .where(eq(planRecord.id, id))
      .limit(1);

    if (!rows.length) {
      throw new Error('规划记录不存在');
    }

    const row = rows[0];
    return {
      id: row.id,
      region: row.region,
      scores: (row.scores ?? {}) as Record<string, number>,
      policyData: row.policyData as Record<string, unknown> | null,
      planReport: row.planReport,
      timeline: row.timeline as TimelineNode[] | null,
      status: row.status as 'pending' | 'generating' | 'completed' | 'failed',
      createdAt: row.createdAt.toISOString(),
    };
  }

  async create(dto: CreatePlanRequest): Promise<PlanCreateResponse> {
    const rows = await this.db
      .insert(planRecord)
      .values({
        region: dto.region,
        scores: dto.scores,
        status: 'pending',
      })
      .returning({ id: planRecord.id });

    return {
      id: rows[0].id,
      status: 'pending',
    };
  }

  async update(id: string, dto: UpdatePlanRequest): Promise<PlanUpdateResponse> {
    await this.db
      .update(planRecord)
      .set({
        ...(dto.planReport !== undefined && { planReport: dto.planReport }),
        ...(dto.timeline !== undefined && { timeline: dto.timeline }),
        status: dto.status,
        updatedAt: new Date(),
      })
      .where(eq(planRecord.id, id));

    return { success: true };
  }
}
