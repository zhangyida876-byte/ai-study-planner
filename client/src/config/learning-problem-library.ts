import type { StageSlug } from './stages';

export interface LearningProblem {
  problemId: string;
  name: string;
  stageScopes: StageSlug[];
  triggerPatterns: RegExp[];
  scoreTriggerBelow?: number;
  observableEvidence: string[];
  possibleCauses: string[];
  verification: string[];
  immediateAction: string;
  risk: string;
  primaryCapabilityIds: string[];
  supportCapabilityIds: string[];
}

const ALL_STAGES: StageSlug[] = ['elementary', 'middle', 'high'];

export const LEARNING_PROBLEMS: LearningProblem[] = [
  {
    problemId: 'PRB-MOTIVATION-01',
    name: '学习阻抗与正反馈不足',
    stageScopes: ALL_STAGES,
    triggerPatterns: [/不想学|不喜欢|讨厌|逃避|没兴趣|抗拒|厌学|一提.+就烦/u],
    observableEvidence: ['启动前拖延或找借口', '遇到稍难内容很快退出', '家长一提醒就争执'],
    possibleCauses: ['长期失败后形成“学了也没用”的预期', '前置断层让每次开始都很吃力', '催促和比较把学科与压力绑定'],
    verification: ['连续三天记录从提醒到开始学习的时间', '先给两道可完成题，观察是否愿意继续', '询问从哪一步开始觉得学不会'],
    immediateAction: '先用可完成的小任务建立正反馈，再逐步加入变式和错因复盘',
    risk: '持续回避会减少有效练习，并把作业拖延和考试失分反过来强化畏难',
    primaryCapabilityIds: ['CAP-AI-05', 'CAP-COURSE-01'],
    supportCapabilityIds: ['CAP-PRACTICE-01', 'CAP-AI-02'],
  },
  {
    problemId: 'PRB-FOUNDATION-01',
    name: '前置知识断层',
    stageScopes: ALL_STAGES,
    triggerPatterns: [/基础差|基础不牢|基础薄弱|断层|以前没学会|旧知识/u],
    scoreTriggerBelow: 0.7,
    observableEvidence: ['新课例题能跟，独立做题却频繁卡在旧步骤', '同类基础题错误分散', '作业需要反复翻书或看答案'],
    possibleCauses: ['关键概念没有形成稳定理解', '旧知识与新章节的连接没有建立', '复习从头平均用力，没有找到最小断点'],
    verification: ['从当前错题倒推两个前置知识点各做两题', '让孩子口述公式或概念为什么成立', '比较当前题和前置题卡住的位置'],
    immediateAction: '只补影响当前进度的一个最小前置断点，基础验证通过后再回新课',
    risk: '新课持续叠加后，作业耗时和中档题失分会同步增加',
    primaryCapabilityIds: ['CAP-COURSE-01', 'CAP-AI-06'],
    supportCapabilityIds: ['CAP-PRACTICE-01', 'CAP-AI-02'],
  },
  {
    problemId: 'PRB-CLASS-PASSIVE-01',
    name: '课堂跟进被动',
    stageScopes: ALL_STAGES,
    triggerPatterns: [/听不懂|跟不上|老师讲太快|上课.+不会|课堂.+卡/u],
    observableEvidence: ['上课说听懂，作业却不会起步', '笔记只抄结论，说不清中间步骤', '同一段内容反复看仍说不出关键词'],
    possibleCauses: ['第一次接触新概念时认知负荷过高', '前置词汇、符号或模型不熟', '课堂疑问没有当天闭环'],
    verification: ['课前让孩子说出新课主题和关键词', '课后只问一个仍不懂的步骤', '用一道基础题确认是否能独立起步'],
    immediateAction: '课前短预习降低陌生度，当天用短复习补回一个断点',
    risk: '一个小断点会在同一章节后续课中连续放大',
    primaryCapabilityIds: ['CAP-AI-05', 'CAP-COURSE-01'],
    supportCapabilityIds: ['CAP-AI-04', 'CAP-AI-06'],
  },
  {
    problemId: 'PRB-TRANSFER-01',
    name: '知识迁移与题型起步困难',
    stageScopes: ALL_STAGES,
    triggerPatterns: [/换个问法|变式|综合题|不会用|会听不会做|题型|没有思路/u],
    observableEvidence: ['例题看懂，换道题就不知道第一步', '简单题会做，综合题步骤容易断', '会背公式却无法从题干选出方法'],
    possibleCauses: ['条件、模型和方法没有形成对应关系', '练习只模仿答案，没有讲清第一步依据', '缺少由同类题到变式题的梯度'],
    verification: ['抽两道同考点不同问法的题', '让孩子只讲考点和第一步，不急着算完', '比较模仿题与变式题的起步情况'],
    immediateAction: '先学题型识别和起手步骤，再做两至三道变式题',
    risk: '近期考试中档题和综合题会成为主要波动来源',
    primaryCapabilityIds: ['CAP-COURSE-02', 'CAP-AI-01'],
    supportCapabilityIds: ['CAP-PRACTICE-04', 'CAP-AI-02'],
  },
  {
    problemId: 'PRB-ERROR-REPEAT-01',
    name: '错题复盘失效',
    stageScopes: ALL_STAGES,
    triggerPatterns: [/错题|反复错|订正.+还错|粗心|老是错/u],
    observableEvidence: ['错题订正很多，但同类题仍重复错', '只会说粗心，说不出具体错因', '看答案会了，隔天又不会'],
    possibleCauses: ['只改答案，没有区分概念、审题、计算和步骤', '订正后没有同类变式和延迟复测', '一次追太多问题，缺少高频错因优先级'],
    verification: ['把最近五道错题按错因分类', '隔天换一道同类题复测', '让孩子说出下次先检查什么'],
    immediateAction: '每周只追一至两类高频错因，并安排隔天和一周后复测',
    risk: '相同失分会在作业、单元测和月考中反复出现',
    primaryCapabilityIds: ['CAP-AI-02', 'CAP-PRACTICE-04'],
    supportCapabilityIds: ['CAP-COURSE-01', 'CAP-COURSE-02'],
  },
  {
    problemId: 'PRB-HOMEWORK-SLOW-01',
    name: '作业耗时过长',
    stageScopes: ALL_STAGES,
    triggerPatterns: [/作业(?:很|特别|非常)?慢|写作业(?:很|特别|非常)?慢|写作业拖拉|磨蹭|熬夜|时间太长|做不完/u],
    observableEvidence: ['同类题反复停顿，完成时间不稳定', '频繁翻答案或等待家长提示', '一科作业挤压其他科和睡眠'],
    possibleCauses: ['高频题型不会起步', '当天课堂断点没有补回', '任务边界不清或启动阻力高'],
    verification: ['连续三天按科记录作业耗时和卡点', '标记每次停顿超过三分钟的题型', '比较提示前后是否能独立完成下一题'],
    immediateAction: '先处理最耗时的一类题，并为当天未懂内容安排短复习',
    risk: '长期会挤压其他科复习、睡眠和第二天听课状态',
    primaryCapabilityIds: ['CAP-PRACTICE-03', 'CAP-AI-06'],
    supportCapabilityIds: ['CAP-COURSE-02', 'CAP-SERVICE-01'],
  },
  {
    problemId: 'PRB-PLAN-01',
    name: '学习计划无法落地',
    stageScopes: ALL_STAGES,
    triggerPatterns: [/没计划|不知道学什么|安排不好|时间管理|每天很忙|效率低/u],
    observableEvidence: ['每天学很多但说不出解决了什么', '任务常在科目之间切换', '计划写得很满却难以完成'],
    possibleCauses: ['目标没有拆成当天任务', '没有按问题价值排序', '缺少固定复盘和调整节点'],
    verification: ['复盘过去一周完成率', '检查每项任务是否有验收标准', '统计未完成任务主要卡在哪里'],
    immediateAction: '每天只安排一个主问题和两个小任务，每周依据数据调整',
    risk: '时间投入增加但薄弱点不减少，容易形成忙碌却无变化的挫败感',
    primaryCapabilityIds: ['CAP-AI-03', 'CAP-SERVICE-01'],
    supportCapabilityIds: ['CAP-AI-02'],
  },
  {
    problemId: 'PRB-EXAM-ANXIETY-01',
    name: '考试紧张与稳定性不足',
    stageScopes: ALL_STAGES,
    triggerPatterns: [/考试紧张|一考试就|发挥失常|时间不够|来不及|空白/u],
    observableEvidence: ['平时会做，考试同类题却失分', '前面题耗时过长导致后面来不及', '考后很快能订正，考场当时想不起来'],
    possibleCauses: ['基础和中档题自动化不足', '限时策略没有形成', '对错误和分数过度关注影响起步'],
    verification: ['用已学范围做一次短时小测', '记录每类题耗时和跳题点', '区分不会、来不及和紧张失误'],
    immediateAction: '先用短时、已学范围的小测建立稳定节奏，再复盘时间分配',
    risk: '关键考试中的波动会放大目标差距和孩子的自我否定',
    primaryCapabilityIds: ['CAP-PRACTICE-06', 'CAP-PRACTICE-04'],
    supportCapabilityIds: ['CAP-AI-02', 'CAP-SERVICE-01'],
  },
  {
    problemId: 'PRB-CALCULATION-01',
    name: '计算稳定性不足',
    stageScopes: ALL_STAGES,
    triggerPatterns: [/计算|口算|竖式|符号|算错|运算/u],
    observableEvidence: ['过程大致会但符号、进退位或条件频繁出错', '简单计算耗时长', '检查时找不到错误位置'],
    possibleCauses: ['规则不熟、书写不规范或步骤跳跃', '速度要求超过当前熟练度', '错误没有按类型统计'],
    verification: ['用十道同层计算题统计错误类型和耗时', '要求保留关键步骤', '隔天复测同类型'],
    immediateAction: '短时定量练习，先稳正确率，再逐步提高速度',
    risk: '会拖累数学过程题，并可能影响需要定量计算的理科任务',
    primaryCapabilityIds: ['CAP-PRIMARY-01', 'CAP-PRACTICE-04'],
    supportCapabilityIds: ['CAP-AI-02'],
  },
  {
    problemId: 'PRB-READING-01',
    name: '阅读与信息提取困难',
    stageScopes: ALL_STAGES,
    triggerPatterns: [/阅读|读不懂|审题|题干|材料题|踩不到得分点/u],
    observableEvidence: ['答案写很多却没有命中要点', '应用题或材料题漏条件', '长题干读完不知道题目在问什么'],
    possibleCauses: ['关键词和条件层级没有提取', '阅读后没有转述题意', '学科术语和答题结构不熟'],
    verification: ['让孩子圈条件、问题和限定词', '读完后用一句话复述任务', '对照评分点检查遗漏'],
    immediateAction: '每天用一道真实题练条件提取和一句话复述',
    risk: '会影响语文阅读、数学应用题、理科题干和政史地材料题，但不等于影响符号运算',
    primaryCapabilityIds: ['CAP-AI-01', 'CAP-COURSE-02'],
    supportCapabilityIds: ['CAP-AI-02', 'CAP-PRACTICE-04'],
  },
];

export interface LearningProblemMatchInput {
  stage: StageSlug;
  concern?: string;
  scores: Record<string, number>;
  maxValues?: Record<string, number>;
}

export function matchLearningProblems(input: LearningProblemMatchInput): LearningProblem[] {
  const concern = input.concern?.trim() || '';
  const hasLowScore = Object.entries(input.scores).some(([subject, score]) => {
    const max = input.maxValues?.[subject];
    return Boolean(max && max > 0 && score / max < 0.7);
  });
  const matches = LEARNING_PROBLEMS.filter((problem) => {
    if (!problem.stageScopes.includes(input.stage)) return false;
    const textMatched = concern.length > 0
      && problem.triggerPatterns.some((pattern) => pattern.test(concern));
    const scoreMatched = problem.scoreTriggerBelow != null && hasLowScore;
    return textMatched || scoreMatched;
  });
  if (matches.length > 0) return matches.slice(0, 4);
  return LEARNING_PROBLEMS.filter((problem) => (
    problem.problemId === 'PRB-FOUNDATION-01'
    || problem.problemId === 'PRB-TRANSFER-01'
  ));
}
