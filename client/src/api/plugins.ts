import { capabilityClient } from '@lark-apaas/client-toolkit';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { StageSlug } from '@client/src/config/stages';
import { appendProfileAndStageRules } from '@client/src/config/stage-analysis-rules';
import type { StageProfile } from '@client/src/types/stage-profile';

export const PLUGIN_IDS = {
  DIAGNOSIS_REPORT: 'academic_diagnosis_report_generator_1',
  PLAN_REPORT: 'study_plan_report_generate_1',
  TIMELINE: 'exam_schedule_timeline_generator_1',
  POLICY_SEARCH: 'exam_policy_search_1',
  KNOWLEDGE_ANALYSIS: 'knowledge_point_deep_analysis_1',
  JUNIOR_HIGH_SEARCH: 'junior_high_school_tier_search_1',
  HIGH_SCHOOL_REGION_SEARCH: 'high_school_search_by_region_1',
  COLLEGE_POLICY_SEARCH: 'college_entrance_policy_search_1',
  COLLEGE_MAJOR_QUERY: 'college_major_admission_query_1',
  MAJOR_CAREER_QUERY: 'gaokao_major_career_salary_query_1',
  ADMISSION_SCORE_QUERY: 'high_school_admission_score_query_1',
  FEISHU_BITABLE_READER: 'feishu_bitable_data_reader_1',
} as const;

export type EducationStage = 'elementary' | 'middle' | 'high';

export function getEducationStage(grade: string): EducationStage {
  if (['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'].includes(grade)) return 'elementary';
  if (['高一', '高二', '高三'].includes(grade)) return 'high';
  return 'middle';
}

export function getExamTypeByGrade(grade: string): string {
  const stage = getEducationStage(grade);
  if (stage === 'high') return '高考';
  if (stage === 'middle') return '中考';
  return '小升初';
}

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
  targetMajor?: string;
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

export interface PromptBuildOptions {
  stageSlug?: StageSlug;
  profile?: Partial<StageProfile> | null;
}

export interface PersonalizedLearningPlanInput {
  stage: string;
  stageSlug: StageSlug;
  grade: string;
  region: string;
  school?: string;
  targetSchool?: string;
  examDate?: string;
  currentScore?: string;
  targetScore?: string;
  weakSubjects?: string;
  strongSubjects?: string;
  weeklyHours?: string;
  dailyHours?: string;
  boardingType?: string;
  eveningStudy?: string;
  extracurricular?: string;
  weeklySchedule?: string;
  timetableNotes?: string;
  customNotes?: string;
}

export function buildPersonalizedLearningPlanPrompt(
  input: PersonalizedLearningPlanInput,
  options?: PromptBuildOptions,
): string {
  const boarding = input.boardingType === 'day' ? '走读' : input.boardingType === 'boarding' ? '住读' : '未说明';
  const lines = [
    `【任务】为${input.stage}学段学生生成个性化、可执行、可验收的学习规划报告。`,
    `年级：${input.grade}`,
    `地区：${input.region}`,
    input.school ? `学校：${input.school}` : '',
    input.targetSchool ? `目标学校/院校：${input.targetSchool}` : '',
    input.examDate ? `目标考试日期：${input.examDate}` : '',
    input.currentScore ? `当前成绩：${input.currentScore}` : '',
    input.targetScore ? `目标成绩：${input.targetScore}` : '',
    input.weakSubjects ? `薄弱科目：${input.weakSubjects}` : '',
    input.strongSubjects ? `优势科目：${input.strongSubjects}` : '',
    `学习模式：${boarding}`,
    input.weeklyHours ? `每周可支配学习时长：${input.weeklyHours}小时` : '',
    input.dailyHours ? `每天可学习时长：${input.dailyHours}小时` : '',
    input.eveningStudy === 'yes' ? '有晚自习' : input.eveningStudy === 'no' ? '无晚自习' : '',
    input.extracurricular ? `课外班/固定占用：${input.extracurricular}` : '',
    input.weeklySchedule ? `周可学习时段：\n${input.weeklySchedule}` : '',
    input.timetableNotes ? `课表与作业量：\n${input.timetableNotes}` : '',
    input.customNotes ? `个性化说明：\n${input.customNotes}` : '',
  ].filter(Boolean);

  const base = `${lines.join('\n')}

【生成规则】
1. 按${input.stage}学段特点制定，禁止泛泛而谈。
2. 时间分配按目标差距与薄弱程度加权，禁止平均分配。
3. 走读需考虑通勤/作业/晚饭；住读需利用晚自习与周末，禁止生成不匹配的模式。
4. 每项任务必须有：完成标准、检测方式、优先级。
5. 政策/分数线/院校信息查不到须标注「暂无官方确认信息」，禁止编造。

【输出结构】必须 Markdown，且包含以下章节与表格：
## 学习目标总览
## 本周学习计划表（表格：日期|科目|时间段|任务|时长|优先级|知识点|完成标准|检测方式）
## 每日学习时间安排表
## 科目任务拆解表
## 知识点补强路径
## 阶段检测安排
## 家长监督建议
## 风险提醒
## 下周调整建议（含完成率<70%与正确率<80%的调整机制）`;

  const slug = options?.stageSlug ?? input.stageSlug;
  return appendProfileAndStageRules(base, slug, options?.profile ?? null);
}

export async function* streamPersonalizedLearningPlan(
  input: PersonalizedLearningPlanInput,
  options?: PromptBuildOptions,
) {
  const prompt = buildPersonalizedLearningPlanPrompt(input, options);
  const stream = capabilityClient
    .load(PLUGIN_IDS.DIAGNOSIS_REPORT)
    .callStream('textGenerate', {
      student_grade: input.grade,
      student_region: input.region,
      subject_scores: input.currentScore || buildScoresText({}),
      learning_problems: prompt,
    } as Record<string, unknown>);

  for await (const chunk of stream) {
    const content = (chunk as { content?: string }).content || '';
    if (content) yield content;
  }
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

export interface CollegeMajorQueryInput {
  region: string;
  university_name: string;
  selected_subjects?: string;
}

export async function* streamJuniorHighSearch(input: { region: string; school_name?: string }) {
  const stream = capabilityClient
    .load(PLUGIN_IDS.JUNIOR_HIGH_SEARCH)
    .callStream('searchSummary', { ...input } as Record<string, unknown>);
  for await (const chunk of stream) {
    const summary = (chunk as { summary?: string }).summary || '';
    if (summary) yield summary;
  }
}

export async function* streamCollegePolicySearch(input: { region: string; year: string; keyword?: string }) {
  const stream = capabilityClient
    .load(PLUGIN_IDS.COLLEGE_POLICY_SEARCH)
    .callStream('searchSummary', { ...input } as Record<string, unknown>);
  for await (const chunk of stream) {
    const summary = (chunk as { summary?: string }).summary || '';
    if (summary) yield summary;
  }
}

export async function* streamCollegeMajorQuery(input: CollegeMajorQueryInput) {
  const stream = capabilityClient
    .load(PLUGIN_IDS.COLLEGE_MAJOR_QUERY)
    .callStream('searchSummary', { ...input } as Record<string, unknown>);
  for await (const chunk of stream) {
    const summary = (chunk as { summary?: string }).summary || '';
    if (summary) yield summary;
  }
}

export interface MajorCareerQueryInput {
  region: string;
  university_name: string;
  major_name: string;
  selected_subjects?: string;
}

export async function* streamMajorCareerQuery(input: MajorCareerQueryInput) {
  const stream = capabilityClient
    .load(PLUGIN_IDS.MAJOR_CAREER_QUERY)
    .callStream('searchSummary', { ...input } as Record<string, unknown>);
  for await (const chunk of stream) {
    const summary = (chunk as { summary?: string }).summary || '';
    if (summary) yield summary;
  }
}

function normalizeSchoolName(line: string): string {
  return line
    .replace(/^[\d\s.\-、]+/, '')
    .replace(/^[-*]\s*/, '')
    .replace(/\|/g, ' ')
    .replace(/（[^）]*）/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSchoolCandidates(content: string, keyword?: string): string[] {
  const lines = content.split('\n').map((line) => line.trim()).filter(Boolean);
  const normalizedKeyword = keyword?.trim();
  const result: string[] = [];
  for (const line of lines) {
    if (
      line.startsWith('#') ||
      line.startsWith('|') ||
      line.startsWith('---') ||
      line.includes('数据来源') ||
      line.includes('说明')
    ) {
      continue;
    }
    const candidate = normalizeSchoolName(line);
    if (!candidate || candidate.length < 2 || candidate.length > 32) continue;
    if (
      !/(中学|高中|附中|大学|学院|学校|一中|二中|三中|四中|五中|六中|七中|八中|九中|十中)/.test(
        candidate,
      )
    ) {
      continue;
    }
    if (normalizedKeyword && !candidate.includes(normalizedKeyword)) continue;
    result.push(candidate);
  }
  return [...new Set(result)];
}

function extractTopScore(content: string): number | null {
  const matches = content.match(/(\d{3})\s*分/g) || [];
  const scores = matches
    .map((item) => Number.parseInt(item, 10))
    .filter((score) => Number.isFinite(score) && score >= 200 && score <= 900);
  if (scores.length === 0) return null;
  return Math.max(...scores);
}

export interface SchoolCandidate {
  name: string;
  score?: number;
}

export interface SearchSchoolCandidatesInput {
  stage: EducationStage;
  region: string;
  keyword?: string;
  examYear?: number;
  limit?: number;
}

export async function searchSchoolCandidates(
  input: SearchSchoolCandidatesInput,
): Promise<SchoolCandidate[]> {
  const { stage, region, keyword, examYear, limit = 10 } = input;
  const kw = keyword?.trim();
  let merged = '';

  if (stage === 'elementary') {
    for await (const chunk of streamJuniorHighSearch({
      region,
      school_name: kw || undefined,
    })) {
      merged += chunk;
    }
  } else if (stage === 'middle') {
    const stream = capabilityClient
      .load(PLUGIN_IDS.HIGH_SCHOOL_REGION_SEARCH)
      .callStream('searchSummary', {
        region,
        school_name: kw || undefined,
      } as Record<string, unknown>);
    for await (const chunk of stream as AsyncIterable<Record<string, unknown>>) {
      merged += typeof chunk?.summary === 'string' ? chunk.summary : '';
    }
  } else {
    for await (const chunk of streamCollegePolicySearch({
      region,
      year: String(examYear || new Date().getFullYear()),
      keyword: kw ? `${kw} 录取分数线` : '高校 录取分数线',
    })) {
      merged += chunk;
    }
  }

  const names = extractSchoolCandidates(merged, kw).slice(0, limit);
  return names.map((name) => ({ name }));
}

export async function fetchSchoolScoreByName(input: {
  region: string;
  schoolName: string;
  examType: '中考' | '高考';
}): Promise<number | null> {
  const stream = capabilityClient
    .load(PLUGIN_IDS.ADMISSION_SCORE_QUERY)
    .callStream('searchSummary', {
      region: input.region,
      school_name: input.schoolName,
      exam_type: input.examType,
    } as Record<string, unknown>);
  let merged = '';
  for await (const chunk of stream as AsyncIterable<Record<string, unknown>>) {
    merged +=
      (typeof chunk?.summary === 'string' ? chunk.summary : '') ||
      (typeof chunk?.content === 'string' ? chunk.content : '');
  }
  return extractTopScore(merged);
}

export async function fetchBitableData() {
  const result = await capabilityClient
    .load(PLUGIN_IDS.FEISHU_BITABLE_READER)
    .call('searchRecords', { pageSize: 500 } as Record<string, unknown>);
  return result as { records: Array<{ id: string; record: Record<string, any> }>; hasMore: boolean; total: number };
}

export async function* streamKnowledgeAnalysis(
  input: KnowledgeAnalysisInput,
  options?: PromptBuildOptions,
) {
  let payload: Record<string, unknown> = { ...input };
  if (options?.stageSlug) {
    const appendix = appendProfileAndStageRules(
      `【知识点】${input.knowledge_point}（${input.chapter}）`,
      options.stageSlug,
      options.profile,
    );
    payload = { ...input, knowledge_point: appendix };
  }
  const stream = capabilityClient
    .load(PLUGIN_IDS.KNOWLEDGE_ANALYSIS)
    .callStream('textGenerate', payload);

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

export function buildDiagnosisPrompt(ctx: DiagnosisFormContext, options?: PromptBuildOptions): string {
  const stage = getEducationStage(ctx.grade);
  const parts: string[] = [];
  const boardingLabel = ctx.boardingType === 'day' ? '走读' : ctx.boardingType === 'boarding' ? '住读' : '';
  if (boardingLabel) parts.push(`学习模式：${boardingLabel}${ctx.monthlyStudyHours ? `，每月自主学习约${ctx.monthlyStudyHours}小时` : ''}`);

  if (stage === 'high') {
    if (ctx.examMode) parts.push(`高考选科模式：${ctx.examMode}`);
    if (ctx.examDate) parts.push(`高考日期：${ctx.examDate}`);
    if (ctx.targetSchool) parts.push(`目标大学：${ctx.targetSchool}`);
    if (ctx.targetMajor) parts.push(`目标专业：${ctx.targetMajor}`);
    if (ctx.targetScore != null) parts.push(`该校近年投档线：${ctx.targetScore}分`);
  } else if (stage === 'middle') {
    if (ctx.examDate) parts.push(`中考日期：${ctx.examDate}`);
    if (ctx.targetSchool) parts.push(`目标高中：${ctx.targetSchool}`);
    if (ctx.targetScore != null) parts.push(`该校2025年录取线：${ctx.targetScore}分`);
  } else {
    if (ctx.targetSchool) parts.push(`目标初中：${ctx.targetSchool}`);
    parts.push(`升学方向：小升初（免试就近入学、公民同招）`);
  }

  if (ctx.problemDesc && ctx.problemDesc.trim()) {
    parts.push(`学生/家长自述痛点：${ctx.problemDesc.trim()}`);
  }
  const scoresText = buildScoresText(ctx.scores, ctx.scoreMaxValues);
  const examLabel = stage === 'high' ? '高考模拟' : stage === 'middle' ? '中考模拟' : '小升初期末统考';
  const base = `考试类型：${examLabel}\n各科成绩（含满分与得分率）：${scoresText}\n${parts.join('\n')}`;

  if (options?.stageSlug) {
    return appendProfileAndStageRules(base, options.stageSlug, options.profile);
  }
  return base;
}

export function buildPlanAdditionalInfo(ctx: PlanFormContext, options?: PromptBuildOptions): string {
  const stage = getEducationStage(ctx.grade);
  const parts: string[] = [];
  parts.push(`升学类型：${stage === 'high' ? '高考' : stage === 'middle' ? '中考' : '小升初'}`);
  parts.push(`当前年级：${ctx.grade}`);
  if (ctx.examYear) parts.push(`目标考试年份：${ctx.examYear}年`);
  const boardingLabel = ctx.boardingType === 'day' ? '走读' : ctx.boardingType === 'boarding' ? '住读' : '';
  if (boardingLabel) parts.push(`学习模式：${boardingLabel}${ctx.monthlyStudyHours ? `，每月自主学习约${ctx.monthlyStudyHours}小时` : ''}`);
  if (stage === 'high' && ctx.examMode) parts.push(`高考选科模式：${ctx.examMode}`);
  if (ctx.targetSchool) {
    const label = stage === 'high' ? '目标大学' : stage === 'middle' ? '目标高中' : '目标初中';
    parts.push(`${label}：${ctx.targetSchool}`);
  }
  if (ctx.targetScore != null) {
    const label = stage === 'high' ? '该校近年投档线' : '该校最新录取线';
    parts.push(`${label}：${ctx.targetScore}分`);
  }
  const scoresText = buildScoresText(ctx.scores, ctx.scoreMaxValues);
  parts.push(`各科成绩（含满分与得分率）：${scoresText}`);
  const latestYear = Math.max(new Date().getFullYear(), ctx.examYear || 0);
  parts.push(`输出要求：政策信息点到为止，重点回答“能上什么学校、差多少分、怎么补分、关键时间点”`);
  parts.push(`时间要求：必须使用${latestYear}年及之后的最新时间节点，若缺少官方数据请明确说明`);
  parts.push('表达要求：用家长易懂的大白话，不使用晦涩术语');
  const base = parts.join('；');

  if (options?.stageSlug) {
    return appendProfileAndStageRules(base, options.stageSlug, options.profile);
  }
  return base;
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
