/**
 * 中考录取计分满分权威表（首页档案 / 规划 / 诊断共用）
 *
 * 收录原则（自检门槛）：
 * 1. 优先教育局/考试院原文或本地宝等明确转述官方方案
 * 2. subjects = 计入录取总分的单科满分（不是卷面百分制）
 * 3. 拿不准的地市宁可不收录，回落到联网解析 +「待核验」
 * 4. 更具体的城市优先于宽泛匹配
 */

export type ZhongkaoScoreProfile = {
  cityKeys: string[];
  year: number;
  total: number;
  subjects: Record<string, number>;
  notes?: string[];
  subjectNotes?: Record<string, string>;
  source: string;
  /** high=官方/权威转述；medium=多源交叉但仍建议顾问复核 */
  confidence: 'high' | 'medium';
};

export const ZHONGKAO_SCORE_PROFILES: ZhongkaoScoreProfile[] = [
  {
    cityKeys: ['北京'],
    year: 2026,
    total: 510,
    subjects: { 语文: 100, 数学: 100, 英语: 100, 道法: 80, 物理: 80, 体育: 50 },
    notes: ['计分科目为语数外、道法、物理、体育；史地化生等以等级呈现。', '英语含听说；道法含综合素质评价分；物理含实验操作。'],
    source: '北京市中招录取总分口径',
    confidence: 'high',
  },
  {
    cityKeys: ['上海'],
    year: 2026,
    total: 750,
    subjects: { 语文: 150, 数学: 150, 英语: 150, 道法: 60, 历史: 60, 物理: 70, 化学: 50, 体育: 30 },
    notes: [
      '综合测试150分含：物理笔试70、化学笔试50、跨学科15、物化实验15；表内物理/化学为综合测试笔试分值。',
      '道法/历史/体育均含日常考核与统一考试。',
    ],
    source: '上海市教委学业考试计分口径',
    confidence: 'high',
  },
  {
    cityKeys: ['天津'],
    year: 2026,
    total: 800,
    subjects: { 语文: 120, 数学: 120, 英语: 120, 物理: 100, 化学: 100, 道法: 100, 历史: 100, 体育: 40 },
    notes: ['英语含听力；道法/历史开卷。'],
    source: '天津市中考计分口径',
    confidence: 'high',
  },
  {
    cityKeys: ['重庆'],
    year: 2026,
    total: 750,
    subjects: { 语文: 150, 数学: 150, 英语: 150, 物理: 80, 化学: 70, 道法: 50, 历史: 50, 体育: 50 },
    notes: ['英语含听力；文化考试700分+体育50分。'],
    source: '重庆市中考计分口径',
    confidence: 'high',
  },
  {
    cityKeys: ['广州'],
    year: 2026,
    total: 810,
    subjects: { 语文: 120, 数学: 120, 英语: 120, 道法: 90, 历史: 90, 物理: 100, 化学: 100, 体育: 70 },
    notes: ['英语含听说30分；物理/化学含实验各10分；体育含综合评价。'],
    source: '广州市教育局2024-2026中考实施意见',
    confidence: 'high',
  },
  {
    cityKeys: ['深圳'],
    year: 2026,
    total: 630,
    subjects: { 语文: 120, 数学: 100, 英语: 100, 物理: 70, 化学: 50, 历史: 70, 道法: 50, 体育: 50 },
    notes: ['理化实验操作共20分（物/化各10分）计入总分；道法开卷。', '数学/英语满分均为100，勿与广州120混淆。'],
    subjectNotes: {
      物理: '另有理化实验操作：物理、化学各10分，共20分，计入深圳中考总分。',
      化学: '另有理化实验操作：物理、化学各10分，共20分，计入深圳中考总分。',
    },
    source: '深圳市教育局2026年高中阶段学校考试招生工作通知',
    confidence: 'high',
  },
  {
    cityKeys: ['杭州'],
    year: 2026,
    total: 650,
    subjects: { 语文: 120, 数学: 120, 英语: 120, 科学: 160, 道法: 100, 体育: 30 },
    notes: ['浙江统一：科学160、社会（含道法/历史与社会）100；表内道法栏对应社会100分。', '英语含听力20分。'],
    source: '杭州市区2026中考总分口径',
    confidence: 'high',
  },
  {
    cityKeys: ['南京'],
    year: 2026,
    total: 700,
    subjects: { 语文: 120, 数学: 120, 英语: 120, 物理: 100, 化学: 80, 道法: 60, 历史: 60, 体育: 40 },
    notes: ['生地、理化实验、艺术等以等级呈现，不计入700分总分。'],
    source: '南京市教育局2026中考招生政策问答',
    confidence: 'high',
  },
  {
    cityKeys: ['成都'],
    year: 2026,
    total: 710,
    subjects: { 语文: 150, 数学: 150, 英语: 150, 物理: 70, 化学: 50, 体育: 60, 道法: 20, 历史: 20, 生物: 20, 地理: 20 },
    notes: ['道法/历史/生物/地理按毕业等级折算各20分计入升学成绩。'],
    source: '成都市2026中考升学成绩口径',
    confidence: 'high',
  },
  {
    cityKeys: ['武汉'],
    year: 2026,
    total: 680,
    subjects: { 语文: 120, 数学: 120, 英语: 120, 物理: 70, 化学: 50, 道法: 60, 历史: 60, 地理: 50, 生物: 50, 体育: 50 },
    notes: ['理化生实验操作共30分计入总分。', '单科呈现分与录取综合总分680并存，请以武汉招考文件为准。'],
    subjectNotes: {
      物理: '另有理化生实验操作：物理、化学、生物每科10分，共30分，计入武汉中考总分。',
      化学: '另有理化生实验操作：物理、化学、生物每科10分，共30分，计入武汉中考总分。',
      生物: '另有理化生实验操作：物理、化学、生物每科10分，共30分，计入武汉中考总分。',
    },
    source: '武汉中考权威口径（系统内核验沿用）',
    confidence: 'high',
  },
  {
    cityKeys: ['长沙'],
    year: 2026,
    total: 630,
    subjects: { 语文: 120, 数学: 120, 英语: 100, 道法: 60, 历史: 60, 物理: 70, 化学: 50, 体育: 50 },
    notes: ['2026年起生物、地理改为等第入围，不计入630分总分。', '道法/历史/物理/化学为卷面折合后的录取计分分值。'],
    source: '长沙市2026年初中学业水平考试与高中招生工作方案',
    confidence: 'high',
  },
  {
    cityKeys: ['合肥'],
    year: 2026,
    total: 750,
    subjects: { 语文: 150, 数学: 150, 英语: 120, 道法: 80, 历史: 70, 物理: 70, 化学: 40, 体育: 60 },
    notes: ['另有实验操作分计入总分（常见约10分），以合肥教育局当年文件为准。'],
    source: '合肥市中考计分结构（多源交叉）',
    confidence: 'medium',
  },
  {
    cityKeys: ['济南'],
    year: 2026,
    total: 660,
    subjects: { 语文: 150, 数学: 150, 英语: 150, 物理: 90, 化学: 60, 体育: 60 },
    notes: ['道法/历史/生物/地理多为等级呈现，不计入660分总分。'],
    source: '济南市2026中考计分口径',
    confidence: 'high',
  },
  {
    cityKeys: ['青岛'],
    year: 2026,
    total: 360,
    subjects: { 语文: 120, 数学: 120, 英语: 120 },
    notes: ['青岛计分以语数英为主，其余科目多为等级；勿套用济南660分结构。'],
    source: '青岛市中考计分口径',
    confidence: 'high',
  },
];

export function resolveZhongkaoProfile(region: string): ZhongkaoScoreProfile | null {
  const compact = region.replace(/\s+/g, '');
  if (!compact) return null;

  let best: ZhongkaoScoreProfile | null = null;
  let bestScore = -1;
  for (const profile of ZHONGKAO_SCORE_PROFILES) {
    for (const key of profile.cityKeys) {
      if (!compact.includes(key)) continue;
      // 单城方案优先；high 置信度优先；更长城市名优先
      const score =
        key.length * 10 +
        (profile.cityKeys.length === 1 ? 100 : 0) +
        (profile.confidence === 'high' ? 20 : 0);
      if (score > bestScore) {
        best = profile;
        bestScore = score;
      }
    }
  }
  return best;
}

export function listZhongkaoCoveredCities(): string[] {
  return [...new Set(ZHONGKAO_SCORE_PROFILES.flatMap((p) => p.cityKeys))];
}
