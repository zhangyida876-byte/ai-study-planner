import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, Loader2, Clock, Target, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  caseArchive as caseArchiveApi,
  diagnosis as diagnosisApi,
  policy as policyApi,
} from '@client/src/api';
import {
  streamDiagnosisReport,
  streamPolicySearch,
  buildScoresText,
  buildDiagnosisPrompt,
  getEducationStage,
  type DiagnosisFormContext,
  type EducationStage,
} from '@client/src/api/plugins';
import WobblyCard from '@client/src/components/WobblyCard';
import ProfileAutofillBanner from '@client/src/components/ProfileAutofillBanner';
import ReferenceScriptCard from '@client/src/components/ReferenceScriptCard';
import DiagnosisRoadmapChart from '@client/src/components/DiagnosisRoadmapChart';
import { Streamdown } from '@client/src/components/ui/streamdown';
import { Button } from '@/components/ui/button';
import DiagnosisForm, { type DiagnosisFormData } from './DiagnosisForm';
import { useRequiredStage } from '@client/src/hooks/use-stage';
import { useStageProfile } from '@client/src/hooks/use-stage-profile';
import { stagePath } from '@client/src/config/stages';
import { loadModuleSession, saveModuleSession } from '@client/src/utils/module-session';
import { buildReferenceScript, pickFirstSentence } from '@client/src/utils/reference-script';
import { getInternalScriptAnchor } from '@client/src/config/internal-resource-library';
import { buildMiddleSchoolBenchmarkContext } from '@client/src/utils/school-benchmarks';
import { formatDiagnosisDate, getAcademicPeriod } from '@client/src/utils/diagnosis-timing';
import { getVersionForProvinceSubject } from '@client/src/pages/Knowledge/KnowledgeFilterPanel';

/* ===== Helpers ===== */

function getCountdown(examDate: string): number | null {
  if (!examDate) return null;
  const target = new Date(examDate);
  const now = new Date();
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function getExamLabel(grade: string): string {
  const stage = getEducationStage(grade);
  if (stage === 'high') return '高考';
  if (stage === 'middle') return '中考';
  return '小升初';
}

async function resolveAutomaticTargetContext(
  region: string,
  stage: EducationStage,
): Promise<string> {
  const currentYear: string = String(new Date().getFullYear());
  let databaseContext = '';

  if (stage === 'middle') {
    try {
      const result = await policyApi.searchSchools(region, '中考');
      const benchmark = buildMiddleSchoolBenchmarkContext(result.schools, result.year);
      databaseContext = benchmark.text;
      if (benchmark.complete) return databaseContext;
    } catch {
      databaseContext = '';
    }
  }

  const keyword = stage === 'middle'
    ? '普通高中和重点高中各1所 学校名称 官方录取分数线 年份'
    : stage === 'high'
      ? '稳妥院校和冲刺院校各1所 官方投档线 年份'
      : '本地代表性公办初中和优质初中 入学政策';
  let internetContext = '';
  try {
    for await (const chunk of streamPolicySearch({
      region,
      year: currentYear,
      keyword,
    })) {
      internetContext += chunk;
    }
  } catch {
    internetContext = '';
  }

  return [
    databaseContext,
    internetContext ? `联网补充参考：\n${internetContext.slice(0, 3000)}` : '',
    !databaseContext && !internetContext
      ? '未检索到可核验的学校与分数线，报告中必须标注待核实，不得编造学校或分数。'
      : '',
  ].filter(Boolean).join('\n');
}

async function resolveWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T,
): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = window.setTimeout(() => resolve(fallback), timeoutMs);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      () => {
        window.clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

type DiagnosisSubjectKey =
  | 'chinese'
  | 'math'
  | 'english'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'history'
  | 'geography'
  | 'politics';

const SUBJECT_LABELS: Record<DiagnosisSubjectKey, string> = {
  chinese: '语文',
  math: '数学',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
  biology: '生物',
  history: '历史',
  geography: '地理',
  politics: '政治&道法',
};

const CORE_SUBJECT_KEYS: DiagnosisSubjectKey[] = ['chinese', 'math', 'english'];
const ELECTIVE_12_KEYS: DiagnosisSubjectKey[] = ['chemistry', 'biology', 'politics', 'geography'];
const ALL_ELECTIVE_KEYS: DiagnosisSubjectKey[] = ['physics', 'chemistry', 'biology', 'history', 'geography', 'politics'];
const ALL_SUBJECT_KEYS: DiagnosisSubjectKey[] = [...CORE_SUBJECT_KEYS, ...ALL_ELECTIVE_KEYS];

function resolveExpectedSubjects(data: DiagnosisFormData): DiagnosisSubjectKey[] {
  const isHighSchool = ['高一', '高二', '高三'].includes(data.grade);
  const isElementary = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'].includes(data.grade);
  if (isElementary) return CORE_SUBJECT_KEYS;
  if (!isHighSchool) return [...CORE_SUBJECT_KEYS, ...ALL_ELECTIVE_KEYS];

  if (data.examMode === '3+1+2') {
    const preferred: DiagnosisSubjectKey = data.physics != null ? 'physics' : 'history';
    const selectedSecond = ELECTIVE_12_KEYS.filter((key) => typeof data[key] === 'number');
    return [...CORE_SUBJECT_KEYS, preferred, ...selectedSecond];
  }
  if (data.examMode === '3+3') {
    const selected = ALL_ELECTIVE_KEYS.filter((key) => typeof data[key] === 'number');
    return [...CORE_SUBJECT_KEYS, ...selected];
  }
  return CORE_SUBJECT_KEYS;
}

function resolveFilledSubjects(data: DiagnosisFormData): DiagnosisSubjectKey[] {
  return ALL_SUBJECT_KEYS.filter((key) => typeof data[key] === 'number');
}

/* ===== Component ===== */

const Diagnosis: React.FC = () => {
  const { stageSlug, stageConfig } = useRequiredStage();
  const { profile, regionText, updateProfile } = useStageProfile(stageSlug);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState('');
  const [generationError, setGenerationError] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [studentInfo, setStudentInfo] = useState<DiagnosisFormData | null>(null);
  const [majorInfoContent, setMajorInfoContent] = useState('');
  const [profileDirty, setProfileDirty] = useState(false);
  const [formSnapshot, setFormSnapshot] = useState<DiagnosisFormData | null>(null);
  const regionPartsRef = useRef({ province: '', city: '', county: '' });

  useEffect(() => {
    const cached = loadModuleSession<{
      reportContent: string;
      studentInfo: DiagnosisFormData | null;
      majorInfoContent: string;
      formSnapshot: DiagnosisFormData | null;
    }>(stageSlug, 'diagnosis');
    if (!cached) return;
    setReportContent(cached.reportContent || '');
    setStudentInfo(cached.studentInfo || null);
    setMajorInfoContent(cached.majorInfoContent || '');
    setFormSnapshot(cached.formSnapshot || null);
  }, [stageSlug]);

  useEffect(() => {
    saveModuleSession(stageSlug, 'diagnosis', {
      reportContent,
      studentInfo,
      majorInfoContent,
      formSnapshot,
    });
  }, [stageSlug, reportContent, studentInfo, majorInfoContent, formSnapshot]);

  useEffect(() => {
    if (!profileDirty) return;
    if (!formSnapshot) return;
    const timer = setTimeout(() => {
      const parts = formSnapshot.region?.split(' ').filter(Boolean) ?? [];
      const province = regionPartsRef.current.province || parts[0] || profile.province;
      const city = regionPartsRef.current.city || parts[1] || profile.city;
      const county = regionPartsRef.current.county || parts[2] || profile.county;
      updateProfile({
        province,
        city,
        county,
        grade: formSnapshot.grade || '',
        targetSchool: formSnapshot.targetSchool || '',
        targetMajor: formSnapshot.targetMajor || '',
        targetScore: formSnapshot.targetScore,
        examDate: formSnapshot.examDate || '',
        boardingType: (formSnapshot.boardingType as '' | 'day' | 'boarding') || '',
        examMode: formSnapshot.examMode || '',
        weeklyStudyHours: formSnapshot.monthlyStudyHours
          ? String(Math.round(formSnapshot.monthlyStudyHours / 4))
          : profile.weeklyStudyHours,
      });
      setProfileDirty(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [
    formSnapshot,
    updateProfile,
    profile.province,
    profile.city,
    profile.county,
    profile.weeklyStudyHours,
    profileDirty,
  ]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(reportContent);
      setCopied(true);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('复制失败');
    }
  }, [reportContent]);

  const onSubmit = useCallback(async (data: DiagnosisFormData) => {
    const safeGrade = stageConfig.grades.includes(data.grade)
      ? data.grade
      : stageConfig.grades[stageConfig.grades.length - 1];
    const normalizedData: DiagnosisFormData = { ...data, grade: safeGrade };
    setStudentInfo(normalizedData);

    const scores: Record<string, number> = {};
    const filledSubjectKeys = resolveFilledSubjects(normalizedData);
    const expectedSubjectKeys = resolveExpectedSubjects(normalizedData);
    for (const key of filledSubjectKeys) {
      const val = normalizedData[key];
      if (typeof val === 'number') {
        scores[SUBJECT_LABELS[key]] = val;
      }
    }
    const filledSubjects = Object.keys(scores);
    const missingSubjects = expectedSubjectKeys
      .map((key) => SUBJECT_LABELS[key])
      .filter((label) => !(label in scores));

    setIsGenerating(true);
    setReportContent('');
    setGenerationError('');
    setGenerationPhase('正在保存诊断信息...');

    let recordId: string | null = null;
    try {
      try {
        const createRes = await diagnosisApi.createDiagnosisRecord({
          studentName: normalizedData.studentName || '',
          grade: normalizedData.grade,
          region: normalizedData.region,
          scores,
          problemDesc: normalizedData.problemDesc || '',
        });
        recordId = createRes.id;
      } catch (saveError) {
        logger.error('诊断记录预保存失败，继续生成报告', String(saveError));
      }

      const stage = getEducationStage(normalizedData.grade);
      const hasExplicitTarget = Boolean(
        normalizedData.targetSchool?.trim() || normalizedData.targetScore != null,
      );
      setGenerationPhase(
        hasExplicitTarget ? '正在整理诊断依据...' : '正在匹配本地学校参照...',
      );
      const schoolReferenceContext = hasExplicitTarget
        ? ''
        : await resolveWithTimeout(
            resolveAutomaticTargetContext(normalizedData.region, stage),
            15000,
            '学校参照检索超时，本次先基于已有成绩完成诊断；具体学校与分数线待核实。',
          );
      const coreMax = stage === 'elementary' ? 100 : stage === 'middle' ? 120 : 150;
      const scoreMaxValues: Record<string, number> = {};
      for (const key of filledSubjectKeys) {
        const label = SUBJECT_LABELS[key];
        scoreMaxValues[label] =
          key === 'chinese' || key === 'math' || key === 'english' ? coreMax : 100;
      }
      const examType = stage === 'high' ? '高考模拟' : stage === 'middle' ? '中考模拟' : '小升初期末统考';
      const formCtx: DiagnosisFormContext = {
        grade: normalizedData.grade,
        region: normalizedData.region,
        scores,
        filledSubjects,
        missingSubjects,
        scoreMaxValues,
        examType,
        boardingType: normalizedData.boardingType,
        monthlyStudyHours: normalizedData.monthlyStudyHours,
        examMode: normalizedData.examMode,
        problemDesc: normalizedData.problemDesc,
        targetSchool: normalizedData.targetSchool,
        targetMajor: normalizedData.targetMajor,
        careerIntent: profile.careerIntent,
        targetScore: stage === 'elementary' ? undefined : normalizedData.targetScore,
        examDate: normalizedData.examDate,
        schoolReferenceContext,
        diagnosisDate: formatDiagnosisDate(),
        academicPeriod: getAcademicPeriod(),
        textbookVersions: Object.fromEntries(
          filledSubjects.map((subject) => [
            subject,
            getVersionForProvinceSubject(normalizedData.region, subject === '政治&道法' ? '政治' : subject),
          ]),
        ),
      };
      const scoresText = buildScoresText(scores, scoreMaxValues);
      const learningProblems = buildDiagnosisPrompt(formCtx, {
        stageSlug,
        profile,
      });
      const generator = streamDiagnosisReport({
        student_grade: normalizedData.grade,
        student_region: normalizedData.region,
        subject_scores: scoresText,
        learning_problems: learningProblems,
      });

      setGenerationPhase('正在生成诊断报告...');
      let fullContent = '';
      for await (const chunk of generator) {
        fullContent += chunk;
        setReportContent(fullContent);
      }

      if (!fullContent.trim()) {
        throw new Error('诊断服务未返回内容');
      }

      if (recordId) {
        setGenerationPhase('正在整理并归档报告...');
        try {
          await diagnosisApi.updateDiagnosisRecord(recordId, {
            status: 'completed',
            report: fullContent,
          });
        } catch (updateError) {
          logger.error('诊断记录更新失败，继续归档报告', String(updateError));
        }
      }

      try {
        await caseArchiveApi.createCaseArchive({
          studentName: normalizedData.studentName || profile.studentName || '未命名学生',
          stage: stageSlug,
          grade: normalizedData.grade,
          region: normalizedData.region,
          targetSchool: normalizedData.targetSchool,
          targetScore: normalizedData.targetScore,
          artifactType: 'diagnosis',
          title: `${normalizedData.grade}学情诊断`,
          content: fullContent,
          inputSnapshot: {
            scores,
            problemDesc: normalizedData.problemDesc || '',
            examDate: normalizedData.examDate || '',
          },
        });
        toast.success('诊断报告已生成并自动归档');
      } catch (archiveError) {
        logger.error('诊断报告自动归档失败', String(archiveError));
        toast.warning('报告已生成，但自动归档失败');
      }
    } catch (error) {
      logger.error('诊断报告生成失败', String(error));
      const message = error instanceof Error && error.message === '诊断服务未返回内容'
        ? '诊断服务暂未返回内容，请稍后重试'
        : '诊断报告生成失败，请稍后重试';
      setGenerationError(message);
      toast.error(message);
      if (recordId) {
        try {
          await diagnosisApi.updateDiagnosisRecord(recordId, { status: 'failed' });
        } catch {
          /* ignore */
        }
      }
    } finally {
      setIsGenerating(false);
      setGenerationPhase('');
    }
  }, [stageSlug, profile, stageConfig.grades]);

  const handleSyncProfileBack = useCallback(() => {
    const snapshot = formSnapshot || studentInfo;
    if (!snapshot) {
      toast.error('请先填写或修改表单信息后再同步');
      return;
    }
    updateProfile({
      province: regionPartsRef.current.province || profile.province,
      city: regionPartsRef.current.city || profile.city,
      county: regionPartsRef.current.county || profile.county,
      grade: snapshot.grade,
      targetSchool: snapshot.targetSchool || '',
      targetMajor: snapshot.targetMajor || '',
      targetScore: snapshot.targetScore,
      examDate: snapshot.examDate || '',
      boardingType: (snapshot.boardingType as '' | 'day' | 'boarding') || '',
      examMode: snapshot.examMode || '',
      weeklyStudyHours: snapshot.monthlyStudyHours
        ? String(Math.round(snapshot.monthlyStudyHours / 4))
        : profile.weeklyStudyHours,
    });
    toast.success('已同步回学段主页档案');
    setProfileDirty(false);
  }, [formSnapshot, studentInfo, updateProfile, profile]);

  const countdown = studentInfo?.examDate ? getCountdown(studentInfo.examDate) : null;
  const examLabel = studentInfo ? getExamLabel(studentInfo.grade) : '';
  const studentStage = studentInfo ? getEducationStage(studentInfo.grade) : 'middle';
  const totalScore = studentInfo
    ? (studentStage === 'high'
        ? ['chinese', 'math', 'english', 'physics', 'chemistry', 'biology', 'history', 'geography', 'politics']
        : studentStage === 'elementary'
          ? ['chinese', 'math', 'english']
          : ['chinese', 'math', 'english', 'physics', 'chemistry', 'biology', 'history', 'geography', 'politics']
      ).reduce((sum, key) => sum + ((studentInfo[key as keyof DiagnosisFormData] as number) || 0), 0)
    : 0;
  const scoreGap = (studentInfo?.targetScore != null && studentStage !== 'elementary') ? studentInfo.targetScore - totalScore : null;
  const prioritySubject = studentInfo
    ? resolveFilledSubjects(studentInfo)
        .map((key) => {
          const score = studentInfo[key];
          const coreMax = studentStage === 'elementary' ? 100 : studentStage === 'middle' ? 120 : 150;
          const max = CORE_SUBJECT_KEYS.includes(key) ? coreMax : 100;
          return { label: SUBJECT_LABELS[key], rate: typeof score === 'number' ? score / max : 1 };
        })
        .sort((a, b) => a.rate - b.rate)[0]?.label
    : undefined;
  const buildDiagnosisReferenceScript = useCallback(() => {
    if (!studentInfo) return '';
    const name = studentInfo.studentName || '孩子';
    const weak = profile.weakSubjects || '当前薄弱科目';
    const targetText = studentInfo.targetSchool
      ? `${studentInfo.targetSchool}${studentInfo.targetMajor ? `（${studentInfo.targetMajor}）` : ''}`
      : '';
    const gapText =
      scoreGap == null
        ? ''
        : scoreGap > 0
          ? `离目标还差${scoreGap}分`
          : `目前已经超过目标${Math.abs(scoreGap)}分`;
    const reportPoint = pickFirstSentence(reportContent);
    const internalAnchor = getInternalScriptAnchor(stageSlug, 'diagnosis');
    return buildReferenceScript([
      `先按一个原则：${internalAnchor}`,
      `${name}现在最该做的是把${weak}先稳住`,
      targetText ? `咱们目标是${targetText}` : '',
      gapText,
      reportPoint ? `我先说最关键一点：${reportPoint}` : '',
      '这周先别求全，先抓一科短板，每天固定时间做错题回炉，周末咱们再一起复盘怎么调。',
    ]);
  }, [studentInfo, profile.weakSubjects, scoreGap, reportContent]);

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <Button variant="ghost" size="sm" className="font-hand mb-2 -ml-2" asChild>
            <Link to={stagePath(stageSlug)}>
              <ArrowLeft className="mr-1 size-4" />
              返回{stageConfig.label}主页
            </Link>
          </Button>
          <h1 className="font-marker text-2xl font-bold">{stageConfig.label} · 学情诊断</h1>
          <p className="font-hand mt-1 text-sm text-muted-foreground">
            按{stageConfig.label}学段标准分析薄弱点、失分原因与升学影响
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
        <div className="min-w-0">
          <WobblyCard variant="white" decoration="tape" wobblyIndex={0} hoverable={false}>
            <div className="space-y-5 p-5">
              <div className="border-b-2 border-dashed border-ink/15 pb-4">
                <p className="font-hand text-xs font-bold text-marker-red">STEP 1</p>
                <h2 className="font-marker mt-1 text-xl font-bold">填写诊断信息</h2>
                <p className="font-hand mt-1 text-sm text-ink/60">
                  基础档案会自动带入，只需要核对目标、成绩和学习困扰。
                </p>
              </div>
              <div className="space-y-4">
                <DiagnosisForm
                  onSubmit={onSubmit}
                  isGenerating={isGenerating}
                  generationPhase={generationPhase}
                  generationError={generationError}
                  onMajorInfoChange={setMajorInfoContent}
                  allowedGrades={stageConfig.grades}
                  stageLabel={stageConfig.label}
                  stageProfile={profile}
                  onProfileFieldsChange={() => setProfileDirty(true)}
                  onRegionPartsChange={(parts) => { regionPartsRef.current = parts; }}
                  onFormSnapshotChange={(data) => { setFormSnapshot(data); }}
                />
              </div>
            </div>
          </WobblyCard>
        </div>

        <div className="min-w-0 space-y-4">
          {isGenerating || reportContent ? (
            <WobblyCard variant="yellow" decoration="tack" wobblyIndex={1} hoverable={false}>
              <div className="p-5">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-hand text-xs font-bold text-marker-red">STEP 2</p>
                    <h2 className="font-marker mt-1 text-2xl font-bold">
                      {studentInfo?.studentName ? `${studentInfo.studentName}的` : ''}诊断报告
                    </h2>
                  </div>
                  {reportContent && (
                    <Button variant="outline" size="sm" onClick={handleCopy} disabled={isGenerating}>
                      {copied ? (
                        <><Check className="mr-1 size-4" />已复制</>
                      ) : (
                        <><Copy className="mr-1 size-4" />复制全文</>
                      )}
                    </Button>
                  )}
                </div>

                <div className="mb-5 rounded-lg border-2 border-dashed border-ink/15 bg-white/70 p-4">
                  {/* Student info strip */}
                  {studentInfo && (
                    <div className="font-hand flex flex-wrap gap-2 text-sm text-ink/70">
                      {studentInfo.studentName && (
                        <span className="rounded-full border-2 border-ink/20 bg-card px-3 py-1">
                          {studentInfo.studentName}
                        </span>
                      )}
                      <span className="rounded-full border-2 border-ink/20 bg-card px-3 py-1">
                        {studentInfo.grade}
                      </span>
                      <span className="rounded-full border-2 border-ink/20 bg-card px-3 py-1">
                        {studentInfo.region}
                      </span>
                      {countdown != null && (
                        <span className="flex items-center gap-1 rounded-full border-2 border-marker-red/30 bg-marker-red/5 px-3 py-1 font-bold text-marker-red">
                          <Clock className="size-3.5" />
                          距{examLabel}还有 {countdown} 天
                        </span>
                      )}
                    </div>
                  )}

                  {/* Target school & score */}
                  {(studentInfo?.targetSchool || (studentInfo?.targetScore != null && studentStage !== 'elementary')) && (
                    <div className="mt-4 rounded-lg border-2 border-dashed border-pen-blue/30 bg-pen-blue/5 p-3">
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {studentInfo?.targetSchool && (
                          <div className="flex items-center gap-1.5">
                            <Target className="size-4 text-pen-blue" />
                            <span className="font-hand text-ink/60">
                              {studentStage === 'high' ? '目标大学：' : studentStage === 'elementary' ? '目标初中：' : '目标院校：'}
                            </span>
                            <span className="font-marker font-bold text-pen-blue">
                              {studentInfo.targetSchool}
                            </span>
                          </div>
                        )}
                        {studentInfo?.targetMajor && studentStage === 'high' && (
                          <div className="flex items-center gap-1.5">
                            <span className="font-hand text-ink/60">目标专业：</span>
                            <span className="font-marker font-bold text-marker-red">
                              {studentInfo.targetMajor}
                            </span>
                          </div>
                        )}
                        {studentStage === 'high' && profile.careerIntent && (
                          <div className="flex items-center gap-1.5">
                            <span className="font-hand text-ink/60">未来意向：</span>
                            <span className="font-marker font-bold text-ink">
                              {profile.careerIntent}
                            </span>
                          </div>
                        )}
                        {studentInfo?.targetScore != null && studentStage !== 'elementary' && (
                          <div className="flex items-center gap-1.5">
                            <span className="font-hand text-ink/60">
                              {studentStage === 'high' ? '大学投档线：' : '最新分数线：'}
                            </span>
                            <span className="font-marker font-bold text-pen-blue">
                              {studentInfo.targetScore}分
                            </span>
                            {scoreGap != null && (
                              <span className={`font-hand text-xs font-bold ${scoreGap > 0 ? 'text-marker-red' : 'text-emerald-600'}`}>
                                {scoreGap > 0 ? `差 ${scoreGap} 分` : `超 ${Math.abs(scoreGap)} 分`}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Major career info panel */}
                  {majorInfoContent && studentStage === 'high' && (
                    <div className="mt-3 rounded-lg border-2 border-marker-red/20 bg-marker-red/5 p-4">
                      <h3 className="font-marker mb-2 text-lg font-bold text-marker-red">专业与职业信息</h3>
                      <div className="font-hand prose-sm">
                        <Streamdown>{majorInfoContent}</Streamdown>
                      </div>
                    </div>
                  )}
                </div>

                {studentInfo && reportContent && (
                  <DiagnosisRoadmapChart
                    grade={studentInfo.grade}
                    stage={studentStage}
                    examDate={studentInfo.examDate}
                    prioritySubject={prioritySubject}
                  />
                )}

                {isGenerating && !reportContent && (
                  <div className="flex items-center gap-3 py-12 font-hand text-xl text-muted-foreground">
                    <Loader2 className="size-5 animate-spin" />
                    正在生成诊断报告...
                  </div>
                )}

                {reportContent && (
                  <div className="font-hand prose-headings:font-marker rounded-lg bg-white/70 p-4">
                    <Streamdown>{reportContent}</Streamdown>
                  </div>
                )}
              </div>
            </WobblyCard>
          ) : (
            <WobblyCard variant="yellow" decoration="tack" wobblyIndex={1} hoverable={false}>
              <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
                <p className="font-hand text-xs font-bold text-marker-red">STEP 2</p>
                <p className="font-marker mt-2 text-2xl font-bold text-ink">生成学情诊断报告</p>
                <p className="font-hand mt-2 max-w-md text-sm text-muted-foreground">
                  在上方确认基础信息和各科成绩后，点击“生成诊断报告”，这里会展示宽版诊断结果和备考危机时间轴。
                </p>
              </div>
            </WobblyCard>
          )}
          <div className="mt-4">
            <ReferenceScriptCard
              onGenerate={buildDiagnosisReferenceScript}
              hint="基于当前诊断结果生成可直接和孩子沟通的话术（300字内）。"
              wobblyIndex={31}
            />
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default Diagnosis;
