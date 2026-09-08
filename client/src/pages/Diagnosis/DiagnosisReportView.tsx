import React, { useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckSquare2,
  Copy,
  Eye,
  GitBranch,
  MessageSquareQuote,
  PackageCheck,
  PhoneCall,
  Sparkles,
  Table2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { StageSlug } from '@client/src/config/stages';
import { Streamdown } from '@client/src/components/ui/streamdown';
import { copyText } from '@client/src/utils/clipboard';
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
  supplementalInfo?: string;
  view?: 'all' | 'diagnosis' | 'onion' | 'phone' | 'wechat';
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
  const Icon = section.title.includes('话术')
    ? MessageSquareQuote
    : section.title.includes('洋葱')
      ? PackageCheck
      : section.title.includes('动作')
        ? CheckSquare2
        : section.title.includes('风险') || section.title.includes('危机')
          ? AlertCircle
          : SECTION_ICONS[section.index] || Sparkles;
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

const RiskSection: React.FC<{ section: ReportSection }> = ({ section }) => {
  const risks = parseSubjectSections(section.content);
  if (risks.length === 0) return <GenericSection section={section} />;

  return (
    <section className="border-b-2 border-dashed border-ink/15 py-5">
      <SectionHeading section={section} />
      <div className="grid gap-3 lg:grid-cols-2">
        {risks.map((risk) => (
          <article key={risk.title} className="border-2 border-ink bg-white p-4 shadow-hard-sm">
            <h4 className="font-marker mb-3 flex items-center gap-2 font-bold text-marker-red">
              <CalendarDays className="size-4" />
              {risk.title}
            </h4>
            <ProblemFields content={risk.content} />
          </article>
        ))}
      </div>
    </section>
  );
};

const StructuredBusinessSection: React.FC<{
  section: ReportSection;
  tone?: 'warning' | 'info';
}> = ({ section, tone = 'info' }) => {
  const isGradeNineWarning = /初三中考节点预警|中考备考(?:正式)?启动/u.test(section.content);
  return (
    <section className="border-b-2 border-dashed border-ink/15 py-5">
      <SectionHeading section={section} />
      {isGradeNineWarning && (
        <div className="font-marker mb-3 inline-flex items-center gap-2 border-2 border-marker-red bg-marker-red/5 px-3 py-2 font-bold text-marker-red shadow-hard-sm">
          <CalendarDays className="size-4" />
          初三中考节点预警
        </div>
      )}
      <article className={`border-2 border-ink p-4 shadow-hard-sm ${tone === 'warning' ? 'bg-marker-red/5' : 'bg-white'}`}>
        <ProblemFields content={section.content} />
      </article>
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

const SupportFollowupPanel: React.FC<{
  section?: ReportSection;
  required?: boolean;
}> = ({ section, required = false }) => {
  if (!section?.content.trim()) {
    return required ? <MissingRequiredSection title="专属学习规划与助教跟进方案" /> : null;
  }
  return (
    <article className="mt-4 border-2 border-pen-blue bg-pen-blue/5 p-4 shadow-hard-sm">
      <div className="mb-3 flex items-center gap-2">
        <CheckSquare2 className="size-5 text-pen-blue" />
        <div>
          <h4 className="font-marker font-bold">专属学习规划与助教跟进方案</h4>
          <p className="font-hand text-xs text-ink/60">
            顾问定方向，助教落到每天，按完成与测评反馈持续调整
          </p>
        </div>
      </div>
      <div className="font-hand overflow-x-auto text-sm leading-6">
        <Streamdown>{section.content}</Streamdown>
      </div>
      <div className="font-marker mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-ink/70">
        {['诊断', '规划', '学习', '练习', '反馈', '调整'].map((step, index) => (
          <React.Fragment key={step}>
            <span className="border-2 border-ink bg-white px-2 py-1">{step}</span>
            {index < 5 && <span aria-hidden="true">→</span>}
          </React.Fragment>
        ))}
      </div>
    </article>
  );
};

const ActionPlanSection: React.FC<{ section: ReportSection }> = ({ section }) => {
  const periods = parseNumberedSubsections(section.content, section.index);
  const supportPlan = periods.find((period) => (
    period.index === 4 || period.title.includes('助教跟进')
  ));
  const cadencePeriods = periods.filter((period) => period !== supportPlan);
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
      <p className="font-hand mb-3 text-sm text-ink/60">
        顶部总结已包含未来 7 天的核心动作；月度节奏和学期目标可在这里按需展开。
      </p>
      <Accordion type="single" collapsible>
        <AccordionItem value="action-details" className="border-2 border-ink bg-white px-4 shadow-hard-sm">
          <AccordionTrigger className="font-marker font-bold no-underline hover:no-underline">
            查看具体执行方案
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Tabs value={activePeriod} onValueChange={setActivePeriod}>
              <TabsList className="mb-4 grid h-auto w-full grid-cols-3 border-2 border-ink bg-accent p-1">
                {cadencePeriods.map((period) => (
                  <TabsTrigger key={period.index} value={String(period.index)} className="font-marker py-2">
                    {periodLabels[period.index] || period.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              {cadencePeriods.map((period) => (
                <TabsContent key={period.index} value={String(period.index)} className="mt-0 border-2 border-dashed border-ink/20 bg-white p-4">
                  <div className="font-hand overflow-x-auto text-sm leading-6">
                    <Streamdown>{period.content}</Streamdown>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <SupportFollowupPanel
        section={supportPlan}
        required={section.title.includes('洋葱执行计划')}
      />
    </section>
  );
};

function cleanScriptText(content: string): string {
  return content
    .replace(/^\s*[-*>#]+\s*/gmu, '')
    .replace(/\*\*/gu, '')
    .replace(/__+/gu, '')
    .trim();
}

interface ConsultantSummaryParts {
  summary: string;
  concernAnalysis: string;
}

function splitConsultantSummary(content: string): ConsultantSummaryParts {
  const heading = /^###\s*1[.、．]1\s*家长补充信息切入分析\s*$/mu;
  const match = heading.exec(content);
  if (!match || match.index == null) {
    return { summary: content.trim(), concernAnalysis: '' };
  }
  return {
    summary: content.slice(0, match.index).trim(),
    concernAnalysis: content.slice(match.index + match[0].length).trim(),
  };
}

const SupplementalInsightCard: React.FC<{
  supplementalInfo: string;
  analysis: string;
}> = ({ supplementalInfo, analysis }) => (
  <section className="border-b-2 border-dashed border-ink/15 bg-white px-4 py-5">
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <span className="font-marker border-2 border-marker-red bg-marker-red/5 px-3 py-1 text-sm font-bold text-marker-red">
        家长一手信息
      </span>
      <p className="font-hand min-w-0 flex-1 text-sm font-bold leading-6">{supplementalInfo}</p>
    </div>
    <h3 className="font-marker mb-3 text-lg font-bold">家长补充信息切入分析</h3>
    {analysis ? (
      <article className="border-2 border-ink bg-accent/25 p-4 shadow-hard-sm">
        <ProblemFields content={analysis} />
      </article>
    ) : (
      <article className="border-2 border-dashed border-marker-red/50 bg-marker-red/5 p-4">
        <p className="font-hand text-sm leading-6">
          本次 AI 未返回独立切入分析，但补充信息已保留。建议重新生成，系统会围绕这条信息补全成因、突破口与家长沟通边界。
        </p>
      </article>
    )}
  </section>
);

const ConsultantSummarySection: React.FC<{
  section: ReportSection;
  supplementalInfo?: string;
}> = ({ section, supplementalInfo }) => {
  const parts = splitConsultantSummary(section.content);
  const [copied, setCopied] = useState(false);
  const handleCopy = async (): Promise<void> => {
    const result = await copyText(cleanScriptText(parts.summary));
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setCopied(true);
    toast.success('已复制诊断总结话术');
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <>
      <section className="border-b-2 border-dashed border-ink/15 bg-postit-yellow/55 px-4 py-5 first:pt-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center border-2 border-ink bg-white shadow-hard-sm">
            <MessageSquareQuote className="size-4 text-pen-blue" />
          </span>
          <h3 className="font-marker text-lg font-bold">{section.title}</h3>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="font-marker flex min-h-10 items-center gap-2 border-2 border-ink bg-white px-3 font-bold shadow-hard-sm transition-transform hover:-translate-y-0.5"
        >
          {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
          {copied ? '已复制' : '复制总结话术'}
        </button>
      </div>
      <p className="font-hand mb-3 text-xs font-bold text-marker-red">结论先行 · 顾问可直接照读</p>
        <div className="font-hand text-lg font-bold leading-8">
          <Streamdown>{parts.summary}</Streamdown>
        </div>
      </section>
      {supplementalInfo?.trim() && (
        <SupplementalInsightCard
          supplementalInfo={supplementalInfo.trim()}
          analysis={parts.concernAnalysis}
        />
      )}
    </>
  );
};

const CopyableScriptCard: React.FC<{
  title: string;
  content: string;
  featured?: boolean;
}> = ({ title, content, featured = false }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (): Promise<void> => {
    const result = await copyText(cleanScriptText(content));
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setCopied(true);
    toast.success(`已复制${title}`);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <article className={`border-2 border-ink p-4 shadow-hard-sm ${featured ? 'bg-postit-yellow/40' : 'bg-white'}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h4 className="font-marker font-bold">{title}</h4>
        <button
          type="button"
          onClick={handleCopy}
          className="flex size-8 shrink-0 items-center justify-center border-2 border-ink bg-white shadow-hard-sm transition-transform hover:-translate-y-0.5"
          title={`复制${title}`}
          aria-label={`复制${title}`}
        >
          {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
        </button>
      </div>
      <div className="font-hand text-sm leading-6"><Streamdown>{content}</Streamdown></div>
    </article>
  );
};

const MissingRequiredSection: React.FC<{ title: string }> = ({ title }) => (
  <section className="my-4 border-2 border-dashed border-marker-red/50 bg-marker-red/5 p-4">
    <h3 className="font-marker flex items-center gap-2 font-bold">
      <AlertCircle className="size-4 text-marker-red" />
      {title}
    </h3>
    <p className="font-hand mt-2 text-sm leading-6">
      本次 AI 返回内容未包含该章节。请重新生成报告；页面已保留入口，不会再静默隐藏。
    </p>
  </section>
);

const OnionDualPathIntro: React.FC = () => (
  <section className="my-4 border-y-2 border-dashed border-ink/20 bg-postit-yellow/25 px-4 py-4">
    <div className="mb-3 flex items-center gap-2">
      <PackageCheck className="size-5 text-marker-red" />
      <h3 className="font-marker text-lg font-bold">同步打底 + 分层培优</h3>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="border-l-4 border-pen-blue pl-3">
        <p className="font-marker font-bold">同步打底：先解决听懂和跟上</p>
        <p className="font-hand mt-1 text-sm leading-6 text-ink/75">
          按学校真实进度补概念和前置断点，用基础题确认孩子能独立完成，再进入题型训练。
        </p>
      </div>
      <div className="border-l-4 border-marker-red pl-3">
        <p className="font-marker font-bold">分层培优：再解决会用和得分</p>
        <p className="font-hand mt-1 text-sm leading-6 text-ink/75">
          每个分数段都有适配层级，从基础题型、常考点和步骤得分，逐步升级到变式、应试策略与综合迁移。
        </p>
      </div>
    </div>
  </section>
);

const AdvisorScriptSection: React.FC<{ section?: ReportSection }> = ({ section }) => {
  if (!section) return <MissingRequiredSection title="课程顾问可复制话术" />;
  const scripts = parseNumberedSubsections(section.content, section.index);
  if (scripts.length === 0) return <GenericSection section={section} />;

  const isBusinessScripts = section.index === 7
    && (section.title.includes('可复制') || scripts.length > 2);
  if (isBusinessScripts) {
    return (
      <section className="border-b-2 border-dashed border-ink/15 py-5">
        <SectionHeading section={section} />
        <p className="font-hand mb-3 text-sm text-ink/60">每条都可单独复制，按沟通进度选择使用。</p>
        <div className="grid gap-3 lg:grid-cols-2">
          {scripts.map((script) => (
            <CopyableScriptCard
              key={script.index}
              title={script.title}
              content={script.content}
              featured={script.index === 1 || script.index === 6}
            />
          ))}
        </div>
      </section>
    );
  }

  const shortScript = scripts.find((script) => script.index === 1)
    || scripts.find((script) => script.title.includes('30秒'));
  const fullScript = scripts.find((script) => script.index === 2)
    || scripts.find((script) => script.title.includes('2分钟'));

  return (
    <section className="border-b-2 border-dashed border-ink/15 py-5">
      <SectionHeading section={section} />
      {shortScript ? (
        <CopyableScriptCard title="30 秒短版" content={shortScript.content} featured />
      ) : (
        <p className="font-hand border-l-4 border-marker-red bg-marker-red/5 p-3 text-sm">
          本次未识别到 30 秒话术，请重新生成报告。
        </p>
      )}
      {fullScript && (
        <Accordion type="single" collapsible className="mt-3">
          <AccordionItem value="full-script" className="border-2 border-dashed border-ink/20 bg-white px-4">
            <AccordionTrigger className="font-marker font-bold no-underline hover:no-underline">
              查看 2 分钟完整版话术
            </AccordionTrigger>
            <AccordionContent>
              <div className="font-hand pt-2 text-sm leading-6"><Streamdown>{fullScript.content}</Streamdown></div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </section>
  );
};

const MaterialSuggestions: React.FC<{
  material?: { title: string; content: string };
  required?: boolean;
}> = ({ material, required = false }) => {
  if (!material?.content.trim()) {
    return required ? <MissingRequiredSection title="可搭配素材" /> : null;
  }
  return (
    <section className="mt-4 border-2 border-dashed border-marker-red/55 bg-postit-yellow/35 p-4">
      <div className="mb-2 flex items-center gap-2">
        <PackageCheck className="size-4 text-marker-red" />
        <h4 className="font-marker font-bold">可搭配素材</h4>
      </div>
      <p className="font-hand mb-2 text-xs text-ink/60">
        按当前沟通进度选择，涉及价格、名额或报名政策时请先核实当期口径。
      </p>
      <div className="font-hand text-sm leading-6">
        <Streamdown>{material.content}</Streamdown>
      </div>
    </section>
  );
};

const OnionAndScriptsSection: React.FC<{ section?: ReportSection }> = ({ section }) => {
  if (!section) return <MissingRequiredSection title="洋葱学园承接方案 + 可复制话术" />;
  const subsections = parseNumberedSubsections(section.content, section.index);
  if (subsections.length === 0) return <GenericSection section={section} />;
  const onion = subsections.find((item) => item.index === 1);
  const scripts = subsections.filter((item) => item.index > 1 && item.index < 7);
  const material = subsections.find((item) => item.index === 7 || item.title.includes('搭配素材'));

  return (
    <section className="border-b-2 border-dashed border-ink/15 py-5">
      <SectionHeading section={section} />
      {onion ? (
        <article className="mb-4 border-2 border-marker-red/40 bg-marker-red/5 p-4 shadow-hard-sm">
          <h4 className="font-marker mb-3 flex items-center gap-2 font-bold">
            <PackageCheck className="size-4 text-marker-red" />
            洋葱学园承接方案
          </h4>
          <div className="font-hand overflow-x-auto text-sm leading-6">
            <Streamdown>{onion.content}</Streamdown>
          </div>
        </article>
      ) : (
        <MissingRequiredSection title="洋葱学园承接方案" />
      )}
      {scripts.length > 0 ? (
        <>
          <p className="font-hand mb-3 text-sm text-ink/60">以下话术可按沟通进度单独复制使用。</p>
          <div className="grid gap-3 lg:grid-cols-2">
            {scripts.map((script) => (
              <CopyableScriptCard
                key={script.index}
                title={script.title}
                content={script.content}
                featured={script.index === 2 || script.index === 4}
              />
            ))}
          </div>
        </>
      ) : (
        <MissingRequiredSection title="课程顾问可复制话术" />
      )}
      <MaterialSuggestions material={material} required={section.title.includes('可复制话术')} />
    </section>
  );
};

const PhoneScriptSequence: React.FC<{
  scriptSection?: ReportSection;
  onionSection?: ReportSection;
  actionSection?: ReportSection;
}> = ({ scriptSection, onionSection, actionSection }) => {
  const scriptSubsections = scriptSection
    ? parseNumberedSubsections(scriptSection.content, scriptSection.index)
    : [];
  const combinedOnion = scriptSubsections.find((item) => (
    item.index === 1 && item.title.includes('洋葱')
  ));
  const scripts = (combinedOnion
    ? scriptSubsections.filter((item) => item.index > 1)
    : scriptSubsections)
    .filter((item) => item.index < 7 && !item.title.includes('搭配素材'));
  const material = scriptSubsections.find((item) => (
    item.index === 7 || item.title.includes('搭配素材')
  ));
  const onionContent = combinedOnion?.content || onionSection?.content || '';
  const supportPlan = actionSection
    ? parseNumberedSubsections(actionSection.content, actionSection.index)
      .find((item) => item.index === 4 || item.title.includes('助教跟进'))
    : undefined;

  return (
    <section className="border-b-2 border-dashed border-ink/15 py-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center border-2 border-ink bg-white shadow-hard-sm">
          <PhoneCall className="size-4 text-marker-red" />
        </span>
        <div>
          <h3 className="font-marker text-lg font-bold">电话沟通 5 步</h3>
          <p className="font-hand text-xs text-ink/60">按顺序照读，也可以按沟通进度单独复制</p>
        </div>
      </div>
      {scripts.length > 0 ? (
        <div className="space-y-3">
          {scripts.map((script, position) => (
            <div key={`${script.index}-${script.title}`} className="grid gap-3 sm:grid-cols-[48px_1fr]">
              <span className="font-marker flex size-10 items-center justify-center border-2 border-ink bg-marker-red text-lg font-bold text-white shadow-hard-sm">
                {position + 1}
              </span>
              <CopyableScriptCard
                title={script.title.replace(/话术$/u, '')}
                content={script.content}
                featured={position === 0 || position === scripts.length - 1}
              />
            </div>
          ))}
        </div>
      ) : (
        <MissingRequiredSection title="电话沟通五步话术" />
      )}
      {onionContent && (
        <Accordion type="single" collapsible className="mt-4">
          <AccordionItem value="phone-onion-basis" className="border-2 border-ink bg-white px-4 shadow-hard-sm">
            <AccordionTrigger className="font-marker font-bold no-underline hover:no-underline">
              查看话术背后的洋葱学习路径
            </AccordionTrigger>
            <AccordionContent>
              <div className="font-hand overflow-x-auto pt-2 text-sm leading-6">
                <Streamdown>{onionContent}</Streamdown>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
      <SupportFollowupPanel
        section={supportPlan}
        required={Boolean(actionSection?.title.includes('洋葱执行计划'))}
      />
      <MaterialSuggestions
        material={material}
        required={Boolean(scriptSection?.title.includes('可复制话术'))}
      />
    </section>
  );
};

const WechatMatrixSection: React.FC<{
  section?: ReportSection;
  title: string;
}> = ({ section, title }) => {
  if (!section) return <MissingRequiredSection title={title} />;
  const subjects = parseSubjectSections(section.content);
  return (
    <section className="border-b-2 border-dashed border-ink/15 py-5">
      <div className="mb-3 flex items-center gap-2">
        <Table2 className="size-5 text-pen-blue" />
        <h3 className="font-marker text-lg font-bold">{title}</h3>
      </div>
      {subjects.length > 0 ? (
        <div className="overflow-x-auto border-2 border-ink bg-white shadow-hard-sm">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead className="bg-postit-yellow/55">
              <tr>
                <th className="font-marker w-32 border-b-2 border-r-2 border-ink p-3">科目</th>
                <th className="font-marker border-b-2 border-ink p-3">家长可直接查看的结论</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => (
                <tr key={subject.title} className="align-top even:bg-accent/20">
                  <th className="font-marker border-r-2 border-t border-ink/20 p-3 font-bold text-pen-blue">
                    {subject.title}
                  </th>
                  <td className="font-hand border-t border-ink/20 p-3 text-sm leading-6">
                    <Streamdown>{subject.content}</Streamdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <article className="border-2 border-ink bg-white p-4 shadow-hard-sm">
          <div className="font-hand text-sm leading-6"><Streamdown>{section.content}</Streamdown></div>
        </article>
      )}
    </section>
  );
};

const WechatPlanSection: React.FC<{
  actionSection?: ReportSection;
  onionSection?: ReportSection;
}> = ({ actionSection, onionSection }) => {
  const onionSubsections = onionSection
    ? parseNumberedSubsections(onionSection.content, onionSection.index)
    : [];
  const onionPlan = onionSubsections.find((item) => item.index === 1 && item.title.includes('洋葱'));
  const material = onionSubsections.find((item) => (
    item.index === 7 || item.title.includes('搭配素材')
  ));
  return (
    <>
      {actionSection
        ? <ActionPlanSection section={actionSection} />
        : <MissingRequiredSection title="微信跟进行动表" />}
      <section className="border-b-2 border-dashed border-ink/15 py-5">
        <div className="mb-3 flex items-center gap-2">
          <PackageCheck className="size-5 text-marker-red" />
          <h3 className="font-marker text-lg font-bold">洋葱学习路径表</h3>
        </div>
        <article className="border-2 border-ink bg-white p-4 shadow-hard-sm">
          <div className="font-hand overflow-x-auto text-sm leading-6">
            <Streamdown>{onionPlan?.content || onionSection?.content || '本次未生成洋葱学习路径，请重新生成。'}</Streamdown>
          </div>
        </article>
      </section>
      <MaterialSuggestions
        material={material}
        required={Boolean(onionSection?.title.includes('可复制话术'))}
      />
    </>
  );
};

const DetailSection: React.FC<{
  section: ReportSection;
  children: React.ReactNode;
}> = ({ section, children }) => (
  <ErrorBoundary fallbackRender={() => <GenericSection section={section} />}>
    {children}
  </ErrorBoundary>
);

const DiagnosisReportView: React.FC<DiagnosisReportViewProps> = ({
  content,
  stageSlug,
  grade,
  semester,
  filledSubjects = [],
  supplementalInfo,
  view = 'all',
}) => {
  const sections = useMemo(() => parseReportSections(content), [content]);
  const byIndex = useMemo(() => new Map(sections.map((section) => [section.index, section])), [sections]);
  const layout = useMemo(() => resolveReportSectionLayout(sections), [sections]);

  if (sections.length === 0) {
    return (
      <div className="bg-white/70 p-4">
        <div className="font-hand prose-headings:font-marker"><Streamdown>{content}</Streamdown></div>
        <MissingRequiredSection title="洋葱学园承接方案" />
        <MissingRequiredSection title="课程顾问转述话术" />
      </div>
    );
  }

  const sectionOneForExperience = byIndex.get(1);
  const sectionTwoForExperience = byIndex.get(2);
  const sectionThreeForExperience = byIndex.get(3);
  const sectionFourForExperience = byIndex.get(4);
  const sectionFiveForExperience = byIndex.get(5);
  const sectionSixForExperience = byIndex.get(6);
  const sectionSevenForExperience = byIndex.get(7);
  const sectionEightForExperience = byIndex.get(8);
  const hasCombinedOnionAndScripts = Boolean(
    sectionSevenForExperience?.title.includes('+')
    || sectionSevenForExperience?.content.includes('### 7.1 洋葱'),
  );
  const experienceActionSection = sectionSixForExperience?.title.includes('行动')
    || sectionSixForExperience?.title.includes('执行')
    ? sectionSixForExperience
    : sectionFiveForExperience?.title.includes('动作')
      ? sectionFiveForExperience
      : undefined;
  const experienceOnionSection = hasCombinedOnionAndScripts
    ? sectionSevenForExperience
    : sectionSevenForExperience?.title.includes('洋葱')
      ? sectionSevenForExperience
      : sectionSixForExperience?.title.includes('洋葱')
        ? sectionSixForExperience
        : undefined;
  const experienceScriptSection = hasCombinedOnionAndScripts
    ? sectionSevenForExperience
    : sectionEightForExperience
      || (sectionSevenForExperience?.title.includes('话术') ? sectionSevenForExperience : undefined);

  if (view === 'phone') {
    const evidenceSections = Array.from(
      new Map(
        [
          sectionTwoForExperience,
          sectionThreeForExperience,
          sectionFourForExperience,
          sectionFiveForExperience,
          experienceActionSection,
        ]
          .filter((section): section is ReportSection => Boolean(section))
          .map((section) => [`${section.index}-${section.title}`, section]),
      ).values(),
    );
    return (
      <div className="bg-white/70 px-4 py-2">
        {sectionOneForExperience ? (
          <ConsultantSummarySection
            section={sectionOneForExperience}
            supplementalInfo={supplementalInfo}
          />
        ) : (
          <MissingRequiredSection title="顾问先讲：诊断总结" />
        )}
        <PhoneScriptSequence
          scriptSection={experienceScriptSection}
          onionSection={experienceOnionSection}
          actionSection={experienceActionSection}
        />
        {evidenceSections.length > 0 && (
          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="phone-evidence" className="border-2 border-dashed border-ink/25 bg-white px-4">
              <AccordionTrigger className="font-marker font-bold no-underline hover:no-underline">
                查看专业诊断依据与具体执行表
              </AccordionTrigger>
              <AccordionContent>
                {evidenceSections.map((section) => (
                  <GenericSection key={`${section.index}-${section.title}`} section={section} />
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    );
  }

  if (view === 'wechat') {
    return (
      <div className="bg-white/70 px-4 py-2">
        {sectionOneForExperience && (
          <GenericSection section={sectionOneForExperience} highlighted />
        )}
        <WechatMatrixSection section={sectionTwoForExperience} title="孩子目前的具体表现" />
        <WechatMatrixSection section={sectionThreeForExperience} title="问题、根因与验证方法" />
        <div className="grid gap-4 lg:grid-cols-2">
          {sectionFourForExperience && (
            <StructuredBusinessSection section={sectionFourForExperience} />
          )}
          {sectionFiveForExperience && sectionFiveForExperience !== experienceActionSection && (
            <StructuredBusinessSection section={sectionFiveForExperience} tone="warning" />
          )}
        </div>
        <WechatPlanSection
          actionSection={experienceActionSection}
          onionSection={experienceOnionSection}
        />
      </div>
    );
  }

  if (layout.version === 'business-seven') {
    const sectionOne = byIndex.get(1);
    const sectionTwo = byIndex.get(2);
    const sectionThree = byIndex.get(3);
    const sectionFour = byIndex.get(4);
    const sectionFive = byIndex.get(5);
    const sectionSix = byIndex.get(6);
    const sectionSeven = byIndex.get(7);
    const isQuantifiedLayout = Boolean(
      sectionFour?.title.includes('关键节点')
      || sectionFive?.title.includes('量化危机')
      || sectionSeven?.title.includes('洋葱学园承接方案 +'),
    );

    if (isQuantifiedLayout) {
      if (view === 'diagnosis') {
        return (
          <div className="bg-white/70 px-4 py-2">
            {sectionOne && (
              <ConsultantSummarySection
                section={sectionOne}
                supplementalInfo={supplementalInfo}
              />
            )}
            {sectionTwo && <SubjectGroupedSection section={sectionTwo} />}
            {sectionThree && <ProblemsSection section={sectionThree} />}
            {sectionFour && <StructuredBusinessSection section={sectionFour} />}
            {sectionFive && <StructuredBusinessSection section={sectionFive} tone="warning" />}
          </div>
        );
      }
      if (view === 'onion') {
        return (
          <div className="bg-white/70 px-4 py-2">
            <OnionDualPathIntro />
            {sectionSix
              ? <ActionPlanSection section={sectionSix} />
              : <MissingRequiredSection title="洋葱执行计划" />}
            <OnionAndScriptsSection section={sectionSeven} />
          </div>
        );
      }
      return (
        <div className="bg-white/70 px-4 py-2">
          {sectionOne && (
            <ConsultantSummarySection
              section={sectionOne}
              supplementalInfo={supplementalInfo}
            />
          )}
          {sectionTwo && <SubjectGroupedSection section={sectionTwo} />}
          {sectionThree && <ProblemsSection section={sectionThree} />}
          {sectionFour && <StructuredBusinessSection section={sectionFour} />}
          {sectionFive && <StructuredBusinessSection section={sectionFive} tone="warning" />}
          {sectionSix && <ActionPlanSection section={sectionSix} />}
          <OnionAndScriptsSection section={sectionSeven} />
        </div>
      );
    }

    if (view === 'diagnosis') {
      return (
        <div className="bg-white/70 px-4 py-2">
          {sectionOne && (
            <ConsultantSummarySection
              section={sectionOne}
              supplementalInfo={supplementalInfo}
            />
          )}
          {sectionTwo && <SubjectGroupedSection section={sectionTwo} />}
          {sectionThree && <ProblemsSection section={sectionThree} />}
          {sectionFour && <RiskSection section={sectionFour} />}
        </div>
      );
    }
    if (view === 'onion') {
      return (
        <div className="bg-white/70 px-4 py-2">
          <OnionDualPathIntro />
          {sectionFive
            ? <ActionPlanSection section={sectionFive} />
            : <MissingRequiredSection title="洋葱执行计划" />}
          {sectionSix
            ? <GenericSection section={sectionSix} />
            : <MissingRequiredSection title="洋葱学园承接方案" />}
          <AdvisorScriptSection section={sectionSeven} />
        </div>
      );
    }

    return (
      <div className="bg-white/70 px-4 py-2">
        {sectionOne && (
          <ConsultantSummarySection
            section={sectionOne}
            supplementalInfo={supplementalInfo}
          />
        )}
        {sectionTwo && <SubjectGroupedSection section={sectionTwo} />}
        {sectionThree && <ProblemsSection section={sectionThree} />}
        {sectionFour && <RiskSection section={sectionFour} />}
        {sectionFive && <ActionPlanSection section={sectionFive} />}
        {sectionSix
          ? <GenericSection section={sectionSix} />
          : <MissingRequiredSection title="洋葱学园承接方案" />}
        <AdvisorScriptSection section={sectionSeven} />
      </div>
    );
  }

  if (layout.version !== 'current-eight') {
    const primarySections = layout.primaryIndexes
      .map((index) => byIndex.get(index))
      .filter((section): section is ReportSection => Boolean(section));
    const detailSections = layout.detailIndexes
      .map((index) => byIndex.get(index))
      .filter((section): section is ReportSection => Boolean(section));
    const visiblePrimarySections = view === 'all'
      ? primarySections
      : primarySections.filter((section) => (
          view === 'diagnosis' ? section.index <= 5 : section.index >= 6
        ));
    const visibleDetailSections = view === 'all'
      ? detailSections
      : detailSections.filter((section) => (
          view === 'diagnosis' ? section.index <= 5 : section.index >= 6
        ));
    return (
      <div className="bg-white/70 px-4 py-2">
        {visiblePrimarySections.map((section) => <GenericSection key={section.index} section={section} highlighted={section.index === 1} />)}
        {visibleDetailSections.length > 0 && (
          <Accordion type="multiple" className="mt-3 space-y-3">
            {visibleDetailSections.map((section) => (
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

  if (view === 'diagnosis') {
    return (
      <div className="bg-white/70 px-4 py-2">
        {sectionOne && <GenericSection section={sectionOne} highlighted />}
        {sectionTwo && <SubjectGroupedSection section={sectionTwo} />}
        {sectionThree && <ProblemsSection section={sectionThree} />}
        {sectionFour && <GenericSection section={sectionFour} />}
        {sectionFive && <CrossSubjectSection section={sectionFive} />}
      </div>
    );
  }

  if (view === 'onion') {
    return (
      <div className="bg-white/70 px-4 py-2">
        <OnionDualPathIntro />
        {sectionSix
          ? <ActionPlanSection section={sectionSix} />
          : <MissingRequiredSection title="洋葱执行计划" />}
        {sectionSeven
          ? <GenericSection section={sectionSeven} />
          : <MissingRequiredSection title="洋葱学园承接方案" />}
        <AdvisorScriptSection section={sectionEight} />
      </div>
    );
  }

  return (
    <div className="bg-white/70 px-4 py-2">
      {sectionOne && <GenericSection section={sectionOne} highlighted />}
      {sectionTwo && <SubjectGroupedSection section={sectionTwo} />}
      {sectionThree && <ProblemsSection section={sectionThree} />}
      {sectionSix && <ActionPlanSection section={sectionSix} />}
      {sectionSeven
        ? <GenericSection section={sectionSeven} />
        : <MissingRequiredSection title="洋葱学园承接方案" />}
      <AdvisorScriptSection section={sectionEight} />

      {(sectionFour || sectionFive) && (
        <Accordion type="multiple" className="mt-4 space-y-3">
          {sectionFour && (
            <AccordionItem value="section-4" className="border-2 border-dashed border-ink/20 bg-white px-4">
              <AccordionTrigger className="font-marker font-bold no-underline hover:no-underline">
                查看年级学期特点与阶段目标影响
              </AccordionTrigger>
              <AccordionContent>
                <DetailSection section={sectionFour}>
                  {stageSlug && grade ? (
                    <DiagnosisSubjectInsightsPanel
                      stageSlug={stageSlug}
                      grade={grade}
                      semester={semester || ''}
                      filledSubjects={filledSubjects}
                      fallbackContent={sectionFour.content}
                    />
                  ) : <GenericSection section={sectionFour} />}
                </DetailSection>
              </AccordionContent>
            </AccordionItem>
          )}
          {sectionFive && (
            <AccordionItem value="section-5" className="border-2 border-dashed border-ink/20 bg-white px-4">
              <AccordionTrigger className="font-marker font-bold no-underline hover:no-underline">
                查看跨学科影响
              </AccordionTrigger>
              <AccordionContent>
                <DetailSection section={sectionFive}>
                  <CrossSubjectSection section={sectionFive} />
                </DetailSection>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      )}
    </div>
  );
};

export default DiagnosisReportView;
