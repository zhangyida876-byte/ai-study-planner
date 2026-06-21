import { capabilityClient } from '@lark-apaas/client-toolkit';
import { logger } from '@lark-apaas/client-toolkit/logger';

export const PLUGIN_IDS = {
  DIAGNOSIS_REPORT: 'academic_diagnosis_report_generator_1',
  PLAN_REPORT: 'study_plan_report_generate_1',
  TIMELINE: 'exam_schedule_timeline_generator_1',
  POLICY_SEARCH: 'exam_policy_search_1',
  KNOWLEDGE_ANALYSIS: 'knowledge_point_deep_analysis_1',
} as const;

export interface DiagnosisReportInput {
  student_grade: string;
  student_region?: string;
  subject_scores: string;
  learning_problems?: string;
}

export interface DiagnosisFormContext {
  grade: string;
  region: string;
  scores: Record<string, number>;
  scoreMaxValues?: Record<string, number>;
  examType?: string;
  boardingType?: string;
  monthlyStudyHours?: number;
  examMode?: string;
  problemDesc?: string;
  targetSchool?: string;
  targetScore?: number;
  examDate?: string;
}

export interface PlanReportInput {
  student_scores: string;
  region_admission_policy: string;
  student_additional_info?: string;
}

export interface PlanFormContext {
  examType: string;
  grade: string;
  region: string;
  scores: Record<string, number>;
  scoreMaxValues?: Record<string, number>;
  examMode?: string;
  boardingType?: string;
  monthlyStudyHours?: number;
  targetSchool?: string;
  targetScore?: number;
  examYear?: number;
}

export interface TimelineInput {
  current_grade: string;
  region: string;
  exam_year?: string;
}

export interface PolicySearchInput {
  region: string;
  year: string;
  keyword?: string;
}

export interface KnowledgeAnalysisInput {
  textbook_version: string;
  subject: string;
  grade_semester: string;
  chapter: string;
  knowledge_point: string;
}

export async function* streamDiagnosisReport(input: DiagnosisReportInput) {
  const stream = capabilityClient
    .load(PLUGIN_IDS.DIAGNOSIS_REPORT)
    .callStream('textGenerate', { ...input } as Record<string, unknown>);

  for await (const chunk of stream) {
    const content = (chunk as { content?: string }).content || '';
    if (content) yield content;
  }
}

export async function* streamPlanReport(input: PlanReportInput) {
  const stream = capabilityClient
    .load(PLUGIN_IDS.PLAN_REPORT)
    .callStream('textGenerate', { ...input } as Record<string, unknown>);

  for await (const chunk of stream) {
    const content = (chunk as { content?: string }).content || '';
    if (content) yield content;
  }
}

export async function* streamTimeline(input: TimelineInput) {
  const stream = capabilityClient
    .load(PLUGIN_IDS.TIMELINE)
    .callStream('textGenerate', { ...input } as Record<string, unknown>);

  for await (const chunk of stream) {
    const content = (chunk as { content?: string }).content || '';
    if (content) yield content;
  }
}

export async function* streamPolicySearch(input: PolicySearchInput) {
  const stream = capabilityClient
    .load(PLUGIN_IDS.POLICY_SEARCH)
    .callStream('searchSummary', { ...input } as Record<string, unknown>);

  for await (const chunk of stream) {
    const summary = (chunk as { summary?: string }).summary || '';
    if (summary) yield summary;
  }
}

export async function* streamKnowledgeAnalysis(input: KnowledgeAnalysisInput) {
  const stream = capabilityClient
    .load(PLUGIN_IDS.KNOWLEDGE_ANALYSIS)
    .callStream('textGenerate', { ...input } as Record<string, unknown>);

  for await (const chunk of stream) {
    const content = (chunk as { content?: string }).content || '';
    if (content) yield content;
  }
}

export function buildScoresText(
  scores: Record<string, number>,
  maxValues?: Record<string, number>
): string {
  return Object.entries(scores)
    .map(([subject, score]) => {
      const max = maxValues?.[subject];
      return max ? `${subject}: ${score}/${max}分（得分率${Math.round(score / max * 100)}%）` : `${subject}: ${score}分`;
    })
    .join('、');
}

export function buildDiagnosisPrompt(ctx: DiagnosisFormContext): string {
  const parts: string[] = [];
  const boardingLabel = ctx.boardingType === 'day' ? '走读' : ctx.boardingType === 'boarding' ? '住读' : '';
  if (boardingLabel) parts.push(`学习模式：${boardingLabel}${ctx.monthlyStudyHours ? `，每月自主学习约${ctx.monthlyStudyHours}小时` : ''}`);
  if (ctx.examMode) parts.push(`高考选科模式：${ctx.examMode}`);
  if (ctx.examDate) parts.push(`考试时间：${ctx.examDate}`);
  if (ctx.targetSchool) parts.push(`目标院校：${ctx.targetSchool}`);
  if (ctx.targetScore != null) parts.push(`该校2025年录取线：${ctx.targetScore}分`);
  if (ctx.problemDesc && ctx.problemDesc.trim()) {
    parts.push(`学生/家长自述痛点：${ctx.problemDesc.trim()}`);
  }
  const scoresText = buildScoresText(ctx.scores, ctx.scoreMaxValues);
  return `考试类型：${ctx.examType || '期末统考'}\n各科成绩（含满分与得分率）：${scoresText}\n${parts.join('\n')}`;
}

export function buildPlanAdditionalInfo(ctx: PlanFormContext): string {
  const parts: string[] = [];
  parts.push(`升学类型：${ctx.examType}`);
  parts.push(`当前年级：${ctx.grade}`);
  if (ctx.examYear) parts.push(`目标考试年份：${ctx.examYear}年`);
  const boardingLabel = ctx.boardingType === 'day' ? '走读' : ctx.boardingType === 'boarding' ? '住读' : '';
  if (boardingLabel) parts.push(`学习模式：${boardingLabel}${ctx.monthlyStudyHours ? `，每月自主学习约${ctx.monthlyStudyHours}小时` : ''}`);
  if (ctx.examMode) parts.push(`高考选科模式：${ctx.examMode}`);
  if (ctx.targetSchool) parts.push(`目标院校：${ctx.targetSchool}`);
  if (ctx.targetScore != null) parts.push(`该校2025年录取线：${ctx.targetScore}分`);
  const scoresText = buildScoresText(ctx.scores, ctx.scoreMaxValues);
  parts.push(`各科成绩（含满分与得分率）：${scoresText}`);
  return parts.join('；');
}

export function buildKnowledgeGradeSemester(chapter: string): string {
  const gradeMatch = chapter.match(/([一二三四五六七八九]年级|高一|高二|高三)/);
  const semMatch = chapter.match(/(上册|下册|全册|上学期|下学期)/);
  const grade = gradeMatch?.[1] || '';
  const sem = semMatch?.[1] || '';
  return grade + sem;
}

export function buildPolicyText(
  totalScore: number,
  scoreStructure: Record<string, number>,
  admissionLines: Array<{ batch: string; school: string; score: number }>,
  policyContent: string
): string {
  const structureText = Object.entries(scoreStructure)
    .map(([subject, score]) => `${subject}${score}分`)
    .join('、');

  const linesText = admissionLines
    .map((line) => `${line.batch} - ${line.school}: ${line.score}分`)
    .join('\n');

  return `中考总分: ${totalScore}分\n科目分值构成: ${structureText}\n\n录取分数线:\n${linesText}\n\n政策概要:\n${policyContent}`;
}
