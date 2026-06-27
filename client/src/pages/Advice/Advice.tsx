import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, MessageCircleMore } from 'lucide-react';
import { toast } from 'sonner';
import WobblyCard from '@client/src/components/WobblyCard';
import { Button } from '@/components/ui/button';
import { useRequiredStage } from '@client/src/hooks/use-stage';
import { useStageProfile } from '@client/src/hooks/use-stage-profile';
import { stagePath } from '@client/src/config/stages';
import { loadModuleSession } from '@client/src/utils/module-session';
import { getInternalScriptAnchor } from '@client/src/config/internal-resource-library';

interface DiagnosisSessionState {
  reportContent: string;
  majorInfoContent: string;
}

interface PlanSessionState {
  reportContent: string;
  timelineContent: string;
}

interface StudyPlanSessionState {
  report: string;
}

interface KnowledgeSessionState {
  subject: string;
  selectedChapter: string;
  keyword: string;
}

function pickKeySentences(text: string, limit: number): string[] {
  if (!text.trim()) return [];
  const pieces = text
    .replace(/\s+/g, ' ')
    .split(/[。！？!?；;]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 8);
  return pieces.slice(0, limit);
}

function buildAdviceLines(input: {
  stageSlug: 'elementary' | 'middle' | 'high';
  stageLabel: string;
  targetSchool: string;
  targetMajor: string;
  weakSubjects: string;
  diagnosisSummary: string[];
  planSummary: string[];
  studyPlanSummary: string[];
  knowledgeSummary: string[];
}): string[] {
  const {
    stageSlug,
    stageLabel,
    targetSchool,
    targetMajor,
    weakSubjects,
    diagnosisSummary,
    planSummary,
    studyPlanSummary,
    knowledgeSummary,
  } = input;
  const internalAnchor = getInternalScriptAnchor(stageSlug, 'advice');
  const weakText = weakSubjects || '当前薄弱科目';
  const targetText = [targetSchool, targetMajor].filter(Boolean).join(' / ');

  const openLine = targetText
    ? `我先和你确认目标：我们现在以「${targetText}」为方向，今天先把最关键的一步走稳。`
    : `我们先不追求一步到位，先把这周最关键的一步走稳。`;

  const diagnosisLine = diagnosisSummary[0]
    ? `从最近诊断看，核心问题是：${diagnosisSummary[0]}。`
    : `从最近诊断看，先聚焦${weakText}，把短板变成可控项。`;

  const planLine = planSummary[0]
    ? `升学规划给出的关键结论是：${planSummary[0]}。`
    : `升学规划上，先盯“目标差距 + 关键时间点”，其他信息先不展开。`;

  const studyLine = studyPlanSummary[0]
    ? `执行上就按这条做：${studyPlanSummary[0]}。`
    : '执行上我们只抓一件事：每天固定时段做错题回炉并复盘。';

  const knowledgeLine = knowledgeSummary[0]
    ? `知识点上，优先补：${knowledgeSummary[0]}。`
    : '知识点上，先补当前章节的前置知识，再做同类题巩固。';

  return [
    `【内部话术锚点】${internalAnchor}`,
    `【${stageLabel}沟通开场】${openLine}`,
    `【现状说明】${diagnosisLine}`,
    `【目标聚焦】${planLine}`,
    `【本周执行】${studyLine}`,
    `【知识点补强】${knowledgeLine}`,
    '【收尾共识】我们只看本周是否完成，不纠结一次考试波动；周末一起复盘并微调下周计划。',
  ];
}

const Advice: React.FC = () => {
  const { stageSlug, stageConfig } = useRequiredStage();
  const { profile } = useStageProfile(stageSlug);

  const diagnosisSession = loadModuleSession<DiagnosisSessionState>(stageSlug, 'diagnosis');
  const planSession = loadModuleSession<PlanSessionState>(stageSlug, 'plan');
  const studyPlanSession = loadModuleSession<StudyPlanSessionState>(stageSlug, 'study-plan');
  const knowledgeSession = loadModuleSession<KnowledgeSessionState>(stageSlug, 'knowledge');

  const diagnosisSummary = useMemo(
    () => pickKeySentences(diagnosisSession?.reportContent || '', 2),
    [diagnosisSession?.reportContent],
  );
  const planSummary = useMemo(
    () => pickKeySentences(planSession?.reportContent || '', 2),
    [planSession?.reportContent],
  );
  const studyPlanSummary = useMemo(
    () => pickKeySentences(studyPlanSession?.report || '', 2),
    [studyPlanSession?.report],
  );
  const knowledgeSummary = useMemo(() => {
    const lines: string[] = [];
    if (knowledgeSession?.subject && knowledgeSession.subject !== '__all__') {
      lines.push(`${knowledgeSession.subject} 学科`);
    }
    if (knowledgeSession?.selectedChapter) lines.push(knowledgeSession.selectedChapter);
    if (knowledgeSession?.keyword) lines.push(`关键词：${knowledgeSession.keyword}`);
    return lines;
  }, [knowledgeSession?.subject, knowledgeSession?.selectedChapter, knowledgeSession?.keyword]);

  const adviceLines = useMemo(
    () =>
      buildAdviceLines({
        stageSlug,
        stageLabel: stageConfig.label,
        targetSchool: profile.targetSchool,
        targetMajor: profile.targetMajor,
        weakSubjects: profile.weakSubjects,
        diagnosisSummary,
        planSummary,
        studyPlanSummary,
        knowledgeSummary,
      }),
    [
      stageConfig.label,
      profile.targetSchool,
      profile.targetMajor,
      profile.weakSubjects,
      diagnosisSummary,
      planSummary,
      studyPlanSummary,
      knowledgeSummary,
    ],
  );

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(adviceLines.join('\n'));
      toast.success('建议话术已复制');
    } catch {
      toast.error('复制失败，请重试');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="font-hand mb-2 -ml-2" asChild>
          <Link to={stagePath(stageSlug)}>
            <ArrowLeft className="mr-1 size-4" />
            返回{stageConfig.label}主页
          </Link>
        </Button>
        <h1 className="font-marker text-2xl font-bold">{stageConfig.label} · 建议话术</h1>
        <p className="font-hand mt-1 text-sm text-muted-foreground">
          自动关联学情诊断、升学规划、知识点查询、个性化学习规划四个模块结果，生成可直接沟通的话术。
        </p>
      </div>

      <WobblyCard variant="yellow" decoration="tack" wobblyIndex={0} hoverable={false} className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircleMore className="size-5 text-marker-red" />
            <h2 className="font-marker text-xl font-bold">综合建议话术</h2>
          </div>
          <Button variant="outline" onClick={copyAll}>
            <Copy className="mr-1 size-4" />
            复制全部
          </Button>
        </div>
        <div className="space-y-2">
          {adviceLines.map((line, idx) => (
            <p key={idx} className="font-hand rounded-md border border-ink/20 bg-white/70 px-3 py-2 text-sm">
              {line}
            </p>
          ))}
        </div>
      </WobblyCard>

      <WobblyCard variant="white" decoration="tape" wobblyIndex={1} hoverable={false} className="p-5">
        <h3 className="font-marker mb-3 text-lg font-bold">关联来源检查</h3>
        <div className="grid gap-2 md:grid-cols-2">
          <p className="font-hand text-sm">学情诊断：{diagnosisSession?.reportContent ? '已关联' : '未找到报告，先去生成'}</p>
          <p className="font-hand text-sm">升学规划：{planSession?.reportContent ? '已关联' : '未找到报告，先去生成'}</p>
          <p className="font-hand text-sm">学习规划：{studyPlanSession?.report ? '已关联' : '未找到报告，先去生成'}</p>
          <p className="font-hand text-sm">
            知识点查询：{knowledgeSummary.length > 0 ? `已关联（${knowledgeSummary.join(' / ')}）` : '未找到最近筛选记录'}
          </p>
        </div>
      </WobblyCard>
    </div>
  );
};

export default Advice;
