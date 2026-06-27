import type { StageSlug } from '@client/src/config/stages';

export type SourceType = '官方' | '学校' | '内部测评' | '用户填写' | '历史记录' | 'AI推断';
export type AdviceRole = 'sales' | 'parent';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface AdviceDataSourceMeta {
  source_name: string;
  source_type: SourceType;
  region: string;
  grade: string;
  updated_at: string;
  confidence: number;
  limitation: string;
  need_confirm: boolean;
}

export interface StudentSnapshot {
  stageSlug: StageSlug;
  stageLabel: string;
  grade: string;
  region: string;
  school: string;
  schoolType?: string;
  currentScoreText: string;
  currentTotalScore: number;
  targetSchool: string;
  targetScore?: number;
  targetMajor?: string;
  rankText?: string;
  trendText?: string;
  weakSubjects: string;
  strongSubjects: string;
  parentGoal?: string;
  careerIntent?: string;
}

export interface DiagnosisProblemItem {
  title: string;
  symptom: string;
  reason: string;
  impact: string;
  urgency: '高' | '中' | '低';
  solution: string;
}

export interface DiagnosisRiskItem {
  title: string;
  level: RiskLevel;
  detail: string;
}

export interface DiagnosisOpportunityItem {
  title: string;
  detail: string;
  product_mapping: string[];
}

export interface StructuredDiagnosis {
  levelLabel: '薄弱' | '中等' | '中上' | '优秀' | '冲刺名校';
  regionPosition: string;
  targetGap: {
    scoreGap: number | null;
    rankGap: string;
    abilityGap: string;
  };
  coreProblems: DiagnosisProblemItem[];
  risks: DiagnosisRiskItem[];
  opportunities: DiagnosisOpportunityItem[];
}

export interface AdviceScriptTemplate {
  scene: string;
  user_role: AdviceRole;
  intent: string;
  input_required: string[];
  script: string;
  fallback_script: string;
  forbidden_words: string[];
  product_mapping: string[];
  next_action: string;
}

export interface ParentSection {
  title: string;
  content: string;
}

export function parseScoreOverview(text: string): number {
  if (!text.trim()) return 0;
  const matches = text.match(/\d{1,3}/g) || [];
  return matches
    .map((item) => Number.parseInt(item, 10))
    .filter((n) => Number.isFinite(n))
    .reduce((sum, n) => sum + n, 0);
}

function stageBaselineTotal(stageSlug: StageSlug): number {
  if (stageSlug === 'elementary') return 300;
  if (stageSlug === 'high') return 750;
  return 700;
}

function buildLevelLabel(snapshot: StudentSnapshot): StructuredDiagnosis['levelLabel'] {
  const baseline = stageBaselineTotal(snapshot.stageSlug);
  const ratio = baseline > 0 ? snapshot.currentTotalScore / baseline : 0;
  if (ratio < 0.45) return '薄弱';
  if (ratio < 0.62) return '中等';
  if (ratio < 0.76) return '中上';
  if (ratio < 0.88) return '优秀';
  return '冲刺名校';
}

function buildRegionPosition(level: StructuredDiagnosis['levelLabel']): string {
  if (level === '薄弱') return '当前在本区同年级中大致处于基础补齐区间';
  if (level === '中等') return '当前在本区同年级中大致处于中段水平';
  if (level === '中上') return '当前在本区同年级中大致处于中上段水平';
  if (level === '优秀') return '当前在本区同年级中大致处于优秀段位';
  return '当前在本区同年级中具备冲刺头部学校的潜力';
}

function buildCoreProblems(snapshot: StudentSnapshot): DiagnosisProblemItem[] {
  const weak = snapshot.weakSubjects || '核心薄弱科目';
  const result: DiagnosisProblemItem[] = [
    {
      title: '基础知识稳定性不足',
      symptom: `在${weak}中出现“会一阵、错一片”的波动。`,
      reason: '知识点掌握颗粒度不够，错题没有形成闭环复盘。',
      impact: '短期会直接导致下一次阶段考掉分，长期影响目标校冲刺节奏。',
      urgency: '高',
      solution: '先做诊断测评定位薄弱模块，再用基础模块课+错题回炉做两周闭环。',
    },
    {
      title: '提分路径不够聚焦',
      symptom: '学习投入有，但单次投入分散，难形成稳定提分。',
      reason: '缺少按考试节点拆解的周目标与验收标准。',
      impact: '会导致时间投入与成绩提升不匹配，家长容易产生“学了但没变化”感受。',
      urgency: '中',
      solution: '按30/60/90天分段，先锁定高频考点和高性价比提分模块。',
    },
    {
      title: '升学信息利用不足',
      symptom: '目标学校和当前水平有方向感，但缺少位次/趋势校验。',
      reason: '缺少地区政策、历年录取波动与志愿路径的动态对照。',
      impact: '升学决策容易偏乐观或偏保守，影响志愿安全边界。',
      urgency: '中',
      solution: '把目标校拆成冲稳保三档，并按地区最新政策做动态更新。',
    },
  ];
  return result.slice(0, 3);
}

function buildRisks(snapshot: StudentSnapshot, scoreGap: number | null): DiagnosisRiskItem[] {
  const shortRisk: DiagnosisRiskItem = {
    title: '短期风险',
    level: 'medium',
    detail: `下一次考试中，${snapshot.weakSubjects || '薄弱模块'}若不做专项巩固，容易继续掉分。`,
  };
  const termRisk: DiagnosisRiskItem = {
    title: '中期风险',
    level: 'medium',
    detail: '本学期若没有周复盘机制，提分很可能出现平台期。',
  };
  const admissionRisk: DiagnosisRiskItem = {
    title: '升学风险',
    level: scoreGap != null && scoreGap > 40 ? 'high' : 'medium',
    detail:
      scoreGap == null
        ? '目标学校差距信息不完整，需补充排名和近3次考试趋势后再评估。'
        : scoreGap > 0
          ? `与目标分数线仍有约${scoreGap}分差距，需同步评估冲稳保路径。`
          : '当前分数具备冲刺空间，但仍需防止波动带来的志愿风险。',
  };
  return [shortRisk, termRisk, admissionRisk];
}

function buildOpportunities(snapshot: StudentSnapshot): DiagnosisOpportunityItem[] {
  return [
    {
      title: '高性价比提分模块',
      detail: `优先从${snapshot.weakSubjects || '高频失分模块'}切入，通常在4-8周内最容易看到分数变化。`,
      product_mapping: ['诊断测评', '基础模块课', 'AI错题本'],
    },
    {
      title: '升学路径机会',
      detail: '可结合地区政策做冲稳保三档路径，减少单一路径风险。',
      product_mapping: ['升学规划', '阶段测评', '志愿策略指导'],
    },
    {
      title: '学习效率机会',
      detail: '通过AI拍题精学+定制班，把“不会的题”快速转成“可执行学习动作”。',
      product_mapping: ['AI拍题精学', 'AI定制班', '同步刷题/专项突破'],
    },
  ];
}

export function buildStructuredDiagnosis(snapshot: StudentSnapshot): StructuredDiagnosis {
  const levelLabel = buildLevelLabel(snapshot);
  const scoreGap =
    typeof snapshot.targetScore === 'number'
      ? Math.max(snapshot.targetScore - snapshot.currentTotalScore, 0)
      : null;
  return {
    levelLabel,
    regionPosition: buildRegionPosition(levelLabel),
    targetGap: {
      scoreGap,
      rankGap: snapshot.rankText ? `当前排名信息：${snapshot.rankText}` : '缺少班级/年级排名，建议补充后再评估位次差',
      abilityGap:
        scoreGap == null
          ? '缺少明确目标线，建议先确认目标学校分数/位次边界'
          : scoreGap > 0
            ? `当前与目标线仍有${scoreGap}分能力差距，需分阶段补齐`
            : '当前已接近/达到目标线，重点转为稳定性与上限提升',
    },
    coreProblems: buildCoreProblems(snapshot),
    risks: buildRisks(snapshot, scoreGap),
    opportunities: buildOpportunities(snapshot),
  };
}

export function buildMissingInfo(snapshot: StudentSnapshot): string[] {
  const missing: string[] = [];
  if (!snapshot.grade) missing.push('孩子当前年级');
  if (!snapshot.region) missing.push('所在地区（省/市/区）');
  if (!snapshot.currentScoreText) missing.push('最近一次各科成绩');
  if (!snapshot.rankText) missing.push('班级/年级排名');
  if (!snapshot.trendText) missing.push('最近3-5次考试趋势');
  if (!snapshot.targetSchool) missing.push('目标学校');
  if (typeof snapshot.targetScore !== 'number') missing.push('目标分数或位次');
  return missing;
}

export function buildFollowupScripts(missingItems: string[]): AdviceScriptTemplate[] {
  return missingItems.map((item) => ({
    scene: '信息补全追问',
    user_role: 'sales',
    intent: `补齐${item}，避免误判`,
    input_required: ['家长口述基础信息'],
    script: `为了把建议给准，我先补一个关键点：${item}这块您现在方便告诉我吗？我会按这个信息给您更贴近孩子的方案。`,
    fallback_script: `如果您现在不方便说完整数据也没关系，至少告诉我${item}的大概范围，我先给您一个可执行的初版方案。`,
    forbidden_words: ['保过', '一定能上', '必须报名'],
    product_mapping: ['学习档案建立', '诊断测评'],
    next_action: '补齐关键信息后更新诊断结论',
  }));
}

export function buildParentSections(
  snapshot: StudentSnapshot,
  diagnosis: StructuredDiagnosis,
): ParentSection[] {
  const scoreGapText =
    diagnosis.targetGap.scoreGap == null
      ? '目标差距暂无法精准计算，建议先补齐目标线与排名信息。'
      : diagnosis.targetGap.scoreGap > 0
        ? `离目标分数线大约还差${diagnosis.targetGap.scoreGap}分。`
        : '当前已经接近或达到目标线，重点是稳定发挥和上限提升。';

  return [
    {
      title: '孩子当前位置',
      content: `${snapshot.stageLabel}${snapshot.grade || ''}当前整体在「${diagnosis.levelLabel}」区间，${diagnosis.regionPosition}。`,
    },
    {
      title: '主要问题（最多3个）',
      content: diagnosis.coreProblems
        .slice(0, 3)
        .map((item, index) => `${index + 1}. ${item.symptom}（建议：${item.solution}）`)
        .join('\n'),
    },
    {
      title: '目标差距',
      content: scoreGapText,
    },
    {
      title: '提升路径（30/60/90天）',
      content:
        '30天：先补基础漏洞，建立错题闭环；\n60天：高频考点专项突破，形成稳定提分；\n90天：按目标学校要求做冲刺与模拟复盘。',
    },
    {
      title: '家长配合建议',
      content:
        '每天：检查当天学习是否完成并做简短反馈；\n每周：和孩子做一次错题复盘；\n每月：和顾问核对阶段目标与策略调整。',
    },
    {
      title: '下一步建议',
      content:
        '建议先完成一次诊断测评与规划确认，再安排试听或学习方案细化，避免盲目投入。',
    },
  ];
}

function commonForbiddenWords(): string[] {
  return ['保过', '保录', '一定能上', '百分百提分', '必须报名'];
}

export function buildSalesScriptTemplates(snapshot: StudentSnapshot): AdviceScriptTemplate[] {
  const targetText = snapshot.targetSchool || '目标学校';
  const weak = snapshot.weakSubjects || '当前薄弱科目';
  const scripts: AdviceScriptTemplate[] = [
    {
      scene: '开场确认话术',
      user_role: 'sales',
      intent: '快速确认核心信息并建立专业感',
      input_required: ['年级', '地区', '最近成绩', '目标学校', '家长诉求'],
      script:
        `我先用1分钟把情况对齐：孩子现在是${snapshot.grade || '几'}年级，在${snapshot.region || '本地'}，最近成绩大概在哪个区间？您最关注的是提分、择校还是学习习惯？我对齐后给您一个更具体的建议。`,
      fallback_script: '如果分数一时记不全也没关系，先告诉我总分大概和最薄弱科目，我先给您初步判断。',
      forbidden_words: commonForbiddenWords(),
      product_mapping: ['学情诊断', '学习档案'],
      next_action: '收集基础信息并进入诊断反馈',
    },
    {
      scene: '学情反馈话术',
      user_role: 'sales',
      intent: '让家长听懂问题并认可诊断方向',
      input_required: ['薄弱科目', '成绩波动信息'],
      script:
        `从目前信息看，孩子主要卡在${weak}，不是“学不会”，而是“会了不稳”。这类情况最怕考试时波动，我们会先把基础点补齐，再做高频题型训练，先稳住分数再拉上限。`,
      fallback_script: '目前数据还不够细，我先给您方向：先稳基础、再做高频专项，这是最稳妥的提分路径。',
      forbidden_words: commonForbiddenWords(),
      product_mapping: ['诊断测评', '基础模块课', 'AI错题本'],
      next_action: '确认家长是否接受分阶段方案',
    },
    {
      scene: '痛点放大话术',
      user_role: 'sales',
      intent: '真实提示节点风险，推动家长重视执行',
      input_required: ['升学节点', '目标学校信息'],
      script:
        `现在最大的风险不是“学得慢”，而是“节点前还在盲学”。越靠近升学节点，试错成本越高。我们现在做的是把时间花在最能提分的点上，避免后面临时补救。`,
      fallback_script: '先别焦虑，我们只把有限时间用在最关键的提分点上，节点前仍有机会拉开差距。',
      forbidden_words: commonForbiddenWords(),
      product_mapping: ['升学规划', '阶段测评'],
      next_action: '推进到具体执行计划确认',
    },
    {
      scene: '产品衔接话术',
      user_role: 'sales',
      intent: '把问题与产品能力一一映射',
      input_required: ['孩子问题类型', '学习目标'],
      script:
        '如果基础薄弱，我们先上“诊断测评+基础模块课+错题闭环”；如果是中等提分，就用“高频考点突破+学习规划+阶段测评”；如果是冲刺目标校，就做“拔高题训练+目标校规划+志愿策略”。',
      fallback_script: '先按“先补短板再提上限”的顺序走，后续根据测评结果再细分产品组合。',
      forbidden_words: commonForbiddenWords(),
      product_mapping: ['AI拍题精学', 'AI错题本', 'AI定制班', '同步刷题/专项突破'],
      next_action: '给出最小可执行产品组合',
    },
    {
      scene: '异议处理-没时间',
      user_role: 'sales',
      intent: '降低时间顾虑',
      input_required: ['每天可用时长'],
      script:
        '这个顾虑很真实，所以我们不做大块时间投入，而是每天20-30分钟做高性价比任务，核心是“短时高频+错题闭环”，孩子执行压力会小很多。',
      fallback_script: '先按最小节奏试一周，每天固定一个短时段，先看执行和反馈。',
      forbidden_words: commonForbiddenWords(),
      product_mapping: ['AI定制班', '错题闭环'],
      next_action: '约定最小执行节奏',
    },
    {
      scene: '异议处理-先看看',
      user_role: 'sales',
      intent: '把观望转为低门槛行动',
      input_required: ['家长观望原因'],
      script:
        '完全可以先看，我们先做一个低成本动作：先把最近一次成绩单和错题类型过一遍，我给您出一版可执行的7天方案，您看是否有价值再决定下一步。',
      fallback_script: '先不急着做决定，我们先用一份小方案验证方向对不对。',
      forbidden_words: commonForbiddenWords(),
      product_mapping: ['学习档案', '规划课'],
      next_action: '推进资料收集并预约规划',
    },
    {
      scene: '异议处理-价格贵',
      user_role: 'sales',
      intent: '把关注点从价格转到效果与路径',
      input_required: ['预算区间', '目标周期'],
      script:
        '您关注价格非常正常。我们更建议看“单位时间的提分效率”。价格口径以最新活动政策为准，我可以按孩子当前问题给您做轻重缓急拆分，先做最必要的一段，避免一次性投入过大。',
      fallback_script: '先按阶段目标做分段投入，优先做对当前最关键的一部分。',
      forbidden_words: commonForbiddenWords(),
      product_mapping: ['分阶段学习方案'],
      next_action: '给出分段方案与预算匹配建议',
    },
    {
      scene: '异议处理-已在别处补',
      user_role: 'sales',
      intent: '做增量价值定位',
      input_required: ['现有补习情况'],
      script:
        '已经在补是好事，我们不和现有补习冲突。我们的价值是把孩子“没吸收的部分”做二次闭环，尤其是错题定位和阶段复盘，帮助已有投入更有效。',
      fallback_script: '先做补充型方案，不替代原有安排，只补最薄弱环节。',
      forbidden_words: commonForbiddenWords(),
      product_mapping: ['错题闭环', '阶段复盘'],
      next_action: '确认与现有学习安排的衔接点',
    },
    {
      scene: '异议处理-孩子不愿意学',
      user_role: 'sales',
      intent: '重建孩子可执行体验',
      input_required: ['孩子学习动机情况'],
      script:
        '孩子不愿意学，很多时候不是态度问题，而是持续挫败。我们会先让他在“能做出来”的任务上建立反馈感，再逐步加难度，先恢复自信和节奏。',
      fallback_script: '先从孩子最容易完成的一小段开始，先建立正反馈再提要求。',
      forbidden_words: commonForbiddenWords(),
      product_mapping: ['AI拍题精学', '定制任务'],
      next_action: '安排低难度起步任务并跟进反馈',
    },
    {
      scene: '异议处理-担心效果',
      user_role: 'sales',
      intent: '用可量化过程降低不确定性',
      input_required: ['可接受的观察周期'],
      script:
        '担心效果非常正常，我们不做夸大承诺。做法是把目标拆成每周可量化指标：完成率、正确率、错题回炉率，先看过程数据再看分数变化。',
      fallback_script: '先约一个短周期观察点，用数据看变化，而不是只看主观感受。',
      forbidden_words: commonForbiddenWords(),
      product_mapping: ['阶段测评', '学习报告'],
      next_action: '约定7-14天复盘节点',
    },
    {
      scene: '促进行动话术',
      user_role: 'sales',
      intent: '推动到下一步而非强成交',
      input_required: ['家长时间安排'],
      script:
        `咱们先不着急定长期方案，先做下一步：我建议先约一次测评/规划确认，把${targetText}的路径和风险边界先跑清楚，您看今天还是明天哪个时间方便？`,
      fallback_script: '先约一个15分钟确认时间，把关键数据对齐后再决定后续安排。',
      forbidden_words: commonForbiddenWords(),
      product_mapping: ['测评预约', '规划课', '试听安排'],
      next_action: '落地预约时间与资料提交',
    },
  ];
  return scripts;
}

export function buildPromptTemplate(input: {
  scene: string;
  stageLabel: string;
  question: string;
  internalMaterial: string;
  internalAnchor: string;
  moduleContext: string;
  internetContext: string;
}): string {
  const { scene, stageLabel, question, internalMaterial, internalAnchor, moduleContext, internetContext } = input;
  return [
    `【角色】你是20年K12课程顾问（${stageLabel}场景）。`,
    `【场景】${scene}`,
    `【问题】${question}`,
    '',
    '【内部素材优先】',
    internalMaterial,
    `内部话术锚点：${internalAnchor}`,
    '',
    '【业务上下文】',
    moduleContext || '暂无上下文',
    '',
    '【互联网公开信息】',
    internetContext || '暂无公开信息',
    '',
    '【输出约束】',
    '1. 先内部后外部，必须明确“内部口径 + 公开信息”。',
    '2. 必须结合产品功能与课程特点，不得空泛。',
    '3. 禁用表达：保过、保录、一定能上。',
    '4. 输出结构：结论一句 + 3~5条可直接沟通的话术 + 下一步动作。',
  ].join('\n');
}

export function buildEvidenceMeta(snapshot: StudentSnapshot, confidence: number): AdviceDataSourceMeta[] {
  const now = new Date().toISOString();
  return [
    {
      source_name: '家长/顾问输入信息',
      source_type: '用户填写',
      region: snapshot.region || '待确认',
      grade: snapshot.grade || '待确认',
      updated_at: now,
      confidence: Math.max(40, confidence - 10),
      limitation: '可能存在主观误差，需要结合成绩单和试卷核验',
      need_confirm: true,
    },
    {
      source_name: '系统历史学习记录',
      source_type: '历史记录',
      region: snapshot.region || '待确认',
      grade: snapshot.grade || '待确认',
      updated_at: now,
      confidence: Math.max(45, confidence - 5),
      limitation: '依赖历史模块是否完整生成',
      need_confirm: false,
    },
    {
      source_name: '区域公开政策检索',
      source_type: '官方',
      region: snapshot.region || '待确认',
      grade: snapshot.grade || '待确认',
      updated_at: now,
      confidence,
      limitation: '政策更新存在时滞，关键节点需人工二次确认',
      need_confirm: true,
    },
    {
      source_name: 'AI综合推断',
      source_type: 'AI推断',
      region: snapshot.region || '待确认',
      grade: snapshot.grade || '待确认',
      updated_at: now,
      confidence: Math.max(35, confidence - 15),
      limitation: '推断结论依赖输入完整度，不可替代人工终审',
      need_confirm: true,
    },
  ];
}

export function estimateConfidence(snapshot: StudentSnapshot): number {
  const missing = buildMissingInfo(snapshot).length;
  if (missing <= 1) return 88;
  if (missing <= 3) return 75;
  if (missing <= 5) return 62;
  return 48;
}
