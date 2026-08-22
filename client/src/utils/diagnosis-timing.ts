import type { EducationStage } from '@client/src/api/plugins';

export interface DiagnosisTimelineNode {
  period: string;
  title: string;
  focus: string;
  risk: string;
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
): DiagnosisTimelineNode[] {
  const examName = stage === 'high' ? '高考' : stage === 'middle' ? '中考' : '小升初关键节点';
  const examYear = getExamYear(grade, stage, now);
  const finalPeriod = examDate
    ? new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(examDate))
    : `${examYear}年${stage === 'elementary' ? '升学前' : '6月（以官方安排为准）'}`;
  const subject = prioritySubject || '当前薄弱科目';

  return [
    {
      period: `现在 · ${formatDiagnosisDate(now)}`,
      title: '定位漏洞',
      focus: `用教材目录、最近试卷和章节测评核实${subject}的具体失分点`,
      risk: '只看总分会把知识漏洞误判成粗心或题量不足',
    },
    {
      period: '未来 4-6 周',
      title: '校内验证',
      focus: '跟随学校当前章节完成同步学习，并用月考或单元测评验证',
      risk: '新课继续叠加后，前置漏洞会转化为综合题持续失分',
    },
    {
      period: '最近一次寒暑假',
      title: '集中补弱',
      focus: `集中处理${subject}的前置概念、基础模型和高频错题`,
      risk: '错过整块时间后，只能在新课和作业夹缝中零散补救',
    },
    {
      period: `${examName}总复习前`,
      title: '题型整合',
      focus: '从章节正确率转向跨章节、限时和考试题型训练',
      risk: '总复习阶段再补概念，会同时承受新课、复习和模拟考压力',
    },
    {
      period: finalPeriod,
      title: '目标线冲刺',
      focus: '围绕目标差距做套卷校准、错因复盘和稳定性训练',
      risk: `若核心短板未稳定，会直接压缩${examName}的可选空间`,
    },
  ];
}
