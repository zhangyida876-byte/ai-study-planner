import React from 'react';
import { Clock } from 'lucide-react';
import WobblyCard from '@client/src/components/WobblyCard';
import { Streamdown } from '@client/src/components/ui/streamdown';

interface PlanTimelineProps {
  content: string;
  loading: boolean;
}

const PlanTimeline: React.FC<PlanTimelineProps> = ({ content, loading }) => {
  return (
    <WobblyCard
      variant="white"
      decoration="tape"
      wobblyIndex={3}
      hoverable={false}
      className="p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <h2 className="font-marker text-xl font-bold text-ink">
          备考时间路线图
        </h2>
        <span className="rounded-full border-2 border-ink bg-marker-red px-2 py-0.5 text-xs text-white">
          Timeline
        </span>
      </div>

      {loading && !content ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="font-marker text-lg text-ink animate-pulse">
            AI 正在生成时间路线图...
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            根据当前年级和地区规划备考节奏
          </div>
        </div>
      ) : content ? (
        <div className="relative">
          {/* Decorative timeline line */}
          <div
            className="absolute left-4 top-0 bottom-0 w-0.5 bg-ink/20"
            aria-hidden="true"
          />
          <div className="prose prose-sm max-w-none font-hand pl-10">
            <Streamdown>{content}</Streamdown>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Clock className="mb-3 size-12 opacity-30" />
          <p>选择地区后，点击「生成时间路线图」</p>
          <p className="text-sm">
            AI 将规划从现在到中考的备考时间线
          </p>
        </div>
      )}
    </WobblyCard>
  );
};

export default PlanTimeline;
