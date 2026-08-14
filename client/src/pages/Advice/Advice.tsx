import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import WobblyCard from '@client/src/components/WobblyCard';
import ObjectionHandlingPanel from '@client/src/components/ObjectionHandlingPanel';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Streamdown } from '@client/src/components/ui/streamdown';
import { useRequiredStage } from '@client/src/hooks/use-stage';
import { useStageProfile } from '@client/src/hooks/use-stage-profile';
import { stagePath } from '@client/src/config/stages';
import { loadModuleSession } from '@client/src/utils/module-session';
import {
  getInternalMaterialContext,
  getInternalScriptAnchor,
} from '@client/src/config/internal-resource-library';
import { streamDiagnosisReport, streamPolicySearch } from '@client/src/api/plugins';
import { buildPromptTemplate } from '@client/src/utils/advice-engine';

interface DiagnosisSessionState {
  reportContent: string;
}
interface PlanSessionState {
  reportContent: string;
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

const Advice: React.FC = () => {
  const { stageSlug, stageConfig } = useRequiredStage();
  const { profile } = useStageProfile(stageSlug);
  const [customQuery, setCustomQuery] = useState('');
  const [customAnswer, setCustomAnswer] = useState('');
  const [loadingCustom, setLoadingCustom] = useState(false);

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

  const internalAnchor = getInternalScriptAnchor(stageSlug, 'advice');
  const internalMaterial = useMemo(
    () =>
      getInternalMaterialContext({
        stageSlug,
        module: 'advice',
        limit: 14,
      }),
    [stageSlug],
  );
  const moduleContext = useMemo(
    () =>
      [
        diagnosisSummary[0] ? `诊断要点：${diagnosisSummary[0]}` : '',
        planSummary[0] ? `规划要点：${planSummary[0]}` : '',
        studyPlanSummary[0] ? `学习计划要点：${studyPlanSummary[0]}` : '',
        knowledgeSummary.length ? `知识点要点：${knowledgeSummary.join(' / ')}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    [diagnosisSummary, planSummary, studyPlanSummary, knowledgeSummary],
  );

  const fetchInternetContext = useCallback(
    async (query: string): Promise<string> => {
      const region = [profile.province, profile.city, profile.county].filter(Boolean).join(' ') || '全国';
      const nowYear = new Date().getFullYear();
      const years = [String(nowYear), String(nowYear - 1)];
      let merged = '';
      for (const year of years) {
        for await (const chunk of streamPolicySearch({
          region,
          year,
          keyword: query,
        })) {
          merged += `${chunk}\n`;
        }
      }
      return merged.trim().slice(0, 2000);
    },
    [profile.province, profile.city, profile.county],
  );

  const generateAdviceByQuery = useCallback(
    async (input: {
      query: string;
      scene: string;
      baseMaterial: string;
      onChunk: (next: string) => void;
    }) => {
      const internetContext = await fetchInternetContext(
        `${input.query} 洋葱 课程 功能 升学政策`,
      );
      const prompt = buildPromptTemplate({
        scene: input.scene,
        stageLabel: stageConfig.label,
        question: input.query,
        internalMaterial: input.baseMaterial,
        internalAnchor,
        moduleContext:
          `${moduleContext || '暂无模块结果'}\n` +
          `目标：${[profile.targetSchool, profile.targetMajor].filter(Boolean).join(' / ') || '待确认'}\n` +
          `薄弱科目：${profile.weakSubjects || '待确认'}`,
        internetContext,
      });

      let full = '';
      for await (const chunk of streamDiagnosisReport({
        student_grade: profile.grade || stageConfig.grades[stageConfig.grades.length - 1],
        student_region:
          [profile.province, profile.city, profile.county].filter(Boolean).join(' ') || '全国',
        subject_scores: profile.scoresOverview || '语文: 0分',
        learning_problems: prompt,
      })) {
        full += chunk;
        input.onChunk(full);
      }
    },
    [
      fetchInternetContext,
      internalAnchor,
      moduleContext,
      profile.city,
      profile.county,
      profile.grade,
      profile.province,
      profile.scoresOverview,
      profile.targetMajor,
      profile.targetSchool,
      profile.weakSubjects,
      stageConfig.grades,
      stageConfig.label,
    ],
  );

  const handleGenerateCustom = useCallback(async () => {
    if (!customQuery.trim()) {
      toast.error('请先输入自定义问题');
      return;
    }
    setLoadingCustom(true);
    setCustomAnswer('');
    try {
      await generateAdviceByQuery({
        query: customQuery.trim(),
        scene: '自定义问题查询',
        baseMaterial: internalMaterial,
        onChunk: setCustomAnswer,
      });
    } catch {
      toast.error('自定义问题查询失败，请重试');
    } finally {
      setLoadingCustom(false);
    }
  }, [customQuery, generateAdviceByQuery, internalMaterial]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="font-hand mb-2 -ml-2" asChild>
          <Link to={stagePath(stageSlug)}>
            <ArrowLeft className="mr-1 size-4" />
            返回{stageConfig.label}主页
          </Link>
        </Button>
        <h1 className="font-marker text-2xl font-bold">{stageConfig.label} · 话术百宝库</h1>
        <p className="font-hand mt-1 text-sm text-muted-foreground">
          含异议处理随查随打与自定义查询；异议处理与学段主页为同一套能力，两处都能用。
        </p>
      </div>

      <ObjectionHandlingPanel />

      <WobblyCard variant="white" decoration="tape" wobblyIndex={7} hoverable={false} className="p-5">
        <h3 className="font-marker mb-3 text-lg font-bold">自定义问题查询</h3>
        <Textarea
          value={customQuery}
          onChange={(e) => setCustomQuery(e.target.value)}
          placeholder="输入任意你要问的问题，例如：怎么向家长解释AI定制班价值？"
          className="font-hand min-h-[90px]"
        />
        <div className="mt-2">
          <Button onClick={handleGenerateCustom} disabled={loadingCustom}>
            {loadingCustom ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
            查询并生成
          </Button>
        </div>
        <div className="mt-3 rounded-md border border-ink/20 bg-accent/40 p-3 min-h-[140px]">
          {customAnswer ? (
            <Streamdown>{customAnswer}</Streamdown>
          ) : (
            <p className="font-hand text-sm text-muted-foreground">
              支持自由提问，系统会先走内部口径，再融合互联网公开信息回答。
            </p>
          )}
        </div>
      </WobblyCard>
    </div>
  );
};

export default Advice;
