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
import {
  parseReportSections,
  parseStageSubsections,
  parseSubjectBlocks,
  resolveReportSectionLayout,
  type ReportSection,
} from './diagnosis-report-layout';

interface DiagnosisReportViewProps {
  content: string;
}

const SECTION_ICONS: Record<number, React.FC<{ className?: string }>> = {
  1: Sparkles,
  2: Eye,
  3: AlertCircle,
  4: CalendarDays,
  5: CheckSquare2,
  6: CheckSquare2,
  7: PackageCheck,
  8: MessageSquareQuote,
};

const STAGE_ICONS = [CalendarDays, Brain, BookOpenCheck, GitBranch];

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
          return (
            <div
              key={subsection.index}
              className={`border-2 border-dashed border-ink/20 p-4 ${subsection.index === 1 ? 'bg-postit-yellow/35' : 'bg-white'}`}
            >
              <h4 className="font-marker mb-3 flex items-center gap-2 text-base font-bold">
                <Icon className="size-4 text-pen-blue" />
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
  const layout = useMemo(() => resolveReportSectionLayout(sections), [sections]);
  const primarySections = layout.primaryIndexes
    .map((index) => byIndex.get(index))
    .filter((section): section is ReportSection => Boolean(section));
  const detailSections = layout.detailIndexes
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
      {primarySections.map((section) => <PrimarySection key={section.index} section={section} />)}

      {detailSections.length > 0 && (
        <Accordion type="multiple" className="mt-3 space-y-3">
          {detailSections.map((section) => (
            <AccordionItem
              key={section.index}
              value={`section-${section.index}`}
              className="border-2 border-dashed border-ink/15 bg-white/55 px-4"
            >
              <AccordionTrigger className="font-marker text-base font-bold no-underline hover:no-underline">
                {section.index === 4
                  ? '查看年级学期特点与阶段目标影响'
                  : section.index === 6 && !layout.isLegacy
                    ? '查看洋葱承接方案与完整顾问话术'
                    : `查看${section.title}`}
              </AccordionTrigger>
              <AccordionContent>
                {section.index === 4
                  ? <StageInterpretationSection section={section} />
                  : (
                    <section>
                      <h3 className="font-marker mb-2 text-base font-bold">{section.title}</h3>
                      <div className="font-hand text-sm leading-6">
                        <Streamdown>{section.content}</Streamdown>
                      </div>
                    </section>
                  )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default DiagnosisReportView;
