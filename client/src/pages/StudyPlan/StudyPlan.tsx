import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Copy, Check, AlertCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import WobblyCard from '@client/src/components/WobblyCard';
import { Streamdown } from '@client/src/components/ui/streamdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRequiredStage } from '@client/src/hooks/use-stage';
import { useStageProfile } from '@client/src/hooks/use-stage-profile';
import ProfileAutofillBanner from '@client/src/components/ProfileAutofillBanner';
import { getStudyPlanAutofillFromProfile } from '@client/src/utils/stage-profile-sync';
import { stagePath } from '@client/src/config/stages';
import {
  streamPersonalizedLearningPlan,
  type PersonalizedLearningPlanInput,
} from '@client/src/api/plugins';
import { toSelectValue } from '@client/src/lib/utils';
import { loadModuleSession, saveModuleSession } from '@client/src/utils/module-session';

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

function parseTargetScore(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildExportFileName(prefix: string, grade: string, region: string, extension: string): string {
  const safe = [prefix, grade, region]
    .filter(Boolean)
    .join('-')
    .replace(/[\\/:*?"<>|\s]+/g, '-')
    .replace(/-+/g, '-');
  return `${safe || prefix}.${extension}`;
}

function downloadTextFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function markdownTablesToCsv(markdown: string): string {
  const rows: string[] = [];
  const lines = markdown.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) continue;
    if (/^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(trimmed)) continue;
    const cells = trimmed
      .slice(1, -1)
      .split('|')
      .map((cell) => `"${cell.trim().replace(/"/g, '""')}"`);
    rows.push(cells.join(','));
  }
  return rows.join('\n');
}

interface StudyPlanSessionState {
  grade: string;
  region: string;
  school: string;
  targetSchool: string;
  examMode: string;
  examDate: string;
  currentScore: string;
  targetScore: string;
  careerIntent: string;
  weakSubjects: string;
  strongSubjects: string;
  weeklyHours: string;
  boardingType: string;
  eveningStudy: string;
  extracurricular: string;
  weeklySchedule: string;
  timetableNotes: string;
  customNotes: string;
  report: string;
}

const StudyPlan: React.FC = () => {
  const { stageSlug, stageConfig } = useRequiredStage();
  const { profile, regionText, updateProfile } = useStageProfile(stageSlug);
  const [grade, setGrade] = useState('');
  const [region, setRegion] = useState('');
  const [school, setSchool] = useState('');
  const [targetSchool, setTargetSchool] = useState('');
  const [examMode, setExamMode] = useState('');
  const [examDate, setExamDate] = useState('');
  const [currentScore, setCurrentScore] = useState('');
  const [targetScore, setTargetScore] = useState('');
  const [careerIntent, setCareerIntent] = useState('');
  const [weakSubjects, setWeakSubjects] = useState('');
  const [strongSubjects, setStrongSubjects] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('');
  const [boardingType, setBoardingType] = useState('');
  const [eveningStudy, setEveningStudy] = useState('');
  const [extracurricular, setExtracurricular] = useState('');
  const [weeklySchedule, setWeeklySchedule] = useState('');
  const [timetableNotes, setTimetableNotes] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profileDirty, setProfileDirty] = useState(false);
  const applyingProfileRef = useRef(false);
  const hydratedRef = useRef(false);
  const reportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const cached = loadModuleSession<StudyPlanSessionState>(stageSlug, 'study-plan');
    if (!cached) return;
    setGrade(cached.grade || '');
    setRegion(cached.region || '');
    setSchool(cached.school || '');
    setTargetSchool(cached.targetSchool || '');
    setExamMode(cached.examMode || '');
    setExamDate(cached.examDate || '');
    setCurrentScore(cached.currentScore || '');
    setTargetScore(cached.targetScore || '');
    setCareerIntent(cached.careerIntent || '');
    setWeakSubjects(cached.weakSubjects || '');
    setStrongSubjects(cached.strongSubjects || '');
    setWeeklyHours(cached.weeklyHours || '');
    setBoardingType(cached.boardingType || '');
    setEveningStudy(cached.eveningStudy || '');
    setExtracurricular(cached.extracurricular || '');
    setWeeklySchedule(cached.weeklySchedule || '');
    setTimetableNotes(cached.timetableNotes || '');
    setCustomNotes(cached.customNotes || '');
    setReport(cached.report || '');
    hydratedRef.current = true;
  }, [stageSlug]);

  useEffect(() => {
    if (!profile.updatedAt) return;
    applyingProfileRef.current = true;
    const fill = getStudyPlanAutofillFromProfile(profile);
    if (fill.grade) setGrade(fill.grade);
    if (fill.region) setRegion(fill.region);
    if (fill.school) setSchool(fill.school);
    if (fill.targetSchool) setTargetSchool(fill.targetSchool);
    if (fill.targetScore) setTargetScore(fill.targetScore);
    if (fill.careerIntent) setCareerIntent(fill.careerIntent);
    if (fill.examMode) setExamMode(fill.examMode);
    if (fill.examDate) setExamDate(fill.examDate);
    if (fill.currentScore) setCurrentScore(fill.currentScore);
    if (fill.weakSubjects) setWeakSubjects(fill.weakSubjects);
    if (fill.strongSubjects) setStrongSubjects(fill.strongSubjects);
    if (fill.weeklyHours) setWeeklyHours(fill.weeklyHours);
    if (fill.boardingType) setBoardingType(fill.boardingType);
    queueMicrotask(() => {
      applyingProfileRef.current = false;
      hydratedRef.current = true;
    });
  }, [profile.updatedAt, profile]);

  useEffect(() => {
    saveModuleSession<StudyPlanSessionState>(stageSlug, 'study-plan', {
      grade,
      region,
      school,
      targetSchool,
      examMode,
      examDate,
      currentScore,
      targetScore,
      careerIntent,
      weakSubjects,
      strongSubjects,
      weeklyHours,
      boardingType,
      eveningStudy,
      extracurricular,
      weeklySchedule,
      timetableNotes,
      customNotes,
      report,
    });
  }, [
    stageSlug,
    grade,
    region,
    school,
    targetSchool,
    examMode,
    examDate,
    currentScore,
    targetScore,
    careerIntent,
    weakSubjects,
    strongSubjects,
    weeklyHours,
    boardingType,
    eveningStudy,
    extracurricular,
    weeklySchedule,
    timetableNotes,
    customNotes,
    report,
  ]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (applyingProfileRef.current) return;
    const timer = setTimeout(() => {
      updateProfile({
        grade,
        school,
        targetSchool,
        targetScore: parseTargetScore(targetScore),
        examDate,
        scoresOverview: currentScore,
        careerIntent,
        examMode,
        weakSubjects,
        strongSubjects,
        weeklyStudyHours: weeklyHours,
        boardingType: (boardingType as '' | 'day' | 'boarding') || '',
      });
      setProfileDirty(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [
    updateProfile,
    grade,
    school,
    targetSchool,
    targetScore,
    examDate,
    currentScore,
    careerIntent,
    examMode,
    weakSubjects,
    strongSubjects,
    weeklyHours,
    boardingType,
  ]);

  const markDirty = () => {
    if (!applyingProfileRef.current) setProfileDirty(true);
  };

  const handleSyncProfileBack = useCallback(() => {
    updateProfile({
      grade,
      school,
      targetSchool,
      targetScore: parseTargetScore(targetScore),
      examDate,
      scoresOverview: currentScore,
      careerIntent,
      examMode,
      weakSubjects,
      strongSubjects,
      weeklyStudyHours: weeklyHours,
      boardingType: (boardingType as '' | 'day' | 'boarding') || '',
    });
    toast.success('已同步回学段主页档案');
    setProfileDirty(false);
  }, [updateProfile, grade, school, targetSchool, targetScore, examDate, currentScore, careerIntent, examMode, weakSubjects, strongSubjects, weeklyHours, boardingType]);

  const validate = (): string | null => {
    if (!grade) return '请选择年级';
    if (!region.trim()) return '请填写所在地区';
    if (!weakSubjects.trim() && !currentScore.trim()) return '请填写薄弱科目或当前成绩';
    if (!weeklyHours.trim()) return '请填写每周可支配学习时长';
    if (!boardingType) return '请选择走读或住读';
    return null;
  };

  const handleGenerate = useCallback(async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    setLoading(true);
    setReport('');
    try {
      const input: PersonalizedLearningPlanInput = {
        stage: stageConfig.label,
        stageSlug,
        grade,
        region: region.trim(),
        school: school.trim(),
        targetSchool: targetSchool.trim(),
        examDate,
        currentScore: currentScore.trim(),
        targetScore: targetScore.trim(),
        careerIntent: careerIntent.trim(),
        examMode: examMode.trim(),
        weakSubjects: weakSubjects.trim(),
        strongSubjects: strongSubjects.trim(),
        weeklyHours: weeklyHours.trim(),
        dailyHours: '',
        boardingType,
        eveningStudy,
        extracurricular,
        weeklySchedule: weeklySchedule.trim(),
        timetableNotes: timetableNotes.trim(),
        customNotes: customNotes.trim(),
      };

      let full = '';
      for await (const chunk of streamPersonalizedLearningPlan(input, { stageSlug, profile })) {
        full += chunk;
        setReport(full);
      }
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
    } catch {
      toast.error('学习计划生成失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [
    boardingType, currentScore, customNotes, eveningStudy, examDate,
    extracurricular, grade, region, school, stageConfig.label, stageSlug,
    strongSubjects, targetSchool, targetScore, careerIntent, examMode, timetableNotes, weakSubjects,
    weeklyHours, weeklySchedule, profile,
  ]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      toast.success('已复制');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('复制失败');
    }
  };

  const handleJumpToReport = () => {
    reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleExportDocument = () => {
    if (!report.trim()) {
      toast.error('请先生成课表执行方案');
      return;
    }
    downloadTextFile(
      report,
      buildExportFileName('课表学习执行方案', grade, region, 'md'),
      'text/markdown',
    );
    toast.success('已导出文档');
  };

  const handleExportTable = () => {
    if (!report.trim()) {
      toast.error('请先生成课表执行方案');
      return;
    }
    const csv = markdownTablesToCsv(report);
    if (!csv.trim()) {
      toast.error('当前方案里没有可导出的表格');
      return;
    }
    downloadTextFile(
      csv,
      buildExportFileName('课表执行表', grade, region, 'csv'),
      'text/csv',
    );
    toast.success('已导出表格');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="font-hand mb-2 -ml-2" asChild>
          <Link to={stagePath(stageSlug)}>
            <ArrowLeft className="mr-1 size-4" />
            返回{stageConfig.label}主页
          </Link>
        </Button>
        <h1 className="font-marker text-2xl font-bold">
          {stageConfig.label} · 个性化学习规划
        </h1>
        <p className="font-hand mt-1 text-sm text-muted-foreground">
          根据年级、地区、目标与时间约束，生成可执行的周计划与日安排（表格+时间轴）
        </p>
      </div>

      <ProfileAutofillBanner
        stageSlug={stageSlug}
        profile={profile}
        regionText={regionText}
        showSyncBack={profileDirty}
        onSyncBack={handleSyncProfileBack}
      />

      <div className="space-y-6">
        <WobblyCard variant="white" wobblyIndex={0} hoverable={false} className="p-4 space-y-4">
          <div>
            <h2 className="font-marker font-bold">个人信息（首页档案自动带入）</h2>
            <p className="font-hand mt-1 text-sm text-muted-foreground">
              此处只展示档案信息，不再重复设置；如需修改，请回到学段首页编辑档案。
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {[
              ['学生姓名', profile.studentName || '未填写'],
              ['学段/年级', `${stageConfig.label} · ${grade || profile.grade || '未填写'}`],
              ['所在地区', regionText || region || '未填写'],
              ['学校', school || profile.school || '未填写'],
              [stageConfig.targetLabel, targetSchool || profile.targetSchool || '未填写'],
              ['目标考试时间', examDate || profile.examDate || '未填写'],
              ['当前成绩概览', currentScore || profile.scoresOverview || '未填写'],
              ['薄弱/优势科目', [weakSubjects || profile.weakSubjects, strongSubjects || profile.strongSubjects].filter(Boolean).join(' / ') || '未填写'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border-2 border-dashed border-ink/15 bg-accent/50 px-3 py-2">
                <p className="text-xs text-ink/55">{label}</p>
                <p className="font-marker mt-1 text-base font-bold text-ink">{value}</p>
              </div>
            ))}
          </div>
          {stageSlug === 'high' && (
            <div className="rounded-lg border-2 border-dashed border-pen-blue/25 bg-pen-blue/5 px-3 py-2 text-sm text-ink/75">
              高中附加信息：{examMode || '选科模式未填写'}{careerIntent ? `；职业方向：${careerIntent}` : ''}
            </div>
          )}
        </WobblyCard>

        <WobblyCard variant="yellow" wobblyIndex={1} hoverable={false} className="p-4 space-y-4">
          <h2 className="font-marker font-bold">时间与课表</h2>
          <p className="font-hand text-sm text-ink/70">
            这里只保留会影响课表安排的自定义信息；生成前请补充每周可用时间、走读/住读和具体课表约束。
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="font-hand">每周可支配时长(小时) *</Label>
              <Input value={weeklyHours} onChange={(e) => { markDirty(); setWeeklyHours(e.target.value); }} className="font-hand mt-1" />
            </div>
            <div>
              <Label className="font-hand">走读/住读 *</Label>
              <Select value={toSelectValue(boardingType)} onValueChange={(v) => { markDirty(); setBoardingType(v); }}>
                <SelectTrigger className="font-hand mt-1"><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">走读</SelectItem>
                  <SelectItem value="boarding">住读</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-hand">是否有晚自习</Label>
              <Select value={toSelectValue(eveningStudy)} onValueChange={setEveningStudy}>
                <SelectTrigger className="font-hand mt-1"><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">有</SelectItem>
                  <SelectItem value="no">无</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-hand">课外班/固定占用时间</Label>
              <Input value={extracurricular} onChange={(e) => setExtracurricular(e.target.value)} className="font-hand mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label className="font-hand">周一~周日可学习时间段</Label>
              <Textarea
                value={weeklySchedule}
                onChange={(e) => setWeeklySchedule(e.target.value)}
                placeholder={WEEKDAYS.map((d) => `${d}：19:00-21:00`).join('\n')}
                className="font-hand mt-1 min-h-[90px]"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="font-hand">每日课表与作业量（如：周二只有语数外）</Label>
              <Textarea
                value={timetableNotes}
                onChange={(e) => setTimetableNotes(e.target.value)}
                className="font-hand mt-1 min-h-[90px]"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="font-hand">个性化说明（注意力、通勤、周末安排等）</Label>
              <Textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="font-hand mt-1 min-h-[110px]"
              />
            </div>
          </div>
          <Button className="font-hand w-full" disabled={loading} onClick={handleGenerate}>
            {loading ? <><Loader2 className="mr-2 size-4 animate-spin" />生成中...</> : '生成课表学习执行方案'}
          </Button>
          {report && (
            <Button type="button" variant="outline" className="font-hand w-full" onClick={handleJumpToReport}>
              直接跳到已生成方案
            </Button>
          )}
        </WobblyCard>

        <div ref={reportRef}>
          <WobblyCard variant="white" decoration="tape" wobblyIndex={2} hoverable={false} className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-marker font-bold">学习规划方案</h2>
                <p className="font-hand mt-1 text-sm text-muted-foreground">
                  生成后会完整展示个性化执行方案，重点包含周课表、每日任务、检查标准和复盘安排。
                </p>
              </div>
              {report && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? <Check className="mr-1 size-3.5" /> : <Copy className="mr-1 size-3.5" />}
                    复制全文
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportDocument}>
                    <Download className="mr-1 size-3.5" />
                    导出文档
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportTable}>
                    <Download className="mr-1 size-3.5" />
                    导出表格
                  </Button>
                </div>
              )}
            </div>
            {loading && !report && (
              <div className="flex items-center gap-2 py-12 font-hand text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                正在生成课表与每日执行安排...
              </div>
            )}
            {!loading && !report && (
              <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
                <AlertCircle className="mb-2 size-8 opacity-40" />
                <p className="font-hand text-sm">填写上方时间与课表后生成</p>
                <p className="font-hand mt-1 text-xs">将包含完整周计划表、日安排、科目拆解与检测标准</p>
              </div>
            )}
            {report && (
              <div className="font-hand prose-headings:font-marker max-w-none">
                <Streamdown>{report}</Streamdown>
              </div>
            )}
          </WobblyCard>
        </div>
      </div>
    </div>
  );
};

export default StudyPlan;
