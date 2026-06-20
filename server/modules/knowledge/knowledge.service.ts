import { Injectable } from '@nestjs/common';
import type {
  KnowledgePoint,
  KnowledgePointListResponse,
  KnowledgePointSearchResponse,
} from '@shared/api.interface';

@Injectable()
export class KnowledgeService {
  async findAll(params: {
    version?: string;
    subject?: string;
    chapter?: string;
    page: number;
    pageSize: number;
  }): Promise<KnowledgePointListResponse> {
    return { items: [], total: 0 };
  }

  async search(
    keyword: string,
    page: number,
    pageSize: number
  ): Promise<KnowledgePointSearchResponse> {
    return { items: [], total: 0 };
  }

  async findOne(id: string): Promise<KnowledgePoint> {
    return {
      id,
      version: '',
      subject: '',
      chapter: '',
      name: '',
      content: {
        coreKnowledge: '',
        solutionMethods: '',
        commonMistakes: '',
      },
    };
  }
}
