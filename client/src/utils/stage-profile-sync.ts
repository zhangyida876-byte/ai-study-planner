import type { StageProfile } from '@client/src/types/stage-profile';
import { formatProfileRegion } from '@client/src/types/stage-profile';
import { parseScoreOverviewToSubjectScores } from '@client/src/utils/score-overview';
import { resolvePolicyProvince } from '@client/src/utils/region-priority';

/** 省 / 市 / 区县 → 模块内 region 文本（空格分隔，与 Plan/Diagnosis 一致） */
export function buildRegionTextFromProfile(profile: Pick<StageProfile, 'province' | 'city' | 'county'>): string {
  return profile.city
    ? [profile.city, profile.county].filter(Boolean).join(' ')
    : [profile.province, profile.county].filter(Boolean).join(' ');
}

export function hasProfileBasics(profile: StageProfile): boolean {
  return Boolean(profile.studentName || profile.grade || formatProfileRegion(profile));
}

/** 从档案构建升学规划模块可写入的局部状态 */
export function getPlanAutofillFromProfile(profile: StageProfile) {
  const region = buildRegionTextFromProfile(profile);
  let examYear: number | undefined;
  if (profile.examDate) {
    const y = new Date(profile.examDate).getFullYear();
    if (!Number.isNaN(y)) examYear = y;
  }
  return {
    selectedProvince: resolvePolicyProvince(profile.province, profile.city),
    selectedCity: profile.city,
    county: profile.county,
    region,
    grade: profile.grade,
    targetSchool: profile.targetSchool,
    targetScore: profile.targetScore,
    careerIntent: profile.careerIntent,
    boardingType: profile.boardingType,
    examMode: profile.examMode,
    scores: parseScoreOverviewToSubjectScores(profile.scoresOverview || ''),
    examYear,
  };
}

/** 从档案构建学习规划模块可写入的局部状态 */
export function getStudyPlanAutofillFromProfile(profile: StageProfile) {
  return {
    grade: profile.grade,
    region: formatProfileRegion(profile),
    school: profile.school,
    targetSchool: profile.targetSchool,
    targetScore: profile.targetScore != null ? String(profile.targetScore) : '',
    careerIntent: profile.careerIntent,
    examMode: profile.examMode,
    examDate: profile.examDate,
    currentScore: profile.scoresOverview,
    weakSubjects: profile.weakSubjects,
    strongSubjects: profile.strongSubjects,
    weeklyHours: profile.weeklyStudyHours,
    boardingType: profile.boardingType,
  };
}

/** 从档案构建知识点筛选可写入的局部状态 */
export function getKnowledgeAutofillFromProfile(profile: StageProfile) {
  return {
    province: resolvePolicyProvince(profile.province, profile.city),
    city: profile.city,
    region: buildRegionTextFromProfile(profile),
    grade: profile.grade,
  };
}
