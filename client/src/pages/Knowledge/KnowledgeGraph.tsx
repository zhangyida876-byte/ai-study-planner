import React from 'react';
import { BookOpen, ArrowRight, ArrowDown, Layers, Link2 } from 'lucide-react';
import type { KnowledgePoint } from '@shared/api.interface';

interface KnowledgeGraphProps {
  detail: KnowledgePoint | null;
}

const GRADE_FLOW = ['七年级上', '七年级下', '八年级上', '八年级下', '九年级上', '九年级下'];

function getGradeIndex(chapter: string): number {
  for (let i = 0; i < GRADE_FLOW.length; i++) {
    if (chapter.includes(GRADE_FLOW[i].replace('年级', '')) || chapter.includes(String(i + 1))) return i;
  }
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

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ detail }) => {
  if (!detail) return null;

  const currentIdx = getGradeIndex(detail.chapter);
  const importance = getImportanceLevel(detail.content);
  const examProb = getExamProbability(detail.chapter, detail.subject);

  const crossSubjects: Record<string, [string, string][]> = {
    '数学': [['物理', '力学计算中的应用'], ['化学', '化学方程式配平']],
    '语文': [['历史', '文言文阅读背景'], ['英语', '语法结构对比']],
    '英语': [['语文', '阅读理解技巧'], ['历史', '英语文化背景']],
    '物理': [['数学', '函数与图像分析'], ['化学', '能量转化']],
    '化学': [['物理', '热力学与电学'], ['数学', '比例计算']],
    '生物': [['化学', '有机化学基础'], ['地理', '生态环境']],
    '历史': [['语文', '史料阅读理解'], ['政治', '制度演变']],
    '地理': [['数学', '比例尺计算'], ['物理', '大气运动']],
  };

  const related: [string, string][] = crossSubjects[detail.subject] || [['综合', '跨学科综合应用']];

  return (
    <div className="space-y-4">
      <div className="mb-3 flex items-center gap-2">
        <Layers className="size-4 text-pen-blue" />
        <h3 className="font-marker text-sm font-bold text-ink">知识图谱</h3>
      </div>

      <div className="rounded-lg border-2 border-dashed border-ink/20 bg-accent/30 p-3">
        <div className="mb-2 flex items-center gap-1">
          <BookOpen className="size-3.5 text-pen-blue" />
          <span className="font-hand text-xs text-muted-foreground">
            {detail.subject} 学科知识点纵向关联
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

      <div className="rounded-lg border-2 border-dashed border-pen-blue/20 bg-pen-blue/[0.02] p-3">
        <div className="mb-2 flex items-center gap-1">
          <Link2 className="size-3.5 text-pen-blue" />
          <span className="font-hand text-xs text-muted-foreground">跨学科影响</span>
        </div>
        <div className="space-y-2">
          {related.map(([subj, desc]) => (
            <div key={subj} className="flex items-start gap-2">
              <span className="mt-0.5 inline-block rounded-sm border border-ink/30 bg-postit-yellow/60 px-1.5 py-0.5 font-hand text-[10px] font-bold">
                {subj}
              </span>
              <div>
                <ArrowDown className="mb-0.5 size-3 text-muted-foreground" />
                <span className="font-hand text-xs text-ink/70">{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

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
