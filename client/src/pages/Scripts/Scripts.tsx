import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  MessageCircleQuestion,
  MessagesSquare,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import Advice from '@client/src/pages/Advice/Advice';
import ObjectionHandlingPanel from '@client/src/components/ObjectionHandlingPanel';
import WobblyCard from '@client/src/components/WobblyCard';
import { useRequiredStage } from '@client/src/hooks/use-stage';
import {
  buildDailyScripts,
  formatDailyScriptDate,
  type DailyScriptCategory,
} from '@client/src/data/daily-scripts';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

type ScriptsTab = 'objection' | 'daily' | 'ask';

const CATEGORY_LABELS: Record<DailyScriptCategory, string> = {
  objection: '异议处理',
  case: '案例素材',
  product: '产品口径',
};

const CATEGORY_STYLES: Record<DailyScriptCategory, string> = {
  objection: 'border-marker-red/40 bg-marker-red/5 text-marker-red',
  case: 'border-pen-blue/40 bg-pen-blue/5 text-pen-blue',
  product: 'border-ink/30 bg-postit-yellow text-ink',
};

function isScriptsTab(value: string | null): value is ScriptsTab {
  return value === 'objection' || value === 'daily' || value === 'ask';
}

const Scripts: React.FC = () => {
  const { stageSlug, stageConfig } = useRequiredStage();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab: ScriptsTab = isScriptsTab(requestedTab) ? requestedTab : 'objection';
  const [batch, setBatch] = useState(0);
  const [copiedId, setCopiedId] = useState('');
  const [dateKey] = useState(() => formatDailyScriptDate(new Date()));

  useEffect(() => {
    setBatch(0);
  }, [stageSlug]);

  const recommendations = useMemo(
    () => buildDailyScripts({ stageSlug, dateKey, batch }),
    [batch, dateKey, stageSlug],
  );

  const handleTabChange = (value: string): void => {
    if (!isScriptsTab(value)) return;
    const next = new URLSearchParams(searchParams);
    next.set('tab', value);
    setSearchParams(next, { replace: true });
  };

  const handleCopy = async (id: string, content: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      toast.success('话术已复制');
      window.setTimeout(() => setCopiedId(''), 1600);
    } catch {
      toast.error('复制失败，请检查剪贴板权限');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <h1 className="font-marker flex items-center gap-2 text-3xl font-bold text-ink">
          <MessagesSquare className="size-7 text-marker-red" />
          {stageConfig.label} · 话术中心
        </h1>
        <p className="font-hand mt-1 text-sm text-muted-foreground">
          异议随查、每日推荐和自定义提问集中在一处。
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-5">
        <TabsList className="grid h-auto w-full max-w-2xl grid-cols-3 rounded-none border-2 border-ink bg-white p-1 shadow-hard-sm">
          <TabsTrigger value="objection" className="rounded-none py-2 font-hand data-[state=active]:bg-postit-yellow">
            <MessageCircleQuestion className="size-4" />异议处理
          </TabsTrigger>
          <TabsTrigger value="daily" className="rounded-none py-2 font-hand data-[state=active]:bg-postit-yellow">
            <Sparkles className="size-4" />每日黄金话术
          </TabsTrigger>
          <TabsTrigger value="ask" className="rounded-none py-2 font-hand data-[state=active]:bg-postit-yellow">
            <MessagesSquare className="size-4" />自定义提问
          </TabsTrigger>
        </TabsList>

        <TabsContent value="objection">
          <ObjectionHandlingPanel />
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-hand text-sm text-ink/65">
              {dateKey} · {stageConfig.label}学段 · 第 {batch + 1} 批
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => setBatch((value) => value + 1)}>
              <RefreshCw className="mr-1 size-4" />换一批
            </Button>
          </div>
          <div className="grid items-start gap-4 md:grid-cols-2">
            {recommendations.map((item, index) => (
              <WobblyCard
                key={`${batch}:${item.id}`}
                variant="white"
                wobblyIndex={index}
                hoverable
                className="p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className={`inline-block border px-2 py-0.5 font-hand text-xs ${CATEGORY_STYLES[item.category]}`}>
                      {CATEGORY_LABELS[item.category]}
                    </span>
                    <h2 className="font-marker mt-2 text-lg font-bold leading-snug text-ink">
                      {item.title}
                    </h2>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="复制话术"
                    aria-label={`复制${item.title}`}
                    onClick={() => handleCopy(item.id, item.content)}
                  >
                    {copiedId === item.id
                      ? <Check className="size-4 text-success" />
                      : <Copy className="size-4" />}
                  </Button>
                </div>
                <p className="font-hand mt-3 whitespace-pre-line text-sm leading-relaxed text-ink/80">
                  {item.content}
                </p>
                <p className="font-hand mt-3 border-t border-dashed border-ink/20 pt-2 text-xs text-muted-foreground">
                  来源：{item.source}
                </p>
              </WobblyCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ask">
          <Advice embedded showObjection={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Scripts;
