import type { StageSlug } from './stages';
import { resolveAcademicTiming, type AcademicPhaseId } from '../utils/academic-phase';
import { normalizeInsightGrade } from './semester-subject-insights';

export interface TeachingProgressRule {
  stage: StageSlug;
  grade: string;
  semester: '上学期' | '下学期';
  phase: AcademicPhaseId;
  subject: string;
  currentContent: string[];
  doNotAdvance: string[];
  keyDifficulties: string[];
  commonMistakes: string[];
  observablePhenomena: string[];
  rootCauses: string[];
  actions: string[];
}

interface ProgressSeed {
  opening: string[];
  firstMonth: string[];
  later: string[];
  difficulty: string[];
  mistakes: string[];
  observable: string[];
  causes: string[];
  actions: string[];
}

const seed = (
  opening: string[], firstMonth: string[], later: string[],
  difficulty: string[], mistakes: string[], observable: string[], causes: string[], actions: string[],
): ProgressSeed => ({ opening, firstMonth, later, difficulty, mistakes, observable, causes, actions });

const COMMON_LANGUAGE = seed(
  ['上学期基础能力恢复', '新学期第一单元课文与表达任务'],
  ['第一单元阅读方法', '字词、语句与表达训练'],
  ['学期后半段综合阅读与整篇写作'],
  ['从文本证据组织答案', '把口头表达转成书面结构'],
  ['只抄原句不回应题目', '作文有内容但顺序和重点不清'],
  ['课文能读完却说不清主要内容', '写了很多但得分点少'],
  ['没有形成题干、证据、表达的固定步骤'],
  ['用一篇当前课文练题干圈词和证据定位', '先口述提纲再写一个完整段落'],
);

const COMMON_ENGLISH = seed(
  ['旧词汇和基础句型恢复', '新学期第一单元词汇与课文输入'],
  ['第一单元词汇、句型和短篇阅读'],
  ['学期后续复杂语法、长篇阅读和综合写作'],
  ['词汇在句中的识别', '句子主干和语境理解'],
  ['只记中文词义', '朗读流利但不理解句子结构'],
  ['单词背过，放进课文就认不出', '听懂课文，换个表达就卡'],
  ['词音、词形、词义和语境没有建立双向联系'],
  ['每天听读当前课文10分钟并圈出不懂句', '抽查10个词的听说读写和句中用法'],
);

const PROGRESS_SEEDS: Record<string, ProgressSeed> = {
  'elementary-low:语文': seed(['拼音/字词复现', '新课短句朗读'], ['识字、句子理解和看图说话'], ['复杂阅读概括和整篇作文'], ['字音字形对应', '完整说清一句话'], ['依赖猜读', '句子成分遗漏'], ['读得慢、漏字或串行', '看图只说零散词语'], ['识字自动化和口语组织尚未稳定'], ['每天10分钟指读与听写', '看图按谁、哪里、做什么说3句']),
  'elementary-low:数学': seed(['20/100以内数感和口算恢复', '新学期第一单元基础运算'], ['进退位计算、数量关系和基础图形'], ['多步应用题、复杂单位换算和高年级分数'], ['理解加减乘除意义', '口算与书写步骤稳定'], ['数位对不齐', '见关键词机械列式'], ['口算会但写竖式频繁错位', '应用题不知道求什么'], ['数感和数量关系没有同步建立'], ['每天10分钟分层口算', '每天讲1道题的已知、所求和算式理由']),
  'elementary-low:英语': COMMON_ENGLISH,
  'elementary-mid:语文': COMMON_LANGUAGE,
  'elementary-mid:数学': seed(['乘除法、单位和数感恢复', '新学期第一单元计算规则'], ['多位数运算、面积周长/小数初步、两步应用题'], ['分数百分数、复杂方程和小升初综合题'], ['运算顺序', '把文字条件转成数量关系'], ['漏单位', '只找关键词不分析关系'], ['计算会做但应用题列不出式', '换个问法就不会'], ['计算规则和建模语言没有连起来'], ['每天10分钟计算错因记录', '每天讲1道应用题先算什么、为什么']),
  'elementary-mid:英语': COMMON_ENGLISH,
  'elementary-high:语文': COMMON_LANGUAGE,
  'elementary-high:数学': seed(['小数/分数基础与计算手感恢复', '新学期第一单元概念'], ['分数、小数、百分数、简易方程或比例基础'], ['小升初跨章节综合题和竞赛难题'], ['分数意义与数量关系', '方程语言启蒙'], ['通分约分条件错', '列方程时等量关系不清'], ['基础计算能做，综合应用题卡在列式', '题目读懂却找不到等量关系'], ['概念表征和数量模型未形成'], ['每天15分钟计算与1道建模讲题', '用5道第一单元基础题核对概念']),
  'elementary-high:英语': COMMON_ENGLISH,

  'middle-七年级:语文': COMMON_LANGUAGE,
  'middle-七年级:数学': seed(['小学运算与符号语言衔接', '有理数/代数语言起始内容'], ['有理数运算、整式或一元一次方程前置'], ['中考压轴题、二次函数和综合几何'], ['负数、数轴、符号与运算规则', '从算术语言转向代数语言'], ['符号漏写', '运算顺序和去括号错误'], ['小学计算不错，遇到字母和负号就乱', '例题听懂，独立写步骤就丢符号'], ['符号规则没有形成可复述的步骤'], ['每天15分钟有理数/代数基础判断', '让孩子口述每一步符号依据']),
  'middle-七年级:英语': COMMON_ENGLISH,
  'middle-七年级:生物': seed(['显微观察和生物基本特征', '第一单元观察方法'], ['细胞结构或生物与环境基础'], ['遗传、稳态和综合实验题'], ['图像结构与功能对应', '观察证据表达'], ['只背名词不看图', '实验步骤与目的脱节'], ['名词背了，换张图就认不出'], ['结构、功能和证据没有形成联系'], ['每天看1张教材图并口述结构功能', '按目的、步骤、现象复述1个观察活动']),
  'middle-七年级:历史': COMMON_LANGUAGE,
  'middle-七年级:地理': seed(['地图三要素和空间定位', '第一章地球/地图基础'], ['经纬网、地形图或区域定位'], ['区域综合与中考材料题'], ['把图例、方向、比例尺转成空间判断'], ['只看文字不读图', '经纬度方向混淆'], ['背了结论，换张图不会定位'], ['读图步骤没有固定'], ['每天读1张教材图并按位置、要素、结论口述']),
  'middle-八年级:语文': COMMON_LANGUAGE,
  'middle-八年级:数学': seed(['七年级代数与几何基础复现', '全等三角形/轴对称等起始模块'], ['几何证明、整式运算或函数初步'], ['中考压轴综合和二次函数'], ['证明依据和书写链条', '数形转换'], ['条件漏用', '会看图但不会写理由'], ['图形看懂，证明过程写不完整'], ['定义、判定和推理语言没有连成链'], ['每天完成2道基础证明并标注依据', '用错题核对条件是否全部使用']),
  'middle-八年级:英语': COMMON_ENGLISH,
  'middle-八年级:物理': seed(['测量、运动描述和物理量语言', '机械运动/声光等起始模块'], ['速度、图像、测量或第一批物理模型'], ['电学综合、实验大题和中考压轴'], ['物理量、单位和生活现象互译', '由条件选择公式'], ['单位不统一', '只背公式不解释情境'], ['公式会背，换个生活场景就不会'], ['现象、模型、公式没有建立对应'], ['每天用1个生活现象解释概念', '完成5道单位与基础模型判断']),
  'middle-九年级:数学': seed(['八年级函数与几何漏洞复盘', '九上第一单元新课'], ['二次函数/一元二次方程或旋转等校内进度'], ['全真中考压轴与跨模块套卷'], ['旧知识与新模型衔接', '稳定基础中档题'], ['未核实范围就盲刷整卷', '旧漏洞混入新课'], ['新课听懂但旧代数/几何步骤反复错'], ['前置知识没有在新课前补齐'], ['用最近试卷锁定2个前置漏洞', '同步完成第一单元基础题并复述方法']),
  'middle-九年级:英语': COMMON_ENGLISH,
  'middle-九年级:物理': seed(['八年级力学/声光热基础复盘', '九上第一模块'], ['校内当前电学或力学新课'], ['中考综合模型和全真套卷'], ['前置模型迁移', '新课公式适用条件'], ['旧模型混用', '只做综合题不补概念'], ['综合题卡住但说不清是哪一步'], ['前置模型边界不清'], ['先用章节小测定位旧漏洞', '按学校第一单元做概念和典型题闭环']),
  'middle-九年级:化学': seed(['元素符号、实验安全和物质观察', '化学入门第一单元'], ['走进化学世界、空气/氧气等起始模块'], ['酸碱盐、工艺流程和中考综合实验'], ['宏观现象、微观粒子和符号表达'], ['实验现象与结论混写', '化学用语不规范'], ['现象能说，符号和结论写不准'], ['三重表征尚未建立'], ['每天整理5个化学符号', '按条件、现象、结论复述1个入门实验']),

  'high-高一:语文': seed(['初高中阅读与表达标准转换', '第一单元现代文/诗歌与语言任务'], ['现代文证据提取、文言基础和议论文表达启蒙'], ['高考整套阅读、复杂文言综合和考场作文押题'], ['从概括内容升级为证据化表达', '作文观点和材料对应'], ['答案脱离文本', '作文只有态度没有论证'], ['阅读写很多但得分点少', '作文素材不少却不会围绕观点组织'], ['初中答题经验没有升级为高中证据链'], ['精读当前课文并标出观点与证据', '每天完成1个议论段的观点-理由-例子']),
  'high-高一:数学': seed(['集合的表示与元素关系', '交并补运算', '常用逻辑用语与初高中数学语言转换'], ['集合与逻辑用语', '函数概念的前置语言和表示'], ['函数单调性综合、指数对数、三角函数和压轴综合'], ['属于与包含的区别', '符号、自然语言和图示互译'], ['把元素关系写成集合关系', '交并补边界漏判'], ['小学初中计算不错，遇到集合符号就写乱', '题目会读但无法准确改写条件'], ['高中符号语言和集合边界尚未形成'], ['每天10分钟口述属于/包含/交/并/补的区别', '做5道基础判断题，正确率达到80%再推进']),
  'high-高一:英语': seed(['初高中词汇量和句长差异适应', '第一单元词汇、课文和句子主干'], ['核心词汇语境、长难句主干和阅读定位'], ['高考套卷、读后续写和复杂语法综合'], ['词汇在语境中的多义', '句子主干和修饰关系'], ['只背词表', '逐词翻译长句'], ['单词认识，整句仍读不懂', '课文跟得上，阅读速度明显变慢'], ['词汇深度和句法切分未同步升级'], ['每天15分钟精读课文2个长句', '抽查10个新词的搭配和句中含义']),
  'high-高一:物理': seed(['质点、参考系、位移和时间', '速度、加速度与运动描述'], ['匀变速直线运动、图像和基础运动模型'], ['实验大题、功能综合、电磁综合和高考压轴'], ['矢量与标量', '图像斜率和物理意义'], ['路程位移混淆', '公式会背但单位和条件不核对'], ['概念能背，换个参考系或图像就判断错'], ['运动情境、物理量和图像尚未建立对应'], ['每天用生活情境解释1组概念', '做5道运动描述/图像基础判断并说明依据']),
  'high-高一:化学': seed(['物质分类与实验安全', '物质的量前置、离子反应/氧化还原起始概念'], ['物质的量、离子反应和氧化还原基础'], ['高考工艺流程、反应原理综合和有机推断'], ['宏观、微观与符号三重表征', '守恒关系'], ['方程式条件和电荷漏检', '把记忆结论当理解'], ['化学式会写，涉及粒子和量就乱'], ['初中宏观描述没有升级到微观和定量语言'], ['先复核化学用语和守恒', '每天做5道物质分类/离子反应基础判断']),
  'high-高一:生物': seed(['细胞结构和生命系统层次', '显微观察与结构功能'], ['细胞结构、物质运输和酶/代谢基础'], ['遗传综合、稳态调节和高考实验设计'], ['结构与功能对应', '图表证据提取'], ['只背名词不看限定条件', '图像标签混淆'], ['教材背熟，换一张细胞图就不会'], ['知识没有形成结构-功能-证据链'], ['每天重画1张细胞结构图并口述功能', '做3道图表信息提取题']),
  'high-高一:历史': seed(['中外历史纲要时空框架', '第一单元史实与制度线索'], ['古代至近代时空主线和材料概括'], ['高考跨时期比较与综合论证'], ['史实放回时间空间', '材料词转教材观点'], ['只背事件不建因果', '材料概括照抄'], ['知识背了，材料题仍不知道调用哪段史实'], ['时间轴和因果链没有形成'], ['画第一单元时间轴', '每天做1道材料词-教材词转换']),
  'high-高一:地理': seed(['地球与地图基础', '地球运动/大气等第一模块'], ['地球运动、大气水循环和基础读图'], ['区域综合、产业区位和高考综合题'], ['空间定位', '自然要素因果链'], ['只背结论不读图', '因果方向颠倒'], ['背了规律，换图不会解释'], ['空间证据和因果步骤不稳定'], ['每天读1张教材图并口述位置-要素-结论']),
  'high-高一:政治': seed(['高中政治概念语言适应', '第一模块核心概念与材料'], ['中国特色社会主义/经济社会等校内起始模块'], ['高考综合材料、时政大题和主观题模板'], ['概念边界', '材料主体与观点匹配'], ['观点堆砌', '主体权限混用'], ['知识点背了，材料题不知道选哪个'], ['概念条件和材料情境没有建立对应'], ['每天用1则课内材料练主体-观点-依据']),

  'high-高二:数学': seed(['高一函数、三角和向量基础复现', '校内高二第一模块'], ['数列/空间向量/解析几何等学校当前模块'], ['导数压轴、圆锥曲线综合和高考套卷'], ['前置函数语言', '代数与图形互译'], ['公式套用不核条件', '运算链过长失稳'], ['章节基础题会做，综合题无法拆步骤'], ['模块间迁移方法没有形成'], ['用学校目录确认第一章', '每天完成5道当前模块基础题并复述条件']),
  'high-高二:物理': seed(['高一运动与力/能量模型复现', '校内高二第一模块'], ['电场/磁场/电路等学校当前模块'], ['高考电磁综合和实验大题'], ['模型边界', '图像与能量关系'], ['旧模型混用', '只列公式不说明过程'], ['公式很多，不知道当前题先选哪个模型'], ['受力、过程和能量链未结构化'], ['用学校目录确认当前章', '每天按对象-过程-规律复述2题']),
  'high-高三:数学': seed(['一轮复习校内起始模块', '最近模考失分证据'], ['一轮复习当前专题和基础中档题稳定'], ['未到校内轮次的压轴专题和无序套卷'], ['按考点回补前置漏洞', '限时稳定性'], ['盲目刷整卷', '只看分数不分错因'], ['每天很忙，同类错误仍反复'], ['复习任务没有按错因和得分价值排序'], ['以学校一轮目录为准', '每天只追1个考点并用变式题验收']),
};

function getGroupKey(stage: StageSlug, grade: string): string {
  const normalized = normalizeInsightGrade(grade);
  if (stage === 'elementary') {
    if (/^[一二]年级$/u.test(normalized)) return 'elementary-low';
    if (/^[三四]年级$/u.test(normalized)) return 'elementary-mid';
    return 'elementary-high';
  }
  return `${stage}-${normalized}`;
}

function phaseContent(seedValue: ProgressSeed, phase: AcademicPhaseId): string[] {
  if (/opening|break/u.test(phase)) return seedValue.opening;
  if (/monthly/u.test(phase)) return seedValue.firstMonth;
  if (/midterm/u.test(phase)) return [...seedValue.opening, ...seedValue.firstMonth].slice(0, 4);
  return ['按学校复习范围整合本学期已学内容', '回炉月考、期中反复错题'];
}

export function getTeachingProgressRule(options: {
  stage: StageSlug;
  grade: string;
  semester: '上学期' | '下学期';
  subject: string;
  date?: Date;
}): TeachingProgressRule {
  const timing = resolveAcademicTiming(options.date);
  const groupKey = getGroupKey(options.stage, options.grade);
  const seedValue = PROGRESS_SEEDS[`${groupKey}:${options.subject}`]
    || (options.subject === '语文' ? COMMON_LANGUAGE : options.subject === '英语' ? COMMON_ENGLISH : undefined)
    || seed(
      ['上一阶段基础恢复', '教材第一单元前置知识'],
      ['学校当前第一单元核心概念和基础题型'],
      ['未确认进度的后续综合题和压轴题'],
      ['概念条件和方法步骤'], ['未核实范围就提前刷题'],
      ['作业能完成，换个问法就卡'], ['当前章节和前置知识尚未用作业核实'],
      ['先核对教材目录和最近作业', '每天完成5道当前基础题并口述依据'],
    );
  return {
    stage: options.stage,
    grade: normalizeInsightGrade(options.grade),
    semester: options.semester,
    phase: timing.id,
    subject: options.subject,
    currentContent: phaseContent(seedValue, timing.id),
    doNotAdvance: /opening|break|monthly/u.test(timing.id) ? seedValue.later : ['学校尚未明确纳入范围的专题'],
    keyDifficulties: seedValue.difficulty,
    commonMistakes: seedValue.mistakes,
    observablePhenomena: seedValue.observable,
    rootCauses: seedValue.causes,
    actions: seedValue.actions,
  };
}

export function buildTeachingProgressPromptContext(options: {
  stage: StageSlug;
  grade: string;
  semester: '上学期' | '下学期';
  subjects: string[];
  date?: Date;
}): string {
  const timing = resolveAcademicTiming(options.date);
  const rules = options.subjects.map((subject) => getTeachingProgressRule({ ...options, subject }));
  return [
    `当前日期/学期阶段判断：${timing.queryDate}，${timing.phaseLabel}，${options.semester}。`,
    `最近关键节点：${timing.nearestAssessment}。`,
    '进度可信度：按常规校历推测，必须用学校课表、教材目录、最近作业或考试通知核实；用户明确进度时以用户信息为准。',
    ...rules.map((rule) => [
      `${rule.subject}当前通常学习/准备：${rule.currentContent.join('、')}`,
      `${rule.subject}现在不应提前安排：${rule.doNotAdvance.join('、')}`,
      `${rule.subject}本阶段重难点：${rule.keyDifficulties.join('、')}`,
      `${rule.subject}易错与家长现象：${rule.commonMistakes.join('、')}；${rule.observablePhenomena.join('、')}`,
      `${rule.subject}可能根因：${rule.rootCauses.join('、')}`,
      `${rule.subject}现在可执行：${rule.actions.join('、')}；原因=服务当前第一单元和最近关键考试，而非提前刷后续综合题。`,
    ].join('\n')),
  ].join('\n');
}
