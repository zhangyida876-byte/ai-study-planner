import type { StageSlug } from '@client/src/config/stages';
import { resolveAcademicTiming } from './academic-phase';

interface DiagnosisConcernContextInput {
  stage: StageSlug;
  grade: string;
  concern?: string;
  scores: Record<string, number>;
  maxValues?: Record<string, number>;
  date?: Date;
}

const RESISTANCE_PATTERN = /(?:不想学|逃避|没兴趣|没有兴趣|抗拒|一提.{0,6}(?:就烦|就躲|就吵)|厌学|拖延|不愿(?:意)?学|放弃|学也没用)/u;
const PROGRESS_EVIDENCE_PATTERN = /(?:正在学|目前学到|当前章节|最近作业|近期作业|考试范围|老师说考|课本第|单元测|试卷范围)/u;

function resolveConcernSubjects(concern: string, subjects: string[]): string[] {
  const mentioned = subjects.filter((subject) => concern.includes(subject));
  if (mentioned.length > 0) return mentioned;
  return subjects.length === 1 ? subjects : [];
}

function buildResistanceActions(stage: StageSlug): string[] {
  if (stage === 'elementary') {
    return [
      '第1-2天：每次8-12分钟，只做2道孩子大概率能独立完成的基础题，先恢复“我能做”的体验',
      '第3-4天：保留2道基础题，再加入1道同类变式；卡住时只提示第一步，不直接报答案',
      '第5-7天：让孩子用一句话说清“哪里会、哪里卡、下次先做什么”，再记录1个错因',
    ];
  }
  if (stage === 'high') {
    return [
      '第1-2天：由学生从当前章节里自选2道能完成的基础题，每次20分钟以内，先恢复可控感',
      '第3-4天：加入1道同类变式，让学生自己决定先补概念还是先看例题，家长不越过边界代替安排',
      '第5-7天：按“概念、模型、运算、审题”归类1个错因，并由学生提出下一周最小目标',
    ];
  }
  return [
    '第1-2天：只做2道孩子能做出来的当前进度基础题，每次15-20分钟，先恢复“我能做”的正反馈',
    '第3-4天：在2道基础题后加入1道同类变式，不追题量，只检查能否说出第一步依据',
    '第5-7天：再开始整理错因，按“概念、步骤、计算、审题”只记录当天最关键的1类',
  ];
}

function stageCommunicationBoundary(stage: StageSlug): string {
  if (stage === 'elementary') return '家长以陪同启动和及时肯定为主，不用“懒、笨、粗心”给孩子定性，也不拿同学比较。';
  if (stage === 'high') return '家长要保留学生的选择权，只核对目标和证据，不用高频监督把学科抵触升级成亲子对抗。';
  return '家长只检查过程，不讽刺、不催促、不比较；只问“哪一步你能讲出来、从哪一步开始卡、下一题准备先做什么”。';
}

export function buildDiagnosisConcernPromptContext(input: DiagnosisConcernContextInput): string {
  const concern = input.concern?.trim();
  if (!concern) return '';

  const timing = resolveAcademicTiming(input.date);
  const subjects = Object.keys(input.scores);
  const concernSubjects = resolveConcernSubjects(concern, subjects);
  const hasResistance = RESISTANCE_PATTERN.test(concern);
  const hasProgressEvidence = PROGRESS_EVIDENCE_PATTERN.test(concern);
  const subjectScope = concernSubjects.length > 0
    ? concernSubjects.join('、')
    : '未能从原话中确认具体科目，必须先追问，不得擅自套到全部已填科目';

  const lines = [
    `用户补充原话（最高优先级证据）：${concern}`,
    `关联科目判断：${subjectScope}。`,
    `进度证据判断：${hasProgressEvidence ? '原话包含章节、作业或考试范围线索，必须优先于系统默认进度逐字使用。' : '原话未提供可确认的学校进度；具体知识点只能写“按常规进度推测”，并要求用课本目录、近期作业或学校课表核实。'}`,
    '强制使用规则：第1节前两句话必须回应这条原话；第2节至少出现1个与原话对应的可观察现象；第3节解释并验证原因；第4-5节说明它在最近节点的现实后果；第6节据此调整动作；第7节的问诊、风险和产品话术必须再次回应。禁止只把原话抄在背景里。',
  ];

  if (!hasResistance) {
    lines.push('该补充信息未触发学习阻抗规则，但仍必须作为高于通用教研内容的个体证据处理。');
    return lines.join('\n');
  }

  lines.push(
    '已触发学习动力/心理阻抗分析：不得把孩子简单归因为懒、没上进心或态度差，也不得做临床心理诊断。',
    '必须同时检验两条因果方向：A. 前置知识断层或连续失败导致“不想学”；B. 回避、拖延和练习中断反过来扩大“不会”。当前只能给待验证判断，不能凭一句家长描述定性。',
    '优先核实4项证据：最近3次同科成绩趋势；孩子独立启动作业所需时间；卡住后是求助、抄答案还是直接离开；抽2道基础题和1道变式题时能否说出第一步。',
    `当前时间节点：${timing.queryDate}，${timing.phaseLabel}。行动必须先建立低阻启动和短反馈，不能直接要求大量刷题。`,
    ...buildResistanceActions(input.stage),
    stageCommunicationBoundary(input.stage),
  );

  return lines.join('\n');
}

export function hasLearningResistanceConcern(concern?: string): boolean {
  return Boolean(concern?.trim() && RESISTANCE_PATTERN.test(concern));
}
