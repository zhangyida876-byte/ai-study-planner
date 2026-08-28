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
- 学情诊断聚焦：语文识字阅读作文、数学计算应用题、英语词汇语法、学习习惯（专注/作业/错题/复习）。
- 知识点须说明：年级章节、前置知识、对后续小学及小升初衔接的影响；禁止高中式专业/就业/薪资分析。
- 输出须标注：学段、姓名、地区、年级、目标初中、数据来源、适用年份；禁止「多刷题/加强基础」等空泛表述。`,

  middle: `【初中学段分析补充规则】
- 仅围绕「中考目标 + 中考政策 + 目标高中 + 初高中衔接」，禁止小学式或纯泛化建议。
- 政策只核验与当前目标差距直接相关的总分口径、学校分数线和年份；无可靠数据时写“待核实”。
- 目标高中：已填目标则只拆差距和优先科目；未填时只给本地普高与重点高中各1个初步参照，不展开志愿政策科普。
- 学情诊断：必须结合年龄段心理、当前学期重难点和家长可观察现象，只保留3个优先问题。
- 知识点关联：向前追溯小学根源 → 当前中考定位 → 向后影响高中具体知识点（函数/方程/英语语法/理化等）。
- 输出须标注数据来源与年份；禁止编造分数线/排名/薪资。`,

  high: `【高中学段分析补充规则】
- 仅围绕「高考目标 + 目标院校 + 专业选择 + 就业前景」，须与录取/选科/专业关联。
- 禁止把中考策略当作主体输出；如需追因，只能简要回溯「初中哪些知识薄弱导致当前问题」。
- 政策：3+3 或 3+1+2、赋分规则、批次、专业组、选科限制；联网交叉验证。
- 目标院校：有目标时核验录取口径和差距；未填时只给层级初步判断与待补信息。
- 专业建议：区分“能报、适合、有竞争力”，不输出未核实的薪资和就业率。
- 学情诊断：距目标院校分差、各科提分效率、选科风险、限制专业的薄弱点。
- 输出须标注数据来源与年份；禁止编造政策/分数线/薪资。`,
};

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

  parts.push(`\n${getStageAnalysisAppendix(stageSlug)}`);
  parts.push(`\n【数据准确性】至少两来源交叉验证；官方优先；无法确认须写「暂无官方确认信息」；禁止编造。`);

  return parts.join('\n');
}
