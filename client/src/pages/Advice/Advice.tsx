import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, Loader2, MessageCircleMore } from 'lucide-react';
import { toast } from 'sonner';
import WobblyCard from '@client/src/components/WobblyCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRequiredStage } from '@client/src/hooks/use-stage';
import { useStageProfile } from '@client/src/hooks/use-stage-profile';
import { stagePath } from '@client/src/config/stages';
import { loadModuleSession } from '@client/src/utils/module-session';
import { Streamdown } from '@client/src/components/ui/streamdown';
import {
  getInternalMaterialContext,
  getInternalScriptAnchor,
} from '@client/src/config/internal-resource-library';
import { streamDiagnosisReport, streamPolicySearch } from '@client/src/api/plugins';

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

const Advice: React.FC = () => {
  const { stageSlug, stageConfig } = useRequiredStage();
  const { profile } = useStageProfile(stageSlug);
  const [comprehensiveAdvice, setComprehensiveAdvice] = useState('');
  const [loadingComprehensive, setLoadingComprehensive] = useState(false);
  const [objectionQuery, setObjectionQuery] = useState('');
  const [objectionAnswer, setObjectionAnswer] = useState('');
  const [loadingObjection, setLoadingObjection] = useState(false);
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

  const copyAll = async () => {
    if (!comprehensiveAdvice.trim()) {
      toast.error('请先生成综合建议话术');
      return;
    }
    try {
      await navigator.clipboard.writeText(comprehensiveAdvice);
      toast.success('建议话术已复制');
    } catch {
      toast.error('复制失败，请重试');
    }
  };

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
      mode: 'comprehensive' | 'objection' | 'custom';
      onChunk: (next: string) => void;
    }) => {
      const { query, mode, onChunk } = input;
      const moduleContext = [
        diagnosisSummary[0] ? `诊断要点：${diagnosisSummary[0]}` : '',
        planSummary[0] ? `规划要点：${planSummary[0]}` : '',
        studyPlanSummary[0] ? `学习计划要点：${studyPlanSummary[0]}` : '',
        knowledgeSummary.length ? `知识点要点：${knowledgeSummary.join(' / ')}` : '',
      ]
        .filter(Boolean)
        .join('\n');
      const targetText = [profile.targetSchool, profile.targetMajor].filter(Boolean).join(' / ');
      const internetContext = await fetchInternetContext(
        `${query} 洋葱 课程 功能 升学政策`,
      );

      const modeHint =
        mode === 'comprehensive'
          ? '输出“综合建议话术”，覆盖开场、现状、方案、执行收口。'
          : mode === 'objection'
            ? '输出“异议处理话术”，先共情，再拆异议，再给行动。'
            : '输出“自定义问题回答话术”，直接回答并给下一步。';

      const prompt = [
        `你是有10年教培咨询经验的课程顾问，服务对象是${stageConfig.label}学段家长。`,
        `问题：${query}`,
        modeHint,
        '',
        '【必须优先使用的内部素材】',
        internalMaterial,
        `内部话术锚点：${internalAnchor}`,
        '',
        '【四大模块上下文】',
        moduleContext || '暂无模块结果，请按学段通用策略回答。',
        targetText ? `目标院校/专业：${targetText}` : '',
        profile.weakSubjects ? `薄弱科目：${profile.weakSubjects}` : '',
        '',
        '【互联网公开信息】',
        internetContext || '暂无可提取公开信息，涉及政策请提示以官方最新发布为准。',
        '',
        '【硬性要求】',
        '1. 必须先按内部素材口径回答，再融合互联网公开信息。',
        '2. 必须结合公司产品功能与课程特点（如AI拍题精学、AI错题本、AI定制班、同步刷题/专项突破）。',
        '3. 语言要大白话、有温度、可直接说出口。',
        '4. 不得编造政策或价格；涉及价格必须写“以最新活动政策为准”。',
        '5. 输出结构：结论一句 + 3-5条可执行话术 + 1条下一步行动。',
      ]
        .filter(Boolean)
        .join('\n');

      let full = '';
      for await (const chunk of streamDiagnosisReport({
        student_grade: profile.grade || stageConfig.grades[stageConfig.grades.length - 1],
        student_region:
          [profile.province, profile.city, profile.county].filter(Boolean).join(' ') || '全国',
        subject_scores: '语文: 0分',
        learning_problems: prompt,
      })) {
        full += chunk;
        onChunk(full);
      }
    },
    [
      diagnosisSummary,
      planSummary,
      studyPlanSummary,
      knowledgeSummary,
      profile.targetSchool,
      profile.targetMajor,
      profile.weakSubjects,
      profile.grade,
      profile.province,
      profile.city,
      profile.county,
      fetchInternetContext,
      stageConfig.label,
      stageConfig.grades,
      internalMaterial,
      internalAnchor,
    ],
  );

  const handleGenerateComprehensive = useCallback(async () => {
    setLoadingComprehensive(true);
    setComprehensiveAdvice('');
    try {
      await generateAdviceByQuery({
        query: `${stageConfig.label}综合建议话术`,
        mode: 'comprehensive',
        onChunk: setComprehensiveAdvice,
      });
    } catch {
      toast.error('综合建议话术生成失败，请重试');
    } finally {
      setLoadingComprehensive(false);
    }
  }, [generateAdviceByQuery, stageConfig.label]);

  const handleGenerateObjection = useCallback(async () => {
    if (!objectionQuery.trim()) {
      toast.error('请先输入异议问题');
      return;
    }
    setLoadingObjection(true);
    setObjectionAnswer('');
    try {
      await generateAdviceByQuery({
        query: objectionQuery.trim(),
        mode: 'objection',
        onChunk: setObjectionAnswer,
      });
    } catch {
      toast.error('异议处理话术生成失败，请重试');
    } finally {
      setLoadingObjection(false);
    }
  }, [generateAdviceByQuery, objectionQuery]);

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
        mode: 'custom',
        onChunk: setCustomAnswer,
      });
    } catch {
      toast.error('自定义问题查询失败，请重试');
    } finally {
      setLoadingCustom(false);
    }
  }, [customQuery, generateAdviceByQuery]);

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
          自动关联四大模块结果，按“内部素材优先 + 互联网信息融合”输出综合与问答话术。
        </p>
      </div>

      <WobblyCard variant="yellow" decoration="tack" wobblyIndex={0} hoverable={false} className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircleMore className="size-5 text-marker-red" />
            <h2 className="font-marker text-xl font-bold">综合建议话术</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGenerateComprehensive} disabled={loadingComprehensive}>
              {loadingComprehensive ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
              生成话术
            </Button>
            <Button variant="outline" onClick={copyAll} disabled={!comprehensiveAdvice}>
              <Copy className="mr-1 size-4" />
              复制全部
            </Button>
          </div>
        </div>
        <p className="mb-2 text-xs text-ink/70">内部话术锚点：{internalAnchor}</p>
        <div className="rounded-md border border-ink/20 bg-white/70 p-3 min-h-[120px]">
          {comprehensiveAdvice ? (
            <Streamdown>{comprehensiveAdvice}</Streamdown>
          ) : (
            <p className="font-hand text-sm text-muted-foreground">
              点击“生成话术”，系统会先关联内部消息，再结合互联网信息和产品功能特点输出。
            </p>
          )}
        </div>
      </WobblyCard>

      <WobblyCard variant="white" decoration="tape" wobblyIndex={2} hoverable={false} className="p-5">
        <h3 className="font-marker mb-3 text-lg font-bold">异议处理话术查询</h3>
        <div className="flex gap-2">
          <Input
            value={objectionQuery}
            onChange={(e) => setObjectionQuery(e.target.value)}
            placeholder="输入异议，例如：价格太贵、担心孩子坚持不下来"
            className="font-hand"
          />
          <Button onClick={handleGenerateObjection} disabled={loadingObjection}>
            {loadingObjection ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
            查询
          </Button>
        </div>
        <div className="mt-3 rounded-md border border-ink/20 bg-accent/40 p-3 min-h-[120px]">
          {objectionAnswer ? (
            <Streamdown>{objectionAnswer}</Streamdown>
          ) : (
            <p className="font-hand text-sm text-muted-foreground">先输入异议问题，再点击查询。</p>
          )}
        </div>
      </WobblyCard>

      <WobblyCard variant="white" decoration="tape" wobblyIndex={3} hoverable={false} className="p-5">
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
