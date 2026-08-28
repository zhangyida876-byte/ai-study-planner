import {
  SEMESTER_SUBJECT_INSIGHTS,
  buildSemesterInsightPromptContext,
  getSemesterSubjectInsights,
} from '../../client/src/config/semester-subject-insights';

describe('semester subject insights', () => {
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

  it('keeps extensible basic coverage for elementary and high school', () => {
    expect(getSemesterSubjectInsights('elementary', '六年级', '上学期').map((item) => item.subject))
      .toEqual(['语文', '数学', '英语']);
    expect(getSemesterSubjectInsights('high', '高一', '下学期')).toHaveLength(9);
  });
});
