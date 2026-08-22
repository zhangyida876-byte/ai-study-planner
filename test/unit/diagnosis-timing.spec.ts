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

  it('builds a concise five-node roadmap from diagnosis to the target exam', () => {
    const nodes = buildDiagnosisTimeline('初三', 'middle', undefined, '数学', augustDate);

    expect(nodes).toHaveLength(5);
    expect(nodes[0].focus).toContain('数学');
    expect(nodes[2].title).toBe('集中补弱');
    expect(nodes[4].period).toContain('2027年6月');
    expect(nodes.every((node) => node.risk.length > 0)).toBe(true);
  });

  it('uses an explicit exam date when the profile provides one', () => {
    const nodes = buildDiagnosisTimeline('高三', 'high', '2027-06-07', '物理', augustDate);

    expect(nodes[4].period).toContain('2027');
    expect(nodes[4].period).toContain('6月');
  });
});
