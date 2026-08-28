import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, LibraryBig, MessagesSquare, Stethoscope } from 'lucide-react';
import WobblyCard from '@client/src/components/WobblyCard';
import StageProfileEditor from '@client/src/components/StageProfileEditor';
import { Button } from '@/components/ui/button';
import { useRequiredStage } from '@client/src/hooks/use-stage';
import { useStageProfile } from '@client/src/hooks/use-stage-profile';
import { stagePath } from '@client/src/config/stages';

const SECTION_ENTRIES = [
  {
    key: 'learning',
    title: '学情类',
    description: '一份报告完成诊断与规划，也可查询学情及知识点',
    feature: 'diagnosis' as const,
    icon: Stethoscope,
  },
  {
    key: 'cases',
    title: '案例类',
    description: '按学段、年级和沟通场景查找真实案例',
    feature: 'materials' as const,
    icon: LibraryBig,
  },
  {
    key: 'scripts',
    title: '话术类',
    description: '集中使用异议处理、每日话术和自定义提问',
    feature: 'scripts' as const,
    icon: MessagesSquare,
  },
];

const StageHome: React.FC = () => {
  const { stageSlug, stageConfig } = useRequiredStage();
  const { profile, saveProfile, countdownDays } = useStageProfile(stageSlug);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
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
          <p className="font-hand mt-1 text-base text-ink/60">{stageConfig.subtitle}</p>
        </div>
        <div className="font-hand flex max-w-xl flex-wrap justify-end gap-1.5 text-xs text-ink/65">
          {stageConfig.focusPoints.map((point) => (
            <span key={point} className="border border-ink/20 bg-postit-yellow px-2 py-1">{point}</span>
          ))}
        </div>
      </div>

      <section className="space-y-2">
        <div>
          <p className="font-hand text-xs font-bold text-marker-red">STEP 1</p>
          <h2 className="font-marker text-xl font-bold">整理学生档案</h2>
          <p className="font-hand mt-0.5 text-sm text-muted-foreground">
            先填写必要信息，目标院校和补充资料均可选填。
          </p>
        </div>
        <StageProfileEditor
          stageConfig={stageConfig}
          profile={profile}
          onSave={saveProfile}
          countdownDays={countdownDays}
        />
      </section>

      <section className="space-y-2">
        <div>
          <p className="font-hand text-xs font-bold text-marker-red">STEP 2</p>
          <h2 className="font-marker text-xl font-bold">选择工作板块</h2>
          <p className="font-hand mt-1 text-sm text-muted-foreground">
            档案已作为后续模块的共用起点，按当前沟通任务进入对应板块。
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {SECTION_ENTRIES.map((entry, index) => {
            const Icon = entry.icon;
            return (
              <WobblyCard key={entry.key} variant="white" wobblyIndex={index + 1} hoverable className="p-4">
                <Link to={stagePath(stageSlug, entry.feature)} className="block space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Icon className="size-6 text-pen-blue" />
                    <ArrowRight className="size-4 text-ink/50" />
                  </div>
                  <div>
                    <h3 className="font-marker text-lg font-bold">{entry.title}</h3>
                    <p className="font-hand mt-1 text-sm leading-relaxed text-muted-foreground">
                      {entry.description}
                    </p>
                  </div>
                </Link>
              </WobblyCard>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default StageHome;
