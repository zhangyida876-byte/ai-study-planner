import { capabilityClient } from '@lark-apaas/client-toolkit';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { StageSlug } from '@client/src/config/stages';
import { appendProfileAndStageRules } from '@client/src/config/stage-analysis-rules';
import { getInternalMaterialContext } from '@client/src/config/internal-resource-library';
import { buildProfessionalReportFramework } from '@client/src/config/report-prompt-templates';
import { resolveZhongkaoProfile, type ZhongkaoScoreProfile } from '@client/src/data/zhongkao-score-profiles';
import type { StageProfile } from '@client/src/types/stage-profile';

export const PLUGIN_IDS = {
  DIAGNOSIS_REPORT: 'academic_diagnosis_report_generator_1',
  PLAN_REPORT: 'study_plan_report_generate_1',
  PERSONALIZED_LEARNING_SCHEDULE: 'personalized_learning_schedule_1',
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

function mapEducationStageToStageSlug(stage: EducationStage): StageSlug {
  if (stage === 'elementary') return 'elementary';
  if (stage === 'high') return 'high';
  return 'middle';
}

function mapStageSlugToEducationStage(stageSlug: StageSlug): EducationStage {
  if (stageSlug === 'elementary') return 'elementary';
  if (stageSlug === 'high') return 'high';
  return 'middle';
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
  filledSubjects?: string[];
  missingSubjects?: string[];
  scoreMaxValues?: Record<string, number>;
  examType?: string;
  boardingType?: string;
  monthlyStudyHours?: number;
  examMode?: string;
  problemDesc?: string;
  targetSchool?: string;
  targetScore?: number;
  targetMajor?: string;
  careerIntent?: string;
  examDate?: string;
  schoolReferenceContext?: string;
  diagnosisDate?: string;
  academicPeriod?: string;
  textbookVersions?: Record<string, string>;
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
  careerIntent?: string;
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
  careerIntent?: string;
  examMode?: string;
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
  diagnosisContext?: string;
}

export function buildPersonalizedLearningPlanPrompt(
  input: PersonalizedLearningPlanInput,
  options?: PromptBuildOptions,
): string {
  const inferredStageSlug = options?.stageSlug ?? input.stageSlug ?? mapEducationStageToStageSlug(getEducationStage(input.grade));
  const internalMaterial = getInternalMaterialContext({
    stageSlug: inferredStageSlug,
    module: 'study-plan',
    limit: 12,
  });
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
    input.careerIntent ? `未来意向方向：${input.careerIntent}` : '',
    input.examMode ? `高考选科模式：${input.examMode}` : '',
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
    input.diagnosisContext ? `关联的最新学情诊断：\n${input.diagnosisContext}` : '',
  ].filter(Boolean);

  const base = `${lines.join('\n')}

【内部资源库素材（优先使用）】
${internalMaterial}

【本模块边界】
1. 你生成的是“个性化课表学习执行方案”，不是学情诊断报告，也不是升学规划报告。
2. 禁止输出“# 学情诊断报告”“# 升学规划报告”等标题。
3. 不要重复分析成绩水平定位、知识漏洞溯源、升学风险；这些内容只作为课表安排依据。
4. 必须围绕课表、时间段、任务安排、完成标准、复盘清单输出。

【融合要求】
1. 话术、产品能力、服务表达先采用内部资源库口径。
2. 时间安排必须优先服从用户填写的课表、晚自习、课外班、走读/住读信息。
3. 未提供的课表时段标注“待补充”，禁止编造具体到校课表。

【生成规则】
1. 按${input.stage}学段特点制定，禁止泛泛而谈。
2. 时间分配按目标差距与关联诊断中的P0/P1问题加权，禁止平均分配。
3. 走读需考虑通勤/作业/晚饭；住读需利用晚自习与周末，禁止生成不匹配的模式。
4. 每项任务必须有：完成标准、检测方式、优先级。
5. 政策/分数线/院校信息查不到须标注「暂无官方确认信息」，禁止编造。
6. 若为高中学段，必须以“大学-专业-就业能力”主线输出，禁止套用中考提分模板；可回溯初中知识点仅用于定位成因。
7. 默认输出连续7天执行表，每天根据实际可用时段安排1-3个任务；不为显得充实而硬塞任务。
8. 每个任务必须写清楚：做什么题/背什么内容、做多少、用多久、错了怎么处理、谁来检查。
9. 必须额外输出“家长/老师检查表”和“未完成降级方案”，方便直接复制给家长执行。

【输出结构】必须 Markdown，且包含以下章节与表格：
# 个性化课表学习执行方案
## 一、可用时间盘点
## 二、连续7天学习规划表（表格：日期|回家/可用时间|学习时段|科目|对应诊断问题|具体任务|洋葱功能|预计用时|完成标准）
## 三、每日固定执行模板
## 四、薄弱科目专项安排
## 五、家长/老师每日检查表（表格：检查项|合格标准|记录方式）
## 六、课表冲突与调整规则（保底版/标准版/加量版）
## 七、下周复盘清单`;

  const slug = options?.stageSlug ?? input.stageSlug;
  return appendProfileAndStageRules(base, slug, options?.profile ?? null);
}

export async function* streamPersonalizedLearningPlan(
  input: PersonalizedLearningPlanInput,
  options?: PromptBuildOptions,
) {
  const prompt = buildPersonalizedLearningPlanPrompt(input, options);
  const stream = capabilityClient
    .load(PLUGIN_IDS.PERSONALIZED_LEARNING_SCHEDULE)
    .callStream('textGenerate', {
      student_context: prompt,
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

function normalizeSubjectForHint(raw: string): string {
  const text = raw.replace(/\s+/g, '');
  if (/(语文|语)/.test(text)) return '语文';
  if (/(数学|数)/.test(text)) return '数学';
  if (/(英语|英|外语)/.test(text)) return '英语';
  if (/科学/.test(text)) return '科学';
  if (/物理/.test(text)) return '物理';
  if (/化学/.test(text)) return '化学';
  if (/生物/.test(text)) return '生物';
  if (/历史/.test(text)) return '历史';
  if (/地理/.test(text)) return '地理';
  if (/(道法|政治|社会)/.test(text)) return '道法';
  if (/体育/.test(text)) return '体育';
  return raw;
}

function setSubjectMaxHint(result: Record<string, number>, subjectRaw: string, value: number) {
  const subject = normalizeSubjectForHint(subjectRaw);
  if (!Number.isFinite(value) || value <= 0 || value > 200) return;
  const prev = result[subject] || 0;
  if (prev <= 0) {
    result[subject] = value;
    return;
  }
  // 语数常见冲突：120（录取计分）vs 100（卷面折合/百分制噪声）→ 优先 120
  if (/^(语文|数学)$/.test(subject) && [prev, value].every((n) => n === 100 || n === 120)) {
    result[subject] = 120;
    return;
  }
  // 体育近年常见 40/50 调整 → 取较大值（更贴近最新政策）
  if (subject === '体育' && [prev, value].every((n) => n === 40 || n === 50)) {
    result[subject] = Math.max(prev, value);
    return;
  }
  // 默认后写覆盖：避免旧逻辑 Math.min 把正确满分压成噪声低值
  result[subject] = value;
}

function extractSubjectsFromText(text: string): string[] {
  const subjects = text.match(/语文|数学|英语|外语|物理|化学|生物|历史|地理|道德与法治|道法|政治|体育/g) || [];
  return [...new Set(subjects.map(normalizeSubjectForHint))];
}

function shouldSkipCombinedSubjectScore(betweenSubjectAndScore: string): boolean {
  const compact = betweenSubjectAndScore.replace(/\s+/g, '');
  if (/各|分别|均/.test(compact)) return false;
  return /合卷|[、,，]|和|与|及/.test(compact);
}

function isNoisyScoreLine(line: string): boolean {
  return /百分制|满分制|卷面分(?:值)?\s*100|折合为|折合分|单元测试|期中|期末测验|模拟考|日常测验/.test(line);
}

function resolveKnownZkProfile(region: string, examType?: string): ZhongkaoScoreProfile | null {
  if (!/中考/.test(examType || '')) return null;
  return resolveZhongkaoProfile(region);
}

export function hasKnownExamScoreAuthority(region: string, examType?: string): boolean {
  return Boolean(resolveKnownZkProfile(region, examType));
}

export function getKnownSubjectMaxHints(region: string, examType?: string): Record<string, number> {
  return { ...(resolveKnownZkProfile(region, examType)?.subjects || {}) };
}

export function getKnownExamTotalScore(region: string, examType?: string): number | null {
  return resolveKnownZkProfile(region, examType)?.total ?? null;
}

export function getKnownExamScoreNotes(region: string, examType?: string): string[] {
  const profile = resolveKnownZkProfile(region, examType);
  if (!profile) return [];
  const prefix = [`权威表适用约${profile.year}年（${profile.source}）`];
  return [...prefix, ...(profile.notes || [])];
}

export function getKnownSubjectScoreNote(region: string, examType: string | undefined, subject: string): string {
  const profile = resolveKnownZkProfile(region, examType);
  if (!profile?.subjectNotes) return '';
  const key = normalizeSubjectForHint(subject);
  return profile.subjectNotes[key] || profile.subjectNotes[subject] || '';
}

function extractSubjectMaxBlock(text: string): Record<string, number> {
  const result: Record<string, number> = {};
  const blockMatch = text.match(/SUBJECT_MAX\s*[:：]\s*([^\n]+)/i);
  if (!blockMatch) return result;
  const pairs = blockMatch[1].split(/[;；|]/);
  for (const pair of pairs) {
    const m = pair.match(/(语文|数学|英语|外语|物理|化学|生物|历史|地理|道德与法治|道法|政治|体育)\s*[=:：]\s*(\d{2,3})/);
    if (!m) continue;
    setSubjectMaxHint(result, m[1], Number.parseInt(m[2], 10));
  }
  return result;
}

export function extractSubjectMaxHintsFromPolicyText(text: string): Record<string, number> {
  const result: Record<string, number> = {};
  if (!text.trim()) return result;

  // 优先解析模型按约定输出的机读块
  const fromBlock = extractSubjectMaxBlock(text);
  Object.assign(result, fromBlock);

  const subjectPattern = /(语文|数学|英语|外语|物理|化学|生物|历史|地理|道德与法治|道法|政治|体育)/g;
  const lines = text
    .split(/\n|。|；|;/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  for (const line of lines) {
    if (isNoisyScoreLine(line)) continue;

    const directPattern = /(语文|数学|英语|外语|物理|化学|生物|历史|地理|道德与法治|道法|政治|体育)([^。；,，、\n]{0,24}?)(\d{2,3})\s*分/g;
    for (const match of line.matchAll(directPattern)) {
      const [, subjectRaw, middle, scoreText] = match;
      if (shouldSkipCombinedSubjectScore(middle)) continue;
      // 跳过「卷面分100分，折合为xx分」里的卷面100
      if (/卷面/.test(middle) && Number.parseInt(scoreText, 10) === 100) continue;
      setSubjectMaxHint(result, subjectRaw, Number.parseInt(scoreText, 10));
    }

    const eachPattern = /([^。；\n]{0,80}?)(?:各|分别|均)(?:[^0-9]{0,12})(\d{2,3})\s*分/g;
    for (const match of line.matchAll(eachPattern)) {
      const [, subjectText, scoreText] = match;
      if (isNoisyScoreLine(subjectText)) continue;
      for (const subject of extractSubjectsFromText(subjectText)) {
        setSubjectMaxHint(result, subject, Number.parseInt(scoreText, 10));
      }
    }

    const subjects = line.match(subjectPattern);
    if (!subjects || subjects.length === 0) continue;
    const nums = line.match(/\d{2,3}(?=\s*分|\s*$)/g)?.map((n) => Number.parseInt(n, 10)) || [];
    const validNums = nums.filter((n) => Number.isFinite(n) && n > 0 && n <= 200);
    if (validNums.length === 1 && /各|分别|均/.test(line)) {
      for (const subjectRaw of subjects) setSubjectMaxHint(result, subjectRaw, validNums[0]);
    }
  }
  return result;
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
    .replace(/[:：].*$/, '')
    .replace(/\s*\d{3,4}\s*分.*$/, '')
    .replace(/（[^）]*）/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesStageSchoolName(candidate: string, stage: EducationStage): boolean {
  if (stage === 'high') {
    if (/(中学|高中|附中|一中|二中|三中|四中|五中|六中|七中|八中|九中|十中)/.test(candidate)) {
      return false;
    }
    return /(大学|学院|职业技术大学|职业技术学院|职业学院|高等专科学校)/.test(candidate);
  }
  if (stage === 'middle') {
    return /(中学|高中|附中|学校|一中|二中|三中|四中|五中|六中|七中|八中|九中|十中)/.test(candidate);
  }
  return /(中学|初中|附中|学校|一中|二中|三中|四中|五中|六中|七中|八中|九中|十中)/.test(candidate);
}

function extractSchoolCandidates(content: string, keyword?: string, stage: EducationStage = 'middle'): string[] {
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
    if (!matchesStageSchoolName(candidate, stage)) continue;
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

  const names = extractSchoolCandidates(merged, kw, stage).slice(0, limit);
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
  const stageSlug = options?.stageSlug ?? 'middle';
  const internalMaterial = getInternalMaterialContext({
    stageSlug,
    module: 'knowledge',
    limit: 12,
  });
  const framework = buildProfessionalReportFramework('knowledge');
  const studentContext = appendProfileAndStageRules(
    `${framework}

【本次知识点】
教材版本：${input.textbook_version}
学科：${input.subject}
年级学期：${input.grade_semester}
章节：${input.chapter}
知识点：${input.knowledge_point}

【知识点专项补充规则】
1. 先判断该知识点在本章节和升学考试中的位置，再结合学生档案判断风险；没有该生专项测评时，必须写“待验证”，不得把常见错因当成既成事实。
2. 明确前置知识、当前核心题型、后续受影响章节，以及未来1-2学期可能出现的连锁失分。
3. 给出3-5道诊断题/一次章节测评/近3套试卷错题的验证方案，并明确判定标准。
4. 产品路径必须按“AI诊断 → 知识点课程补概念 → 同步课跟章节 → 解题/培优课练题型 → 阶段测评与错题复盘”组织。
5. 禁止臆造本知识点的中考分值占比、命题概率、提分幅度或补救成本倍数；没有输入证据时只做定性判断。

【内部资源库素材（优先使用）】
${internalMaterial}`,
    stageSlug,
    options?.profile,
  );
  const payload: Record<string, unknown> = {
    ...input,
    student_context: studentContext,
  };
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

function buildFilledScoreTotals(
  scores: Record<string, number>,
  maxValues?: Record<string, number>,
): string {
  const entries = Object.entries(scores);
  const scoreTotal = entries.reduce((sum, [, score]) => sum + score, 0);
  const hasAllMaxValues = entries.length > 0
    && entries.every(([subject]) => Number.isFinite(maxValues?.[subject]));
  if (!hasAllMaxValues || !maxValues) {
    return `已填${entries.length}科合计：${scoreTotal}分（缺少部分满分，不能视为完整考试总分）`;
  }
  const maxTotal = entries.reduce((sum, [subject]) => sum + (maxValues[subject] || 0), 0);
  const rate = maxTotal > 0 ? Math.round((scoreTotal / maxTotal) * 100) : 0;
  return `已填${entries.length}科合计：${scoreTotal}/${maxTotal}分（得分率${rate}%）；仅代表已填科目，不自动等于完整考试总分`;
}

export function buildDiagnosisPrompt(ctx: DiagnosisFormContext, options?: PromptBuildOptions): string {
  const stage = options?.stageSlug ? mapStageSlugToEducationStage(options.stageSlug) : getEducationStage(ctx.grade);
  const currentStageSlug = options?.stageSlug ?? mapEducationStageToStageSlug(stage);
  const internalMaterial = getInternalMaterialContext({
    stageSlug: currentStageSlug,
    module: 'diagnosis',
    limit: 12,
  });
  const parts: string[] = [];
  if (ctx.diagnosisDate) parts.push(`诊断日期：${ctx.diagnosisDate}`);
  if (ctx.academicPeriod) parts.push(`当前教学阶段：${ctx.academicPeriod}`);
  if (ctx.textbookVersions && Object.keys(ctx.textbookVersions).length > 0) {
    const versionText = Object.entries(ctx.textbookVersions)
      .map(([subject, version]) => `${subject}${version}`)
      .join('、');
    parts.push(`地区教材版本参考：${versionText}（版本按地区常用教材推测，需用学生教材封面或目录核实）`);
  }
  const boardingLabel = ctx.boardingType === 'day' ? '走读' : ctx.boardingType === 'boarding' ? '住读' : '';
  if (boardingLabel) parts.push(`学习模式：${boardingLabel}${ctx.monthlyStudyHours ? `，每月自主学习约${ctx.monthlyStudyHours}小时` : ''}`);

  if (stage === 'high') {
    parts.push('分析边界：仅输出高考-大学-专业-就业主线；禁止给出中考策略。若需回溯基础问题，仅可定位到初中知识短板成因。');
    if (ctx.examMode) parts.push(`高考选科模式：${ctx.examMode}`);
    if (ctx.examDate) parts.push(`高考日期：${ctx.examDate}`);
    if (ctx.targetSchool) parts.push(`目标大学：${ctx.targetSchool}`);
    if (ctx.targetMajor) parts.push(`目标专业：${ctx.targetMajor}`);
    if (ctx.careerIntent) parts.push(`学生意向方向：${ctx.careerIntent}`);
    if (ctx.targetScore != null) parts.push(`该校近年投档线：${ctx.targetScore}分`);
  } else if (stage === 'middle') {
    if (ctx.examDate) parts.push(`中考日期：${ctx.examDate}`);
    if (ctx.targetSchool) parts.push(`目标高中：${ctx.targetSchool}`);
    if (ctx.targetScore != null) parts.push(`该校2025年录取线：${ctx.targetScore}分`);
  } else {
    if (ctx.targetSchool) parts.push(`目标初中：${ctx.targetSchool}`);
    parts.push(`升学方向：小升初（免试就近入学、公民同招）`);
  }

  if (ctx.schoolReferenceContext) {
    parts.push(`用户未填写具体目标，系统自动匹配的本地升学参照：\n${ctx.schoolReferenceContext}`);
  }

  if (ctx.problemDesc && ctx.problemDesc.trim()) {
    parts.push(`学生/家长自述痛点：${ctx.problemDesc.trim()}`);
  }
  const scoresText = buildScoresText(ctx.scores, ctx.scoreMaxValues);
  const filledScoreTotals = buildFilledScoreTotals(ctx.scores, ctx.scoreMaxValues);
  const filledSubjectsText = (ctx.filledSubjects || Object.keys(ctx.scores)).join('、');
  const missingSubjectsText = (ctx.missingSubjects || []).join('、');
  const examLabel = stage === 'high' ? '高考模拟' : stage === 'middle' ? '中考模拟' : '小升初期末统考';
  const stageLabel = stage === 'high' ? '高中' : stage === 'middle' ? '初中' : '小学';
  const framework = buildProfessionalReportFramework('diagnosis');
  const base = `${framework}

【当前诊断数据】
当前学段（强约束）：${stageLabel}
考试类型（强约束）：${examLabel}
若输入年级与学段冲突，必须以当前学段为准；禁止切换为其他考试体系（小学=小升初，初中=中考，高中=高考）。
各科成绩（含满分与得分率）：${scoresText}\n${parts.join('\n')}
${filledScoreTotals}

已填写科目：${filledSubjectsText || '未提供'}
未填写科目：${missingSubjectsText || '无'}

【诊断专项硬性要求】
1. 必须使用“总-分-总”结构：先输出整体结论，再逐科展开，最后给综合收口和执行优先级。
2. 只对“已填写科目”做分数评价，不得臆测未填写科目的具体分数表现。
3. 已填写科目必须全部出现且逐科回答，禁止只挑一个科目分析。若已填写“数学、英语、物理”，报告必须分别出现“数学诊断”“英语诊断”“物理诊断”。
4. 对未填写科目只说明“需要补充该科成绩后判断”，不得扩写假设性结论。
5. 若只填写1-2科，必须强调“当前结论为局部诊断”，并列出为了判断目标差距最需要补齐的数据。
6. 每个已填写科目回答：当前分/满分/得分率、水平等级、最需验证的1-2类题型或能力问题、对总分和后续学习的影响。
7. 用户填写目标时，以该目标学校和分数线为准；用户未填写时，不得卡住生成，必须使用系统提供的本地参照，初中至少展示普通高中、重点高中各1所及其分数线和年份。
8. 表达要家长易懂、顾问可直接口播，避免官话和模板腔。
9. 必须把诊断日期、年级、当前教学阶段和教材版本放在分析依据中；禁止写成脱离时间的通用学科建议。
10. 每个已填科目必须给出2-3个与“当前年级 + 当前教学阶段 + 教材版本”匹配的具体章节、知识点或题型，写清重难点、常见错法和验证证据。不能只写“英语基础要打牢”“数学多练题”等空话。
11. 教材进度未由用户或学校确认时，必须写“按地区常用版本和校历推测”，并提示用教材目录、最近作业或试卷核实；不得把推测写成已确认事实。
12. 当前处于寒暑假或开学衔接期时，分析必须同时覆盖“上一学期关键漏洞复盘”和“新学期前置知识”，不能照搬学期中进度。

【本模块边界】
0. 下面的模块边界和建议输出结构优先级高于插件默认模板；如默认模板要求输出长篇政策/完整规划，应主动压缩或省略。
1. 学情诊断只回答“目前什么水平、哪科拖后腿、离目标差多少、不处理会怎样、还剩哪些关键时间窗口”。
2. 只引用当前目标学校及其录取线，不展开多套学校梯度、志愿批次、选科专业和长期升学路线。
3. 必须把分数差距翻译成家长听得懂的具体风险，例如“数学再卡在90分上下，会把总分拉开约20分”。
4. 不输出每日课表、周训练表或完整产品使用方案；结尾只引导进入“学习规划”生成具体安排。
5. 输出优先采用当地课程顾问口吻：先说现状，再对照目标，说明危机链和时间窗口，最后给出下一步。
6. 第一至五章优先使用短结论、表格和节点，不得连续输出超过120字的大段文字；危机话术按“认可、定位、风险、行动”四个短段落输出，每段最多2句话。

【问题定位证据规则】
1. 分数只能用于提出“待验证的问题假设”，不能仅凭单次分数断言具体知识点已经失分。
2. 每科列1-2个最高优先级验证项，并说明应查看哪些错题、章节测评或课堂表现来确认。
3. 危机链必须对应已发现的问题、后续章节、下一考试节点和目标差距，不得用恐吓式结论。
4. 第一至五章负责分析，第六章用顾问可直接转述的话术综合收口。

【内部资源库素材（优先使用）】
${internalMaterial}

【融合要求】
1. 先按内部诊断与沟通口径组织输出，再补充最新公开政策信息。
2. 产品/服务表达以内部口径为准；政策/时间节点以公开最新信息为准。`;

  if (currentStageSlug) {
    return appendProfileAndStageRules(base, currentStageSlug, options?.profile);
  }
  return base;
}

export function buildPlanAdditionalInfo(ctx: PlanFormContext, options?: PromptBuildOptions): string {
  const stage = options?.stageSlug ? mapStageSlugToEducationStage(options.stageSlug) : getEducationStage(ctx.grade);
  const currentStageSlug = options?.stageSlug ?? mapEducationStageToStageSlug(stage);
  const internalMaterial = getInternalMaterialContext({
    stageSlug: currentStageSlug,
    module: 'plan',
    limit: 12,
  });
  const parts: string[] = [buildProfessionalReportFramework('plan')];
  const lockedExamType = stage === 'high' ? '高考' : stage === 'middle' ? '中考' : '小升初';
  parts.push(`升学类型（强约束）：${lockedExamType}`);
  parts.push('学段强约束：若输入年级与学段冲突，必须按当前学段输出，不得混入其他考试体系。');
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
  if (!ctx.targetSchool && ctx.targetScore == null) {
    if (stage === 'middle') {
      parts.push('用户未填写目标学校和目标分数：必须从“地区录取政策”中自动选择普通高中、重点高中各1所，列出学校名称、分数线、年份及与当前成绩的差距；不得要求用户返回补填后才生成');
    } else if (stage === 'high') {
      parts.push('用户未填写目标院校和目标分数：必须从“地区录取政策”中给出稳妥、冲刺两个院校层级参照及可核验投档线；不得停止生成');
    } else {
      parts.push('用户未填写目标初中：基于本地入学政策给出稳妥与进阶两类学校参考，不得虚构录取分数线或停止生成');
    }
  }
  if (stage !== 'elementary' && ctx.careerIntent) {
    parts.push(`学生未来意向方向：${ctx.careerIntent}`);
  }
  const scoresText = buildScoresText(ctx.scores, ctx.scoreMaxValues);
  parts.push(`各科成绩（含满分与得分率）：${scoresText}`);
  parts.push(buildFilledScoreTotals(ctx.scores, ctx.scoreMaxValues));
  const latestYear = Math.max(new Date().getFullYear(), ctx.examYear || 0);
  if (stage === 'high') {
    parts.push('输出要求：以“能冲哪些大学、可选哪些专业、对应就业方向与风险”为主线；禁止按中考逻辑给建议');
    parts.push('若仅填写部分科目，需先基于已填科目诊断选科与专业约束，再给补全科目建议');
  } else if (stage === 'middle') {
    parts.push('输出要求：中考定位为主，同时向后延伸到高中选科预测、大学专业大类与就业能力方向');
    parts.push('路径对比必须包含重点高中、普通高中、中职/职教高考，并直观说明升学、规划、专业课、资源、费用和就业的区别；“5:5分流”不得当作全国统一比例，必须按本地当年官方招生计划和分数线说明');
  } else {
    parts.push('输出要求：聚焦小升初路径和学科长期倾向观察，不过早推荐高中选科或职业');
  }
  parts.push('模块边界（最高优先级）：升学报告只保留支撑选择的学情结论，重点说清当前梯队、目标差距、路径取舍、选科与专业就业影响；详细学情溯源归学情诊断，逐月安排归备考路线图');
  parts.push('输出必须具体：必须出现当前总分、目标线/梯度线、总分差距、至少2个科目的提分目标或风险说明；不得只写“夯实基础、加强训练、提升能力”等空泛表达');
  parts.push('顾问表达标准：先结论后依据，先把升学后果讲清楚，再给动作；每条动作都要绑定科目、分值目标、验收时间或题型方向');
  parts.push('目标拆解要求：有目标分时必须输出“当前总分、目标总分、总分差、各科建议补分”；部分科目缺失时不得把已填科目合计冒充总分，要列出待补科目');
  parts.push('篇幅要求：整体控制在 1000~1500 字，优先用表格做路径对比，六个固定章节必须完整，禁止同义重复');
  parts.push(`时间要求：必须使用${latestYear}年及之后的最新时间节点，若缺少官方数据请明确说明`);
  parts.push('表达要求：用家长易懂的大白话，不使用晦涩术语');
  parts.push(`内部资源库素材（优先）：\n${internalMaterial}`);
  parts.push('融合要求：先采用内部话术与产品口径，再结合互联网最新政策和分数信息综合输出');
  const base = parts.join('；');

  if (currentStageSlug) {
    return appendProfileAndStageRules(base, currentStageSlug, options?.profile);
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
  policyContent: string,
  examType: '小升初' | '中考' | '高考' = '中考',
): string {
  const structureText = Object.entries(scoreStructure)
    .map(([subject, score]) => `${subject}${score}分`)
    .join('、');

  const linesText = admissionLines
    .map((line) => `${line.batch} - ${line.school}: ${line.score}分`)
    .join('\n');

  const examLabel = examType === '高考' ? '高考' : examType === '小升初' ? '小升初' : '中考';
  return `${examLabel}总分: ${totalScore}分\n科目分值构成: ${structureText}\n\n录取分数线:\n${linesText}\n\n政策概要:\n${policyContent}`;
}
