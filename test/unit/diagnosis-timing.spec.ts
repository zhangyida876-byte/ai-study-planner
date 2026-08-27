import {
  buildDiagnosisTimeline,
  formatDiagnosisDate,
  getAcademicPeriod,
} from '../../client/src/utils/diagnosis-timing';

describe('diagnosis timing', () => {
  const augustDate = new Date('2026-08-22T10:00:00+08:00');

  it('identifies the summer-to-new-school-year transition', () => {
    expect(formatDiagnosisDate(augustDate)).toContain('2026');
    expect(getAcademicPeriod(augustDate)).toBe('暑假末与新学年开学衔接期');
  });

  it('builds a countdown roadmap from diagnosis to the target exam', () => {
    const timeline = buildDiagnosisTimeline('初三', 'middle', undefined, '数学', augustDate);

    expect(timeline.daysLeft).toBeGreaterThan(180);
    expect(timeline.nodes).toHaveLength(4);
    expect(timeline.nodes[0].action).toContain('数学');
    expect(timeline.nodes[2].title).toBe('完成一轮能力整合');
    expect(timeline.nodes[3].period).toContain('2027年6月');
    expect(timeline.nodes.every((node) => node.acceptance.length > 0)).toBe(true);
  });

  it('uses an explicit exam date when the profile provides one', () => {
    const timeline = buildDiagnosisTimeline('高三', 'high', '2027-06-07', '物理', augustDate);

    expect(timeline.examPeriod).toContain('2027');
    expect(timeline.nodes.at(-1)?.period).toContain('6月');
  });

  it('removes elapsed long-term windows when the exam is close', () => {
    const timeline = buildDiagnosisTimeline('初三', 'middle', '2026-09-20', '英语', augustDate);

    expect(timeline.daysLeft).toBeLessThan(30);
    expect(timeline.nodes).toHaveLength(1);
    expect(timeline.nodes[0].title).toBe('目标线校准与冲刺');
  });
});
