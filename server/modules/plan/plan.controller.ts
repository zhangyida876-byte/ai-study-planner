import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { PlanService } from './plan.service';
import type { CreatePlanRequest, UpdatePlanRequest } from '@shared/api.interface';

@Controller('api/plan-records')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.planService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreatePlanRequest) {
    return this.planService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePlanRequest) {
    return this.planService.update(id, dto);
  }
}
