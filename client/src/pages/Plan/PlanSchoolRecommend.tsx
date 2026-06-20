import React from 'react';
import { TrendingUp, Target, School } from 'lucide-react';
import type { AdmissionLine } from '@shared/api.interface';

interface PlanSchoolRecommendProps {
  totalScore: number;
  admissionLines: AdmissionLine[];
}

const PlanSchoolRecommend: React.FC<PlanSchoolRecommendProps> = ({
  totalScore,
  admissionLines,
}) => {
  if (admissionLines.length === 0 || totalScore <= 0) return null;

  const sorted = [...admissionLines].sort((a, b) => a.score - b.score);

  const currentSchools = sorted.filter((line) => totalScore >= line.score);
  const targetSchools = sorted.filter((line) => totalScore < line.score);

  const currentBest = currentSchools.length > 0
    ? currentSchools[currentSchools.length - 1]
    : null;

  const targets = targetSchools.slice(0, 3).map((line) => ({
    ...line,
    gap: line.score - totalScore,
  }));

  return (
    <div className="space-y-4">
      {/* Current Score Assessment */}
      <div className="rounded-lg border-[3px] border-emerald-500/40 bg-emerald-500/5 p-4">
        <div className="mb-2 flex items-center gap-2">
          <School className="size-4 text-emerald-600" />
          <span className="font-marker text-sm font-bold text-emerald-700">
            当前成绩可报院校
          </span>
        </div>
        {currentBest ? (
          <div className="font-hand">
            <span className="font-bold text-emerald-700">{currentBest.school}</span>
            <span className="ml-2 text-sm text-ink/60">
              {currentBest.batch} · 录取线 {currentBest.score}分
            </span>
            {totalScore > currentBest.score && (
              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                超出 {totalScore - currentBest.score} 分
              </span>
            )}
          </div>
        ) : (
          <div className="font-hand text-sm text-ink/60">
            当前成绩暂未达到已知录取线，建议重点提升
          </div>
        )}
      </div>

      {/* Target Schools with Gaps */}
      {targets.length > 0 && (
        <div className="rounded-lg border-[3px] border-marker-red/30 bg-marker-red/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Target className="size-4 text-marker-red" />
            <span className="font-marker text-sm font-bold text-marker-red">
              冲刺目标院校
            </span>
          </div>
          <div className="space-y-2.5">
            {targets.map((target, idx) => {
              const tierLabels = ['冲刺', '进阶', '梦想'];
              const tierColors = [
                'bg-orange-100 text-orange-700 border-orange-300',
                'bg-pen-blue/10 text-pen-blue border-pen-blue/30',
                'bg-marker-red/10 text-marker-red border-marker-red/30',
              ];
              return (
                <div
                  key={`${target.school}-${idx}`}
                  className="flex items-center justify-between rounded-lg border-2 border-dashed border-ink/15 bg-white/60 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border-2 px-2 py-0.5 text-xs font-bold ${tierColors[idx] || tierColors[2]}`}>
                      {tierLabels[idx] || '目标'}
                    </span>
                    <span className="font-hand text-sm font-semibold text-ink">
                      {target.school}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className="font-marker text-xs text-muted-foreground">
                        录取线
                      </div>
                      <div className="font-marker text-sm font-bold text-ink">
                        {target.score}分
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <TrendingUp className="size-3 text-marker-red" />
                      <div>
                        <div className="font-marker text-xs text-muted-foreground">
                          需提高
                        </div>
                        <div className="font-marker text-sm font-bold text-marker-red">
                          +{target.gap}分
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanSchoolRecommend;
