import React, { useState, useCallback } from 'react';
import { Copy, Check, AlertTriangle, Star, Target, Sparkles, Loader2 } from 'lucide-react';
import WobblyCard from '@client/src/components/WobblyCard';
import ReferenceScriptCard from '@client/src/components/ReferenceScriptCard';
import { Button } from '@/components/ui/button';
import { Streamdown } from '@client/src/components/ui/streamdown';
import { streamKnowledgeAnalysis, buildKnowledgeGradeSemester } from '@client/src/api/plugins';
import type { KnowledgePoint } from '@shared/api.interface';
import KnowledgeGraph from './KnowledgeGraph';
import { buildReferenceScript, pickFirstSentence } from '@client/src/utils/reference-script';
import { getInternalScriptAnchor } from '@client/src/config/internal-resource-library';

import type { StageProfile } from '@client/src/types/stage-profile';
import type { StageSlug } from '@client/src/config/stages';
import { copyText } from '@client/src/utils/clipboard';

interface KnowledgeDetailPanelProps {
  detail: KnowledgePoint | null;
  loading: boolean;
  stageSlug?: StageSlug;
  profile?: StageProfile;
}

interface SectionBlockProps {
  title: string;
  content: string;
  variant: 'white' | 'yellow';
  wobblyIndex: number;
  isMistake?: boolean;
}

const SectionBlock: React.FC<SectionBlockProps> = ({
  title,
  content,
  variant,
  wobblyIndex,
  isMistake = false,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (): Promise<void> => {
    const result = await copyText(content);
    if (result.ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    setCopied(false);
  };

  return (
    <WobblyCard
      variant={variant}
      wobblyIndex={wobblyIndex}
      hoverable={false}
      className={`p-4 ${isMistake ? 'border-[3px] border-marker-red border-dashed' : ''}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-marker text-sm font-bold">{title}</h3>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="size-3.5 text-success" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </Button>
      </div>
      <div className="font-hand text-sm leading-relaxed whitespace-pre-wrap">
        {content || '暂无内容'}
      </div>
    </WobblyCard>
  );
};

function getImportance(detail: KnowledgePoint): { level: string; color: string; stars: number } {
  const coreLen = (detail.content.coreKnowledge || '').length;
  const mistakeLen = (detail.content.commonMistakes || '').length;
  if (coreLen > 200 && mistakeLen > 100) return { level: '核心考点', color: 'border-marker-red bg-marker-red/10 text-marker-red', stars: 3 };
  if (coreLen > 100) return { level: '重要知识', color: 'border-pen-blue bg-pen-blue/10 text-pen-blue', stars: 2 };
  return { level: '基础巩固', color: 'border-emerald-600 bg-emerald-600/10 text-emerald-600', stars: 1 };
}

function getExamProb(detail: KnowledgePoint, stageSlug?: StageSlug): { label: string; percent: number; color: string; title: string } {
  const coreSubjects = ['数学', '语文', '英语', '物理', '化学'];
  const isCore = coreSubjects.includes(detail.subject);
  const coreLen = (detail.content.coreKnowledge || '').length;
  const title = stageSlug === 'high' ? '高考考查概率' : stageSlug === 'middle' ? '中考出题概率' : '阶段测评考查概率';
  if (isCore && coreLen > 200) return { label: '极高频', percent: 90, color: 'bg-marker-red', title };
  if (isCore) return { label: '高频', percent: 75, color: 'bg-marker-red/70', title };
  if (coreLen > 150) return { label: '中高频', percent: 60, color: 'bg-pen-blue', title };
  return { label: '中频', percent: 40, color: 'bg-pen-blue/50', title };
}

function buildPainPointHints(detail: KnowledgePoint): string[] {
  const hints: string[] = [];
  const chapterText = `${detail.chapter} ${detail.name}`.replace(/\s+/g, '');
  if (chapterText.includes('一次函数')) {
    hints.push('常卡在“方程建模”：题目读完不知道该设哪个未知数，式子列不出来。');
    hints.push('常卡在“交点处理”：图像交点与方程组关系不清，代入后容易算错。');
  } else if (detail.subject.includes('数学')) {
    hints.push('常卡在“审题转条件”：已知条件和目标之间缺中间步骤，导致无从下手。');
    hints.push('常卡在“步骤完整性”：思路有但计算/推导断层，丢过程分。');
  } else if (detail.subject.includes('英语')) {
    hints.push('常卡在“句子结构识别”：长难句主干抓不住，选项判断摇摆。');
    hints.push('常卡在“词义语境匹配”：背过单词但放到语篇里不会用。');
  } else if (detail.subject.includes('语文')) {
    hints.push('常卡在“题干关键词定位”：问题问法没拆开，答案点找不全。');
    hints.push('常卡在“组织表达”：有想法但答题语言不够规范，失分明显。');
  } else {
    hints.push('常卡在“概念迁移”：会背定义，但遇到综合题不会灵活调用。');
    hints.push('常卡在“步骤衔接”：单点会做，串联到完整解题链条时断档。');
  }

  const mistakePieces = (detail.content.commonMistakes || '')
    .replace(/\s+/g, ' ')
    .split(/[。；!?？]/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (mistakePieces[0]) hints.push(`来自当前错因：${mistakePieces[0]}`);
  return hints.slice(0, 3);
}

const AIAnalysisSection: React.FC<{
  detail: KnowledgePoint;
  stageSlug?: StageSlug;
  profile?: StageProfile;
}> = ({ detail, stageSlug, profile }) => {
  const [analysisContent, setAnalysisContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalysisContent('');
    setAnalysisError('');
    try {
      const gradeSemester = buildKnowledgeGradeSemester(detail.chapter);
      const generator = streamKnowledgeAnalysis({
        textbook_version: detail.version,
        subject: detail.subject,
        grade_semester: gradeSemester || detail.chapter,
        chapter: detail.chapter,
        knowledge_point: detail.name,
      }, stageSlug ? { stageSlug, profile } : undefined);
      let full = '';
      for await (const chunk of generator) {
        full += chunk;
        setAnalysisContent(full);
      }
    } catch {
      setAnalysisError('分析生成失败，请稍后重试');
    } finally {
      setIsAnalyzing(false);
    }
  }, [detail, stageSlug, profile]);

  return (
    <WobblyCard variant="white" decoration="tape" wobblyIndex={3} hoverable={false} className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-pen-blue" />
          <h3 className="font-marker text-sm font-bold">AI 深度分析</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="font-hand"
          disabled={isAnalyzing}
          onClick={handleAnalyze}
        >
          {isAnalyzing ? (
            <><Loader2 className="mr-1 size-3.5 animate-spin" />分析中...</>
          ) : analysisContent ? '重新分析' : '生成分析'}
        </Button>
      </div>

      {analysisError && (
        <p className="font-hand mt-2 text-sm text-marker-red">{analysisError}</p>
      )}

      {isAnalyzing && !analysisContent && (
        <div className="flex items-center gap-2 py-6 font-hand text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          正在生成学情与知识点专项解读...
        </div>
      )}

      {analysisContent && (
        <div className="font-hand mt-3 prose-headings:font-marker border-t-2 border-dashed border-ink/10 pt-3">
          <Streamdown>{analysisContent}</Streamdown>
        </div>
      )}

      {!analysisContent && !isAnalyzing && (
        <p className="font-hand mt-2 text-xs text-muted-foreground">
          点击“生成分析”获取共性学情、重难点、后续影响和一周学习动作
        </p>
      )}
    </WobblyCard>
  );
};

const KnowledgeDetailPanel: React.FC<KnowledgeDetailPanelProps> = ({
  detail,
  loading,
  stageSlug,
  profile,
}) => {
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="font-hand text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <Target className="mb-3 size-10 text-muted-foreground/40" />
        <p className="font-hand text-lg text-muted-foreground">
          点击左侧知识点查看详情
        </p>
        <p className="mt-1 font-hand text-xs text-muted-foreground/60">
          查看知识图谱、重要程度和出题概率
        </p>
      </div>
    );
  }

  const importance = getImportance(detail);
  const examProb = getExamProb(detail, stageSlug);
  const painPoints = buildPainPointHints(detail);
  const effectiveStageSlug: StageSlug = stageSlug || 'middle';
  const buildKnowledgeReferenceScript = () =>
    buildReferenceScript([
      `先按一个原则：${getInternalScriptAnchor(effectiveStageSlug, 'knowledge')}`,
      `这个知识点是${detail.name}，在${detail.chapter}阶段很关键`,
      `重要程度是${importance.level}，先别贪多，先把核心题型做熟`,
      pickFirstSentence(detail.content.commonMistakes)
        ? `最容易丢分在：${pickFirstSentence(detail.content.commonMistakes)}`
        : '',
      '先把前置知识补齐，再做同类题3到5道，做完马上复盘错因，效果会更稳。',
    ]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-marker text-lg font-bold">{detail.name}</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="inline-block rounded-sm border-2 border-ink bg-postit-yellow px-1.5 py-0.5 font-hand text-[10px] -rotate-1">
            {detail.version}
          </span>
          <span className="inline-block rounded-sm border-2 border-ink bg-postit-yellow px-1.5 py-0.5 font-hand text-[10px] rotate-1">
            {detail.subject}
          </span>
          <span className="inline-block rounded-sm border-2 border-ink bg-postit-yellow px-1.5 py-0.5 font-hand text-[10px] -rotate-1">
            {detail.chapter}
          </span>
        </div>
      </div>

      <div className={`rounded-lg border-2 p-3 ${importance.color}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Star className="size-4" />
            <span className="font-marker text-sm font-bold">重要程度</span>
          </div>
          <span className="font-marker text-sm font-bold">{importance.level}</span>
        </div>
        <div className="mt-1.5 flex gap-0.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= importance.stars ? 'bg-current opacity-100' : 'bg-current opacity-20'}`}
            />
          ))}
        </div>
      </div>

      <div className="rounded-lg border-2 border-ink/15 bg-accent/30 p-3">
        <div className="flex items-center justify-between">
          <span className="font-hand text-xs text-ink/70">{examProb.title}</span>
          <span className="font-marker text-sm font-bold text-marker-red">
            {examProb.label}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full border border-ink/20 bg-white">
          <div
            className={`h-full rounded-full ${examProb.color}`}
            style={{ width: `${examProb.percent}%` }}
          />
        </div>
        <div className="mt-1 text-right font-hand text-[10px] text-muted-foreground">
          {examProb.percent}%
        </div>
      </div>

      <WobblyCard variant="yellow" wobblyIndex={30} hoverable={false} className="p-4">
        <h3 className="font-marker text-sm font-bold">学习该知识点最难最卡的</h3>
        <div className="mt-2 space-y-1.5">
          {painPoints.map((item) => (
            <p key={item} className="font-hand rounded border border-ink/20 bg-white/70 px-2.5 py-1.5 text-xs leading-relaxed">
              - {item}
            </p>
          ))}
        </div>
      </WobblyCard>

      <KnowledgeGraph detail={detail} stageSlug={stageSlug} />

      <SectionBlock
        title="核心知识点梳理"
        content={detail.content.coreKnowledge}
        variant="white"
        wobblyIndex={1}
      />

      <SectionBlock
        title="核心解题方法总结"
        content={detail.content.solutionMethods}
        variant="yellow"
        wobblyIndex={2}
      />

      <div className="rounded-lg border-[3px] border-dashed border-marker-red p-0">
        <div className="border-b-2 border-dashed border-marker-red/30 bg-marker-red/5 px-4 py-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="size-4 text-marker-red" />
            <span className="font-marker text-sm font-bold text-marker-red">易错点警示</span>
          </div>
        </div>
        <div className="p-3 font-hand text-sm leading-relaxed text-ink/80">
          {detail.content.commonMistakes || '暂无易错点数据'}
        </div>
      </div>

      <ReferenceScriptCard
        onGenerate={buildKnowledgeReferenceScript}
        hint="基于当前知识点详情生成可直接沟通的话术（300字内）。"
        wobblyIndex={34}
      />

      <AIAnalysisSection detail={detail} stageSlug={stageSlug} profile={profile} />
    </div>
  );
};

export default KnowledgeDetailPanel;
