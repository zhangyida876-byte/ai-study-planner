import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';

@Controller('api/knowledge-points')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get('chapters')
  async getChapters(
    @Query('version') version?: string,
    @Query('subject') subject?: string,
    @Query('grade') grade?: string
  ) {
    return this.knowledgeService.getChapters({ version, subject, grade });
  }

  @Get('search')
  async search(
    @Query('keyword') keyword: string,
    @Query('version') version?: string,
    @Query('subject') subject?: string,
    @Query('chapter') chapter?: string,
    @Query('grade') grade?: string,
    @Query('semester') semester?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    return this.knowledgeService.search(
      keyword,
      parseInt(page || '1', 10),
      parseInt(pageSize || '20', 10),
      { version, subject, chapter, grade, semester }
    );
  }

  @Get()
  async findAll(
    @Query('version') version?: string,
    @Query('subject') subject?: string,
    @Query('chapter') chapter?: string,
    @Query('grade') grade?: string,
    @Query('semester') semester?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    return this.knowledgeService.findAll({
      version,
      subject,
      chapter,
      grade,
      semester,
      page: parseInt(page || '1', 10),
      pageSize: parseInt(pageSize || '20', 10),
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.knowledgeService.findOne(id);
  }
}
