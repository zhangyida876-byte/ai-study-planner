import React, { useMemo } from 'react';
import { AlertTriangle, CalendarRange } from 'lucide-react';
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
  const nodes = useMemo(
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
          <h3 id="diagnosis-roadmap-title" className="font-marker text-xl font-bold">备考危机时间轴</h3>
          <p className="font-hand mt-1 text-sm text-ink/60">
            按当前年级和诊断日期展开；考试日期未填写时使用相对节点，最终以学校和当地官方安排为准。
          </p>
        </div>
      </div>

      <div className="relative grid gap-3 lg:grid-cols-5">
        <div className="absolute left-[10%] right-[10%] top-5 hidden border-t-[3px] border-dashed border-pen-blue/35 lg:block" aria-hidden="true" />
        {nodes.map((node, index) => (
          <article key={`${node.period}-${node.title}`} className="relative min-w-0 border-2 border-ink bg-white p-4 shadow-hard-sm">
            <div className="relative z-10 mb-3 flex items-center gap-2">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-[3px] border-ink bg-pen-blue font-marker text-base font-bold text-white">
                {index + 1}
              </span>
              <span className="font-hand text-xs font-bold text-pen-blue">{node.period}</span>
            </div>
            <h4 className="font-marker text-base font-bold">{node.title}</h4>
            <p className="font-hand mt-2 text-sm leading-6 text-ink/80">{node.focus}</p>
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
