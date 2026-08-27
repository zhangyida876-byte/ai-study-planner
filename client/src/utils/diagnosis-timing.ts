import type { EducationStage } from '@client/src/api/plugins';

export interface DiagnosisTimelineNode {
  period: string;
  title: string;
  problem: string;
  action: string;
  acceptance: string;
  risk: string;
}

export interface DiagnosisTimelineResult {
  daysLeft: number;
  examName: string;
  examPeriod: string;
  nodes: DiagnosisTimelineNode[];
}

export function formatDiagnosisDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function getAcademicPeriod(date: Date = new Date()): string {
  const month = date.getMonth() + 1;
  if (month === 1) return '上学期期末与寒假衔接期';
  if (month === 2) return '寒假与春季开学衔接期';
  if (month >= 3 && month <= 6) return '下学期新课、阶段考试与期末备考期';
  if (month === 7) return '暑假复盘与前置知识补弱期';
  if (month === 8) return '暑假末与新学年开学衔接期';
  if (month >= 9 && month <= 11) return '上学期新课与阶段考试期';
  return '上学期期末复习与寒假前窗口期';
}

function getExamYear(grade: string, stage: EducationStage, now: Date): number {
  const baseSchoolYearExam = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  const yearsRemaining: Record<string, number> = {
    初一: 2,
    初二: 1,
    初三: 0,
    高一: 2,
    高二: 1,
    高三: 0,
    四年级: 2,
    五年级: 1,
    六年级: 0,
  };
  return baseSchoolYearExam + (yearsRemaining[grade] ?? (stage === 'elementary' ? 1 : 0));
}

export function buildDiagnosisTimeline(
  grade: string,
  stage: EducationStage,
  examDate?: string,
  prioritySubject?: string,
  now: Date = new Date(),
): DiagnosisTimelineResult {
  const examName = stage === 'high' ? '高考' : stage === 'middle' ? '中考' : '小升初关键节点';
  const examYear = getExamYear(grade, stage, now);
  const inferredExamDate = new Date(`${examYear}-${stage === 'elementary' ? '06-01' : '06-15'}T09:00:00+08:00`);
  const explicitExamDate = examDate ? new Date(`${examDate}T09:00:00+08:00`) : null;
  const targetDate = explicitExamDate && !Number.isNaN(explicitExamDate.getTime())
    ? explicitExamDate
    : inferredExamDate;
  const daysLeft = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / 86400000));
  const examPeriod = examDate
    ? new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(targetDate)
    : `${examYear}年${stage === 'elementary' ? '升学前' : '6月（以官方安排为准）'}`;
  const subject = prioritySubject || '当前薄弱科目';

  const windows = [
    {
      days: 30,
      title: '先定位再补漏',
      problem: `${subject}失分原因尚未拆到具体知识点、题型和错因。`,
      action: `用最近2套试卷和章节测评锁定${subject}的3个最高频失分点，先补前置概念再练典型题。`,
      acceptance: '同类基础题正确率达到80%，错题能说清错误原因。',
      risk: '继续只刷整卷，会把知识漏洞误判成粗心。',
    },
    {
      days: 90,
      title: '同步校内并专项提分',
      problem: '旧漏洞与当前新课叠加，容易在月考和综合题中重复失分。',
      action: `每周安排${subject}同步课、知识点课和1次专项训练，按错因调整下一周任务。`,
      acceptance: '连续2次单元或月考同类题正确率稳定，阶段分数不再回落。',
      risk: '三个月后仍不稳定，会挤占总复习前的整块补弱时间。',
    },
    {
      days: 180,
      title: '完成一轮能力整合',
      problem: '章节会做不等于跨章节、限时和真实考试场景下能稳定得分。',
      action: '从章节练习转入跨章节题型训练，每两周完成一次限时测评和错因复盘。',
      acceptance: '核心题型形成固定解题流程，限时卷波动控制在目标分数的5%以内。',
      risk: '若此阶段仍在补概念，后续只能同时承受新课、复习和模拟考压力。',
    },
    {
      days: 365,
      title: '形成完整备考闭环',
      problem: '长期目标没有拆成阶段分数和可验收动作，容易出现忙但无效。',
      action: '按月复测目标差距，滚动调整科目权重，并提前完成高频题型和薄弱模块的二轮复盘。',
      acceptance: '各科阶段目标可量化，模考总分稳定进入目标线可控范围。',
      risk: `若核心短板持续拖延，会直接压缩${examName}的学校选择空间。`,
    },
  ];

  const visibleWindows = windows.filter((window) => window.days < daysLeft);
  const finalNode: DiagnosisTimelineNode = {
    period: `${examPeriod} · 剩余${daysLeft}天`,
    title: '目标线校准与冲刺',
    problem: '最后阶段容错率低，任何未稳定的核心短板都会直接反映到总分。',
    action: '围绕目标差距做套卷校准、错因复盘和得分稳定性训练，不再无序扩充新题。',
    acceptance: '连续3次模拟成绩达到阶段目标，必得分题失分率低于10%。',
    risk: `未形成稳定得分结构，会直接影响${examName}最终落点。`,
  };

  return {
    daysLeft,
    examName,
    examPeriod,
    nodes: [
      ...visibleWindows.map((window) => ({
        period: `未来${window.days}天内`,
        title: window.title,
        problem: window.problem,
        action: window.action,
        acceptance: window.acceptance,
        risk: window.risk,
      })),
      finalNode,
    ],
  };
}
