import { Controller, Get, Query } from '@nestjs/common';
import { PolicyService } from './policy.service';

@Controller('api/admission-policies')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Get()
  async findAll(
    @Query('region') region?: string,
    @Query('year') year?: string
  ) {
    return this.policyService.findAll(
      region,
      year ? parseInt(year, 10) : undefined
    );
  }
}
