import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import { caseArchive } from '../../database/schema';
import type {
  CaseArchiveCreateResponse,
  CaseArchiveDeleteResponse,
  CaseArchiveListResponse,
  CaseArchiveRecord,
  CaseArtifactType,
  CreateCaseArchiveRequest,
} from '@shared/api.interface';

interface FindAllOptions {
  userId?: string;
  page: number;
  pageSize: number;
  search?: string;
  stage?: string;
  artifactType?: string;
}

@Injectable()
export class CaseArchiveService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private ownerCondition(userId: string): SQL {
    return sql`(${caseArchive.createdBy}).user_id = ${userId}`;
  }

  async findAll(options: FindAllOptions): Promise<CaseArchiveListResponse> {
    if (!options.userId) return { items: [], total: 0 };

    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 50));
    const conditions: SQL[] = [this.ownerCondition(options.userId)];
    const search = options.search?.trim();
    if (search) {
      const searchCondition = or(
        ilike(caseArchive.studentName, `%${search}%`),
        ilike(caseArchive.targetSchool, `%${search}%`),
        ilike(caseArchive.title, `%${search}%`),
      );
      if (searchCondition) conditions.push(searchCondition);
    }
    if (options.stage) conditions.push(eq(caseArchive.stage, options.stage));
    if (options.artifactType) {
      conditions.push(eq(caseArchive.artifactType, options.artifactType));
    }
    const where = and(...conditions);
    const [items, countRows] = await Promise.all([
      this.db
        .select({
          id: caseArchive.id,
          studentName: caseArchive.studentName,
          stage: caseArchive.stage,
          grade: caseArchive.grade,
          region: caseArchive.region,
          targetSchool: caseArchive.targetSchool,
          artifactType: caseArchive.artifactType,
          title: caseArchive.title,
          createdAt: caseArchive.createdAt,
        })
        .from(caseArchive)
        .where(where)
        .orderBy(desc(caseArchive.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(caseArchive)
        .where(where),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        targetSchool: item.targetSchool ?? '',
        artifactType: item.artifactType as CaseArtifactType,
        createdAt: item.createdAt.toISOString(),
      })),
      total: countRows[0]?.count ?? 0,
    };
  }

  async findOne(id: string, userId?: string): Promise<CaseArchiveRecord> {
    if (!userId) throw new NotFoundException('历史记录不存在');
    const rows = await this.db
      .select()
      .from(caseArchive)
      .where(and(eq(caseArchive.id, id), this.ownerCondition(userId)))
      .limit(1);
    if (!rows.length) throw new NotFoundException('历史记录不存在');

    const row = rows[0];
    return {
      id: row.id,
      studentName: row.studentName,
      stage: row.stage,
      grade: row.grade,
      region: row.region,
      targetSchool: row.targetSchool ?? '',
      targetScore: row.targetScore,
      artifactType: row.artifactType as CaseArtifactType,
      title: row.title,
      content: row.content,
      inputSnapshot: (row.inputSnapshot ?? {}) as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async create(
    dto: CreateCaseArchiveRequest,
    userId?: string,
  ): Promise<CaseArchiveCreateResponse> {
    if (!userId) throw new BadRequestException('请先登录后使用自动归档');
    if (!dto.content.trim()) throw new BadRequestException('不能归档空内容');

    const rows = await this.db
      .insert(caseArchive)
      .values({
        studentName: dto.studentName.trim() || '未命名学生',
        stage: dto.stage,
        grade: dto.grade,
        region: dto.region,
        targetSchool: dto.targetSchool?.trim() || null,
        targetScore: dto.targetScore,
        artifactType: dto.artifactType,
        title: dto.title,
        content: dto.content,
        inputSnapshot: dto.inputSnapshot ?? {},
        createdBy: userId,
        updatedBy: userId,
      })
      .returning({ id: caseArchive.id });
    return { id: rows[0].id };
  }

  async remove(id: string, userId?: string): Promise<CaseArchiveDeleteResponse> {
    if (!userId) throw new NotFoundException('历史记录不存在');
    const rows = await this.db
      .delete(caseArchive)
      .where(and(eq(caseArchive.id, id), this.ownerCondition(userId)))
      .returning({ id: caseArchive.id });
    if (!rows.length) throw new NotFoundException('历史记录不存在');
    return { success: true };
  }
}
