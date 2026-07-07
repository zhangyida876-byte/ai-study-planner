import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, Search, Sparkles, User } from 'lucide-react';
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
  searchSchoolCandidates,
  streamPolicySearch,
  type SchoolCandidate,
} from '@client/src/api/plugins';
import { policy as policyApi } from '@client/src/api';
import {
  createCustomRegionOption,
  filterRegionOptions,
  findOptionByName,
  loadCities,
  loadCounties,
  loadProvinces,
  type RegionOption,
} from '@client/src/utils/region-network';
import { ALL_SUBJECTS, getVersionForProvinceSubject } from '@client/src/pages/Knowledge/KnowledgeFilterPanel';

interface StageProfileEditorProps {
  stageConfig: StageConfig;
  profile: StageProfile;
  onSave: (profile: StageProfile) => void;
  countdownDays: number | null;
  regionText: string;
}

type CandidateTier = '冲刺' | '匹配' | '保底';

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
  regionText,
}) => {
  const [draft, setDraft] = useState<StageProfile>(profile);
  const [schoolKeyword, setSchoolKeyword] = useState('');
  const [schoolCandidates, setSchoolCandidates] = useState<SchoolCandidate[]>([]);
  const [searchingSchool, setSearchingSchool] = useState(false);
  const [matchingScore, setMatchingScore] = useState(false);
  const [provinceOptions, setProvinceOptions] = useState<RegionOption[]>([]);
  const [cityOptions, setCityOptions] = useState<RegionOption[]>([]);
  const [countyOptions, setCountyOptions] = useState<RegionOption[]>([]);
  const [regionLoading, setRegionLoading] = useState(false);
  const [cityLoadFailed, setCityLoadFailed] = useState(false);
  const [countyLoadFailed, setCountyLoadFailed] = useState(false);
  const [customProvinceMode, setCustomProvinceMode] = useState(false);
  const [customCountyMode, setCustomCountyMode] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [countySearch, setCountySearch] = useState('');
  const [scoreSummary, setScoreSummary] = useState('');
  const [scoreSummaryLoading, setScoreSummaryLoading] = useState(false);
  const [subjectMaxHints, setSubjectMaxHints] = useState<Record<string, number>>({});
  const [selectedTextbookSubject, setSelectedTextbookSubject] = useState('数学');

  useEffect(() => {
    setDraft(profile);
    setSchoolKeyword(profile.targetSchool || '');
    setCitySearch(profile.city || '');
  }, [profile.updatedAt]);

  useEffect(() => {
    let cancelled = false;
    const fetchProvinces = async () => {
      setRegionLoading(true);
      try {
        const items = await loadProvinces();
        if (cancelled) return;
        setProvinceOptions(items);
      } catch {
        if (!cancelled) {
          setProvinceOptions([]);
          toast.error('地区列表联网加载失败，请稍后重试');
        }
      } finally {
        if (!cancelled) setRegionLoading(false);
      }
    };
    fetchProvinces();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!draft.province) {
      setCityOptions([]);
      setCountyOptions([]);
      return;
    }
    const province = findOptionByName(provinceOptions, draft.province);
    if (!province) {
      setCityOptions([]);
      setCountyOptions([]);
      return;
    }
    let cancelled = false;
    const fetchCities = async () => {
      setRegionLoading(true);
      setCityLoadFailed(false);
      try {
        const items = await loadCities(province);
        if (cancelled) return;
        setCityOptions(items);
      } catch {
        if (!cancelled) {
          setCityOptions([]);
          setCityLoadFailed(true);
        }
      } finally {
        if (!cancelled) setRegionLoading(false);
      }
    };
    fetchCities();
    return () => {
      cancelled = true;
    };
  }, [draft.province, provinceOptions]);

  useEffect(() => {
    if (!draft.city) {
      setCountyOptions([]);
      return;
    }
    const city = findOptionByName(cityOptions, draft.city);
    if (!city) {
      setCountyOptions([]);
      return;
    }
    let cancelled = false;
    const fetchCounties = async () => {
      setRegionLoading(true);
      setCountyLoadFailed(false);
      try {
        const items = await loadCounties(city);
        if (cancelled) return;
        setCountyOptions(items);
      } catch {
        if (!cancelled) {
          setCountyOptions([]);
          setCountyLoadFailed(true);
        }
      } finally {
        if (!cancelled) setRegionLoading(false);
      }
    };
    fetchCounties();
    return () => {
      cancelled = true;
    };
  }, [draft.city, cityOptions]);

  const filteredProvinces = filterRegionOptions(provinceOptions, provinceSearch);
  const filteredCities = filterRegionOptions(
    draft.city && !findOptionByName(cityOptions, draft.city)
      ? [...cityOptions, createCustomRegionOption(draft.city, 'city')]
      : cityOptions,
    citySearch,
  );
  const filteredCounties = filterRegionOptions(
    draft.county && !findOptionByName(countyOptions, draft.county)
      ? [...countyOptions, createCustomRegionOption(draft.county, 'county')]
      : countyOptions,
    countySearch,
  );
  const isCustomProvince = Boolean(draft.province) && !findOptionByName(provinceOptions, draft.province);
  const isCustomCounty = Boolean(draft.county) && !findOptionByName(countyOptions, draft.county);
  const selectedProvinceValue = customProvinceMode || isCustomProvince ? '__custom_province__' : toSelectValue(draft.province);
  const selectedCountyValue = customCountyMode || isCustomCounty ? '__custom_county__' : toSelectValue(draft.county);
  const safeGrade = stageConfig.grades.includes(draft.grade) ? draft.grade : '';
  const quickCityOptions = (citySearch.trim() ? filteredCities : cityOptions).slice(0, 10);

  const patch = (partial: Partial<StageProfile>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
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
    onSave({ ...draft });
    toast.success('已保存个人信息，下面 4 个模块会自动带入');
  };

  const regionSummary = useMemo(
    () => [draft.province, draft.city, draft.county].filter(Boolean).join(' '),
    [draft.province, draft.city, draft.county],
  );

  useEffect(() => {
    if (!draft.province || !draft.city) {
      setScoreSummary('');
      setSubjectMaxHints({});
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setScoreSummaryLoading(true);
      try {
        const region = [draft.province, draft.city, draft.county].filter(Boolean).join(' ');
        const year = String(new Date().getFullYear());
        const keyword = `${stageConfig.examType} 考试科目 满分分值 总分构成`;
        let full = '';
        for await (const chunk of streamPolicySearch({ region, year, keyword })) {
          if (cancelled) return;
          full += chunk;
        }
        if (cancelled) return;
        const hints = extractSubjectMaxHintsFromPolicyText(full);
        setSubjectMaxHints(hints);
        const entries = Object.entries(hints)
          .filter(([, value]) => Number.isFinite(value) && value > 0)
          .slice(0, 10);
        if (entries.length === 0) {
          setScoreSummary('本地区满分：暂无明确数据，需人工核验');
          return;
        }
        const explicitTotal = extractExamTotalScore(full);
        const total = explicitTotal ?? entries.reduce((sum, [, value]) => sum + value, 0);
        const detail = entries.map(([subject, value]) => `${subject}${value}`).join('、');
        setScoreSummary(`本地区满分：已识别${total}分（${detail}，以官方当年政策为准）`);
      } catch {
        if (!cancelled) {
          setSubjectMaxHints({});
          setScoreSummary('本地区满分：联网查询失败，可稍后重试或手动核验');
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
    () => getVersionForProvinceSubject(draft.province, selectedTextbookSubject),
    [draft.province, selectedTextbookSubject],
  );
  const selectedSubjectMax = useMemo(
    () => resolveSubjectMaxForDisplay(selectedTextbookSubject, subjectMaxHints),
    [selectedTextbookSubject, subjectMaxHints],
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

  const handleSearchSchools = async () => {
    if (!draft.province || !draft.city) {
      toast.error('请先选择省份和城市');
      return;
    }
    const keyword = schoolKeyword.trim();
    setSearchingSchool(true);
    try {
      const region = [draft.province, draft.city].join(' ');
      let candidates: SchoolCandidate[] = [];

      // 初中学段优先用本地政策库补齐学校+分数线，保证可选结果稳定。
      if (stageConfig.slug === 'middle' || stageConfig.slug === 'high') {
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
        region: [draft.province, draft.city].join(' '),
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <User className="size-5 text-pen-blue" />
          <h2 className="font-marker text-lg font-bold">全局学生档案</h2>
        </div>
        <p className="font-hand text-xs text-muted-foreground">只需先填地区和目标学校，下面模块都会自动复用</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label className="font-hand">学生姓名</Label>
          <Input
            className="font-hand mt-1"
            value={draft.studentName}
            onChange={(e) => patch({ studentName: e.target.value })}
            placeholder="如：张三"
          />
        </div>
        <div>
          <Label className="font-hand">当前年级（选填）</Label>
          <Select value={toSelectValue(safeGrade)} onValueChange={(v) => patch({ grade: v })}>
            <SelectTrigger className="font-hand mt-1"><SelectValue placeholder="选择年级" /></SelectTrigger>
            <SelectContent>
              {stageConfig.grades.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-ink/10 bg-background/80 p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="font-marker text-base font-bold text-ink">地区选择</h3>
            <span className="font-hand text-xs text-ink/60">当前地区：{regionSummary || '未选择'}</span>
            {regionLoading && <span className="font-hand text-xs text-pen-blue">正在加载地区列表...</span>}
            {scoreSummaryLoading && <span className="font-hand text-xs text-pen-blue">正在查询本地满分...</span>}
            {!scoreSummaryLoading && scoreSummary && (
              <span className="font-hand text-xs text-marker-red">{scoreSummary}</span>
            )}
          </div>
          <span className="font-hand text-xs text-muted-foreground">省份、城市必填，区县选填</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label className="font-hand">省份 *</Label>
            <Select
              value={selectedProvinceValue}
              onValueChange={(v) => {
                setProvinceSearch('');
                setCitySearch('');
                setCountySearch('');
                setCityLoadFailed(false);
                setCountyLoadFailed(false);
                setCustomProvinceMode(v === '__custom_province__');
                setCustomCountyMode(false);
                setSchoolKeyword('');
                setSchoolCandidates([]);
                patch({
                  province: v === '__custom_province__' ? '' : v,
                  city: '',
                  county: '',
                  targetSchool: '',
                  targetScore: undefined,
                });
              }}
            >
              <SelectTrigger className="font-hand mt-1">
                <SelectValue placeholder={regionLoading ? '联网加载中...' : '选择省份'} />
              </SelectTrigger>
              <SelectContent>
                <div className="p-1" onKeyDown={(e) => e.stopPropagation()}>
                  <Input
                    placeholder="搜索省份..."
                    value={provinceSearch}
                    onChange={(e) => setProvinceSearch(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                {filteredProvinces.map((p) => (
                  <SelectItem key={p.adcode} value={p.name}>{p.name}</SelectItem>
                ))}
                <SelectItem value="__custom_province__">自定义省份/地区...</SelectItem>
              </SelectContent>
            </Select>
            {(isCustomProvince || selectedProvinceValue === '__custom_province__') && (
              <Input
                className="font-hand mt-2"
                value={draft.province}
                onChange={(e) => {
                  setSchoolKeyword('');
                  setSchoolCandidates([]);
                  patch({
                    province: e.target.value,
                    city: '',
                    county: '',
                    targetSchool: '',
                    targetScore: undefined,
                  });
                }}
                placeholder="输入省份/自治区/直辖市"
              />
            )}
          </div>
          <div>
            <Label className="font-hand">城市 *</Label>
            <Input
              className="font-hand mt-1"
              value={citySearch}
              onChange={(e) => {
                const next = e.target.value;
                setCitySearch(next);
                setCountySearch('');
                setCountyLoadFailed(false);
                setCustomCountyMode(false);
                setSchoolKeyword('');
                setSchoolCandidates([]);
                patch({ city: next.trim(), county: '', targetSchool: '', targetScore: undefined });
              }}
              disabled={!draft.province}
              placeholder={cityLoadFailed ? '城市联网失败，可直接输入城市' : '搜索或输入城市/盟/州'}
            />
            {draft.province && (
              <div className="mt-2 rounded-lg border border-ink/15 bg-card/70 p-2">
                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>常用城市可直接点选</span>
                  {cityLoadFailed && <span className="text-marker-red">联网失败，可手动输入</span>}
                </div>
                {quickCityOptions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {quickCityOptions.map((city) => (
                      <button
                        key={city.adcode}
                        type="button"
                        className="rounded-full border border-ink/20 bg-accent px-2 py-1 text-xs hover:bg-postit-yellow"
                        onClick={() => {
                          setCitySearch(city.name);
                          setCountySearch('');
                          setCountyLoadFailed(false);
                          setCustomCountyMode(false);
                          setSchoolKeyword('');
                          setSchoolCandidates([]);
                          patch({ city: city.name, county: '', targetSchool: '', targetScore: undefined });
                        }}
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">暂无城市候选，可在上方直接输入城市名称。</p>
                )}
              </div>
            )}
          </div>
          <div>
            <Label className="font-hand">区县（选填）</Label>
            <Select
              value={selectedCountyValue}
              onValueChange={(v) => {
                setCustomCountyMode(v === '__custom_county__');
                patch({ county: v === '__custom_county__' ? '' : v });
              }}
              disabled={!draft.city}
            >
              <SelectTrigger className="font-hand mt-1"><SelectValue placeholder="选择区县" /></SelectTrigger>
              <SelectContent>
                <div className="p-1" onKeyDown={(e) => e.stopPropagation()}>
                  <Input
                    placeholder="筛选/拼音/别名"
                    value={countySearch}
                    onChange={(e) => setCountySearch(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                {filteredCounties.map((item) => (
                  <SelectItem key={item.adcode} value={item.name}>{item.name}</SelectItem>
                ))}
                <SelectItem value="__custom_county__">手动输入区县...</SelectItem>
              </SelectContent>
            </Select>
            {(isCustomCounty || selectedCountyValue === '__custom_county__' || countyLoadFailed) && (
              <Input
                className="font-hand mt-2"
                value={draft.county}
                onChange={(e) => patch({ county: e.target.value })}
                placeholder={countyLoadFailed ? '区县联网失败，可选填手输' : '输入区/县/旗/县级市（选填）'}
              />
            )}
          </div>
        </div>
      </div>

      {shouldShowTextbookHint && (
        <div className="mt-4 rounded-xl border-2 border-dashed border-pen-blue/30 bg-pen-blue/5 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-marker text-base font-bold text-ink">当地教材版本与单科满分</h3>
              <p className="font-hand text-xs text-ink/60">
                已根据地区和年级自动匹配，默认展示数学；可切换科目，便于顾问沟通。
              </p>
            </div>
            {scoreSummaryLoading && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs text-pen-blue">
                <Loader2 className="size-3 animate-spin" />
                正在联网核验满分
              </span>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-[160px_1fr_1fr]">
            <div>
              <Label className="font-hand">查询科目</Label>
              <Select value={selectedTextbookSubject} onValueChange={setSelectedTextbookSubject}>
                <SelectTrigger className="font-hand mt-1 bg-white">
                  <SelectValue placeholder="选择科目" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_SUBJECTS.map((subject) => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border border-ink/10 bg-white px-3 py-2">
              <div className="font-hand text-xs text-muted-foreground">自动匹配教材版本</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-marker text-lg font-bold text-pen-blue">
                  {selectedTextbookSubject} · {textbookVersion}
                </span>
                <span className="rounded-full bg-pen-blue/10 px-2 py-0.5 text-xs text-pen-blue">自动匹配</span>
              </div>
              <p className="font-hand mt-1 text-xs text-ink/60">
                以当地教育局与学校实际使用版本为准，顾问沟通前可二次确认。
              </p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-white px-3 py-2">
              <div className="font-hand text-xs text-muted-foreground">单科满分提示</div>
              <div className="mt-1 font-marker text-lg font-bold text-marker-red">
                {selectedSubjectMax ? `${selectedTextbookSubject}满分 ${selectedSubjectMax} 分` : '暂无明确满分，需人工核验'}
              </div>
              <p className="font-hand mt-1 text-xs text-ink/60">
                来源于当前地区考情联网查询，若当年政策更新，请以官方最新文件为准。
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        <Label className="font-hand">当前成绩概览（选填）</Label>
        <Input
          className="font-hand mt-1"
          value={draft.scoresOverview}
          onChange={(e) => patch({ scoresOverview: e.target.value })}
          placeholder="如：语92 数78 英85 物70"
        />
      </div>

      {stageConfig.slug === 'high' && (
        <div className="mt-4">
          <Label className="font-hand">想做的事情 / 职业方向（选填）</Label>
          <Input
            className="font-hand mt-1"
            value={draft.careerIntent}
            onChange={(e) => patch({ careerIntent: e.target.value })}
            placeholder="如：人工智能、医生、金融分析、设计、法律"
          />
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border-2 border-dashed border-postit-yellow bg-postit-yellow/20 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <Label className="font-hand font-bold text-ink">{stageConfig.targetLabel}</Label>
            <span className="rounded-full border border-marker-red/30 bg-white px-2 py-0.5 text-xs font-bold text-marker-red">
              当地学校可搜索，也支持自定义输入
            </span>
          </div>
          <p className="font-hand mb-2 text-xs text-ink/70">
            先输入学校关键词，点击“搜索本地学校并匹配分数线”；若没有搜到，也可以直接手动填写学校名称保存。
          </p>
          <div className="mt-1 flex gap-2">
            <Input
              className="font-hand"
              value={schoolKeyword}
              onChange={(e) => setSchoolKeyword(e.target.value)}
              placeholder={stageConfig.slug === 'high' ? '如：清华大学 / 本地大学名称' : '如：华师一附中 / 当地学校名称'}
            />
            <Button
              type="button"
              className="min-w-[132px] border-2 border-ink bg-marker-red font-hand text-white hover:bg-marker-red/90"
              onClick={handleSearchSchools}
              disabled={searchingSchool}
            >
              {searchingSchool ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              搜索并匹配
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
          <p className="font-hand mt-2 text-xs text-ink/70">
            搜索后最多展示 10 个本地候选学校，并按“冲刺/匹配/保底”分层；点击学校即可自动填入并尝试匹配分数线。
          </p>
        </div>
        <div>
          <Label className="font-hand">自动匹配分数线</Label>
          <Input
            className="font-hand mt-1"
            value={draft.targetScore != null ? String(draft.targetScore) : ''}
            onChange={(e) => {
              const value = e.target.value.trim();
              patch({ targetScore: value ? Number(value) : undefined });
            }}
            placeholder={matchingScore ? '联网匹配中...' : '选择学校后自动匹配'}
          />
          {matchingScore && (
            <p className="font-hand mt-1 inline-flex items-center gap-1 text-xs text-pen-blue">
              <Loader2 className="size-3 animate-spin" />
              正在联网匹配最新分数线
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-ink/10 pt-4">
        <div className="font-hand text-sm text-ink/70">
          {regionSummary && <span className="mr-3">📍 {regionSummary}</span>}
          {draft.grade && <span className="mr-3">🎓 {draft.grade}</span>}
          {draft.targetSchool && <span className="mr-3">🏫 {draft.targetSchool}</span>}
          {stageConfig.slug === 'high' && draft.careerIntent && (
            <span className="mr-3">💼 {draft.careerIntent}</span>
          )}
          {draft.targetScore != null && (
            <span className="mr-3 inline-flex items-center gap-1 text-marker-red">
              <Sparkles className="size-3.5" />
              分数线约 {draft.targetScore} 分
            </span>
          )}
          {countdownDays != null && draft.examDate && (
            <span className="text-marker-red">距{stageConfig.examLabel} {countdownDays} 天</span>
          )}
        </div>
        <Button className="font-hand" onClick={handleSave}>
          <Save className="mr-1 size-4" />
          保存档案
        </Button>
      </div>
    </WobblyCard>
  );
};

export default StageProfileEditor;
