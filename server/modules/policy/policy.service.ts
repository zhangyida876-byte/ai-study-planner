import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc } from 'drizzle-orm';
import { admissionPolicy } from '../../database/schema';
import type { AdmissionPolicy, AdmissionPolicyListResponse, AdmissionLine } from '@shared/api.interface';

@Injectable()
export class PolicyService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase
  ) {}

  async findAll(
    region?: string,
    year?: number
  ): Promise<AdmissionPolicyListResponse> {
    const conditions = [];
    if (region) conditions.push(eq(admissionPolicy.region, region));
    if (year) conditions.push(eq(admissionPolicy.year, year));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select()
      .from(admissionPolicy)
      .where(whereClause)
      .orderBy(desc(admissionPolicy.year));

    return {
      items: rows.map((row) => ({
        id: row.id,
        region: row.region,
        year: row.year,
        totalScore: row.totalScore,
        scoreStructure: (row.scoreStructure ?? {}) as Record<string, number>,
        admissionLines: (row.admissionLines ?? []) as AdmissionLine[],
        policyContent: row.policyContent ?? '',
      })),
    };
  }
}
