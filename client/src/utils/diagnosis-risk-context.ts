import type { StageSlug } from '@client/src/config/stages';
import { resolveAcademicTiming, type AcademicPhaseId } from './academic-phase';

interface DiagnosisRiskContextInput {
  stage: StageSlug;
  grade: string;
  region?: string;
  concern?: string;
  scores: Record<string, number>;
  maxValues?: Record<string, number>;
  targetScore?: number;
  hasCompleteExamScores?: boolean;
  date?: Date;
}

interface AssessmentContext {
  name: string;
  timing: string;
  note: string;
}

interface SubjectRiskEstimate {
  subject: string;
  score: number;
  max: number;
  rate: number;
  currentLoss: number;
  milestoneRate: number;
  milestoneScore: number;
  milestoneGap: number;
  scoreRiskRange: [number, number];
  exposedPointRange: [number, number];
  dailyExtraMinutes: [number, number];
  twoWeekHours: [number, number];
}

function isPhase(phase: AcademicPhaseId, values: AcademicPhaseId[]): boolean {
  return values.includes(phase);
}

function resolveAssessment(stage: StageSlug, grade: string, phase: AcademicPhaseId): AssessmentContext {
  const isOpening = isPhase(phase, ['winter-break', 'spring-opening', 'summer-break', 'autumn-opening']);
  const isMonthly = isPhase(phase, ['spring-monthly', 'autumn-monthly']);
  const isMidterm = isPhase(phase, ['spring-midterm', 'autumn-midterm']);
  const isSpringFinal = phase === 'spring-final';

  if (stage === 'middle' && /九年级|初三/u.test(grade)) {
    if (phase === 'autumn-opening') return { name: '初三中考备考启动期：开学摸底与第一次月考', timing: '开学后1至4周', note: '月考名称、日期和范围以学校通知为准' };
    if (phase === 'spring-monthly') return { name: '初三一模及体育/实验考试准备', timing: '通常在春季陆续安排', note: '考试日期和项目以当地教育局、学校通知为准' };
    if (phase === 'spring-midterm') return { name: '体育中考、物化实验考试及初三二模', timing: '通常集中在4月至5月', note: '各地顺序差异较大，必须核实本地安排' };
    if (isSpringFinal) return { name: '初三三模与中考', timing: '中考前最后校准期', note: '以当地招考部门公布日期为准' };
  }
  if (stage === 'middle' && /八年级|初二/u.test(grade) && isSpringFinal) {
    return { name: '生物地理会考或期末考试', timing: '通常在学年末', note: '是否计入中考及考试日期须按当地政策核实' };
  }
  if (stage === 'high' && /高三/u.test(grade)) {
    if (isOpening) return { name: '开学摸底与高三一模准备', timing: '开学后至一轮复习阶段', note: '以学校一轮复习表和模考通知为准' };
    if (phase === 'spring-monthly') return { name: '高三一模或二模', timing: '通常在春季分阶段安排', note: '不同地区命名和日期不同，须核实学校通知' };
    if (phase === 'spring-midterm') return { name: '高三二模或三模', timing: '高考前专题与套卷校准期', note: '以学校模考安排为准' };
    if (isSpringFinal) return { name: '高考', timing: '高考前最后冲刺期', note: '以官方考试安排为准' };
  }
  if (stage === 'high' && /高一/u.test(grade) && isOpening) {
    return { name: '开学摸底与高一分班考（如学校安排）', timing: '开学前后', note: '并非所有学校都有分班考，须核实学校通知' };
  }
  if (stage === 'high' && /高一|高二/u.test(grade) && isSpringFinal) {
    return { name: '期末考试、学考/合格考或选科节点', timing: '学年末常见关键节点', note: '学考科目、选科时间和规则以省级及学校通知为准' };
  }
  if (stage === 'elementary' && /六年级/u.test(grade) && isSpringFinal) {
    return { name: '六年级毕业考、小升初衔接或分班考', timing: '学年末至初中入学前', note: '入学和分班安排以当地及目标学校通知为准' };
  }
  if (isOpening) return { name: '开学摸底与第一次单元测/月考', timing: '开学后1至4周', note: '是否组织月考由学校决定，须核实考试通知' };
  if (isMonthly) return { name: '第一次月考或阶段测评', timing: '当前月内', note: '具体范围以老师划定内容为准' };
  if (isMidterm) return { name: '期中考试', timing: '当前学期中段', note: '具体日期和范围以学校通知为准' };
  return { name: '期末考试', timing: '当前学期末', note: '具体日期和范围以学校通知为准' };
}

function resolveDailyExtraMinutes(rate: number): [number, number] {
  if (rate < 60) return [25, 40];
  if (rate < 70) return [20, 35];
  if (rate < 80) return [15, 30];
  if (rate < 85) return [12, 25];
  if (rate < 90) return [10, 20];
  return [5, 15];
}

function roundHour(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}

function buildSubjectEstimate(
  subject: string,
  score: number,
  max: number,
  options?: { resistanceRisk?: boolean },
): SubjectRiskEstimate {
  const safeMax = Math.max(1, max);
  const safeScore = Math.min(safeMax, Math.max(0, score));
  const rate = Math.round((safeScore / safeMax) * 100);
  const currentLoss = Math.max(0, safeMax - safeScore);
  const milestoneRate = rate < 60 ? 60 : rate < 70 ? 70 : rate < 80 ? 80 : rate < 85 ? 85 : rate < 90 ? 90 : 95;
  const milestoneScore = Math.min(safeMax, Math.ceil((safeMax * milestoneRate) / 100));
  const downwardRate = rate < 60 ? 0.08 : rate < 70 ? 0.07 : rate < 80 ? 0.06 : rate < 90 ? 0.045 : 0.03;
  const upwardRate = rate < 80 ? 0.03 : 0.025;
  const scoreRiskRange: [number, number] = options?.resistanceRisk && rate < 70
    ? [
        Math.max(0, Math.round(safeScore - safeMax * 0.04)),
        Math.min(safeMax, Math.round(safeScore + safeMax * 0.025)),
      ]
    : [
        Math.max(0, Math.round(safeScore - safeMax * downwardRate)),
        Math.min(safeMax, Math.round(safeScore + safeMax * upwardRate)),
      ];
  const exposedLow = currentLoss === 0
    ? 0
    : options?.resistanceRisk && rate < 70
      ? Math.max(1, Math.round(safeMax * 0.067))
      : Math.max(1, Math.round(currentLoss * 0.18));
  const exposedHigh = currentLoss === 0
    ? 0
    : options?.resistanceRisk && rate < 70
      ? Math.max(exposedLow, Math.round(safeMax * 0.125))
      : Math.max(exposedLow, Math.round(currentLoss * 0.32));
  const dailyExtraMinutes: [number, number] = options?.resistanceRisk && rate < 70
    ? [30, 45]
    : resolveDailyExtraMinutes(rate);
  return {
    subject,
    score: safeScore,
    max: safeMax,
    rate,
    currentLoss,
    milestoneRate,
    milestoneScore,
    milestoneGap: Math.max(0, milestoneScore - safeScore),
    scoreRiskRange,
    exposedPointRange: [Math.min(currentLoss, exposedLow), Math.min(currentLoss, exposedHigh)],
    dailyExtraMinutes,
    twoWeekHours: [roundHour(dailyExtraMinutes[0] * 10), roundHour(dailyExtraMinutes[1] * 10)],
  };
}

export function buildDiagnosisRiskPromptContext(input: DiagnosisRiskContextInput): string {
  const timing = resolveAcademicTiming(input.date);
  const assessment = resolveAssessment(input.stage, input.grade, timing.id);
  const isGradeNineOpening = input.stage === 'middle'
    && /九年级|初三/u.test(input.grade)
    && timing.id === 'autumn-opening';
  const isBeijing = /北京/u.test(input.region || '');
  const concern = input.concern?.trim() || '';
  const hasResistance = /(?:不想学|逃避|没兴趣|没有兴趣|抗拒|一提.{0,6}(?:就烦|就躲|就吵)|厌学|拖延|不愿(?:意)?学|放弃|学也没用)/u.test(concern);
  const estimates = Object.entries(input.scores)
    .map(([subject, score]) => {
      const max = input.maxValues?.[subject];
      return Number.isFinite(max) && Number(max) > 0
        ? buildSubjectEstimate(subject, score, Number(max), {
            resistanceRisk: hasResistance && (concern.includes(subject) || Object.keys(input.scores).length === 1),
          })
        : null;
    })
    .filter((item): item is SubjectRiskEstimate => item !== null);
  const dailyLow = Math.min(90, estimates.reduce((sum, item) => sum + item.dailyExtraMinutes[0], 0));
  const dailyHigh = Math.min(120, estimates.reduce((sum, item) => sum + item.dailyExtraMinutes[1], 0));
  const twoWeekLow = roundHour(dailyLow * 10);
  const twoWeekHigh = roundHour(dailyHigh * 10);
  const totalScore = estimates.reduce((sum, item) => sum + item.score, 0);
  const totalMax = estimates.reduce((sum, item) => sum + item.max, 0);
  const targetNote = input.targetScore == null
    ? '未提供目标总分/学校线，不计算完整升学分差。'
    : input.hasCompleteExamScores
      ? `完整科目当前合计${totalScore}/${totalMax}分，用户目标值为${input.targetScore}分，静态总分差为${Math.max(0, input.targetScore - totalScore)}分；仍需核实目标值与本次考试是否同口径。`
      : `用户目标值为${input.targetScore}分；当前只填了部分科目，不得拿已填科目合计直接与目标总分或学校线比较，只能说明各科阶段标尺差距。`;

  const gradeNineTimeline = isGradeNineOpening
    ? [
        '初三中考节点预警：当前为初三9月开学第一周，中考备考正式启动。',
        isBeijing
          ? '北京校历依据：北京市教委2026—2027学年度校历明确，义务教育阶段2026年9月1日开学，2027年1月17日结束第一学期，共19周零6天；学校实际授课、考试与放假安排仍需核实。'
          : '学期窗口：按常规校历，从9月初到1月中下旬约19至20周；准确开学、期末日期以当地教育部门和学校校历为准。',
        '阶段路线：9-10月关注开学摸底/第一次月考；11月关注期中；12月至次年1月关注新课收尾、期末与寒假前漏洞暴露；次年春季关注一模、二模、三模、体育/实验、中考报名与志愿填报，具体名称、顺序和日期以当地招考部门及区校通知为准。',
        '一模口径：一模常被家长称为“小中考”，主要用于阶段定位和后续复习校准；它不是正式中考，也不得写成统一录取依据。',
      ]
    : [];

  return [
    `下一个关键节点（本地推测）：${assessment.name}，${assessment.timing}。${assessment.note}。`,
    `节点判断依据：查询日期${timing.queryDate}、${timing.phaseLabel}、${input.grade}；真实日期与范围必须用学校通知核实。`,
    ...gradeNineTimeline,
    ...estimates.map((item) => [
      `${item.subject}量化基线：${item.score}/${item.max}分，得分率${item.rate}%，当前卷面已失${item.currentLoss}分。`,
      `${item.subject}下一阶段标尺：先以${item.milestoneRate}%（${item.milestoneScore}分）作为可核验阶段目标，当前相差${item.milestoneGap}分；这不是学校录取线。`,
      `${item.subject}情景风险区间：若当前最高频漏洞未经验证和处理，下一次同难度考试通常波动参考为${item.scoreRiskRange[0]}-${item.scoreRiskRange[1]}分；其中优先漏洞的暴露分值参考为${item.exposedPointRange[0]}-${item.exposedPointRange[1]}分。`,
      `${item.subject}作业耗时情景：同类卡点可能令当日作业/订正额外增加${item.dailyExtraMinutes[0]}-${item.dailyExtraMinutes[1]}分钟，按两周10个学习日折算约${item.twoWeekHours[0]}-${item.twoWeekHours[1]}小时。`,
    ].join('\n')),
    estimates.length > 1
      ? `多科时间叠加：若各科卡点同时出现，每日额外耗时合计参考${dailyLow}-${dailyHigh}分钟，两周约${twoWeekLow}-${twoWeekHigh}小时；这是任务挤压情景，不代表科目之间存在知识因果。`
      : '单科边界：未提供其他科成绩与晚间作息，不能点名被挤压科目；只能提示核实是否挤压原定的阅读、背诵、运动或睡眠。',
    targetNote,
    hasResistance && isGradeNineOpening
      ? '逃避情景的时间口径：若每天都出现启动拖延、返工或周末补作业，30-45分钟连续14天约为7-10.5小时；若只按10个上课日计算，则是5-7.5小时。报告必须说明采用哪一种口径，不能混算。'
      : '',
    '数字使用规则：以上均为基于当前单次得分率的情景估算，不是学校命题结论或成绩承诺。输出必须使用“预计/风险区间/按当前情景估算”，并要求用最近3次考试、3天作业计时、错题分类和学校考试范围复核。若证据不足，不得缩窄区间或补造精确占分。',
  ].join('\n');
}
