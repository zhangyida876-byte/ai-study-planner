import React, { useState } from 'react';
import { Copy, MessageCircleMore, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import WobblyCard from '@client/src/components/WobblyCard';
import { Button } from '@/components/ui/button';

interface ReferenceScriptCardProps {
  onGenerate: () => string;
  hint?: string;
  wobblyIndex?: number;
}

const ReferenceScriptCard: React.FC<ReferenceScriptCardProps> = ({
  onGenerate,
  hint = '点击“一键生成”，基于当前页面信息生成可直接使用的话术。',
  wobblyIndex = 30,
}) => {
  const [script, setScript] = useState('');

  const handleGenerate = () => {
    const next = onGenerate().trim();
    if (!next) {
      toast.error('当前信息不足，请先填写或生成当前模块内容');
      return;
    }
    setScript(next);
    toast.success('参考话术已生成');
  };

  const handleCopy = async () => {
    if (!script) return;
    try {
      await navigator.clipboard.writeText(script);
      toast.success('参考话术已复制');
    } catch {
      toast.error('复制失败，请重试');
    }
  };

  return (
    <WobblyCard variant="white" decoration="tape" wobblyIndex={wobblyIndex} hoverable={false} className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircleMore className="size-5 text-pen-blue" />
          <h3 className="font-marker text-lg font-bold text-ink">参考话术</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleGenerate}>
            <Sparkles className="mr-1 size-4" />
            一键生成
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopy} disabled={!script}>
            <Copy className="mr-1 size-4" />
            复制
          </Button>
        </div>
      </div>
      <p className="font-hand mb-2 text-xs text-ink/60">{hint}</p>
      <div className="font-hand rounded-md border border-ink/20 bg-accent/40 px-3 py-2 text-sm text-ink/85">
        {script || '暂未生成话术'}
      </div>
    </WobblyCard>
  );
};

export default ReferenceScriptCard;
