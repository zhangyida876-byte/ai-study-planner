import type { StageSlug } from './stages';

export interface ObjectionRecord {
  objectionId: string;
  name: string;
  stageScopes: StageSlug[];
  triggerPatterns: RegExp[];
  questionsToAsk: string[];
  responsePrinciple: string;
  script: string;
  nextAction: string;
  requiredDynamicFacts: string[];
  forbiddenClaims: string[];
}

const ALL_STAGES: StageSlug[] = ['elementary', 'middle', 'high'];

export const OBJECTION_LIBRARY: ObjectionRecord[] = [
  {
    objectionId: 'OBJ-USAGE-01',
    name: '担心孩子不用或坚持不下来',
    stageScopes: ALL_STAGES,
    triggerPatterns: [/买了(?:以后)?不学|不会用|坚持不下来|三分钟热度|孩子不配合|怕浪费/u],
    questionsToAsk: ['孩子现在最愿意碰哪一科或哪类任务？', '一次能稳定完成多长时间？'],
    responsePrinciple: '不承诺孩子一定坚持，先用最小任务验证启动、完成和复测',
    script: '您担心的不是有没有课程，而是买了以后孩子会不会真正用起来。咱们先别承诺长期坚持，先选一个真实卡点，让孩子完成一个短知识点和两三道基础题，再用完成率和隔天复测判断这条路径适不适合。',
    nextAction: '确定一个最小试学任务和隔天复测时间',
    requiredDynamicFacts: ['当前可用体验权益'],
    forbiddenClaims: ['保证孩子坚持', '所有孩子都喜欢'],
  },
  {
    objectionId: 'OBJ-EFFECT-01',
    name: '担心没有效果',
    stageScopes: ALL_STAGES,
    triggerPatterns: [/没效果|有没有用|能不能提分|担心效果|学了没用/u],
    questionsToAsk: ['家长最想先看到哪种变化？', '最近一次代表性错题或作业卡点是什么？'],
    responsePrinciple: '把效果拆成即时、短期和阶段指标，用复测而非承诺判断',
    script: '效果不能只靠一句会提分判断。前一周先看孩子能不能独立说思路、同类题是否少错、作业是否少卡；一个月再看单元测或月考的失分结构。洋葱提供讲解、练习和复盘工具，结果还要看孩子执行和学校进度。',
    nextAction: '约定一个知识点的一周学习和复测标准',
    requiredDynamicFacts: [],
    forbiddenClaims: ['保证提分', '一定有效', '保证考上'],
  },
  {
    objectionId: 'OBJ-TIME-01',
    name: '没有时间或住校',
    stageScopes: ALL_STAGES,
    triggerPatterns: [/没时间|住校|回家少|作业太多|课业重|晚自习/u],
    questionsToAsk: ['一周真正可支配的时间有多少？', '当前哪类题最耗时间？'],
    responsePrinciple: '时间少时只解决最影响作业和考试的一个问题，不从头看完整课程',
    script: '时间少更不能平均用力。咱们先统计孩子一周真正能支配的时间，只解决学校当前最影响作业和考试的一个问题。住校孩子回家时做诊断和复盘，下一周只带走少量明确任务，不再额外堆满日程。',
    nextAction: '确认回家频率、可用时间和一个优先问题',
    requiredDynamicFacts: [],
    forbiddenClaims: ['所有住校生都适合', '每周固定一两小时就一定提分'],
  },
  {
    objectionId: 'OBJ-PRICE-01',
    name: '价格超出预算',
    stageScopes: ALL_STAGES,
    triggerPatterns: [/太贵|价格|预算|费用|便宜|优惠/u],
    questionsToAsk: ['当前最需要解决的是哪个问题？', '家长能接受的投入范围和使用周期是什么？'],
    responsePrinciple: '先确认问题、使用频率和权益，再使用当日正式政策比较方案',
    script: '我理解，您现在不是不重视孩子，而是要判断这笔投入值不值。咱们先把要解决的问题、预计使用频率和需要的权益确定下来，再比较适合的方案。价格、分期和退款只按今天系统里的正式政策说明。',
    nextAction: '读取当日正式价格和权益后给出两个可比较方案',
    requiredDynamicFacts: ['当前价格', '套餐权益', '分期规则', '退款规则'],
    forbiddenClaims: ['历史最低价', '最后几个名额', '错过永远没有'],
  },
  {
    objectionId: 'OBJ-SUBJECT-01',
    name: '只想从单科开始',
    stageScopes: ALL_STAGES,
    triggerPatterns: [/只买一科|只报一科|单科|只学数学|只学英语/u],
    questionsToAsk: ['哪一科最影响总分或作业时间？', '其他科目前是稳定还是缺少数据？'],
    responsePrinciple: '尊重单科优先级，只有存在真实联动时才说明多科价值',
    script: '先从一科开始完全可以，关键是选对最影响总分或时间的那一科。咱们用最近成绩和作业耗时排优先级；其他科如果暂时稳定，就不为了全科硬加任务，有真实联动时再把依据讲清楚。',
    nextAction: '依据成绩和作业耗时确定第一优先科目',
    requiredDynamicFacts: ['单科与多科当前权益差异'],
    forbiddenClaims: ['所有科都必须买', '单科一定不划算'],
  },
  {
    objectionId: 'OBJ-DISCUSS-01',
    name: '需要和家人商量',
    stageScopes: ALL_STAGES,
    triggerPatterns: [/商量|问一下爸爸|问一下妈妈|跟家里说|考虑一下/u],
    questionsToAsk: ['家里主要还会关注效果、时间还是费用？'],
    responsePrinciple: '支持共同决策，帮助家长带走问题、匹配依据和投入三项信息',
    script: '当然可以商量。为了避免您回去不好转述，我帮您把三件事整理清楚：孩子现在的问题、推荐路径为什么匹配、需要投入的时间和费用。您家里最可能关注哪一点，我把对应依据一起发给您。',
    nextAction: '约定具体复联时间并发送三点摘要',
    requiredDynamicFacts: ['当前方案费用与权益'],
    forbiddenClaims: ['替家长做决定', '催促绕过其他监护人'],
  },
  {
    objectionId: 'OBJ-TRIAL-01',
    name: '想先体验',
    stageScopes: ALL_STAGES,
    triggerPatterns: [/体验|试学|先试试|试听/u],
    questionsToAsk: ['最适合拿来验证的真实卡点是什么？'],
    responsePrinciple: '体验必须围绕真实问题，并有学习、练习和隔天复测',
    script: '体验可以，但不要只让孩子随便看看。咱们选一个真实卡点，完成看懂一个知识点、独立做几道题、第二天换题复测。是否继续，不只问孩子觉得有不有趣，而是看他是否听懂、会不会用、愿不愿意再做一次。',
    nextAction: '建立体验任务卡并确认复测时间',
    requiredDynamicFacts: ['当前体验范围和期限'],
    forbiddenClaims: ['体验后一定提分', '未核实的试学天数'],
  },
  {
    objectionId: 'OBJ-COMPARE-01',
    name: '正在对比其他产品',
    stageScopes: ALL_STAGES,
    triggerPatterns: [/对比|其他机构|别的课程|竞品|学而思|猿辅导|作业帮/u],
    questionsToAsk: ['家长最在意内容匹配、孩子听懂、练习复测还是过程反馈？'],
    responsePrinciple: '只按事实比较适配性，不贬低竞品',
    script: '多比较是对的。建议您别只比课程数量和赠品，重点看内容是否匹配孩子当前问题、孩子能否听懂、学完有没有练习复测、家长能不能看到执行结果。您告诉我最在意的两项，我按事实说明洋葱适不适合。',
    nextAction: '按家长最关心的两个维度做事实对照',
    requiredDynamicFacts: ['当前产品覆盖和权益'],
    forbiddenClaims: ['贬低其他产品', '虚构竞品缺陷'],
  },
];

export function matchObjections(stage: StageSlug, text?: string): ObjectionRecord[] {
  const value = text?.trim() || '';
  if (!value) return [];
  return OBJECTION_LIBRARY.filter((item) => (
    item.stageScopes.includes(stage)
    && item.triggerPatterns.some((pattern) => pattern.test(value))
  )).slice(0, 2);
}
