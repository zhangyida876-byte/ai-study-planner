import type { StageSlug } from '@client/src/config/stages';

/** 学段主页「全局学生档案」，按学段独立存储 */
export interface StageProfile {
  studentName: string;
  province: string;
  city: string;
  county: string;
  grade: string;
  school: string;
  targetSchool: string;
  /** 目标学校近年分数线（自动匹配，可手动覆盖） */
  targetScore?: number;
  targetMajor: string;
  /** 想做的事情/职业方向（用于高中专业与就业推荐） */
  careerIntent: string;
  examDate: string;
  /** 文本概览，如「语92 数78 英85」 */
  scoresOverview: string;
  weakSubjects: string;
  strongSubjects: string;
  /** 每周可支配学习小时数 */
  weeklyStudyHours: string;
  boardingType: '' | 'day' | 'boarding';
  /** 高中选科模式 */
  examMode: string;
  updatedAt: string;
}

export const EMPTY_STAGE_PROFILE: StageProfile = {
  studentName: '',
  province: '',
  city: '',
  county: '',
  grade: '',
  school: '',
  targetSchool: '',
  targetScore: undefined,
  targetMajor: '',
  careerIntent: '',
  examDate: '',
  scoresOverview: '',
  weakSubjects: '',
  strongSubjects: '',
  weeklyStudyHours: '',
  boardingType: '',
  examMode: '',
  updatedAt: '',
};

export function formatProfileRegion(p: Pick<StageProfile, 'province' | 'city' | 'county'>): string {
  return [p.province, p.city, p.county].filter(Boolean).join('');
}

export function getProfileStorageKey(stageSlug: StageSlug): string {
  return `education-ai:stage-profile:${stageSlug}`;
}

export function getExamCountdownDays(examDate: string): number | null {
  if (!examDate) return null;
  const target = new Date(examDate);
  const now = new Date();
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}
