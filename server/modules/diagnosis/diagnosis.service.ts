import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, desc, sql, and, ilike } from 'drizzle-orm';
import { diagnosisRecord } from '../../database/schema';
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
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase
  ) {}

  async findAll(page: number, pageSize: number): Promise<DiagnosisListResponse> {
    const offset = (page - 1) * pageSize;
    const [items, countResult] = await Promise.all([
      this.db
        .select({
          id: diagnosisRecord.id,
          grade: diagnosisRecord.grade,
          region: diagnosisRecord.region,
          status: diagnosisRecord.status,
          createdAt: diagnosisRecord.createdAt,
        })
        .from(diagnosisRecord)
        .orderBy(desc(diagnosisRecord.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(diagnosisRecord),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        status: item.status as 'pending' | 'generating' | 'completed' | 'failed',
      })),
      total: countResult[0]?.count ?? 0,
    };
  }

  async findOne(id: string): Promise<DiagnosisRecord> {
    const rows = await this.db
      .select()
      .from(diagnosisRecord)
      .where(eq(diagnosisRecord.id, id))
      .limit(1);

    if (!rows.length) {
      throw new Error('诊断记录不存在');
    }

    const row = rows[0];
    return {
      id: row.id,
      grade: row.grade,
      region: row.region,
      scores: (row.scores ?? {}) as Record<string, number>,
      problemDesc: row.problemDesc ?? '',
      report: row.report,
      status: row.status as 'pending' | 'generating' | 'completed' | 'failed',
      createdAt: row.createdAt.toISOString(),
    };
  }

  async create(dto: CreateDiagnosisRequest): Promise<DiagnosisCreateResponse> {
    const rows = await this.db
      .insert(diagnosisRecord)
      .values({
        grade: dto.grade,
        region: dto.region,
        scores: dto.scores,
        problemDesc: dto.problemDesc,
        status: 'pending',
      })
      .returning({ id: diagnosisRecord.id });

    return {
      id: rows[0].id,
      status: 'pending',
    };
  }

  async update(id: string, dto: UpdateDiagnosisRequest): Promise<DiagnosisUpdateResponse> {
    await this.db
      .update(diagnosisRecord)
      .set({
        ...(dto.report !== undefined && { report: dto.report }),
        status: dto.status,
        updatedAt: new Date(),
      })
      .where(eq(diagnosisRecord.id, id));

    return { success: true };
  }
}
