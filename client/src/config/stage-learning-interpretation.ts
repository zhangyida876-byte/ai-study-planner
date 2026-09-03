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

interface CrossSubjectSeed extends Omit<CrossSubjectImpact, 'parentAction'> {
  verification: string;
}

const CROSS_SUBJECT_MAP: Record<string, CrossSubjectSeed[]> = {
  语文: [
    {
      ability: '题干阅读与信息提取',
      relatedSubjects: ['数学', '物理', '化学'],
      mechanism: '读准条件、限定词和问题目标，会直接影响应用题与理科题干的信息提取。',
      observablePhenomenon: '孩子会知识点，却常因漏看“至少、恰好、忽略”等条件而列错式或答非所问。',
      verification: '各抽1道数学应用题和理科情境题，只让孩子圈条件并复述题目要求，不进行计算。',
    },
    {
      ability: '材料证据与规范表达',
      relatedSubjects: ['历史', '地理', '政治'],
      mechanism: '从材料定位证据并按设问组织答案，是文科材料题共享的表达步骤。',
      observablePhenomenon: '材料看懂了，但答案写得很长、采分点少，或观点与材料没有对应。',
      verification: '各抽1道阅读题和材料题，检查答案中的每个观点能否指回原文证据。',
    },
  ],
  数学: [
    {
      ability: '代数关系与定量计算',
      relatedSubjects: ['物理', '化学'],
      mechanism: '方程、比例、单位换算和运算稳定性直接参与物理公式建模与化学定量计算。',
      observablePhenomenon: '理化概念能说清，但一到列式、变形或单位换算就卡住。',
      verification: '分别抽1道数学方程题和理化计算题，对照检查列式、变形、单位三步。',
    },
    {
      ability: '函数与图像转换',
      relatedSubjects: ['物理', '地理'],
      mechanism: '坐标、斜率、变化趋势和图像对应关系，会用于运动图像及统计图表解释。',
      observablePhenomenon: '文字关系能复述，换成坐标图、变化曲线或统计图后判断不稳定。',
      verification: '用同一组关系分别做文字、表格和图像表达，检查三种表示能否互相转换。',
    },
  ],
  英语: [],
  物理: [],
  化学: [
    {
      ability: '实验变量控制与证据论证',
      relatedSubjects: ['物理', '生物'],
      mechanism: '控制变量、记录现象和由证据得出结论，是理化生实验探究共享的方法。',
      observablePhenomenon: '实验步骤会背，但无法解释为什么只改变一个条件，结论也常缺少成立范围。',
      verification: '各抽1道化学和生物或物理实验题，只检查自变量、因变量和控制变量。',
    },
  ],
  生物: [
    {
      ability: '图表证据与实验变量',
      relatedSubjects: ['化学'],
      mechanism: '从图表提取变化关系并控制实验变量，会影响生化实验材料题的证据判断。',
      observablePhenomenon: '教材结论会背，换成曲线、表格或实验材料后无法说明证据。',
      verification: '选1道生物图表题和1道化学实验题，只口述变量、趋势和结论依据。',
    },
  ],
  历史: [
    {
      ability: '时空定位与因果链',
      relatedSubjects: ['地理', '政治'],
      mechanism: '时间、区域背景和事件因果能帮助理解区域变化与社会制度材料。',
      observablePhenomenon: '史实背过，但材料换了地区或时代后不知道调用哪条知识。',
      verification: '用同一事件画时间、地点、原因、影响四格，再核对地理或政治材料中的对应条件。',
    },
  ],
  地理: [
    {
      ability: '空间定位与区域背景',
      relatedSubjects: ['历史'],
      mechanism: '地图位置、地形气候与资源条件，会影响历史事件和区域发展的解释。',
      observablePhenomenon: '历史事件记得住，但说不清为什么发生在该区域、产生何种差异。',
      verification: '选1个历史事件，在空白地图上标位置并说明两项区域条件。',
    },
  ],
  政治: [
    {
      ability: '设问限定与材料论证',
      relatedSubjects: ['历史'],
      mechanism: '识别主体、限定词、观点和材料证据，会影响政史材料题的采分点组织。',
      observablePhenomenon: '答案内容很多，但主体写错、观点越界或缺少材料依据。',
      verification: '各抽1道政治和历史材料题，先不作答，只圈主体、范围和证据词。',
    },
  ],
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
  const crossLinks = CROSS_SUBJECT_MAP[input.subject] || [];
  return {
    phaseFocuses: buildPhaseFocuses(input),
    phenomenonCauseLinks,
    crossSubjectImpacts: crossLinks.map((cross) => ({
      ability: cross.ability,
      relatedSubjects: cross.relatedSubjects,
      mechanism: cross.mechanism,
      observablePhenomenon: cross.observablePhenomenon,
      parentAction: cross.verification,
    })),
    parentGuidance: buildParentGuidance(input.stage, input.grade),
  };
}
