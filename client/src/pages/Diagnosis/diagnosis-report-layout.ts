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
  isLegacy: boolean;
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

export function resolveReportSectionLayout(sections: ReportSection[]): ReportSectionLayout {
  const isLegacy = sections.some((section) => section.index > 6);
  return isLegacy
    ? { primaryIndexes: [1, 2, 3, 6], detailIndexes: [4, 5, 7, 8], isLegacy }
    : { primaryIndexes: [1, 2, 3, 5], detailIndexes: [4, 6], isLegacy };
}
