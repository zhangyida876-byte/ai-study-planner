import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckSquare2,
  Eye,
  GitBranch,
  MessageSquareQuote,
  PackageCheck,
  Sparkles,
} from 'lucide-react';
import type { StageSlug } from '@client/src/config/stages';
import { Streamdown } from '@client/src/components/ui/streamdown';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@client/src/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@client/src/components/ui/tabs';
import DiagnosisSubjectInsightsPanel from './DiagnosisSubjectInsightsPanel';
import {
  parseNumberedSubsections,
  parseLabeledFields,
  parseReportSections,
  parseSubjectBlocks,
  parseSubjectSections,
  resolveReportSectionLayout,
  type ReportSection,
} from './diagnosis-report-layout';

interface DiagnosisReportViewProps {
  content: string;
  stageSlug?: StageSlug;
  grade?: string;
  semester?: string;
  filledSubjects?: string[];
}

const SECTION_ICONS: Record<number, React.FC<{ className?: string }>> = {
  1: Sparkles,
  2: Eye,
  3: AlertCircle,
  4: CalendarDays,
  5: GitBranch,
  6: CheckSquare2,
  7: PackageCheck,
  8: MessageSquareQuote,
};

const SectionHeading: React.FC<{ section: ReportSection }> = ({ section }) => {
  const Icon = SECTION_ICONS[section.index] || Sparkles;
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="flex size-8 shrink-0 items-center justify-center border-2 border-ink bg-white shadow-hard-sm">
        <Icon className={`size-4 ${section.index === 3 ? 'text-marker-red' : 'text-pen-blue'}`} />
      </span>
      <h3 className="font-marker text-lg font-bold">{section.title}</h3>
    </div>
  );
};

const GenericSection: React.FC<{ section: ReportSection; highlighted?: boolean }> = ({
  section,
  highlighted = false,
}) => (
  <section
    className={`border-b-2 border-dashed border-ink/15 py-5 first:pt-0 ${highlighted ? 'bg-postit-yellow/45 px-4' : ''}`}
  >
    <SectionHeading section={section} />
    <div className={`font-hand prose-headings:font-marker ${highlighted ? 'text-lg font-bold leading-8' : 'text-sm leading-6'}`}>
      <Streamdown>{section.content}</Streamdown>
    </div>
  </section>
);

const SubjectGroupedSection: React.FC<{ section: ReportSection }> = ({ section }) => {
  const subjects = parseSubjectSections(section.content);
  if (subjects.length === 0) return <GenericSection section={section} />;

  return (
    <section className="border-b-2 border-dashed border-ink/15 py-5">
      <SectionHeading section={section} />
      <div className="grid gap-3 lg:grid-cols-2">
        {subjects.map((subject) => (
          <article key={subject.title} className="border-2 border-dashed border-ink/20 bg-white p-4">
            <h4 className="font-marker mb-2 border-l-4 border-pen-blue pl-2 font-bold">
              {subject.title}
            </h4>
            <div className="font-hand text-sm leading-6">
              <Streamdown>{subject.content}</Streamdown>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

const ProblemFields: React.FC<{ content: string }> = ({ content }) => {
  const fields = parseLabeledFields(content);
  if (fields.length === 0) {
    return <div className="font-hand text-sm leading-6"><Streamdown>{content}</Streamdown></div>;
  }

  return (
    <dl className="space-y-2">
      {fields.map((field) => (
        <div key={field.label} className="grid gap-1 border-b border-dashed border-ink/15 pb-2 last:border-0 sm:grid-cols-[92px_1fr]">
          <dt className="font-marker font-bold text-ink/70">{field.label}</dt>
          <dd className="font-hand text-sm leading-6">{field.value}</dd>
        </div>
      ))}
    </dl>
  );
};

const ProblemsSection: React.FC<{ section: ReportSection }> = ({ section }) => {
  const subjects = parseSubjectSections(section.content);
  if (subjects.length === 0) return <GenericSection section={section} />;

  return (
    <section className="border-b-2 border-dashed border-ink/15 py-5">
      <SectionHeading section={section} />
      <div className="space-y-5">
        {subjects.map((subject) => {
          const problems = parseSubjectBlocks(subject.content);
          return (
            <div key={subject.title}>
              <h4 className="font-marker mb-3 flex items-center gap-2 text-base font-bold">
                <span className="h-5 w-1 bg-marker-red" />
                {subject.title}
              </h4>
              <div className="grid gap-3 xl:grid-cols-2">
                {(problems.length > 0 ? problems : [{ title: '核心问题', content: subject.content }]).map((problem) => (
                  <article key={problem.title} className="border-2 border-ink bg-white p-4 shadow-hard-sm">
                    <h5 className="font-marker mb-3 font-bold text-pen-blue">{problem.title}</h5>
                    <ProblemFields content={problem.content} />
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const CrossSubjectSection: React.FC<{ section: ReportSection }> = ({ section }) => {
  const links = parseSubjectSections(section.content);
  return (
    <section className="border-b-2 border-dashed border-ink/15 py-5">
      <SectionHeading section={section} />
      {links.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {links.map((link) => (
            <article key={link.title} className="border-2 border-dashed border-ink/25 bg-accent/30 p-4">
              <h4 className="font-marker mb-3 font-bold">{link.title}</h4>
              <ProblemFields content={link.content} />
            </article>
          ))}
        </div>
      ) : (
        <div className="font-hand border-2 border-dashed border-ink/20 bg-white p-4 text-sm leading-6">
          <Streamdown>{section.content}</Streamdown>
        </div>
      )}
    </section>
  );
};

const ActionPlanSection: React.FC<{ section: ReportSection }> = ({ section }) => {
  const periods = parseNumberedSubsections(section.content, 6);
  const [activePeriod, setActivePeriod] = useState('1');
  if (periods.length === 0) return <GenericSection section={section} />;

  const periodLabels: Record<number, string> = {
    1: '未来 7 天',
    2: '未来 1 个月',
    3: '当前学期',
  };

  return (
    <section className="border-b-2 border-dashed border-ink/15 py-5">
      <SectionHeading section={section} />
      <Tabs value={activePeriod} onValueChange={setActivePeriod}>
        <TabsList className="mb-4 grid h-auto w-full grid-cols-3 border-2 border-ink bg-accent p-1">
          {periods.map((period) => (
            <TabsTrigger key={period.index} value={String(period.index)} className="font-marker py-2">
              {periodLabels[period.index] || period.title}
            </TabsTrigger>
          ))}
        </TabsList>
        {periods.map((period) => (
          <TabsContent key={period.index} value={String(period.index)} className="mt-0 border-2 border-dashed border-ink/20 bg-white p-4">
            <div className="font-hand overflow-x-auto text-sm leading-6">
              <Streamdown>{period.content}</Streamdown>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
};

const DiagnosisReportView: React.FC<DiagnosisReportViewProps> = ({
  content,
  stageSlug,
  grade,
  semester,
  filledSubjects = [],
}) => {
  const sections = useMemo(() => parseReportSections(content), [content]);
  const byIndex = useMemo(() => new Map(sections.map((section) => [section.index, section])), [sections]);
  const layout = useMemo(() => resolveReportSectionLayout(sections), [sections]);

  if (sections.length === 0) {
    return <div className="font-hand prose-headings:font-marker bg-white/70 p-4"><Streamdown>{content}</Streamdown></div>;
  }

  if (layout.version !== 'current-eight') {
    const primarySections = layout.primaryIndexes
      .map((index) => byIndex.get(index))
      .filter((section): section is ReportSection => Boolean(section));
    const detailSections = layout.detailIndexes
      .map((index) => byIndex.get(index))
      .filter((section): section is ReportSection => Boolean(section));
    return (
      <div className="bg-white/70 px-4 py-2">
        {primarySections.map((section) => <GenericSection key={section.index} section={section} highlighted={section.index === 1} />)}
        {detailSections.length > 0 && (
          <Accordion type="multiple" className="mt-3 space-y-3">
            {detailSections.map((section) => (
              <AccordionItem key={section.index} value={`section-${section.index}`} className="border-2 border-dashed border-ink/15 bg-white/55 px-4">
                <AccordionTrigger className="font-marker text-base font-bold no-underline hover:no-underline">
                  查看{section.title}
                </AccordionTrigger>
                <AccordionContent><GenericSection section={section} /></AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    );
  }

  const sectionOne = byIndex.get(1);
  const sectionTwo = byIndex.get(2);
  const sectionThree = byIndex.get(3);
  const sectionFour = byIndex.get(4);
  const sectionFive = byIndex.get(5);
  const sectionSix = byIndex.get(6);
  const sectionSeven = byIndex.get(7);
  const sectionEight = byIndex.get(8);

  return (
    <div className="bg-white/70 px-4 py-2">
      {sectionOne && <GenericSection section={sectionOne} highlighted />}
      {sectionTwo && <SubjectGroupedSection section={sectionTwo} />}
      {sectionThree && <ProblemsSection section={sectionThree} />}
      {sectionFour && stageSlug && grade ? (
        <DiagnosisSubjectInsightsPanel
          stageSlug={stageSlug}
          grade={grade}
          semester={semester}
          filledSubjects={filledSubjects}
          fallbackContent={sectionFour.content}
        />
      ) : sectionFour ? <GenericSection section={sectionFour} /> : null}
      {sectionFive && <CrossSubjectSection section={sectionFive} />}
      {sectionSix && <ActionPlanSection section={sectionSix} />}

      {(sectionSeven || sectionEight) && (
        <Accordion type="multiple" className="mt-4 space-y-3">
          {sectionSeven && (
            <AccordionItem value="section-7" className="border-2 border-dashed border-ink/20 bg-white px-4">
              <AccordionTrigger className="font-marker font-bold no-underline hover:no-underline">
                查看洋葱学园承接方案
              </AccordionTrigger>
              <AccordionContent><GenericSection section={sectionSeven} /></AccordionContent>
            </AccordionItem>
          )}
          {sectionEight && (
            <AccordionItem value="section-8" className="border-2 border-dashed border-ink/20 bg-white px-4">
              <AccordionTrigger className="font-marker font-bold no-underline hover:no-underline">
                查看课程顾问 30 秒与 2 分钟话术
              </AccordionTrigger>
              <AccordionContent><GenericSection section={sectionEight} /></AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      )}
    </div>
  );
};

export default DiagnosisReportView;
