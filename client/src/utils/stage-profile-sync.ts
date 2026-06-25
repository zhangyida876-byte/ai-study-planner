import type { StageProfile } from '@client/src/types/stage-profile';
import { formatProfileRegion } from '@client/src/types/stage-profile';

/** 省 / 市 / 区县 → 模块内 region 文本（空格分隔，与 Plan/Diagnosis 一致） */
export function buildRegionTextFromProfile(profile: Pick<StageProfile, 'province' | 'city' | 'county'>): string {
  return [profile.province, profile.city, profile.county].filter(Boolean).join(' ');
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
    selectedProvince: profile.province,
    selectedCity: profile.city,
    county: profile.county,
    region,
    grade: profile.grade,
    targetSchool: profile.targetSchool,
    boardingType: profile.boardingType,
    examMode: profile.examMode,
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
    province: profile.province,
    city: profile.city,
    region: buildRegionTextFromProfile(profile),
    grade: profile.grade,
  };
}
