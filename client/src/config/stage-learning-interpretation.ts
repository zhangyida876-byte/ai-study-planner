import type { StageSlug } from './stages';

export type SemesterPhaseId =
  | 'before-school'
  | 'opening-week'
  | 'first-month'
  | 'before-midterm'
  | 'before-final';

export interface SemesterPhaseFocus {
  id: SemesterPhaseId;
  label: string;
  learningFocus: string[];
  parentAction: string;
  duration: string;
  checkMethod: string;
  effectiveStandard: string;
  avoid: string;
}

export interface PhenomenonCauseLink {
  phenomenon: string;
  cause: string;
  impact: string;
  verification: string;
}

export interface CrossSubjectImpact {
  ability: string;
  relatedSubjects: string[];
  mechanism: string;
  observablePhenomenon: string;
  parentAction: string;
}

export interface ParentGuidance {
  attention: string;
  autonomy: string;
  emotionAndStress: string;
  supervisionBoundary: string;
  commonRisk: string;
}

export interface StageInterpretationFields {
  phaseFocuses: SemesterPhaseFocus[];
  phenomenonCauseLinks: PhenomenonCauseLink[];
  crossSubjectImpacts: CrossSubjectImpact[];
  parentGuidance: ParentGuidance;
}

interface InterpretationInput {
  stage: StageSlug;
  grade: string;
  subject: string;
  keyDifficulties: string[];
  observablePhenomena: string[];
  rootCauses: string[];
  futureImpacts: string[];
  openingActions: string[];
  weeklyActions: string[];
}

function gradeNumber(grade: string): number {
  const elementary = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
  const middle = ['七年级', '八年级', '九年级'];
  const high = ['高一', '高二', '高三'];
  const elementaryIndex = elementary.indexOf(grade);
  if (elementaryIndex >= 0) return elementaryIndex + 1;
  const middleIndex = middle.indexOf(grade);
  if (middleIndex >= 0) return middleIndex + 7;
  const highIndex = high.indexOf(grade);
  return highIndex >= 0 ? highIndex + 10 : 0;
}

function buildParentGuidance(stage: StageSlug, grade: string): ParentGuidance {
  const level = gradeNumber(grade);
  if (stage === 'elementary' && level <= 2) {
    return {
      attention: '一次专注约10-15分钟，任务要短、清楚且能立即完成。',
      autonomy: '仍依赖成人示范和固定流程，先示范一次，再让孩子独立复述。',
      emotionAndStress: '对对错评价敏感，应反馈具体动作，不用“聪明/粗心”给孩子贴标签。',
      supervisionBoundary: '家长负责定时、读要求和验收，不代写、不连续纠错。',
      commonRisk: '识字或计算尚未自动化时，孩子容易因任务耗时产生逃避。',
    };
  }
  if (stage === 'elementary') {
    return {
      attention: level <= 4 ? '可维持20分钟左右的单项任务，但复杂题需要拆步骤。' : '可完成25-30分钟任务，应开始训练独立规划和限时检查。',
      autonomy: '从“家长陪着做”过渡到孩子先做、自己检查、再向家长讲依据。',
      emotionAndStress: '开始在意同伴和分数，连续失误时容易把方法问题理解成“我不行”。',
      supervisionBoundary: '家长检查过程证据和错因，不逐题盯做，也不直接报答案。',
      commonRisk: level >= 5 ? '小升初前盲目加量会掩盖阅读、计算和表达的真实断点。' : '三四年级题目从直观转向关系理解，仍沿用低年级记忆方式会出现分化。',
    };
  }
  if (stage === 'middle') {
    return {
      attention: '科目切换频繁，单次25-35分钟更适合用明确产出维持专注。',
      autonomy: '自主意识增强但规划能力未成熟，需要周目标和可见验收，而不是反复催促。',
      emotionAndStress: grade.includes('九') ? '模考与升学压力增大，要区分一次波动和稳定漏洞。' : '同伴比较和成绩分化会影响自我评价，需要用小测进步恢复掌控感。',
      supervisionBoundary: '家长只确认今天目标、错因和下一步，不接管作业安排。',
      commonRisk: grade.includes('八') ? '初二抽象度和科目难度同步上升，回避难题会快速放大差距。' : grade.includes('九') ? '初三新课、复习和模考叠加，晚发现的漏洞会挤压专项修复时间。' : '小升初后仍靠临时记忆和被动跟学，容易出现“作业会、考试不会”。',
    };
  }
  return {
    attention: '知识密度高，单次35-45分钟应只解决一个模型或题型，并保留复盘时间。',
    autonomy: '需要学生参与确定优先级；家长适合看数据和节奏，不适合替学生排满时间。',
    emotionAndStress: grade === '高三' ? '考试频繁，需把总分焦虑转成可处理的题型与执行问题。' : '抽象难度和同伴差距突然增大，短期退步不等于能力定型。',
    supervisionBoundary: '家长每周核对一次计划、测评和错因，不每天追问排名或横向比较。',
    commonRisk: grade === '高一' ? '初中经验直接套用到高中，会在符号语言、模型和长文本上失效。' : grade === '高二' ? '选科后难度加深，弱模块会影响赋分稳定和专业选择准备。' : '复习轮次固定，平均用力或无序刷卷会挤占高价值补弱时间。',
  };
}

const CROSS_SUBJECT_MAP: Record<string, Omit<CrossSubjectImpact, 'parentAction'>> = {
  语文: {
    ability: '阅读证据与规范表达',
    relatedSubjects: ['数学', '英语', '历史', '地理', '政治'],
    mechanism: '题干限定、材料证据和答案组织是应用题与材料题的共同底层步骤。',
    observablePhenomenon: '语文阅读答案点不全时，其他学科也常出现“会知识但答非所问”。',
  },
  数学: {
    ability: '符号运算、数量关系与图像转换',
    relatedSubjects: ['物理', '化学', '地理'],
    mechanism: '方程、比例、函数图像和单位运算直接参与理科建模与定量计算。',
    observablePhenomenon: '数学列式或图像转换不稳时，物理公式题和化学计算也容易卡在第一步。',
  },
  英语: {
    ability: '长句拆分与语篇逻辑',
    relatedSubjects: ['语文', '历史', '地理', '政治'],
    mechanism: '抓主干、识别连接关系和定位证据会迁移到长材料阅读。',
    observablePhenomenon: '英语逐词翻译仍读不懂时，长材料题也容易漏条件和转折。',
  },
  物理: {
    ability: '过程建模与图像解释',
    relatedSubjects: ['数学', '化学'],
    mechanism: '物理量关系依赖代数、函数图像、单位和守恒思想。',
    observablePhenomenon: '公式都会背，但题目换情境后不知道先画图还是先列式。',
  },
  化学: {
    ability: '符号、比例与实验论证',
    relatedSubjects: ['数学', '物理', '生物'],
    mechanism: '化学计算依赖比例方程，实验结论依赖变量控制和证据表达。',
    observablePhenomenon: '现象能复述，但方程式、数量关系或结论条件经常不完整。',
  },
  生物: {
    ability: '机制链与实验变量',
    relatedSubjects: ['语文', '化学'],
    mechanism: '材料信息提取和变量关系决定机制题、实验题是否能完整作答。',
    observablePhenomenon: '教材背熟，换成图表或实验材料后仍找不到答题入口。',
  },
  历史: {
    ability: '时空定位、因果与材料概括',
    relatedSubjects: ['语文', '政治', '地理'],
    mechanism: '时间空间框架和证据化表达是文科材料题的共同能力。',
    observablePhenomenon: '史实背了很多，但材料一变就不知道该调用哪一段。',
  },
  地理: {
    ability: '空间图表与多因素因果链',
    relatedSubjects: ['数学', '物理', '历史'],
    mechanism: '比例、图像、自然过程和区域背景需要同步整合。',
    observablePhenomenon: '单项结论会背，换一张地图就无法解释原因和影响。',
  },
  政治: {
    ability: '概念边界与材料论证',
    relatedSubjects: ['语文', '历史'],
    mechanism: '设问限定、主体、观点和材料证据共同决定采分点。',
    observablePhenomenon: '答案写得很长，但观点和材料没有一一对应。',
  },
};

function buildPhaseFocuses(input: InterpretationInput): SemesterPhaseFocus[] {
  const [firstModule = '第一单元前置知识', secondModule = '当前单元核心方法', thirdModule = '学期后续内容'] = input.keyDifficulties;
  const openingAction = input.openingActions[0] || `核对${firstModule}的前置基础`;
  const weeklyAction = input.weeklyActions[0] || `完成一次${input.subject}章节小测`;
  return [
    {
      id: 'before-school', label: '开学前',
      learningFocus: [`恢复上一学期与${firstModule}直接相关的基础`, `预览教材目录和${firstModule}的关键词`],
      parentAction: openingAction, duration: '每天15-20分钟',
      checkMethod: `让孩子不看答案说清${firstModule}的2个关键概念，再做3-5道基础题。`,
      effectiveStandard: '能独立说清概念，基础题正确率达到80%以上，错误可归因。',
      avoid: `不提前刷${thirdModule}的综合题，也不一次补完整册。`,
    },
    {
      id: 'opening-week', label: '开学第一周',
      learningFocus: [`跟紧学校${firstModule}`, '建立预习标记、听课核对、当日复盘流程'],
      parentAction: `每天只问“今天${input.subject}最难的点是什么、依据是什么、明天怎么验证”。`, duration: '每天20-25分钟',
      checkMethod: '抽看课堂标记、作业错因和一道当天变式题，不按作业页数判断效果。',
      effectiveStandard: '当天问题能在24小时内说清并用一道同类题验证。',
      avoid: `学校尚未进入${secondModule}前，不用后续难题替代当前课内理解。`,
    },
    {
      id: 'first-month', label: '开学第一个月',
      learningFocus: [`形成${firstModule}到${secondModule}的知识联系`, '准备第一次月考的基础与中档题'],
      parentAction: weeklyAction, duration: '每周2次30分钟专项 + 1次20分钟小测',
      checkMethod: '比较两次小测的错误类型，检查同类错误是否减少，而不只看总分。',
      effectiveStandard: '核心题型正确率稳定在80%左右，连续两次不再重复同类错误。',
      avoid: `不因一次月考波动立刻加量，也不跳到${thirdModule}。`,
    },
    {
      id: 'before-midterm', label: '期中前',
      learningFocus: [`整合已学的${firstModule}、${secondModule}`, '按错因补最影响得分的1-2个模块'],
      parentAction: '用最近两次作业和单元测评画错因分布，只追最高频错误。', duration: '考前2周每周2-3次30分钟',
      checkMethod: '用限时小卷检查知识、方法和时间分配是否稳定。',
      effectiveStandard: '基础中档题得分稳定，能说清失分来自知识、方法还是执行。',
      avoid: '不脱离学校范围刷整册套卷，不把偶发失误当成全部不会。',
    },
    {
      id: 'before-final', label: '期末前',
      learningFocus: ['按教材主线串联本学期已学内容', '用单元错题验证跨章节迁移'],
      parentAction: '让孩子先画知识主线，再用错题和阶段卷检验薄弱连接。', duration: '考前3周每周3次30-40分钟',
      checkMethod: '每周一次限时卷，记录题型正确率、用时和重复错因。',
      effectiveStandard: '主要模块无明显断档，重复错因连续两次下降。',
      avoid: '不平均复习所有章节，不只抄错题答案而跳过归因。',
    },
  ];
}

export function buildStageInterpretationFields(input: InterpretationInput): StageInterpretationFields {
  const phenomenonCauseLinks = input.observablePhenomena.map((phenomenon, index) => ({
    phenomenon,
    cause: input.rootCauses[index] || input.rootCauses[0] || `${input.subject}前置知识和方法步骤需要核实`,
    impact: input.futureImpacts[index] || input.futureImpacts[0] || `影响${input.subject}后续章节迁移`,
    verification: `从最近${input.subject}作业或测评抽取5道同类题，比较原题、变式题和口述依据。`,
  }));
  const cross = CROSS_SUBJECT_MAP[input.subject] || CROSS_SUBJECT_MAP.语文;
  return {
    phaseFocuses: buildPhaseFocuses(input),
    phenomenonCauseLinks,
    crossSubjectImpacts: cross.relatedSubjects.slice(0, 3).map((relatedSubject) => ({
      ...cross,
      relatedSubjects: [relatedSubject],
      mechanism: `${cross.mechanism}当前重点核对${input.subject}与${relatedSubject}之间的迁移。`,
      parentAction: `本周各抽1道${input.subject}与${relatedSubject}相关题，让孩子圈条件、讲依据，确认是否为共性能力问题。`,
    })),
    parentGuidance: buildParentGuidance(input.stage, input.grade),
  };
}
