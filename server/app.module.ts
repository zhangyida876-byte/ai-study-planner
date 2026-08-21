import { APP_FILTER } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { PlatformModule } from '@lark-apaas/fullstack-nestjs-core';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { AnnouncementModule } from './modules/announcement/announcement.module';
import { DiagnosisModule } from './modules/diagnosis/diagnosis.module';
import { PlanModule } from './modules/plan/plan.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { PolicyModule } from './modules/policy/policy.module';
import { CaseArchiveModule } from './modules/case-archive/case-archive.module';
import { ViewModule } from './modules/view/view.module';

@Module({
  imports: [
    // 平台 Module，提供平台能力
    PlatformModule.forRoot(),
    // ====== @route-section: business-modules START ======
    AnnouncementModule,
    DiagnosisModule,
    PlanModule,
    KnowledgeModule,
    PolicyModule,
    CaseArchiveModule,
    // ====== @route-section: business-modules END ======

    // ⚠️ @route-order: last
    // ViewModule is the fallback route module, must be registered last.
    ViewModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
