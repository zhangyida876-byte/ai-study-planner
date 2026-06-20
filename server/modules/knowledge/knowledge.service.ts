import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, desc, sql, and, ilike } from 'drizzle-orm';
import { knowledgePoint } from '../../database/schema';
import type {
  KnowledgePoint,
  KnowledgePointContent,
  KnowledgePointListResponse,
  KnowledgePointSearchResponse,
} from '@shared/api.interface';

@Injectable()
export class KnowledgeService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase
  ) {}

  async findAll(params: {
    version?: string;
    subject?: string;
    chapter?: string;
    page: number;
    pageSize: number;
  }): Promise<KnowledgePointListResponse> {
    const conditions = [];
    if (params.version) conditions.push(eq(knowledgePoint.version, params.version));
    if (params.subject) conditions.push(eq(knowledgePoint.subject, params.subject));
    if (params.chapter) conditions.push(eq(knowledgePoint.chapter, params.chapter));

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
    filters?: { version?: string; subject?: string; chapter?: string }
  ): Promise<KnowledgePointSearchResponse> {
    const offset = (page - 1) * pageSize;
    const conditions = [ilike(knowledgePoint.name, `%${keyword}%`)];
    if (filters?.version) conditions.push(eq(knowledgePoint.version, filters.version));
    if (filters?.subject) conditions.push(eq(knowledgePoint.subject, filters.subject));
    if (filters?.chapter) conditions.push(eq(knowledgePoint.chapter, filters.chapter));
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
