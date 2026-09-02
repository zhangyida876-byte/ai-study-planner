import React, { useMemo } from 'react';
import {
  AlertCircle,
  BookOpenCheck,
  Brain,
  CalendarDays,
  CheckSquare2,
  ChevronRight,
  Eye,
  GitBranch,
  ListChecks,
  MessageCircleMore,
  MessageSquareQuote,
  PackageCheck,
  Sparkles,
} from 'lucide-react';
import { Streamdown } from '@client/src/components/ui/streamdown';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@client/src/components/ui/accordion';

interface ReportSection {
  index: number;
  title: string;
  content: string;
}

interface DiagnosisReportViewProps {
  content: string;
}

interface ReportSubsection {
  index: number;
  title: string;
  content: string;
}

const SECTION_ICONS: Record<number, React.FC<{ className?: string }>> = {
  1: Sparkles,
  2: Eye,
  3: AlertCircle,
  6: CheckSquare2,
  7: PackageCheck,
  8: MessageSquareQuote,
};

function parseReportSections(content: string): ReportSection[] {
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

function parseStageSubsections(content: string): ReportSubsection[] {
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

function parseSubjectBlocks(content: string): Array<{ title: string; content: string }> {
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

const STAGE_ICONS = [CalendarDays, Brain, BookOpenCheck, GitBranch, ListChecks, MessageCircleMore];

const StageInterpretationSection: React.FC<{ section: ReportSection }> = ({ section }) => {
  const subsections = parseStageSubsections(section.content);
  if (subsections.length === 0) return <PrimarySection section={section} />;

  return (
    <section className="border-b-2 border-dashed border-ink/15 py-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center border-2 border-ink bg-postit-yellow shadow-hard-sm">
          <CalendarDays className="size-4 text-pen-blue" />
        </span>
        <h3 className="font-marker text-lg font-bold">{section.title}</h3>
      </div>
      <div className="space-y-4">
        {subsections.map((subsection) => {
          const Icon = STAGE_ICONS[subsection.index - 1] || ChevronRight;
          const subjectBlocks = subsection.index === 3 ? parseSubjectBlocks(subsection.content) : [];
          const isAction = subsection.index === 5;
          return (
            <div
              key={subsection.index}
              className={`border-2 border-dashed border-ink/20 p-4 ${subsection.index === 1 ? 'bg-postit-yellow/35' : isAction ? 'bg-pen-blue/5' : 'bg-white'}`}
            >
              <h4 className="font-marker mb-3 flex items-center gap-2 text-base font-bold">
                <Icon className={`size-4 ${isAction ? 'text-marker-red' : 'text-pen-blue'}`} />
                {subsection.title}
              </h4>
              {subjectBlocks.length > 0 ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {subjectBlocks.map((block) => (
                    <article key={block.title} className="border-l-4 border-pen-blue bg-accent/35 p-3">
                      <h5 className="font-marker mb-2 font-bold">{block.title}</h5>
                      <div className="font-hand text-sm leading-6">
                        <Streamdown>{block.content}</Streamdown>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="font-hand text-sm leading-6">
                  <Streamdown>{subsection.content}</Streamdown>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

const PrimarySection: React.FC<{ section: ReportSection }> = ({ section }) => {
  const Icon = SECTION_ICONS[section.index] || ChevronRight;
  const isConclusion = section.index === 1;

  return (
    <section className={`border-b-2 border-dashed border-ink/15 py-5 first:pt-0 ${isConclusion ? 'bg-postit-yellow/45 px-4' : ''}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center border-2 border-ink bg-white shadow-hard-sm">
          <Icon className={`size-4 ${section.index === 3 ? 'text-marker-red' : 'text-pen-blue'}`} />
        </span>
        <h3 className="font-marker text-lg font-bold">{section.title}</h3>
      </div>
      <div className={`font-hand prose-headings:font-marker ${isConclusion ? 'text-lg font-bold leading-8' : 'text-sm leading-6'}`}>
        <Streamdown>{section.content}</Streamdown>
      </div>
    </section>
  );
};

const DiagnosisReportView: React.FC<DiagnosisReportViewProps> = ({ content }) => {
  const sections = useMemo(() => parseReportSections(content), [content]);
  const byIndex = useMemo(
    () => new Map(sections.map((section) => [section.index, section])),
    [sections],
  );
  const primarySections = [1, 2, 3, 4, 6, 7, 8]
    .map((index) => byIndex.get(index))
    .filter((section): section is ReportSection => Boolean(section));
  const detailSections = [5]
    .map((index) => byIndex.get(index))
    .filter((section): section is ReportSection => Boolean(section));

  if (sections.length === 0) {
    return (
      <div className="font-hand prose-headings:font-marker bg-white/70 p-4">
        <Streamdown>{content}</Streamdown>
      </div>
    );
  }

  return (
    <div className="bg-white/70 px-4 py-2">
      {primarySections.map((section) => section.index === 4
        ? <StageInterpretationSection key={section.index} section={section} />
        : <PrimarySection key={section.index} section={section} />)}

      {detailSections.length > 0 && (
        <Accordion type="single" collapsible className="mt-3 border-2 border-dashed border-ink/15 px-4">
          <AccordionItem value="details" className="border-0">
            <AccordionTrigger className="font-marker text-base font-bold no-underline hover:no-underline">
              查看升学或阶段目标影响
            </AccordionTrigger>
            <AccordionContent className="space-y-5">
              {detailSections.map((section) => (
                <section key={section.index}>
                  <h3 className="font-marker mb-2 text-base font-bold">{section.title}</h3>
                  <div className="font-hand text-sm leading-6">
                    <Streamdown>{section.content}</Streamdown>
                  </div>
                </section>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
};

export { parseReportSections, parseStageSubsections, parseSubjectBlocks };
export default DiagnosisReportView;
