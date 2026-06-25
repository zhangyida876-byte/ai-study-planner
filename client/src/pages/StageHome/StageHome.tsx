import React from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  GraduationCap,
  BookOpen,
  CalendarDays,
  ArrowLeft,
} from 'lucide-react';
import WobblyCard from '@client/src/components/WobblyCard';
import StageProfileEditor from '@client/src/components/StageProfileEditor';
import { Button } from '@/components/ui/button';
import { useRequiredStage } from '@client/src/hooks/use-stage';
import { useStageProfile } from '@client/src/hooks/use-stage-profile';
import { stagePath } from '@client/src/config/stages';

const FEATURE_ICONS = {
  diagnosis: Stethoscope,
  plan: GraduationCap,
  knowledge: BookOpen,
  'study-plan': CalendarDays,
} as const;

const StageHome: React.FC = () => {
  const { stageSlug, stageConfig } = useRequiredStage();
  const { profile, saveProfile, regionText, countdownDays } = useStageProfile(stageSlug);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" className="font-hand mb-2 -ml-2" asChild>
            <Link to="/">
              <ArrowLeft className="mr-1 size-4" />
              返回学段选择
            </Link>
          </Button>
          <h1 className="font-marker text-3xl font-bold text-ink">
            {stageConfig.label}学段
          </h1>
          <p className="font-hand mt-2 text-lg text-ink/60">{stageConfig.subtitle}</p>
        </div>
        <WobblyCard variant="yellow" wobblyIndex={0} hoverable={false} className="min-w-[240px] p-4">
          <p className="font-hand text-xs text-ink/60">本学段重点关注</p>
          <ul className="font-hand mt-2 space-y-1 text-sm">
            {stageConfig.focusPoints.map((point) => (
              <li key={point} className="flex gap-1.5">
                <span className="text-marker-red">•</span>
                {point}
              </li>
            ))}
          </ul>
        </WobblyCard>
      </div>

      <StageProfileEditor
        stageConfig={stageConfig}
        profile={profile}
        onSave={saveProfile}
        countdownDays={countdownDays}
        regionText={regionText}
      />

      <div>
        <h2 className="font-marker mb-4 text-xl font-bold">选择功能模块</h2>
        <p className="font-hand mb-4 text-sm text-muted-foreground">
          上方档案填写后将自动带入以下模块，无需重复填写姓名、地区、年级等基础信息。
        </p>
        <div className="grid gap-5 md:grid-cols-2">
          {stageConfig.features.map((feature, index) => {
            const Icon = FEATURE_ICONS[feature.slug];
            return (
              <WobblyCard
                key={feature.slug}
                variant={index % 2 === 0 ? 'white' : 'yellow'}
                decoration={index === 0 ? 'tape' : index === 1 ? 'tack' : 'none'}
                wobblyIndex={index}
                className="group p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full border-[3px] border-ink bg-card">
                    <Icon className="size-6 text-marker-red" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-marker text-lg font-bold">{feature.label}</h3>
                    <p className="font-hand mt-1 text-sm text-ink/65">{feature.description}</p>
                    <Button asChild className="font-hand mt-4" variant="outline">
                      <Link to={stagePath(stageSlug, feature.slug)}>进入模块</Link>
                    </Button>
                  </div>
                </div>
              </WobblyCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StageHome;
