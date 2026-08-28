import React, { useMemo } from 'react';
import { ArrowLeft, BookOpenCheck, Brain, Eye, ListChecks, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WobblyCard from '@client/src/components/WobblyCard';
import type { StageSlug } from '@client/src/config/stages';
import {
  getSemesterSubjectInsight,
  getSemesterSubjectInsights,
} from '@client/src/config/semester-subject-insights';

interface SemesterSubjectInsightsPanelProps {
  stageSlug: StageSlug;
  grade: string;
  semester: string;
  subject: string;
  onSubjectChange: (subject: string) => void;
}

const displaySubject = (subject: string): string => subject === '政治' ? '道法' : subject;

const SemesterSubjectInsightsPanel: React.FC<SemesterSubjectInsightsPanelProps> = ({
  stageSlug,
  grade,
  semester,
  subject,
  onSubjectChange,
}) => {
  const allInsights = useMemo(
    () => getSemesterSubjectInsights(stageSlug, grade, semester),
    [grade, semester, stageSlug],
  );
  const selected = useMemo(
    () => subject === '__all__' ? undefined : getSemesterSubjectInsight(stageSlug, grade, semester, subject),
    [grade, semester, stageSlug, subject],
  );

  if (!grade || !semester) {
    return (
      <WobblyCard hoverable={false} wobblyIndex={1} className="mb-6 p-5">
        <div className="flex items-center gap-3">
          <BookOpenCheck className="size-6 text-pen-blue" />
          <div>
            <h2 className="font-marker text-xl font-bold">学期全科画像</h2>
            <p className="font-hand text-sm text-ink/60">选择年级和学期，即可查看各科重难点、易错点、卡点和家长应对动作。</p>
          </div>
        </div>
      </WobblyCard>
    );
  }

  if (allInsights.length === 0) {
    return (
      <WobblyCard hoverable={false} wobblyIndex={1} className="mb-6 p-5">
        <h2 className="font-marker text-xl font-bold">{grade}{semester} · 学期画像</h2>
        <p className="font-hand mt-2 text-sm text-ink/60">当前学段的结构已预留，详细本地教研内容正在补充；可先使用下方单知识点查询。</p>
      </WobblyCard>
    );
  }

  if (selected) {
    return (
      <WobblyCard hoverable={false} wobblyIndex={1} className="mb-6 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-dashed border-ink/15 pb-4">
          <div>
            <p className="font-hand text-xs font-bold text-marker-red">{selected.grade}{selected.semester} · 学科深度分析</p>
            <h2 className="font-marker text-2xl font-bold">{displaySubject(selected.subject)}</h2>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => onSubjectChange('__all__')}>
            <ArrowLeft className="mr-1 size-4" />返回全科画像
          </Button>
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="border-2 border-dashed border-ink/20 bg-postit-yellow/25 p-4">
            <h3 className="font-marker mb-2 flex items-center gap-2 font-bold"><Brain className="size-4 text-pen-blue" />年龄段与学习节奏</h3>
            {[...selected.agePsychology, ...selected.learningTraits].map((item) => <p key={item} className="font-hand mb-1 text-sm leading-6">• {item}</p>)}
          </div>
          <div className="border-2 border-dashed border-ink/20 bg-white p-4">
            <h3 className="font-marker mb-2 font-bold">本学期科目特点</h3>
            <p className="font-hand text-sm leading-6">{selected.subjectCharacteristics}</p>
            <p className="font-hand mt-2 text-sm"><strong>核心目标：</strong>{selected.coreGoals.join('；')}</p>
          </div>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            ['重难点', selected.keyDifficulties],
            ['高频易错点', selected.commonMistakes],
            ['常见卡点', selected.bottlenecks],
          ].map(([title, items]) => (
            <div key={title as string} className="border-l-4 border-pen-blue bg-accent/45 p-3">
              <h3 className="font-marker mb-2 font-bold">{title as string}</h3>
              {(items as string[]).map((item) => <p key={item} className="font-hand mb-1 text-sm">• {item}</p>)}
            </div>
          ))}
        </section>

        <section className="mt-5">
          <h3 className="font-marker mb-3 flex items-center gap-2 text-lg font-bold"><Eye className="size-5 text-marker-red" />家长看到的现象与真正根因</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse font-hand text-sm">
              <thead><tr className="bg-accent"><th className="border-2 border-ink/20 p-2 text-left">家长能看到什么</th><th className="border-2 border-ink/20 p-2 text-left">背后根因</th><th className="border-2 border-ink/20 p-2 text-left">开学前先做什么</th></tr></thead>
              <tbody>{selected.observablePhenomena.map((phenomenon, index) => <tr key={phenomenon}><td className="border-2 border-ink/15 p-2">{phenomenon}</td><td className="border-2 border-ink/15 p-2">{selected.rootCauses[index] || selected.rootCauses[0]}</td><td className="border-2 border-ink/15 p-2">{selected.openingActions[index] || selected.openingActions[0]}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="border-2 border-dashed border-ink/20 p-4">
            <h3 className="font-marker mb-2 flex items-center gap-2 font-bold"><ListChecks className="size-4 text-pen-blue" />一周行动</h3>
            {selected.weeklyActions.map((item) => <p key={item} className="font-hand mb-1 text-sm">• {item}</p>)}
          </div>
          <div className="border-2 border-dashed border-marker-red/30 bg-marker-red/5 p-4">
            <h3 className="font-marker mb-2 flex items-center gap-2 font-bold"><Route className="size-4 text-marker-red" />洋葱学园承接</h3>
            {selected.onionRecommendations.map((item) => <p key={item} className="font-hand mb-1 text-sm">• {item}</p>)}
          </div>
        </section>
      </WobblyCard>
    );
  }

  const context = allInsights[0];
  return (
    <WobblyCard hoverable={false} wobblyIndex={1} className="mb-6 p-5">
      <div className="mb-4 border-b-2 border-dashed border-ink/15 pb-4">
        <p className="font-hand text-xs font-bold text-marker-red">学期全科画像</p>
        <h2 className="font-marker text-2xl font-bold">{context.grade}{context.semester}</h2>
        <p className="font-hand mt-2 text-sm text-ink/70">{context.learningTraits[0]}；{context.agePsychology[0]}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {allInsights.map((item) => (
          <button
            key={item.subject}
            type="button"
            className="min-h-[190px] border-2 border-ink bg-white p-4 text-left shadow-hard-sm transition-transform hover:-translate-y-1"
            onClick={() => onSubjectChange(item.subject)}
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-marker text-lg font-bold">{displaySubject(item.subject)}</h3>
              <span className="font-hand text-xs text-pen-blue">查看深度分析</span>
            </div>
            <p className="font-hand line-clamp-2 text-sm leading-5 text-ink/75">{item.subjectCharacteristics}</p>
            <p className="font-hand mt-3 text-xs font-bold text-marker-red">容易掉队：</p>
            <p className="font-hand mt-1 line-clamp-2 text-sm">{item.commonMistakes.slice(0, 2).join('；')}</p>
            <p className="font-hand mt-2 line-clamp-2 text-xs text-ink/60">先做：{item.openingActions[0]}</p>
          </button>
        ))}
      </div>
    </WobblyCard>
  );
};

export default SemesterSubjectInsightsPanel;
