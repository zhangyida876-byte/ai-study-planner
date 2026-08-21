import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { CreateCaseArchiveRequest } from '@shared/api.interface';
import { CaseArchiveService } from './case-archive.service';

@Controller('api/case-archives')
export class CaseArchiveController {
  constructor(private readonly caseArchiveService: CaseArchiveService) {}

  @Get()
  async findAll(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('stage') stage?: string,
    @Query('artifactType') artifactType?: string,
  ) {
    return this.caseArchiveService.findAll({
      userId: req.userContext?.userId,
      page: Number.parseInt(page || '1', 10),
      pageSize: Number.parseInt(pageSize || '50', 10),
      search,
      stage,
      artifactType,
    });
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    return this.caseArchiveService.findOne(id, req.userContext?.userId);
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateCaseArchiveRequest) {
    return this.caseArchiveService.create(dto, req.userContext?.userId);
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    return this.caseArchiveService.remove(id, req.userContext?.userId);
  }
}
