import React from 'react';
import { BookOpen, ArrowRight, Layers, Link2, ChevronRight, ChevronLeft } from 'lucide-react';
import type { KnowledgePoint } from '@shared/api.interface';
import type { StageSlug } from '@client/src/config/stages';

interface KnowledgeGraphProps {
  detail: KnowledgePoint | null;
  stageSlug?: StageSlug;
}

const STAGE_GRADE_FLOW: Record<StageSlug, string[]> = {
  elementary: ['一年级上', '一年级下', '二年级上', '二年级下', '三年级上', '三年级下', '四年级上', '四年级下', '五年级上', '五年级下', '六年级上', '六年级下'],
  middle: ['七年级上', '七年级下', '八年级上', '八年级下', '九年级上', '九年级下'],
  high: ['高一上', '高一下', '高二上', '高二下', '高三一轮', '高三二轮'],
};

interface PrerequisiteFuture {
  prerequisites: { name: string; grade: string }[];
  future: { name: string; grade: string }[];
}

function inferStageByChapter(chapter: string): StageSlug {
  if (/高一|高二|高三/.test(chapter)) return 'high';
  if (/七年级|八年级|九年级|初一|初二|初三/.test(chapter)) return 'middle';
  return 'elementary';
}

function getStage(chapter: string, stageSlug?: StageSlug): StageSlug {
  if (stageSlug) return stageSlug;
  return inferStageByChapter(chapter);
}

function getGradeIndex(chapter: string, stage: StageSlug): number {
  const isUpper = /上册|上学期|上/.test(chapter);
  if (stage === 'elementary') {
    const gradeMap: Array<{ pattern: RegExp; base: number }> = [
      { pattern: /一年级|1年级/, base: 0 },
      { pattern: /二年级|2年级/, base: 2 },
      { pattern: /三年级|3年级/, base: 4 },
      { pattern: /四年级|4年级/, base: 6 },
      { pattern: /五年级|5年级/, base: 8 },
      { pattern: /六年级|6年级/, base: 10 },
    ];
    for (const item of gradeMap) {
      if (item.pattern.test(chapter)) return item.base + (isUpper ? 0 : 1);
    }
    return 8;
  }
  if (stage === 'middle') {
    const gradeMap: Array<{ pattern: RegExp; base: number }> = [
      { pattern: /七年级|初一/, base: 0 },
      { pattern: /八年级|初二/, base: 2 },
      { pattern: /九年级|初三/, base: 4 },
    ];
    for (const item of gradeMap) {
      if (item.pattern.test(chapter)) return item.base + (isUpper ? 0 : 1);
    }
    return 2;
  }

  const gradeMap: Array<{ pattern: RegExp; base: number }> = [
    { pattern: /高一/, base: 0 },
    { pattern: /高二/, base: 2 },
    { pattern: /高三/, base: 4 },
  ];
  for (const item of gradeMap) {
    if (item.pattern.test(chapter)) return item.base + (isUpper ? 0 : 1);
  }
  return 2;
}

function getImportanceLevel(content: { coreKnowledge: string; commonMistakes: string }, stage: StageSlug): { level: string; color: string; desc: string } {
  const coreLen = (content.coreKnowledge || '').length;
  const mistakeLen = (content.commonMistakes || '').length;
  const examLabel = stage === 'high' ? '高考' : stage === 'middle' ? '中考' : '阶段测评';
  if (coreLen > 200 && mistakeLen > 100) return { level: '核心考点', color: 'text-marker-red bg-marker-red/10 border-marker-red', desc: `高频核心知识，${examLabel}关联度高` };
  if (coreLen > 100) return { level: '重要知识', color: 'text-pen-blue bg-pen-blue/10 border-pen-blue', desc: '重要知识点，需重点掌握并反复训练' };
  return { level: '基础巩固', color: 'text-emerald-600 bg-emerald-600/10 border-emerald-600', desc: '基础知识，建议先稳住正确率再拔高' };
}

function getExamProbability(chapter: string, subject: string, stage: StageSlug): { probability: string; percent: number; reason: string; label: string } {
  const coreSubjects = ['数学', '语文', '英语', '物理', '化学'];
  const isCore = coreSubjects.includes(subject);
  const isUpper = /上册|上学期|上/.test(chapter);
  if (stage === 'elementary') {
    if (isCore && !isUpper) return { probability: '高频', percent: 78, reason: `${subject}在小学下学期综合题中出现频率更高`, label: '阶段测评考查概率' };
    if (isCore) return { probability: '中高频', percent: 64, reason: `${subject}是小学核心学科，需持续巩固`, label: '阶段测评考查概率' };
    return { probability: '中频', percent: 48, reason: '该知识点常用于单元测评与综合应用', label: '阶段测评考查概率' };
  }
  if (stage === 'middle') {
    if (isCore && !isUpper) return { probability: '高频', percent: 85, reason: `${subject}核心科目 + 下册内容通常为中考重点`, label: '中考出题概率' };
    if (isCore) return { probability: '中高频', percent: 70, reason: `${subject}核心科目，上册内容中考常考`, label: '中考出题概率' };
    if (!isUpper) return { probability: '中频', percent: 55, reason: '非核心科目但下册内容出题比例较高', label: '中考出题概率' };
    return { probability: '中低频', percent: 35, reason: '非核心科目上册，出题概率相对较低', label: '中考出题概率' };
  }

  if (isCore && !isUpper) return { probability: '高频', percent: 82, reason: `${subject}下学期内容常作为高考综合题底层能力`, label: '高考考查概率' };
  if (isCore) return { probability: '中高频', percent: 68, reason: `${subject}是高考主干学科，跨模块综合考查明显`, label: '高考考查概率' };
  return { probability: '中频', percent: 52, reason: '该知识点多用于选考模块与情境题', label: '高考考查概率' };
}

type CrossSubjectInfo = { subject: string; knowledgePoints: string; ability: string }[];

const CROSS_SUBJECT_MAP: Record<string, CrossSubjectInfo> = {
  '数学': [
    { subject: '物理', knowledgePoints: '速度公式v=s/t、牛顿第二定律F=ma、欧姆定律U=IR', ability: '代数运算与方程求解能力' },
    { subject: '化学', knowledgePoints: '化学方程式配平系数、溶液浓度计算、物质的量', ability: '比例与分数运算能力' },
    { subject: '地理', knowledgePoints: '经纬度坐标计算、比例尺换算、气温递减率', ability: '数形结合与坐标系思维' },
  ],
  '语文': [
    { subject: '历史', knowledgePoints: '文言文阅读理解（如《史记》选段）、古代文化常识', ability: '文言文翻译与语境分析能力' },
    { subject: '英语', knowledgePoints: '主谓宾句式结构、定语从句与状语从句', ability: '句法分析与长难句理解能力' },
    { subject: '政治', knowledgePoints: '议论文论点论据论证、时政评论写作', ability: '逻辑思维与论证表达能力' },
  ],
  '英语': [
    { subject: '语文', knowledgePoints: '阅读理解中的主旨归纳、推断题型', ability: '文本分析与逻辑推理能力' },
    { subject: '历史', knowledgePoints: '西方文明史、英美文化背景知识', ability: '跨文化理解与语境推断能力' },
    { subject: '地理', knowledgePoints: '各国地理概况的英文描述', ability: '专业术语的中英文转换能力' },
  ],
  '物理': [
    { subject: '数学', knowledgePoints: '一次函数y=kx+b、二次函数、相似三角形', ability: '函数建模与图像分析能力' },
    { subject: '化学', knowledgePoints: '能量守恒（化学反应热）、电化学（原电池）', ability: '能量转化分析与守恒思维' },
    { subject: '地理', knowledgePoints: '大气压强与天气、地球自转公转', ability: '物理原理在自然现象中的应用' },
  ],
  '化学': [
    { subject: '物理', knowledgePoints: '热力学第一定律、电路中的电流与电压', ability: '能量守恒与电学基础分析能力' },
    { subject: '数学', knowledgePoints: '比例计算、方程求解、不等式', ability: '定量计算与数据分析能力' },
    { subject: '生物', knowledgePoints: '光合作用反应式、呼吸作用化学方程式', ability: '化学方程式书写与配平能力' },
  ],
  '生物': [
    { subject: '化学', knowledgePoints: '有机化合物（糖类/蛋白质/脂肪）、氧化还原反应', ability: '有机物结构与反应类型分析能力' },
    { subject: '地理', knowledgePoints: '生态系统与生物多样性、气候对植被的影响', ability: '环境因素分析与系统思维能力' },
    { subject: '物理', knowledgePoints: '光学（显微镜成像）、力学（骨骼杠杆）', ability: '物理原理在生命活动中的应用' },
  ],
  '历史': [
    { subject: '语文', knowledgePoints: '古代诗词的历史背景、文言文史料阅读', ability: '史料解读与文言文理解能力' },
    { subject: '政治', knowledgePoints: '政治制度演变（君主制→共和制→民主制）', ability: '制度比较与历史发展脉络分析能力' },
    { subject: '地理', knowledgePoints: '历史事件的地理位置（丝绸之路、大航海）', ability: '时空关联与地图分析能力' },
  ],
  '地理': [
    { subject: '数学', knowledgePoints: '比例尺计算、经纬度坐标运算、统计图表', ability: '数形结合与空间计算能力' },
    { subject: '物理', knowledgePoints: '大气运动原理、地球自转与昼夜交替', ability: '自然现象的物理解释能力' },
    { subject: '历史', knowledgePoints: '地理大发现、工业革命的地域分布', ability: '地理环境对历史进程的影响分析能力' },
  ],
  '政治': [
    { subject: '历史', knowledgePoints: '中国近现代政治制度变迁、宪法发展历程', ability: '历史背景分析与制度比较能力' },
    { subject: '语文', knowledgePoints: '议论文写作（论点论据论证）、新闻评论', ability: '逻辑论证与批判性思维能力' },
    { subject: '地理', knowledgePoints: '区域经济发展政策、可持续发展战略', ability: '政策分析与区域协调发展思维' },
  ],
};

const MIDDLE_KNOWLEDGE_CHAIN: Record<string, PrerequisiteFuture> = {
  '数学': {
    prerequisites: [
      { name: '有理数运算', grade: '七年级上' },
      { name: '整式加减', grade: '七年级上' },
      { name: '一元一次方程', grade: '七年级上' },
      { name: '二元一次方程组', grade: '七年级下' },
      { name: '不等式与不等式组', grade: '七年级下' },
      { name: '相交线与平行线', grade: '七年级下' },
      { name: '三角形基础', grade: '八年级上' },
    ],
    future: [
      { name: '二次函数', grade: '九年级上' },
      { name: '圆', grade: '九年级上' },
      { name: '相似三角形', grade: '九年级下' },
      { name: '锐角三角函数', grade: '九年级下' },
      { name: '统计与概率', grade: '九年级下' },
      { name: '高中函数与导数', grade: '高一' },
    ],
  },
  '物理': {
    prerequisites: [
      { name: '运动与力', grade: '八年级上' },
      { name: '声现象', grade: '八年级上' },
      { name: '物态变化', grade: '八年级上' },
      { name: '光现象', grade: '八年级上' },
      { name: '透镜及应用', grade: '八年级上' },
      { name: '质量与密度', grade: '八年级上' },
    ],
    future: [
      { name: '电功率', grade: '九年级上' },
      { name: '生活用电', grade: '九年级上' },
      { name: '电与磁', grade: '九年级下' },
      { name: '信息的传递', grade: '九年级下' },
      { name: '能源与可持续发展', grade: '九年级下' },
      { name: '高中力学与电磁学', grade: '高一' },
    ],
  },
  '英语': {
    prerequisites: [
      { name: '一般现在时', grade: '七年级上' },
      { name: '一般过去时', grade: '七年级下' },
      { name: '形容词比较级', grade: '八年级上' },
      { name: '现在进行时', grade: '八年级上' },
      { name: '过去进行时', grade: '八年级下' },
    ],
    future: [
      { name: '现在完成时', grade: '九年级上' },
      { name: '被动语态', grade: '九年级全册' },
      { name: '定语从句', grade: '九年级全册' },
      { name: '宾语从句', grade: '九年级全册' },
      { name: '高中非谓语动词', grade: '高一' },
    ],
  },
  '化学': {
    prerequisites: [
      { name: '物质的变化和性质', grade: '九年级上' },
      { name: '我们周围的空气', grade: '九年级上' },
      { name: '物质构成的奥秘', grade: '九年级上' },
      { name: '化学方程式', grade: '九年级上' },
      { name: '碳和碳的氧化物', grade: '九年级上' },
    ],
    future: [
      { name: '金属和金属材料', grade: '九年级下' },
      { name: '溶液', grade: '九年级下' },
      { name: '酸和碱', grade: '九年级下' },
      { name: '盐和化肥', grade: '九年级下' },
      { name: '高中有机化学', grade: '高一' },
    ],
  },
  '语文': {
    prerequisites: [
      { name: '记叙文阅读', grade: '七年级上' },
      { name: '文言文基础', grade: '七年级上' },
      { name: '说明文阅读', grade: '八年级上' },
      { name: '议论文阅读', grade: '九年级上' },
      { name: '古诗词鉴赏', grade: '八年级下' },
    ],
    future: [
      { name: '综合性学习', grade: '九年级下' },
      { name: '名著阅读', grade: '九年级全册' },
      { name: '文言文对比阅读', grade: '九年级下' },
      { name: '高中散文与小说', grade: '高一' },
    ],
  },
  '历史': {
    prerequisites: [
      { name: '中国古代史（先秦）', grade: '七年级上' },
      { name: '中国古代史（秦汉）', grade: '七年级上' },
      { name: '中国古代史（隋唐）', grade: '七年级下' },
      { name: '中国近代史（鸦片战争）', grade: '八年级上' },
    ],
    future: [
      { name: '世界近代史', grade: '九年级上' },
      { name: '世界现代史', grade: '九年级下' },
      { name: '中国现代史', grade: '八年级下' },
      { name: '高中通史复习', grade: '高一' },
    ],
  },
  '生物': {
    prerequisites: [
      { name: '细胞的结构与功能', grade: '七年级上' },
      { name: '生物圈中的绿色植物', grade: '七年级上' },
      { name: '人体的营养与呼吸', grade: '七年级下' },
    ],
    future: [
      { name: '遗传与变异', grade: '八年级下' },
      { name: '生物的进化', grade: '八年级下' },
      { name: '健康地生活', grade: '八年级下' },
      { name: '高中分子与细胞', grade: '高一' },
    ],
  },
  '地理': {
    prerequisites: [
      { name: '地球和地图', grade: '七年级上' },
      { name: '陆地和海洋', grade: '七年级上' },
      { name: '天气与气候', grade: '七年级上' },
    ],
    future: [
      { name: '中国地理（疆域与人口）', grade: '八年级上' },
      { name: '中国地理（经济与文化）', grade: '八年级下' },
      { name: '世界区域地理', grade: '七年级下' },
      { name: '高中自然地理', grade: '高一' },
    ],
  },
};

const ELEMENTARY_KNOWLEDGE_CHAIN: Record<string, PrerequisiteFuture> = {
  '数学': {
    prerequisites: [
      { name: '数的认识与比较', grade: '一年级上' },
      { name: '20以内加减法', grade: '一年级下' },
      { name: '表内乘法', grade: '二年级上' },
      { name: '除法初步', grade: '二年级下' },
      { name: '分数初步认识', grade: '三年级下' },
    ],
    future: [
      { name: '小数与分数运算', grade: '四年级下' },
      { name: '方程初步', grade: '五年级上' },
      { name: '比例与百分数', grade: '六年级下' },
      { name: '初中有理数与方程', grade: '七年级上' },
    ],
  },
  '语文': {
    prerequisites: [
      { name: '识字与写字', grade: '一年级上' },
      { name: '句子理解', grade: '二年级上' },
      { name: '段落概括', grade: '三年级上' },
    ],
    future: [
      { name: '记叙文阅读', grade: '四年级下' },
      { name: '说明文阅读', grade: '五年级下' },
      { name: '小升初综合阅读与作文', grade: '六年级下' },
      { name: '初中文言文基础', grade: '七年级上' },
    ],
  },
  '英语': {
    prerequisites: [
      { name: '字母与音标基础', grade: '三年级上' },
      { name: '高频词汇与短语', grade: '四年级上' },
      { name: '一般现在时', grade: '五年级上' },
    ],
    future: [
      { name: '一般过去时', grade: '六年级上' },
      { name: '阅读理解基础', grade: '六年级下' },
      { name: '初中语法体系', grade: '七年级上' },
    ],
  },
};

const HIGH_KNOWLEDGE_CHAIN: Record<string, PrerequisiteFuture> = {
  '数学': {
    prerequisites: [
      { name: '函数与方程基础', grade: '高一上' },
      { name: '三角函数', grade: '高一下' },
      { name: '数列与不等式', grade: '高二上' },
    ],
    future: [
      { name: '导数与函数综合', grade: '高二下' },
      { name: '解析几何综合', grade: '高三一轮' },
      { name: '高考压轴综合题', grade: '高三二轮' },
    ],
  },
  '物理': {
    prerequisites: [
      { name: '力与运动', grade: '高一上' },
      { name: '功和能', grade: '高一下' },
      { name: '电场与电路', grade: '高二上' },
    ],
    future: [
      { name: '磁场与电磁感应', grade: '高二下' },
      { name: '热学与波动', grade: '高三一轮' },
      { name: '高考综合实验题', grade: '高三二轮' },
    ],
  },
  '化学': {
    prerequisites: [
      { name: '物质结构与元素周期律', grade: '高一上' },
      { name: '化学反应原理', grade: '高一下' },
      { name: '氧化还原与电化学', grade: '高二上' },
    ],
    future: [
      { name: '有机化学基础', grade: '高二下' },
      { name: '实验探究与定量分析', grade: '高三一轮' },
      { name: '高考综合流程题', grade: '高三二轮' },
    ],
  },
  '生物': {
    prerequisites: [
      { name: '细胞与分子基础', grade: '高一上' },
      { name: '遗传规律', grade: '高一下' },
      { name: '稳态与调节', grade: '高二上' },
    ],
    future: [
      { name: '生态系统与进化', grade: '高二下' },
      { name: '实验设计与数据分析', grade: '高三一轮' },
      { name: '高考综合大题', grade: '高三二轮' },
    ],
  },
  '语文': {
    prerequisites: [
      { name: '古诗文实词与虚词', grade: '高一上' },
      { name: '现代文信息提取', grade: '高一下' },
    ],
    future: [
      { name: '文言文综合阅读', grade: '高二上' },
      { name: '议论文写作进阶', grade: '高二下' },
      { name: '高考整卷阅读写作', grade: '高三一轮' },
    ],
  },
  '英语': {
    prerequisites: [
      { name: '词汇与语法体系', grade: '高一上' },
      { name: '长难句分析', grade: '高一下' },
    ],
    future: [
      { name: '阅读理解推断题', grade: '高二上' },
      { name: '应用文与读后续写', grade: '高二下' },
      { name: '高考综合语篇训练', grade: '高三一轮' },
    ],
  },
  '历史': {
    prerequisites: [
      { name: '中国古代史主线', grade: '高一上' },
      { name: '中国近现代史主线', grade: '高一下' },
    ],
    future: [
      { name: '世界史纵横比较', grade: '高二上' },
      { name: '史料实证题训练', grade: '高二下' },
      { name: '高考史论题写作', grade: '高三一轮' },
    ],
  },
  '地理': {
    prerequisites: [
      { name: '自然地理原理', grade: '高一上' },
      { name: '人文地理结构', grade: '高一下' },
    ],
    future: [
      { name: '区域地理综合', grade: '高二上' },
      { name: '地理图表判读', grade: '高二下' },
      { name: '高考综合情境题', grade: '高三一轮' },
    ],
  },
  '政治': {
    prerequisites: [
      { name: '经济与生活', grade: '高一上' },
      { name: '政治与法治', grade: '高一下' },
    ],
    future: [
      { name: '哲学与文化', grade: '高二上' },
      { name: '时政材料分析', grade: '高二下' },
      { name: '高考论述题表达', grade: '高三一轮' },
    ],
  },
};

function getKnowledgeChain(stage: StageSlug, subject: string): PrerequisiteFuture {
  if (stage === 'elementary') return ELEMENTARY_KNOWLEDGE_CHAIN[subject] || { prerequisites: [], future: [] };
  if (stage === 'high') return HIGH_KNOWLEDGE_CHAIN[subject] || { prerequisites: [], future: [] };
  return MIDDLE_KNOWLEDGE_CHAIN[subject] || { prerequisites: [], future: [] };
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ detail, stageSlug }) => {
  if (!detail) return null;

  const stage = getStage(detail.chapter, stageSlug);
  const gradeFlow = STAGE_GRADE_FLOW[stage];
  const currentIdx = getGradeIndex(detail.chapter, stage);
  const importance = getImportanceLevel(detail.content, stage);
  const examProb = getExamProbability(detail.chapter, detail.subject, stage);

  const crossRelated = CROSS_SUBJECT_MAP[detail.subject] || [];
  const knowledgeChain = getKnowledgeChain(stage, detail.subject);

  const pastItems = knowledgeChain.prerequisites.filter((_, idx) => idx < currentIdx + 1).slice(-3);
  const futureItems = knowledgeChain.future.slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="mb-3 flex items-center gap-2">
        <Layers className="size-4 text-pen-blue" />
        <h3 className="font-marker text-sm font-bold text-ink">知识图谱</h3>
      </div>

      {/* Grade Timeline */}
      <div className="rounded-lg border-2 border-dashed border-ink/20 bg-accent/30 p-3">
        <div className="mb-2 flex items-center gap-1">
          <BookOpen className="size-3.5 text-pen-blue" />
          <span className="font-hand text-xs text-muted-foreground">
            {detail.subject} 学科纵向关联
          </span>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto py-2">
          {gradeFlow.map((g, idx) => (
            <React.Fragment key={g}>
              <div
                className={`flex min-w-[64px] flex-col items-center rounded-md border-2 px-2 py-1.5 text-center transition-colors ${
                  idx === currentIdx
                    ? 'border-marker-red bg-marker-red/10 shadow-hard-sm'
                    : idx < currentIdx
                    ? 'border-ink/20 bg-white/60'
                    : 'border-dashed border-ink/15 bg-white/30'
                }`}
              >
                <span className={`font-hand text-[10px] leading-tight ${
                  idx === currentIdx ? 'font-bold text-marker-red' : 'text-ink/60'
                }`}>
                  {g}
                </span>
                {idx === currentIdx && (
                  <span className="mt-0.5 rounded-sm bg-marker-red px-1 py-px font-hand text-[8px] font-bold text-white">
                    当前
                  </span>
                )}
                {idx < currentIdx && (
                  <span className="mt-0.5 font-hand text-[8px] text-ink/40">已学</span>
                )}
                {idx > currentIdx && (
                  <span className="mt-0.5 font-hand text-[8px] text-ink/30">待学</span>
                )}
              </div>
              {idx < gradeFlow.length - 1 && (
                <ArrowRight className={`size-3 flex-shrink-0 ${
                  idx < currentIdx ? 'text-pen-blue/60' : 'text-ink/20'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Prerequisites */}
      {pastItems.length > 0 && (
        <div className="rounded-lg border-2 border-dashed border-emerald-500/20 bg-emerald-500/[0.02] p-3">
          <div className="mb-2 flex items-center gap-1">
            <ChevronLeft className="size-3.5 text-emerald-600" />
            <span className="font-hand text-xs font-bold text-emerald-700">前置知识（需先掌握）</span>
          </div>
          <div className="space-y-1.5">
            {pastItems.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="inline-block rounded-sm bg-emerald-100 px-1.5 py-0.5 font-hand text-[9px] text-emerald-700">
                  {item.grade}
                </span>
                <span className="font-hand text-xs text-ink/70">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Future */}
      {futureItems.length > 0 && (
        <div className="rounded-lg border-2 border-dashed border-pen-blue/20 bg-pen-blue/[0.02] p-3">
          <div className="mb-2 flex items-center gap-1">
            <ChevronRight className="size-3.5 text-pen-blue" />
            <span className="font-hand text-xs font-bold text-pen-blue">后续知识（本知识为铺垫）</span>
          </div>
          <div className="space-y-1.5">
            {futureItems.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="inline-block rounded-sm bg-pen-blue/10 px-1.5 py-0.5 font-hand text-[9px] text-pen-blue">
                  {item.grade}
                </span>
                <span className="font-hand text-xs text-ink/70">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cross-subject influence */}
      {crossRelated.length > 0 && (
        <div className="rounded-lg border-2 border-dashed border-marker-red/20 bg-marker-red/[0.02] p-3">
          <div className="mb-2 flex items-center gap-1">
            <Link2 className="size-3.5 text-marker-red" />
            <span className="font-hand text-xs font-bold text-marker-red">跨学科影响</span>
          </div>
          <div className="space-y-3">
            {crossRelated.map((item) => (
              <div key={item.subject} className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block rounded-sm border border-ink/30 bg-postit-yellow/60 px-1.5 py-0.5 font-hand text-[10px] font-bold">
                    {item.subject}
                  </span>
                  <ArrowRight className="size-3 text-marker-red" />
                  <span className="font-hand text-[10px] text-ink/60">涉及的知识点:</span>
                </div>
                <div className="ml-1 border-l-2 border-dashed border-marker-red/20 pl-3">
                  <p className="font-hand text-xs text-ink/80">{item.knowledgePoints}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="rounded-sm bg-accent px-1.5 py-0.5 font-hand text-[9px] text-ink/60">能力要求</span>
                    <span className="font-hand text-[10px] font-bold text-marker-red">{item.ability}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Importance & Exam Probability */}
      <div className="space-y-2">
        <div className={`inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 font-hand text-xs font-bold ${importance.color}`}>
          重要程度: {importance.level}
        </div>
        <p className="font-hand text-xs text-muted-foreground">{importance.desc}</p>

        <div className="mt-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-hand text-xs text-ink/70">{examProb.label}</span>
            <span className={`font-hand text-xs font-bold ${
              examProb.percent >= 70 ? 'text-marker-red' : examProb.percent >= 50 ? 'text-pen-blue' : 'text-ink/60'
            }`}>
              {examProb.probability} ({examProb.percent}%)
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full border border-ink/20 bg-accent">
            <div
              className={`h-full rounded-full transition-all ${
                examProb.percent >= 70 ? 'bg-marker-red' : examProb.percent >= 50 ? 'bg-pen-blue' : 'bg-ink/30'
              }`}
              style={{ width: `${examProb.percent}%` }}
            />
          </div>
          <p className="mt-1 font-hand text-[10px] text-muted-foreground">{examProb.reason}</p>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraph;
