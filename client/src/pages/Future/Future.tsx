import React from 'react';
import { CalendarCheck2, Signpost } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Plan from '@client/src/pages/Plan/Plan';
import StudyPlan from '@client/src/pages/StudyPlan/StudyPlan';
import { useRequiredStage } from '@client/src/hooks/use-stage';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@client/src/components/ui/tabs';

type FutureTab = 'path' | 'schedule';

function isFutureTab(value: string | null): value is FutureTab {
  return value === 'path' || value === 'schedule';
}

const Future: React.FC = () => {
  const { stageConfig } = useRequiredStage();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab: FutureTab = isFutureTab(requestedTab) ? requestedTab : 'path';

  const handleTabChange = (value: string): void => {
    if (!isFutureTab(value)) return;
    const next = new URLSearchParams(searchParams);
    next.set('tab', value);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <h1 className="font-marker text-3xl font-bold text-ink">
          {stageConfig.label} · 未来规划
        </h1>
        <p className="font-hand mt-1 text-sm text-muted-foreground">
          先明确升学路径，再把目标拆成可执行、可验收的课表。
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-5">
        <TabsList className="h-11 w-full max-w-md rounded-none border-2 border-ink bg-white p-1 shadow-hard-sm">
          <TabsTrigger
            value="path"
            className="rounded-none font-hand data-[state=active]:bg-postit-yellow"
          >
            <Signpost className="size-4" />
            升学路径
          </TabsTrigger>
          <TabsTrigger
            value="schedule"
            className="rounded-none font-hand data-[state=active]:bg-postit-yellow"
          >
            <CalendarCheck2 className="size-4" />
            执行课表
          </TabsTrigger>
        </TabsList>
        <TabsContent value="path">
          <Plan embedded />
        </TabsContent>
        <TabsContent value="schedule">
          <StudyPlan embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Future;
