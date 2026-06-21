import React, { useState, useCallback } from 'react';
import { Copy, Check, Loader2, Clock, Target } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { diagnosis as diagnosisApi } from '@client/src/api';
import { streamDiagnosisReport, buildScoresText, buildDiagnosisPrompt, getEducationStage, type DiagnosisFormContext } from '@client/src/api/plugins';
import WobblyCard from '@client/src/components/WobblyCard';
import { Streamdown } from '@client/src/components/ui/streamdown';
import { Button } from '@/components/ui/button';
import DiagnosisForm, { type DiagnosisFormData } from './DiagnosisForm';

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

/* ===== Component ===== */

const Diagnosis: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [studentInfo, setStudentInfo] = useState<DiagnosisFormData | null>(null);
  const [majorInfoContent, setMajorInfoContent] = useState('');

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
    setStudentInfo(data);

    const scores: Record<string, number> = {};
    const activeFields = ['chinese', 'math', 'english', 'physics', 'chemistry', 'biology', 'history', 'geography', 'politics'] as const;
    const labels: Record<string, string> = {
      chinese: '语文', math: '数学', english: '英语',
      physics: '物理', chemistry: '化学', biology: '生物',
      history: '历史', geography: '地理', politics: '政治&道法',
    };
    for (const key of activeFields) {
      const val = data[key];
      if (typeof val === 'number') {
        scores[labels[key]] = val;
      }
    }

    setIsGenerating(true);
    setReportContent('');

    let recordId: string | null = null;
    try {
      const createRes = await diagnosisApi.createDiagnosisRecord({
        studentName: data.studentName || '',
        grade: data.grade,
        region: data.region,
        scores,
        problemDesc: data.problemDesc || '',
      });
      recordId = createRes.id;

      const stage = getEducationStage(data.grade);
      const coreMax = stage === 'elementary' ? 100 : stage === 'middle' ? 120 : 150;
      const scoreMaxValues: Record<string, number> = {
        '语文': coreMax, '数学': coreMax, '英语': coreMax,
        '物理': 100, '化学': 100, '生物': 100,
        '历史': 100, '地理': 100, '政治&道法': 100,
      };
      const examType = stage === 'high' ? '高考模拟' : stage === 'middle' ? '中考模拟' : '小升初期末统考';
      const formCtx: DiagnosisFormContext = {
        grade: data.grade,
        region: data.region,
        scores,
        scoreMaxValues,
        examType,
        boardingType: data.boardingType,
        monthlyStudyHours: data.monthlyStudyHours,
        examMode: data.examMode,
        problemDesc: data.problemDesc,
        targetSchool: data.targetSchool,
        targetMajor: data.targetMajor,
        targetScore: stage === 'elementary' ? undefined : data.targetScore,
        examDate: data.examDate,
      };
      const scoresText = buildScoresText(scores, scoreMaxValues);
      const learningProblems = buildDiagnosisPrompt(formCtx);
      const generator = streamDiagnosisReport({
        student_grade: data.grade,
        student_region: data.region,
        subject_scores: scoresText,
        learning_problems: learningProblems,
      });

      let fullContent = '';
      for await (const chunk of generator) {
        fullContent += chunk;
        setReportContent(fullContent);
      }

      if (recordId) {
        await diagnosisApi.updateDiagnosisRecord(recordId, {
          status: 'completed',
          report: fullContent,
        });
      }

      toast.success('诊断报告生成完成');
    } catch (error) {
      logger.error('诊断报告生成失败', String(error));
      toast.error('诊断报告生成失败，请重试');
      if (recordId) {
        try {
          await diagnosisApi.updateDiagnosisRecord(recordId, { status: 'failed' });
        } catch {
          /* ignore */
        }
      }
    } finally {
      setIsGenerating(false);
    }
  }, []);

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

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Left: Form */}
      <div className="w-full shrink-0 lg:w-96">
        <WobblyCard variant="white" decoration="tape" wobblyIndex={0} hoverable={false}>
          <div className="p-6">
            <h2 className="font-marker mb-6 text-2xl font-bold">学生信息</h2>
            <DiagnosisForm onSubmit={onSubmit} isGenerating={isGenerating} onMajorInfoChange={setMajorInfoContent} />
          </div>
        </WobblyCard>
      </div>

      {/* Right: Report */}
      <div className="min-w-0 flex-1">
        {isGenerating || reportContent ? (
          <WobblyCard variant="yellow" decoration="tack" wobblyIndex={1} hoverable={false}>
            <div className="p-6">
              {/* Report Header with student info */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-marker text-2xl font-bold">
                    {studentInfo?.studentName ? `${studentInfo.studentName}的` : ''}诊断报告
                  </h2>
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

                {/* Student info strip */}
                {studentInfo && (
                  <div className="font-hand mt-3 flex flex-wrap gap-3 text-sm text-ink/70">
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
                  <div className="mt-3 rounded-lg border-2 border-dashed border-pen-blue/30 bg-pen-blue/5 p-3">
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

              {isGenerating && !reportContent && (
                <div className="flex items-center gap-3 py-12 font-hand text-xl text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" />
                  正在生成诊断报告...
                </div>
              )}

              {reportContent && (
                <div className="font-hand prose-headings:font-marker">
                  <Streamdown>{reportContent}</Streamdown>
                </div>
              )}
            </div>
          </WobblyCard>
        ) : (
          <div className="flex h-full min-h-[400px] items-center justify-center">
            <p className="font-hand text-xl text-muted-foreground">
              填写学生信息，开始诊断
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Diagnosis;
