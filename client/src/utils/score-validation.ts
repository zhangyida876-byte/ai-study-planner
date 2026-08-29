export type ScoreValidationResult =
  | { valid: true }
  | { valid: false; message: string };

const ELEMENTARY_GRADES = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
const MIDDLE_GRADES = ['初一', '初二', '初三', '七年级', '八年级', '九年级'];

export function getDefaultSubjectMax(grade: string, subject: string): number {
  if (ELEMENTARY_GRADES.includes(grade)) return 100;
  if (MIDDLE_GRADES.includes(grade)) {
    return ['语文', '数学', '英语'].includes(subject) ? 120 : 100;
  }
  return ['语文', '数学', '英语'].includes(subject) ? 150 : 100;
}

export function resolveSubjectScoreMax(options: {
  grade: string;
  subject: string;
  explicitMax?: number;
  inferredMax?: number;
  fallbackMax?: number;
}): number {
  const { grade, subject, explicitMax, inferredMax, fallbackMax } = options;
  for (const candidate of [explicitMax, inferredMax, fallbackMax]) {
    if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate > 0) {
      return candidate;
    }
  }
  return getDefaultSubjectMax(grade, subject);
}

export function validateSubjectScore(
  score: number | undefined,
  maxScore: number,
): ScoreValidationResult {
  if (!Number.isFinite(maxScore) || maxScore <= 0) {
    return { valid: false, message: '满分必须大于0' };
  }
  if (score == null) return { valid: true };
  if (!Number.isFinite(score)) {
    return { valid: false, message: '请输入有效分数' };
  }
  if (score < 0) {
    return { valid: false, message: '得分不能小于0' };
  }
  if (score > maxScore) {
    return { valid: false, message: `得分不能超过满分${maxScore}` };
  }
  return { valid: true };
}
