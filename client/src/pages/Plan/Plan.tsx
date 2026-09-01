import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Copy, FileText, Clock, Search, Loader2, ArrowLeft } from 'lucide-react';
import WobblyCard from '@client/src/components/WobblyCard';
import { Streamdown } from '@client/src/components/ui/streamdown';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@client/src/components/ui/tabs';
import { copyText } from '@client/src/utils/clipboard';
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
  buildPlanAdditionalInfo,
  extractSubjectMaxHintsFromPolicyText,
  getKnownSubjectMaxHints,
  type PlanFormContext,
} from '@client/src/api/plugins';
import PlanTimeline from './PlanTimeline';
import PlanScoreInput, { type ExamType } from './PlanScoreInput';
import PlanSchoolRecommend from './PlanSchoolRecommend';
import { EXAM_TYPE_CONFIG } from './regionData';
import type { AdmissionPolicy, AdmissionLine } from '@shared/api.interface';
import { useRequiredStage } from '@client/src/hooks/use-stage';
import { useStageProfile } from '@client/src/hooks/use-stage-profile';
import ProfileAutofillBanner from '@client/src/components/ProfileAutofillBanner';
import ReferenceScriptCard from '@client/src/components/ReferenceScriptCard';
import { getPlanAutofillFromProfile } from '@client/src/utils/stage-profile-sync';
import { stagePath } from '@client/src/config/stages';
import { toSelectValue } from '@client/src/lib/utils';
import { policy as policyApi } from '@client/src/api';
import { clearModuleSession, loadModuleSession, saveModuleSession } from '@client/src/utils/module-session';
import { buildReferenceScript, pickFirstSentence } from '@client/src/utils/reference-script';
import { getInternalScriptAnchor } from '@client/src/config/internal-resource-library';
import {
  createCustomRegionOption,
  filterRegionOptions,
  findOptionByName,
  loadCities,
  loadCounties,
  loadProvinces,
  type RegionOption,
} from '@client/src/utils/region-network';

const HS_MODES = [
  { value: '3+1+2', label: '3+1+2（物理/历史 二选一）' },
  { value: '3+3', label: '3+3（六选三）' },
];

const GRADE_OPTIONS: Record<ExamType, string[]> = {
  '小升初': ['三年级', '四年级', '五年级', '六年级'],
  '中考': ['初一', '初二', '初三'],
  '高考': ['高一', '高二', '高三'],
};

function normalizeStageGrade(grade: string, allowedGrades: string[]): string {
  if (allowedGrades.includes(grade)) return grade;
  return allowedGrades[allowedGrades.length - 1] || '';
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

function sanitizePolicyContentByStage(content: string, stageSlug: string): string {
  if (!content) return '';
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (stageSlug === 'elementary') {
    return lines
      .filter((line) => !/(中考|高考|生地会考|本科|专科|投档线|录取分数线)/.test(line))
      .filter((line) => /(小升初|义务教育|公民同招|划片|摇号|对口直升|民办|公办|入学|学位)/.test(line))
      .slice(0, 10)
      .join('\n');
  }
  if (stageSlug === 'middle') {
    return lines
      .filter((line) => !/(高考|本科|专科|选科组合|赋分)/.test(line))
      .slice(0, 12)
      .join('\n');
  }
  return lines
    .filter((line) => !/(小升初|公民同招|划片摇号)/.test(line))
    .slice(0, 12)
    .join('\n');
}

function inferPolicyStage(policy: AdmissionPolicy): 'elementary' | 'middle' | 'high' | 'unknown' {
  const scoreStructureText = Object.keys(policy.scoreStructure || {}).join(' ');
  const text = `${policy.policyContent || ''} ${scoreStructureText} ${(policy.admissionLines || []).map((line) => `${line.batch} ${line.school}`).join(' ')}`;
  if (/(高考|本科|专科|物理类|历史类|大学|学院|专业组|志愿批次)/.test(text)) return 'high';
  if (/(中考|普高|会考|中招|中考分|统招线|投档线)/.test(text)) return 'middle';
  if (/(小升初|义务教育|公民同招|划片|摇号|对口直升|入学)/.test(text)) return 'elementary';
  if (policy.totalScore >= 650) return 'middle';
  if (policy.totalScore > 0 && policy.totalScore <= 400) return 'elementary';
  return 'unknown';
}

function buildCompactPolicyContext(input: {
  policy: AdmissionPolicy | null;
  examType: ExamType;
  totalScore: number;
  targetScore?: number;
}): string {
  const { policy, examType, totalScore, targetScore } = input;
  if (!policy) return '暂无该地区政策数据';
  const lines = [...policy.admissionLines].sort((a, b) => a.score - b.score);
  const nearest = lines
    .map((line) => ({
      ...line,
      diff: Math.abs(line.score - (targetScore ?? totalScore)),
    }))
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 5);
  const descendingLines = [...policy.admissionLines].sort((a, b) => b.score - a.score);
  const keyReference = descendingLines[0];
  const ordinaryReference = descendingLines[Math.floor(descendingLines.length / 2)];

  const structure = Object.entries(policy.scoreStructure)
    .map(([subject, score]) => `${subject}${score}分`)
    .slice(0, 8)
    .join('、');
  const lineText = nearest.map((line) => `${line.school} ${line.score}分`).join('；');
  const policySummary = summarizePolicyText(policy.policyContent)
    .replace(/^- /gm, '')
    .split('\n')
    .slice(0, 2)
    .join('；');

  if (examType === '小升初') {
    return [
      `升学类型：小升初`,
      structure ? `学科结构参考：${structure}` : '',
      `入学政策关键点：${policySummary || '以官方最新发布为准'}`,
      '说明：小升初一般以入学规则为主，不以中高考录取分数线为依据。',
    ]
      .filter(Boolean)
      .join('\n');
  }

  return [
    `${examType}总分：${policy.totalScore}分`,
    `科目结构：${structure}`,
    `与你当前分数最相关录取线：${lineText}`,
    !targetScore && examType === '中考' && keyReference
      ? `重点高中参考候选：${keyReference.school} ${keyReference.score}分（${policy.year}年）`
      : '',
    !targetScore && examType === '中考' && ordinaryReference
      ? `普通高中参考候选：${ordinaryReference.school} ${ordinaryReference.score}分（${policy.year}年；系统按收录分数线中位样本初步分层，非官方学校等级认定）`
      : '',
    `政策关键点：${policySummary || '以官方最新发布为准'}`,
  ].filter(Boolean).join('\n');
}

function buildElementaryTimelineMarkdown(input: {
  region: string;
  examYear: number;
  currentYear: number;
  policyHint: string;
}): string {
  const { region, examYear, currentYear, policyHint } = input;
  const yearText = `${Math.max(currentYear, examYear - 1)}-${examYear}`;
  const hint = policyHint || '以当地教育局/招考部门当年入学通知为准';
  return [
    '# 小升初时间路线图',
    '',
    `- 地区：${region || '待补充'}`,
    `- 适用周期：${yearText}`,
    '- 说明：仅适用于小升初/小六毕业统考，不含中考/高考节点。',
    '',
    '## 9月：信息摸底与基础盘点',
    '- 核对学籍、户籍、居住证、房产/租房等入学资格材料。',
    '- 确认公办对口、民办摇号、寄宿/特色班等可选路径。',
    '- 学习意义：把语数英基础薄弱点列清楚，避免六年级下学期只忙材料、没时间补基础。',
    '',
    '## 10月：目标初中范围初筛',
    '- 按区县政策梳理公办对口、民办摇号、特色班、寄宿等路径。',
    '- 学习意义：根据目标校风格判断语文阅读、数学应用题、英语词汇是否需要提前补。',
    '',
    '## 11月：第一次阶段测评',
    '- 建议做一次语数英综合测评，记录每科失分题型。',
    '- 重要性：这是寒假前最关键的补弱依据，不能只看总分。',
    '',
    '## 12月：目标校范围确认',
    '- 根据区域政策确定 3 所目标初中（冲/稳/保）。',
    '- 关注学校开放日、招生简章发布时间。',
    '- 学习意义：目标越明确，寒假补习越能聚焦具体题型。',
    '',
    '## 1月：期末考试与寒假计划',
    '- 用期末成绩校验基础稳定性，重点看计算、阅读理解、英语词汇语法。',
    '- 重要性：寒假是小升初前最后一个可系统补弱窗口。',
    '',
    '## 2月：寒假补弱验收',
    '- 完成一次寒假前后对比测，检查错题回炉是否有效。',
    '- 学习意义：若同类错题仍反复错，开学后必须缩小目标、先保基础。',
    '',
    '## 3月：报名政策密集发布',
    '- 按官方通知完成系统报名与材料上传。',
    '- 对口与摇号类流程注意截止时间，避免错过。',
    '- 学习意义：材料流程和学习节奏会同时挤压，必须固定每日基础训练。',
    '',
    '## 4月：第二次阶段测评与路径确认',
    '- 建议做一次语数英综合测评，范围覆盖六年级核心内容。',
    '- 重要性：这是判断冲刺/稳妥/保底路径是否需要调整的关键节点。',
    '',
    '## 5月：毕业统考/校内测评冲刺',
    '- 重点稳定语文阅读、数学应用题、英语完形/阅读等高频失分点。',
    '- 学习意义：最后一个月不适合大面积补新内容，要做错题回炉和限时训练。',
    '',
    '## 6月：毕业统考与录取流程',
    '- 完成小六毕业统考（若当地组织）。',
    '- 关注民办摇号、公办分配、录取确认时间。',
    '- 重要性：成绩和材料都进入确认期，家长要每天关注官方通知。',
    '',
    '## 7月：录取确认与分班准备',
    '- 完成录取确认、报到与分班信息登记。',
    '- 学习意义：开始做初一数学计算、英语词汇和语文阅读衔接。',
    '',
    '## 8月：初中衔接强化',
    '- 建议每周安排 3 次数学计算与应用题、2 次英语词汇语法、2 次语文阅读。',
    '- 重要性：暑假衔接不到位，初一第一次月考容易直接掉队。',
    '',
    `政策核验提示：${hint}`,
    '数据要求：关键节点至少交叉核验 2 个来源（教育局官网 + 招考部门公告）。',
  ].join('\n');
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

interface HighMajorRecommendation {
  direction: string;
  majors: string[];
  reason: string;
  jobs: string;
}

interface PlanSessionState {
  examType: ExamType;
  grade: string;
  examMode: string;
  examYear: number;
  selectedProvince: string;
  selectedCity: string;
  county: string;
  region: string;
  isCustomRegion: boolean;
  customRegionText: string;
  scores: Record<string, number>;
  targetSchool: string;
  targetScore?: number;
  careerIntent: string;
  boardingType: string;
  reportContent: string;
  timelineContent: string;
}

function detectTopSubjects(scores: Record<string, number>): string[] {
  return Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([subject]) => subject);
}

function buildHighMajorRecommendations(input: {
  scores: Record<string, number>;
  careerIntent: string;
  examMode?: string;
}): HighMajorRecommendation[] {
  const { scores, careerIntent, examMode } = input;
  const intent = careerIntent.trim();
  const tops = detectTopSubjects(scores);
  const hasPhysics = (scores['物理'] ?? 0) > 0;
  const hasHistory = (scores['历史'] ?? 0) > 0;
  const recs: HighMajorRecommendation[] = [];

  const intentRules: Array<{
    keywords: string[];
    item: HighMajorRecommendation;
  }> = [
    {
      keywords: ['人工智能', 'ai', '编程', '软件', '算法', '计算机', '互联网'],
      item: {
        direction: '智能技术方向',
        majors: ['计算机科学与技术', '人工智能', '软件工程', '数据科学与大数据技术'],
        reason: '意向与技术研发岗位高度匹配，建议重点保数学与物理竞争力。',
        jobs: '算法工程师 / 软件开发 / 数据分析',
      },
    },
    {
      keywords: ['医生', '医学', '生物', '药学', '护理', '口腔'],
      item: {
        direction: '医学健康方向',
        majors: ['临床医学', '口腔医学', '药学', '生物医学工程'],
        reason: '医学路径对长期学习稳定性要求高，建议优先强化理科基础与英语阅读。',
        jobs: '医生 / 医疗研发 / 医药产品',
      },
    },
    {
      keywords: ['金融', '会计', '商业', '管理', '经济', '投行'],
      item: {
        direction: '经管金融方向',
        majors: ['金融学', '经济学', '会计学', '工商管理'],
        reason: '经管方向可与数学、语文表达优势结合，后续就业口径更广。',
        jobs: '金融分析 / 审计 / 商业运营',
      },
    },
    {
      keywords: ['法律', '法学', '律师', '检察', '公务员'],
      item: {
        direction: '法政公共方向',
        majors: ['法学', '政治学与行政学', '公共管理', '社会学'],
        reason: '法政方向强调阅读、逻辑与表达，建议强化语文、历史与政治学科能力。',
        jobs: '律师 / 法务 / 公共事务',
      },
    },
    {
      keywords: ['设计', '传媒', '新闻', '内容', '新媒体', '动画'],
      item: {
        direction: '创意传播方向',
        majors: ['新闻传播学', '数字媒体技术', '视觉传达设计', '广告学'],
        reason: '创意方向需要表达与作品积累，建议同步建设语文表达与项目作品集。',
        jobs: '内容策划 / 设计师 / 品牌传播',
      },
    },
  ];

  for (const rule of intentRules) {
    if (rule.keywords.some((kw) => intent.toLowerCase().includes(kw.toLowerCase()))) {
      recs.push(rule.item);
    }
  }

  if (recs.length === 0) {
    const topText = tops.length > 0 ? tops.join('、') : '当前已填科目';
    recs.push({
      direction: '优势学科驱动方向',
      majors: ['信息类', '经管类', '教育类'],
      reason: `基于你已填科目中优势科目（${topText}）做第一轮方向筛选，后续再按兴趣细化。`,
      jobs: '按方向选择：技术 / 管理 / 教育服务',
    });
  }

  if (examMode === '3+1+2' && !hasPhysics && hasHistory) {
    recs.push({
      direction: '选科约束提醒',
      majors: ['法学', '新闻传播', '汉语言', '教育学'],
      reason: '当前更偏历史组合，部分工科和医学专业可能受限，建议提前核对目标院校选科要求。',
      jobs: '文社科与公共管理岗位为主',
    });
  }

  if (examMode === '3+1+2' && hasPhysics) {
    recs.push({
      direction: '理工通道保留',
      majors: ['电子信息工程', '自动化', '机械工程', '计算机类'],
      reason: '已保留物理通道，理工热门专业可继续冲刺，建议补强数学与英语稳定性。',
      jobs: '研发工程师 / 产品技术岗',
    });
  }

  return recs.slice(0, 3);
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

function buildParentCommunicationTemplate(input: {
  plan: GapActionPlan | null;
  decomposition: TargetDecomposition | null;
  weakSubjectsText?: string;
  strongSubjectsText?: string;
}): string[] {
  const { plan, decomposition, weakSubjectsText, strongSubjectsText } = input;
  const weak = weakSubjectsText?.trim();
  const strong = strongSubjectsText?.trim();
  const weakLine = weak
    ? `我们先从你最吃力的${weak}下手，每次只解决一个小问题。`
    : '我们先从最难的两科开始，每次只解决一个小问题。';
  const strongLine = strong
    ? `你在${strong}上有优势，我们把它当“稳定得分区”，先把信心守住。`
    : '先保住你最稳的科目分数，再集中补短板。';

  if (!plan) {
    return [
      '先共情：我知道你最近很辛苦，我们先把目标定小一点，一起慢慢来。',
      weakLine,
      strongLine,
      '复盘方式：今天只看一件做好的事，再定明天一个最小行动。',
    ];
  }

  const decompLine = decomposition
    ? `你已经填了${decomposition.enteredCount}科，剩余${decomposition.missingCount}科按计划补齐就有机会到线。`
    : `我们先按每周提升${plan.weeklyTarget}分推进，别一次把目标拉太满。`;

  return [
    `开场共情：这段时间不容易，我们不谈大道理，只看每周进步 ${plan.weeklyTarget} 分。`,
    `目标协商：距离目标还差 ${plan.gapScore} 分，拆成每月 +${plan.monthlyTarget} 分，你和我一起盯过程。`,
    weakLine,
    strongLine,
    decompLine,
    '执行口令：先做 30 分钟错题回炉，再做 20 分钟限时训练，做完就休息。',
    '复盘提问：今天哪一步最难？你希望我明天怎么配合你（提醒/陪练/检查）？',
  ];
}

interface PlanProps {
  embedded?: boolean;
}

const Plan: React.FC<PlanProps> = ({ embedded = false }) => {
  const { stageSlug, stageConfig } = useRequiredStage();
  const { profile, regionText, updateProfile } = useStageProfile(stageSlug);
  const [examType, setExamType] = useState<ExamType>(stageConfig.examType);
  const [grade, setGrade] = useState<string>(stageConfig.grades[stageConfig.grades.length - 1]);
  const [profileDirty, setProfileDirty] = useState(false);

  useEffect(() => {
    setExamType(stageConfig.examType);
    setGrade(stageConfig.grades[stageConfig.grades.length - 1]);
  }, [stageConfig]);

  useEffect(() => {
    if (examType !== stageConfig.examType) {
      setExamType(stageConfig.examType);
    }
  }, [examType, stageConfig.examType]);

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
  const [regionLoading, setRegionLoading] = useState(false);
  const [provinceOptions, setProvinceOptions] = useState<RegionOption[]>([]);
  const [cityOptions, setCityOptions] = useState<RegionOption[]>([]);
  const [countyOptions, setCountyOptions] = useState<RegionOption[]>([]);
  const [provinceSearch, setProvinceSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [countySearch, setCountySearch] = useState('');
  const [cityLoadFailed, setCityLoadFailed] = useState(false);
  const [countyLoadFailed, setCountyLoadFailed] = useState(false);
  const [customCityMode, setCustomCityMode] = useState(false);
  const [customCountyMode, setCustomCountyMode] = useState(false);
  const [customRegionText, setCustomRegionText] = useState('');

  const [scores, setScores] = useState<Record<string, number>>({});
  const [policies, setPolicies] = useState<AdmissionPolicy[]>([]);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policySearchContent, setPolicySearchContent] = useState('');
  const [subjectMaxHints, setSubjectMaxHints] = useState<Record<string, number>>({});
  const [policySearchLoading, setPolicySearchLoading] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [timelineContent, setTimelineContent] = useState('');
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [activeOutput, setActiveOutput] = useState<'report' | 'timeline'>('report');
  const [targetSchool, setTargetSchool] = useState('');
  const [targetScore, setTargetScore] = useState<number | undefined>(undefined);
  const [careerIntent, setCareerIntent] = useState('');
  const [boardingType, setBoardingType] = useState('');
  const applyingProfileRef = useRef(false);
  const hydratedRef = useRef(false);
  const targetSchoolFromProfileRef = useRef(false);
  const hideElementaryPlanBlocks = false;

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
    if (!selectedProvince || isCustomRegion) {
      setCityOptions([]);
      setCountyOptions([]);
      return;
    }
    const province = findOptionByName(provinceOptions, selectedProvince);
    if (!province) return;
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
  }, [selectedProvince, provinceOptions, isCustomRegion]);

  useEffect(() => {
    if (!selectedCity || isCustomRegion) {
      setCountyOptions([]);
      return;
    }
    const city = findOptionByName(cityOptions, selectedCity);
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
  }, [selectedCity, cityOptions, isCustomRegion]);

  const filteredProvinces = filterRegionOptions(provinceOptions, provinceSearch);
  const filteredCities = filterRegionOptions(
    selectedCity && !findOptionByName(cityOptions, selectedCity)
      ? [...cityOptions, createCustomRegionOption(selectedCity, 'city')]
      : cityOptions,
    citySearch,
  );
  const filteredCounties = filterRegionOptions(
    county && !findOptionByName(countyOptions, county)
      ? [...countyOptions, createCustomRegionOption(county, 'county')]
      : countyOptions,
    countySearch,
  );
  const selectedCityValue = customCityMode || (selectedCity && !findOptionByName(cityOptions, selectedCity))
    ? '__custom_city__'
    : toSelectValue(selectedCity);
  const selectedCountyValue = customCountyMode || (county && !findOptionByName(countyOptions, county))
    ? '__custom_county__'
    : toSelectValue(county);
  const filteredPolicies = useMemo(() => {
    if (examType === '小升初') return [];
    return policies.filter((item) => {
      const inferred = inferPolicyStage(item);
      if (stageConfig.slug === 'elementary') {
        if (inferred !== 'elementary') return false;
        if (item.totalScore > 450) return false;
        const scoreKeys = Object.keys(item.scoreStructure || {}).join(' ');
        if (/(中考|高考|中考分|投档线|统招线)/.test(scoreKeys)) return false;
        return true;
      }
      if (stageConfig.slug === 'middle') return inferred === 'middle' || inferred === 'unknown';
      return inferred === 'high' || inferred === 'unknown';
    });
  }, [policies, stageConfig.slug, examType]);
  const currentPolicy = filteredPolicies.length > 0 ? filteredPolicies[0] : null;
  const sanitizedPolicySearchContent = useMemo(
    () => sanitizePolicyContentByStage(policySearchContent, stageConfig.slug),
    [policySearchContent, stageConfig.slug],
  );
  const hasCrossVerifiedPolicy = useMemo(
    () => Boolean(currentPolicy?.policyContent?.trim()) && Boolean(sanitizedPolicySearchContent.trim()),
    [currentPolicy?.policyContent, sanitizedPolicySearchContent],
  );
  const hasScores = Object.values(scores).some((v) => v > 0);
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const isGaokao = stageConfig.slug === 'high';
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
    () =>
      buildParentCommunicationTemplate({
        plan: gapActionPlan,
        decomposition: targetDecomposition,
        weakSubjectsText: profile.weakSubjects,
        strongSubjectsText: profile.strongSubjects,
      }),
    [gapActionPlan, targetDecomposition, profile.weakSubjects, profile.strongSubjects],
  );
  const highMajorRecommendations = useMemo(
    () =>
      stageSlug === 'high'
        ? buildHighMajorRecommendations({
            scores,
            careerIntent,
            examMode,
          })
        : [],
    [stageSlug, scores, careerIntent, examMode],
  );

  const handleScoreChange = useCallback((key: string, val: string): void => {
    const num = val === '' ? 0 : parseInt(val, 10);
    setScores((prev) => ({ ...prev, [key]: isNaN(num) ? 0 : num }));
  }, []);

  const fetchPolicies = useCallback(async (r: string): Promise<void> => {
    if (examType === '小升初') {
      setPolicies([]);
      return;
    }
    setPolicyLoading(true);
    try {
      const res = await plan.getAdmissionPolicies(r, undefined, stageConfig.examType);
      setPolicies(res.items);
    } catch {
      toast.error('获取政策数据失败');
    } finally {
      setPolicyLoading(false);
    }
  }, [stageConfig.examType, examType]);

  useEffect(() => {
    if (examType === '小升初') {
      setPolicies([]);
      setSubjectMaxHints((prev) => ({
        语文: prev['语文'] || 100,
        数学: prev['数学'] || 100,
        英语: prev['英语'] || 100,
      }));
    }
  }, [examType]);

  useEffect(() => {
    const cached = loadModuleSession<PlanSessionState>(stageSlug, 'plan');
    if (!cached) return;
    setExamType(stageConfig.examType);
    setGrade(normalizeStageGrade(cached.grade, stageConfig.grades));
    setExamMode(cached.examMode);
    setExamYear(cached.examYear);
    setSelectedProvince(cached.selectedProvince);
    setSelectedCity(cached.selectedCity);
    setCounty(cached.county);
    setRegion(cached.region);
    setIsCustomRegion(cached.isCustomRegion);
    setCustomRegionText(cached.customRegionText);
    setScores(cached.scores || {});
    setTargetSchool(cached.targetSchool || '');
    setTargetScore(cached.targetScore);
    setCareerIntent(cached.careerIntent || '');
    setBoardingType(cached.boardingType || '');
    setReportContent(cached.reportContent || '');
    setTimelineContent(cached.timelineContent || '');
    hydratedRef.current = true;
  }, [stageSlug, stageConfig.examType, stageConfig.grades]);

  useEffect(() => {
    if (!profile.updatedAt) return;
    applyingProfileRef.current = true;
    const fill = getPlanAutofillFromProfile(profile);
    setSelectedProvince(fill.selectedProvince || '');
    setSelectedCity(fill.selectedCity || '');
    setCounty(fill.county || '');
    if (fill.region) {
      setRegion(fill.region);
      fetchPolicies(fill.region);
    } else {
      setRegion('');
    }
    setGrade(fill.grade ? normalizeStageGrade(fill.grade, stageConfig.grades) : '');
    setTargetSchool(fill.targetSchool || '');
    targetSchoolFromProfileRef.current = Boolean(fill.targetSchool);
    setTargetScore(fill.targetScore);
    setCareerIntent(fill.careerIntent || '');
    setBoardingType(fill.boardingType || '');
    setExamMode(fill.examMode || '');
    setScores(fill.scores || {});
    if (fill.examYear) {
      setExamYear(fill.examYear);
    }
    queueMicrotask(() => {
      applyingProfileRef.current = false;
      hydratedRef.current = true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- 先恢复模块缓存，再用首页档案覆盖关键字段
  }, [profile.updatedAt, stageConfig.grades]);

  useEffect(() => {
    if (stageConfig.slug !== 'middle') return;
    if (!region || !targetSchool || !targetSchoolFromProfileRef.current) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const result = await policyApi.searchSchools(region);
        if (cancelled || result.schools.length === 0) return;
        const matched = result.schools.some(
          (school) =>
            school.name === targetSchool ||
            school.name.includes(targetSchool) ||
            targetSchool.includes(school.name),
        );
        if (!matched) {
          setTargetSchool('');
          setTargetScore(undefined);
          targetSchoolFromProfileRef.current = false;
          setProfileDirty(true);
          toast.warning('目标学校与当前地区不匹配，已清空，请重新选择本地目标学校');
        }
      } catch {
        // 本地库不可用时不强制清空，避免误删老师手动输入。
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [region, targetSchool, stageConfig.slug]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (applyingProfileRef.current) return;
    saveModuleSession<PlanSessionState>(stageSlug, 'plan', {
      examType,
      grade,
      examMode,
      examYear,
      selectedProvince,
      selectedCity,
      county,
      region,
      isCustomRegion,
      customRegionText,
      scores,
      targetSchool,
      targetScore,
      careerIntent,
      boardingType,
      reportContent,
      timelineContent,
    });
  }, [
    stageSlug,
    examType,
    grade,
    examMode,
    examYear,
    selectedProvince,
    selectedCity,
    county,
    region,
    isCustomRegion,
    customRegionText,
    scores,
    targetSchool,
    targetScore,
    careerIntent,
    boardingType,
    reportContent,
    timelineContent,
  ]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (applyingProfileRef.current) return;
    if (!profileDirty) return;
    const timer = setTimeout(() => {
      updateProfile({
        province: selectedProvince,
        city: selectedCity,
        county,
        grade,
        targetSchool,
        targetScore,
        careerIntent,
        boardingType: (boardingType as '' | 'day' | 'boarding') || '',
        examMode,
        examDate: `${examYear}-06-15`,
      });
      setProfileDirty(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [
    updateProfile,
    selectedProvince,
    selectedCity,
    county,
    grade,
    targetSchool,
    targetScore,
    careerIntent,
    boardingType,
    examMode,
    examYear,
    profileDirty,
  ]);

  useEffect(() => {
    if (!targetSchool || !region || stageConfig.slug === 'elementary' || examType === '小升初') return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const db = await policyApi.searchSchools(region, stageConfig.examType);
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
  }, [targetSchool, region, stageConfig.slug, stageConfig.examType, examType]);

  const handleSyncProfileBack = useCallback(() => {
    const safeGrade = normalizeStageGrade(grade, stageConfig.grades);
    updateProfile({
      province: selectedProvince,
      city: selectedCity,
      county,
      grade: safeGrade,
      targetSchool,
      targetScore,
      careerIntent,
      boardingType: (boardingType as '' | 'day' | 'boarding') || '',
      examMode,
      examDate: examDate.slice(0, 10),
    });
    toast.success('已同步回学段主页档案');
    setProfileDirty(false);
  }, [updateProfile, selectedProvince, selectedCity, county, grade, targetSchool, targetScore, careerIntent, boardingType, examMode, examDate, stageConfig.grades]);

  const handlePolicySearch = useCallback(async (r: string): Promise<void> => {
    if (!r) { toast.error('请先选择地区'); return; }
    setPolicySearchLoading(true);
    setPolicySearchContent('');
    setSubjectMaxHints({});
    try {
      const currentY = new Date().getFullYear();
      const searchYears = [String(currentY), String(currentY - 1)];
      let full = '';
      const keywords =
        stageConfig.slug === 'elementary'
          ? ['小升初 考试科目 满分分值', '教育局 入学政策 划片 摇号', '小升初 总分构成 体育 实验']
          : stageConfig.slug === 'middle'
            ? ['中考 录取综合总分 各科录取计分满分 官方', '教育局 中考政策 考试大纲', '中考总分 各科分数 最新 教育考试院']
            : ['高考 考试科目 满分分值 官方', '教育考试院 高考政策 考试大纲', '高考总分 各科分值 最新'];
      for (const y of searchYears) {
        for (const keyword of keywords) {
          for await (const chunk of streamPolicySearch({ region: r, year: y, keyword })) {
            full += chunk;
            setPolicySearchContent(sanitizePolicyContentByStage(full, stageConfig.slug));
            const parsedHints = {
              ...extractSubjectMaxHintsFromPolicyText(full),
              ...getKnownSubjectMaxHints(r, stageConfig.examType),
            };
            if (Object.keys(parsedHints).length > 0) {
              setSubjectMaxHints(parsedHints);
            }
          }
        }
      }
      const cleaned = sanitizePolicyContentByStage(full, stageConfig.slug).trim();
      const finalHints = {
        ...extractSubjectMaxHintsFromPolicyText(full),
        ...getKnownSubjectMaxHints(r, stageConfig.examType),
      };
      const hasHints = Object.keys(finalHints).length > 0;
      if (hasHints) {
        setSubjectMaxHints(finalHints);
      }
      const sourceCount = (full.match(/https?:\/\/[^\s)]+/g) || []).length;
      if (!hasHints) {
        setPolicySearchContent(
          [
            `地区：${r}`,
            '暂无该地区最新考情数据，请选择其他地区或手动输入。',
            '核验建议：至少使用 2 个权威来源（教育局官网 + 教育考试院/政府公开文件）后再确认分值。',
          ].join('\n'),
        );
        setSubjectMaxHints({});
      } else if (!cleaned) {
        setPolicySearchContent(
          [
            `地区：${r}`,
            '已使用本地权威校验规则识别科目满分；联网正文为空，请以教育局当年文件复核。',
          ].join('\n'),
        );
      } else if (sourceCount < 2) {
        setPolicySearchContent(
          `${cleaned}\n\n⚠️ 当前联网结果权威来源不足 2 条，请补充教育局官网/教育考试院文件后再确认当年分值。`,
        );
      } else {
        setPolicySearchContent(cleaned);
      }
    } catch {
      toast.error('网络政策搜索失败');
    } finally {
      setPolicySearchLoading(false);
    }
  }, [stageConfig.slug]);

  const handleProvinceChange = useCallback((val: string): void => {
    setProfileDirty(true);
    targetSchoolFromProfileRef.current = false;
    setTargetSchool('');
    setTargetScore(undefined);
    if (val === '__custom__') {
      setIsCustomRegion(true);
      setRegion(customRegionText);
      setSelectedProvince('');
      setSelectedCity('');
      setCounty('');
      setCityOptions([]);
      setCountyOptions([]);
      setCustomCityMode(false);
      setCustomCountyMode(false);
    } else {
      setIsCustomRegion(false);
      setSelectedProvince(val);
      setSelectedCity('');
      setCounty('');
      setCitySearch('');
      setCountySearch('');
      setCityLoadFailed(false);
      setCountyLoadFailed(false);
      setCustomCityMode(false);
      setCustomCountyMode(false);
      setRegion(val);
      setReportContent('');
      setTimelineContent('');
      setPolicySearchContent('');
      if (val) { fetchPolicies(val); handlePolicySearch(val); }
    }
  }, [customRegionText, fetchPolicies, handlePolicySearch]);

  const handleCityChange = useCallback((val: string): void => {
    setProfileDirty(true);
    targetSchoolFromProfileRef.current = false;
    setTargetSchool('');
    setTargetScore(undefined);
    const next = val === '__custom_city__' ? '' : val;
    setSelectedCity(next);
    setCounty('');
    setCountySearch('');
    setCustomCityMode(val === '__custom_city__');
    setCustomCountyMode(false);
    const r = [selectedProvince, next].filter(Boolean).join(' ');
    setRegion(r);
    setReportContent('');
    setTimelineContent('');
    setPolicySearchContent('');
    if (r) { fetchPolicies(r); handlePolicySearch(r); }
  }, [selectedProvince, fetchPolicies, handlePolicySearch]);

  const handleCountyChange = useCallback((val: string): void => {
    setProfileDirty(true);
    const next = val === '__custom_county__' ? '' : val;
    setCounty(next);
    setCustomCountyMode(val === '__custom_county__');
    const r = [selectedProvince, selectedCity, next].filter(Boolean).join(' ');
    setRegion(r);
    setReportContent('');
    setTimelineContent('');
    setPolicySearchContent('');
    if (r) { fetchPolicies(r); handlePolicySearch(r); }
  }, [selectedProvince, selectedCity, fetchPolicies, handlePolicySearch]);

  const handleCustomRegionSubmit = useCallback((): void => {
    const trimmed = customRegionText.trim();
    if (!trimmed) return;
    targetSchoolFromProfileRef.current = false;
    setTargetSchool('');
    setTargetScore(undefined);
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
    setActiveOutput('report');
    setReportLoading(true);
    setReportContent('');
    try {
      const safeGrade = normalizeStageGrade(grade, stageConfig.grades);
      await plan.createPlanRecord({ region, scores });
      const scoreMaxValues: Record<string, number> = {
        '语文': 150, '数学': 150, '英语': 150,
        '物理': 100, '化学': 100, '生物': 100,
        '历史': 100, '地理': 100, '政治': 100, '政治&道法': 100,
      };
      for (const [subject, max] of Object.entries(subjectMaxHints)) {
        if (typeof max === 'number' && max > 0) {
          scoreMaxValues[subject] = max;
          if (subject === '道法') scoreMaxValues['政治&道法'] = max;
          if (subject === '政治') scoreMaxValues['政治&道法'] = max;
        }
      }
      const planCtx: PlanFormContext = {
        examType: stageConfig.examType,
        grade: safeGrade,
        region,
        scores,
        scoreMaxValues,
        examMode: examMode || undefined,
        examYear,
        targetSchool: targetSchool || undefined,
        targetScore,
        careerIntent: careerIntent || undefined,
        boardingType: boardingType || undefined,
      };
      const scoresText = buildScoresText(scores, scoreMaxValues);
      const policyText =
        examType === '小升初'
          ? [
              '升学类型：小升初（仅联网政策）',
              sanitizedPolicySearchContent
                ? `联网政策来源摘要：\n${sanitizedPolicySearchContent}`
                : '联网政策摘要：暂无，请先点击“联网搜索政策数据”。',
              '数据核验要求：至少列出 2 个官方来源（教育局官网 + 招考部门公告），否则标注待核实。',
            ].join('\n')
          : [
              buildCompactPolicyContext({
                policy: currentPolicy,
                examType: stageConfig.examType,
                totalScore,
                targetScore,
              }),
              sanitizedPolicySearchContent ? `联网政策来源摘要：\n${sanitizedPolicySearchContent}` : '',
              hasCrossVerifiedPolicy
                ? '数据核验：已完成数据库政策 + 联网政策双来源交叉验证。'
                : '数据核验：当前未满足双来源交叉验证，请将关键政策节点标记为待核实。',
            ]
              .filter(Boolean)
              .join('\n');
      const additionalInfo = buildPlanAdditionalInfo(planCtx, { stageSlug, profile });
      const actionPrompt = buildGapActionPrompt(gapActionPlan);
      const highDirectionPrompt =
        stageSlug === 'high' && highMajorRecommendations.length > 0
          ? `专业方向建议：${highMajorRecommendations
              .map((item) => `${item.direction}（推荐专业：${item.majors.join('、')}；理由：${item.reason}）`)
              .join('；')}`
          : '';
      const mergedInfo = [additionalInfo, actionPrompt, highDirectionPrompt].filter(Boolean).join('；');
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
  }, [region, scores, policies, hasScores, grade, examDate, examType, examMode, examYear, targetSchool, targetScore, careerIntent, boardingType, stageSlug, profile, gapActionPlan, currentPolicy, highMajorRecommendations, stageConfig.examType, stageConfig.grades, sanitizedPolicySearchContent, hasCrossVerifiedPolicy, subjectMaxHints]);

  const handleGenerateTimeline = useCallback(async (): Promise<void> => {
    if (!region) { toast.error('请先选择地区'); return; }
    setActiveOutput('timeline');
    setTimelineLoading(true);
    setTimelineContent('');
    try {
      if (stageConfig.slug === 'elementary' || examType === '小升初') {
        const currentYear = new Date().getFullYear();
        const markdown = buildElementaryTimelineMarkdown({
          region,
          examYear,
          currentYear,
          policyHint: compactSearchPolicyText(sanitizedPolicySearchContent),
        });
        setTimelineContent(markdown);
        return;
      }
      const safeGrade = normalizeStageGrade(grade, stageConfig.grades);
      let full = '';
      const currentYear = new Date().getFullYear();
      const stageSpecificConstraint =
        stageConfig.slug === 'middle'
          ? '仅输出中考体系节点，禁止混入高考或小升初节点。'
          : '仅输出高考体系节点，禁止混入中考会考或小升初节点。';
      const gradeWithHint = `${safeGrade}（请严格按${stageConfig.examType}体系倒推到${examYear}年，仅输出${currentYear}年及以后关键时间节点，${stageSpecificConstraint}。必须按月份逐月展开，从当前月份写到${examYear}年考试月；每个月都要包含：学习重点、成绩目标、模拟考/诊断考试的预计次数与时间、考试范围、重要性、对未来${stageConfig.examType}的意义，以及家长和学生必须马上做的动作。不要泛泛写“持续复习”，要让家长看到紧迫感。）`;
      for await (const chunk of streamTimeline({ current_grade: gradeWithHint, region, exam_year: String(examYear) })) {
        full += chunk;
        setTimelineContent(full);
      }
    } catch {
      toast.error('生成时间路线图失败');
    } finally {
      setTimelineLoading(false);
    }
  }, [region, grade, examYear, stageConfig.examType, stageConfig.grades, stageConfig.slug, sanitizedPolicySearchContent, examType]);

  const handleCopyReport = useCallback(async (): Promise<void> => {
    if (!reportContent) return;
    const result = await copyText(reportContent);
    if (result.ok) {
      toast.success('已复制到剪贴板');
      return;
    }
    toast.error(result.message);
  }, [reportContent]);

  const config = EXAM_TYPE_CONFIG[stageConfig.examType];
  const buildPlanReferenceScript = useCallback(() => {
    if (!hasScores) return '';
    const gap = targetScore != null ? Math.max(targetScore - totalScore, 0) : null;
    const reportPoint = pickFirstSentence(reportContent);
    const timelinePoint = pickFirstSentence(timelineContent);
    const internalAnchor = getInternalScriptAnchor(stageSlug, 'plan');
    return buildReferenceScript([
      `先按一个原则：${internalAnchor}`,
      `咱们先看结论：现在总分${totalScore}${targetScore != null ? `，目标线${targetScore}` : ''}`,
      gap != null ? (gap > 0 ? `目前还差${gap}分，先抓最容易提分的科目` : '当前分数已经具备冲刺更高目标的空间') : '',
      targetSchool ? `目标学校先盯住${targetSchool}` : '',
      reportPoint ? `先说一句最实在的：${reportPoint}` : '',
      timelinePoint ? `时间上先记住：${timelinePoint}` : '',
      '我们先按周执行小目标，做得到比做得多更重要，周末复盘再微调。',
    ]);
  }, [hasScores, totalScore, targetScore, reportContent, timelineContent, targetSchool]);

  return (
    <div className={embedded ? 'font-hand' : 'min-h-screen bg-paper-dots p-6 font-hand'}>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header + Tabs */}
        {!embedded && <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" className="font-hand -ml-2" asChild>
            <Link to={stagePath(stageSlug)}>
              <ArrowLeft className="mr-1 size-4" />
              返回{stageConfig.label}主页
            </Link>
          </Button>
          <h1 className="font-marker text-3xl font-bold text-ink">{stageConfig.label} · 升学路径</h1>
          <span className="rounded-full border-2 border-ink bg-postit-yellow px-3 py-0.5 text-sm font-bold">
            {examType}
          </span>
        </div>}

        <ProfileAutofillBanner
          stageSlug={stageSlug}
          profile={profile}
          regionText={regionText}
          showSyncBack={profileDirty}
          onSyncBack={handleSyncProfileBack}
        />

        <WobblyCard variant="white" decoration="tape" wobblyIndex={0} hoverable={false} className="p-5">
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-marker text-xl font-bold text-ink">首页档案信息</h2>
                <p className="font-hand mt-1 text-sm text-ink/65">
                  本页不再重复填写，姓名、年级、地区、成绩和目标学校直接从学段首页档案带入。
                </p>
              </div>
              {policySearchContent && (
                <span className="rounded-full border-2 border-emerald-600 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  已带入联网考情/政策信息
                </span>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {[
                ['学生姓名', profile.studentName || '未填写'],
                ['年级/类型', `${grade || profile.grade || '未填写'} · ${examType}`],
                ['地区', regionText || region || '未填写'],
                ['目标', targetSchool || profile.targetSchool || '未填写'],
                ['当前成绩', profile.scoresOverview || (hasScores ? `总分 ${totalScore}` : '未填写')],
                ['目标分数线', targetScore != null ? `${targetScore}分` : '未匹配'],
                ['走读/住读', boardingType === 'boarding' ? '住读' : boardingType === 'day' ? '走读' : '未填写'],
                ['考试年份', `${examYear}年`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border-2 border-dashed border-ink/15 bg-accent/50 px-3 py-2">
                  <p className="text-xs text-ink/55">{label}</p>
                  <p className="font-marker mt-1 text-base font-bold text-ink">{value}</p>
                </div>
              ))}
            </div>
            {!region || !hasScores ? (
              <div className="rounded-lg border-2 border-marker-red/30 bg-marker-red/5 px-3 py-2 text-sm text-marker-red">
                生成前请先回到学段首页补齐地区和当前各科成绩；本页会自动带入，不建议在这里重复编辑。
              </div>
            ) : null}
          </div>
        </WobblyCard>

        <Tabs
          value={activeOutput}
          onValueChange={(value) => setActiveOutput(value as 'report' | 'timeline')}
          className="gap-4"
        >
          <TabsList className="h-12 w-full max-w-md border-2 border-ink bg-accent p-1 shadow-hard-sm">
            <TabsTrigger value="report" className="h-full gap-2 data-[state=active]:bg-white">
              <FileText className="size-4" />
              升学报告
            </TabsTrigger>
            <TabsTrigger value="timeline" className="h-full gap-2 data-[state=active]:bg-postit-yellow">
              <Clock className="size-4" />
              备考路线图
            </TabsTrigger>
          </TabsList>

          <TabsContent value="report">
            <WobblyCard variant="white" decoration="tape" wobblyIndex={2} hoverable={false} className="p-5 md:p-7">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b-2 border-dashed border-ink/15 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-ink">中长期升学路径报告</h2>
                  <p className="mt-1 text-sm text-ink/65">中考定位、路径取舍、选科预测与专业就业影响</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {reportContent && (
                    <Button variant="outline" size="sm" onClick={handleCopyReport} className="border-2 border-ink shadow-hard-sm">
                      <Copy className="size-3.5" />
                      复制全文
                    </Button>
                  )}
                  <Button
                    onClick={handleGenerateReport}
                    disabled={reportLoading || !region || !hasScores}
                    className="border-[3px] border-ink shadow-hard"
                  >
                    <FileText className="size-4" />
                    {reportLoading ? '生成中...' : '生成升学报告'}
                  </Button>
                </div>
              </div>
              {reportLoading && !reportContent ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="text-lg font-semibold text-ink animate-pulse">AI 正在分析规划方案...</div>
                  <div className="mt-2 text-sm text-muted-foreground">根据首页档案、成绩和政策生成个性化升学路径</div>
                </div>
              ) : reportContent ? (
                <div className="report-readable prose prose-sm max-w-none"><Streamdown>{reportContent}</Streamdown></div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <FileText className="mb-3 size-12 opacity-30" />
                  <p>生成后将在这里展示报告</p>
                </div>
              )}
            </WobblyCard>
          </TabsContent>

          <TabsContent value="timeline">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink/65">按月展开考试节点、学习任务与验收标准</p>
              <Button
                variant="secondary"
                onClick={handleGenerateTimeline}
                disabled={timelineLoading || !region}
                className="border-[3px] border-ink bg-postit-yellow shadow-hard"
              >
                <Clock className="size-4" />
                {timelineLoading ? '生成中...' : '生成备考路线图'}
              </Button>
            </div>
            <PlanTimeline content={timelineContent} loading={timelineLoading} examType={examType} examDate={examDate} grade={grade} />
          </TabsContent>
        </Tabs>

        <div className="hidden" aria-hidden="true">
        {/* Top Input Bar */}
        <WobblyCard variant="white" decoration="tape" wobblyIndex={0} hoverable={false} className="p-5">
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-pen-blue/30 bg-pen-blue/5 px-3 py-2 text-sm text-ink/75">
              当前地区：{region || '未选择'}
              {regionLoading && <span className="ml-2 text-pen-blue">正在加载地区列表...</span>}
              {policySearchContent && <span className="ml-2 text-emerald-700">已获取联网考情/政策信息</span>}
            </div>
            <div className="rounded-xl border border-ink/10 bg-background/80 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-marker text-base font-bold text-ink">地区与考试信息</h3>
                <span className="font-hand text-xs text-muted-foreground">换地区后会清空旧目标学校，避免跨城市误匹配</span>
              </div>
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                <div>
                  <label className="mb-1 block text-sm font-bold text-ink">省份</label>
                  <Select value={isCustomRegion ? '__custom__' : toSelectValue(selectedProvince)} onValueChange={handleProvinceChange}>
                    <SelectTrigger className="font-hand">
                      <SelectValue placeholder={regionLoading ? '联网加载中...' : '省/直辖市'} />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-1" onKeyDown={(e) => e.stopPropagation()}>
                        <Input placeholder="搜索..." value={provinceSearch} onChange={(e) => setProvinceSearch(e.target.value)} className="h-8 text-xs" />
                      </div>
                      {filteredProvinces.map((p) => (
                        <SelectItem key={p.adcode} value={p.name}>{p.name}</SelectItem>
                      ))}
                      <SelectItem value="__custom__">手动输入...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!isCustomRegion && selectedProvince && (
                  <div>
                    <label className="mb-1 block text-sm font-bold text-ink">市/区</label>
                    <Select value={selectedCityValue} onValueChange={handleCityChange}>
                      <SelectTrigger className="font-hand">
                        <SelectValue placeholder={regionLoading ? '联网加载中...' : '市/区'} />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-1" onKeyDown={(e) => e.stopPropagation()}>
                          <Input
                            placeholder="模糊/拼音/别名"
                            value={citySearch}
                            onChange={(e) => setCitySearch(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                        {filteredCities.map((c) => (<SelectItem key={c.adcode} value={c.name}>{c.name}</SelectItem>))}
                        <SelectItem value="__custom_city__">自定义城市/盟/州...</SelectItem>
                      </SelectContent>
                    </Select>
                    {(customCityMode || cityLoadFailed || (selectedCity && !findOptionByName(cityOptions, selectedCity))) && (
                      <Input
                        value={selectedCity}
                        onChange={(e) => {
                          const next = e.target.value;
                          setProfileDirty(true);
                          setSelectedCity(next);
                          setCounty('');
                          setRegion([selectedProvince, next].filter(Boolean).join(' '));
                        }}
                        placeholder={cityLoadFailed ? '城市联网失败，可直接输入' : '输入城市/盟/州'}
                        className="font-hand mt-2"
                      />
                    )}
                  </div>
                )}
                {!isCustomRegion && selectedCity && (
                  <div>
                    <label className="mb-1 block text-sm font-bold text-ink">区/县</label>
                    <Select value={selectedCountyValue} onValueChange={handleCountyChange}>
                      <SelectTrigger className="font-hand">
                        <SelectValue placeholder={regionLoading ? '联网加载中...' : '区/县'} />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-1" onKeyDown={(e) => e.stopPropagation()}>
                          <Input
                            placeholder="模糊/拼音/别名"
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
                    {(customCountyMode || countyLoadFailed || (county && !findOptionByName(countyOptions, county))) && (
                      <Input
                        value={county}
                        onChange={(e) => {
                          const next = e.target.value;
                          setProfileDirty(true);
                          setCounty(next);
                          setRegion([selectedProvince, selectedCity, next].filter(Boolean).join(' '));
                        }}
                        placeholder={countyLoadFailed ? '区县联网失败，可选填手输' : '输入区/县/旗（选填）'}
                        className="font-hand mt-2"
                      />
                    )}
                  </div>
                )}
                {isCustomRegion && (
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-bold text-ink">自定义地区</label>
                    <div className="flex gap-2">
                      <Input
                        value={customRegionText}
                        onChange={(e) => setCustomRegionText(e.target.value)}
                        placeholder="输入地区名称"
                        className="font-hand"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCustomRegionSubmit(); }}
                      />
                      <Button size="sm" variant="secondary" onClick={handleCustomRegionSubmit} className="border-2 border-ink font-hand">
                        <Search className="size-3.5" />
                        查询
                      </Button>
                    </div>
                  </div>
                )}
                <div>
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
                <div>
                  <label className="mb-1 block text-sm font-bold text-ink">
                    {examYear}年{stageConfig.examType}
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
                <div>
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
                {isGaokao && (
                  <div>
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
              </div>
            </div>

            <div className="rounded-xl border border-ink/10 bg-background/80 p-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className={isGaokao ? '' : 'md:col-span-2'}>
                  <label className="mb-1 block text-sm font-bold text-ink">{stageConfig.targetLabel}（选填）</label>
                  <Input
                    value={targetSchool}
                    onChange={(e) => {
                      setProfileDirty(true);
                      targetSchoolFromProfileRef.current = false;
                      setTargetSchool(e.target.value);
                    }}
                    placeholder={stageConfig.slug === 'elementary' ? '不填则自动给学校参考' : stageConfig.slug === 'middle' ? '不填则匹配普高和重点高中' : '不填则匹配稳妥和冲刺层级'}
                    className="font-hand"
                  />
                </div>
                {isGaokao && (
                  <div>
                    <label className="mb-1 block text-sm font-bold text-ink">想做的事情 / 职业方向</label>
                    <Input
                      value={careerIntent}
                      onChange={(e) => { setProfileDirty(true); setCareerIntent(e.target.value); }}
                      placeholder="如：人工智能、医生、金融、法律"
                      className="font-hand"
                    />
                  </div>
                )}
                {stageConfig.slug !== 'elementary' && (
                  <div>
                    <label className="mb-1 block text-sm font-bold text-ink">匹配分数线（选填）</label>
                    <Input
                      value={targetScore != null ? String(targetScore) : ''}
                      onChange={(e) => {
                        setProfileDirty(true);
                        const value = e.target.value.trim();
                        setTargetScore(value ? Number(value) : undefined);
                      }}
                      placeholder="不填则自动匹配参考线"
                      className="font-hand"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Scores + Actions */}
            <div className="flex flex-wrap items-end gap-4">
              <PlanScoreInput
                examType={stageConfig.examType}
                examMode={examMode || undefined}
                scores={scores}
                subjectMaxHints={subjectMaxHints}
                onScoreChange={handleScoreChange}
              />
              <div className="flex gap-2">
                <Button onClick={handleGenerateReport} disabled={reportLoading || !region || !hasScores} className="border-[3px] border-ink font-hand shadow-hard">
                  <FileText className="size-4" />
                  {reportLoading ? '生成中...' : '生成规划报告'}
                </Button>
                {!hideElementaryPlanBlocks && (
                  <Button variant="secondary" onClick={handleGenerateTimeline} disabled={timelineLoading || !region} className="border-[3px] border-ink bg-postit-yellow font-hand shadow-hard">
                    <Clock className="size-4" />
                    {timelineLoading ? '生成中...' : '生成时间路线图'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </WobblyCard>

        {/* Main Content */}
        <div className={`flex gap-6 ${hideElementaryPlanBlocks ? 'flex-col' : ''}`}>
          {/* Left: Policy & Score Lines */}
          {!hideElementaryPlanBlocks && (
          <div className="w-96 shrink-0">
            <WobblyCard variant="yellow" decoration="tack" wobblyIndex={1} hoverable={false} className="p-5" rotate={-0.5}>
               <h2 className="mb-4 font-marker text-xl font-bold text-ink">
                 {examType === '小升初' ? '小升初政策与入学规则（联网）' : '政策与分数线'}
               </h2>
              <div className="mb-3 rounded border-2 border-dashed border-ink/30 bg-white/70 px-3 py-2 text-xs">
                交叉验证状态：{hasCrossVerifiedPolicy ? '已满足（本地政策 + 联网政策）' : '未满足（请先联网补充并核验）'}
              </div>
              {policyLoading ? (
                <div className="py-8 text-center text-muted-foreground">加载政策数据中...</div>
              ) : examType === '小升初' ? (
                <div className="space-y-3">
                  {policySearchLoading && !sanitizedPolicySearchContent ? (
                    <div className="py-6 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
                      正在联网检索小升初政策...
                    </div>
                  ) : sanitizedPolicySearchContent ? (
                    <div className="prose prose-sm max-w-none font-hand">
                      <Streamdown>{compactSearchPolicyText(sanitizedPolicySearchContent)}</Streamdown>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-muted-foreground">
                      请先点击“联网搜索政策数据”，仅展示互联网检索结果
                    </div>
                  )}
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
                      {currentPolicy.region} {currentPolicy.year}年{stageConfig.examType}总分
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
                        <Streamdown>{summarizePolicyText(sanitizePolicyContentByStage(currentPolicy.policyContent, stageConfig.slug))}</Streamdown>
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
                  数据来源互联网，用于与本地政策数据做交叉验证（至少两来源）
                </p>
                {policySearchLoading && !policySearchContent ? (
                  <div className="py-6 text-center text-muted-foreground">
                    <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
                    正在搜索该地区近 3 年政策...
                  </div>
                ) : policySearchContent ? (
                  <div className="prose prose-sm max-w-none font-hand">
                    <Streamdown>{compactSearchPolicyText(sanitizedPolicySearchContent)}</Streamdown>
                  </div>
                ) : null}
              </WobblyCard>
            )}
          </div>
          )}

          {/* Right: Report + School Recommendations */}
          <div className="min-w-0 flex-1 space-y-6">
            {/* School Recommendations */}
            {!hideElementaryPlanBlocks && examType !== '小升初' && currentPolicy && currentPolicy.admissionLines.length > 0 && hasScores && (
              <WobblyCard variant="yellow" decoration="tack" wobblyIndex={2} hoverable={false} className="p-5">
                <h2 className="mb-4 font-marker text-xl font-bold text-ink">院校推荐</h2>
                <PlanSchoolRecommend totalScore={totalScore} admissionLines={currentPolicy.admissionLines} />
              </WobblyCard>
            )}

            {stageSlug === 'high' && highMajorRecommendations.length > 0 && (
              <WobblyCard variant="white" decoration="tape" wobblyIndex={13} hoverable={false} className="p-5">
                <h2 className="mb-3 font-marker text-lg font-bold text-ink">
                  高中专业方向推荐（基于已填科目 + 意向）
                </h2>
                <div className="space-y-2">
                  {highMajorRecommendations.map((item) => (
                    <div key={item.direction} className="rounded-md border-2 border-dashed border-ink/20 bg-accent/40 px-3 py-2 text-sm">
                      <p className="font-marker text-base text-ink">{item.direction}</p>
                      <p className="mt-1 text-ink/80">推荐专业：{item.majors.join('、')}</p>
                      <p className="mt-1 text-ink/70">理由：{item.reason}</p>
                      <p className="mt-1 text-ink/60">典型就业：{item.jobs}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-ink/60">
                  提示：如果只填了部分科目，建议继续补齐关键科目成绩，系统会自动刷新专业可行性与院校匹配度。
                </p>
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
                <h2 className="font-marker text-xl font-bold text-ink">AI 升学路径报告</h2>
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
                  <div className="mt-2 text-sm text-muted-foreground">根据成绩和政策为您生成个性化升学路径</div>
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

            <ReferenceScriptCard
              onGenerate={buildPlanReferenceScript}
              hint="基于当前升学路径结果生成可直接沟通的话术（300字内）。"
              wobblyIndex={14}
            />
          </div>
        </div>

        {/* Bottom: Timeline */}
        {!hideElementaryPlanBlocks && (
          <PlanTimeline content={timelineContent} loading={timelineLoading} examType={examType} examDate={examDate} grade={grade} />
        )}
        </div>
      </div>
    </div>
  );
};

export default Plan;
