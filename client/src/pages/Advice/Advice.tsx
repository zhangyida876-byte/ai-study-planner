import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, Loader2, MessageCircleMore } from 'lucide-react';
import { toast } from 'sonner';
import WobblyCard from '@client/src/components/WobblyCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Streamdown } from '@client/src/components/ui/streamdown';
import { useRequiredStage } from '@client/src/hooks/use-stage';
import { useStageProfile } from '@client/src/hooks/use-stage-profile';
import { stagePath } from '@client/src/config/stages';
import { loadModuleSession, saveModuleSession } from '@client/src/utils/module-session';
import {
  getInternalMaterialContext,
  getInternalScriptAnchor,
} from '@client/src/config/internal-resource-library';
import { streamDiagnosisReport, streamPolicySearch } from '@client/src/api/plugins';
import {
  buildEvidenceMeta,
  buildFollowupScripts,
  buildMissingInfo,
  buildParentSections,
  buildPromptTemplate,
  buildSalesScriptTemplates,
  buildStructuredDiagnosis,
  estimateConfidence,
  parseScoreOverview,
  type AdviceSourceFilter,
  type AdviceDataSourceMeta,
  type AdviceScriptTemplate,
  type StudentSnapshot,
} from '@client/src/utils/advice-engine';

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

interface AdviceEvidenceSessionState {
  sourceFilter: AdviceSourceFilter;
  confirmedSourceKeys: string[];
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
  const persistedEvidenceSession = loadModuleSession<AdviceEvidenceSessionState>(stageSlug, 'advice-evidence');
  const [viewMode, setViewMode] = useState<'consultant' | 'parent'>('consultant');
  const [sourceFilter, setSourceFilter] = useState<AdviceSourceFilter>(
    () => persistedEvidenceSession?.sourceFilter || 'all',
  );
  const [confirmedSourceKeys, setConfirmedSourceKeys] = useState<string[]>(
    () => persistedEvidenceSession?.confirmedSourceKeys || [],
  );
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

  const snapshot = useMemo<StudentSnapshot>(
    () => ({
      stageSlug,
      stageLabel: stageConfig.label,
      grade: profile.grade || '',
      region: [profile.province, profile.city, profile.county].filter(Boolean).join(' '),
      school: profile.school || '',
      currentScoreText: profile.scoresOverview || '',
      currentTotalScore: parseScoreOverview(profile.scoresOverview || ''),
      targetSchool: profile.targetSchool || '',
      targetScore: profile.targetScore,
      targetMajor: profile.targetMajor || '',
      weakSubjects: profile.weakSubjects || '',
      strongSubjects: profile.strongSubjects || '',
      careerIntent: profile.careerIntent || '',
      parentGoal: [profile.targetSchool, profile.targetMajor].filter(Boolean).join(' / '),
    }),
    [stageSlug, stageConfig.label, profile],
  );

  const diagnosis = useMemo(() => buildStructuredDiagnosis(snapshot), [snapshot]);
  const missingItems = useMemo(() => buildMissingInfo(snapshot), [snapshot]);
  const followupScripts = useMemo(() => buildFollowupScripts(missingItems), [missingItems]);
  const confidence = useMemo(() => estimateConfidence(snapshot), [snapshot]);
  const evidenceMeta = useMemo(() => buildEvidenceMeta(snapshot, confidence), [snapshot, confidence]);
  const confirmedSourceKeySet = useMemo(() => new Set(confirmedSourceKeys), [confirmedSourceKeys]);
  const filteredEvidenceMeta = useMemo(() => {
    if (sourceFilter === 'all') return evidenceMeta;
    if (sourceFilter === 'official') {
      return evidenceMeta.filter((item) => item.source_type === '官方');
    }
    return evidenceMeta.filter((item) => item.source_type !== '官方');
  }, [evidenceMeta, sourceFilter]);
  const salesScripts = useMemo(() => buildSalesScriptTemplates(snapshot), [snapshot]);
  const parentSections = useMemo(() => buildParentSections(snapshot, diagnosis), [snapshot, diagnosis]);

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
      onChunk: (next: string) => void;
    }) => {
      const internetContext = await fetchInternetContext(
        `${input.query} 洋葱 课程 功能 升学政策`,
      );
      const prompt = buildPromptTemplate({
        scene: input.scene,
        stageLabel: stageConfig.label,
        question: input.query,
        internalMaterial,
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
        subject_scores: '语文: 0分',
        learning_problems: prompt,
      })) {
        full += chunk;
        input.onChunk(full);
      }
    },
    [
      fetchInternetContext,
      internalAnchor,
      internalMaterial,
      moduleContext,
      profile.city,
      profile.county,
      profile.grade,
      profile.province,
      profile.targetMajor,
      profile.targetSchool,
      profile.weakSubjects,
      stageConfig.grades,
      stageConfig.label,
    ],
  );

  const handleGenerateComprehensive = useCallback(async () => {
    setLoadingComprehensive(true);
    setComprehensiveAdvice('');
    try {
      await generateAdviceByQuery({
        query: `${stageConfig.label}综合建议话术`,
        scene: '综合建议话术',
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
        scene: '异议处理话术',
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
        scene: '自定义问题查询',
        onChunk: setCustomAnswer,
      });
    } catch {
      toast.error('自定义问题查询失败，请重试');
    } finally {
      setLoadingCustom(false);
    }
  }, [customQuery, generateAdviceByQuery]);

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

  const persistEvidenceSession = useCallback(
    (nextFilter: AdviceSourceFilter, nextConfirmedKeys: string[]) => {
      saveModuleSession<AdviceEvidenceSessionState>(stageSlug, 'advice-evidence', {
        sourceFilter: nextFilter,
        confirmedSourceKeys: nextConfirmedKeys,
      });
    },
    [stageSlug],
  );

  const switchSourceFilter = useCallback(
    (nextFilter: AdviceSourceFilter) => {
      setSourceFilter(nextFilter);
      persistEvidenceSession(nextFilter, confirmedSourceKeys);
    },
    [confirmedSourceKeys, persistEvidenceSession],
  );

  const buildSourceKey = useCallback((meta: AdviceDataSourceMeta) => {
    return `${meta.source_name}::${meta.source_type}`;
  }, []);

  const handleConfirmSource = useCallback(
    (meta: AdviceDataSourceMeta) => {
      const sourceKey = buildSourceKey(meta);
      if (confirmedSourceKeySet.has(sourceKey)) return;
      const nextKeys = [...confirmedSourceKeys, sourceKey];
      setConfirmedSourceKeys(nextKeys);
      persistEvidenceSession(sourceFilter, nextKeys);
      toast.success('来源已标记为人工确认');
    },
    [buildSourceKey, confirmedSourceKeySet, confirmedSourceKeys, persistEvidenceSession, sourceFilter],
  );

  const handleUndoConfirmSource = useCallback(
    (meta: AdviceDataSourceMeta) => {
      const sourceKey = buildSourceKey(meta);
      if (!confirmedSourceKeySet.has(sourceKey)) return;
      const nextKeys = confirmedSourceKeys.filter((key) => key !== sourceKey);
      setConfirmedSourceKeys(nextKeys);
      persistEvidenceSession(sourceFilter, nextKeys);
      toast.success('已撤销人工确认标记');
    },
    [buildSourceKey, confirmedSourceKeySet, confirmedSourceKeys, persistEvidenceSession, sourceFilter],
  );

  const renderMeta = (meta: AdviceDataSourceMeta) => {
    const sourceKey = buildSourceKey(meta);
    const isConfirmed = confirmedSourceKeySet.has(sourceKey);
    const needConfirm = meta.need_confirm && !isConfirmed;
    return (
      <div key={`${meta.source_name}-${meta.source_type}`} className="rounded border border-ink/20 bg-white/70 p-2 text-xs">
      <p className="font-semibold">{meta.source_name}</p>
      <p>来源类型：{meta.source_type}</p>
      <p>适用：{meta.region} / {meta.grade}</p>
      <p>更新时间：{new Date(meta.updated_at).toLocaleString()}</p>
      <p>可信度：{meta.confidence}</p>
      <p>限制：{meta.limitation}</p>
      <p>需人工确认：{needConfirm ? '是' : '否'}</p>
      {isConfirmed ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-emerald-700">已人工确认</span>
          <Button variant="outline" size="sm" onClick={() => handleUndoConfirmSource(meta)}>
            撤销
          </Button>
        </div>
      ) : null}
      {!isConfirmed && meta.need_confirm ? (
        <Button className="mt-2" variant="outline" size="sm" onClick={() => handleConfirmSource(meta)}>
          标记已确认
        </Button>
      ) : null}
      </div>
    );
  };

  const renderScriptTemplate = (item: AdviceScriptTemplate, idx: number) => (
    <div key={`${item.scene}-${idx}`} className="rounded-md border border-ink/20 bg-white/70 p-3">
      <div className="mb-1 flex items-center justify-between">
        <p className="font-semibold">{item.scene}</p>
        <span className="text-xs text-ink/60">{item.user_role === 'sales' ? '销售端' : '家长端'}</span>
      </div>
      <p className="text-xs text-ink/70">目的：{item.intent}</p>
      <p className="mt-1 text-xs text-ink/70">所需信息：{item.input_required.join('、')}</p>
      <p className="mt-2 text-sm">{item.script}</p>
      <p className="mt-2 text-xs text-ink/60">信息不足兜底：{item.fallback_script}</p>
      <p className="mt-1 text-xs text-ink/60">禁用表达：{item.forbidden_words.join('、')}</p>
      <p className="mt-1 text-xs text-ink/60">产品映射：{item.product_mapping.join('、')}</p>
      <p className="mt-1 text-xs text-ink/60">下一步：{item.next_action}</p>
    </div>
  );

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

      <WobblyCard variant="white" decoration="tape" wobblyIndex={0} hoverable={false} className="p-4">
        <div className="flex gap-2">
          <Button variant={viewMode === 'consultant' ? 'default' : 'outline'} onClick={() => setViewMode('consultant')}>
            顾问视角
          </Button>
          <Button variant={viewMode === 'parent' ? 'default' : 'outline'} onClick={() => setViewMode('parent')}>
            家长视角
          </Button>
        </div>
      </WobblyCard>

      {viewMode === 'consultant' ? (
        <WobblyCard variant="yellow" decoration="tack" wobblyIndex={1} hoverable={false} className="p-5">
          <h2 className="font-marker mb-3 text-xl font-bold">顾问视角：结构化学情诊断</h2>
          <div className="grid gap-2 md:grid-cols-3">
            <div className="rounded border border-ink/20 bg-white/70 p-3">
              <p className="text-xs text-ink/60">当前层级</p>
              <p className="font-marker text-lg">{diagnosis.levelLabel}</p>
            </div>
            <div className="rounded border border-ink/20 bg-white/70 p-3">
              <p className="text-xs text-ink/60">区域位置</p>
              <p className="text-sm">{diagnosis.regionPosition}</p>
            </div>
            <div className="rounded border border-ink/20 bg-white/70 p-3">
              <p className="text-xs text-ink/60">目标差距</p>
              <p className="text-sm">{diagnosis.targetGap.scoreGap == null ? '待补齐' : `${diagnosis.targetGap.scoreGap}分`}</p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {diagnosis.coreProblems.map((item, index) => (
              <div key={item.title} className="rounded border border-ink/20 bg-white/70 p-3">
                <p className="font-semibold">{index + 1}. {item.title}（紧急程度：{item.urgency}）</p>
                <p className="text-sm">表现：{item.symptom}</p>
                <p className="text-sm">原因：{item.reason}</p>
                <p className="text-sm">影响：{item.impact}</p>
                <p className="text-sm">解决路径：{item.solution}</p>
              </div>
            ))}
          </div>
        </WobblyCard>
      ) : (
        <WobblyCard variant="yellow" decoration="tack" wobblyIndex={2} hoverable={false} className="p-5">
          <h2 className="font-marker mb-3 text-xl font-bold">家长视角：看得懂的建议</h2>
          <div className="space-y-2">
            {parentSections.map((section) => (
              <div key={section.title} className="rounded border border-ink/20 bg-white/70 p-3">
                <p className="font-semibold">{section.title}</p>
                <p className="whitespace-pre-wrap text-sm">{section.content}</p>
              </div>
            ))}
          </div>
        </WobblyCard>
      )}

      <WobblyCard variant="white" decoration="tape" wobblyIndex={3} hoverable={false} className="p-5">
        <h3 className="font-marker mb-3 text-lg font-bold">数据依据与可信度</h3>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-ink/70">当前可信度：{confidence} / 100</p>
          <div className="flex gap-2">
            <Button variant={sourceFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => switchSourceFilter('all')}>
              全部
            </Button>
            <Button
              variant={sourceFilter === 'official' ? 'default' : 'outline'}
              size="sm"
              onClick={() => switchSourceFilter('official')}
            >
              仅官方
            </Button>
            <Button
              variant={sourceFilter === 'internal' ? 'default' : 'outline'}
              size="sm"
              onClick={() => switchSourceFilter('internal')}
            >
              仅内部
            </Button>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {filteredEvidenceMeta.map(renderMeta)}
        </div>
      </WobblyCard>

      {missingItems.length > 0 && (
        <WobblyCard variant="white" decoration="tape" wobblyIndex={4} hoverable={false} className="p-5">
          <h3 className="font-marker mb-3 text-lg font-bold">待补充信息卡片</h3>
          <div className="mb-3 rounded border border-dashed border-marker-red p-3 text-sm">
            {missingItems.map((item) => (
              <p key={item}>- {item}</p>
            ))}
          </div>
          <h4 className="mb-2 font-semibold">顾问追问话术</h4>
          <div className="space-y-2">
            {followupScripts.map(renderScriptTemplate)}
          </div>
        </WobblyCard>
      )}

      <WobblyCard variant="yellow" decoration="tack" wobblyIndex={5} hoverable={false} className="p-5">
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

      <WobblyCard variant="white" decoration="tape" wobblyIndex={6} hoverable={false} className="p-5">
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

      <WobblyCard variant="white" decoration="tape" wobblyIndex={8} hoverable={false} className="p-5">
        <h3 className="font-marker mb-3 text-lg font-bold">销售端话术模板引擎（可复用）</h3>
        <div className="space-y-2">
          {salesScripts.map(renderScriptTemplate)}
        </div>
      </WobblyCard>

      <WobblyCard variant="white" decoration="tape" wobblyIndex={9} hoverable={false} className="p-5">
        <h3 className="font-marker mb-3 text-lg font-bold">关联来源检查</h3>
        <div className="grid gap-2 md:grid-cols-2">
          <p className="font-hand text-sm">学情诊断：{diagnosisSession?.reportContent ? '已关联' : '未找到报告，先去生成'}</p>
          <p className="font-hand text-sm">升学规划：{planSession?.reportContent ? '已关联' : '未找到报告，先去生成'}</p>
          <p className="font-hand text-sm">学习规划：{studyPlanSession?.report ? '已关联' : '未找到报告，先去生成'}</p>
          <p className="font-hand text-sm">
            知识点查询：{knowledgeSummary.length > 0 ? `已关联（${knowledgeSummary.join(' / ')})` : '未找到最近筛选记录'}
          </p>
        </div>
      </WobblyCard>
    </div>
  );
};

export default Advice;
