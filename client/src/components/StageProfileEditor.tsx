import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Loader2, MapPin, Save, Search, Target, User } from 'lucide-react';
import { toast } from 'sonner';
import WobblyCard from '@client/src/components/WobblyCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { StageConfig } from '@client/src/config/stages';
import type { StageProfile } from '@client/src/types/stage-profile';
import { toSelectValue } from '@client/src/lib/utils';
import {
  extractSubjectMaxHintsFromPolicyText,
  fetchSchoolScoreByName,
  getKnownExamScoreNotes,
  getKnownExamTotalScore,
  getKnownSubjectScoreNote,
  getKnownSubjectMaxHints,
  hasKnownExamScoreAuthority,
  searchSchoolCandidates,
  streamPolicySearch,
  type SchoolCandidate,
} from '@client/src/api/plugins';
import { policy as policyApi } from '@client/src/api';
import { resolveGaokaoModeByProvince } from '@client/src/utils/gaokao-mode';
import {
  ALL_SUBJECTS,
  getVersionForProvinceSubject,
} from '@client/src/pages/Knowledge/KnowledgeFilterPanel';
import { resolveProvinceByCity } from '@client/src/utils/region-priority';

interface StageProfileEditorProps {
  stageConfig: StageConfig;
  profile: StageProfile;
  onSave: (profile: StageProfile) => void;
  countdownDays: number | null;
}

type CandidateTier = '冲刺' | '匹配' | '保底';

const SIX_THREE_GRADES = {
  elementary: ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'],
  middle: ['初一', '初二', '初三'],
} as const;

const FIVE_FOUR_GRADES = {
  elementary: ['一年级', '二年级', '三年级', '四年级', '五年级'],
  middle: ['初一', '初二', '初三', '初四'],
} as const;

function resolveSubjectMaxForDisplay(subject: string, hints: Record<string, number>): number | undefined {
  if (hints[subject]) return hints[subject];
  if (subject === '政治') return hints['道法'] || hints['政治&道法'];
  if (subject === '语文') return hints['语'];
  if (subject === '数学') return hints['数'];
  if (subject === '英语') return hints['英'];
  return undefined;
}

function parseCurrentTotalScore(scoresOverview: string): number | null {
  const text = scoresOverview.trim();
  if (!text) return null;
  const totalMatch = text.match(/总分\s*[:：]?\s*(\d{2,4})/);
  if (totalMatch) return Number.parseInt(totalMatch[1], 10);

  const numbers = (text.match(/\d{1,3}/g) || [])
    .map((item) => Number.parseInt(item, 10))
    .filter((item) => Number.isFinite(item));
  if (numbers.length === 0) return null;
  if (numbers.length === 1) return numbers[0];
  const sum = numbers.reduce((acc, cur) => acc + cur, 0);
  return sum > 0 ? sum : null;
}

function extractExamTotalScore(text: string): number | null {
  const normalized = text.replace(/\s+/g, ' ');
  const patterns = [
    /(?:总分|满分|总成绩|总分值)[^0-9]{0,12}(\d{3,4})\s*分/,
    /(\d{3,4})\s*分[^。；，,]{0,12}(?:总分|满分|总成绩|总分值)/,
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    const value = match ? Number.parseInt(match[1], 10) : NaN;
    if (Number.isFinite(value) && value >= 100 && value <= 1000) return value;
  }
  return null;
}

const StageProfileEditor: React.FC<StageProfileEditorProps> = ({
  stageConfig,
  profile,
  onSave,
  countdownDays,
}) => {
  const [draft, setDraft] = useState<StageProfile>(profile);
  const [schoolKeyword, setSchoolKeyword] = useState('');
  const [schoolCandidates, setSchoolCandidates] = useState<SchoolCandidate[]>([]);
  const [searchingSchool, setSearchingSchool] = useState(false);
  const [matchingScore, setMatchingScore] = useState(false);
  const [scoreSummary, setScoreSummary] = useState('');
  const [scoreSummaryLoading, setScoreSummaryLoading] = useState(false);
  const [subjectMaxHints, setSubjectMaxHints] = useState<Record<string, number>>({});
  const [scoreHintFromAuthority, setScoreHintFromAuthority] = useState(false);
  const [selectedTextbookSubject, setSelectedTextbookSubject] = useState('数学');
  const draftRef = useRef<StageProfile>(profile);

  useEffect(() => {
    setDraft(profile);
    draftRef.current = profile;
    setSchoolKeyword(profile.targetSchool || '');
  }, [profile.updatedAt]);

  const schoolSystem = draft.schoolSystem || '6-3';
  const gradeOptions = useMemo(() => {
    if (stageConfig.slug === 'high') return ['高一', '高二', '高三'];
    const options = schoolSystem === '5-4' ? FIVE_FOUR_GRADES : SIX_THREE_GRADES;
    return [...options[stageConfig.slug]];
  }, [schoolSystem, stageConfig.slug]);
  const safeGrade = gradeOptions.includes(draft.grade) ? draft.grade : '';
  const cityProvince = useMemo(() => resolveProvinceByCity(draft.city), [draft.city]);
  const effectiveProvince = cityProvince || draft.province;
  const gaokaoModeMatch = useMemo(
    () => resolveGaokaoModeByProvince(effectiveProvince),
    [effectiveProvince],
  );

  const buildProfileForSave = useCallback(
    (source: StageProfile): StageProfile => ({
      ...source,
      grade: gradeOptions.includes(source.grade) ? source.grade : '',
      schoolSystem: stageConfig.slug === 'high' ? '' : schoolSystem,
      examMode: stageConfig.slug === 'high' ? gaokaoModeMatch.mode : source.examMode,
    }),
    [gradeOptions, stageConfig.slug, schoolSystem, gaokaoModeMatch.mode],
  );

  const patch = (partial: Partial<StageProfile>) => {
    const next: StageProfile = { ...draftRef.current, ...partial };
    draftRef.current = next;
    setDraft(next);
    onSave(buildProfileForSave(next));
  };

  const handleProvinceTextChange = (next: string) => {
    const text = next.trim();
    const policyProvince = cityProvince || text;
    const nextGaokaoMode = stageConfig.slug === 'high'
      ? resolveGaokaoModeByProvince(policyProvince).mode
      : draft.examMode;
    patch({
      province: text,
      examMode: nextGaokaoMode,
    });
  };

  const handleCityTextChange = (next: string) => {
    const text = next.trim();
    setSchoolKeyword('');
    setSchoolCandidates([]);
    const inferredProvince = resolveProvinceByCity(text) || draft.province;
    const nextGaokaoMode = stageConfig.slug === 'high'
      ? resolveGaokaoModeByProvince(inferredProvince).mode
      : draft.examMode;
    patch({
      city: text,
      county: '',
      targetSchool: '',
      targetScore: undefined,
      examMode: nextGaokaoMode,
    });
  };

  const handleCountyTextChange = (next: string) => {
    patch({ county: next.trim() });
  };

  const handleSave = () => {
    if (!draft.province) {
      toast.error('请选择省份');
      return;
    }
    if (!draft.city) {
      toast.error('请选择城市');
      return;
    }
    onSave(buildProfileForSave(draft));
    toast.success('已保存个人信息，下面 4 个模块会自动带入');
  };

  const regionSummary = useMemo(
    () => draft.city
      ? [draft.city, draft.county].filter(Boolean).join(' ')
      : [draft.province, draft.county].filter(Boolean).join(' '),
    [draft.province, draft.city, draft.county],
  );

  useEffect(() => {
    if (!draft.province || !draft.city) {
      setScoreSummary('');
      setSubjectMaxHints({});
      setScoreHintFromAuthority(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setScoreSummaryLoading(true);
      try {
        const region = draft.city
          ? [draft.city, draft.county].filter(Boolean).join(' ')
          : draft.province;
        const year = String(new Date().getFullYear());
        const keyword = `${stageConfig.examType} 考试科目 录取计分满分 总分构成 官方`;
        const knownHints = getKnownSubjectMaxHints(region, stageConfig.examType);
        const hasAuthority = hasKnownExamScoreAuthority(region, stageConfig.examType);
        setScoreHintFromAuthority(hasAuthority);

        // 权威城市：先立刻展示本地核验分值，再后台联网补充校验文案
        if (hasAuthority && Object.keys(knownHints).length > 0) {
          setSubjectMaxHints(knownHints);
          const entries = Object.entries(knownHints);
          const total = getKnownExamTotalScore(region, stageConfig.examType) ?? entries.reduce((sum, [, v]) => sum + v, 0);
          const detail = entries.map(([subject, value]) => `${subject}${value}`).join('、');
          const scoreNotes = getKnownExamScoreNotes(region, stageConfig.examType);
          const noteText = scoreNotes.length > 0 ? `；${scoreNotes.join('；')}` : '';
          setScoreSummary(`本地区满分：已识别${total}分（${detail}，以官方当年政策为准${noteText}）`);
          setScoreSummaryLoading(false);
        }

        let full = '';
        for await (const chunk of streamPolicySearch({ region, year, keyword })) {
          if (cancelled) return;
          full += chunk;
        }
        if (cancelled) return;

        // 权威表始终覆盖联网解析，避免「卷面100/百分制」污染
        const hints = { ...extractSubjectMaxHintsFromPolicyText(full), ...knownHints };
        setSubjectMaxHints(hints);
        const knownOrder = Object.keys(knownHints);
        const entries = (
          knownOrder.length > 0
            ? knownOrder.map((subject) => [subject, hints[subject]] as const)
            : Object.entries(hints)
        ).filter(([, value]) => Number.isFinite(value) && value > 0);
        if (entries.length === 0) {
          setScoreSummary('本地区满分：暂无明确数据，需人工核验');
          return;
        }
        const explicitTotal = getKnownExamTotalScore(region, stageConfig.examType) ?? extractExamTotalScore(full);
        // 无权威总分时，不拿科目相加冒充「本地区满分」，避免误导
        const total = explicitTotal;
        const detail = entries.map(([subject, value]) => `${subject}${value}`).join('、');
        const scoreNotes = getKnownExamScoreNotes(region, stageConfig.examType);
        const noteText = scoreNotes.length > 0 ? `；${scoreNotes.join('；')}` : '';
        if (total != null) {
          setScoreSummary(`本地区满分：已识别${total}分（${detail}，以官方当年政策为准${noteText}）`);
        } else {
          setScoreSummary(`本地区科目满分：已识别（${detail}）；总分待官方核验${noteText}`);
        }
      } catch {
        if (!cancelled) {
          // 权威城市即使联网失败也保留本地分值
          const region = draft.city
            ? [draft.city, draft.county].filter(Boolean).join(' ')
            : draft.province;
          if (!hasKnownExamScoreAuthority(region, stageConfig.examType)) {
            setSubjectMaxHints({});
            setScoreSummary('本地区满分：联网查询失败，可稍后重试或手动核验');
            setScoreHintFromAuthority(false);
          }
        }
      } finally {
        if (!cancelled) setScoreSummaryLoading(false);
      }
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draft.province, draft.city, draft.county, stageConfig.examType]);

  const textbookVersion = useMemo(
    () => getVersionForProvinceSubject(effectiveProvince, selectedTextbookSubject),
    [effectiveProvince, selectedTextbookSubject],
  );
  const selectedSubjectMax = useMemo(
    () => resolveSubjectMaxForDisplay(selectedTextbookSubject, subjectMaxHints),
    [selectedTextbookSubject, subjectMaxHints],
  );
  const selectedSubjectScoreNote = useMemo(
    () => getKnownSubjectScoreNote(regionSummary, stageConfig.examType, selectedTextbookSubject),
    [regionSummary, stageConfig.examType, selectedTextbookSubject],
  );
  const shouldShowTextbookHint = Boolean(draft.province && draft.city && safeGrade);
  const currentTotalScore = useMemo(
    () => parseCurrentTotalScore(draft.scoresOverview),
    [draft.scoresOverview],
  );
  const candidateTiers = useMemo(() => {
    const map = new Map<string, CandidateTier>();
    const scored = schoolCandidates.filter((item) => item.score != null);
    if (scored.length === 0) return map;

    if (currentTotalScore != null) {
      for (const item of scored) {
        const gap = (item.score as number) - currentTotalScore;
        if (gap > 20) map.set(item.name, '冲刺');
        else if (gap < -20) map.set(item.name, '保底');
        else map.set(item.name, '匹配');
      }
      return map;
    }

    const sorted = [...scored].sort((a, b) => (b.score as number) - (a.score as number));
    const size = sorted.length;
    sorted.forEach((item, idx) => {
      if (idx < Math.ceil(size / 3)) map.set(item.name, '冲刺');
      else if (idx < Math.ceil((size * 2) / 3)) map.set(item.name, '匹配');
      else map.set(item.name, '保底');
    });
    return map;
  }, [schoolCandidates, currentTotalScore]);

  const handleSearchSchools = async (keywordOverride?: string) => {
    if (!draft.province || !draft.city) {
      toast.error('请先选择省份和城市');
      return;
    }
    const keyword = (keywordOverride ?? schoolKeyword).trim();
    setSearchingSchool(true);
    try {
      const region = draft.city || draft.province;
      let candidates: SchoolCandidate[] = [];

      // 初中学段优先用本地高中政策库；高中目标是大学/院校，不能混用高中/中学库。
      if (stageConfig.slug === 'middle') {
        try {
          const db = await policyApi.searchSchools(region);
          const dbCandidates = db.schools
            .filter((item) => !keyword || item.name.includes(keyword))
            .map((item) => ({ name: item.name, score: item.score > 0 ? item.score : undefined }))
            .slice(0, 10);
          if (dbCandidates.length > 0) {
            const merged = [...dbCandidates, ...candidates];
            const dedup = new Map<string, SchoolCandidate>();
            for (const school of merged) {
              if (!dedup.has(school.name)) dedup.set(school.name, school);
            }
            candidates = Array.from(dedup.values()).slice(0, 10);
          }
        } catch {
          // ignore db fallback error
        }
      }

      try {
        const internetCandidates = await searchSchoolCandidates({
          stage: stageConfig.stage,
          region,
          keyword: keyword || undefined,
          examYear: new Date().getFullYear(),
          limit: 10,
        });
        const merged = [...candidates, ...internetCandidates];
        const dedup = new Map<string, SchoolCandidate>();
        for (const school of merged) {
          if (!dedup.has(school.name)) dedup.set(school.name, school);
        }
        candidates = Array.from(dedup.values()).slice(0, 10);
      } catch {
        toast.info('联网学校库暂时不可用，已保留手动输入，可直接保存目标学校');
      }

      setSchoolCandidates(candidates.slice(0, 10));
      if (keyword) {
        patch({ school: keyword, targetSchool: keyword });
      }
      // 支持“手动输入学校名”后直接联网匹配分数线
      if (keyword && stageConfig.slug !== 'elementary') {
        setMatchingScore(true);
        try {
          const score = await fetchSchoolScoreByName({
            region,
            schoolName: keyword,
            examType: stageConfig.slug === 'high' ? '高考' : '中考',
          });
          if (score != null) {
            patch({ targetScore: score });
            toast.success(`已联网匹配分数线：${score}分`);
          } else {
            toast.info('已联网搜索学校，暂未匹配到明确分数线');
          }
        } catch {
          toast.error('联网匹配分数线失败，请稍后重试');
        } finally {
          setMatchingScore(false);
        }
      } else if (candidates.length === 0) {
        toast.info('未查到匹配学校，可直接输入学校名称');
      }
    } catch {
      if (keyword) {
        patch({ school: keyword, targetSchool: keyword });
      }
      setSchoolCandidates([]);
      toast.info('暂未查到学校库结果，可直接输入学校名称并保存');
    } finally {
      setSearchingSchool(false);
    }
  };

  const handleChooseSchool = async (candidate: SchoolCandidate) => {
    const nextScore = candidate.score;
    patch({
      school: candidate.name,
      targetSchool: candidate.name,
      targetScore: nextScore,
    });
    setSchoolKeyword(candidate.name);
    setSchoolCandidates([]);

    if (nextScore || stageConfig.slug === 'elementary') return;
    setMatchingScore(true);
    try {
      const score = await fetchSchoolScoreByName({
        region: draft.city || draft.province,
        schoolName: candidate.name,
        examType: stageConfig.slug === 'high' ? '高考' : '中考',
      });
      if (score != null) {
        patch({ targetScore: score });
        toast.success(`已自动匹配分数线：${score}分`);
      }
    } catch {
      // ignore score match failures
    } finally {
      setMatchingScore(false);
    }
  };

  return (
    <WobblyCard variant="white" decoration="tape" wobblyIndex={1} hoverable={false} className="p-5">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex items-center gap-2">
          <User className="size-5 text-pen-blue" />
          <h2 className="font-marker text-lg font-bold">学生基本信息</h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label className="font-hand">学生姓名</Label>
          <Input
            className="font-hand mt-1"
            value={draft.studentName}
            onChange={(e) => patch({ studentName: e.target.value })}
            placeholder="如：张三"
          />
        </div>
        {stageConfig.slug !== 'high' && (
          <div>
            <Label className="font-hand">学制</Label>
            <Select
              value={schoolSystem}
              onValueChange={(value: '6-3' | '5-4') => {
                const nextOptions = value === '5-4' ? FIVE_FOUR_GRADES : SIX_THREE_GRADES;
                const nextGrades = nextOptions[stageConfig.slug];
                patch({
                  schoolSystem: value,
                  grade: nextGrades.some((grade) => grade === draft.grade) ? draft.grade : '',
                });
              }}
            >
              <SelectTrigger className="font-hand mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6-3">六三制（小学6年 + 初中3年）</SelectItem>
                <SelectItem value="5-4">五四制（小学5年 + 初中4年）</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label className="font-hand">当前年级</Label>
          <Select value={toSelectValue(safeGrade)} onValueChange={(v) => patch({ grade: v })}>
            <SelectTrigger className="font-hand mt-1"><SelectValue placeholder="选择年级" /></SelectTrigger>
            <SelectContent>
              {gradeOptions.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {stageConfig.slug === 'high' && (
          <div>
            <Label className="font-hand">当地高考选科模式</Label>
            <div className="mt-1 border-l-[3px] border-pen-blue bg-pen-blue/5 px-3 py-2">
              <div className="font-marker text-sm font-bold text-pen-blue">
                {gaokaoModeMatch.mode || '待选择省份后自动判断'}
              </div>
              <p className="font-hand mt-0.5 text-xs text-ink/70">{gaokaoModeMatch.label}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 border-t-2 border-dashed border-ink/15 pt-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-marker-red" />
            <h3 className="font-marker text-base font-bold text-ink">地区与政策口径</h3>
          </div>
          <span className="font-hand text-xs text-muted-foreground">省市不一致时，系统以城市为准</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label className="font-hand">省份 *</Label>
            <Input
              className="font-hand mt-1"
              value={draft.province}
              onChange={(e) => handleProvinceTextChange(e.target.value)}
              placeholder="如：湖北省"
            />
          </div>
          <div>
            <Label className="font-hand">城市 *</Label>
            <Input
              className="font-hand mt-1"
              value={draft.city}
              onChange={(e) => handleCityTextChange(e.target.value)}
              placeholder="如：武汉市"
            />
          </div>
          <div>
            <Label className="font-hand">区县（选填，可不选）</Label>
            <Input
              className="font-hand mt-1"
              value={draft.county}
              onChange={(e) => handleCountyTextChange(e.target.value)}
              placeholder="如：武昌区"
            />
          </div>
        </div>
        {(scoreSummaryLoading || scoreSummary) && (
          <div className="font-hand mt-3 flex items-start gap-2 border-l-[3px] border-marker-red bg-marker-red/5 px-3 py-2 text-xs">
            {scoreSummaryLoading && <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin text-pen-blue" />}
            <span>{scoreSummaryLoading ? `正在核验 ${regionSummary || '当前城市'} 的考试分值` : scoreSummary}</span>
          </div>
        )}
      </div>

      {shouldShowTextbookHint && (
        <div className="mt-5 border-t-2 border-dashed border-ink/15 pt-5">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="size-4 text-pen-blue" />
            <h3 className="font-marker text-base font-bold text-ink">教材与单科分值</h3>
          </div>
          <div className="grid items-end gap-3 md:grid-cols-[180px_1fr]">
            <div>
              <Label className="font-hand">科目</Label>
              <Select value={selectedTextbookSubject} onValueChange={setSelectedTextbookSubject}>
                <SelectTrigger className="font-hand mt-1">
                  <SelectValue placeholder="选择科目" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_SUBJECTS.map((subject) => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="font-hand flex min-h-10 flex-wrap items-center gap-x-3 gap-y-1 border-l-[3px] border-pen-blue bg-pen-blue/5 px-3 py-2 text-sm">
              <strong className="text-pen-blue">{selectedTextbookSubject} · {textbookVersion}</strong>
              <span className="text-ink/30">|</span>
              <strong className="text-marker-red">
                {selectedSubjectMax ? `满分 ${selectedSubjectMax} 分` : '满分待核验'}
              </strong>
              {selectedSubjectScoreNote && <span className="text-xs text-ink/65">{selectedSubjectScoreNote}</span>}
              <span className="text-xs text-ink/50">
                {scoreHintFromAuthority ? '本地政策口径' : '联网匹配结果，以学校最新通知为准'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 border-t-2 border-dashed border-ink/15 pt-5">
        <div className="mb-3 flex items-center gap-2">
          <Target className="size-4 text-marker-red" />
          <h3 className="font-marker text-base font-bold text-ink">成绩与升学目标</h3>
        </div>
        <div className={`grid gap-4 ${stageConfig.slug === 'high' ? 'md:grid-cols-2' : ''}`}>
          <div>
            <Label className="font-hand">当前成绩概览（选填）</Label>
            <Input
              className="font-hand mt-1"
              value={draft.scoresOverview}
              onChange={(e) => patch({ scoresOverview: e.target.value })}
              placeholder="如：语文92，数学78，英语85"
            />
          </div>
          {stageConfig.slug === 'high' && (
            <div>
              <Label className="font-hand">职业方向（选填）</Label>
              <Input
                className="font-hand mt-1"
                value={draft.careerIntent}
                onChange={(e) => patch({ careerIntent: e.target.value })}
                placeholder="如：人工智能、医学、金融、设计"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
        <div>
          <Label className="font-hand font-bold text-ink">{stageConfig.targetLabel}</Label>
          <div className="mt-1 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <Input
              className="font-hand"
              value={schoolKeyword}
              onChange={(e) => setSchoolKeyword(e.target.value)}
              placeholder={stageConfig.slug === 'high' ? '输入目标院校' : '输入目标学校'}
            />
            <Button
              type="button"
              variant="outline"
              className="border-2 border-ink bg-white font-hand"
              onClick={() => {
                setSchoolKeyword('');
                handleSearchSchools('');
              }}
              disabled={searchingSchool}
            >
              {stageConfig.slug === 'high' ? '本地院校' : '本地学校'}
            </Button>
            <Button
              type="button"
              className="border-2 border-ink bg-marker-red font-hand text-white hover:bg-marker-red/90"
              onClick={() => handleSearchSchools()}
              disabled={searchingSchool}
            >
              {searchingSchool ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              搜索
            </Button>
          </div>
          {schoolCandidates.length > 0 && (
            <div className="mt-2 grid gap-1 sm:grid-cols-2">
              {schoolCandidates.map((candidate) => (
                <button
                  key={candidate.name}
                  type="button"
                  onClick={() => handleChooseSchool(candidate)}
                  className="font-hand rounded-md border border-ink/20 bg-background px-2 py-1.5 text-left text-xs hover:bg-accent"
                >
                  {candidateTiers.get(candidate.name) ? (
                    <span className="mr-1 inline-block rounded border border-ink/20 bg-accent px-1 py-0.5 text-[10px]">
                      {candidateTiers.get(candidate.name)}
                    </span>
                  ) : null}
                  {candidate.name}
                  {candidate.score ? <span className="ml-2 text-marker-red">约 {candidate.score} 分</span> : null}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <Label className="font-hand">目标分数线（选填）</Label>
          <Input
            className="font-hand mt-1"
            value={draft.targetScore != null ? String(draft.targetScore) : ''}
            onChange={(e) => {
              const value = e.target.value.trim();
              patch({ targetScore: value ? Number(value) : undefined });
            }}
            placeholder={matchingScore ? '匹配中...' : '选择学校后自动填写'}
          />
          {matchingScore && (
            <p className="font-hand mt-1 inline-flex items-center gap-1 text-xs text-pen-blue">
              <Loader2 className="size-3 animate-spin" />
              正在联网匹配最新分数线
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-ink/15 pt-4">
        <p className="font-hand text-xs text-muted-foreground">
          保存后将同步到学情诊断、升学规划、版本及知识点查询和学习计划。
          {countdownDays != null && draft.examDate ? ` 距${stageConfig.examLabel} ${countdownDays} 天。` : ''}
        </p>
        <Button className="font-hand" onClick={handleSave}>
          <Save className="mr-1 size-4" />
          保存档案
        </Button>
      </div>
    </WobblyCard>
  );
};

export default StageProfileEditor;
