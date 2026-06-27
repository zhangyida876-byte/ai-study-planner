import React from 'react';
import { Input } from '@client/src/components/ui/input';

export type ExamType = '小升初' | '中考' | '高考';

interface SubjectDef {
  key: string;
  label: string;
  max: number;
  group?: string;
}

const XSC_SUBJECTS: SubjectDef[] = [
  { key: '语文', label: '语文', max: 120 },
  { key: '数学', label: '数学', max: 120 },
  { key: '英语', label: '英语', max: 120 },
];

const ZK_SUBJECTS: SubjectDef[] = [
  { key: '语文', label: '语文', max: 120 },
  { key: '数学', label: '数学', max: 120 },
  { key: '英语', label: '英语', max: 120 },
  { key: '物理', label: '物理', max: 70 },
  { key: '化学', label: '化学', max: 50 },
  { key: '道法', label: '道法', max: 60 },
  { key: '历史', label: '历史', max: 60 },
  { key: '体育', label: '体育', max: 50 },
];

const GK_CORE: SubjectDef[] = [
  { key: '语文', label: '语文', max: 150 },
  { key: '数学', label: '数学', max: 150 },
  { key: '英语', label: '英语', max: 150 },
];

const GK_PREFERRED: SubjectDef[] = [
  { key: '物理', label: '物理', max: 100 },
  { key: '历史', label: '历史', max: 100 },
];

const GK_ELECTIVE: SubjectDef[] = [
  { key: '化学', label: '化学', max: 100 },
  { key: '生物', label: '生物', max: 100 },
  { key: '政治', label: '政治', max: 100 },
  { key: '地理', label: '地理', max: 100 },
];

function getSubjects(examType: ExamType, examMode?: string): SubjectDef[][] {
  if (examType === '小升初') return [XSC_SUBJECTS];
  if (examType === '中考') return [ZK_SUBJECTS];

  if (examMode === '3+1+2') return [GK_CORE, GK_PREFERRED, GK_ELECTIVE];
  if (examMode === '3+3') return [GK_CORE, GK_PREFERRED.concat(GK_ELECTIVE)];
  return [GK_CORE];
}

const GROUP_LABELS: Record<string, string> = {
  0: '必考科目',
  1: '首选科目（二选一）',
  2: '再选科目（四选二）',
};

interface PlanScoreInputProps {
  examType: ExamType;
  examMode?: string;
  scores: Record<string, number>;
  subjectMaxHints?: Record<string, number>;
  onScoreChange: (key: string, val: string) => void;
}

function resolveSubjectMax(
  subjectKey: string,
  fallback: number,
  hints?: Record<string, number>,
): number {
  if (!hints) return fallback;
  const direct = hints[subjectKey];
  if (typeof direct === 'number' && direct > 0) return direct;
  if (subjectKey === '政治') {
    const daofa = hints['道法'];
    if (typeof daofa === 'number' && daofa > 0) return daofa;
  }
  if (subjectKey === '道法') {
    const politics = hints['政治'];
    if (typeof politics === 'number' && politics > 0) return politics;
  }
  return fallback;
}

const PlanScoreInput: React.FC<PlanScoreInputProps> = ({
  examType,
  examMode,
  scores,
  subjectMaxHints,
  onScoreChange,
}) => {
  const groups = getSubjects(examType, examMode);

  return (
    <div className="flex flex-1 flex-wrap items-end gap-x-4 gap-y-3">
      {groups.map((group, gIdx) => (
        <React.Fragment key={gIdx}>
          {groups.length > 1 && (
            <div className="w-full text-xs font-bold text-pen-blue">
              {GROUP_LABELS[gIdx] || `第${gIdx + 1}组`}
            </div>
          )}
          {group.map((def) => (
            <div key={def.key} className="w-20">
              {(() => {
                const max = resolveSubjectMax(def.key, def.max, subjectMaxHints);
                return (
                  <>
              <label className="mb-1 block text-xs text-muted-foreground">
                {def.label}
                <span className="text-marker-red">/{max}</span>
              </label>
              <Input
                type="number"
                min={0}
                max={max}
                value={scores[def.key] || ''}
                onChange={(e) => onScoreChange(def.key, e.target.value)}
                placeholder="0"
                className="h-auto border-0 border-b-2 border-dashed border-ink/30 bg-transparent px-1 py-1.5 text-center font-hand text-ink shadow-none focus-visible:border-marker-red focus-visible:border-solid focus-visible:ring-0"
              />
                  </>
                );
              })()}
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};

export default PlanScoreInput;
