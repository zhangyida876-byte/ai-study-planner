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
import { PROVINCE_CITIES, PROVINCES } from '@client/src/pages/Plan/regionData';
import { toSelectValue } from '@client/src/lib/utils';
import {
  fetchSchoolScoreByName,
  searchSchoolCandidates,
  type SchoolCandidate,
} from '@client/src/api/plugins';
import { policy as policyApi } from '@client/src/api';

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

  useEffect(() => {
    setDraft(profile);
    setSchoolKeyword(profile.targetSchool || '');
  }, [profile.updatedAt]);

  const cities = PROVINCE_CITIES[draft.province] || [];
  const safeCity = cities.includes(draft.city) ? draft.city : '';
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
    onSave(draft);
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
    setSearchingSchool(true);
    try {
      const region = [draft.province, draft.city].join(' ');
      let candidates = await searchSchoolCandidates({
        stage: stageConfig.stage,
        region,
        keyword: schoolKeyword || undefined,
        examYear: new Date().getFullYear(),
        limit: 10,
      });

      // 初中学段优先用本地政策库补齐学校+分数线，保证可选结果稳定。
      if (stageConfig.slug === 'middle' || stageConfig.slug === 'high') {
        try {
          const db = await policyApi.searchSchools(region);
          const dbCandidates = db.schools
            .filter((item) => !schoolKeyword || item.name.includes(schoolKeyword))
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
      if (candidates.length === 0) toast.info('未查到匹配学校，可直接输入学校名称');
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
          <Select value={toSelectValue(draft.province)} onValueChange={(v) => patch({ province: v, city: '', county: '' })}>
            <SelectTrigger className="font-hand mt-1"><SelectValue placeholder="选择省份" /></SelectTrigger>
            <SelectContent>
              {PROVINCES.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="font-hand">城市 *</Label>
          <Select value={toSelectValue(safeCity)} onValueChange={(v) => patch({ city: v })} disabled={!draft.province}>
            <SelectTrigger className="font-hand mt-1"><SelectValue placeholder="选择城市" /></SelectTrigger>
            <SelectContent>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="font-hand">区县（选填）</Label>
          <Input
            className="font-hand mt-1"
            value={draft.county}
            onChange={(e) => patch({ county: e.target.value })}
            placeholder="区/县"
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
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-ink/10 pt-4">
        <div className="font-hand text-sm text-ink/70">
          {regionSummary && <span className="mr-3">📍 {regionSummary}</span>}
          {draft.grade && <span className="mr-3">🎓 {draft.grade}</span>}
          {draft.targetSchool && <span className="mr-3">🏫 {draft.targetSchool}</span>}
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
