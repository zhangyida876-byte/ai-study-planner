import type { StageSlug } from './stages';

export interface SalesScenario {
  sceneId: string;
  name: string;
  stageScopes: StageSlug[];
  triggerPatterns: RegExp[];
  problemIds: string[];
  primaryCapabilityIds: string[];
  supportCapabilityIds: string[];
  excludedCapabilityIds: string[];
  questionsToAsk: string[];
  successSignals: string[];
}

const ALL_STAGES: StageSlug[] = ['elementary', 'middle', 'high'];

export const SALES_SCENARIOS: SalesScenario[] = [
  {
    sceneId: 'SCN-SUBJECT-AVOID-001',
    name: '孩子抵触或逃避某科',
    stageScopes: ALL_STAGES,
    triggerPatterns: [/不想学|不喜欢|讨厌|逃避|没兴趣|抗拒|厌学/u],
    problemIds: ['PRB-MOTIVATION-01', 'PRB-FOUNDATION-01'],
    primaryCapabilityIds: ['CAP-AI-05', 'CAP-COURSE-01'],
    supportCapabilityIds: ['CAP-PRACTICE-01', 'CAP-AI-02'],
    excludedCapabilityIds: ['CAP-PRACTICE-06'],
    questionsToAsk: ['从什么时候开始抵触？', '哪类作业最容易回避？', '最近一次主动完成是什么时候？'],
    successSignals: ['启动拖延下降', '能完成两道基础题', '能说出第一步且愿意隔天再做'],
  },
  {
    sceneId: 'SCN-CLASS-CATCHUP-001',
    name: '课堂听不懂或跟不上',
    stageScopes: ALL_STAGES,
    triggerPatterns: [/听不懂|跟不上|老师讲太快|课堂.+卡/u],
    problemIds: ['PRB-CLASS-PASSIVE-01', 'PRB-FOUNDATION-01'],
    primaryCapabilityIds: ['CAP-AI-05', 'CAP-COURSE-01'],
    supportCapabilityIds: ['CAP-AI-04', 'CAP-AI-06'],
    excludedCapabilityIds: [],
    questionsToAsk: ['哪一节课开始跟不上？', '作业第一道卡题是什么？', '课前是否认识关键词？'],
    successSignals: ['能复述课堂概念', '当天基础作业能独立起步', '疑问不过夜'],
  },
  {
    sceneId: 'SCN-TRANSFER-001',
    name: '听懂但不会做或一变式就错',
    stageScopes: ALL_STAGES,
    triggerPatterns: [/会听不会做|换个问法|变式|综合题|不会用|没有思路/u],
    problemIds: ['PRB-TRANSFER-01'],
    primaryCapabilityIds: ['CAP-COURSE-02', 'CAP-AI-01'],
    supportCapabilityIds: ['CAP-PRACTICE-04', 'CAP-AI-02'],
    excludedCapabilityIds: [],
    questionsToAsk: ['孩子能否说出题目考什么？', '从哪一步开始没有思路？'],
    successSignals: ['能独立说出第一步', '同类变式题正确率稳定', '隔天复测仍能起步'],
  },
  {
    sceneId: 'SCN-ERROR-REPEAT-001',
    name: '错题订正后仍反复错',
    stageScopes: ALL_STAGES,
    triggerPatterns: [/错题|反复错|订正.+还错|粗心|老是错/u],
    problemIds: ['PRB-ERROR-REPEAT-01'],
    primaryCapabilityIds: ['CAP-AI-02', 'CAP-PRACTICE-04'],
    supportCapabilityIds: ['CAP-COURSE-01', 'CAP-COURSE-02'],
    excludedCapabilityIds: [],
    questionsToAsk: ['最近五道错题能分成哪几类？', '订正后是否做过变式和隔天复测？'],
    successSignals: ['能说清错因', '同类错误下降', '形成下次先检查的动作'],
  },
  {
    sceneId: 'SCN-HOMEWORK-SLOW-001',
    name: '作业拖拉或耗时过长',
    stageScopes: ALL_STAGES,
    triggerPatterns: [/作业(?:很|特别|非常)?慢|写作业(?:很|特别|非常)?慢|写作业拖拉|磨蹭|熬夜|做不完/u],
    problemIds: ['PRB-HOMEWORK-SLOW-01', 'PRB-CLASS-PASSIVE-01'],
    primaryCapabilityIds: ['CAP-PRACTICE-03', 'CAP-AI-06'],
    supportCapabilityIds: ['CAP-COURSE-02', 'CAP-SERVICE-01'],
    excludedCapabilityIds: ['CAP-PRACTICE-06'],
    questionsToAsk: ['哪一科每天最耗时？', '卡住三分钟以上的题有几道？', '是否依赖答案或家长提示？'],
    successSignals: ['同类作业耗时下降', '独立起步率提高', '睡眠和其他科时间恢复'],
  },
  {
    sceneId: 'SCN-EXAM-STABILITY-001',
    name: '平时会做但考试不稳定',
    stageScopes: ALL_STAGES,
    triggerPatterns: [/考试紧张|一考试就|发挥失常|来不及|时间不够/u],
    problemIds: ['PRB-EXAM-ANXIETY-01', 'PRB-ERROR-REPEAT-01'],
    primaryCapabilityIds: ['CAP-PRACTICE-06', 'CAP-AI-02'],
    supportCapabilityIds: ['CAP-PRACTICE-04', 'CAP-SERVICE-01'],
    excludedCapabilityIds: [],
    questionsToAsk: ['是不会、来不及还是紧张失误？', '哪类题耗时失控？'],
    successSignals: ['限时完成率提高', '基础中档题更稳定', '能按错因调整策略'],
  },
  {
    sceneId: 'SCN-PLAN-CHAOS-001',
    name: '每天很忙但没有明确学习路径',
    stageScopes: ALL_STAGES,
    triggerPatterns: [/没计划|不知道学什么|每天很忙|效率低|时间管理/u],
    problemIds: ['PRB-PLAN-01'],
    primaryCapabilityIds: ['CAP-AI-03', 'CAP-SERVICE-01'],
    supportCapabilityIds: ['CAP-AI-02'],
    excludedCapabilityIds: [],
    questionsToAsk: ['过去一周计划完成率多少？', '每天能说出解决了哪个问题吗？'],
    successSignals: ['每天任务可完成', '每周只追一个主问题', '正确率和耗时可复盘'],
  },
];

export function matchSalesScenarios(stage: StageSlug, text?: string): SalesScenario[] {
  const value = text?.trim() || '';
  if (!value) return [];
  return SALES_SCENARIOS.filter((scenario) => (
    scenario.stageScopes.includes(stage)
    && scenario.triggerPatterns.some((pattern) => pattern.test(value))
  )).slice(0, 2);
}
