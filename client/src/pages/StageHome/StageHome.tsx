import React from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  GraduationCap,
  BookOpen,
  CalendarDays,
  MessageCircleMore,
  ArrowLeft,
} from 'lucide-react';
import WobblyCard from '@client/src/components/WobblyCard';
import StageProfileEditor from '@client/src/components/StageProfileEditor';
import ObjectionHandlingPanel from '@client/src/components/ObjectionHandlingPanel';
import { Button } from '@/components/ui/button';
import { useRequiredStage } from '@client/src/hooks/use-stage';
import { useStageProfile } from '@client/src/hooks/use-stage-profile';
import { stagePath } from '@client/src/config/stages';

const FEATURE_ICONS = {
  diagnosis: Stethoscope,
  plan: GraduationCap,
  knowledge: BookOpen,
  'study-plan': CalendarDays,
  advice: MessageCircleMore,
} as const;

const StageHome: React.FC = () => {
  const { stageSlug, stageConfig } = useRequiredStage();
  const { profile, saveProfile, regionText, countdownDays } = useStageProfile(stageSlug);

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
          regionText={regionText}
        />
      </section>

      <section className="space-y-3">
        <div>
          <p className="font-hand text-xs font-bold text-marker-red">STEP 2</p>
          <h2 className="font-marker text-xl font-bold">电话异议随查</h2>
          <p className="font-hand mt-1 text-sm text-muted-foreground">
            放在档案下方，方便顾问通话时边看学生信息边查询话术。
          </p>
        </div>
        <ObjectionHandlingPanel compact />
      </section>

      <section className="space-y-3">
        <div>
          <p className="font-hand text-xs font-bold text-marker-red">STEP 3</p>
          <h2 className="font-marker text-xl font-bold">按需进入功能模块</h2>
          <p className="font-hand mt-1 text-sm text-muted-foreground">
            功能模块保留为导航入口，档案已自动带入，老师只需要按当前沟通场景选择进入。
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stageConfig.features.map((feature, index) => {
            const Icon = FEATURE_ICONS[feature.slug];
            return (
              <WobblyCard
                key={feature.slug}
                variant={index % 2 === 0 ? 'white' : 'yellow'}
                decoration={index === 0 ? 'tape' : index === 1 ? 'tack' : 'none'}
                wobblyIndex={index}
                className="group p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full border-[3px] border-ink bg-card">
                    <Icon className="size-5 text-marker-red" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-marker text-base font-bold">{feature.label}</h3>
                    <p className="font-hand mt-1 min-h-10 text-xs text-ink/65">{feature.description}</p>
                    <Button asChild className="font-hand mt-3" variant="outline" size="sm">
                      <Link to={stagePath(stageSlug, feature.slug)}>进入模块</Link>
                    </Button>
                  </div>
                </div>
              </WobblyCard>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default StageHome;
