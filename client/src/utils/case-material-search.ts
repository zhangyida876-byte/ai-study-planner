export interface SearchableCaseMaterial {
  manualTag: string;
  title: string;
  pitch: string;
  scenario: string;
  evidence: string;
  aiTags: string[];
  keywords: string[];
  summary: string;
  imageType: string;
  value?: string;
  focus?: string;
  searchText?: string;
}

interface SearchExpansionGroup {
  key: string;
  triggers: string[];
  related: string[];
}

interface SemanticIntent {
  key: string;
  terms: string[];
}

const SEARCH_EXPANSION_GROUPS: SearchExpansionGroup[] = [
  {
    key: 'timeObjection',
    triggers: ['没时间', '没空', '时间少', '时间不够', '太忙', '作业多', '来不及学'],
    related: ['时间安排', '学习时长', '碎片时间', '坚持学习', '查漏补缺', '学习计划', '效率'],
  },
  {
    key: 'limitedPlan',
    triggers: ['单科', '同步课', '只买一年', '买一年', '短期', '三年太长'],
    related: ['全科', '综合排名', '长期规划', '专项课', '续购', '初高衔接', '提前规划'],
  },
  {
    key: 'parentDecision',
    triggers: ['不同意', '不支持', '商量一下', '考虑一下', '问家长', '问妈妈', '问爸爸'],
    related: ['家长支持', '父母', '家长沟通', '教育理念', '孩子愿意', '真实反馈', '信任'],
  },
  {
    key: 'priceValue',
    triggers: ['价格贵', '太贵', '值不值', '划算', '费用', '预算', '没钱', '超预算'],
    related: ['物超所值', '值得', '价格认可', '性价比', '长期学习', '续费', '报名'],
  },
  {
    key: 'trustConcern',
    triggers: ['不信任', '不相信', '不放心', '靠谱吗', '怕被骗', '怀疑', '不了解'],
    related: ['真实反馈', '家长好评', '成绩提升', '录取', '认可', '感谢', '靠谱'],
  },
  {
    key: 'effectConcern',
    triggers: ['担心效果', '怕没效果', '坚持不了', '孩子不学', '三分钟热度', '怕浪费'],
    related: ['学习时长', '使用记录', '打卡', '主动学习', '成绩提升', '效果好', '学习习惯'],
  },
  {
    key: 'activeLearning',
    triggers: ['没动力', '不主动', '不自觉', '不愿意学', '拖拉', '学习习惯差'],
    related: ['主动学习', '自律', '坚持', '愿意学', '自主学习', '打卡'],
  },
  {
    key: 'scoreImprove',
    triggers: ['提分', '涨分', '成绩提升', '排名提高', '考好了', '超预期'],
    related: ['进步', '分数', '排名', '满分', '中考成绩', '录取'],
  },
  {
    key: 'middleExam',
    triggers: ['中考', '考高中', '上岸', '重高', '重点高中', '升学'],
    related: ['中考成绩', '查分', '高中录取', '录取通知书', '考上'],
  },
  {
    key: 'gapFilling',
    triggers: ['补基础', '基础差', '听不懂', '薄弱', '漏洞', '偏科', '哪里不会'],
    related: ['查漏补缺', '知识点', '专项练习', '课前预习', '课后巩固', '错题'],
  },
  {
    key: 'competitor',
    triggers: ['报过班', '补课', '辅导班', '一对一', '竞品', '科大讯飞', '学习机', '平板'],
    related: ['竞品对比', '线下班', '作业帮', '学而思', '课程体系', '效果不好'],
  },
  {
    key: 'lowUrgency',
    triggers: ['不需要', '不着急', '以后再说', '再等等', '先看看', '寒假再说', '暑假再说'],
    related: ['后悔没早点', '早用早提升', '及时查漏补缺', '现在开始', '提前学习', '衔接课'],
  },
  {
    key: 'payment',
    triggers: ['成交', '付款', '报名', '转账', '支付', '订单', '买课', '续费'],
    related: ['成交确认', '购买', '开通', '会员'],
  },
  {
    key: 'referral',
    triggers: ['推荐朋友', '转介绍', '介绍朋友', '分享给朋友'],
    related: ['老带新', '班级群', '同学', '认可', '信任'],
  },
];

const SEMANTIC_INTENTS: SemanticIntent[] = SEARCH_EXPANSION_GROUPS.map(
  (group: SearchExpansionGroup) => ({
    key: group.key,
    terms: [...group.triggers, ...group.related],
  }),
);

function normalizeSearchText(value: string): string {
  return String(value || '').toLowerCase().replace(/\s+/gu, ' ').trim();
}

function containsSearchTerm(text: string, term: string): boolean {
  const normalizedText = normalizeSearchText(text);
  const normalizedTerm = normalizeSearchText(term);
  if (!normalizedText || !normalizedTerm) return false;
  if (normalizedTerm === '中考') return /(^|[^期])中考/u.test(normalizedText);
  return normalizedText.includes(normalizedTerm);
}

function expandQueryTerms(query: string): string[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];
  const terms = new Set<string>([normalized]);
  normalized
    .split(/[\s，,。！？!、；;：:（）()]+/u)
    .filter(Boolean)
    .forEach((term: string) => terms.add(term));
  SEARCH_EXPANSION_GROUPS.forEach((group: SearchExpansionGroup) => {
    if (group.triggers.some((trigger: string) => containsSearchTerm(normalized, trigger))) {
      [...group.triggers, ...group.related].forEach((term: string) => {
        terms.add(normalizeSearchText(term));
      });
    }
  });
  return [...terms];
}

function buildSearchCorpus(material: SearchableCaseMaterial): Record<string, string> {
  const corpus: Record<string, string> = {
    focus: material.focus || '',
    manualTag: material.manualTag,
    pitch: material.pitch,
    evidence: material.evidence,
    imageType: material.imageType,
    aiTags: material.aiTags.join(' '),
    keywords: material.keywords.join(' '),
    title: material.title,
    summary: material.summary,
    scenario: material.scenario,
    value: material.value || '',
    searchText: material.searchText || '',
  };
  corpus.all = normalizeSearchText(Object.values(corpus).join('\n'));
  return corpus;
}

function buildIntentVector(text: string): number[] {
  const normalized = normalizeSearchText(text);
  return SEMANTIC_INTENTS.map((intent: SemanticIntent) =>
    intent.terms.reduce((sum: number, term: string) => (
      containsSearchTerm(normalized, term)
        ? sum + Math.min(3, Math.max(1, term.length - 1))
        : sum
    ), 0),
  );
}

function cosineSimilarity(left: number[], right: number[]): number {
  const dot = left.reduce(
    (sum: number, value: number, index: number) => sum + value * (right[index] || 0),
    0,
  );
  const leftMagnitude = Math.sqrt(left.reduce((sum: number, value: number) => sum + value * value, 0));
  const rightMagnitude = Math.sqrt(right.reduce((sum: number, value: number) => sum + value * value, 0));
  if (!leftMagnitude || !rightMagnitude) return 0;
  return dot / (leftMagnitude * rightMagnitude);
}

function hasQueryIntent(query: string, key: string): boolean {
  const group = SEARCH_EXPANSION_GROUPS.find((item: SearchExpansionGroup) => item.key === key);
  return Boolean(group?.triggers.some((trigger: string) => containsSearchTerm(query, trigger)));
}

function containsAnySearchTerm(text: string, terms: string[]): boolean {
  return terms.some((term: string) => containsSearchTerm(text, term));
}

function scoreBusinessFit(material: SearchableCaseMaterial, query: string, allText: string): number {
  let score = 0;
  const rules: Array<[string, string[], string[], number]> = [
    ['priceValue', ['异议', '好评'], ['物超所值', '值得', '价格认可'], 28],
    ['competitor', ['竞品对比', '报过辅导班对比图', '平板'], ['科大讯飞', '学习机', '辅导班', '一对一'], 46],
    ['limitedPlan', ['好评', '异议'], ['单科', '同步课', '三年', '续购', '全科'], 28],
    ['parentDecision', ['异议', '学生没钱/跟家长沟通', '成交确认'], ['不同意', '商量', '父母', '家长支持'], 34],
    ['trustConcern', ['好评', '教育理念/老师推荐图'], ['真实反馈', '成绩提升', '录取', '信任'], 30],
    ['effectConcern', ['好评', '异议'], ['坚持', '学习时长', '打卡', '效果好'], 26],
    ['lowUrgency', ['好评', '教育理念/老师推荐图'], ['后悔没早点', '及时查漏补缺', '提前学习'], 28],
    ['timeObjection', ['好评', '异议'], ['学习时长', '碎片时间', '学习计划'], 24],
  ];
  rules.forEach(([key, imageTypes, evidenceTerms, weight]) => {
    if (!hasQueryIntent(query, key)) return;
    if (imageTypes.includes(material.imageType)) score += weight;
    if (containsAnySearchTerm(allText, evidenceTerms)) score += Math.round(weight * 0.75);
  });
  if (hasQueryIntent(query, 'payment') && material.imageType === '成交确认') score += 34;
  return score;
}

export function scoreCaseMaterial(material: SearchableCaseMaterial, query: string): number {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 1;
  const corpus = buildSearchCorpus(material);
  const queryTerms = expandQueryTerms(normalizedQuery);
  const weightedFields: Array<[string, number]> = [
    ['manualTag', 95],
    ['focus', 75],
    ['pitch', 55],
    ['evidence', 44],
    ['imageType', 40],
    ['aiTags', 36],
    ['keywords', 32],
    ['scenario', 26],
    ['title', 22],
    ['summary', 16],
    ['searchText', 6],
  ];
  let score = weightedFields.reduce((total: number, [field, weight]) => {
    const text = corpus[field] || '';
    const exact = containsSearchTerm(text, normalizedQuery) ? weight : 0;
    const expanded = queryTerms.reduce((sum: number, term: string) => (
      term !== normalizedQuery && containsSearchTerm(text, term)
        ? sum + Math.max(2, Math.round(weight / 4))
        : sum
    ), 0);
    return total + exact + expanded;
  }, 0);
  score += Math.round(
    cosineSimilarity(buildIntentVector(normalizedQuery), buildIntentVector(corpus.all)) * 92,
  );
  score += scoreBusinessFit(material, normalizedQuery, corpus.all);
  return score;
}

export function matchesCaseMaterialTags(
  material: SearchableCaseMaterial,
  selectedTags: string[],
): boolean {
  if (selectedTags.length === 0) return true;
  const pool = normalizeSearchText([
    material.manualTag,
    ...material.aiTags,
    ...material.keywords,
    material.imageType,
    material.pitch,
    material.summary,
    material.scenario,
    material.evidence,
    material.focus || '',
    material.searchText || '',
  ].filter(Boolean).join(' '));
  return selectedTags.every((tag: string) => pool.includes(normalizeSearchText(tag)));
}

export function violatesCaseMaterialProtectedTerm(
  material: SearchableCaseMaterial,
  query: string,
): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return false;
  const corpus = buildSearchCorpus(material).all;
  if (containsSearchTerm(normalizedQuery, '中考') && !containsSearchTerm(corpus, '中考')) return true;
  if (containsSearchTerm(normalizedQuery, '期中考') && !containsSearchTerm(corpus, '期中考')) return true;
  return false;
}
