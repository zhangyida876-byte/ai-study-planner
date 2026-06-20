import React from 'react';
import { BookOpen, ArrowRight, ArrowDown, Layers, Link2, ChevronRight, ChevronLeft } from 'lucide-react';
import type { KnowledgePoint } from '@shared/api.interface';

interface KnowledgeGraphProps {
  detail: KnowledgePoint | null;
}

const GRADE_FLOW = ['七年级上', '七年级下', '八年级上', '八年级下', '九年级上', '九年级下'];

function getGradeIndex(chapter: string): number {
  const numMap: Record<string, number> = {
    '1': 0, '一': 0, '七年级': 0,
    '2': 1, '二': 1, '八年级': 1,
    '3': 2, '三': 2, '九年级': 2,
    '全册': 2, '全': 2,
  };
  for (const [key, idx] of Object.entries(numMap)) {
    if (chapter.includes(key)) return idx;
  }
  if (chapter.includes('高一')) return 3;
  if (chapter.includes('高二')) return 4;
  if (chapter.includes('高三')) return 5;
  return 2;
}

function getImportanceLevel(content: { coreKnowledge: string; commonMistakes: string }): { level: string; color: string; desc: string } {
  const coreLen = (content.coreKnowledge || '').length;
  const mistakeLen = (content.commonMistakes || '').length;
  if (coreLen > 200 && mistakeLen > 100) return { level: '核心考点', color: 'text-marker-red bg-marker-red/10 border-marker-red', desc: '高频核心知识，中考必考范围' };
  if (coreLen > 100) return { level: '重要知识', color: 'text-pen-blue bg-pen-blue/10 border-pen-blue', desc: '重要知识点，考试常涉及' };
  return { level: '基础巩固', color: 'text-emerald-600 bg-emerald-600/10 border-emerald-600', desc: '基础知识，需掌握但出题频率较低' };
}

function getExamProbability(chapter: string, subject: string): { probability: string; percent: number; reason: string } {
  const coreSubjects = ['数学', '语文', '英语', '物理', '化学'];
  const isCore = coreSubjects.includes(subject);
  const isUpper = chapter.includes('上') || chapter.includes('1') || chapter.includes('一');

  if (isCore && !isUpper) return { probability: '高频', percent: 85, reason: `${subject}核心科目 + 下册内容通常为中考重点` };
  if (isCore) return { probability: '中高频', percent: 70, reason: `${subject}核心科目，上册内容中考常考` };
  if (!isUpper) return { probability: '中频', percent: 55, reason: `非核心科目但下册内容出题比例较高` };
  return { probability: '中低频', percent: 35, reason: '非核心科目上册，出题概率相对较低' };
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

interface PrerequisiteFuture {
  prerequisites: { name: string; grade: string }[];
  future: { name: string; grade: string }[];
}

const KNOWLEDGE_CHAIN: Record<string, PrerequisiteFuture> = {
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

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ detail }) => {
  if (!detail) return null;

  const currentIdx = getGradeIndex(detail.chapter);
  const importance = getImportanceLevel(detail.content);
  const examProb = getExamProbability(detail.chapter, detail.subject);

  const crossRelated = CROSS_SUBJECT_MAP[detail.subject] || [];
  const knowledgeChain = KNOWLEDGE_CHAIN[detail.subject] || { prerequisites: [], future: [] };

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
          {GRADE_FLOW.map((g, idx) => (
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
              {idx < GRADE_FLOW.length - 1 && (
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
            <span className="font-hand text-xs text-ink/70">中考出题概率</span>
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
