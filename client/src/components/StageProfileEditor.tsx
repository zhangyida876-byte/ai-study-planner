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
  fetchSchoolScoreByName,
  searchSchoolCandidates,
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

interface StageProfileEditorProps {
  stageConfig: StageConfig;
  profile: StageProfile;
  onSave: (profile: StageProfile) => void;
  countdownDays: number | null;
  regionText: string;
}

type CandidateTier = '冲刺' | '匹配' | '保底';

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
  const [customCityMode, setCustomCityMode] = useState(false);
  const [customCountyMode, setCustomCountyMode] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [countySearch, setCountySearch] = useState('');

  useEffect(() => {
    setDraft(profile);
    setSchoolKeyword(profile.targetSchool || '');
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
  const isCustomCity = Boolean(draft.city) && !findOptionByName(cityOptions, draft.city);
  const isCustomCounty = Boolean(draft.county) && !findOptionByName(countyOptions, draft.county);
  const selectedProvinceValue = customProvinceMode || isCustomProvince ? '__custom_province__' : toSelectValue(draft.province);
  const selectedCityValue = customCityMode || isCustomCity ? '__custom_city__' : toSelectValue(draft.city);
  const selectedCountyValue = customCountyMode || isCustomCounty ? '__custom_county__' : toSelectValue(draft.county);
  const safeGrade = stageConfig.grades.includes(draft.grade) ? draft.grade : '';

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
      let candidates = await searchSchoolCandidates({
        stage: stageConfig.stage,
        region,
        keyword: keyword || undefined,
        examYear: new Date().getFullYear(),
        limit: 10,
      });

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
      toast.error('联网搜索学校失败，请稍后重试');
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

      <div className="mb-4 rounded-lg border-2 border-dashed border-pen-blue/30 bg-pen-blue/5 px-3 py-2 text-sm text-ink/75">
        当前地区：{regionSummary || '未选择'}
        {regionLoading && <span className="ml-2 text-pen-blue">正在加载地区列表...</span>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              setCustomCityMode(false);
              setCustomCountyMode(false);
              patch({ province: v === '__custom_province__' ? '' : v, city: '', county: '' });
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
              onChange={(e) => patch({ province: e.target.value, city: '', county: '' })}
              placeholder="输入省份/自治区/直辖市"
            />
          )}
        </div>
        <div>
          <Label className="font-hand">城市 *</Label>
          <Select
            value={selectedCityValue}
            onValueChange={(v) => {
              setCitySearch('');
              setCountySearch('');
              setCountyLoadFailed(false);
              setCustomCityMode(v === '__custom_city__');
              setCustomCountyMode(false);
              patch({ city: v === '__custom_city__' ? '' : v, county: '' });
            }}
            disabled={!draft.province}
          >
            <SelectTrigger className="font-hand mt-1">
              <SelectValue placeholder={regionLoading ? '联网加载中...' : '选择城市'} />
            </SelectTrigger>
            <SelectContent>
              <div className="p-1" onKeyDown={(e) => e.stopPropagation()}>
                <Input
                  placeholder="筛选/拼音/别名（如 wulanhaote）"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              {filteredCities.map((c) => (
                <SelectItem key={c.adcode} value={c.name}>{c.name}</SelectItem>
              ))}
              <SelectItem value="__custom_city__">自定义城市/盟/州...</SelectItem>
            </SelectContent>
          </Select>
          {(isCustomCity || selectedCityValue === '__custom_city__' || cityLoadFailed) && (
            <Input
              className="font-hand mt-2"
              value={draft.city}
              onChange={(e) => patch({ city: e.target.value, county: '' })}
              placeholder={cityLoadFailed ? '城市联网失败，可直接输入城市' : '输入城市/盟/州'}
            />
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
        <div className="sm:col-span-2">
          <Label className="font-hand">{stageConfig.targetLabel}（支持自定义搜索）</Label>
          <div className="mt-1 flex gap-2">
            <Input
              className="font-hand"
              value={schoolKeyword}
              onChange={(e) => setSchoolKeyword(e.target.value)}
              placeholder={stageConfig.slug === 'high' ? '输入大学名称' : '输入学校名称'}
            />
            <Button
              type="button"
              variant="outline"
              className="font-hand"
              onClick={handleSearchSchools}
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
          <p className="font-hand mt-1 text-xs text-muted-foreground">
            最多展示 10 个候选学校，并按“冲刺/匹配/保底”分层；点击即可自动填入。
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
        <div className="sm:col-span-2">
          <Label className="font-hand">当前成绩概览（选填）</Label>
          <Input
            className="font-hand mt-1"
            value={draft.scoresOverview}
            onChange={(e) => patch({ scoresOverview: e.target.value })}
            placeholder="如：语92 数78 英85 物70"
          />
        </div>
        {stageConfig.slug === 'high' && (
          <div className="sm:col-span-2">
            <Label className="font-hand">想做的事情 / 职业方向（选填）</Label>
            <Input
              className="font-hand mt-1"
              value={draft.careerIntent}
              onChange={(e) => patch({ careerIntent: e.target.value })}
              placeholder="如：人工智能、医生、金融分析、设计、法律"
            />
          </div>
        )}
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
