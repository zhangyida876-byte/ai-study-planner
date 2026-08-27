import React, { useMemo } from 'react';
import { AlertTriangle, CalendarRange, CheckCircle2, Wrench } from 'lucide-react';
import type { EducationStage } from '@client/src/api/plugins';
import { buildDiagnosisTimeline } from '@client/src/utils/diagnosis-timing';

interface DiagnosisRoadmapChartProps {
  grade: string;
  stage: EducationStage;
  examDate?: string;
  prioritySubject?: string;
}

const DiagnosisRoadmapChart: React.FC<DiagnosisRoadmapChartProps> = ({
  grade,
  stage,
  examDate,
  prioritySubject,
}) => {
  const timeline = useMemo(
    () => buildDiagnosisTimeline(grade, stage, examDate, prioritySubject),
    [examDate, grade, prioritySubject, stage],
  );

  return (
    <section aria-labelledby="diagnosis-roadmap-title" className="border-y-2 border-dashed border-ink/15 py-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center border-2 border-ink bg-postit-yellow shadow-hard-sm">
          <CalendarRange className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h3 id="diagnosis-roadmap-title" className="font-marker text-xl font-bold">
            距{timeline.examName}{timeline.daysLeft}天 · 倒推备考路线
          </h3>
          <p className="font-hand mt-1 text-sm text-ink/60">
            从目标考试向前倒推，只保留当前仍来得及执行的时间窗口；最终日期以当地官方安排为准。
          </p>
        </div>
      </div>

      <div className="relative grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="absolute left-[10%] right-[10%] top-5 hidden border-t-[3px] border-dashed border-pen-blue/35 lg:block" aria-hidden="true" />
        {timeline.nodes.map((node, index) => (
          <article key={`${node.period}-${node.title}`} className="relative min-w-0 border-2 border-ink bg-white p-3 shadow-hard-sm">
            <div className="relative z-10 mb-3 flex items-center gap-2">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-[3px] border-ink bg-pen-blue font-marker text-base font-bold text-white">
                {index + 1}
              </span>
              <span className="font-hand text-xs font-bold text-pen-blue">{node.period}</span>
            </div>
            <h4 className="font-marker text-base font-bold">{node.title}</h4>
            <p className="font-hand mt-2 text-sm leading-5 text-ink/75"><strong>症结：</strong>{node.problem}</p>
            <div className="mt-2 flex items-start gap-2 text-ink/80">
              <Wrench className="mt-0.5 size-4 shrink-0 text-pen-blue" aria-hidden="true" />
              <p className="font-hand text-sm leading-5"><strong>动作：</strong>{node.action}</p>
            </div>
            <div className="mt-2 flex items-start gap-2 text-emerald-700">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p className="font-hand text-xs leading-5"><strong>验收：</strong>{node.acceptance}</p>
            </div>
            <div className="mt-3 flex items-start gap-2 border-t-2 border-dashed border-marker-red/25 pt-3 text-marker-red">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p className="font-hand text-xs leading-5">{node.risk}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default DiagnosisRoadmapChart;
