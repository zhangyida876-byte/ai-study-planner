import type { StageSlug } from '@client/src/config/stages';

export interface SemesterSubjectInsight {
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
  openingActions: string[];
  weeklyActions: string[];
  onionRecommendations: string[];
}

type SubjectSeed = Omit<SemesterSubjectInsight, 'stage' | 'grade' | 'semester' | 'agePsychology' | 'learningTraits'>;

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

const SUBJECT_BASE: Record<typeof MIDDLE_SUBJECTS[number], Omit<SubjectSeed, 'subjectCharacteristics' | 'coreGoals' | 'keyDifficulties' | 'commonMistakes' | 'bottlenecks'>> = {
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
      return {
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
        openingActions: base.openingActions,
        weeklyActions: base.weeklyActions,
        onionRecommendations: base.onionRecommendations,
      };
    });
  });
}

export const SEMESTER_SUBJECT_INSIGHTS: SemesterSubjectInsight[] = createMiddleInsights();

function createBasicStageInsights(
  stage: Exclude<StageSlug, 'middle'>,
  grade: string,
  semester: string,
): SemesterSubjectInsight[] {
  const subjects = stage === 'elementary'
    ? ['语文', '数学', '英语'] as const
    : MIDDLE_SUBJECTS;
  const stagePsychology = stage === 'elementary'
    ? ['对即时反馈和小目标更敏感，需要用可见的完成感建立主动性']
    : ['学业任务、同伴比较和升学压力叠加，需要明确优先级与可验收反馈'];
  const learningTraits = stage === 'elementary'
    ? ['先建立阅读、计算、表达和当日复盘的基础动作']
    : ['知识密度和综合性上升，需要用单元测评区分概念、题型与执行问题'];

  return subjects.map((subject) => {
    const base = SUBJECT_BASE[subject];
    return {
      stage,
      grade,
      semester,
      subject,
      agePsychology: stagePsychology,
      learningTraits,
      subjectCharacteristics: `${grade}${semester}的${subject}需按当地教材版本和学校进度核对，先用最近作业、试卷与章节目录定位当前卡点。`,
      coreGoals: ['说清当前单元的核心概念和方法', '用基础题与变式题验证能否迁移'],
      keyDifficulties: ['当前教材章节的核心概念', '从例题到变式题的方法迁移'],
      commonMistakes: base.commonMistakes,
      bottlenecks: base.rootCauses,
      observablePhenomena: base.observablePhenomena,
      rootCauses: base.rootCauses,
      openingActions: base.openingActions,
      weeklyActions: base.weeklyActions,
      onionRecommendations: base.onionRecommendations,
    };
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
  return createBasicStageInsights(stage, normalizedGrade, semester);
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
): string {
  const insights = getSemesterSubjectInsights(stage, grade, semester)
    .filter((item) => subjects.includes(item.subject));
  if (insights.length === 0) return '';
  const first = insights[0];
  return [
    `当前学期：${normalizeInsightGrade(grade)}${semester}`,
    `年龄段心理：${first.agePsychology.join('；')}`,
    `学习节奏：${first.learningTraits.join('；')}`,
    ...insights.map((item) => `${item.subject}：特点=${item.subjectCharacteristics}；重难点=${item.keyDifficulties.slice(0, 4).join('、')}；常见错点=${item.commonMistakes.join('、')}`),
  ].join('\n');
}
