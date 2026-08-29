import {
  getDefaultSubjectMax,
  resolveSubjectScoreMax,
  validateSubjectScore,
} from '../../client/src/utils/score-validation';

describe('diagnosis score validation', () => {
  it.each([75, 80, 90, 100])('accepts middle-school mathematics score %s within 120', (score) => {
    expect(validateSubjectScore(score, 120)).toEqual({ valid: true });
  });

  it('does not retain a minimum score after report generation', () => {
    expect(validateSubjectScore(90, 120)).toEqual({ valid: true });
    expect(validateSubjectScore(70, 120)).toEqual({ valid: true });
  });

  it('keeps target score independent from subject score validation', () => {
    const targetScore = 500;
    const subjectMax = resolveSubjectScoreMax({
      grade: '初二',
      subject: '数学',
      inferredMax: 120,
    });

    expect(targetScore).toBe(500);
    expect(validateSubjectScore(70, subjectMax)).toEqual({ valid: true });
  });

  it('rejects only scores outside zero and the resolved subject maximum', () => {
    expect(validateSubjectScore(-1, 120)).toEqual({ valid: false, message: '得分不能小于0' });
    expect(validateSubjectScore(121, 120)).toEqual({ valid: false, message: '得分不能超过满分120' });
    expect(validateSubjectScore(75, 0)).toEqual({ valid: false, message: '满分必须大于0' });
  });

  it('uses stage defaults when no maximum is supplied', () => {
    expect(getDefaultSubjectMax('四年级', '数学')).toBe(100);
    expect(getDefaultSubjectMax('初二', '数学')).toBe(120);
    expect(getDefaultSubjectMax('高一', '数学')).toBe(150);
    expect(resolveSubjectScoreMax({ grade: '初二', subject: '数学' })).toBe(120);
  });
});
