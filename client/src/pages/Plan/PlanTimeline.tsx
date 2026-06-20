import React, { useMemo } from 'react';
import { Clock, Star, BookOpen, Calendar, MapPin, User } from 'lucide-react';
import WobblyCard from '@client/src/components/WobblyCard';
import { Streamdown } from '@client/src/components/ui/streamdown';
import type { ExamType } from './PlanScoreInput';

interface PlanTimelineProps {
  content: string;
  loading: boolean;
  examType: ExamType;
  examDate?: string;
  grade?: string;
}

function getCountdown(examDate: string): number | null {
  if (!examDate) return null;
  const target = new Date(examDate);
  const now = new Date();
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function getExamLabel(examType: ExamType): string {
  if (examType === '小升初') return '小升初';
  if (examType === '中考') return '中考';
  return '高考';
}

function getUrgencyLevel(days: number): { color: string; label: string } {
  if (days <= 30) return { color: 'text-marker-red', label: '冲刺阶段' };
  if (days <= 90) return { color: 'text-orange-500', label: '强化阶段' };
  if (days <= 180) return { color: 'text-pen-blue', label: '提升阶段' };
  return { color: 'text-emerald-600', label: '储备阶段' };
}

interface SummaryInfo {
  title: string;
  content: string;
}

interface TimelineNode {
  title: string;
  body: string;
  importance: string;
  index: number;
}

function parseContent(content: string): { summary: SummaryInfo | null; nodes: TimelineNode[] } {
  if (!content) return { summary: null, nodes: [] };
  const sections = content.split(/\n#{1,3}\s+/).filter(Boolean);
  if (sections.length === 0) return { summary: null, nodes: [] };

  const firstSection = sections[0];
  const firstLines = firstSection.split('\n').filter(Boolean);
  const summaryTitle = firstLines[0]?.replace(/^#+\s*/, '').trim() || '备考概览';
  const summaryContent = firstLines.slice(1).join('\n');

  const nodes = sections.slice(1).map((section, idx) => {
    const lines = section.split('\n').filter(Boolean);
    const title = lines[0]?.replace(/^#+\s*/, '').trim() || '';
    const body = lines.slice(1).join('\n');
    const importance = idx < 2 ? 'high' : idx < 4 ? 'medium' : 'low';
    return { title, body, importance, index: idx };
  });

  return {
    summary: { title: summaryTitle, content: summaryContent },
    nodes,
  };
}

const nodeColors = {
  high: 'bg-marker-red border-marker-red',
  medium: 'bg-pen-blue border-pen-blue',
  low: 'bg-ink/40 border-ink/40',
};

const nodeTextSizes = {
  high: 'text-lg font-bold',
  medium: 'text-base font-semibold',
  low: 'text-sm',
};

const PlanTimeline: React.FC<PlanTimelineProps> = ({
  content,
  loading,
  examType,
  examDate,
  grade,
}) => {
  const countdown = examDate ? getCountdown(examDate) : null;
  const examLabel = getExamLabel(examType);
  const urgency = countdown != null ? getUrgencyLevel(countdown) : null;

  const { summary, nodes } = useMemo(() => parseContent(content), [content]);

  return (
    <WobblyCard
      variant="white"
      decoration="tape"
      wobblyIndex={3}
      hoverable={false}
      className="p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-marker text-xl font-bold text-ink">
            备考时间路线图
          </h2>
          <span className="rounded-full border-2 border-ink bg-marker-red px-2 py-0.5 text-xs text-white">
            Timeline
          </span>
        </div>
        {countdown != null && urgency && (
          <span className={`font-hand text-sm font-bold ${urgency.color}`}>
            {urgency.label}
          </span>
        )}
      </div>

      {/* Exam Countdown Banner */}
      {countdown != null && (
        <div className="mb-5 flex items-center gap-4 rounded-lg border-[3px] border-marker-red bg-marker-red/5 p-4">
          <div className="flex size-14 items-center justify-center rounded-full border-[3px] border-marker-red bg-white">
            <Clock className="size-7 text-marker-red" />
          </div>
          <div>
            <div className="font-marker text-3xl font-bold text-marker-red">
              {countdown}
              <span className="ml-1 text-lg">天</span>
            </div>
            <div className="font-hand text-sm text-ink/70">
              距离{examLabel}还有 {countdown} 天
            </div>
          </div>
          <div className="ml-auto hidden text-right sm:block">
            <div className="font-hand text-xs text-muted-foreground">考试日期</div>
            <div className="font-marker text-sm font-bold text-ink">{examDate}</div>
          </div>
        </div>
      )}

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
        <div className="space-y-5">
          {/* Summary Card */}
          {summary && (
            <WobblyCard
              variant="yellow"
              decoration="tack"
              wobblyIndex={10}
              hoverable={false}
              className="p-4"
              rotate={-0.3}
            >
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="size-5 text-marker-red" />
                <h3 className="font-marker text-lg font-bold text-ink">
                  {summary.title}
                </h3>
              </div>
              {grade && (
                <div className="mb-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-white px-2 py-0.5 text-xs font-hand">
                    <User className="size-3" />
                    {grade}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-white px-2 py-0.5 text-xs font-hand">
                    <MapPin className="size-3" />
                    {examLabel}
                  </span>
                  {countdown != null && (
                    <span className="inline-flex items-center gap-1 rounded-full border-2 border-marker-red bg-marker-red/10 px-2 py-0.5 text-xs font-hand font-bold text-marker-red">
                      <Clock className="size-3" />
                      倒计时 {countdown} 天
                    </span>
                  )}
                </div>
              )}
              {summary.content && (
                <div className="font-hand text-sm leading-relaxed text-ink/80">
                  <Streamdown>{summary.content}</Streamdown>
                </div>
              )}
            </WobblyCard>
          )}

          {/* Timeline Nodes */}
          <div className="relative">
            <div
              className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-marker-red via-pen-blue to-ink/20"
              aria-hidden="true"
            />
            <div className="space-y-4">
              {nodes.length > 0 ? (
                nodes.map((node) => (
                  <div key={node.index} className="relative pl-10">
                    <div
                      className={`absolute left-[7px] top-1.5 size-4 rounded-full border-2 bg-white ${nodeColors[node.importance as keyof typeof nodeColors]}`}
                      aria-hidden="true"
                    />
                    <div>
                      <h3
                        className={`font-marker ${nodeTextSizes[node.importance as keyof typeof nodeTextSizes]} ${
                          node.importance === 'high'
                            ? 'text-marker-red'
                            : node.importance === 'medium'
                            ? 'text-pen-blue'
                            : 'text-ink'
                        }`}
                      >
                        {node.importance === 'high' && (
                          <Star className="mr-1.5 inline size-4" />
                        )}
                        {node.importance === 'medium' && (
                          <BookOpen className="mr-1.5 inline size-3.5" />
                        )}
                        {node.title}
                      </h3>
                      {node.body && (
                        <div className="mt-1 font-hand text-sm leading-relaxed text-ink/70 prose-headings:font-marker">
                          <Streamdown>{node.body}</Streamdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="pl-10 font-hand prose-headings:font-marker prose-sm max-w-none">
                  <Streamdown>{content}</Streamdown>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Clock className="mb-3 size-12 opacity-30" />
          <p>选择地区后，点击「生成时间路线图」</p>
          <p className="text-sm">
            AI 将规划从现在到{examLabel}的备考时间线
          </p>
        </div>
      )}
    </WobblyCard>
  );
};

export default PlanTimeline;
