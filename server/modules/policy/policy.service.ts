import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, or, desc, ilike } from 'drizzle-orm';
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
    if (!region && !year) {
      return { items: [] };
    }

    if (region) {
      const regionConditions = [eq(admissionPolicy.region, region)];
      const parts = region.split(' ').filter(Boolean);
      if (parts.length > 1) {
        regionConditions.push(eq(admissionPolicy.region, parts[parts.length - 1]));
        regionConditions.push(ilike(admissionPolicy.region, `%${region.replace(/ /g, '%')}%`));
      }

      const conditions = [or(...regionConditions)];
      if (year) conditions.push(eq(admissionPolicy.year, year));

      const rows = await this.db
        .select()
        .from(admissionPolicy)
        .where(and(...conditions))
        .orderBy(desc(admissionPolicy.year));

      if (rows.length > 0) return this.mapRows(rows);

      const fallbackRows = await this.db
        .select()
        .from(admissionPolicy)
        .where(or(...regionConditions))
        .orderBy(desc(admissionPolicy.year));

      return this.mapRows(fallbackRows);
    }

    const rows = await this.db
      .select()
      .from(admissionPolicy)
      .where(eq(admissionPolicy.year, year!))
      .orderBy(desc(admissionPolicy.year));

    return this.mapRows(rows);
  }

  private mapRows(rows: Array<{
    id: string;
    region: string;
    year: number;
    totalScore: number;
    scoreStructure: unknown;
    admissionLines: unknown;
    policyContent: string | null;
  }>): AdmissionPolicyListResponse {
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
