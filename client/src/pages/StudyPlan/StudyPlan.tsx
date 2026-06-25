import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Copy, Check, AlertCircle } from 'lucide-react';
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
  buildScoresText,
  type PersonalizedLearningPlanInput,
} from '@client/src/api/plugins';

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const StudyPlan: React.FC = () => {
  const { stageSlug, stageConfig } = useRequiredStage();
  const { profile, regionText, updateProfile } = useStageProfile(stageSlug);
  const [grade, setGrade] = useState('');
  const [region, setRegion] = useState('');
  const [school, setSchool] = useState('');
  const [targetSchool, setTargetSchool] = useState('');
  const [examDate, setExamDate] = useState('');
  const [currentScore, setCurrentScore] = useState('');
  const [targetScore, setTargetScore] = useState('');
  const [weakSubjects, setWeakSubjects] = useState('');
  const [strongSubjects, setStrongSubjects] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('');
  const [dailyHours, setDailyHours] = useState('');
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

  useEffect(() => {
    if (!profile.updatedAt) return;
    applyingProfileRef.current = true;
    const fill = getStudyPlanAutofillFromProfile(profile);
    if (fill.grade) setGrade(fill.grade);
    if (fill.region) setRegion(fill.region);
    if (fill.school) setSchool(fill.school);
    if (fill.targetSchool) setTargetSchool(fill.targetSchool);
    if (fill.examDate) setExamDate(fill.examDate);
    if (fill.currentScore) setCurrentScore(fill.currentScore);
    if (fill.weakSubjects) setWeakSubjects(fill.weakSubjects);
    if (fill.strongSubjects) setStrongSubjects(fill.strongSubjects);
    if (fill.weeklyHours) setWeeklyHours(fill.weeklyHours);
    if (fill.boardingType) setBoardingType(fill.boardingType);
    queueMicrotask(() => { applyingProfileRef.current = false; });
  }, [profile.updatedAt, profile]);

  const markDirty = () => {
    if (!applyingProfileRef.current) setProfileDirty(true);
  };

  const handleSyncProfileBack = useCallback(() => {
    updateProfile({
      grade,
      school,
      targetSchool,
      examDate,
      scoresOverview: currentScore,
      weakSubjects,
      strongSubjects,
      weeklyStudyHours: weeklyHours,
      boardingType: (boardingType as '' | 'day' | 'boarding') || '',
    });
    toast.success('已同步回学段主页档案');
    setProfileDirty(false);
  }, [updateProfile, grade, school, targetSchool, examDate, currentScore, weakSubjects, strongSubjects, weeklyHours, boardingType]);

  const validate = (): string | null => {
    if (!grade) return '请选择年级';
    if (!region.trim()) return '请填写所在地区';
    if (!weakSubjects.trim() && !currentScore.trim()) return '请填写薄弱科目或当前成绩';
    if (!weeklyHours.trim() && !dailyHours.trim()) return '请填写每周或每天可支配学习时长';
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
        weakSubjects: weakSubjects.trim(),
        strongSubjects: strongSubjects.trim(),
        weeklyHours: weeklyHours.trim(),
        dailyHours: dailyHours.trim(),
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
    } catch {
      toast.error('学习计划生成失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [
    boardingType, currentScore, customNotes, dailyHours, eveningStudy, examDate,
    extracurricular, grade, region, school, stageConfig.label, stageSlug,
    strongSubjects, targetSchool, targetScore, timetableNotes, weakSubjects,
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

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <WobblyCard variant="white" wobblyIndex={0} hoverable={false} className="p-4 space-y-4">
            <h2 className="font-marker font-bold">基础信息</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="font-hand">学段</Label>
                <Input value={stageConfig.label} disabled className="font-hand mt-1" />
              </div>
              <div>
                <Label className="font-hand">年级 *</Label>
                <Select value={grade} onValueChange={(v) => { markDirty(); setGrade(v); }}>
                  <SelectTrigger className="font-hand mt-1"><SelectValue placeholder="选择年级" /></SelectTrigger>
                  <SelectContent>
                    {stageConfig.grades.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label className="font-hand">所在地区 *</Label>
                <Input value={region} onChange={(e) => { markDirty(); setRegion(e.target.value); }} placeholder="省/市/区" className="font-hand mt-1" />
              </div>
              <div>
                <Label className="font-hand">学校</Label>
                <Input value={school} onChange={(e) => { markDirty(); setSchool(e.target.value); }} className="font-hand mt-1" />
              </div>
              <div>
                <Label className="font-hand">{stageConfig.targetLabel}</Label>
                <Input value={targetSchool} onChange={(e) => { markDirty(); setTargetSchool(e.target.value); }} className="font-hand mt-1" />
              </div>
              <div>
                <Label className="font-hand">目标考试时间</Label>
                <Input type="date" value={examDate} onChange={(e) => { markDirty(); setExamDate(e.target.value); }} className="font-hand mt-1" />
              </div>
              <div>
                <Label className="font-hand">当前成绩概览</Label>
                <Input value={currentScore} onChange={(e) => { markDirty(); setCurrentScore(e.target.value); }} placeholder="如：语92 数78 英85" className="font-hand mt-1" />
              </div>
              <div>
                <Label className="font-hand">目标成绩</Label>
                <Input value={targetScore} onChange={(e) => setTargetScore(e.target.value)} className="font-hand mt-1" />
              </div>
              <div>
                <Label className="font-hand">薄弱科目 *</Label>
                <Input value={weakSubjects} onChange={(e) => { markDirty(); setWeakSubjects(e.target.value); }} placeholder="如：数学、英语" className="font-hand mt-1" />
              </div>
              <div>
                <Label className="font-hand">优势科目</Label>
                <Input value={strongSubjects} onChange={(e) => { markDirty(); setStrongSubjects(e.target.value); }} className="font-hand mt-1" />
              </div>
            </div>
          </WobblyCard>

          <WobblyCard variant="yellow" wobblyIndex={1} hoverable={false} className="p-4 space-y-4">
            <h2 className="font-marker font-bold">时间与课表</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="font-hand">每周可支配时长(小时) *</Label>
                <Input value={weeklyHours} onChange={(e) => { markDirty(); setWeeklyHours(e.target.value); }} className="font-hand mt-1" />
              </div>
              <div>
                <Label className="font-hand">每天可学习时长(小时)</Label>
                <Input value={dailyHours} onChange={(e) => setDailyHours(e.target.value)} className="font-hand mt-1" />
              </div>
              <div>
                <Label className="font-hand">走读/住读 *</Label>
                <Select value={boardingType} onValueChange={(v) => { markDirty(); setBoardingType(v); }}>
                  <SelectTrigger className="font-hand mt-1"><SelectValue placeholder="请选择" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">走读</SelectItem>
                    <SelectItem value="boarding">住读</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-hand">是否有晚自习</Label>
                <Select value={eveningStudy} onValueChange={setEveningStudy}>
                  <SelectTrigger className="font-hand mt-1"><SelectValue placeholder="请选择" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">有</SelectItem>
                    <SelectItem value="no">无</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label className="font-hand">课外班/固定占用时间</Label>
                <Input value={extracurricular} onChange={(e) => setExtracurricular(e.target.value)} className="font-hand mt-1" />
              </div>
              <div className="sm:col-span-2">
                <Label className="font-hand">周一~周日可学习时间段</Label>
                <Textarea
                  value={weeklySchedule}
                  onChange={(e) => setWeeklySchedule(e.target.value)}
                  placeholder={WEEKDAYS.map((d) => `${d}：19:00-21:00`).join('\n')}
                  className="font-hand mt-1 min-h-[80px]"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="font-hand">每日课表与作业量（如：周二只有语数外）</Label>
                <Textarea
                  value={timetableNotes}
                  onChange={(e) => setTimetableNotes(e.target.value)}
                  className="font-hand mt-1 min-h-[80px]"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="font-hand">个性化说明（注意力、通勤、周末安排等）</Label>
                <Textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="font-hand mt-1 min-h-[100px]"
                />
              </div>
            </div>
            <Button className="font-hand w-full" disabled={loading} onClick={handleGenerate}>
              {loading ? <><Loader2 className="mr-2 size-4 animate-spin" />生成中...</> : '生成个性化学习规划'}
            </Button>
          </WobblyCard>
        </div>

        <WobblyCard variant="white" decoration="tape" wobblyIndex={2} hoverable={false} className="p-4 lg:min-h-[480px]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-marker font-bold">学习计划报告</h2>
            {report && (
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              </Button>
            )}
          </div>
          {loading && !report && (
            <div className="flex items-center gap-2 py-12 font-hand text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              正在生成结构化学习计划...
            </div>
          )}
          {!loading && !report && (
            <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
              <AlertCircle className="mb-2 size-8 opacity-40" />
              <p className="font-hand text-sm">填写左侧信息后生成</p>
              <p className="font-hand mt-1 text-xs">将包含周计划表、日安排、科目拆解与检测标准</p>
            </div>
          )}
          {report && (
            <div className="font-hand prose-headings:font-marker max-h-[70vh] overflow-auto">
              <Streamdown>{report}</Streamdown>
            </div>
          )}
        </WobblyCard>
      </div>
    </div>
  );
};

export default StudyPlan;
