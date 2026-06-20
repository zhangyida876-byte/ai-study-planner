import { Injectable } from '@nestjs/common';
import type { AnnouncementListResponse } from '@shared/api.interface';

@Injectable()
export class AnnouncementService {
  async findAll(): Promise<AnnouncementListResponse> {
    return { items: [] };
  }
}
