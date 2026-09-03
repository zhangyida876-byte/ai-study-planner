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
  version: 'current-eight' | 'compact-six' | 'legacy-eight';
}

const STRUCTURED_LABELS = [
  '问题',
  '家长看到',
  '背后根因',
  '后续影响',
  '怎么验证',
  '底层能力',
  '影响科目',
  '影响机制',
  '家长能看到',
] as const;

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
  const lines = content.split('\n');
  const sections: ReportSection[] = [];
  let active: ReportSection | null = null;

  for (const line of lines) {
    const match = line.match(/^##\s*(\d+)[.、．]?\s*(.+?)\s*$/u);
    if (match) {
      if (active) sections.push({ ...active, content: active.content.trim() });
      active = {
        index: Number(match[1]),
        title: match[2].replace(/[【】]/gu, '').trim(),
        content: '',
      };
      continue;
    }
    if (active) active.content += `${line}\n`;
  }

  if (active) sections.push({ ...active, content: active.content.trim() });
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
