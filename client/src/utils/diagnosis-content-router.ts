import {
  matchLearningProblems,
  type LearningProblem,
} from '../config/learning-problem-library';
import {
  getProductCapabilities,
  type ProductCapability,
} from '../config/product-capability-library';
import {
  matchObjections,
  type ObjectionRecord,
} from '../config/objection-library';
import {
  matchSalesScenarios,
  type SalesScenario,
} from '../config/sales-scenario-library';
import type { StageSlug } from '../config/stages';

interface DiagnosisContentRouterInput {
  stage: StageSlug;
  concern?: string;
  scores: Record<string, number>;
  maxValues?: Record<string, number>;
}

export interface DiagnosisContentRoute {
  problems: LearningProblem[];
  scenarios: SalesScenario[];
  capabilities: ProductCapability[];
  objections: ObjectionRecord[];
  learningPaths: SubjectLearningPath[];
}

export interface SubjectLearningPath {
  subject: string;
  scoreRate?: number;
  level: string;
  synchronousFocus: string;
  enrichmentFocus: string;
  progressionRule: string;
}

const CORE_DUAL_PATH_CAPABILITY_IDS = [
  'CAP-COURSE-01',
  'CAP-COURSE-02',
  'CAP-COURSE-03',
];

function buildSubjectLearningPaths(input: DiagnosisContentRouterInput): SubjectLearningPath[] {
  return Object.entries(input.scores).map(([subject, score]) => {
    const maxValue = input.maxValues?.[subject];
    const scoreRate = maxValue && maxValue > 0 ? score / maxValue : undefined;
    const level = scoreRate == null
      ? '满分待核对'
      : scoreRate < 0.6
        ? '基础薄弱'
        : scoreRate < 0.7
          ? '基础不稳'
          : scoreRate < 0.8
            ? '中等偏下'
            : scoreRate < 0.85
              ? '中等'
              : scoreRate < 0.9
                ? '中等偏上'
                : '优势明显';
    const synchronousFocus = scoreRate != null && scoreRate < 0.7
      ? '同步打底为主：补当前进度所需的最小概念和前置断点，先稳基础题与作业独立完成'
      : '同步查漏为辅：只补影响当前课堂和考试稳定性的具体断点，不从头平均重学';
    const bandFocus = scoreRate == null || scoreRate < 0.7
      ? '入门培优：当前范围内的基础题型、常考点、起手步骤和过程得分，不直接上高难综合题'
      : scoreRate < 0.85
        ? '应试培优：中档题、易错题、变式题、规范步骤和限时策略'
        : '能力培优：高价值失分点、综合模型、跨知识点迁移和考试稳定性';
    const stageFocus = input.stage === 'elementary'
      ? '聚焦计算方法、应用题模型、阅读表达和阶段测查题型'
      : input.stage === 'middle'
        ? '聚焦月考/期中/中考常考题型、考点条件、步骤得分和时间分配'
        : '聚焦学考/高考考点、模型迁移、规范表达、限时策略及选科相关能力';
    return {
      subject,
      scoreRate,
      level,
      synchronousFocus,
      enrichmentFocus: `${bandFocus}；${stageFocus}`,
      progressionRule: '每个模块先用同步课确认听懂，再用解题/培优课确认会用；同层变式未达标就回补知识点，达标后再提高难度。',
    };
  });
}

export function resolveDiagnosisContentRoute(
  input: DiagnosisContentRouterInput,
): DiagnosisContentRoute {
  const scenarios = matchSalesScenarios(input.stage, input.concern);
  const problems = matchLearningProblems(input);
  const excludedIds = new Set(
    scenarios.flatMap((scenario) => scenario.excludedCapabilityIds),
  );
  const matchedCapabilityIds = [
    ...scenarios.flatMap((scenario) => [
      ...scenario.primaryCapabilityIds,
      ...scenario.supportCapabilityIds,
    ]),
    ...problems.flatMap((problem) => [
      ...problem.primaryCapabilityIds,
      ...problem.supportCapabilityIds,
    ]),
  ].filter((capabilityId) => !excludedIds.has(capabilityId));
  const capabilityIds = [
    ...new Set([
      ...matchedCapabilityIds.slice(0, 3),
      ...CORE_DUAL_PATH_CAPABILITY_IDS,
    ]),
  ];
  const capabilities = getProductCapabilities(capabilityIds, input.stage).slice(0, 6);
  const objections = matchObjections(input.stage, input.concern);
  const learningPaths = buildSubjectLearningPaths(input);
  return { problems, scenarios, capabilities, objections, learningPaths };
}

function formatProblem(problem: LearningProblem): string {
  return [
    `问题名称：${problem.name}`,
    `可观察证据：${problem.observableEvidence.join('；')}`,
    `待验证根因：${problem.possibleCauses.join('；')}`,
    `验证方式：${problem.verification.join('；')}`,
    `立即动作：${problem.immediateAction}`,
    `风险链：${problem.risk}`,
  ].join('\n');
}

function formatScenario(scenario: SalesScenario): string {
  return [
    `场景名称：${scenario.name}`,
    `问诊问题：${scenario.questionsToAsk.join('；')}`,
    `短期成功信号：${scenario.successSignals.join('；')}`,
  ].join('\n');
}

function formatCapability(capability: ProductCapability): string {
  const lines = [
    `功能名称：${capability.name}`,
    `资料状态：${capability.status === 'available' ? '已核实' : '使用前需核实适用范围'}`,
    `解决：${capability.solves}`,
    `用法：${capability.usage}`,
    `频率：${capability.frequency}`,
    `验收：${capability.acceptance}`,
    `家长表达：${capability.consultantSummary}`,
    `边界：${capability.boundary}`,
  ];
  if (capability.mechanism) lines.splice(3, 0, `作用机制：${capability.mechanism}`);
  if (capability.workflow?.length) lines.splice(5, 0, `操作步骤：${capability.workflow.join(' → ')}`);
  if (capability.worksWith) lines.push(`功能组合：${capability.worksWith}`);
  if (capability.parentExplanation) lines.push(`家长听懂：${capability.parentExplanation}`);
  if (capability.stageGuidance) {
    const stageLabels: Record<StageSlug, string> = {
      elementary: '小学',
      middle: '初中',
      high: '高中',
    };
    const guidance = Object.entries(capability.stageGuidance)
      .map(([stage, text]) => `${stageLabels[stage as StageSlug]}：${text}`)
      .join('；');
    lines.push(`分学段用法：${guidance}`);
  }
  return lines.join('\n');
}

function formatLearningPath(path: SubjectLearningPath): string {
  const rateText = path.scoreRate == null ? '得分率待核对' : `得分率${Math.round(path.scoreRate * 100)}%`;
  return [
    `${path.subject}（${rateText}，${path.level}）`,
    `同步路径：${path.synchronousFocus}`,
    `培优路径：${path.enrichmentFocus}`,
    `升级规则：${path.progressionRule}`,
  ].join('\n');
}

function formatObjection(objection: ObjectionRecord): string {
  return [
    `家长顾虑：${objection.name}`,
    `回应原则：${objection.responsePrinciple}`,
    `需追问：${objection.questionsToAsk.join('；')}`,
    `清洗后话术：${objection.script}`,
    `下一步：${objection.nextAction}`,
    `动态事实：${objection.requiredDynamicFacts.join('、') || '无'}`,
    `禁止承诺：${objection.forbiddenClaims.join('、')}`,
  ].join('\n');
}

export function buildDiagnosisContentRouteContext(
  input: DiagnosisContentRouterInput,
): string {
  const route = resolveDiagnosisContentRoute(input);
  const sections: string[] = [];

  if (route.problems.length > 0) {
    sections.push(`【学习问题库匹配】\n${route.problems.map(formatProblem).join('\n\n')}`);
  }
  if (route.scenarios.length > 0) {
    sections.push(`【场景索引匹配】\n${route.scenarios.map(formatScenario).join('\n\n')}`);
  }
  if (route.capabilities.length > 0) {
    sections.push([
      '【产品能力库匹配：只允许从以下能力中选择3至6项】',
      route.capabilities.map(formatCapability).join('\n\n'),
      '每次引用功能都必须解释对应问题、作用机制、操作步骤、组合顺序和验收标准；禁止只罗列名称。标记需核实的能力必须提醒使用前核实当前产品覆盖。',
    ].join('\n'));
  }
  if (route.learningPaths.length > 0) {
    sections.push([
      '【逐科“同步打底 + 分层培优”路径：必须全部使用】',
      route.learningPaths.map(formatLearningPath).join('\n\n'),
      '培优不等于直接做难题。任何分数段都要说明当前适合的培优层级，但必须以同步基础验证、当前教学进度和近期考试范围为前提。',
    ].join('\n'));
  }
  if (route.objections.length > 0) {
    sections.push([
      '【异议处理库匹配：仅因用户原话出现明确顾虑而加载】',
      route.objections.map(formatObjection).join('\n\n'),
      '诊断报告只吸收与当前顾虑直接相关的一句回应，不展开价格、竞品或关单内容。',
    ].join('\n'));
  }
  return sections.join('\n\n');
}
