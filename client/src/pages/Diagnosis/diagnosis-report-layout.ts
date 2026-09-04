export interface ReportSection {
  index: number;
  title: string;
  content: string;
}

export interface ReportSubsection {
  index: number;
  title: string;
  content: string;
}

export interface ReportSectionLayout {
  primaryIndexes: number[];
  detailIndexes: number[];
  version: 'business-seven' | 'current-eight' | 'compact-six' | 'legacy-eight';
}

const STRUCTURED_LABELS = [
  '问题',
  '核心问题',
  '家长看到',
  '背后根因',
  '后续影响',
  '怎么验证',
  '家长怎么验证',
  '专业判断',
  '家长听得懂',
  '马上先做',
  '会暴露什么',
  '为什么',
  '现在先做',
  '底层能力',
  '影响科目',
  '影响机制',
  '家长能看到',
  '下一个关键节点',
  '阶段定位',
  '节点路线',
  '会影响的知识点/题型',
  '预计暴露分值',
  '预计成绩风险区间',
  '判断依据',
  '当前漏洞',
  '当天作业影响',
  '近期考试影响',
  '其他科目与总分',
  '信心与节奏',
  '目标差距',
  '家长现在验证',
  '家长补充信息',
  '可能成因',
  '当前最优突破口',
  '不建议家长',
  '建议家长',
] as const;

const CANONICAL_SECTION_TITLES: Record<number, string> = {
  1: '顾问先讲：诊断总结',
  2: '家长看到的现象',
  3: '各科核心问题与根因',
  4: '各科本学期学情解读',
  5: '跨学科影响',
  6: '行动方案',
  7: '洋葱学园承接方案',
  8: '课程顾问转述话术',
};

const SECTION_TITLE_ALIASES: Record<number, string[]> = {
  1: ['顾问先讲：诊断总结', '顾问先讲', '诊断总结', '当前节点与一句话结论', '一句话结论'],
  2: ['家长看到的现象', '家长最有感的现象'],
  3: ['各科核心问题与根因', '核心问题与根因'],
  4: ['各科本学期学情解读', '年级学期特点与目标影响'],
  5: ['跨学科影响'],
  6: ['行动方案', '未来7天家长可执行动作'],
  7: ['洋葱学园承接方案', '洋葱承接方案', '产品承接方案'],
  8: ['课程顾问转述话术', '课程顾问话术', '顾问话术', '30秒话术', '2分钟话术'],
};

function normalizeHeading(value: string): string {
  return value
    .replace(/[【】\[\]#*_：:，,。.!！?？+＋\s]/gu, '')
    .toLowerCase();
}

function resolveSectionIndex(numberText: string | undefined, title: string): number | null {
  const numberedIndex = Number(numberText);
  if (Number.isInteger(numberedIndex) && numberedIndex >= 1 && numberedIndex <= 8) {
    return numberedIndex;
  }
  const normalizedTitle = normalizeHeading(
    numberText && numberedIndex > 8 ? `${numberText}${title}` : title,
  );
  const businessTitleIndexes: Array<[number, string[]]> = [
    [1, ['顾问先讲：诊断总结', '顾问先讲', '诊断总结', '一句话学情判断']],
    [2, ['家长能看到的现象']],
    [3, ['背后根因']],
    [4, ['近期风险']],
    [5, ['家长可执行动作']],
    [6, ['洋葱学园承接方案', '洋葱承接方案']],
    [7, ['课程顾问可复制话术']],
  ];
  for (const [index, aliases] of businessTitleIndexes) {
    if (aliases.some((alias) => normalizedTitle.includes(normalizeHeading(alias)))) {
      return index;
    }
  }
  for (const [indexText, aliases] of Object.entries(SECTION_TITLE_ALIASES)) {
    if (aliases.some((alias) => normalizedTitle.includes(normalizeHeading(alias)))) {
      return Number(indexText);
    }
  }
  return null;
}

function mergeSection(sections: ReportSection[], section: ReportSection): void {
  const existing = sections.find((candidate) => candidate.index === section.index);
  if (!existing) {
    sections.push(section);
    return;
  }
  const subsectionTitle = `### ${section.index}.${existing.content ? 2 : 1} ${section.title}`;
  existing.content = section.content.startsWith(`### ${section.index}.`)
    ? [existing.content, section.content].filter(Boolean).join('\n\n').trim()
    : [existing.content, subsectionTitle, section.content].filter(Boolean).join('\n\n').trim();
}

export function parseLabeledFields(content: string): Array<{ label: string; value: string }> {
  const fields: Array<{ label: string; value: string }> = [];
  let current: { label: string; value: string } | null = null;

  for (const line of content.split('\n')) {
    const match = line.match(/^\s*(?:[-*]\s*)?\*{0,2}([^：:*]+)[：:]\*{0,2}\s*(.*)$/u);
    const label = match?.[1]?.trim();
    if (match && label && STRUCTURED_LABELS.includes(label as typeof STRUCTURED_LABELS[number])) {
      if (current) fields.push({ ...current, value: current.value.trim() });
      current = { label, value: match[2].trim() };
      continue;
    }
    if (current && line.trim()) current.value += `\n${line.trim()}`;
  }

  if (current) fields.push({ ...current, value: current.value.trim() });
  return fields;
}

export function parseReportSections(content: string): ReportSection[] {
  const lines = String(content || '').split('\n');
  const sections: ReportSection[] = [];
  let active: ReportSection | null = null;

  const flushActive = () => {
    if (!active) return;
    mergeSection(sections, { ...active, content: active.content.trim() });
    active = null;
  };

  for (const line of lines) {
    const headingMatch = line.match(/^##(?!#)\s*(.+?)\s*$/u);
    if (headingMatch) {
      const heading = headingMatch[1];
      const numberedMatch = heading.match(/^(\d+)(?:[.、．]\s*|\s+)(.+?)\s*$/u);
      const numberText = numberedMatch?.[1];
      const headingTitle = numberedMatch?.[2] || heading;
      const index = resolveSectionIndex(numberText, headingTitle);
      if (!index) {
        if (active) active.content += `${line}\n`;
        continue;
      }
      flushActive();
      const hasCanonicalNumber = Number(numberText) >= 1 && Number(numberText) <= 8;
      const rawTitle = headingTitle;
      const normalizedRawTitle = normalizeHeading(rawTitle);
      const initialContent = index === 8 && normalizedRawTitle.includes('30秒')
        ? '### 8.1 30秒短版\n'
        : index === 8 && normalizedRawTitle.includes('2分钟')
          ? '### 8.2 2分钟完整版\n'
          : '';
      active = {
        index,
        title: hasCanonicalNumber
          ? headingTitle.replace(/[【】]/gu, '').trim()
          : CANONICAL_SECTION_TITLES[index] || rawTitle.replace(/[【】]/gu, '').trim(),
        content: initialContent,
      };
      continue;
    }
    if (active) active.content += `${line}\n`;
  }

  flushActive();
  return sections;
}

export function parseStageSubsections(content: string): ReportSubsection[] {
  const lines = content.split('\n');
  const sections: ReportSubsection[] = [];
  let active: ReportSubsection | null = null;
  for (const line of lines) {
    const match = line.match(/^###\s*4[.、．](\d+)\s*(.+?)\s*$/u);
    if (match) {
      if (active) sections.push({ ...active, content: active.content.trim() });
      active = { index: Number(match[1]), title: match[2].trim(), content: '' };
      continue;
    }
    if (active) active.content += `${line}\n`;
  }
  if (active) sections.push({ ...active, content: active.content.trim() });
  return sections;
}

export function parseSubjectBlocks(content: string): Array<{ title: string; content: string }> {
  const lines = content.split('\n');
  const blocks: Array<{ title: string; content: string }> = [];
  let active: { title: string; content: string } | null = null;
  for (const line of lines) {
    const match = line.match(/^####\s+(.+?)\s*$/u);
    if (match) {
      if (active) blocks.push({ ...active, content: active.content.trim() });
      active = { title: match[1].trim(), content: '' };
      continue;
    }
    if (active) active.content += `${line}\n`;
  }
  if (active) blocks.push({ ...active, content: active.content.trim() });
  return blocks;
}

export function parseSubjectSections(content: string): Array<{ title: string; content: string }> {
  const lines = content.split('\n');
  const blocks: Array<{ title: string; content: string }> = [];
  let active: { title: string; content: string } | null = null;
  for (const line of lines) {
    const match = line.match(/^###\s+(?!\d+[.、．])(.+?)\s*$/u);
    if (match) {
      if (active) blocks.push({ ...active, content: active.content.trim() });
      active = { title: match[1].trim(), content: '' };
      continue;
    }
    if (active) active.content += `${line}\n`;
  }
  if (active) blocks.push({ ...active, content: active.content.trim() });
  return blocks;
}

export function parseNumberedSubsections(
  content: string,
  sectionIndex: number,
): ReportSubsection[] {
  const lines = content.split('\n');
  const blocks: ReportSubsection[] = [];
  let active: ReportSubsection | null = null;
  const expression = new RegExp(`^###\\s*${sectionIndex}[.、．](\\d+)\\s*(.+?)\\s*$`, 'u');
  for (const line of lines) {
    const match = line.match(expression);
    if (match) {
      if (active) blocks.push({ ...active, content: active.content.trim() });
      active = { index: Number(match[1]), title: match[2].trim(), content: '' };
      continue;
    }
    if (active) active.content += `${line}\n`;
  }
  if (active) blocks.push({ ...active, content: active.content.trim() });
  return blocks;
}

export function resolveReportSectionLayout(sections: ReportSection[]): ReportSectionLayout {
  const isBusinessSeven = sections.some((section) => (
    section.index === 1 && (
      section.title.includes('顾问先讲')
      || section.title.includes('诊断总结')
      || section.title.includes('一句话学情判断')
    )
  )) || sections.some((section) => (
    section.index === 7 && section.title.includes('课程顾问可复制话术')
  ));
  if (isBusinessSeven) {
    return {
      primaryIndexes: [1, 2, 3, 4, 5, 6, 7],
      detailIndexes: [],
      version: 'business-seven',
    };
  }
  const sectionSix = sections.find((section) => section.index === 6);
  const isCurrentEight = sections.some((section) => (
    section.index === 1 && section.title.includes('当前节点')
  )) || Boolean(sectionSix?.title.includes('行动方案'));
  if (isCurrentEight) {
    return {
      primaryIndexes: [1, 2, 3, 4, 5, 6],
      detailIndexes: [7, 8],
      version: 'current-eight',
    };
  }
  if (sections.some((section) => section.index > 6)) {
    return {
      primaryIndexes: [1, 2, 3, 6],
      detailIndexes: [4, 5, 7, 8],
      version: 'legacy-eight',
    };
  }
  return {
    primaryIndexes: [1, 2, 3, 5],
    detailIndexes: [4, 6],
    version: 'compact-six',
  };
}
