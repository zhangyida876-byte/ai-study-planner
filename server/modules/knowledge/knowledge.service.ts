import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, desc, sql, and, or, ilike } from 'drizzle-orm';
import { knowledgePoint } from '../../database/schema';
import type {
  KnowledgePoint,
  KnowledgePointContent,
  KnowledgePointListResponse,
  KnowledgePointSearchResponse,
  ChapterListResponse,
} from '@shared/api.interface';

@Injectable()
export class KnowledgeService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase
  ) {}

  private buildGradeConditions(grade: string, semester?: string) {
    const conditions: ReturnType<typeof sql>[] = [];
    if (/^[一二三四五六]年级$/.test(grade)) {
      const sem = semester === '上学期' ? '上' : semester === '下学期' ? '下' : null;
      if (sem) {
        conditions.push(sql`${knowledgePoint.chapter} LIKE ${'%' + grade + sem + '册%'}`);
      } else {
        const patterns = [grade + '上', grade + '下'];
        const orConditions = patterns.map((p) => sql`${knowledgePoint.chapter} LIKE ${'%' + p + '%'}`);
        conditions.push(sql`(${sql.join(orConditions, sql` OR `)})`);
      }
    } else if (/^[七八九]年级$/.test(grade)) {
      const sem = semester === '上学期' ? '上' : semester === '下学期' ? '下' : null;
      if (sem) {
        conditions.push(sql`${knowledgePoint.chapter} LIKE ${'%' + grade + sem + '册%'}`);
      } else {
        const patterns = [grade + '上', grade + '下', grade + '全'];
        const orConditions = patterns.map((p) => sql`${knowledgePoint.chapter} LIKE ${'%' + p + '%'}`);
        conditions.push(sql`(${sql.join(orConditions, sql` OR `)})`);
      }
    } else if (/^[高][一二三]$/.test(grade)) {
      const sem = semester === '上学期' ? '上' : semester === '下学期' ? '下' : null;
      if (sem) {
        conditions.push(sql`${knowledgePoint.chapter} LIKE ${'%' + grade + sem + '%'}`);
      } else {
        conditions.push(sql`${knowledgePoint.chapter} LIKE ${'%' + grade + '%'}`);
      }
    }
    return conditions;
  }

  async findAll(params: {
    version?: string;
    subject?: string;
    chapter?: string;
    grade?: string;
    semester?: string;
    page: number;
    pageSize: number;
  }): Promise<KnowledgePointListResponse> {
    const conditions = [];
    if (params.version) conditions.push(eq(knowledgePoint.version, params.version));
    if (params.subject) conditions.push(eq(knowledgePoint.subject, params.subject));
    if (params.chapter) conditions.push(eq(knowledgePoint.chapter, params.chapter));
    if (params.grade) conditions.push(...this.buildGradeConditions(params.grade, params.semester));

    const offset = (params.page - 1) * params.pageSize;
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, countResult] = await Promise.all([
      this.db
        .select({
          id: knowledgePoint.id,
          version: knowledgePoint.version,
          subject: knowledgePoint.subject,
          chapter: knowledgePoint.chapter,
          name: knowledgePoint.name,
        })
        .from(knowledgePoint)
        .where(whereClause)
        .orderBy(desc(knowledgePoint.createdAt))
        .limit(params.pageSize)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(knowledgePoint)
        .where(whereClause),
    ]);

    return {
      items,
      total: countResult[0]?.count ?? 0,
    };
  }

  async search(
    keyword: string,
    page: number,
    pageSize: number,
    filters?: { version?: string; subject?: string; chapter?: string; grade?: string; semester?: string }
  ): Promise<KnowledgePointSearchResponse> {
    const offset = (page - 1) * pageSize;
    const rawTerms = keyword.split(/[,，、\s]+/).filter((t: string) => t.length > 0);
    const expandedTerms: string[] = [];
    for (const term of rawTerms) {
      expandedTerms.push(term);
      if (term.length > 3) {
        for (let len = 2; len <= Math.min(4, term.length); len++) {
          for (let i = 0; i <= term.length - len; i++) {
            expandedTerms.push(term.substring(i, i + len));
          }
        }
      }
    }
    const uniqueTerms = [...new Set(expandedTerms)].filter((t: string) => t.length >= 2);
    const nameMatchCondition = or(
      ...uniqueTerms.map((term: string) =>
        ilike(knowledgePoint.name, `%${term}%`)
      )
    );
    const reverseMatchCondition = or(
      ...rawTerms.map((term: string) =>
        and(
          sql`${term} LIKE '%' || ${knowledgePoint.name} || '%'`,
          sql`LENGTH(${knowledgePoint.name}) >= 2`
        )
      )
    );
    const keywordCondition = or(nameMatchCondition, reverseMatchCondition);
    const conditions: ReturnType<typeof eq>[] = [];
    if (keywordCondition) {
      conditions.push(keywordCondition);
    }
    if (filters?.version) conditions.push(eq(knowledgePoint.version, filters.version));
    if (filters?.subject) conditions.push(eq(knowledgePoint.subject, filters.subject));
    if (filters?.chapter) conditions.push(eq(knowledgePoint.chapter, filters.chapter));
    if (filters?.grade) conditions.push(...this.buildGradeConditions(filters.grade, filters.semester));
    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [items, countResult] = await Promise.all([
      this.db
        .select({
          id: knowledgePoint.id,
          version: knowledgePoint.version,
          subject: knowledgePoint.subject,
          chapter: knowledgePoint.chapter,
          name: knowledgePoint.name,
        })
        .from(knowledgePoint)
        .where(whereClause)
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(knowledgePoint)
        .where(whereClause),
    ]);

    return {
      items,
      total: countResult[0]?.count ?? 0,
    };
  }

  async getChapters(params: {
    version?: string;
    subject?: string;
    grade?: string;
  }): Promise<ChapterListResponse> {
    const conditions = [];
    if (params.version) conditions.push(eq(knowledgePoint.version, params.version));
    if (params.subject) conditions.push(eq(knowledgePoint.subject, params.subject));
    if (params.grade) {
      const gradePatterns = [
        params.grade,
        params.grade.replace('年级', '年级上'),
        params.grade.replace('年级', '年级下'),
        params.grade.replace('年级', '年级全'),
      ];
      const orConditions = gradePatterns.map((pattern) =>
        sql`${knowledgePoint.chapter} LIKE ${'%' + pattern + '%'}`
      );
      conditions.push(sql`${sql.join(orConditions, sql` OR `)}`);
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await this.db
      .select({
        chapter: knowledgePoint.chapter,
        subject: knowledgePoint.subject,
        count: sql<number>`count(*)::int`,
      })
      .from(knowledgePoint)
      .where(whereClause)
      .groupBy(knowledgePoint.chapter, knowledgePoint.subject)
      .orderBy(knowledgePoint.subject, knowledgePoint.chapter);

    return { items };
  }

  async findOne(id: string): Promise<KnowledgePoint> {
    const rows = await this.db
      .select()
      .from(knowledgePoint)
      .where(eq(knowledgePoint.id, id))
      .limit(1);

    if (!rows.length) {
      throw new Error('知识点不存在');
    }

    const row = rows[0];
    return {
      id: row.id,
      version: row.version,
      subject: row.subject,
      chapter: row.chapter,
      name: row.name,
      content: (row.content ?? {}) as KnowledgePointContent,
    };
  }
}
