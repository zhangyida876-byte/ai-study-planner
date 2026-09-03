import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpenCheck,
  Brain,
  CalendarDays,
  Eye,
  GitBranch,
  ListChecks,
} from 'lucide-react';
import { Streamdown } from '@client/src/components/ui/streamdown';
import type { StageSlug } from '@client/src/config/stages';
import {
  getSemesterSubjectInsights,
  type SemesterSubjectInsight,
} from '@client/src/config/semester-subject-insights';
import { resolveAcademicTiming } from '@client/src/utils/academic-phase';

interface DiagnosisSubjectInsightsPanelProps {
  stageSlug: StageSlug;
  grade: string;
  semester: string;
  filledSubjects: string[];
  fallbackContent: string;
}

const normalizeSubject = (subject: string): string => (
  subject === '政治&道法' || subject === '道法' ? '政治' : subject
);

const displaySubject = (subject: string): string => subject === '政治' ? '道法' : subject;

const InsightList: React.FC<{ title: string; items: string[]; icon: React.ReactNode }> = ({
  title,
  items,
  icon,
}) => (
  <div className="min-h-[150px] border-l-4 border-pen-blue bg-accent/40 p-3">
    <h5 className="font-marker mb-2 flex items-center gap-2 font-bold">
      {icon}
      {title}
    </h5>
    {items.slice(0, 4).map((item: string) => (
      <p key={item} className="font-hand mb-1 text-sm leading-5">• {item}</p>
    ))}
  </div>
);

const DiagnosisSubjectInsightsPanel: React.FC<DiagnosisSubjectInsightsPanelProps> = ({
  stageSlug,
  grade,
  semester,
  filledSubjects,
  fallbackContent,
}) => {
  const insights: SemesterSubjectInsight[] = useMemo(
    () => getSemesterSubjectInsights(stageSlug, grade, semester),
    [grade, semester, stageSlug],
  );
  const normalizedFilled: string[] = useMemo(
    () => filledSubjects.map(normalizeSubject),
    [filledSubjects],
  );
  const initialSubject: string = normalizedFilled.find((subject: string) => (
    insights.some((item: SemesterSubjectInsight) => item.subject === subject)
  )) || insights[0]?.subject || '';
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);

  useEffect(() => {
    setSelectedSubject(initialSubject);
  }, [initialSubject]);

  const selected: SemesterSubjectInsight | undefined = insights.find(
    (item: SemesterSubjectInsight) => item.subject === selectedSubject,
  );
  const timing = useMemo(() => resolveAcademicTiming(), []);
  const isFilled = selected ? normalizedFilled.includes(selected.subject) : false;

  if (!selected) {
    return (
      <div className="font-hand text-sm leading-6">
        <Streamdown>{fallbackContent}</Streamdown>
      </div>
    );
  }

  const currentPhase = selected.phaseFocuses.find((phase) => (
    timing.id.includes('opening') ? phase.id === 'opening-week'
      : timing.id.includes('break') ? phase.id === 'before-school'
        : timing.id.includes('midterm') ? phase.id === 'before-midterm'
          : timing.id.includes('final') ? phase.id === 'before-final'
            : phase.id === 'first-month'
  )) || selected.phaseFocuses[0];

  return (
    <section className="border-b-2 border-dashed border-ink/15 py-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center border-2 border-ink bg-white shadow-hard-sm">
          <BookOpenCheck className="size-4 text-pen-blue" />
        </span>
        <div>
          <h3 className="font-marker text-lg font-bold">各科本学期学情解读</h3>
          <p className="font-hand text-xs text-ink/55">切换科目查看共性教研信息；只有已填分数科目参与个性化诊断。</p>
        </div>
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {insights.map((item: SemesterSubjectInsight) => {
          const active = item.subject === selected.subject;
          const participates = normalizedFilled.includes(item.subject);
          return (
            <button
              key={item.subject}
              type="button"
              className={`min-w-[86px] border-2 px-3 py-2 text-left transition-colors ${active ? 'border-ink bg-ink text-white' : 'border-ink/25 bg-white hover:border-pen-blue'}`}
              onClick={() => setSelectedSubject(item.subject)}
            >
              <span className="font-marker block font-bold">{displaySubject(item.subject)}</span>
              <span className={`font-hand mt-0.5 block text-[11px] ${active ? 'text-white/75' : participates ? 'text-pen-blue' : 'text-ink/45'}`}>
                {participates ? '参与诊断' : '共性参考'}
              </span>
            </button>
          );
        })}
      </div>

      {!isFilled && (
        <div className="font-hand mb-4 flex items-start gap-2 border-l-4 border-marker-red bg-marker-red/5 px-3 py-2 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-marker-red" />
          <span>该科未填写分数，以下仅为{grade}{semester}共性学情参考，不参与孩子的个性化诊断、目标差距或升学档位判断。</span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="border-2 border-dashed border-ink/20 bg-postit-yellow/30 p-4">
          <h5 className="font-marker mb-2 flex items-center gap-2 font-bold">
            <CalendarDays className="size-4 text-pen-blue" />当前节点与近期考试
          </h5>
          <p className="font-hand text-sm"><strong>{timing.queryDate} · {timing.phaseLabel}</strong></p>
          <p className="font-hand mt-1 text-sm">最近关注：{timing.nearestAssessment}</p>
          <p className="font-hand mt-2 text-xs text-ink/55">{timing.confidenceNote}</p>
        </section>
        <section className="border-2 border-dashed border-ink/20 bg-white p-4">
          <h5 className="font-marker mb-2 font-bold">{displaySubject(selected.subject)}当前学习重点</h5>
          <p className="font-hand text-sm leading-6">{selected.subjectCharacteristics}</p>
          <p className="font-hand mt-2 text-sm"><strong>本学期必须形成：</strong>{selected.coreGoals.join('；')}</p>
        </section>
      </div>

      <section className="mt-4 border-2 border-dashed border-ink/20 bg-postit-yellow/15 p-4">
        <h5 className="font-marker mb-3 flex items-center gap-2 font-bold">
          <Brain className="size-4 text-pen-blue" />年龄段身心特点与家长边界
        </h5>
        <div className="grid gap-2 font-hand text-sm md:grid-cols-2">
          <p><strong>注意力：</strong>{selected.parentGuidance.attention}</p>
          <p><strong>自主学习：</strong>{selected.parentGuidance.autonomy}</p>
          <p><strong>情绪压力：</strong>{selected.parentGuidance.emotionAndStress}</p>
          <p><strong>监督边界：</strong>{selected.parentGuidance.supervisionBoundary}</p>
        </div>
      </section>

      <section className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InsightList title="当前优先重难点" items={selected.keyDifficulties} icon={<ListChecks className="size-4 text-pen-blue" />} />
        <InsightList title="高频易错点" items={selected.commonMistakes} icon={<AlertTriangle className="size-4 text-marker-red" />} />
        <InsightList title="常见卡点" items={selected.bottlenecks} icon={<Eye className="size-4 text-marker-red" />} />
        <InsightList title="后续学习影响" items={selected.futureImpacts} icon={<GitBranch className="size-4 text-pen-blue" />} />
      </section>

      <section className="mt-4 overflow-x-auto">
        <h5 className="font-marker mb-3 text-base font-bold">家长看到的现象与真正根因</h5>
        <table className="w-full min-w-[680px] border-collapse font-hand text-sm">
          <thead>
            <tr className="bg-accent">
              <th className="border-2 border-ink/20 p-2 text-left">家长看到</th>
              <th className="border-2 border-ink/20 p-2 text-left">背后根因</th>
              <th className="border-2 border-ink/20 p-2 text-left">后续影响</th>
              <th className="border-2 border-ink/20 p-2 text-left">怎么验证</th>
            </tr>
          </thead>
          <tbody>
            {selected.phenomenonCauseLinks.map((link) => (
              <tr key={link.phenomenon}>
                <td className="border-2 border-ink/15 p-2">{link.phenomenon}</td>
                <td className="border-2 border-ink/15 p-2">{link.cause}</td>
                <td className="border-2 border-ink/15 p-2">{link.impact}</td>
                <td className="border-2 border-ink/15 p-2">{link.verification}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-4 border-l-4 border-marker-red bg-marker-red/5 p-3">
        <h5 className="font-marker font-bold">当前阶段共性应对建议</h5>
        <p className="font-hand mt-1 text-sm"><strong>先做：</strong>{currentPhase.parentAction}</p>
        <p className="font-hand mt-1 text-sm"><strong>核验：</strong>{currentPhase.checkMethod}</p>
        <p className="font-hand mt-1 text-sm"><strong>有效标准：</strong>{currentPhase.effectiveStandard}</p>
      </section>
    </section>
  );
};

export default DiagnosisSubjectInsightsPanel;
