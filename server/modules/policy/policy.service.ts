import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, or, desc, ilike } from 'drizzle-orm';
import { admissionPolicy } from '../../database/schema';
import type { AdmissionPolicy, AdmissionPolicyListResponse, AdmissionLine, SchoolSearchResponse, SchoolInfo } from '@shared/api.interface';

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

type PolicyExamType = '小升初' | '中考' | '高考';

function inferPolicyExamTypeFromRow(input: {
  totalScore: number;
  scoreStructure: unknown;
  admissionLines: unknown;
  policyContent: string | null;
}): PolicyExamType | 'unknown' {
  const scoreKeys = Object.keys((input.scoreStructure ?? {}) as Record<string, number>).join(' ');
  const linesText = ((input.admissionLines ?? []) as AdmissionLine[])
    .map((item) => `${item.batch || ''} ${item.school || ''}`)
    .join(' ');
  const text = `${scoreKeys} ${linesText} ${input.policyContent ?? ''}`;

  if (/(高考|本科|专科|大学|学院|专业组|物理类|历史类|位次|投档)/.test(text)) return '高考';
  if (/(中考|普高|会考|中招|统招线|录取分数线)/.test(text)) return '中考';
  if (/(小升初|义务教育|公民同招|划片|摇号|对口直升|入学)/.test(text)) return '小升初';
  if (input.totalScore >= 650) return '中考';
  if (input.totalScore > 0 && input.totalScore <= 400) return '小升初';
  return 'unknown';
}

function matchExamType(
  row: {
    totalScore: number;
    scoreStructure: unknown;
    admissionLines: unknown;
    policyContent: string | null;
  },
  examType?: string,
): boolean {
  if (!examType) return true;
  const inferred = inferPolicyExamTypeFromRow(row);
  if (examType === '小升初') return inferred === '小升初';
  if (examType === '中考') return inferred === '中考';
  if (examType === '高考') return inferred === '高考';
  return true;
}

@Injectable()
export class PolicyService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase
  ) {}

  async findAll(
    region?: string,
    year?: number,
    examType?: string,
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

      const matchedRows = rows.filter((row) => matchExamType(row, examType));
      if (matchedRows.length > 0) return this.mapRows(matchedRows);

      const fallbackRows = await this.db
        .select()
        .from(admissionPolicy)
        .where(or(...regionConditions))
        .orderBy(desc(admissionPolicy.year));

      return this.mapRows(fallbackRows.filter((row) => matchExamType(row, examType)));
    }

    const rows = await this.db
      .select()
      .from(admissionPolicy)
      .where(eq(admissionPolicy.year, year!))
      .orderBy(desc(admissionPolicy.year));

    return this.mapRows(rows.filter((row) => matchExamType(row, examType)));
  }

  async searchSchools(region: string, examType?: string): Promise<SchoolSearchResponse> {
    if (!region) return { schools: [], totalScore: 0, year: 2025 };

    const parts = region.split(' ').filter(Boolean);
    const city = parts.length > 1 ? parts[parts.length - 1] : parts[0];
    const province = parts.length > 1 ? parts[0] : '';

    const regionCandidates: string[] = [city];
    if (province) {
      const capital = PROVINCE_CAPITALS[province.replace('省', '').replace('市', '')];
      if (capital && capital !== city) regionCandidates.push(capital);
    }

    const conditions = regionCandidates.map((r) => eq(admissionPolicy.region, r));
    conditions.push(ilike(admissionPolicy.region, `%${city}%`));

    const rows = await this.db
      .select()
      .from(admissionPolicy)
      .where(or(...conditions))
      .orderBy(desc(admissionPolicy.year))
      .limit(5);
    const matchedRows = rows.filter((row) => matchExamType(row, examType));

    const schoolMap = new Map<string, SchoolInfo>();
    let totalScore = 0;
    let year = 2025;

    for (const row of matchedRows) {
      if (!totalScore && row.totalScore) totalScore = row.totalScore;
      if (row.year > year) year = row.year;
      const lines = (row.admissionLines ?? []) as AdmissionLine[];
      for (const line of lines) {
        if (line.school && !schoolMap.has(line.school)) {
          schoolMap.set(line.school, {
            name: line.school,
            score: line.score,
            batch: line.batch || '统招',
          });
        }
      }
    }

    const schools = [...schoolMap.values()].sort((a, b) => b.score - a.score);
    return { schools, totalScore, year };
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
