import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Copy, FileText, Clock } from 'lucide-react';
import WobblyCard from '@client/src/components/WobblyCard';
import { Streamdown } from '@client/src/components/ui/streamdown';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { plan } from '@client/src/api';
import {
  streamPlanReport,
  streamTimeline,
  buildScoresText,
  buildPolicyText,
} from '@client/src/api/plugins';
import PlanTimeline from './PlanTimeline';
import type { AdmissionPolicy } from '@shared/api.interface';

const REGIONS = ['十堰', '武汉', '襄阳', '宜昌', '荆州'];

interface ScoreDef {
  key: string;
  label: string;
  max: number;
}

const SCORE_DEFS: ScoreDef[] = [
  { key: '语文', label: '语文', max: 120 },
  { key: '数学', label: '数学', max: 120 },
  { key: '英语', label: '英语', max: 120 },
  { key: '物理', label: '物理', max: 70 },
  { key: '化学', label: '化学', max: 50 },
  { key: '道法', label: '道法', max: 60 },
  { key: '历史', label: '历史', max: 60 },
  { key: '体育', label: '体育', max: 50 },
];

interface TierInfo {
  label: string;
  variant: 'yellow' | 'white';
  borderColor?: string;
  school: string;
  score: number;
}

function computeTiers(
  lines: Array<{ batch: string; school: string; score: number }>
): TierInfo[] {
  if (lines.length === 0) return [];
  const sorted = [...lines].sort((a, b) => b.score - a.score);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];
  const mid = sorted.length > 2 ? sorted[Math.floor(sorted.length / 2)] : bottom;

  return [
    {
      label: '保底',
      variant: 'yellow',
      school: bottom.school,
      score: bottom.score,
    },
    {
      label: '稳健',
      variant: 'white',
      school: mid.school,
      score: mid.score,
    },
    {
      label: '冲刺',
      variant: 'white',
      borderColor: 'border-marker-red',
      school: top.school,
      score: top.score,
    },
  ];
}

function buildPolicyContext(policies: AdmissionPolicy[]): string {
  if (!policies.length) return '暂无该地区政策数据';
  const p = policies[0];
  return buildPolicyText(
    p.totalScore,
    p.scoreStructure,
    p.admissionLines,
    p.policyContent
  );
}

const Plan: React.FC = () => {
  const [region, setRegion] = useState<string>('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [policies, setPolicies] = useState<AdmissionPolicy[]>([]);
  const [policyLoading, setPolicyLoading] = useState<boolean>(false);
  const [reportContent, setReportContent] = useState<string>('');
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [timelineContent, setTimelineContent] = useState<string>('');
  const [timelineLoading, setTimelineLoading] = useState<boolean>(false);

  const handleScoreChange = useCallback((key: string, val: string): void => {
    const num = val === '' ? 0 : parseInt(val, 10);
    setScores(prev => ({ ...prev, [key]: isNaN(num) ? 0 : num }));
  }, []);

  const fetchPolicies = useCallback(async (selectedRegion: string): Promise<void> => {
    setPolicyLoading(true);
    try {
      const res = await plan.getAdmissionPolicies(selectedRegion);
      setPolicies(res.items);
    } catch {
      toast.error('获取政策数据失败');
    } finally {
      setPolicyLoading(false);
    }
  }, []);

  const handleRegionChange = useCallback((val: string): void => {
    setRegion(val);
    setReportContent('');
    setTimelineContent('');
    if (val) fetchPolicies(val);
  }, [fetchPolicies]);

  const hasScores = Object.values(scores).some(v => v > 0);

  const handleGenerateReport = useCallback(async (): Promise<void> => {
    if (!region) {
      toast.error('请先选择地区');
      return;
    }
    if (!hasScores) {
      toast.error('请先输入成绩');
      return;
    }

    setReportLoading(true);
    setReportContent('');

    try {
      await plan.createPlanRecord({ region, scores });

      const scoresText = buildScoresText(scores);
      const policyText = buildPolicyContext(policies);

      let fullContent = '';
      for await (const chunk of streamPlanReport({
        student_scores: scoresText,
        region_admission_policy: policyText,
      })) {
        fullContent += chunk;
        setReportContent(fullContent);
      }
    } catch {
      toast.error('生成规划报告失败');
    } finally {
      setReportLoading(false);
    }
  }, [region, scores, policies, hasScores]);

  const handleGenerateTimeline = useCallback(async (): Promise<void> => {
    if (!region) {
      toast.error('请先选择地区');
      return;
    }

    setTimelineLoading(true);
    setTimelineContent('');

    try {
      let fullContent = '';
      for await (const chunk of streamTimeline({
        current_grade: '初二',
        region,
      })) {
        fullContent += chunk;
        setTimelineContent(fullContent);
      }
    } catch {
      toast.error('生成时间路线图失败');
    } finally {
      setTimelineLoading(false);
    }
  }, [region]);

  const handleCopyReport = useCallback(async (): Promise<void> => {
    if (!reportContent) return;
    try {
      await navigator.clipboard.writeText(reportContent);
      toast.success('已复制到剪贴板');
    } catch {
      toast.error('复制失败');
    }
  }, [reportContent]);

  const currentPolicy = policies.length > 0 ? policies[0] : null;

  return (
    <div className="min-h-screen bg-paper-dots p-6 font-hand">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <h1 className="font-marker text-3xl font-bold text-ink">
            升学规划
          </h1>
          <span className="rounded-full border-2 border-ink bg-postit-yellow px-3 py-0.5 text-sm">
            中考导航
          </span>
        </div>

        {/* Top Input Bar */}
        <WobblyCard
          variant="white"
          decoration="tape"
          wobblyIndex={0}
          hoverable={false}
          className="p-5"
        >
          <div className="flex flex-wrap items-end gap-4">
            {/* Region Selector */}
            <div className="w-40">
              <label className="mb-1 block text-sm font-bold text-ink">
                选择地区
              </label>
              <Select value={region} onValueChange={handleRegionChange}>
                <SelectTrigger className="font-hand">
                  <SelectValue placeholder="请选择地区" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Score Inputs */}
            <div className="flex flex-1 flex-wrap gap-3">
              {SCORE_DEFS.map(def => (
                <div key={def.key} className="w-20">
                  <label className="mb-1 block text-xs text-muted-foreground">
                    {def.label}
                    <span className="text-marker-red">/{def.max}</span>
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={def.max}
                    value={scores[def.key] || ''}
                    onChange={e => handleScoreChange(def.key, e.target.value)}
                    placeholder="0"
                    className="h-auto border-0 border-b-2 border-dashed border-ink/30 bg-transparent px-1 py-1.5 text-center font-hand text-ink shadow-none focus-visible:border-marker-red focus-visible:border-solid focus-visible:ring-0"
                  />
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateReport}
                disabled={reportLoading || !region || !hasScores}
                className="border-[3px] border-ink font-hand shadow-hard"
              >
                <FileText className="size-4" />
                {reportLoading ? '生成中...' : '生成规划报告'}
              </Button>
              <Button
                variant="secondary"
                onClick={handleGenerateTimeline}
                disabled={timelineLoading || !region}
                className="border-[3px] border-ink bg-postit-yellow font-hand shadow-hard"
              >
                <Clock className="size-4" />
                {timelineLoading ? '生成中...' : '生成时间路线图'}
              </Button>
            </div>
          </div>
        </WobblyCard>

        {/* Main Content: Left + Right */}
        <div className="flex gap-6">
          {/* Left Panel: Policy & Score Lines */}
          <div className="w-96 shrink-0">
            <WobblyCard
              variant="yellow"
              decoration="tack"
              wobblyIndex={1}
              hoverable={false}
              className="p-5"
              rotate={-0.5}
            >
              <h2 className="mb-4 font-marker text-xl font-bold text-ink">
                政策与分数线
              </h2>

              {policyLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  加载政策数据中...
                </div>
              ) : !currentPolicy ? (
                <div className="py-8 text-center text-muted-foreground">
                  {region
                    ? '暂无该地区政策数据'
                    : '请先选择地区查看政策'}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Total Score */}
                  <div className="text-center">
                    <span className="text-sm text-muted-foreground">
                      {currentPolicy.region} {currentPolicy.year}年中考总分
                    </span>
                    <div className="font-marker text-3xl font-bold text-marker-red">
                      {currentPolicy.totalScore}分
                    </div>
                  </div>

                  {/* Score Structure */}
                  <div>
                    <h3 className="mb-2 font-marker text-base font-bold">
                      科目分值构成
                    </h3>
                    <div className="space-y-1">
                      {Object.entries(currentPolicy.scoreStructure).map(
                        ([subject, maxScore]) => (
                          <div
                            key={subject}
                            className="flex items-center justify-between border-b-2 border-dashed border-ink/20 pb-1"
                          >
                            <span className="font-hand">{subject}</span>
                            <span className="font-marker font-bold">
                              {maxScore}分
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Admission Lines */}
                  {currentPolicy.admissionLines.length > 0 && (
                    <div>
                      <h3 className="mb-2 font-marker text-base font-bold">
                        录取分数线
                      </h3>
                      <table className="w-full font-hand text-sm">
                        <thead>
                          <tr className="border-b-[3px] border-ink">
                            <th className="py-1.5 text-left font-marker">
                              批次
                            </th>
                            <th className="py-1.5 text-left font-marker">
                              学校
                            </th>
                            <th className="py-1.5 text-right font-marker">
                              分数
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentPolicy.admissionLines.map(
                            (
                              line: {
                                batch: string;
                                school: string;
                                score: number;
                              },
                              idx: number
                            ) => (
                              <tr
                                key={idx}
                                className="border-b-2 border-dashed border-ink/20"
                              >
                                <td className="py-1.5">{line.batch}</td>
                                <td className="py-1.5">{line.school}</td>
                                <td className="py-1.5 text-right font-bold text-marker-red">
                                  {line.score}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Three-tier Goal Cards */}
                  {currentPolicy.admissionLines.length > 0 && (
                    <div>
                      <h3 className="mb-3 font-marker text-base font-bold">
                        目标分层
                      </h3>
                      <div className="space-y-2">
                        {computeTiers(
                          currentPolicy.admissionLines
                        ).map((tier, idx) => (
                          <WobblyCard
                            key={tier.label}
                            variant={tier.variant}
                            wobblyIndex={idx + 1}
                            hoverable
                            rotate={idx % 2 === 0 ? -0.5 : 0.5}
                            className={`p-3 ${
                              tier.borderColor
                                ? `!border-marker-red`
                                : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="inline-block rounded-full border-2 border-ink bg-postit-yellow px-2 py-0.5 text-xs font-bold">
                                  {tier.label}
                                </span>
                                <span className="ml-2 text-sm font-hand">
                                  {tier.school}
                                </span>
                              </div>
                              <span className="font-marker text-lg font-bold text-marker-red">
                                {tier.score}分
                              </span>
                            </div>
                          </WobblyCard>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Policy Content */}
                  {currentPolicy.policyContent && (
                    <div>
                      <h3 className="mb-2 font-marker text-base font-bold">
                        政策摘要
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {currentPolicy.policyContent}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </WobblyCard>
          </div>

          {/* Right Panel: Report */}
          <div className="min-w-0 flex-1">
            <WobblyCard
              variant="white"
              decoration="tape"
              wobblyIndex={2}
              hoverable={false}
              className="p-5"
              rotate={0.3}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-marker text-xl font-bold text-ink">
                  AI 升学规划报告
                </h2>
                {reportContent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyReport}
                    className="border-2 border-ink font-hand shadow-hard-sm"
                  >
                    <Copy className="size-3.5" />
                    复制全文
                  </Button>
                )}
              </div>

              {reportLoading && !reportContent ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="font-marker text-lg text-ink animate-pulse">
                    AI 正在分析规划方案...
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    根据成绩和政策为您生成个性化升学规划
                  </div>
                </div>
              ) : reportContent ? (
                <div className="prose prose-sm max-w-none font-hand">
                  <Streamdown>{reportContent}</Streamdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <FileText className="mb-3 size-12 opacity-30" />
                  <p>输入成绩后，点击「生成规划报告」</p>
                  <p className="text-sm">
                    AI 将根据成绩与政策生成升学建议
                  </p>
                </div>
              )}
            </WobblyCard>
          </div>
        </div>

        {/* Bottom: Timeline */}
        <PlanTimeline
          content={timelineContent}
          loading={timelineLoading}
        />
      </div>
    </div>
  );
};

export default Plan;
