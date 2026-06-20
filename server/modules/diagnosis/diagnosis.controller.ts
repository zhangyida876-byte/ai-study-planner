import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { DiagnosisService } from './diagnosis.service';
import type { CreateDiagnosisRequest, UpdateDiagnosisRequest } from '@shared/api.interface';

@Controller('api/diagnosis-records')
export class DiagnosisController {
  constructor(private readonly diagnosisService: DiagnosisService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    return this.diagnosisService.findAll(
      parseInt(page || '1', 10),
      parseInt(pageSize || '20', 10)
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.diagnosisService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateDiagnosisRequest) {
    return this.diagnosisService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateDiagnosisRequest) {
    return this.diagnosisService.update(id, dto);
  }
}
