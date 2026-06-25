import React from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  GraduationCap,
  BookOpen,
  CalendarDays,
  ArrowLeft,
  Target,
  MapPin,
  Clock,
} from 'lucide-react';
import WobblyCard from '@client/src/components/WobblyCard';
import { Button } from '@/components/ui/button';
import { useRequiredStage } from '@client/src/hooks/use-stage';
import { stagePath } from '@client/src/config/stages';

const FEATURE_ICONS = {
  diagnosis: Stethoscope,
  plan: GraduationCap,
  knowledge: BookOpen,
  'study-plan': CalendarDays,
} as const;

const StageHome: React.FC = () => {
  const { stageSlug, stageConfig } = useRequiredStage();

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

      <WobblyCard variant="white" decoration="tape" wobblyIndex={1} hoverable={false} className="p-5">
        <p className="font-marker mb-3 text-sm font-bold">学段概览（填写信息后在各功能中完善）</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Target, label: '当前学段', value: stageConfig.label },
            { icon: MapPin, label: '所在地区', value: '请在功能页选择' },
            { icon: GraduationCap, label: stageConfig.targetLabel, value: '请在规划页设定' },
            { icon: Clock, label: `距离${stageConfig.examLabel}`, value: '填写考试日期后显示' },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-lg border-2 border-dashed border-ink/15 bg-accent/20 p-3"
            >
              <div className="flex items-center gap-1.5 text-ink/60">
                <Icon className="size-3.5" />
                <span className="font-hand text-xs">{label}</span>
              </div>
              <p className="font-marker mt-1 text-sm font-bold">{value}</p>
            </div>
          ))}
        </div>
      </WobblyCard>

      <div>
        <h2 className="font-marker mb-4 text-xl font-bold">选择功能模块</h2>
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
