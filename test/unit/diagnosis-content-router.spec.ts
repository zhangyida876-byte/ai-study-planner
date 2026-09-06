import {
  buildDiagnosisContentRouteContext,
  resolveDiagnosisContentRoute,
} from '../../client/src/utils/diagnosis-content-router';

describe('diagnosis content router', () => {
  it('routes a math resistance concern through low-friction capabilities', () => {
    const route = resolveDiagnosisContentRoute({
      stage: 'middle',
      concern: '孩子从小不喜欢数学，一提数学就逃避，也担心买了以后不学',
      scores: { 数学: 83 },
      maxValues: { 数学: 120 },
    });

    expect(route.problems.map((problem) => problem.problemId)).toContain('PRB-MOTIVATION-01');
    expect(route.scenarios.map((scenario) => scenario.sceneId)).toContain('SCN-SUBJECT-AVOID-001');
    expect(route.capabilities.map((capability) => capability.capabilityId)).toEqual(
      expect.arrayContaining(['CAP-AI-05', 'CAP-COURSE-01']),
    );
    expect(route.capabilities.map((capability) => capability.capabilityId)).toContain(
      'CAP-COURSE-03',
    );
    expect(route.learningPaths[0]?.enrichmentFocus).toContain('入门培优');
    expect(route.objections.map((objection) => objection.objectionId)).toContain('OBJ-USAGE-01');
  });

  it('does not inject commercial objections without a matching parent concern', () => {
    const route = resolveDiagnosisContentRoute({
      stage: 'elementary',
      concern: '应用题读不懂，写作业很慢',
      scores: { 数学: 72 },
      maxValues: { 数学: 100 },
    });

    expect(route.objections).toHaveLength(0);
    expect(route.problems.map((problem) => problem.problemId)).toContain('PRB-HOMEWORK-SLOW-01');
  });

  it('builds a traceable prompt context without exposing internal ids', () => {
    const context = buildDiagnosisContentRouteContext({
      stage: 'high',
      concern: '上课听不懂，例题会看但换个问法就没有思路',
      scores: { 数学: 90 },
      maxValues: { 数学: 150 },
    });

    expect(context).toContain('【学习问题库匹配】');
    expect(context).toContain('课堂跟进被动');
    expect(context).toContain('【场景索引匹配】');
    expect(context).toContain('课堂听不懂或跟不上');
    expect(context).toContain('【产品能力库匹配：只允许从以下能力中选择3至6项】');
    expect(context).toContain('作用机制：');
    expect(context).toContain('操作步骤：');
    expect(context).toContain('功能组合：');
    expect(context).toContain('【逐科“同步打底 + 分层培优”路径：必须全部使用】');
    expect(context).toContain('同步路径：');
    expect(context).toContain('培优路径：');
    expect(context).toContain('验收：');
    expect(context).toContain('边界：');
    expect(context).not.toMatch(/(?:CAP|PRB|SCN|OBJ)-/u);
  });

  it.each([
    ['elementary', 55, '入门培优', '阶段测查题型'],
    ['middle', 74, '应试培优', '中考常考题型'],
    ['high', 138, '能力培优', '高考考点'],
  ] as const)(
    'keeps synchronous and tiered enrichment paths for %s',
    (stage, score, enrichmentLevel, stageFocus) => {
      const maxValue = stage === 'high' ? 150 : 100;
      const route = resolveDiagnosisContentRoute({
        stage,
        scores: { 数学: score },
        maxValues: { 数学: maxValue },
      });

      expect(route.capabilities.map((capability) => capability.capabilityId)).toEqual(
        expect.arrayContaining(['CAP-COURSE-01', 'CAP-COURSE-02', 'CAP-COURSE-03']),
      );
      expect(route.learningPaths[0]?.synchronousFocus).toContain('同步');
      expect(route.learningPaths[0]?.enrichmentFocus).toContain(enrichmentLevel);
      expect(route.learningPaths[0]?.enrichmentFocus).toContain(stageFocus);
    },
  );
});
