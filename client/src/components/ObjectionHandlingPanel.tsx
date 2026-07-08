import React, { useCallback, useState } from 'react';
import { Loader2, PhoneCall } from 'lucide-react';
import { toast } from 'sonner';
import WobblyCard from '@client/src/components/WobblyCard';
import { matchObjectionHandlingScript } from '@client/src/config/internal-resource-library';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Streamdown } from '@client/src/components/ui/streamdown';

interface ObjectionHandlingPanelProps {
  compact?: boolean;
}

const QUICK_QUERIES = ['问问孩子', '五步追单法', '家长不回', '一元体验包', '科大讯飞'];

const ObjectionHandlingPanel: React.FC<ObjectionHandlingPanelProps> = ({ compact = false }) => {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(
    (nextQuery = query) => {
      const text = nextQuery.trim();
      if (!text) {
        toast.error('请先输入家长异议');
        return;
      }
      setLoading(true);
      setAnswer('');
      try {
        setAnswer(matchObjectionHandlingScript(text));
        setQuery(text);
      } catch {
        toast.error('异议处理话术查询失败，请重试');
      } finally {
        setLoading(false);
      }
    },
    [query],
  );

  return (
    <WobblyCard variant="white" decoration="tape" wobblyIndex={compact ? 11 : 6} hoverable={false} className="p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <PhoneCall className="size-5 text-marker-red" />
            <h3 className="font-marker text-lg font-bold">异议处理｜电话随查随打</h3>
          </div>
          <p className="font-hand mt-1 text-xs text-ink/70">
            只按已上传源文档原文匹配直出，不联网、不分析、不关联学情；有图片案例时会提示可配发物料。
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 md:flex-row">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleSearch();
          }}
          placeholder="输入家长异议，例如：问问孩子、五步追单法、家长不回、科大讯飞"
          className="font-hand"
        />
        <Button onClick={() => handleSearch()} disabled={loading} className="font-hand md:w-24">
          {loading ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
          查询
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_QUERIES.map((item) => (
          <Button key={item} type="button" variant="outline" size="sm" className="font-hand" onClick={() => handleSearch(item)}>
            {item}
          </Button>
        ))}
      </div>

      <div className="mt-3 rounded-md border border-ink/20 bg-accent/40 p-3 min-h-[120px]">
        {answer ? (
          <Streamdown>{answer}</Streamdown>
        ) : (
          <p className="font-hand text-sm text-muted-foreground">
            电话中听到异议后，直接输入关键词查询；系统会返回源文档中的原文话术，并标注适用学段与物料建议。
          </p>
        )}
      </div>
    </WobblyCard>
  );
};

export default ObjectionHandlingPanel;
