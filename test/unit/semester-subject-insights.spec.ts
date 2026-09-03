import {
  SEMESTER_SUBJECT_INSIGHTS,
  buildSemesterInsightPromptContext,
  getSemesterSubjectInsights,
} from '../../client/src/config/semester-subject-insights';

describe('semester subject insights', () => {
  it('covers every elementary and high-school grade-semester main subject', () => {
    for (const grade of ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']) {
      for (const semester of ['上学期', '下学期']) {
        expect(getSemesterSubjectInsights('elementary', grade, semester).map((item) => item.subject))
          .toEqual(['语文', '数学', '英语']);
      }
    }
    for (const grade of ['高一', '高二', '高三']) {
      for (const semester of ['上学期', '下学期']) {
        const insights = getSemesterSubjectInsights('high', grade, semester);
        expect(insights).toHaveLength(9);
        insights.forEach((insight) => {
          expect(insight.phaseFocuses).toHaveLength(5);
          expect(insight.phenomenonCauseLinks.length).toBeGreaterThanOrEqual(2);
          expect(Array.isArray(insight.crossSubjectImpacts)).toBe(true);
        });
      }
    }
  });

  it('covers all nine subjects across six middle-school semesters', () => {
    expect(SEMESTER_SUBJECT_INSIGHTS).toHaveLength(54);

    for (const grade of ['七年级', '八年级', '九年级']) {
      for (const semester of ['上学期', '下学期']) {
        const insights = getSemesterSubjectInsights('middle', grade, semester);
        expect(insights).toHaveLength(9);
        expect(insights.map((item) => item.subject)).toEqual(expect.arrayContaining([
          '语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治',
        ]));
      }
    }
  });

  it('provides concrete grade-semester teaching context', () => {
    const insights = getSemesterSubjectInsights('middle', '初一', '下学期');
    const mathematics = insights.find((item) => item.subject === '数学');

    expect(mathematics?.keyDifficulties).toEqual(expect.arrayContaining(['实数', '平面坐标系']));
    expect(mathematics?.observablePhenomena[0]).toContain('换个问法');
    expect(mathematics?.openingActions.length).toBeGreaterThanOrEqual(2);
  });

  it('builds compact subject context for the diagnosis prompt', () => {
    const context = buildSemesterInsightPromptContext(
      'middle',
      '八年级',
      '下学期',
      ['数学', '物理'],
      new Date(2026, 7, 28, 12),
    );

    expect(context).toContain('查询日期：2026年8月28日');
    expect(context).toContain('最近关键考试：开学摸底与第一次月考');
    expect(context).toContain('当前学期：八年级下学期');
    expect(context).toContain('数学：');
    expect(context).toContain('物理：');
    expect(context).not.toContain('英语：');
  });

  it('provides concrete elementary grade-semester subject depth', () => {
    expect(getSemesterSubjectInsights('elementary', '六年级', '上学期').map((item) => item.subject))
      .toEqual(['语文', '数学', '英语']);
    const mathematics = getSemesterSubjectInsights('elementary', '四年级', '下学期')
      .find((item) => item.subject === '数学');

    expect(mathematics?.keyDifficulties).toEqual(expect.arrayContaining(['小数意义与运算', '三角形与平均数']));
    expect(mathematics?.observablePhenomena.join('')).toContain('应用题');
    expect(mathematics?.futureImpacts.join('')).toContain('分数小数百分数');
    expect(mathematics?.openingActions.join('')).toContain('每天');
  });

  it('provides concrete high-school modules and future impacts', () => {
    const highSchoolInsights = getSemesterSubjectInsights('high', '高一', '下学期');
    expect(highSchoolInsights).toHaveLength(9);
    highSchoolInsights.forEach((insight) => {
      expect(insight.commonMistakes.length).toBeGreaterThan(0);
      expect(insight.bottlenecks.length).toBeGreaterThan(0);
      expect(insight.openingActions.length).toBeGreaterThan(0);
      expect(insight.weeklyActions.length).toBeGreaterThan(0);
      expect(insight.futureImpacts.length).toBeGreaterThan(0);
    });

    const highOneMathematics = highSchoolInsights.find((item) => item.subject === '数学');
    expect(highOneMathematics?.keyDifficulties).toEqual(expect.arrayContaining(['三角函数', '平面向量']));
    expect(highOneMathematics?.futureImpacts.join('')).toContain('高考');

    const highTwoPhysics = getSemesterSubjectInsights('high', '高二', '上学期')
      .find((item) => item.subject === '物理');
    expect(highTwoPhysics?.keyDifficulties.join('')).toMatch(/电场|电路/);
    expect(highTwoPhysics?.futureImpacts.join('')).toMatch(/选科|专业|高考/);
  });

  it('builds high school diagnosis context without missing-field errors', () => {
    const context = buildSemesterInsightPromptContext(
      'high',
      '高二',
      '上学期',
      ['语文', '数学'],
      new Date(2026, 7, 29, 10),
    );

    expect(context).toContain('当前学期：高二上学期');
    expect(context).toContain('数学：');
    expect(context).toContain('常见错点=');
    expect(context).toContain('后续影响=');
  });

  it('covers grade-four first-semester Chinese and mathematics with action chains', () => {
    const insights = getSemesterSubjectInsights('elementary', '四年级', '上学期');
    const chinese = insights.find((item) => item.subject === '语文');
    const mathematics = insights.find((item) => item.subject === '数学');

    expect(chinese?.keyDifficulties.join('')).toMatch(/概括|批注|记叙文/);
    expect(chinese?.observablePhenomena.join('')).toMatch(/主要内容|作文/);
    expect(mathematics?.keyDifficulties.join('')).toMatch(/大数|乘|角/);
    expect(mathematics?.phenomenonCauseLinks[0]).toEqual(expect.objectContaining({
      phenomenon: expect.any(String),
      cause: expect.any(String),
      impact: expect.any(String),
      verification: expect.stringContaining('5道'),
    }));
    expect(mathematics?.phaseFocuses.map((item) => item.label)).toEqual([
      '开学前', '开学第一周', '开学第一个月', '期中前', '期末前',
    ]);
  });

  it('distinguishes grade-seven semesters and preserves future links', () => {
    const firstSemester = getSemesterSubjectInsights('middle', '七年级', '上学期');
    const secondSemesterMath = getSemesterSubjectInsights('middle', '七年级', '下学期')
      .find((item) => item.subject === '数学');

    expect(firstSemester.find((item) => item.subject === '数学')?.keyDifficulties.join(''))
      .toMatch(/有理数|整式|方程|几何/);
    expect(firstSemester.find((item) => item.subject === '英语')?.subjectCharacteristics)
      .toMatch(/语篇|语法/);
    expect(secondSemesterMath?.keyDifficulties).toEqual(expect.arrayContaining(['实数', '平面坐标系']));
    expect(secondSemesterMath?.keyDifficulties.join('')).not.toContain('函数单调性');
    expect(secondSemesterMath?.crossSubjectImpacts.some((item) => item.relatedSubjects.includes('物理'))).toBe(true);
  });

  it('provides high-one and high-two structured stage interpretation', () => {
    const highOne = getSemesterSubjectInsights('high', '高一', '上学期');
    const highOneMath = highOne.find((item) => item.subject === '数学');
    const highOnePhysics = highOne.find((item) => item.subject === '物理');
    const highTwo = getSemesterSubjectInsights('high', '高二', '上学期');
    const highTwoMath = highTwo.find((item) => item.subject === '数学');
    const highTwoPhysics = highTwo.find((item) => item.subject === '物理');

    expect(highOneMath?.keyDifficulties.join('')).toMatch(/集合|逻辑|函数/);
    expect(highOnePhysics?.keyDifficulties.join('')).toMatch(/运动学|牛顿|受力/);
    expect(highTwoMath?.keyDifficulties.join('')).toMatch(/数列|空间向量|圆锥曲线/);
    expect(highTwoPhysics?.keyDifficulties.join('')).toMatch(/电场|电路|磁场/);
    expect(highTwoPhysics?.parentGuidance.commonRisk).toContain('赋分');
    expect(highOneMath?.crossSubjectImpacts.length).toBeGreaterThanOrEqual(2);
  });

  it('keeps cross-subject links evidence-based instead of forcing coverage', () => {
    const highOne = getSemesterSubjectInsights('high', '高一', '上学期');
    const chinese = highOne.find((item) => item.subject === '语文');
    const english = highOne.find((item) => item.subject === '英语');

    expect(english?.crossSubjectImpacts).toEqual([]);
    expect(chinese?.crossSubjectImpacts.length).toBeGreaterThan(0);
    expect(chinese?.crossSubjectImpacts.map((item) => item.mechanism).join(''))
      .not.toMatch(/符号运算/u);
    expect(chinese?.crossSubjectImpacts.some((item) => (
      item.relatedSubjects.includes('数学') && item.mechanism.includes('应用题')
    ))).toBe(true);
  });

  it('injects phase actions, parent boundaries and cross-subject links into AI context', () => {
    const context = buildSemesterInsightPromptContext(
      'high',
      '高一',
      '上学期',
      ['数学', '物理'],
      new Date(2026, 8, 2, 10),
    );

    expect(context).toContain('家长沟通边界：注意力=');
    expect(context).toContain('现象-根因-影响-验证链=');
    expect(context).toContain('五阶段任务（报告重点展开前三阶段）=开学前');
    expect(context).toContain('跨学科影响（只可使用以下已验证链路');
    expect(context).toContain('数学：');
    expect(context).toContain('物理：');
  });

  it('can provide phase background without duplicating detailed diagnosis actions', () => {
    const context = buildSemesterInsightPromptContext(
      'high',
      '高一',
      '上学期',
      ['数学'],
      new Date(2026, 8, 2, 10),
      { includePhaseActions: false },
    );

    expect(context).toContain('阶段进度参考（仅用于判断背景，禁止原样输出多阶段行动）=');
    expect(context).not.toContain('五阶段任务（报告重点展开前三阶段）=');
    expect(context).not.toContain('动作:');
    expect(context).toContain('不要提前:');
  });
});
