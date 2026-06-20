import { capabilityClient } from '@lark-apaas/client-toolkit';
import { logger } from '@lark-apaas/client-toolkit/logger';

export const PLUGIN_IDS = {
  DIAGNOSIS_REPORT: 'academic_diagnosis_report_generator_1',
  PLAN_REPORT: 'study_plan_report_generate_1',
  TIMELINE: 'exam_schedule_timeline_generator_1',
  POLICY_SEARCH: 'exam_policy_search_1',
} as const;

export interface DiagnosisReportInput {
  student_name?: string;
  student_grade: string;
  student_region?: string;
  subject_scores: string;
  learning_problems?: string;
  target_school?: string;
  target_score?: string;
  exam_date?: string;
}

export interface PlanReportInput {
  student_scores: string;
  region_admission_policy: string;
  student_additional_info?: string;
}

export interface TimelineInput {
  current_grade: string;
  region: string;
}

export interface PolicySearchInput {
  region: string;
  year: string;
  keyword?: string;
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

export function buildScoresText(scores: Record<string, number>): string {
  return Object.entries(scores)
    .map(([subject, score]) => `${subject}: ${score}分`)
    .join('、');
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
