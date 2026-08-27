import type { EducationStage } from '@client/src/api/plugins';

export type StageSlug = 'elementary' | 'middle' | 'high';

export type FeatureSlug =
  | 'diagnosis'
  | 'plan'
  | 'knowledge'
  | 'materials'
  | 'study-plan'
  | 'advice'
  | 'future'
  | 'scripts'
  | 'history';

export type FeatureGroupSlug = 'learning' | 'cases' | 'scripts';

export interface FeatureGroupConfig {
  slug: FeatureGroupSlug;
  label: string;
}

export interface StageFeatureConfig {
  slug: FeatureSlug;
  label: string;
  description: string;
  pathSuffix: string;
  group: FeatureGroupSlug;
}

export interface StageConfig {
  slug: StageSlug;
  stage: EducationStage;
  label: string;
  subtitle: string;
  focusPoints: string[];
  grades: string[];
  knowledgeGrades: string[];
  examType: '小升初' | '中考' | '高考';
  examLabel: string;
  targetLabel: string;
  features: StageFeatureConfig[];
}

const FEATURES: StageFeatureConfig[] = [
  {
    slug: 'diagnosis',
    label: '学情诊断',
    description: '按学段差异化分析薄弱点、失分原因与升学影响',
    pathSuffix: 'diagnosis',
    group: 'learning',
  },
  {
    slug: 'knowledge',
    label: '知识点查询',
    description: '按教材、年级和科目查询知识点并生成深度分析',
    pathSuffix: 'knowledge',
    group: 'learning',
  },
  {
    slug: 'future',
    label: '未来规划',
    description: '统一承接升学路径与可执行的学习课表',
    pathSuffix: 'future',
    group: 'learning',
  },
  {
    slug: 'history',
    label: '历史档案',
    description: '按学生和日期查看、搜索与删除历史生成内容',
    pathSuffix: 'history',
    group: 'learning',
  },
  {
    slug: 'materials',
    label: '案例素材库',
    description: '按学段、年级和沟通场景检索真实案例素材与推荐话术',
    pathSuffix: 'materials',
    group: 'cases',
  },
  {
    slug: 'scripts',
    label: '话术中心',
    description: '集中使用异议处理、每日黄金话术与自定义提问',
    pathSuffix: 'scripts',
    group: 'scripts',
  },
];

export const FEATURE_GROUPS: FeatureGroupConfig[] = [
  { slug: 'learning', label: '学情类' },
  { slug: 'cases', label: '案例类' },
  { slug: 'scripts', label: '话术类' },
];

export const STAGE_CONFIGS: Record<StageSlug, StageConfig> = {
  elementary: {
    slug: 'elementary',
    stage: 'elementary',
    label: '小学',
    subtitle: '基础知识 · 学习习惯 · 小升初准备 · 校内成绩提升',
    focusPoints: [
      '语文、数学、英语基础掌握',
      '计算、阅读、表达与单词积累',
      '学习习惯与小升初影响评估',
    ],
    grades: ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'],
    knowledgeGrades: ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'],
    examType: '小升初',
    examLabel: '小升初',
    targetLabel: '目标初中',
    features: FEATURES,
  },
  middle: {
    slug: 'middle',
    stage: 'middle',
    label: '初中',
    subtitle: '中考科目 · 薄弱知识点 · 中考规划 · 目标高中',
    focusPoints: [
      '中考全科诊断与失分归因',
      '生地会考、实验、体育等节点',
      '目标高中分数线与提升路径',
    ],
    grades: ['初一', '初二', '初三'],
    knowledgeGrades: ['七年级', '八年级', '九年级', '初一', '初二', '初三'],
    examType: '中考',
    examLabel: '中考',
    targetLabel: '目标高中',
    features: FEATURES,
  },
  high: {
    slug: 'high',
    stage: 'high',
    label: '高中',
    subtitle: '选科组合 · 高考模式 · 目标院校 · 专业与就业',
    focusPoints: [
      '3+3 / 3+1+2 选科与成绩分析',
      '目标院校录取线与位次',
      '专业方向与就业前景参考',
    ],
    grades: ['高一', '高二', '高三'],
    knowledgeGrades: ['高一', '高二', '高三'],
    examType: '高考',
    examLabel: '高考',
    targetLabel: '目标院校',
    features: FEATURES,
  },
};

export const STAGE_LIST: StageConfig[] = [
  STAGE_CONFIGS.elementary,
  STAGE_CONFIGS.middle,
  STAGE_CONFIGS.high,
];

export function isStageSlug(value: string | undefined): value is StageSlug {
  return value === 'elementary' || value === 'middle' || value === 'high';
}

export function parseStageSlug(slug: string | undefined): StageSlug | null {
  return isStageSlug(slug) ? slug : null;
}

/** 从 pathname 提取学段（兼容含 /app/app_xxx 前缀的路径） */
export function parseStageSlugFromPathname(pathname: string): StageSlug | null {
  for (const segment of pathname.split('/').filter(Boolean)) {
    if (isStageSlug(segment)) return segment;
  }
  return null;
}

export function stagePath(stage: StageSlug, feature?: FeatureSlug): string {
  if (!feature) return `/${stage}`;
  const cfg = STAGE_CONFIGS[stage].features.find((f) => f.slug === feature);
  return `/${stage}/${cfg?.pathSuffix ?? feature}`;
}

export function getFeatureLabel(stage: StageSlug, feature: FeatureSlug): string {
  return STAGE_CONFIGS[stage].features.find((f) => f.slug === feature)?.label ?? feature;
}

export function getStageFromGrade(grade: string): StageSlug {
  if (STAGE_CONFIGS.elementary.grades.includes(grade)) return 'elementary';
  if (STAGE_CONFIGS.high.grades.includes(grade)) return 'high';
  return 'middle';
}
