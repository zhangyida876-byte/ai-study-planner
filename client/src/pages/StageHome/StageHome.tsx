import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import WobblyCard from '@client/src/components/WobblyCard';
import StageProfileEditor from '@client/src/components/StageProfileEditor';
import ObjectionHandlingPanel from '@client/src/components/ObjectionHandlingPanel';
import { Button } from '@/components/ui/button';
import { useRequiredStage } from '@client/src/hooks/use-stage';
import { useStageProfile } from '@client/src/hooks/use-stage-profile';

const StageHome: React.FC = () => {
  const { stageSlug, stageConfig } = useRequiredStage();
  const { profile, saveProfile, countdownDays } = useStageProfile(stageSlug);

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
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
        <WobblyCard variant="yellow" wobblyIndex={0} hoverable={false} className="p-4">
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

      <section className="space-y-3">
        <div>
          <p className="font-hand text-xs font-bold text-marker-red">STEP 1</p>
          <h2 className="font-marker text-xl font-bold">整理学生档案</h2>
          <p className="font-hand mt-1 text-sm text-muted-foreground">
            先把姓名、年级、地区、成绩和目标院校整理清楚，后续模块都会自动带入。
          </p>
        </div>
        <StageProfileEditor
          stageConfig={stageConfig}
          profile={profile}
          onSave={saveProfile}
          countdownDays={countdownDays}
        />
      </section>

      <section className="space-y-3">
        <div>
          <p className="font-hand text-xs font-bold text-marker-red">STEP 2</p>
          <h2 className="font-marker text-xl font-bold">电话异议随查</h2>
          <p className="font-hand mt-1 text-sm text-muted-foreground">
            放在档案下方便于通话时随查；话术百宝库里也有同一套「异议处理｜随查随打」。
          </p>
        </div>
        <ObjectionHandlingPanel compact />
      </section>
    </div>
  );
};

export default StageHome;
