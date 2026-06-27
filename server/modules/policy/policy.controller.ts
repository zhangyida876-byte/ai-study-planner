import { Controller, Get, Query } from '@nestjs/common';
import { PolicyService } from './policy.service';

@Controller('api/admission-policies')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Get('schools')
  async searchSchools(
    @Query('region') region?: string,
    @Query('examType') examType?: string,
  ) {
    return this.policyService.searchSchools(region || '', examType);
  }

  @Get()
  async findAll(
    @Query('region') region?: string,
    @Query('year') year?: string,
    @Query('examType') examType?: string,
  ) {
    return this.policyService.findAll(
      region,
      year ? parseInt(year, 10) : undefined,
      examType,
    );
  }
}
