import React, { useMemo } from 'react';
import { ArrowLeft, BookOpenCheck, Brain, Eye, GitBranch, ListChecks, MessageCircleMore, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WobblyCard from '@client/src/components/WobblyCard';
import type { StageSlug } from '@client/src/config/stages';
import {
  getSemesterSubjectInsight,
  getSemesterSubjectInsights,
} from '@client/src/config/semester-subject-insights';
import { resolveAcademicTiming } from '@client/src/utils/academic-phase';

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
  const timing = useMemo(() => resolveAcademicTiming(), []);
  const useOpeningActions = timing.id.includes('opening') || timing.id.includes('break');
  const currentPhaseId = timing.id.includes('opening')
    ? 'opening-week'
    : timing.id.includes('break')
      ? 'before-school'
      : timing.id.includes('midterm')
        ? 'before-midterm'
        : timing.id.includes('final')
          ? 'before-final'
          : 'first-month';

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

        <div className="font-hand mt-4 border-l-4 border-pen-blue bg-pen-blue/5 px-3 py-2 text-sm">
          {grade ? `已选择${grade}，` : ''}请继续选择学期。完成后可查看各科共性教研参考；本页不依据某个孩子的分数判断升学档位或目标学校差距。
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
    const currentPhase = selected.phaseFocuses.find((phase) => phase.id === currentPhaseId)
      || selected.phaseFocuses[0];
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
            <h3 className="font-marker mb-2 flex items-center gap-2 font-bold"><Brain className="size-4 text-pen-blue" />当前节点与近期考试</h3>
            <p className="font-hand text-sm leading-6"><strong>{timing.queryDate} · {timing.phaseLabel}</strong></p>
            <p className="font-hand mt-1 text-sm leading-6">最近关注：{timing.nearestAssessment}</p>
            {timing.priorityFocus.map((item) => <p key={item} className="font-hand mt-1 text-sm leading-6">• {item}</p>)}
            <p className="font-hand mt-2 text-xs text-ink/55">{timing.confidenceNote}</p>
          </div>
          <div className="border-2 border-dashed border-ink/20 bg-white p-4">
            <h3 className="font-marker mb-2 font-bold">{displaySubject(selected.subject)}当前学习重点</h3>
            <p className="font-hand text-sm leading-6">{selected.subjectCharacteristics}</p>
            <p className="font-hand mt-2 text-sm"><strong>本学期必须形成：</strong>{selected.coreGoals.join('；')}</p>
            <p className="font-hand mt-2 text-sm">
              <strong>当前先做：</strong>
              {currentPhase?.parentAction || selected.openingActions[0] || '先用最近作业核实当前教学进度和主要错因。'}
            </p>
          </div>
        </section>

        <section className="mt-4 border-2 border-dashed border-ink/20 bg-postit-yellow/20 p-4">
          <h3 className="font-marker mb-3 flex items-center gap-2 font-bold"><Brain className="size-4 text-pen-blue" />年龄段身心特点与家长边界</h3>
          <div className="grid gap-2 font-hand text-sm md:grid-cols-2">
            <p><strong>注意力：</strong>{selected.parentGuidance.attention}</p>
            <p><strong>自主学习：</strong>{selected.parentGuidance.autonomy}</p>
            <p><strong>情绪与压力：</strong>{selected.parentGuidance.emotionAndStress}</p>
            <p><strong>监督边界：</strong>{selected.parentGuidance.supervisionBoundary}</p>
          </div>
          <p className="font-hand mt-2 border-l-4 border-marker-red pl-3 text-sm"><strong>本阶段风险：</strong>{selected.parentGuidance.commonRisk}</p>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['当前优先重难点', selected.keyDifficulties.slice(0, useOpeningActions ? 3 : 5)],
            ['高频易错点', selected.commonMistakes],
            ['常见卡点', selected.bottlenecks],
            ['后续学习影响', selected.futureImpacts],
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
              <thead><tr className="bg-accent"><th className="border-2 border-ink/20 p-2 text-left">家长能看到什么</th><th className="border-2 border-ink/20 p-2 text-left">背后根因</th><th className="border-2 border-ink/20 p-2 text-left">后续影响</th><th className="border-2 border-ink/20 p-2 text-left">怎么验证</th></tr></thead>
              <tbody>{selected.phenomenonCauseLinks.map((link) => <tr key={link.phenomenon}><td className="border-2 border-ink/15 p-2">{link.phenomenon}</td><td className="border-2 border-ink/15 p-2">{link.cause}</td><td className="border-2 border-ink/15 p-2">{link.impact}</td><td className="border-2 border-ink/15 p-2">{link.verification}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="mt-5">
          <h3 className="font-marker mb-3 flex items-center gap-2 text-lg font-bold"><ListChecks className="size-5 text-pen-blue" />当前阶段家长最该做什么</h3>
          <div className="grid gap-3 lg:grid-cols-3">
            {selected.phaseFocuses.slice(0, 3).map((phase) => (
              <div key={phase.id} className={`border-2 border-dashed p-3 ${phase.id === currentPhase?.id ? 'border-marker-red bg-marker-red/5' : 'border-ink/20'}`}>
                <h4 className="font-marker font-bold">{phase.label}</h4>
                <p className="font-hand mt-2 text-sm"><strong>做什么：</strong>{phase.parentAction}</p>
                <p className="font-hand mt-1 text-sm"><strong>多久：</strong>{phase.duration}</p>
                <p className="font-hand mt-1 text-sm"><strong>怎么查：</strong>{phase.checkMethod}</p>
                <p className="font-hand mt-1 text-sm"><strong>有效：</strong>{phase.effectiveStandard}</p>
                <p className="font-hand mt-1 text-sm text-marker-red"><strong>不要：</strong>{phase.avoid}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="border-2 border-dashed border-ink/20 p-4">
            <h3 className="font-marker mb-2 flex items-center gap-2 font-bold"><GitBranch className="size-4 text-pen-blue" />跨学科影响</h3>
            {selected.crossSubjectImpacts.length > 0
              ? selected.crossSubjectImpacts.map((link) => <div key={link.ability} className="font-hand mb-3 text-sm leading-6"><p><strong>{link.ability} → {link.relatedSubjects.join('、')}</strong></p><p>{link.mechanism}</p><p className="text-ink/60">家长会看到：{link.observablePhenomenon}</p><p className="text-ink/60">怎么验证：{link.parentAction}</p></div>)
              : <p className="font-hand text-sm text-ink/60">当前没有足够可靠的跨学科关联，不为完整性强行补充。</p>}
          </div>
          <div className="border-2 border-dashed border-marker-red/30 bg-marker-red/5 p-4">
            <h3 className="font-marker mb-2 flex items-center gap-2 font-bold"><Route className="size-4 text-marker-red" />洋葱学园承接</h3>
            {selected.onionRecommendations.map((item) => <p key={item} className="font-hand mb-1 text-sm">• {item}</p>)}
          </div>
        </section>

        <section className="mt-4 border-2 border-dashed border-ink/20 bg-white p-4">
          <h3 className="font-marker mb-2 flex items-center gap-2 font-bold"><MessageCircleMore className="size-4 text-pen-blue" />专业内容转述参考</h3>
          <p className="font-hand mb-2 text-xs text-ink/55">用于解释该年级学科的共性规律，不替代具体孩子的个性化诊断。</p>
          <p className="font-hand text-sm leading-6">
            “这个阶段先别只看孩子作业写没写完。更值得看的是：
            {selected.observablePhenomena[0] || '近期作业和考试中的重复失分'}。
            这通常不是简单粗心，而是
            {selected.rootCauses[0] || '知识、方法或执行环节存在尚未核实的断点'}。
            现在先围绕
            {currentPhase?.learningFocus?.[0] || selected.keyDifficulties[0] || '当前章节'}
            做小范围验证，做到
            {currentPhase?.effectiveStandard || '同类基础题正确率稳定达到 80%'}，再决定要不要加量。”
          </p>
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
        <div className="font-hand mt-2 border-l-[3px] border-marker-red bg-marker-red/5 px-3 py-2 text-sm">
          <strong>{timing.queryDate} · {timing.phaseLabel}</strong>
          <span className="mx-2 text-ink/30">|</span>
          最近关注：<strong>{timing.nearestAssessment}</strong>
          <p className="mt-1 text-xs text-ink/55">当前优先：{timing.priorityFocus.join('；')}。{timing.confidenceNote}</p>
        </div>
        <p className="font-hand mt-2 text-xs text-ink/55">本模块仅提供年级、学期与学科的共性学情，不对具体孩子做升学档位或目标差距判断。</p>
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
            <p className="font-hand mt-3 text-xs font-bold text-marker-red">家长最容易看到：</p>
            <p className="font-hand mt-1 line-clamp-2 text-sm">{item.observablePhenomena.slice(0, 2).join('；')}</p>
            <p className="font-hand mt-2 line-clamp-2 text-xs text-ink/60">核心目标：{item.coreGoals[0]}</p>
          </button>
        ))}
      </div>
    </WobblyCard>
  );
};

export default SemesterSubjectInsightsPanel;
