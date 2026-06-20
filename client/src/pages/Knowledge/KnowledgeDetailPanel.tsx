import React from 'react';
import { Copy, Check, AlertTriangle, Star, Target } from 'lucide-react';
import WobblyCard from '@client/src/components/WobblyCard';
import { Button } from '@/components/ui/button';
import type { KnowledgePoint } from '@shared/api.interface';
import KnowledgeGraph from './KnowledgeGraph';

interface KnowledgeDetailPanelProps {
  detail: KnowledgePoint | null;
  loading: boolean;
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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

function getExamProb(detail: KnowledgePoint): { label: string; percent: number; color: string } {
  const coreSubjects = ['数学', '语文', '英语', '物理', '化学'];
  const isCore = coreSubjects.includes(detail.subject);
  const coreLen = (detail.content.coreKnowledge || '').length;
  if (isCore && coreLen > 200) return { label: '极高频', percent: 90, color: 'bg-marker-red' };
  if (isCore) return { label: '高频', percent: 75, color: 'bg-marker-red/70' };
  if (coreLen > 150) return { label: '中高频', percent: 60, color: 'bg-pen-blue' };
  return { label: '中频', percent: 40, color: 'bg-pen-blue/50' };
}

const KnowledgeDetailPanel: React.FC<KnowledgeDetailPanelProps> = ({
  detail,
  loading,
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
  const examProb = getExamProb(detail);

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
          <span className="font-hand text-xs text-ink/70">中考出题概率</span>
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

      <KnowledgeGraph detail={detail} />

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
    </div>
  );
};

export default KnowledgeDetailPanel;
