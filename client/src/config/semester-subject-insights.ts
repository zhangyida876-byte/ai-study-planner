import type { StageSlug } from '@client/src/config/stages';
import { buildAcademicTimingPromptContext } from '../utils/academic-phase';
import {
  buildStageInterpretationFields,
  type StageInterpretationFields,
} from './stage-learning-interpretation';

export interface SemesterSubjectInsight extends StageInterpretationFields {
  stage: StageSlug;
  grade: string;
  semester: string;
  subject: string;
  agePsychology: string[];
  learningTraits: string[];
  subjectCharacteristics: string;
  coreGoals: string[];
  keyDifficulties: string[];
  commonMistakes: string[];
  bottlenecks: string[];
  observablePhenomena: string[];
  rootCauses: string[];
  futureImpacts: string[];
  openingActions: string[];
  weeklyActions: string[];
  onionRecommendations: string[];
}

const ensureList = (items: string[] | undefined, fallback: string[]): string[] => (
  items?.filter(Boolean).length ? items.filter(Boolean) : fallback
);

type BaseSemesterSubjectInsight = Omit<SemesterSubjectInsight, keyof StageInterpretationFields>;

function normalizeInsight(insight: BaseSemesterSubjectInsight): SemesterSubjectInsight {
  const subjectFallback = `${insight.subject}当前章节需结合最近作业和测评进一步核对`;
  const normalized = {
    ...insight,
    agePsychology: ensureList(insight.agePsychology, ['需要用清晰的小目标和及时反馈稳定学习节奏']),
    learningTraits: ensureList(insight.learningTraits, ['先用最近作业和测评区分知识、方法与执行问题']),
    coreGoals: ensureList(insight.coreGoals, [`说清${insight.subject}当前章节的核心规则`]),
    keyDifficulties: ensureList(insight.keyDifficulties, [subjectFallback]),
    commonMistakes: ensureList(insight.commonMistakes, [subjectFallback]),
    bottlenecks: ensureList(insight.bottlenecks, [subjectFallback]),
    observablePhenomena: ensureList(insight.observablePhenomena, [subjectFallback]),
    rootCauses: ensureList(insight.rootCauses, [subjectFallback]),
    futureImpacts: ensureList(insight.futureImpacts, [`会影响${insight.subject}后续章节的方法迁移和考试稳定性`]),
    openingActions: ensureList(insight.openingActions, ['抽查最近错题并按概念、方法和执行分类']),
    weeklyActions: ensureList(insight.weeklyActions, ['完成一次章节小测并复盘同类错误']),
    onionRecommendations: ensureList(insight.onionRecommendations, ['先用测评定位，再按知识点课程、解题课和错题复盘闭环学习']),
  };
  return {
    ...normalized,
    ...buildStageInterpretationFields(normalized),
  };
}

type SubjectSeed = Omit<BaseSemesterSubjectInsight, 'stage' | 'grade' | 'semester' | 'agePsychology' | 'learningTraits'>;

const MIDDLE_SUBJECTS = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'] as const;
const PERIODS = ['七年级上学期', '七年级下学期', '八年级上学期', '八年级下学期', '九年级上学期', '九年级下学期'] as const;

const PERIOD_CONTEXT: Record<typeof PERIODS[number], { psychology: string[]; learning: string[] }> = {
  七年级上学期: {
    psychology: ['从小学进入初中，对自主权更敏感，简单催促容易引发抵触', '新环境中会用分数和同伴反馈重新判断自己的能力'],
    learning: ['科目增多、作业节奏变快，小学的被动跟学方式开始失效', '必须建立预习、听课标记、当日复盘的闭环'],
  },
  七年级下学期: {
    psychology: ['新鲜感减退，容易把成绩波动归因为“我不擅长”', '同伴节奏差距开始显现，需要可见的小目标维持信心'],
    learning: ['知识从单点进入连锁应用，上学期漏洞会放大', '要从“作业做完”升级为“会讲方法、会解释错因”'],
  },
  八年级上学期: {
    psychology: ['自我意识增强，对说教敏感，但对可量化的进步反馈敏感', '一旦连续受挫，容易用拖延回避难题'],
    learning: ['物理等抽象学科加入，学业分化速度明显加快', '需要同时管理前置概念、题型方法和计算准确性'],
  },
  八年级下学期: {
    psychology: ['对中考开始有压力感，但对长期目标仍缺乏真实时间感', '需要用周目标替代空泛的“为中考努力”'],
    learning: ['八下是九年级综合学习的前置定型期', '不能只看总分，要用章节正确率和错因类型识别隐性漏洞'],
  },
  九年级上学期: {
    psychology: ['考试频率上升，容易在总分波动中出现焦虑或盲目加量', '需要明确的优先级和可验收任务恢复掌控感'],
    learning: ['新课、旧漏洞和考试题型开始叠加', '提分要从笼统刷题切换为高频失分模块的闭环训练'],
  },
  九年级下学期: {
    psychology: ['模考与升学压力集中，容易因一次失利否定整体能力', '家长的情绪稳定和具体反馈比反复追问排名更有效'],
    learning: ['复习窗口有限，必须区分知识漏洞、方法漏洞和考场执行问题', '以真题和模考数据决定优先级，不再追求所有内容平均用力'],
  },
};

const SUBJECT_BASE: Record<typeof MIDDLE_SUBJECTS[number], Omit<SubjectSeed, 'subjectCharacteristics' | 'coreGoals' | 'keyDifficulties' | 'commonMistakes' | 'bottlenecks' | 'futureImpacts'>> = {
  语文: { subject: '语文', observablePhenomena: ['阅读答案写了很多却得分低', '作文有内容但结构松散'], rootCauses: ['文本证据与答题要点没有建立对应', '素材积累未经过主题化和结构化'], openingActions: ['用一篇课内阅读做“题干-证据-答案”标注', '整理2个可复用作文素材'], weeklyActions: ['每周2次阅读题限时并复述答题依据', '每周1次作文提纲与片段升格'], onionRecommendations: ['知识点课程补阅读方法和文言规则', '解题课训典型阅读题，练习后复盘答题证据'] },
  数学: { subject: '数学', observablePhenomena: ['例题听懂，换个问法就不会', '计算过程频繁丢符号或条件'], rootCauses: ['概念、条件和解题步骤没有结构化', '只对答案，没有对错误步骤归因'], openingActions: ['抽查10道错题按概念/计算/建模归类', '每天15分钟做计算准确性训练'], weeklyActions: ['每周完成1次章节小测并绘制错因分布', '用2道变式题验证方法是否迁移'], onionRecommendations: ['AI功能辅助错因分类和路径安排', '知识点课程补概念，解题课训题型，测评验收'] },
  英语: { subject: '英语', observablePhenomena: ['单词背过，进入句子和阅读就认不出', '完形和阅读总在相似选项中选错'], rootCauses: ['词汇只记中文意思，未建立词性、搭配和语境', '长句结构和篇章逻辑标记不稳'], openingActions: ['抽查20个旧词的句中识别和搭配', '每天精读1个长句并标主干'], weeklyActions: ['每周2篇阅读定位原文证据', '每周复盘1次语法错题和词汇搭配'], onionRecommendations: ['同步课跟校内语法和课文', '知识点课程补句法，解题课训阅读证据定位'] },
  物理: { subject: '物理', observablePhenomena: ['公式会背，题目换场景就不知道用哪个', '实验题会写结论但说不清控制变量'], rootCauses: ['物理量、单位和现象没有建立同一模型', '实验步骤靠背诵，未理解验证逻辑'], openingActions: ['用生活现象解释3个核心概念', '完成1次“条件-公式-单位-结果”链条练习'], weeklyActions: ['每周1次概念辨析和1次实验题复述', '错题必须标记错在现象、模型还是计算'], onionRecommendations: ['知识点课程用动画建立物理模型', '解题课训场景识别，测评验证模型迁移'] },
  化学: { subject: '化学', observablePhenomena: ['化学用语、化学式会背但经常写错', '实验现象与结论对不上'], rootCauses: ['宏观现象、微观粒子和符号表达没有互相映射', '实验条件、现象、结论链条不完整'], openingActions: ['建立10个基础符号与现象的双向卡片', '用1个实验练习条件-现象-结论'], weeklyActions: ['每周1次化学用语小测', '每周1组实验探究题并口述证据链'], onionRecommendations: ['知识点课程建立宏观-微观-符号联系', '解题课和练习训实验与计算题'] },
  生物: { subject: '生物', observablePhenomena: ['名词背了很多，材料题仍找不到答案', '图像、结构和功能容易混淆'], rootCauses: ['知识点是零散记忆，没有建立结构-功能-环境的关系', '不会从材料和图表中提取限定条件'], openingActions: ['用1张图重画核心结构并口述功能', '练习3道材料题的关键词圈画'], weeklyActions: ['每周完成1张章节关系图', '每周1次图表或实验题证据提取'], onionRecommendations: ['同步课梳理章节结构', '知识点课加深机制理解，练习验证材料迁移'] },
  历史: { subject: '历史', observablePhenomena: ['时间和事件背了，材料题仍不会归纳', '相似制度和事件容易混淆'], rootCauses: ['史实未放进时空线和因果链', '材料关键词与教材观点没有对应'], openingActions: ['绘制1个单元时间轴和因果链', '练习3道材料题的“材料词-教材词”转换'], weeklyActions: ['每周复述1个主题的背景-过程-影响', '每周1次材料题限定词检查'], onionRecommendations: ['同步课建立历史主线', '知识点课补因果逻辑，解题课训材料转化'] },
  地理: { subject: '地理', observablePhenomena: ['地图会看图例，但不会从图中提取关系', '自然要素和人类活动影响说不完整'], rootCauses: ['空间定位、图表读取和因果解释没有形成步骤', '只记区域结论，未理解位置与要素的联系'], openingActions: ['每天读1张图，按位置-要素-影响口述', '整理1类等值线或统计图读图步骤'], weeklyActions: ['每周2道综合读图题', '每周用空白图复现1个区域的核心关系'], onionRecommendations: ['知识点课建立空间和因果模型', '解题课训读图步骤，练习验收迁移'] },
  政治: { subject: '政治', observablePhenomena: ['知识点背了，材料题不知道用哪个观点', '答案篇幅很长但采分点少'], rootCauses: ['材料情境、教材观点和行为建议未建立对应', '答题没有按限定词和分值组织要点'], openingActions: ['用3道材料题练习圈情境词、定观点、写行动', '整理1个单元的观点-材料对应表'], weeklyActions: ['每周1次材料题按点给分', '每周更新1个时政案例与教材观点的联系'], onionRecommendations: ['同步课梳理教材观点', '解题课训情境材料转化，练习检查采分点'] },
};

const SUBJECT_FUTURE_IMPACTS: Record<typeof MIDDLE_SUBJECTS[number], string[]> = {
  语文: ['影响跨文本证据提取、文言迁移和考场作文表达', '答案组织不清会在各类材料题中持续丢采分点'],
  数学: ['影响后续方程、函数、几何和综合题的条件转化', '计算与建模不稳会压缩中高档题的作答时间'],
  英语: ['影响长难句、完形阅读和写作输出', '词汇语境与句法不稳会让阅读正确率长期波动'],
  物理: ['影响力、电、热等模型迁移和实验探究', '公式与情境不能互译会在综合题中持续卡顿'],
  化学: ['影响物质转化、实验探究和定量计算', '宏观微观符号链不完整会导致新概念互相混淆'],
  生物: ['影响遗传、稳态、生态等机制类材料题', '结构功能关系不清会导致图表和实验题迁移困难'],
  历史: ['影响跨时期比较、材料概括和因果论证', '时空线索不稳会让史实调用和观点表达失序'],
  地理: ['影响区域综合、人地关系和图表信息整合', '空间定位不稳会让自然与人文要素无法形成因果链'],
  政治: ['影响材料情境与学科观点的匹配', '主体、权利责任和观点边界不清会持续漏采分点'],
};

type CoreStageSubject = '语文' | '数学' | '英语';
type SemesterModules = { 上学期: string[]; 下学期: string[] };

const ELEMENTARY_MODULES: Record<string, Record<CoreStageSubject, SemesterModules>> = {
  一年级: {
    语文: { 上学期: ['拼音拼读', '基础识字与规范书写', '短句朗读'], 下学期: ['识字量扩展', '句子理解', '看图说话与写话启蒙'] },
    数学: { 上学期: ['20以内数感', '加减法意义', '位置与图形初步'], 下学期: ['100以内数感', '进退位加减', '人民币与时间认识'] },
    英语: { 上学期: ['语音模仿', '课堂指令', '基础词汇听说'], 下学期: ['字母与自然拼读启蒙', '核心句型跟读', '图片信息理解'] },
  },
  二年级: {
    语文: { 上学期: ['字词积累', '句子扩写', '记叙文信息提取'], 下学期: ['段落理解', '词句运用', '看图写话结构'] },
    数学: { 上学期: ['表内乘法', '长度单位', '两步问题启蒙'], 下学期: ['表内除法', '万以内数感', '图形运动与数据整理'] },
    英语: { 上学期: ['自然拼读基础', '主题词汇', '简单问答句型'], 下学期: ['词形音对应', '课文朗读', '短句听力与理解'] },
  },
  三年级: {
    语文: { 上学期: ['词句段运用', '记叙文阅读', '习作起步'], 下学期: ['中心句与段意', '古诗积累', '观察类习作'] },
    数学: { 上学期: ['万以内计算', '时分秒与测量', '多位数乘一位数'], 下学期: ['除数是一位数的除法', '面积与周长', '小数初步与应用题'] },
    英语: { 上学期: ['自然拼读', '核心词汇', '一般疑问句启蒙'], 下学期: ['单词记忆方法', '句型理解', '短篇阅读与听力'] },
  },
  四年级: {
    语文: { 上学期: ['概括主要内容', '批注阅读', '记叙文结构'], 下学期: ['关键语句理解', '文言启蒙', '写人记事作文'] },
    数学: { 上学期: ['大数认识', '三位数乘两位数', '角与平行垂直'], 下学期: ['四则运算', '小数意义与运算', '三角形与平均数'] },
    英语: { 上学期: ['词汇拼写', '一般现在时', '听力关键词'], 下学期: ['句型转换', '介词与方位', '短文阅读和书面表达启蒙'] },
  },
  五年级: {
    语文: { 上学期: ['提高阅读速度', '说明文信息提取', '习作选材'], 下学期: ['人物描写', '古典名著阅读', '作文结构与细节'] },
    数学: { 上学期: ['小数乘除法', '简易方程', '多边形面积'], 下学期: ['因数倍数', '分数意义与加减', '长方体正方体'] },
    英语: { 上学期: ['时态意识', '词汇搭配', '篇章信息定位'], 下学期: ['一般过去时启蒙', '语法综合', '阅读理解与短文写作'] },
  },
  六年级: {
    语文: { 上学期: ['主题阅读', '古诗文理解', '作文立意与结构'], 下学期: ['小升初阅读整合', '古诗文积累迁移', '考场作文审题'] },
    数学: { 上学期: ['分数乘除', '比与百分数', '圆与应用题'], 下学期: ['比例与正反比例', '圆柱圆锥', '小升初数与形综合'] },
    英语: { 上学期: ['核心时态', '长句理解', '阅读证据定位'], 下学期: ['小升初词汇语法整合', '完形与阅读', '书面表达'] },
  },
};

interface StageDepthSeed {
  observablePhenomena: string[];
  rootCauses: string[];
  commonMistakes: string[];
  futureImpacts: string[];
  openingActions: string[];
  weeklyActions: string[];
  onionRecommendations: string[];
}

const ELEMENTARY_DEPTH: Record<CoreStageSubject, StageDepthSeed> = {
  语文: {
    observablePhenomena: ['课文能读完，但说不清主要内容和依据', '写话或作文有内容，却常漏题意、顺序和细节'],
    rootCauses: ['识字、词句理解与段落结构没有连成阅读链', '审题、选材、口头表达和书面组织缺少固定步骤'],
    commonMistakes: ['只找原句不理解题目要求', '作文流水账、标点和句子边界不清'],
    futureImpacts: ['影响高年级阅读概括、古诗文理解和作文表达', '语文审题与信息提取不稳还会拖累数学应用题'],
    openingActions: ['选一篇课内短文练“题目-原文证据-自己的话”', '口述一段经历后再按起因经过结果写下来'],
    weeklyActions: ['每周2次阅读证据标注', '每周1次作文提纲和片段修改'],
    onionRecommendations: ['同步课跟进课文与单元语文要素', '知识点课程补阅读方法，练习和AI错因分析做验收'],
  },
  数学: {
    observablePhenomena: ['计算题会做，但竖式、进退位或单位经常出错', '应用题文字读得懂，却说不清先算什么和为什么'],
    rootCauses: ['数感、运算意义和计算步骤没有形成稳定表征', '已知、问题、数量关系和算式之间没有建立模型'],
    commonMistakes: ['抄错数、漏单位、运算顺序混乱', '见到关键词就套公式，条件变化后不会列式'],
    futureImpacts: ['影响面积周长、分数小数百分数和方程启蒙', '应用题建模不稳会在小升初综合题中持续失分'],
    openingActions: ['每天10分钟计算并记录错误类型', '每天讲1道应用题的已知、所求、关系和步骤'],
    weeklyActions: ['每周做1次计算与应用题小测', '用2道变式题验证是否真正理解数量关系'],
    onionRecommendations: ['知识点课程补数感、概念和基础模型', '解题课训练典型应用题，测评与错题复盘验证迁移'],
  },
  英语: {
    observablePhenomena: ['单词单独会读，放进课文就认不出或不会拼', '课文能跟读，但换成新句型就听不懂、说不出'],
    rootCauses: ['字母音、拼读、词义和词形没有建立双向联系', '听力输入、句型理解和口头输出练习不足'],
    commonMistakes: ['只背中文意思，不会按音节拼读', '机械抄句子，不理解人称、时态和语序'],
    futureImpacts: ['影响高年级词汇积累、语法启蒙和阅读速度', '听说基础不稳会增加初中长句和写作的学习成本'],
    openingActions: ['每天10分钟做自然拼读和听音辨词', '选课文3句完成听、跟读、替换词复述'],
    weeklyActions: ['每周抽查20个词的听说读写', '每周完成2次短篇听读并口述大意'],
    onionRecommendations: ['同步课跟校内词汇句型', '知识点课程补拼读和语法，练习验证听读迁移'],
  },
};

const HIGH_SUBJECTS = MIDDLE_SUBJECTS;

const HIGH_MODULES: Record<typeof HIGH_SUBJECTS[number], Record<string, SemesterModules>> = {
  语文: {
    高一: { 上学期: ['现代文信息筛选', '文言实词与句式', '议论文写作启蒙'], 下学期: ['文学类文本阅读', '古诗鉴赏', '作文立意与素材'] },
    高二: { 上学期: ['论述类文本', '文言翻译与文化常识', '作文论证结构'], 下学期: ['现代文综合阅读', '古诗比较鉴赏', '语言文字运用'] },
    高三: { 上学期: ['高考阅读题型整合', '古诗文精准翻译', '作文审题立意'], 下学期: ['真题阅读证据链', '语言运用', '考场作文稳定性'] },
  },
  数学: {
    高一: { 上学期: ['集合与逻辑', '函数概念、单调性与图像', '指数对数函数'], 下学期: ['三角函数', '平面向量', '复数与立体几何初步'] },
    高二: { 上学期: ['数列', '空间向量与立体几何', '直线与圆锥曲线'], 下学期: ['导数及应用', '计数原理', '概率统计'] },
    高三: { 上学期: ['函数导数综合', '数列与解析几何', '概率统计与立体几何'], 下学期: ['高考真题模块', '压轴题分类讨论', '限时取舍与稳定性'] },
  },
  英语: {
    高一: { 上学期: ['高中核心词汇', '句子成分与从句启蒙', '阅读信息定位'], 下学期: ['定语从句', '完形语境', '应用文写作'] },
    高二: { 上学期: ['非谓语与复杂句', '七选五逻辑', '读后续写基础'], 下学期: ['语法填空整合', '长篇阅读', '应用文与续写表达'] },
    高三: { 上学期: ['高频词汇语境', '阅读完形七选五', '写作题型整合'], 下学期: ['真题语篇证据', '语法错点', '应用文与续写稳定输出'] },
  },
  物理: {
    高一: { 上学期: ['运动学图像', '牛顿运动定律', '受力分析'], 下学期: ['曲线运动', '万有引力', '功和能量关系'] },
    高二: { 上学期: ['静电场', '恒定电流与电路', '磁场与带电粒子'], 下学期: ['电磁感应', '交变电流', '机械振动与波'] },
    高三: { 上学期: ['力学模型综合', '电磁场综合', '实验与图像'], 下学期: ['高考模型迁移', '实验题证据链', '综合计算与时间分配'] },
  },
  化学: {
    高一: { 上学期: ['物质的量', '离子反应与氧化还原', '元素化合物'], 下学期: ['元素周期律', '化学反应与能量', '有机化学初步'] },
    高二: { 上学期: ['化学反应速率与平衡', '电化学', '水溶液平衡'], 下学期: ['物质结构', '有机化学基础', '实验探究'] },
    高三: { 上学期: ['反应原理综合', '工艺流程题', '实验探究与有机推断'], 下学期: ['真题证据链', '计算与图像', '工艺实验综合'] },
  },
  生物: {
    高一: { 上学期: ['细胞结构', '物质跨膜运输', '酶与细胞代谢'], 下学期: ['有丝分裂', '遗传基本规律', '伴性遗传'] },
    高二: { 上学期: ['稳态与调节', '神经体液免疫', '植物生命活动调节'], 下学期: ['种群群落生态系统', '生态工程', '生物技术实践'] },
    高三: { 上学期: ['细胞代谢与遗传综合', '稳态生态', '实验设计'], 下学期: ['高考材料题', '遗传计算', '实验变量与结论'] },
  },
  历史: {
    高一: { 上学期: ['中外历史纲要古代至近代', '时空定位', '制度与社会变迁'], 下学期: ['现代中国与世界', '民族国家与国际关系', '材料题概括'] },
    高二: { 上学期: ['国家制度与社会治理', '经济与社会生活', '选必模块材料题'], 下学期: ['文化交流传播', '战争与文化', '跨时空比较'] },
    高三: { 上学期: ['通史主题整合', '史料实证', '比较与因果论证'], 下学期: ['高考材料题', '开放性论述', '学科术语精准表达'] },
  },
  地理: {
    高一: { 上学期: ['地球运动', '大气水循环', '地貌与植被'], 下学期: ['人口城镇化', '产业区位', '交通与人地协调'] },
    高二: { 上学期: ['区域发展', '资源环境与国家安全', '区域比较'], 下学期: ['自然地理综合', '世界与中国区域', '图表信息整合'] },
    高三: { 上学期: ['自然过程综合', '区域产业与人地关系', '图表判读'], 下学期: ['高考区域综合', '原因措施评价', '时空尺度转换'] },
  },
  政治: {
    高一: { 上学期: ['中国特色社会主义', '经济与社会', '材料观点匹配'], 下学期: ['政治与法治', '国家制度与公民参与', '主体权限'] },
    高二: { 上学期: ['哲学与文化', '认识论与辩证法', '材料分析'], 下学期: ['当代国际政治经济', '法律与生活', '逻辑与思维'] },
    高三: { 上学期: ['四册主干整合', '时政情境', '主观题证据链'], 下学期: ['高考材料题', '学科术语', '观点材料行动闭环'] },
  },
};

const HIGH_DEPTH: Record<typeof HIGH_SUBJECTS[number], StageDepthSeed> = {
  语文: { observablePhenomena: ['阅读写了很多却踩不中采分点', '作文素材不少但立意、结构和论证松散'], rootCauses: ['题干限定、文本证据和答案术语没有形成对应', '审题立意、素材选择和论证链缺少稳定流程'], commonMistakes: ['脱离文本套模板', '文言关键词漏译、作文论据与观点脱节'], futureImpacts: ['影响高考现代文、古诗文和作文三大板块稳定性', '材料理解与表达还会影响政史地作答'], openingActions: ['做1篇阅读并标出每个答案的原文证据', '完成1道作文题的立意、分论点和素材匹配'], weeklyActions: ['每周2次阅读限时训练', '每周1次作文提纲与片段升格'], onionRecommendations: ['知识点课程补文体方法和古诗文规则', '解题/培优课训练高考题型，AI辅助答案证据复盘'] },
  数学: { observablePhenomena: ['基础题能做，遇到含参数、分类讨论或图像变化就卡', '听懂例题但换条件后无法选择方法'], rootCauses: ['符号语言、图像和数量关系的转化能力未形成', '概念条件和题型方法记成孤立结论，缺少迁移验证'], commonMistakes: ['定义域和参数范围漏检', '分类不全、数形结合和运算过程脱节'], futureImpacts: ['高一函数不稳会影响导数、数列和解析几何', '综合建模和运算稳定性直接影响高考中高档题得分'], openingActions: ['用3天复核当前模块核心定义和图像', '每天做5道基础题并口述条件与依据'], weeklyActions: ['每周1次模块小测和错因统计', '每个方法用2道变式题验证迁移'], onionRecommendations: ['知识点课程补函数、数列、几何等底层模型', '解题/培优课练典型题与综合题，测评和错题复盘验收'] },
  英语: { observablePhenomena: ['词汇背了不少，阅读和完形仍在相似选项中摇摆', '语法题会规则，写作和续写中却用不出来'], rootCauses: ['词汇未进入搭配、语境和篇章逻辑', '长句结构、指代衔接和证据定位步骤不稳定'], commonMistakes: ['只按单词表背词', '阅读凭感觉、写作句式堆砌'], futureImpacts: ['影响阅读、完形、七选五和写作的整体稳定性', '长句理解不足会压缩高考阅读速度'], openingActions: ['每天精读1段并划主干、连接词和证据', '复盘20个词的搭配与真题语境'], weeklyActions: ['每周2套阅读组合限时训练', '每周完成1篇应用文或续写并订正'], onionRecommendations: ['同步课跟进词汇语法', '知识点课程补长句，解题课训阅读证据和写作输出'] },
  物理: { observablePhenomena: ['公式会背，题目一换场景就不会建模', '受力、电路或实验图能看懂，但推不出下一步'], rootCauses: ['物理过程、状态变化和方程没有形成模型链', '图像、实验条件和结论证据之间联系不稳'], commonMistakes: ['受力漏力、正方向混乱', '功能关系和电路状态判断机械套公式'], futureImpacts: ['力学模型不稳会影响功能、圆周和电磁综合', '物理模型能力会影响选科竞争力和理工专业学习准备'], openingActions: ['每天重画2道题的过程图或受力图', '做3道同模型变式并说清状态变化'], weeklyActions: ['每周1次模型分类小测', '实验题按目的、变量、现象、结论复述'], onionRecommendations: ['知识点课程用动画建立运动、力电模型', '解题/培优课训练模型识别，测评和错题复盘验证'] },
  化学: { observablePhenomena: ['方程式会写，工艺流程或实验新情境中不会调用', '反应原理计算常在条件、单位和图像处出错'], rootCauses: ['宏观现象、微观粒子和符号方程没有连成体系', '平衡、电化学、实验变量等原理缺少证据链'], commonMistakes: ['离子与反应条件漏写', '工艺目的、操作和结果答非所问'], futureImpacts: ['影响反应原理、工艺流程、实验探究和有机推断', '会降低化学赋分稳定性及化工医药材料类专业准备度'], openingActions: ['画1张当前模块物质转化关系图', '完成3道实验或流程题并标每步目的'], weeklyActions: ['每周1次方程式与原理小测', '每周1组工艺实验综合题复盘'], onionRecommendations: ['知识点课程建立宏微符号联系', '解题/培优课练工艺实验题，AI辅助错因归类'] },
  生物: { observablePhenomena: ['概念背得熟，材料换一种实验或图表就不会', '遗传、代谢或调节题步骤多时容易漏条件'], rootCauses: ['结构、过程、变量和结果没有形成机制模型', '实验设计的自变量、因变量和对照原则不清'], commonMistakes: ['只背结论不看适用条件', '遗传计算漏概率条件、实验结论超出证据'], futureImpacts: ['影响遗传、稳态、生态和实验设计综合题', '机制推理能力会影响生物赋分和生命科学类专业准备'], openingActions: ['用流程图口述1个核心机制', '做3道材料题并圈变量、条件和结论'], weeklyActions: ['每周1张模块机制图', '每周1组实验或遗传题验收'], onionRecommendations: ['同步课梳理机制主线', '知识点课程补过程，解题课和测评验证材料迁移'] },
  历史: { observablePhenomena: ['史实记了很多，材料题仍不会概括和比较', '开放题观点有了，但证据和论证不完整'], rootCauses: ['史实没有放进时空、因果和阶段特征框架', '材料限定词与学科术语没有建立对应'], commonMistakes: ['跨时期史实错位', '只抄材料、不说明变化原因和影响'], futureImpacts: ['影响高考材料概括、比较和开放性论述', '会降低历史赋分稳定性和人文社科专业学习准备'], openingActions: ['画1条主题时间轴并标转折和因果', '做2道材料题练材料词转学科术语'], weeklyActions: ['每周复述1个主题的背景过程影响', '每周1次材料题按点给分'], onionRecommendations: ['同步课建立通史主线', '知识点课程补因果，解题/培优课训材料论证'] },
  地理: { observablePhenomena: ['地图图表能看懂单项信息，却整合不出原因和措施', '区域题背过结论，换地区后不会迁移'], rootCauses: ['时空定位、自然过程和人类活动没有形成因果链', '图名、图例、尺度、变量的读图步骤不稳定'], commonMistakes: ['不先定位就直接作答', '原因措施只写自然或人文一侧'], futureImpacts: ['影响自然地理过程、区域综合和人地关系题', '会影响地理赋分及资源环境规划类专业准备'], openingActions: ['每天读1张图并按位置、要素、关系口述', '做2道区域题标出证据和因果箭头'], weeklyActions: ['每周2道综合图表题', '每周复盘1个区域的自然人文关系'], onionRecommendations: ['知识点课程建立自然过程和区域模型', '解题/培优课训读图证据，测评验证迁移'] },
  政治: { observablePhenomena: ['知识点能背，材料题不知道调用哪个观点', '答案写得长，但主体、逻辑和采分点不清'], rootCauses: ['情境材料、学科概念和主体行为没有建立映射', '限定词、设问类型和答案层次缺少结构'], commonMistakes: ['主体权限混淆', '只抄材料或只背观点，缺少分析链'], futureImpacts: ['影响高考选择题判断和主观题采分稳定性', '会影响政治赋分及法学经管社会科学类专业准备'], openingActions: ['用2道材料题练圈主体、定知识、连材料', '整理当前模块概念边界表'], weeklyActions: ['每周1次主观题按点给分', '每周更新1个时政情境与教材观点联系'], onionRecommendations: ['同步课梳理概念体系', '知识点课程补边界，解题/培优课训材料转化'] },
};

const PERIOD_FOCUS: Record<typeof PERIODS[number], Record<typeof MIDDLE_SUBJECTS[number], [string, string, string]>> = {
  七年级上学期: {
    语文: ['从小学篇章理解过渡到初中文本证据表达', '古诗文基础、记叙文要素、作文结构', '概括空泛、文言实词脱离语境'],
    数学: ['从具体运算转向代数表示和符号推理', '有理数、整式、一元一次方程、几何初步', '负号丢失、去括号错、方程步骤跳跃'],
    英语: ['从词句记忆转向语篇和语法系统', '一般现在时、人称变化、词类和基础阅读', '三单错、be/实义动词混用、只背词义'],
    物理: ['尚未正式开设时以科学观察和数学计算为前置', '单位换算、比例思维、图像读取', '只追求提前背公式，忽略现象观察'],
    化学: ['尚未正式开设，先建立实验安全和微观想象的前置', '符号意识、比例计算、观察记录', '过早背方程式，未理解变化证据'],
    生物: ['从生活经验转向结构、功能和实验证据', '细胞、生物体结构层次、绿色植物', '图中结构错位、实验变量不清'],
    历史: ['从故事记忆转向时间线和因果解释', '中国古代政治演变、经济文化主线', '人物事件张冠李戴、只背年份'],
    地理: ['建立地理位置、地图语言和空间尺度', '地球地图、经纬网、大洲大洋、气候初步', '经纬度方向错、图例比例尺忽略'],
    政治: ['聚焦中学生活、自我认识与集体规则', '成长、友谊、师生、生命教育', '观点会背但不会回到情境'],
  },
  七年级下学期: {
    语文: ['阅读开始要求多角度证据和语言品析', '写人叙事、文言翻译、语言赏析、综合性学习', '赏析只写“生动形象”、翻译漏关键词'],
    数学: ['几何证据、方程工具和坐标思维开始交叉', '相交线与平行线、实数、平面坐标系、方程组与不等式', '条件与结论混淆、解集边界丢失'],
    英语: ['语法时态增多，阅读从定位信息转向简单推断', '一般过去时、现在进行时、情态动词、段落主旨', '时间标志词忽略、阅读凭语感'],
    物理: ['未开设学校仍以测量、图像和比例为前置', '数据记录、单位、实验变量、图像趋势', '把“看过现象”当成“能解释现象”'],
    化学: ['以数学比例、物理实验逻辑和符号表达为前置', '比例关系、守恒意识、实验记录', '只做超前题，不补计算和表达基础'],
    生物: ['从结构识别进入人体系统的连锁机制', '营养、呼吸、循环、泌尿、神经调节', '各系统割裂记忆、物质路径混淆'],
    历史: ['需要建立朝代政治、经济、民族与文化的横向联系', '隋唐至明清、政治制度、经济重心、对外关系', '朝代特征混淆、影响题缺角度'],
    地理: ['从世界尺度转向区域比较和人地关系', '亚洲、世界典型地区和国家、区域差异', '只记“之最”，不会用位置解释气候与产业'],
    政治: ['聚焦青春期情绪、集体和法治意识', '青春情绪、集体责任、法律保护', '建议与问题不对应、法律与道德混淆'],
  },
  八年级上学期: {
    语文: ['文体增多，要从内容理解升级到结构与表达效果', '新闻、传记、说明文、文言文、实用写作', '文体答题方法混用、说明方法只贴标签'],
    数学: ['几何证明与代数变形同时加难', '三角形、全等、轴对称、整式乘法因式分解、分式', '证明跳步、辅助线无依据、分式条件漏写'],
    英语: ['词汇量和长句明显上升，语法开始强调比较与时态差异', '不定代词、比较级、一般将来时、阅读逻辑', '比较范围不对称、只看局部词选答案'],
    物理: ['首次系统建立“现象-物理量-模型-实验”', '声、光、物态变化、质量与密度', '单位换算错、光路作图不规范、密度公式机械套用'],
    化学: ['九年级正式开课前的实验、比例和符号准备期', '物理实验变量、数学比例、微观模型', '忽视物理和数学基础对化学计算的影响'],
    生物: ['从人体系统转向生物类群、生殖和遗传', '动物运动行为、微生物、遗传与生殖', '结构功能关系不清、遗传概念混淆'],
    历史: ['进入近代史，需要围绕社会性质、探索与转型建主线', '列强侵略、近代化探索、新民主主义革命', '事件顺序混淆、比较题缺维度'],
    地理: ['从世界地理转向中国空间格局和自然要素', '疆域人口、地形、气候、河流、自然灾害', '地形气候河流割裂记忆、分布规律不会解释'],
    政治: ['聚焦社会生活、规则责任和国家利益', '社会关系、网络、规则法律、责任、国家利益', '行为评析只表态、法律依据不准'],
  },
  八年级下学期: {
    语文: ['非连续性文本、演讲和论述表达要求上升', '说明与议论要素、文言整体理解、演讲稿', '信息整合漏条件、观点与材料脱节'],
    数学: ['函数、几何和数据分析开始综合', '二次根式、勾股定理、平行四边形、一次函数、数据分析', '函数图像与式子脱节、几何条件漏用'],
    英语: ['完成时、从句与综合阅读开始拉开差距', '现在完成时、状语从句、被动初步、长篇阅读', '过去式与过去分词混淆、忽略逻辑连接'],
    物理: ['力学模型集中，是后续综合题的核心前置', '力、运动与力、压强、浮力、功和机械能、简单机械', '受力分析漏力、压强与压力混淆、浮力条件误用'],
    化学: ['正式开课前最后的数理前置和实验表达准备期', '质量守恒思想、比例计算、实验控制变量', '物理单位和数学方程不稳导致后续计算受阻'],
    生物: ['进入生物进化、健康与传染病的综合应用', '生命起源进化、传染病与免疫、健康生活', '进化证据链不完整、传染链条混淆'],
    历史: ['从革命过程转向现代国家建设与改革主线', '新中国成立、社会主义建设、改革开放、外交科技', '阶段特征混淆、成就与意义答题重复'],
    地理: ['进入中国区域差异与产业布局的综合解释', '四大地理区域、北方南方西北青藏、中国在世界', '区域特征只背结论、产业条件分析不全'],
    政治: ['进入宪法、权利义务和国家制度的制度化表达', '宪法、公民权利义务、国家机构、公平正义', '主体权限混淆、权利与义务割裂'],
  },
  九年级上学期: {
    语文: ['议论文阅读、文言迁移和考场作文集中拉分', '论点论据论证、小说阅读、文言比较、议论文写作', '论据作用分析空泛、作文论证断裂'],
    数学: ['二次模型、圆与相似构成中考综合题主干', '一元二次方程、二次函数、旋转、圆、概率、反比例函数、相似', '根的条件漏检、函数参数与图像脱节、圆的条件乱用'],
    英语: ['多种从句、被动语态和综合语篇集中', '宾语从句、定语从句、被动语态、完形阅读写作', '从句语序错、时态语态同时判断失误'],
    物理: ['内能、电学建立新模型，与八年级力学共同进入综合', '内能、电路、电流电压电阻、欧姆定律、电功率', '电路状态判断错、表的量程连接错、比值模型不稳'],
    化学: ['首次系统学习，概念、实验、符号和计算同时启动', '走进化学、空气氧气、物质构成、化学式、化学方程式、水与碳', '元素/原子/分子混淆、方程式配平不尊重守恒'],
    生物: ['进入会考/中考整合，需要把四册内容组成生命主题', '结构功能、物质能量、生殖遗传、生态健康', '复习只按课本顺序，不会跨册迁移'],
    历史: ['世界古代至近代转型，需要比较中外发展主线', '古代文明、封建时代、资本主义兴起、工业革命、工人运动', '文明成果错位、革命背景与影响混写'],
    地理: ['以中考主题整合区域、图表、人地关系', '地球地图、自然要素、中国区域、世界区域的跨模块复习', '分册记忆、综合题不会调动多个要素'],
    政治: ['进入富强创新、民主法治、文明绿色的国家发展主题', '改革创新、民主法治、中华文化、生态文明', '大概念只背标题、材料词无法转成学科观点'],
  },
  九年级下学期: {
    语文: ['以考场稳定性为核心，阅读、古诗文和作文精准查漏', '文体答题模型、古诗文高频点、作文审题立意与结构', '套模板不看语境、作文素材与主题不匹配'],
    数学: ['以真题模块和限时执行为主，不再平均补全册', '数与式、方程函数、几何证明、统计概率、综合压轴', '基础题跳步、中档题条件漏用、压轴耗时过长'],
    英语: ['转向语篇证据、限时阅读和写作输出稳定性', '词汇语法错点、完形阅读证据、书面表达', '频繁背新词却不复盘语境、写作句式堆砌'],
    物理: ['以力、电、热、光声的模型迁移和实验证据为主', '受力与力学、欧姆与电功率、热学、实验探究、综合计算', '公式堆叠、电路状态误判、实验结论缺条件'],
    化学: ['新课收尾后围绕物质关系网、实验探究和计算闭环', '酸碱盐、物质转化、实验鉴别除杂、化学计算', '反应条件漏写、离子关系混淆、计算口径不一'],
    生物: ['以主题综合、图表证据和实验设计为中考/会考收口', '细胞与结构层次、物质运输、生殖遗传、生态健康', '知识点会背但材料迁移失分、实验变量不唯一'],
    历史: ['中外历史主题整合，用时间、因果、比较处理材料', '政治制度、经济发展、思想文化、科技革命、国际关系', '主题题只罗列史实、材料限定的时间范围漏看'],
    地理: ['以地图、区域、要素关系和人地协调进行主题化收口', '经纬定位、气候地形河流、区域产业、读图综合', '图名图例不先读、要素分析漏自然或人文一侧'],
    政治: ['以大主题、时政情境和观点-材料-行动闭环复习', '国情、民主法治、文化生态、世界中国、青少年担当', '只抄材料、观点与行动不闭环、分值与要点数不匹配'],
  },
};

function createMiddleInsights(): SemesterSubjectInsight[] {
  return PERIODS.flatMap((period) => {
    const grade = period.slice(0, 3);
    const semester = period.slice(3);
    return MIDDLE_SUBJECTS.map((subject) => {
      const base = SUBJECT_BASE[subject];
      const [subjectCharacteristics, difficulties, mistakes] = PERIOD_FOCUS[period][subject];
      return normalizeInsight({
        stage: 'middle' as const,
        grade,
        semester,
        subject,
        agePsychology: PERIOD_CONTEXT[period].psychology,
        learningTraits: PERIOD_CONTEXT[period].learning,
        subjectCharacteristics,
        coreGoals: [`说清${difficulties.split('、').slice(0, 2).join('、')}的核心规则`, '能用章节小测和变式题验证迁移'],
        keyDifficulties: difficulties.split('、'),
        commonMistakes: mistakes.split('、'),
        bottlenecks: [base.rootCauses[0], base.rootCauses[1]],
        observablePhenomena: base.observablePhenomena,
        rootCauses: base.rootCauses,
        futureImpacts: SUBJECT_FUTURE_IMPACTS[subject],
        openingActions: base.openingActions,
        weeklyActions: base.weeklyActions,
        onionRecommendations: base.onionRecommendations,
      });
    });
  });
}

export const SEMESTER_SUBJECT_INSIGHTS: SemesterSubjectInsight[] = createMiddleInsights();

function createDepthStageInsights(
  stage: 'elementary' | 'high',
  grade: string,
  semester: string,
): SemesterSubjectInsight[] {
  const normalizedSemester = semester === '下学期' ? '下学期' : '上学期';
  const subjects = stage === 'elementary' ? (['语文', '数学', '英语'] as const) : HIGH_SUBJECTS;
  const stagePsychology = stage === 'elementary'
    ? ['对即时反馈和小目标更敏感，需要用可见的完成感建立主动性', '低年级依赖示范，高年级开始形成自我评价，家长应从催促转向提问和验收']
    : ['学业任务、同伴比较和升学压力叠加，需要明确优先级与可验收反馈', '高中生自主意识增强，笼统说教效果弱，具体数据和阶段目标更能促进调整'];
  const learningTraits = stage === 'elementary'
    ? ['识字阅读、计算建模、听说表达逐年递进，必须把会做升级为会讲依据', '习惯建议必须落到当前年级正在学习的知识和可检查动作']
    : ['知识密度和综合性上升，需要用单元测评区分概念、题型与执行问题', '选科和赋分关注校内排名与稳定性，不能只看一次卷面分数'];

  return subjects.map((subject) => {
    const modules = stage === 'elementary'
      ? ELEMENTARY_MODULES[grade]?.[subject as CoreStageSubject]?.[normalizedSemester]
      : HIGH_MODULES[subject as typeof HIGH_SUBJECTS[number]]?.[grade]?.[normalizedSemester];
    const base = stage === 'elementary'
      ? ELEMENTARY_DEPTH[subject as CoreStageSubject]
      : HIGH_DEPTH[subject as typeof HIGH_SUBJECTS[number]];
    const keyDifficulties = modules || ['当前教材章节核心概念', '从基础题到变式题的方法迁移'];
    return normalizeInsight({
      stage,
      grade,
      semester: normalizedSemester,
      subject,
      agePsychology: stagePsychology,
      learningTraits,
      subjectCharacteristics: `${grade}${normalizedSemester}${subject}的核心模块包括${keyDifficulties.join('、')}；具体顺序需按当地教材版本、学校进度和最近试卷核对。`,
      coreGoals: [`说清${keyDifficulties.slice(0, 2).join('、')}的核心概念和方法`, '用基础题、变式题和阶段测评验证迁移'],
      keyDifficulties,
      commonMistakes: base.commonMistakes,
      bottlenecks: base.rootCauses,
      observablePhenomena: base.observablePhenomena,
      rootCauses: base.rootCauses,
      futureImpacts: base.futureImpacts,
      openingActions: base.openingActions,
      weeklyActions: base.weeklyActions,
      onionRecommendations: base.onionRecommendations,
    });
  });
}

export function normalizeInsightGrade(grade: string): string {
  return grade
    .replace('初一', '七年级')
    .replace('初二', '八年级')
    .replace('初三', '九年级');
}

export function getSemesterSubjectInsights(
  stage: StageSlug,
  grade: string,
  semester: string,
): SemesterSubjectInsight[] {
  const normalizedGrade = normalizeInsightGrade(grade);
  if (stage === 'middle') {
    return SEMESTER_SUBJECT_INSIGHTS.filter((item) => (
      item.grade === normalizedGrade && item.semester === semester
    ));
  }
  if (!normalizedGrade || !semester) return [];
  return createDepthStageInsights(stage, normalizedGrade, semester);
}

export function getSemesterSubjectInsight(
  stage: StageSlug,
  grade: string,
  semester: string,
  subject: string,
): SemesterSubjectInsight | undefined {
  return getSemesterSubjectInsights(stage, grade, semester).find((item) => item.subject === subject);
}

export function inferCurrentSemester(date = new Date()): '上学期' | '下学期' {
  const month = date.getMonth() + 1;
  return month >= 2 && month <= 7 ? '下学期' : '上学期';
}

export function buildSemesterInsightPromptContext(
  stage: StageSlug,
  grade: string,
  semester: string,
  subjects: string[],
  date: Date = new Date(),
  options: { includePhaseActions?: boolean } = {},
): string {
  const normalizedSubjects = subjects.map((subject) => subject === '政治&道法' ? '政治' : subject);
  const insights = getSemesterSubjectInsights(stage, grade, semester)
    .filter((item) => normalizedSubjects.includes(item.subject));
  const timingContext = buildAcademicTimingPromptContext(date);
  if (insights.length === 0) return timingContext;
  const first = insights[0];
  const stageLinks = insights
    .flatMap((item) => item.crossSubjectImpacts)
    .filter((item, index, all) => all.findIndex((candidate) => (
      candidate.ability === item.ability
      && candidate.relatedSubjects.join('|') === item.relatedSubjects.join('|')
    )) === index)
    .slice(0, 4);
  return [
    timingContext,
    `当前学期：${normalizeInsightGrade(grade)}${semester}`,
    `年龄段心理：${first.agePsychology.join('；')}`,
    `学习节奏：${first.learningTraits.join('；')}`,
    `家长沟通边界：注意力=${first.parentGuidance.attention}；自主性=${first.parentGuidance.autonomy}；情绪压力=${first.parentGuidance.emotionAndStress}；监督边界=${first.parentGuidance.supervisionBoundary}；本阶段风险=${first.parentGuidance.commonRisk}`,
    ...insights.map((item) => {
      const phaseContext = options.includePhaseActions === false
        ? `阶段进度参考（仅用于判断背景，禁止原样输出多阶段行动）=${item.phaseFocuses.slice(0, 3).map((phase) => `${phase.label}[重点:${phase.learningFocus.join('、')}；不要提前:${phase.avoid}]`).join('；')}`
        : `五阶段任务（报告重点展开前三阶段）=${item.phaseFocuses.slice(0, 3).map((phase) => `${phase.label}[重点:${phase.learningFocus.join('、')}；动作:${phase.parentAction}；时长:${phase.duration}；检查:${phase.checkMethod}；有效:${phase.effectiveStandard}；不要:${phase.avoid}]`).join('；')}`;
      return [
        `${item.subject}：特点=${item.subjectCharacteristics}`,
        `核心目标=${item.coreGoals.join('、')}；核心模块=${item.keyDifficulties.slice(0, 5).join('、')}`,
        `常见错点=${item.commonMistakes.slice(0, 3).join('、')}`,
        `现象-根因-影响-验证链=${item.phenomenonCauseLinks.map((link) => `${link.phenomenon}→${link.cause}→${link.impact}→验证:${link.verification}`).join('；')}`,
        `后续影响=${item.futureImpacts.slice(0, 3).join('、')}`,
        phaseContext,
      ].join('；');
    }),
    `跨学科影响：${stageLinks.map((link) => `${link.ability}影响${link.relatedSubjects.join('、')}：${link.mechanism}；家长现象=${link.observablePhenomenon}；验证动作=${link.parentAction}`).join('\n')}`,
  ].join('\n');
}
