import { Injectable } from '@nestjs/common';
import type { AnnouncementListResponse } from '@shared/api.interface';

@Injectable()
export class AnnouncementService {
  async findAll(): Promise<AnnouncementListResponse> {
    return {
      items: [
        {
          id: '1',
          title: '系统上线通知',
          content: '学情顾问系统正式上线，支持学情诊断、升学规划、版本及知识点查询三大核心功能。',
          createdAt: '2026-06-20T00:00:00.000Z',
        },
        {
          id: '2',
          title: '使用小贴士',
          content: '生成诊断报告前，请尽量填写完整的学生各科成绩和学习困扰描述，报告将更精准。',
          createdAt: '2026-06-19T00:00:00.000Z',
        },
        {
          id: '3',
          title: '数据更新说明',
          content: '升学政策和分数线数据已更新至2025年最新版本，覆盖十堰、武汉等主要地区。',
          createdAt: '2026-06-18T00:00:00.000Z',
        },
      ],
    };
  }
}
