import {
  buildAcademicTimingPromptContext,
  resolveAcademicTiming,
} from '../../client/src/utils/academic-phase';

describe('academic timing', () => {
  it('prioritizes opening assessment and first monthly exam in late August', () => {
    const timing = resolveAcademicTiming(new Date(2026, 7, 28, 12));

    expect(timing.id).toBe('autumn-opening');
    expect(timing.nearestAssessment).toContain('开学摸底');
    expect(timing.nearestAssessment).toContain('第一次月考');
    expect(timing.priorityFocus.join('')).toContain('第一单元');
  });

  it('switches the focus to midterm in early November', () => {
    const timing = resolveAcademicTiming(new Date(2026, 10, 3, 12));

    expect(timing.id).toBe('autumn-midterm');
    expect(timing.nearestAssessment).toBe('期中考试');
    expect(timing.actionWindows).toContain('期中前7天');
  });

  it('builds an explicit prompt context with confidence boundaries', () => {
    const context = buildAcademicTimingPromptContext(new Date(2026, 7, 28, 12));

    expect(context).toContain('查询日期：2026年8月28日');
    expect(context).toContain('最近关键考试：开学摸底与第一次月考');
    expect(context).toContain('以学校通知为准');
  });
});
