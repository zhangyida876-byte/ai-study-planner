import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, or, desc, ilike } from 'drizzle-orm';
import { admissionPolicy } from '../../database/schema';
import type { AdmissionPolicy, AdmissionPolicyListResponse, AdmissionLine } from '@shared/api.interface';

const PROVINCE_CAPITALS: Record<string, string> = {
  '北京': '北京', '天津': '天津', '上海': '上海', '重庆': '重庆主城',
  '河北': '石家庄', '山西': '太原', '内蒙古': '呼和浩特',
  '辽宁': '沈阳', '吉林': '长春', '黑龙江': '哈尔滨',
  '江苏': '南京', '浙江': '杭州', '安徽': '合肥',
  '福建': '福州', '江西': '南昌', '山东': '济南',
  '河南': '郑州', '湖北': '武汉', '湖南': '长沙',
  '广东': '广州', '广西': '南宁', '海南': '海口',
  '四川': '成都', '贵州': '贵阳', '云南': '昆明',
  '西藏': '拉萨', '陕西': '西安', '甘肃': '兰州',
  '青海': '西宁', '宁夏': '银川', '新疆': '乌鲁木齐',
};

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
      const capital = PROVINCE_CAPITALS[parts[0]];
      if (capital) {
        regionConditions.push(eq(admissionPolicy.region, capital));
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
