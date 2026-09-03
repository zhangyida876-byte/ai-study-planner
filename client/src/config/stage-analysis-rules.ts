import type { StageSlug } from '@client/src/config/stages';
import type { StageProfile } from '@client/src/types/stage-profile';
import { formatProfileRegion } from '@client/src/types/stage-profile';

/**
 * 学段差异化分析补充规则（追加到现有插件 prompt，不覆盖服务端能力配置）
 */
const STAGE_RULES: Record<StageSlug, string> = {
  elementary: `【小学学段分析补充规则】
- 仅围绕「小学学习能力建设 + 小升初政策 + 小升初目标学校」，禁止输出中考/高考主导向内容（长期影响可简要说明）。
- 小升初：联网查询划片、摇号、民办招生、对口直升、特色班等；无公开分数线须写明「不公开分数线」并改述招生方式/录取条件。
- 学情诊断必须逐科使用本地教研上下文。语文具体到拼音/字词、句子理解、阅读、看图写话或作文、古诗文、审题表达；数学具体到计算、数感、应用题读题、图形几何、单位换算、分数/小数/百分数、方程思维和小升初衔接；英语具体到自然拼读、单词记忆、课文朗读、句型、听力、语法启蒙和阅读。
- 行动建议必须先判定当前日期、年级、学期和常规教学进度。低年级不得提前安排高年级应用题和复杂作文；三四年级优先计算/数感/读题/表达；五六年级优先分数、小数、百分数、方程启蒙和小升初衔接。若学校进度不确定，须写“按常规校历推测，需用学校课表/教材目录/最近作业核实”。
- 每个已填科目必须点名当前年级和学期正在学习的至少2个模块，写出家长可观察现象、根因、后续影响和验证方法；详细执行只在报告第5节输出未来7天动作。禁止只写“培养习惯、打好基础”。
- 知识点须说明：年级章节、前置知识、对后续小学及小升初衔接的影响；禁止高中式专业/就业/薪资分析。
- 输出须标注：学段、姓名、地区、年级、目标初中、数据来源、适用年份；禁止「多刷题/加强基础」等空泛表述。`,

  middle: `【初中学段分析补充规则】
- 仅围绕「中考目标 + 中考政策 + 目标高中 + 初高中衔接」，禁止小学式或纯泛化建议。
- 政策只核验与当前目标差距直接相关的总分口径、学校分数线和年份；无可靠数据时写“待核实”。
- 目标高中：已填目标则只拆差距和优先科目；未填时只给本地普高与重点高中各1个初步参照，不展开志愿政策科普。
- 学情诊断：必须结合年龄段心理、当前学期重难点和家长可观察现象；单科保留3个问题，多科按每个已填科目至少2个问题展开并补充1个跨科共性问题，禁止遗漏科目。
- 行动建议必须先判定当前日期、年级、学期和常规教学进度。七年级开学初不得默认中考压轴题；八年级按几何、函数初步、物理入门等阶段展开；九年级按新课收尾/中考总复习/化学起步等节点展开。若学校进度不确定，须写“按常规校历推测，需用学校课表/教材目录/最近作业核实”。
- 知识点关联：向前追溯小学根源 → 当前中考定位 → 向后影响高中具体知识点（函数/方程/英语语法/理化等）。
- 输出须标注数据来源与年份；禁止编造分数线/排名/薪资。`,

  high: `【高中学段分析补充规则】
- 仅围绕「高考目标 + 目标院校 + 专业选择 + 就业前景」，须与录取/选科/专业关联。
- 禁止把中考策略当作主体输出；如需追因，只能简要回溯「初中哪些知识薄弱导致当前问题」。
- 政策：3+3 或 3+1+2、赋分规则、批次、专业组、选科限制；联网交叉验证。
- 目标院校：有目标时核验录取口径和差距；未填时只给层级初步判断与待补信息。
- 专业建议：区分“能报、适合、有竞争力”，不输出未核实的薪资和就业率。
- 学情诊断必须逐科使用本地教研上下文并点名当前模块：语文覆盖现代文、文言文、古诗、作文和语言运用；数学覆盖函数、三角、数列、立体几何、解析几何、概率统计、导数；英语覆盖词汇、语法填空、阅读、完形、七选五、应用文和读后续写；物理覆盖运动学、牛顿定律、功能关系、电磁场、电路、实验与模型；化学覆盖结构、反应原理、有机、实验和工艺流程；生物覆盖细胞代谢、遗传、稳态、生态和实验；史政地覆盖材料阅读、概念、时空定位、学科术语和综合分析。
- 行动建议必须先判定当前日期、年级、学期和常规教学进度。高一上开学初数学优先集合、常用逻辑用语和初高中数学语言转换，不得直接安排函数单调性综合；物理优先运动描述、速度、加速度和匀变速直线运动，不得默认实验大题；化学优先物质的量、离子反应和氧化还原；英语优先词汇、长难句、阅读速度和课文输入。若学校进度不确定，须写“按常规校历推测，需用学校课表/教材目录/最近作业核实”。
- 每个已填科目至少点名2个与当前年级/学期匹配的模块或题型，写清高考能力要求、家长可观察现象、深层根因、后续模块影响和可验证动作。禁止只写“高考压力大、提高综合能力”。
- 距目标院校分差、各科提分效率、选科风险与专业方向必须区分“能报、适合、有竞争力”；单科薄弱不能直接推导“不能报某专业”。
- 输出须标注数据来源与年份；禁止编造政策/分数线/薪资。`,
};

const STAGE_INTERPRETATION_RULE = `【阶段学情解读通用规则】
- 必须使用结构化教研上下文中的当前学期主题、阶段进度参考、现象-根因-影响-验证链和跨学科关联，不得自行用整册目录替代。
- 每科按“当前内容、核心目标、具体重难点、高频错法、常见卡点、家长现象、深层原因、后续影响”展开。
- 年龄段分析必须覆盖注意力、自主性、情绪压力、监督接受度和家长沟通边界，并说明家长最容易误判的表现。
- 第4节仅解释阶段背景、各科影响、跨学科关联和目标影响；结构化阶段资料只用于判断当前进度，不得在第4节展开开学前/第一周/第一个月行动表。
- 全报告的详细家长动作只能出现在第5节“未来7天”，必须写明时长、检查方法、有效标准和不建议做什么；不得另增30/60/90天或第一周/第一个月计划。
- “打好基础、加强练习、培养习惯、提高能力、查漏补缺”不得单独作为结论，后面必须紧跟知识点、题型和验收动作。`;

export function getStageAnalysisAppendix(stageSlug: StageSlug): string {
  return STAGE_RULES[stageSlug];
}

/** 将学段档案摘要追加到 AI 请求上下文（不替换原有 build* 逻辑） */
export function appendProfileAndStageRules(
  basePrompt: string,
  stageSlug: StageSlug,
  profile?: Partial<StageProfile> | null,
): string {
  const parts = [basePrompt];

  if (profile) {
    const region = formatProfileRegion(profile as StageProfile);
    const lines = [
      profile.studentName ? `学生姓名：${profile.studentName}` : '',
      region ? `地区：${region}` : '',
      profile.grade ? `年级：${profile.grade}` : '',
      profile.schoolSystem ? `学制：${profile.schoolSystem === '5-4' ? '五四制' : '六三制'}` : '',
      profile.school ? `当前学校：${profile.school}` : '',
      profile.targetSchool ? `目标学校/院校：${profile.targetSchool}` : '',
      profile.targetMajor ? `目标专业：${profile.targetMajor}` : '',
      profile.careerIntent ? `未来意向方向：${profile.careerIntent}` : '',
      profile.examDate ? `目标考试时间：${profile.examDate}` : '',
      profile.scoresOverview ? `当前成绩概览：${profile.scoresOverview}` : '',
      profile.weakSubjects ? `薄弱科目：${profile.weakSubjects}` : '',
      profile.strongSubjects ? `优势科目：${profile.strongSubjects}` : '',
      profile.weeklyStudyHours ? `每周可支配学习时间：${profile.weeklyStudyHours}小时` : '',
      profile.boardingType === 'day' ? '走读' : profile.boardingType === 'boarding' ? '住读' : '',
      profile.examMode ? `高考模式：${profile.examMode}` : '',
    ].filter(Boolean);
    if (lines.length > 0) {
      parts.push(`\n【学段主页学生档案（自动带入）】\n${lines.join('\n')}`);
    }
  }

  parts.push(`\n${getStageAnalysisAppendix(stageSlug)}\n\n${STAGE_INTERPRETATION_RULE}`);
  parts.push(`\n【数据准确性】至少两来源交叉验证；官方优先；无法确认须写「暂无官方确认信息」；禁止编造。`);

  return parts.join('\n');
}
