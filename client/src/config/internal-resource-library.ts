import type { StageSlug } from '@client/src/config/stages';

export type InternalModuleKey = 'diagnosis' | 'plan' | 'study-plan' | 'knowledge' | 'advice';

const COMMON_MATERIALS: string[] = [
  '异议处理统一原则：先共情、再拆问题、再给可执行动作，不和家长争辩。',
  '活动课包价格口径：以公司最新活动价和当期政策为准，禁止引用过期价格。',
  '产品介绍主线：AI拍题精学、AI错题本、AI定制班、同步刷题/专项突破，强调先学思路再做题。',
  '服务承诺表达：学习报告可追踪、过程可复盘、服务有陪伴，不做夸张保分承诺。',
  '竞品对比口径：重点说教材同步、短时高效、可反复学习和执行闭环，不做贬低式对比。',
];

const STAGE_MATERIALS: Record<StageSlug, string[]> = {
  elementary: [
    '小学微信跟进重点：先抓学习兴趣和习惯，再做基础能力提升。',
    '小学语文：识字词、古诗背诵、阅读和写作分模块推进。',
    '小学数学：计算与应用题并行，强调一题三会和思维启蒙。',
    '小学英语：自然拼读+情景学习，降低开口门槛。',
  ],
  middle: [
    '初中微信跟进重点：以中考能力为导向，突出题型方法和查漏补缺。',
    '初中文科：高频短时记忆+快背体系，提升提分效率。',
    '初中理科：同步课打底，专项突破拉分，错题回炉固化。',
    '初中家长沟通：先稳节奏，再拉成绩，避免一次性压强过大。',
  ],
  high: [
    '高中微信跟进重点：大学-专业-就业一体化，不再沿用初中叙事。',
    '高中策略：选科约束、院校层次、专业路径和就业前景同时评估。',
    '高中执行：时间非常稀缺，强调周目标与周复盘闭环。',
    '高中沟通：尊重学生选择权，家长以目标管理和资源支持为主。',
  ],
};

const MODULE_RULES: Record<InternalModuleKey, string[]> = {
  diagnosis: [
    '诊断输出必须先给结论，再给原因，最后给动作。',
    '家长话术要口语化、有温度，避免空泛术语。',
    '如果涉及产品建议，优先引用内部产品卖点与案例表达。',
  ],
  plan: [
    '升学规划输出顺序：当前分位 -> 目标差距 -> 时间节点 -> 执行动作。',
    '政策只讲关键点，必须结合最新公开信息，不堆砌长段背景。',
    '高中文案必须落在院校与专业，不回到中考主线。',
  ],
  'study-plan': [
    '学习计划要可落地：每周目标、每日任务、验收标准三件套。',
    '优先用内部“先稳后提”沟通框架，避免高压指令式表达。',
    '围绕弱科先补、强科稳住，形成短周期复盘机制。',
  ],
  knowledge: [
    '知识点讲解采用“核心概念-易错点-实操题型”结构，贴合内部讲解节奏。',
    '先讲学生能做什么，再讲理论定义，减少距离感。',
    '输出要能直接转成家长或学生可执行的话术。',
  ],
  advice: [
    '建议话术统一使用“共情开场-目标对齐-本周动作-复盘收口”四段式。',
    '语言要求：大白话、短句、可执行，不说空话套话。',
    '若内部素材与外部信息冲突：产品/服务口径以内部为准，政策数据以公开最新为准。',
  ],
};

const OBJECTION_HANDLING_DOC: string[] = [
  '异议处理文档要点：先确认家长担心的是“价格、效果、时间还是孩子配合度”，不要混答。',
  '异议处理文档要点：回应价格时先回到目标收益，再给可执行起步方案和复盘节点。',
  '异议处理文档要点：回应效果时必须说“可追踪指标 + 周复盘动作”，禁止空口保证提分。',
  '异议处理文档要点：回应孩子不配合时，先降门槛再提要求，先完成再完美。',
  '异议处理文档要点：收口必须给下一步动作（本周体验、样题诊断、复盘时间）。',
];

const SCRIPT_ANCHOR: Record<StageSlug, Record<InternalModuleKey, string>> = {
  elementary: {
    diagnosis: '先把学习兴趣和基础习惯稳住，再谈提分速度。',
    plan: '路线先走“基础打牢+重点突破”，不做超负荷安排。',
    'study-plan': '每天小步推进，周末复盘，孩子更容易坚持。',
    knowledge: '先补前置知识，再做同类题，先会做再做快。',
    advice: '先鼓励再提要求，孩子配合度会明显更高。',
  },
  middle: {
    diagnosis: '先抓核心失分点，再做题型和方法的针对训练。',
    plan: '中考规划以分差和时间节点驱动，动作必须可验收。',
    'study-plan': '周目标拆到每天，错题回炉是提分主抓手。',
    knowledge: '先定位薄弱知识链，再做专题突破。',
    advice: '先对齐目标，再给孩子可完成的小任务。',
  },
  high: {
    diagnosis: '先看大学与专业匹配度，再看单科提分路径。',
    plan: '高考规划以院校-专业-就业主线输出，避免中考化。',
    'study-plan': '时间紧，任务要少而准，每周必须复盘调整。',
    knowledge: '知识点学习直接服务选科和高考题型能力。',
    advice: '尊重孩子选择，家长负责节奏和资源支持。',
  },
};

export function getInternalMaterialContext(input: {
  stageSlug: StageSlug;
  module: InternalModuleKey;
  limit?: number;
}): string {
  const { stageSlug, module, limit = 10 } = input;
  const lines = [...COMMON_MATERIALS, ...(STAGE_MATERIALS[stageSlug] || []), ...(MODULE_RULES[module] || [])];
  return lines.slice(0, limit).map((line, index) => `${index + 1}. ${line}`).join('\n');
}

export function getInternalScriptAnchor(stageSlug: StageSlug, module: InternalModuleKey): string {
  return SCRIPT_ANCHOR[stageSlug][module];
}

export function getObjectionHandlingMaterial(limit = 8): string {
  return OBJECTION_HANDLING_DOC.slice(0, limit)
    .map((line, index) => `${index + 1}. ${line}`)
    .join('\n');
}
