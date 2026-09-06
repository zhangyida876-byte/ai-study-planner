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
}

export function resolveDiagnosisContentRoute(
  input: DiagnosisContentRouterInput,
): DiagnosisContentRoute {
  const scenarios = matchSalesScenarios(input.stage, input.concern);
  const problems = matchLearningProblems(input);
  const excludedIds = new Set(
    scenarios.flatMap((scenario) => scenario.excludedCapabilityIds),
  );
  const capabilityIds = [
    ...scenarios.flatMap((scenario) => [
      ...scenario.primaryCapabilityIds,
      ...scenario.supportCapabilityIds,
    ]),
    ...problems.flatMap((problem) => [
      ...problem.primaryCapabilityIds,
      ...problem.supportCapabilityIds,
    ]),
  ].filter((capabilityId) => !excludedIds.has(capabilityId));
  const capabilities = getProductCapabilities(capabilityIds, input.stage).slice(0, 4);
  const objections = matchObjections(input.stage, input.concern);
  return { problems, scenarios, capabilities, objections };
}

function formatProblem(problem: LearningProblem): string {
  return [
    `${problem.problemId}｜${problem.name}`,
    `可观察证据：${problem.observableEvidence.join('；')}`,
    `待验证根因：${problem.possibleCauses.join('；')}`,
    `验证方式：${problem.verification.join('；')}`,
    `立即动作：${problem.immediateAction}`,
    `风险链：${problem.risk}`,
  ].join('\n');
}

function formatScenario(scenario: SalesScenario): string {
  return [
    `${scenario.sceneId}｜${scenario.name}`,
    `关联问题：${scenario.problemIds.join('、')}`,
    `问诊问题：${scenario.questionsToAsk.join('；')}`,
    `短期成功信号：${scenario.successSignals.join('；')}`,
    `当前禁止优先推荐：${scenario.excludedCapabilityIds.join('、') || '无'}`,
  ].join('\n');
}

function formatCapability(capability: ProductCapability): string {
  return [
    `${capability.capabilityId}｜${capability.name}｜${capability.status}`,
    `解决：${capability.solves}`,
    `用法：${capability.usage}`,
    `频率：${capability.frequency}`,
    `验收：${capability.acceptance}`,
    `家长表达：${capability.consultantSummary}`,
    `边界：${capability.boundary}`,
  ].join('\n');
}

function formatObjection(objection: ObjectionRecord): string {
  return [
    `${objection.objectionId}｜${objection.name}`,
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
      '【产品能力库匹配：只允许从以下能力中选择2至4项】',
      route.capabilities.map(formatCapability).join('\n\n'),
      '不得为了显得全面补充未匹配能力；标记scope-check-required的能力必须提醒使用前核实当前产品覆盖。',
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
