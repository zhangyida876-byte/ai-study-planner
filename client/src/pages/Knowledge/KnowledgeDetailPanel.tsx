import React from 'react';
import { Copy, Check } from 'lucide-react';
import WobblyCard from '@client/src/components/WobblyCard';
import { Button } from '@/components/ui/button';
import type { KnowledgePoint } from '@shared/api.interface';

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
      // fallback
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
      className={`p-5 ${isMistake ? 'border-[3px] border-marker-red border-dashed' : ''}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-marker text-lg font-bold">{title}</h3>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="size-4 text-success" />
          ) : (
            <Copy className="size-4" />
          )}
        </Button>
      </div>
      <div className="font-hand text-base leading-relaxed whitespace-pre-wrap">
        {content || '暂无内容'}
      </div>
    </WobblyCard>
  );
};

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
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-center font-hand text-lg text-muted-foreground">
          点击左侧知识点查看详情
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="mb-4">
        <h2 className="font-marker text-xl font-bold">{detail.name}</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="inline-block rounded-sm border-2 border-ink bg-postit-yellow px-2 py-0.5 font-hand text-xs -rotate-1">
            {detail.version}
          </span>
          <span className="inline-block rounded-sm border-2 border-ink bg-postit-yellow px-2 py-0.5 font-hand text-xs rotate-1">
            {detail.subject}
          </span>
          <span className="inline-block rounded-sm border-2 border-ink bg-postit-yellow px-2 py-0.5 font-hand text-xs -rotate-1">
            {detail.chapter}
          </span>
        </div>
      </div>

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

      <SectionBlock
        title="常见易错点提示"
        content={detail.content.commonMistakes}
        variant="white"
        wobblyIndex={3}
        isMistake
      />
    </div>
  );
};

export default KnowledgeDetailPanel;
