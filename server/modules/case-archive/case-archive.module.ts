import { Module } from '@nestjs/common';
import { CaseArchiveController } from './case-archive.controller';
import { CaseArchiveService } from './case-archive.service';

@Module({
  controllers: [CaseArchiveController],
  providers: [CaseArchiveService],
})
export class CaseArchiveModule {}
