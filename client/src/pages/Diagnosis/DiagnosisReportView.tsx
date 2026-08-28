import React, { useMemo } from 'react';
import {
  AlertCircle,
  CheckSquare2,
  ChevronRight,
  Eye,
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

const SECTION_ICONS: Record<number, React.FC<{ className?: string }>> = {
  1: Sparkles,
  2: Eye,
  3: AlertCircle,
  5: AlertCircle,
  7: CheckSquare2,
  9: PackageCheck,
  10: MessageSquareQuote,
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
  const primarySections = [1, 2, 3, 5, 7, 9, 10]
    .map((index) => byIndex.get(index))
    .filter((section): section is ReportSection => Boolean(section));
  const detailSections = [4, 6, 8]
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
      {primarySections.map((section) => (
        <PrimarySection key={section.index} section={section} />
      ))}

      {detailSections.length > 0 && (
        <Accordion type="single" collapsible className="mt-3 border-2 border-dashed border-ink/15 px-4">
          <AccordionItem value="details" className="border-0">
            <AccordionTrigger className="font-marker text-base font-bold no-underline hover:no-underline">
              查看年龄学期、升学差距与开学月详情
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

export { parseReportSections };
export default DiagnosisReportView;
