import { capabilityClient } from '@lark-apaas/client-toolkit';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { StageSlug } from '@client/src/config/stages';
import { appendProfileAndStageRules } from '@client/src/config/stage-analysis-rules';
import { getInternalMaterialContext } from '@client/src/config/internal-resource-library';
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
2. 时间分配按目标差距与薄弱程度加权，禁止平均分配。
3. 走读需考虑通勤/作业/晚饭；住读需利用晚自习与周末，禁止生成不匹配的模式。
4. 每项任务必须有：完成标准、检测方式、优先级。
5. 政策/分数线/院校信息查不到须标注「暂无官方确认信息」，禁止编造。
6. 若为高中学段，必须以“大学-专业-就业能力”主线输出，禁止套用中考提分模板；可回溯初中知识点仅用于定位成因。
7. 表格必须足够长：至少输出“连续14天执行表”，每天至少2个任务格；若用户只提供一周信息，第2周按“同节奏迭代版”生成。
8. 每个任务必须写清楚：做什么题/背什么内容、做多少、用多久、错了怎么处理、谁来检查。
9. 必须额外输出“家长/老师检查表”和“未完成降级方案”，方便直接复制给家长执行。

【输出结构】必须 Markdown，且包含以下章节与表格：
# 个性化课表学习执行方案
## 一、可用时间盘点
## 二、连续14天课表学习安排（表格：日期|可用时段|优先科目|具体任务|题量/背诵量|预计时长|完成标准|检查方式|未完成降级）
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
  let payload: Record<string, unknown> = { ...input };
  if (options?.stageSlug) {
    const internalMaterial = getInternalMaterialContext({
      stageSlug: options.stageSlug,
      module: 'knowledge',
      limit: 10,
    });
    const appendix = appendProfileAndStageRules(
      `【知识点】${input.knowledge_point}（${input.chapter}）`,
      options.stageSlug,
      options.profile,
    );
    payload = {
      ...input,
      knowledge_point: `${appendix}

【内部资源库讲解素材（优先）】
${internalMaterial}

【融合要求】先按内部讲解话术组织表达，再结合最新公开教材/考情信息补充，输出必须可执行。`,
    };
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
  const stage = options?.stageSlug ? mapStageSlugToEducationStage(options.stageSlug) : getEducationStage(ctx.grade);
  const currentStageSlug = options?.stageSlug ?? mapEducationStageToStageSlug(stage);
  const internalMaterial = getInternalMaterialContext({
    stageSlug: currentStageSlug,
    module: 'diagnosis',
    limit: 12,
  });
  const parts: string[] = [];
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

  if (ctx.problemDesc && ctx.problemDesc.trim()) {
    parts.push(`学生/家长自述痛点：${ctx.problemDesc.trim()}`);
  }
  const scoresText = buildScoresText(ctx.scores, ctx.scoreMaxValues);
  const filledSubjectsText = (ctx.filledSubjects || Object.keys(ctx.scores)).join('、');
  const missingSubjectsText = (ctx.missingSubjects || []).join('、');
  const examLabel = stage === 'high' ? '高考模拟' : stage === 'middle' ? '中考模拟' : '小升初期末统考';
  const stageLabel = stage === 'high' ? '高中' : stage === 'middle' ? '初中' : '小学';
  const base = `当前学段（强约束）：${stageLabel}
考试类型（强约束）：${examLabel}
若输入年级与学段冲突，必须以当前学段为准；禁止切换为其他考试体系（小学=小升初，初中=中考，高中=高考）。
各科成绩（含满分与得分率）：${scoresText}\n${parts.join('\n')}

已填写科目：${filledSubjectsText || '未提供'}
未填写科目：${missingSubjectsText || '无'}

【诊断输出硬性要求】
1. 必须使用“总-分-总”结构：先输出整体结论，再逐科展开，最后给综合收口和执行优先级。
2. 只对“已填写科目”做分数评价，不得臆测未填写科目的具体分数表现。
3. 已填写科目必须全部出现且逐科回答，禁止只挑一个科目分析。若已填写“数学、英语、物理”，报告必须分别出现“数学诊断”“英语诊断”“物理诊断”。
4. 对“未填写科目”仅输出“未来潜在卡点提醒”，说明这些科目在后续升学/选科/提分中的风险点与补数建议，不得给出具体分数结论。
5. 若只填写1-2科，必须强调“当前结论为局部诊断”，并给出下一步最优先补齐科目。
6. 每个已填写科目都要回答：当前分/满分/得分率、风险等级、最可能丢分题型、原因、2周动作、验收标准。
7. 表达要家长易懂、顾问可直接口播，避免官话和模板腔。
8. 禁止使用空泛建议：不得只写“夯实基础、提升能力、加强练习、查漏补缺、培养习惯”。出现建议时必须同时写清知识点/题型、动作、题量、频次、验收标准。

【本模块边界】
0. 下面的模块边界和建议输出结构优先级高于插件默认模板；如默认模板要求输出长篇政策/完整规划，应主动压缩或省略。
1. 学情诊断只回答“为什么丢分、哪科拖后腿、具体会卡住哪些知识点、如果不处理会怎样掉分”。
2. 禁止展开学校梯度、志愿批次、完整升学路线和长期课表安排，这些留给升学规划/学习规划模块。
3. 必须把分数差距翻译成家长听得懂的具体风险，例如“数学再卡在90分上下，会把总分拉开约20分”。
4. 少用“夯实基础、提升能力、加强复盘”等空话；每条建议必须绑定具体科目、具体题型/知识点、具体动作。
5. 输出优先采用当地课程顾问口吻：先说最危险的问题，再说原因，再说不处理的后果，最后给本周动作。

【核心知识漏洞溯源展开规则】
1. 每个已填写科目都必须至少展开2个“具体知识点/题型卡点”；风险较高科目展开3个。不能只写“基础不牢”“计算粗心”。
2. 每个卡点必须按固定链路写清楚：核心问题诊断 → 证据依据 → 产生现象的原因分析 → 具体可实施可量化动作 → 预计多久带来什么收获。
3. “核心问题诊断”要具体到知识点或题型，例如：一次函数交点与方程组互转、几何辅助线、英语完形上下文线索、语文现代文概括题答题框架等。
4. “证据依据”必须引用已给分数、得分率、目标线差距、家长自述或常见同分段错误表现，不能无依据下结论。
5. “原因分析”必须包含至少一种认知/习惯因素，例如：读题只抓关键词不看限制条件、步骤跳写、错题只改答案不复盘错误类型、不会把题型归类。
6. “动作”必须可量化，必须写清训练频次、题量、检查标准，例如：连续7天每天10道同类题，错题按“错因-正确步骤-同类迁移题”三栏复盘。
7. “预期收获”必须给时间范围和可观察指标，例如：2周内同类题正确率从60%拉到75%左右，4周内单科稳定提升5-8分。
8. 若信息不足，必须用“需要补充一次近3套试卷错题后确认”，但仍要基于该分数段列出最需要验证的题型假设，不能只说信息不足。

【强制输出结构：总-分-总】
# 学情诊断结论
## 一、总览结论
- 3句话以内：整体风险、最拖分科目、先补顺序。
- 必须点名所有已填写科目，说明哪科优先、哪科守住、哪科需要验证。

## 二、分科诊断
按已填写科目逐科输出，每科使用同一结构：
### 科目名诊断
- 当前表现：分数/满分/得分率/风险等级。
- 主要卡点：列2-3个具体知识点或题型。
- 失分原因：写清认知、步骤、审题、训练或习惯原因。
- 不处理的后果：本学科后续影响 + 对其他科/升学总分的连锁影响。
- 2周动作：题型、题量、频次、错题复盘方式、验收标准。

## 三、综合收口
- 2-4周提分路径：先做什么，再做什么，如何复查。
- 本周必须先做的3件事：每件事写清题量、频次、验收标准。
- 未填科目提醒：只提醒补数优先级，不做具体分数判断。

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
  const parts: string[] = [];
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
  if (stage === 'high' && ctx.careerIntent) {
    parts.push(`学生未来意向方向：${ctx.careerIntent}`);
  }
  const scoresText = buildScoresText(ctx.scores, ctx.scoreMaxValues);
  parts.push(`各科成绩（含满分与得分率）：${scoresText}`);
  const latestYear = Math.max(new Date().getFullYear(), ctx.examYear || 0);
  if (stage === 'high') {
    parts.push('输出要求：以“能冲哪些大学、可选哪些专业、对应就业方向与风险”为主线；禁止按中考逻辑给建议');
    parts.push('若仅填写部分科目，需先基于已填科目诊断选科与专业约束，再给补全科目建议');
  } else {
    parts.push('输出要求：政策信息点到为止，重点回答“能上什么学校、差多少分、怎么补分、关键时间点”');
  }
  parts.push('模块边界（最高优先级）：升学规划只回答“按当地政策和目标线，现在处在哪个梯队、差多少分、各科要补到多少、先抓哪科最划算、什么时间前必须看到变化”；禁止重复学情诊断里的知识漏洞长篇归因');
  parts.push('输出必须具体：必须出现当前总分、目标线/梯度线、总分差距、至少2个科目的提分目标或风险说明；不得只写“夯实基础、加强训练、提升能力”等空泛表达');
  parts.push('顾问表达标准：先结论后依据，先把升学后果讲清楚，再给动作；每条动作都要绑定科目、分值目标、验收时间或题型方向');
  parts.push('建议输出结构：# 升学规划结论；## 一句话定位；## 当地政策和目标线；## 当前分数对应梯队；## 目标差距与各科补分优先级；## 4-8周行动表；## 家长必须重视的风险');
  parts.push('篇幅要求：整体控制在 600~900 字，先结论后依据，禁止同义重复');
  parts.push('结构要求：最多 5 个小节，每节不超过 3 条要点');
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
