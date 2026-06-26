import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Copy, FileText, Clock, Search, Loader2, ArrowLeft } from 'lucide-react';
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
  streamPolicySearch,
  fetchSchoolScoreByName,
  buildScoresText,
  buildPolicyText,
  buildPlanAdditionalInfo,
  type PlanFormContext,
} from '@client/src/api/plugins';
import PlanTimeline from './PlanTimeline';
import PlanScoreInput, { type ExamType } from './PlanScoreInput';
import PlanSchoolRecommend from './PlanSchoolRecommend';
import { PROVINCE_CITIES, PROVINCES, EXAM_TYPE_CONFIG } from './regionData';
import type { AdmissionPolicy, AdmissionLine } from '@shared/api.interface';
import { useRequiredStage } from '@client/src/hooks/use-stage';
import { useStageProfile } from '@client/src/hooks/use-stage-profile';
import ProfileAutofillBanner from '@client/src/components/ProfileAutofillBanner';
import { getPlanAutofillFromProfile } from '@client/src/utils/stage-profile-sync';
import { stagePath } from '@client/src/config/stages';
import { toSelectValue } from '@client/src/lib/utils';
import { policy as policyApi } from '@client/src/api';

const HS_MODES = [
  { value: '3+1+2', label: '3+1+2（物理/历史 二选一）' },
  { value: '3+3', label: '3+3（六选三）' },
];

const GRADE_OPTIONS: Record<ExamType, string[]> = {
  '小升初': ['三年级', '四年级', '五年级', '六年级'],
  '中考': ['初一', '初二', '初三'],
  '高考': ['高一', '高二', '高三'],
};

function buildPolicyContext(policies: AdmissionPolicy[]): string {
  if (!policies.length) return '暂无该地区政策数据';
  const p = policies[0];
  return buildPolicyText(p.totalScore, p.scoreStructure, p.admissionLines, p.policyContent);
}

function summarizePolicyText(content: string): string {
  if (!content) return '';
  const pieces = content
    .replace(/\s+/g, ' ')
    .split(/[。；！?？]/)
    .map((part) => part.trim())
    .filter(Boolean);
  return pieces.slice(0, 3).map((part) => `- ${part}`).join('\n');
}

function compactSearchPolicyText(content: string): string {
  if (!content) return '';
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith('```'));
  return lines.slice(0, 10).join('\n');
}

interface SubjectGapItem {
  subject: string;
  current: number;
  max: number;
  currentRate: number;
  improveTarget: number;
}

interface GapActionPlan {
  gapScore: number;
  monthsLeft: number;
  monthlyTarget: number;
  weeklyTarget: number;
  weeklyHours: number;
  focusSubjects: SubjectGapItem[];
}

interface SubjectTargetItem {
  subject: string;
  max: number;
  isFilled: boolean;
  currentScore: number | null;
  targetScore: number;
}

interface TargetDecomposition {
  enteredCount: number;
  missingCount: number;
  enteredTotal: number;
  missingTargetTotal: number;
  impossible: boolean;
  items: SubjectTargetItem[];
}

function normalizeSubjectKey(subject: string): string {
  return subject.replace(/\s+/g, '').replace('&', '').replace('政治道法', '道法');
}

function getPolicySubjectKeys(policySubject: string): string[] {
  const key = normalizeSubjectKey(policySubject);
  if (key.includes('道法') || key.includes('政治')) return ['道法', '政治', '政治&道法'];
  if (key.includes('语文')) return ['语文'];
  if (key.includes('数学')) return ['数学'];
  if (key.includes('英语')) return ['英语'];
  if (key.includes('物理')) return ['物理'];
  if (key.includes('化学')) return ['化学'];
  if (key.includes('生物')) return ['生物'];
  if (key.includes('历史')) return ['历史'];
  if (key.includes('地理')) return ['地理'];
  if (key.includes('体育')) return ['体育'];
  return [policySubject];
}

function getScoreByPolicySubject(scores: Record<string, number>, policySubject: string): number {
  const key = normalizeSubjectKey(policySubject);
  if (key.includes('道法') || key.includes('政治')) {
    return scores['道法'] ?? scores['政治'] ?? scores['政治&道法'] ?? 0;
  }
  if (key.includes('语文')) return scores['语文'] ?? 0;
  if (key.includes('数学')) return scores['数学'] ?? 0;
  if (key.includes('英语')) return scores['英语'] ?? 0;
  if (key.includes('物理')) return scores['物理'] ?? 0;
  if (key.includes('化学')) return scores['化学'] ?? 0;
  if (key.includes('生物')) return scores['生物'] ?? 0;
  if (key.includes('历史')) return scores['历史'] ?? 0;
  if (key.includes('地理')) return scores['地理'] ?? 0;
  if (key.includes('体育')) return scores['体育'] ?? 0;
  return scores[policySubject] ?? 0;
}

function hasPolicySubjectScore(scores: Record<string, number>, policySubject: string): boolean {
  const keys = getPolicySubjectKeys(policySubject);
  return keys.some((key) => Object.prototype.hasOwnProperty.call(scores, key));
}

function allocateByMaxWeight(
  total: number,
  subjects: Array<{ subject: string; max: number }>,
): Record<string, number> {
  const output: Record<string, number> = {};
  if (subjects.length === 0 || total <= 0) return output;
  const maxTotal = subjects.reduce((sum, item) => sum + item.max, 0);
  if (maxTotal <= 0) return output;
  if (total >= maxTotal) {
    for (const item of subjects) output[item.subject] = item.max;
    return output;
  }

  const raw = subjects.map((item) => ({
    subject: item.subject,
    max: item.max,
    value: (item.max / maxTotal) * total,
  }));
  let assigned = 0;
  for (const item of raw) {
    const base = Math.min(item.max, Math.floor(item.value));
    output[item.subject] = base;
    assigned += base;
  }

  let remain = total - assigned;
  if (remain > 0) {
    const order = [...raw].sort((a, b) => (b.value - Math.floor(b.value)) - (a.value - Math.floor(a.value)));
    let idx = 0;
    while (remain > 0 && idx < order.length * 4) {
      const item = order[idx % order.length];
      if ((output[item.subject] ?? 0) < item.max) {
        output[item.subject] = (output[item.subject] ?? 0) + 1;
        remain -= 1;
      }
      idx += 1;
    }
  }
  return output;
}

function buildTargetDecomposition(input: {
  targetScore?: number;
  scoreStructure?: Record<string, number>;
  scores: Record<string, number>;
}): TargetDecomposition | null {
  const { targetScore, scoreStructure, scores } = input;
  if (!targetScore || !scoreStructure) return null;

  const subjects = Object.entries(scoreStructure).map(([subject, max]) => ({
    subject,
    max,
    isFilled: hasPolicySubjectScore(scores, subject),
    currentScore: hasPolicySubjectScore(scores, subject)
      ? Math.min(getScoreByPolicySubject(scores, subject), max)
      : null,
  }));
  if (subjects.length === 0) return null;

  const enteredTotal = subjects.reduce((sum, item) => sum + (item.currentScore ?? 0), 0);
  const missing = subjects.filter((item) => !item.isFilled);
  const remainNeeded = Math.max(targetScore - enteredTotal, 0);
  const missingMaxTotal = missing.reduce((sum, item) => sum + item.max, 0);
  const impossible = remainNeeded > missingMaxTotal;
  const missingTargets = allocateByMaxWeight(
    remainNeeded,
    missing.map((item) => ({ subject: item.subject, max: item.max })),
  );
  const items: SubjectTargetItem[] = subjects.map((item) => ({
    subject: item.subject,
    max: item.max,
    isFilled: item.isFilled,
    currentScore: item.currentScore,
    targetScore: item.isFilled ? (item.currentScore ?? 0) : (missingTargets[item.subject] ?? 0),
  }));

  return {
    enteredCount: subjects.filter((item) => item.isFilled).length,
    missingCount: missing.length,
    enteredTotal,
    missingTargetTotal: missing.reduce((sum, item) => sum + (missingTargets[item.subject] ?? 0), 0),
    impossible,
    items,
  };
}

function computeMonthsLeft(examYear: number): number {
  const examDate = new Date(`${examYear}-06-15T00:00:00`);
  const now = new Date();
  const monthDiff =
    (examDate.getFullYear() - now.getFullYear()) * 12 +
    (examDate.getMonth() - now.getMonth());
  return Math.max(1, monthDiff + 1);
}

function buildGapActionPlan(input: {
  targetScore?: number;
  totalScore: number;
  scoreStructure?: Record<string, number>;
  scores: Record<string, number>;
  weeklyStudyHoursText?: string;
  examYear: number;
}): GapActionPlan | null {
  const { targetScore, totalScore, scoreStructure, scores, weeklyStudyHoursText, examYear } = input;
  if (!targetScore || targetScore <= 0) return null;
  const gapScore = Math.max(targetScore - totalScore, 0);
  if (gapScore <= 0) return null;

  const weeklyHoursParsed = Number.parseFloat((weeklyStudyHoursText || '').trim());
  const weeklyHours = Number.isFinite(weeklyHoursParsed) && weeklyHoursParsed > 0 ? weeklyHoursParsed : 12;
  const monthsLeft = computeMonthsLeft(examYear);
  const monthlyTarget = Math.max(1, Math.ceil(gapScore / monthsLeft));
  const weeklyTarget = Math.max(1, Math.ceil(monthlyTarget / 4));

  const subjects = Object.entries(scoreStructure || {})
    .map(([subject, max]) => {
      const current = Math.min(getScoreByPolicySubject(scores, subject), max);
      const currentRate = max > 0 ? current / max : 0;
      const improveTarget = Math.max(2, Math.ceil((1 - currentRate) * 8));
      return { subject, current, max, currentRate, improveTarget };
    })
    .sort((a, b) => a.currentRate - b.currentRate)
    .slice(0, 3);

  return {
    gapScore,
    monthsLeft,
    monthlyTarget,
    weeklyTarget,
    weeklyHours,
    focusSubjects: subjects,
  };
}

function buildGapActionPrompt(plan: GapActionPlan | null): string {
  if (!plan) return '';
  const subjects = plan.focusSubjects
    .map(
      (item) =>
        `${item.subject} 当前${item.current}/${item.max}，建议每周提升${item.improveTarget}分对应训练量`,
    )
    .join('；');
  return `补分行动计划：距目标还差${plan.gapScore}分，剩余${plan.monthsLeft}个月；建议每月提升${plan.monthlyTarget}分、每周提升${plan.weeklyTarget}分；每周可投入${plan.weeklyHours}小时；重点科目：${subjects}。请把建议落到“每周做什么、做多少题、怎么验收”。`;
}

function buildParentCommunicationTemplate(plan: GapActionPlan | null): string[] {
  if (!plan) {
    return [
      '先共情：我知道你最近很辛苦，我们先把目标定小一点，一起慢慢来。',
      '先做一件小事：今天只做 1 份错题整理，完成就结束。',
      '先肯定再建议：你今天比昨天多坚持了 20 分钟，这就是进步。',
    ];
  }
  return [
    `开场共情：这段时间不容易，我们不谈大道理，只看每周进步 ${plan.weeklyTarget} 分。`,
    `目标协商：距离目标还差 ${plan.gapScore} 分，我们拆成每月 +${plan.monthlyTarget} 分，一起完成。`,
    '执行口令：今天先做“错题回炉 + 限时训练”，做完就休息，不追求一次完美。',
    '复盘模板：这周做得最好的一件事是什么？下周只改一件事，选最容易做到的那件。',
  ];
}

const Plan: React.FC = () => {
  const { stageSlug, stageConfig } = useRequiredStage();
  const { profile, regionText, updateProfile } = useStageProfile(stageSlug);
  const [examType, setExamType] = useState<ExamType>(stageConfig.examType);
  const [grade, setGrade] = useState<string>(stageConfig.grades[stageConfig.grades.length - 1]);
  const [profileDirty, setProfileDirty] = useState(false);

  useEffect(() => {
    setExamType(stageConfig.examType);
    setGrade(stageConfig.grades[stageConfig.grades.length - 1]);
  }, [stageConfig]);

  const [examMode, setExamMode] = useState<string>('');
  const currentYear = new Date().getFullYear();
  const [examYear, setExamYear] = useState<number>(currentYear + 1);
  const examDate = `${examYear}-${examType === '小升初' ? '06' : examType === '中考' ? '06' : '06'}-15`;
  const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => currentYear + i);

  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [county, setCounty] = useState('');
  const [region, setRegion] = useState('');
  const [isCustomRegion, setIsCustomRegion] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState('');
  const [customRegionText, setCustomRegionText] = useState('');

  const [scores, setScores] = useState<Record<string, number>>({});
  const [policies, setPolicies] = useState<AdmissionPolicy[]>([]);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policySearchContent, setPolicySearchContent] = useState('');
  const [policySearchLoading, setPolicySearchLoading] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [timelineContent, setTimelineContent] = useState('');
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [targetSchool, setTargetSchool] = useState('');
  const [targetScore, setTargetScore] = useState<number | undefined>(undefined);
  const [boardingType, setBoardingType] = useState('');

  const cities = PROVINCE_CITIES[selectedProvince] || [];
  const currentPolicy = policies.length > 0 ? policies[0] : null;
  const hasScores = Object.values(scores).some((v) => v > 0);
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const isGaokao = examType === '高考';
  const groupedLines = useMemo(() => {
    if (!currentPolicy?.admissionLines) return [] as Array<[string, typeof currentPolicy.admissionLines]>;
    const groups = new Map<string, typeof currentPolicy.admissionLines>();
    for (const line of currentPolicy.admissionLines) {
      if (!groups.has(line.batch)) groups.set(line.batch, []);
      groups.get(line.batch)!.push(line);
    }
    return Array.from(groups.entries());
  }, [currentPolicy]);
  const gapActionPlan = useMemo(
    () =>
      buildGapActionPlan({
        targetScore,
        totalScore,
        scoreStructure: currentPolicy?.scoreStructure,
        scores,
        weeklyStudyHoursText: profile.weeklyStudyHours,
        examYear,
      }),
    [targetScore, totalScore, currentPolicy?.scoreStructure, scores, profile.weeklyStudyHours, examYear],
  );
  const dataYearMismatch = currentPolicy ? currentPolicy.year !== examYear : false;
  const targetDecomposition = useMemo(
    () =>
      buildTargetDecomposition({
        targetScore,
        scoreStructure: currentPolicy?.scoreStructure,
        scores,
      }),
    [targetScore, currentPolicy?.scoreStructure, scores],
  );
  const communicationTemplate = useMemo(
    () => buildParentCommunicationTemplate(gapActionPlan),
    [gapActionPlan],
  );

  const handleScoreChange = useCallback((key: string, val: string): void => {
    const num = val === '' ? 0 : parseInt(val, 10);
    setScores((prev) => ({ ...prev, [key]: isNaN(num) ? 0 : num }));
  }, []);

  const fetchPolicies = useCallback(async (r: string): Promise<void> => {
    setPolicyLoading(true);
    try {
      const res = await plan.getAdmissionPolicies(r);
      setPolicies(res.items);
    } catch {
      toast.error('获取政策数据失败');
    } finally {
      setPolicyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!profile.updatedAt) return;
    const fill = getPlanAutofillFromProfile(profile);
    if (fill.selectedProvince) setSelectedProvince(fill.selectedProvince);
    if (fill.selectedCity) setSelectedCity(fill.selectedCity);
    if (fill.county) setCounty(fill.county);
    if (fill.region) {
      setRegion(fill.region);
      fetchPolicies(fill.region);
    }
    if (fill.grade) setGrade(fill.grade);
    if (fill.targetSchool) setTargetSchool(fill.targetSchool);
    if (fill.targetScore != null) setTargetScore(fill.targetScore);
    if (fill.boardingType) setBoardingType(fill.boardingType);
    if (fill.examMode) setExamMode(fill.examMode);
    if (fill.examYear) setExamYear(fill.examYear);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅在档案保存时回填
  }, [profile.updatedAt]);

  useEffect(() => {
    if (!targetSchool || !region || stageConfig.slug === 'elementary') return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const db = await policyApi.searchSchools(region);
        if (cancelled) return;
        const matched = db.schools.find(
          (item) =>
            item.name === targetSchool ||
            item.name.includes(targetSchool) ||
            targetSchool.includes(item.name),
        );
        if (matched?.score) {
          setTargetScore(matched.score);
          return;
        }
      } catch {
        // ignore db lookup failures
      }
      try {
        const score = await fetchSchoolScoreByName({
          region,
          schoolName: targetSchool,
          examType: stageConfig.slug === 'high' ? '高考' : '中考',
        });
        if (!cancelled && score != null) {
          setTargetScore(score);
        }
      } catch {
        // ignore internet match failures
      }
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [targetSchool, region, stageConfig.slug]);

  const handleSyncProfileBack = useCallback(() => {
    updateProfile({
      province: selectedProvince,
      city: selectedCity,
      county,
      grade,
      targetSchool,
      targetScore,
      boardingType: (boardingType as '' | 'day' | 'boarding') || '',
      examMode,
      examDate: examDate.slice(0, 10),
    });
    toast.success('已同步回学段主页档案');
    setProfileDirty(false);
  }, [updateProfile, selectedProvince, selectedCity, county, grade, targetSchool, targetScore, boardingType, examMode, examDate]);

  const handlePolicySearch = useCallback(async (r: string): Promise<void> => {
    if (!r) { toast.error('请先选择地区'); return; }
    setPolicySearchLoading(true);
    setPolicySearchContent('');
    try {
      const currentY = new Date().getFullYear();
      const searchYears = [String(currentY), String(currentY - 1), String(currentY - 2)];
      let full = '';
      for (const y of searchYears) {
        for await (const chunk of streamPolicySearch({ region: r, year: y, keyword: `${examType}录取分数线 政策` })) {
          full += chunk;
          setPolicySearchContent(full);
        }
      }
    } catch {
      toast.error('网络政策搜索失败');
    } finally {
      setPolicySearchLoading(false);
    }
  }, [examType]);

  const handleProvinceChange = useCallback((val: string): void => {
    setProfileDirty(true);
    if (val === '__custom__') {
      setIsCustomRegion(true);
      setRegion(customRegionText);
    } else {
      setIsCustomRegion(false);
      setSelectedProvince(val);
      setSelectedCity('');
      setCounty('');
      setRegion(val);
      setReportContent('');
      setTimelineContent('');
      setPolicySearchContent('');
      if (val) { fetchPolicies(val); handlePolicySearch(val); }
    }
  }, [customRegionText, fetchPolicies, handlePolicySearch]);

  const handleCityChange = useCallback((val: string): void => {
    setProfileDirty(true);
    setSelectedCity(val);
    setCounty('');
    const r = [selectedProvince, val].filter(Boolean).join(' ');
    setRegion(r);
    setReportContent('');
    setTimelineContent('');
    setPolicySearchContent('');
    if (r) { fetchPolicies(r); handlePolicySearch(r); }
  }, [selectedProvince, fetchPolicies, handlePolicySearch]);

  const handleCountyChange = useCallback((val: string): void => {
    setProfileDirty(true);
    setCounty(val);
    const r = [selectedProvince, selectedCity, val].filter(Boolean).join(' ');
    setRegion(r);
    setReportContent('');
    setTimelineContent('');
    setPolicySearchContent('');
    if (r) { fetchPolicies(r); handlePolicySearch(r); }
  }, [selectedProvince, selectedCity, fetchPolicies, handlePolicySearch]);

  const handleCustomRegionSubmit = useCallback((): void => {
    const trimmed = customRegionText.trim();
    if (!trimmed) return;
    setRegion(trimmed);
    setReportContent('');
    setTimelineContent('');
    setPolicySearchContent('');
    fetchPolicies(trimmed);
    handlePolicySearch(trimmed);
  }, [customRegionText, fetchPolicies, handlePolicySearch]);

  const handleExamTypeChange = useCallback((type: ExamType): void => {
    setExamType(type);
    setGrade(GRADE_OPTIONS[type][GRADE_OPTIONS[type].length - 1] || '');
    setScores({});
    setExamMode('');
    setReportContent('');
    setTimelineContent('');
    setPolicySearchContent('');
  }, []);

  const gradeOptions = (GRADE_OPTIONS[examType] || []).filter((g) =>
    stageConfig.grades.includes(g),
  );

  const handleGenerateReport = useCallback(async (): Promise<void> => {
    if (!region) { toast.error('请先选择地区'); return; }
    if (!hasScores) { toast.error('请先输入成绩'); return; }
    setReportLoading(true);
    setReportContent('');
    try {
      await plan.createPlanRecord({ region, scores });
      const scoreMaxValues: Record<string, number> = {
        '语文': 150, '数学': 150, '英语': 150,
        '物理': 100, '化学': 100, '生物': 100,
        '历史': 100, '地理': 100, '政治': 100, '政治&道法': 100,
      };
      const planCtx: PlanFormContext = {
        examType,
        grade,
        region,
        scores,
        scoreMaxValues,
        examMode: examMode || undefined,
        examYear,
        targetSchool: targetSchool || undefined,
        targetScore,
        boardingType: boardingType || undefined,
      };
      const scoresText = buildScoresText(scores, scoreMaxValues);
      const policyText = buildPolicyContext(policies);
      const additionalInfo = buildPlanAdditionalInfo(planCtx, { stageSlug, profile });
      const actionPrompt = buildGapActionPrompt(gapActionPlan);
      const mergedInfo = [additionalInfo, actionPrompt].filter(Boolean).join('；');
      let full = '';
      for await (const chunk of streamPlanReport({
        student_scores: scoresText,
        region_admission_policy: policyText,
        student_additional_info: mergedInfo,
      })) {
        full += chunk;
        setReportContent(full);
      }
    } catch {
      toast.error('生成规划报告失败');
    } finally {
      setReportLoading(false);
    }
  }, [region, scores, policies, hasScores, grade, examDate, examType, examMode, examYear, targetSchool, targetScore, boardingType, stageSlug, profile, gapActionPlan]);

  const handleGenerateTimeline = useCallback(async (): Promise<void> => {
    if (!region) { toast.error('请先选择地区'); return; }
    setTimelineLoading(true);
    setTimelineContent('');
    try {
      let full = '';
      const currentYear = new Date().getFullYear();
      const gradeWithHint = `${grade}（请按${examYear}年考试倒推，仅输出${currentYear}年及以后关键时间节点）`;
      for await (const chunk of streamTimeline({ current_grade: gradeWithHint, region, exam_year: String(examYear) })) {
        full += chunk;
        setTimelineContent(full);
      }
    } catch {
      toast.error('生成时间路线图失败');
    } finally {
      setTimelineLoading(false);
    }
  }, [region, grade, examYear]);

  const handleCopyReport = useCallback(async (): Promise<void> => {
    if (!reportContent) return;
    try {
      await navigator.clipboard.writeText(reportContent);
      toast.success('已复制到剪贴板');
    } catch {
      toast.error('复制失败');
    }
  }, [reportContent]);

  const config = EXAM_TYPE_CONFIG[examType];

  return (
    <div className="min-h-screen bg-paper-dots p-6 font-hand">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header + Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" className="font-hand -ml-2" asChild>
            <Link to={stagePath(stageSlug)}>
              <ArrowLeft className="mr-1 size-4" />
              返回{stageConfig.label}主页
            </Link>
          </Button>
          <h1 className="font-marker text-3xl font-bold text-ink">{stageConfig.label} · 升学规划</h1>
          <span className="rounded-full border-2 border-ink bg-postit-yellow px-3 py-0.5 text-sm font-bold">
            {examType}
          </span>
        </div>

        <ProfileAutofillBanner
          stageSlug={stageSlug}
          profile={profile}
          regionText={regionText}
          showSyncBack={profileDirty}
          onSyncBack={handleSyncProfileBack}
        />

        {/* Top Input Bar */}
        <WobblyCard variant="white" decoration="tape" wobblyIndex={0} hoverable={false} className="p-5">
          <div className="space-y-4">
            {/* Row 1: Region + Exam Date + Gaokao Mode */}
            <div className="flex flex-wrap items-end gap-4">
              {/* Region cascade */}
              <div className="flex gap-2">
                <div className="w-32">
                  <label className="mb-1 block text-sm font-bold text-ink">省份</label>
                  <Select value={isCustomRegion ? '__custom__' : toSelectValue(selectedProvince)} onValueChange={handleProvinceChange}>
                    <SelectTrigger className="font-hand">
                      <SelectValue placeholder="省/直辖市" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-1" onKeyDown={(e) => e.stopPropagation()}>
                        <Input placeholder="搜索..." value={provinceSearch} onChange={(e) => setProvinceSearch(e.target.value)} className="h-8 text-xs" />
                      </div>
                      {PROVINCES.filter((p) => !provinceSearch || p.includes(provinceSearch)).map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                      <SelectItem value="__custom__">手动输入...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!isCustomRegion && selectedProvince && (
                  <div className="w-28">
                    <label className="mb-1 block text-sm font-bold text-ink">市/区</label>
                    <Select value={toSelectValue(selectedCity)} onValueChange={handleCityChange}>
                      <SelectTrigger className="font-hand">
                        <SelectValue placeholder="市/区" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {!isCustomRegion && selectedCity && (
                  <div className="w-28">
                    <label className="mb-1 block text-sm font-bold text-ink">区/县</label>
                    <Input value={county} onChange={(e) => handleCountyChange(e.target.value)} placeholder="选填" className="font-hand" />
                  </div>
                )}
              </div>
              {isCustomRegion && (
                <div className="flex items-end gap-2">
                  <Input
                    value={customRegionText}
                    onChange={(e) => setCustomRegionText(e.target.value)}
                    placeholder="输入地区名称"
                    className="w-40 font-hand"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCustomRegionSubmit(); }}
                  />
                  <Button size="sm" variant="secondary" onClick={handleCustomRegionSubmit} className="border-2 border-ink font-hand">
                    <Search className="size-3.5" />
                    查询
                  </Button>
                </div>
              )}

               {/* Grade Selector */}
              <div className="w-28">
                <label className="mb-1 block text-sm font-bold text-ink">年级</label>
                <Select value={toSelectValue(grade)} onValueChange={(v) => { setProfileDirty(true); setGrade(v); }}>
                  <SelectTrigger className="font-hand">
                    <SelectValue placeholder="选择年级" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Exam Year */}
              <div className="w-36">
                <label className="mb-1 block text-sm font-bold text-ink">
                  {examYear}年{examType}
                </label>
                <Select value={String(examYear)} onValueChange={(v) => setExamYear(Number(v))}>
                  <SelectTrigger className="font-hand">
                    <SelectValue placeholder="选择年份" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEAR_OPTIONS.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}年</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gaokao Mode */}
              {isGaokao && (
                <div className="w-52">
                  <label className="mb-1 block text-sm font-bold text-ink">选科模式</label>
                  <Select value={toSelectValue(examMode)} onValueChange={(v) => { setProfileDirty(true); setExamMode(v); }}>
                    <SelectTrigger className="font-hand">
                      <SelectValue placeholder="选择模式" />
                    </SelectTrigger>
                    <SelectContent>
                      {HS_MODES.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="min-w-[160px] flex-1">
                <label className="mb-1 block text-sm font-bold text-ink">{stageConfig.targetLabel}</label>
                <Input
                  value={targetSchool}
                  onChange={(e) => { setProfileDirty(true); setTargetSchool(e.target.value); }}
                  placeholder={isGaokao ? '目标院校' : '目标学校'}
                  className="font-hand"
                />
              </div>
              {stageConfig.slug !== 'elementary' && (
                <div className="w-36">
                  <label className="mb-1 block text-sm font-bold text-ink">匹配分数线</label>
                  <Input
                    value={targetScore != null ? String(targetScore) : ''}
                    onChange={(e) => {
                      setProfileDirty(true);
                      const value = e.target.value.trim();
                      setTargetScore(value ? Number(value) : undefined);
                    }}
                    placeholder="自动匹配"
                    className="font-hand"
                  />
                </div>
              )}

              <div className="w-28">
                <label className="mb-1 block text-sm font-bold text-ink">走读/住读</label>
                <Select
                  value={boardingType || '__none__'}
                  onValueChange={(v) => {
                    setProfileDirty(true);
                    setBoardingType(v === '__none__' ? '' : v);
                  }}
                >
                  <SelectTrigger className="font-hand"><SelectValue placeholder="请选择" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">未选</SelectItem>
                    <SelectItem value="day">走读</SelectItem>
                    <SelectItem value="boarding">住读</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Scores + Actions */}
            <div className="flex flex-wrap items-end gap-4">
              <PlanScoreInput examType={examType} examMode={examMode || undefined} scores={scores} onScoreChange={handleScoreChange} />
              <div className="flex gap-2">
                <Button onClick={handleGenerateReport} disabled={reportLoading || !region || !hasScores} className="border-[3px] border-ink font-hand shadow-hard">
                  <FileText className="size-4" />
                  {reportLoading ? '生成中...' : '生成规划报告'}
                </Button>
                <Button variant="secondary" onClick={handleGenerateTimeline} disabled={timelineLoading || !region} className="border-[3px] border-ink bg-postit-yellow font-hand shadow-hard">
                  <Clock className="size-4" />
                  {timelineLoading ? '生成中...' : '生成时间路线图'}
                </Button>
              </div>
            </div>
          </div>
        </WobblyCard>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Left: Policy & Score Lines */}
          <div className="w-96 shrink-0">
            <WobblyCard variant="yellow" decoration="tack" wobblyIndex={1} hoverable={false} className="p-5" rotate={-0.5}>
               <h2 className="mb-4 font-marker text-xl font-bold text-ink">政策与分数线</h2>
              {policyLoading ? (
                <div className="py-8 text-center text-muted-foreground">加载政策数据中...</div>
              ) : !currentPolicy ? (
                <div className="space-y-3">
                  <div className="py-4 text-center text-muted-foreground">
                    {region ? '本地暂无该地区政策数据' : '请先选择地区查看政策'}
                  </div>
                  {region && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePolicySearch(region)}
                      disabled={policySearchLoading}
                      className="w-full border-2 border-ink font-hand"
                    >
                      <Search className="size-3.5" />
                      {policySearchLoading ? '搜索中...' : '联网搜索政策数据'}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                   <div className="text-center">
                     <span className="text-sm text-muted-foreground">
                       {currentPolicy.region} {currentPolicy.year}年{examType}总分
                     </span>
                     <div className="font-marker text-3xl font-bold text-marker-red">{currentPolicy.totalScore}分</div>
                     {dataYearMismatch && (
                       <span className="mt-1 inline-block rounded border-2 border-dashed border-pen-blue px-2 py-0.5 text-xs text-pen-blue">
                         当前显示 {currentPolicy.year} 年数据（最新可用）
                       </span>
                     )}
                   </div>
                  <div>
                    <h3 className="mb-2 font-marker text-base font-bold">科目分值构成</h3>
                    <div className="space-y-1">
                      {Object.entries(currentPolicy.scoreStructure).map(([subject, maxScore]) => (
                        <div key={subject} className="flex items-center justify-between border-b-2 border-dashed border-ink/20 pb-1">
                          <span className="font-hand">{subject}</span>
                          <span className="font-marker font-bold">{maxScore}分</span>
                        </div>
                      ))}
                    </div>
                  </div>
                   {groupedLines.length > 0 && (
                    <div>
                      <h3 className="mb-2 font-marker text-base font-bold">录取分数线</h3>
                      <div className="space-y-3">
                        {groupedLines.map(([batch, lines]) => (
                          <div key={batch}>
                            <div className="mb-1 text-xs font-bold text-pen-blue">{batch}</div>
                            <table className="w-full font-hand text-sm">
                              <thead>
                                <tr className="border-b-[3px] border-ink">
                                  <th className="py-1.5 text-left font-marker">学校</th>
                                  <th className="py-1.5 text-right font-marker">分数</th>
                                  <th className="py-1.5 text-right font-marker">录取率</th>
                                </tr>
                              </thead>
                              <tbody>
                                {lines.map((line: AdmissionLine, idx: number) => (
                                  <tr key={idx} className="border-b-2 border-dashed border-ink/20">
                                    <td className="py-1.5">{line.school}</td>
                                    <td className="py-1.5 text-right font-bold text-marker-red">{line.score}</td>
                                    <td className="py-1.5 text-right text-xs text-pen-blue">{line.rate || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    </div>
                   )}
                  {currentPolicy.policyContent && (
                    <div>
                      <h3 className="mb-2 font-marker text-base font-bold">政策关键信息</h3>
                      <div className="prose prose-sm max-w-none font-hand text-muted-foreground">
                        <Streamdown>{summarizePolicyText(currentPolicy.policyContent)}</Streamdown>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </WobblyCard>

            {/* Internet Policy Search Results */}
            {(policySearchContent || policySearchLoading) && (
              <WobblyCard variant="white" decoration="tape" wobblyIndex={11} hoverable={false} className="mt-4 p-5" rotate={0.3}>
                <h2 className="mb-3 font-marker text-lg font-bold text-ink">网络政策搜索</h2>
                <p className="mb-3 text-xs text-muted-foreground">
                  数据来源互联网，已交叉验证过去 3 年分数线信息
                </p>
                {policySearchLoading && !policySearchContent ? (
                  <div className="py-6 text-center text-muted-foreground">
                    <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
                    正在搜索该地区近 3 年政策...
                  </div>
                ) : policySearchContent ? (
                  <div className="prose prose-sm max-w-none font-hand">
                    <Streamdown>{compactSearchPolicyText(policySearchContent)}</Streamdown>
                  </div>
                ) : null}
              </WobblyCard>
            )}
          </div>

          {/* Right: Report + School Recommendations */}
          <div className="min-w-0 flex-1 space-y-6">
            {/* School Recommendations */}
            {currentPolicy && currentPolicy.admissionLines.length > 0 && hasScores && (
              <WobblyCard variant="yellow" decoration="tack" wobblyIndex={2} hoverable={false} className="p-5">
                <h2 className="mb-4 font-marker text-xl font-bold text-ink">院校推荐</h2>
                <PlanSchoolRecommend totalScore={totalScore} admissionLines={currentPolicy.admissionLines} />
              </WobblyCard>
            )}

            {targetScore != null && hasScores && (
              <WobblyCard variant="white" decoration="tape" wobblyIndex={8} hoverable={false} className="p-5">
                <h2 className="mb-3 font-marker text-lg font-bold text-ink">一眼看懂当前差距</h2>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border-2 border-ink/20 bg-accent p-3">
                    <p className="text-xs text-ink/60">当前总分</p>
                    <p className="font-marker text-2xl text-ink">{totalScore}</p>
                  </div>
                  <div className="rounded-lg border-2 border-ink/20 bg-accent p-3">
                    <p className="text-xs text-ink/60">目标分数线</p>
                    <p className="font-marker text-2xl text-ink">{targetScore}</p>
                  </div>
                  <div className="rounded-lg border-2 border-marker-red/40 bg-marker-red/5 p-3">
                    <p className="text-xs text-ink/60">还差多少分</p>
                    <p className="font-marker text-2xl text-marker-red">
                      {Math.max(targetScore - totalScore, 0)}
                    </p>
                  </div>
                </div>
              </WobblyCard>
            )}

            {gapActionPlan && (
              <WobblyCard variant="yellow" decoration="tack" wobblyIndex={9} hoverable={false} className="p-5">
                <h2 className="mb-3 font-marker text-lg font-bold text-ink">补分行动计划（自动生成）</h2>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-lg border-2 border-ink/20 bg-white/70 p-3">
                    <p className="text-xs text-ink/60">总差距</p>
                    <p className="font-marker text-2xl text-marker-red">{gapActionPlan.gapScore} 分</p>
                  </div>
                  <div className="rounded-lg border-2 border-ink/20 bg-white/70 p-3">
                    <p className="text-xs text-ink/60">每月目标</p>
                    <p className="font-marker text-2xl text-ink">+{gapActionPlan.monthlyTarget}</p>
                  </div>
                  <div className="rounded-lg border-2 border-ink/20 bg-white/70 p-3">
                    <p className="text-xs text-ink/60">每周目标</p>
                    <p className="font-marker text-2xl text-ink">+{gapActionPlan.weeklyTarget}</p>
                  </div>
                  <div className="rounded-lg border-2 border-ink/20 bg-white/70 p-3">
                    <p className="text-xs text-ink/60">建议投入</p>
                    <p className="font-marker text-2xl text-ink">{gapActionPlan.weeklyHours}h/周</p>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="mb-2 font-marker text-base font-bold">重点提分科目（先补短板）</h3>
                  <div className="space-y-2">
                    {gapActionPlan.focusSubjects.map((item) => (
                      <div key={item.subject} className="rounded-md border-2 border-dashed border-ink/20 bg-white/70 px-3 py-2 text-sm">
                        <span className="font-marker mr-2">{item.subject}</span>
                        当前 {item.current}/{item.max}（得分率 {Math.round(item.currentRate * 100)}%）
                        ，建议每周先提升约 {item.improveTarget} 分对应训练量
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-ink/60">
                    执行建议：每周固定 2 次错题回炉 + 1 次限时套卷；每周日复盘“本周提分 / 下周目标”。
                  </p>
                </div>
              </WobblyCard>
            )}

            {targetDecomposition && targetDecomposition.enteredCount > 0 && targetDecomposition.missingCount > 0 && (
              <WobblyCard variant="white" decoration="tape" wobblyIndex={10} hoverable={false} className="p-5">
                <h2 className="mb-3 font-marker text-lg font-bold text-ink">目标分拆解（已填 {targetDecomposition.enteredCount} 科）</h2>
                <p className="mb-2 text-sm text-ink/70">
                  你已填写科目合计 {targetDecomposition.enteredTotal} 分；其余 {targetDecomposition.missingCount} 科建议目标合计{' '}
                  {targetDecomposition.missingTargetTotal} 分。
                </p>
                {targetDecomposition.impossible && (
                  <p className="mb-2 rounded border-2 border-marker-red/40 bg-marker-red/5 px-3 py-2 text-xs text-marker-red">
                    按当前已填分数，剩余科目即使满分也难以达到目标线，建议同步下调目标或提高已填科目预期。
                  </p>
                )}
                <div className="space-y-2">
                  {targetDecomposition.items.map((item) => (
                    <div key={item.subject} className="rounded-md border-2 border-dashed border-ink/20 bg-accent/40 px-3 py-2 text-sm">
                      <span className="font-marker mr-2">{item.subject}</span>
                      当前：
                      {item.currentScore == null ? '未填写' : `${item.currentScore}/${item.max}`}，
                      目标：{item.targetScore}/{item.max}
                      {!item.isFilled && <span className="ml-2 text-pen-blue">（建议补到该分数）</span>}
                    </div>
                  ))}
                </div>
              </WobblyCard>
            )}

            <WobblyCard variant="yellow" decoration="tack" wobblyIndex={12} hoverable={false} className="p-5">
              <h2 className="mb-3 font-marker text-lg font-bold text-ink">家长沟通模板（让孩子愿意执行）</h2>
              <div className="space-y-2 text-sm text-ink/80">
                {communicationTemplate.map((line, idx) => (
                  <p key={idx} className="rounded-md border border-ink/15 bg-white/70 px-3 py-2">
                    {line}
                  </p>
                ))}
              </div>
              <p className="mt-3 text-xs text-ink/60">
                建议顺序：先共情 → 再谈小目标 → 最后给选择权（先做哪一科由孩子选），执行率会更高。
              </p>
            </WobblyCard>

            {/* AI Report */}
            <WobblyCard variant="white" decoration="tape" wobblyIndex={4} hoverable={false} className="p-5" rotate={0.3}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-marker text-xl font-bold text-ink">AI 升学规划报告</h2>
                {reportContent && (
                  <Button variant="outline" size="sm" onClick={handleCopyReport} className="border-2 border-ink font-hand shadow-hard-sm">
                    <Copy className="size-3.5" />
                    复制全文
                  </Button>
                )}
              </div>
              {reportLoading && !reportContent ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="font-marker text-lg text-ink animate-pulse">AI 正在分析规划方案...</div>
                  <div className="mt-2 text-sm text-muted-foreground">根据成绩和政策为您生成个性化升学规划</div>
                </div>
              ) : reportContent ? (
                <div className="prose prose-sm max-w-none font-hand"><Streamdown>{reportContent}</Streamdown></div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <FileText className="mb-3 size-12 opacity-30" />
                  <p>输入成绩后，点击「生成规划报告」</p>
                  <p className="text-sm">AI 将根据成绩与政策生成升学建议</p>
                </div>
              )}
            </WobblyCard>
          </div>
        </div>

        {/* Bottom: Timeline */}
        <PlanTimeline content={timelineContent} loading={timelineLoading} examType={examType} examDate={examDate} grade={grade} />
      </div>
    </div>
  );
};

export default Plan;
