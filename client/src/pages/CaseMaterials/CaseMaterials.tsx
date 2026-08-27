import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Images,
  LibraryBig,
  MessageSquareText,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';
import WobblyCard from '@client/src/components/WobblyCard';
import { useRequiredStage } from '@client/src/hooks/use-stage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import caseMaterialsData from '@client/src/data/case-materials.json';

interface CaseMaterial {
  id: string;
  images: string[];
  title: string;
  manualTag: string;
  stage: string;
  grade: string;
  imageType: string;
  aiTags: string[];
  keywords: string[];
  scenario: string;
  pitch: string;
  evidence: string;
  summary: string;
  value: string;
  status: string;
}

interface RankedMaterial extends CaseMaterial {
  relevance: number;
}

const SOURCE_BASE_URL =
  'https://guanghe.feishu.cn/wiki/HdqqwpMKbi0pmvkhWWQcXLtNnOd?table=tbl8Xeiesb4nJkn6&view=vewc8sRCjT';
const PAGE_SIZE = 12;
const MATERIALS: CaseMaterial[] = caseMaterialsData;

const SEARCH_EXPANSIONS: Array<[string[], string[]]> = [
  [['价格', '太贵', '值不值'], ['物超所值', '费用', '预算', '异议']],
  [['提分', '涨分'], ['成绩提升', '进步', '中考成绩', '录取']],
  [['不主动', '没动力'], ['主动学习', '自律', '学习习惯', '坚持']],
  [['补基础', '听不懂'], ['查漏补缺', '知识点', '薄弱点', '补漏']],
  [['辅导班', '补课'], ['竞品对比', '线下班', '一对一']],
  [['家长沟通', '没钱'], ['父母', '妈妈', '爸爸', '学生没钱']],
];

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/gu, ' ').trim();
}

function buildSearchTerms(query: string): string[] {
  const normalized = normalizeText(query);
  const terms = new Set(normalized.split(/[\s，,。！？!、]+/u).filter(Boolean));
  for (const [triggers, related] of SEARCH_EXPANSIONS) {
    if (triggers.some((trigger) => normalized.includes(trigger))) {
      related.forEach((term) => terms.add(normalizeText(term)));
    }
  }
  return [...terms];
}

function scoreMaterial(material: CaseMaterial, query: string): number {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return 1;
  const terms = buildSearchTerms(normalizedQuery);
  const fields: Array<[string, number]> = [
    [material.manualTag, 90],
    [material.title, 70],
    [material.pitch, 55],
    [material.scenario, 48],
    [material.evidence, 42],
    [material.aiTags.join(' '), 38],
    [material.keywords.join(' '), 32],
    [material.summary, 24],
    [material.imageType, 20],
  ];
  return fields.reduce((total, [text, weight]) => {
    const normalizedField = normalizeText(text);
    if (!normalizedField) return total;
    const exact = normalizedField.includes(normalizedQuery) ? weight : 0;
    const related = terms.reduce(
      (sum, term) => sum + (normalizedField.includes(term) ? Math.max(3, weight / 5) : 0),
      0,
    );
    return total + exact + related;
  }, 0);
}

function buildShareText(material: CaseMaterial): string {
  return material.pitch.trim()
    || material.manualTag.trim()
    || material.summary.trim()
    || '您可以先看一下这个真实案例。';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&#039;');
}

async function writeRichClipboard(material: CaseMaterial, includeText: boolean): Promise<void> {
  const text = includeText ? buildShareText(material) : material.images.join('\n');
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    return;
  }
  const paragraphs = includeText
    ? `<p style="line-height:1.7">${escapeHtml(buildShareText(material)).replace(/\n/gu, '<br>')}</p>`
    : '';
  const images = material.images
    .map((url) => new URL(url, window.location.origin).toString())
    .map((url) => `<img src="${escapeHtml(url)}" style="display:block;max-width:720px;width:100%;margin:10px 0" />`)
    .join('');
  const html = `<div>${paragraphs}${images}</div>`;
  await navigator.clipboard.write([
    new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([text], { type: 'text/plain' }),
    }),
  ]);
}

const CaseMaterials: React.FC = () => {
  const { stageConfig } = useRequiredStage();
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState(stageConfig.label);
  const [grade, setGrade] = useState('');
  const [imageType, setImageType] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState('');

  useEffect(() => {
    setStage(stageConfig.label);
    setGrade('');
    setPage(1);
  }, [stageConfig.label]);

  const grades = useMemo(
    () => [...new Set(MATERIALS.filter((item) => !stage || item.stage === stage)
      .map((item) => item.grade)
      .filter(Boolean))],
    [stage],
  );
  const imageTypes = useMemo(
    () => [...new Set(MATERIALS.map((item) => item.imageType).filter(Boolean))],
    [],
  );
  const commonTags = useMemo(() => {
    const counts = new Map<string, number>();
    MATERIALS.forEach((item) => item.aiTags.forEach((tag) => {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }));
    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  }, []);

  const results = useMemo<RankedMaterial[]>(() => MATERIALS
    .map((item) => ({ ...item, relevance: scoreMaterial(item, query) }))
    .filter((item) => {
      if (stage && item.stage !== stage && item.stage !== '通用') return false;
      if (grade && item.grade !== grade) return false;
      if (imageType && item.imageType !== imageType) return false;
      if (selectedTag && !item.aiTags.includes(selectedTag)) return false;
      if (query.trim() && item.relevance <= 0) return false;
      return true;
    })
    .sort((left, right) => right.relevance - left.relevance), [
      grade,
      imageType,
      query,
      selectedTag,
      stage,
    ]);
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const visibleResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, stage, grade, imageType, selectedTag]);

  const copyText = async (material: CaseMaterial): Promise<void> => {
    try {
      await navigator.clipboard.writeText(buildShareText(material));
      setCopiedId(material.id);
      toast.success('推荐话术已复制');
      window.setTimeout(() => setCopiedId(''), 1600);
    } catch {
      toast.error('复制失败，请手动选择话术');
    }
  };

  const copyPackage = async (
    material: CaseMaterial,
    includeText: boolean,
  ): Promise<void> => {
    try {
      await writeRichClipboard(material, includeText);
      toast.success(includeText ? '案例图文已复制' : '案例图片已复制');
    } catch {
      try {
        await navigator.clipboard.writeText(buildShareText(material));
        toast.warning('图片复制受浏览器限制，已复制推荐话术');
      } catch {
        toast.error('复制失败，请检查浏览器剪贴板权限');
      }
    }
  };

  const clearFilters = (): void => {
    setQuery('');
    setStage(stageConfig.label);
    setGrade('');
    setImageType('');
    setSelectedTag('');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-marker flex items-center gap-2 text-3xl font-bold text-ink">
            <LibraryBig className="size-7 text-pen-blue" />
            案例素材库
          </h1>
          <p className="font-hand mt-1 text-sm text-muted-foreground">
            检索真实案例、推荐话术与沟通证据，当前默认展示{stageConfig.label}素材
          </p>
        </div>
        <Button variant="outline" size="sm" className="font-hand" asChild>
          <UniversalLink to={SOURCE_BASE_URL} target="_blank" rel="noreferrer">
            <ExternalLink className="mr-1 size-4" />
            打开素材原表
          </UniversalLink>
        </Button>
      </header>

      <WobblyCard variant="white" decoration="tape" wobblyIndex={0} hoverable={false}>
        <div className="space-y-3 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/45" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索：价格贵、中考提分、孩子主动学习、补基础、竞品对比"
              className="h-11 pl-9"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={stage}
              onChange={(event) => { setStage(event.target.value); setGrade(''); }}
              className="h-10 rounded-md border-2 border-ink bg-white px-3 font-hand text-sm"
              aria-label="所属学段"
            >
              <option value="">全部学段</option>
              <option value="小学">小学</option>
              <option value="初中">初中</option>
              <option value="高中">高中</option>
            </select>
            <select
              value={grade}
              onChange={(event) => setGrade(event.target.value)}
              className="h-10 rounded-md border-2 border-ink bg-white px-3 font-hand text-sm"
              aria-label="具体年级"
            >
              <option value="">全部年级</option>
              {grades.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select
              value={imageType}
              onChange={(event) => setImageType(event.target.value)}
              className="h-10 rounded-md border-2 border-ink bg-white px-3 font-hand text-sm"
              aria-label="案例类型"
            >
              <option value="">全部案例类型</option>
              {imageTypes.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <Button type="button" variant="ghost" className="font-hand" onClick={clearFilters}>
              <X className="mr-1 size-4" />清空筛选
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {commonTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag((current) => current === tag ? '' : tag)}
                className={`border-2 border-ink px-2.5 py-1 font-hand text-xs transition-transform hover:-translate-y-0.5 ${
                  selectedTag === tag ? 'bg-postit-yellow font-bold' : 'bg-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </WobblyCard>

      <div className="flex items-center justify-between gap-3">
        <p className="font-hand text-sm text-ink/65">
          找到 <strong className="text-ink">{results.length}</strong> 条素材
        </p>
        <p className="font-hand text-xs text-muted-foreground">
          数据来源：飞书图片素材库，共 {MATERIALS.length} 条
        </p>
      </div>

      {visibleResults.length ? (
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleResults.map((material, index) => (
            <WobblyCard
              key={material.id}
              variant="white"
              wobblyIndex={index + 1}
              hoverable
              className="overflow-hidden"
            >
              <div className="flex max-h-[360px] min-h-[220px] snap-x gap-2 overflow-x-auto bg-accent/45 p-3">
                {material.images.map((imageUrl, imageIndex) => (
                  <img
                    key={imageUrl}
                    src={imageUrl}
                    alt={`${material.title} 第${imageIndex + 1}张`}
                    loading="lazy"
                    className="max-h-[330px] min-w-full snap-center object-contain"
                  />
                ))}
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <h2 className="font-marker text-lg font-bold leading-snug text-ink">
                    {material.title}
                  </h2>
                  <p className="font-hand mt-1 line-clamp-2 text-sm text-ink/65">
                    {material.manualTag || material.summary}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="border border-pen-blue/35 bg-pen-blue/5 px-2 py-0.5 font-hand text-xs text-pen-blue">
                    {[material.stage, material.grade].filter(Boolean).join(' · ')}
                  </span>
                  <span className="border border-marker-red/30 bg-marker-red/5 px-2 py-0.5 font-hand text-xs text-marker-red">
                    {material.imageType}
                  </span>
                  {material.aiTags.slice(0, 3).map((tag) => (
                    <span key={tag} className="border border-ink/20 bg-accent px-2 py-0.5 font-hand text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
                {material.scenario && (
                  <p className="font-hand line-clamp-2 text-xs text-ink/55">
                    适用：{material.scenario}
                  </p>
                )}
                <div className="border-l-[3px] border-pen-blue bg-pen-blue/5 p-3">
                  <p className="font-hand line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-ink/80">
                    {buildShareText(material)}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="px-2 font-hand text-xs"
                    onClick={() => copyPackage(material, false)}
                  >
                    <Images className="mr-1 size-3.5" />图片
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="px-2 font-hand text-xs"
                    onClick={() => copyText(material)}
                  >
                    {copiedId === material.id
                      ? <Check className="mr-1 size-3.5" />
                      : <MessageSquareText className="mr-1 size-3.5" />}
                    话术
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="px-2 font-hand text-xs"
                    onClick={() => copyPackage(material, true)}
                  >
                    <Copy className="mr-1 size-3.5" />图文
                  </Button>
                </div>
              </div>
            </WobblyCard>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-ink/20 bg-white/70 py-16 text-center">
          <Search className="mx-auto size-8 text-ink/35" />
          <p className="font-marker mt-3 text-lg font-bold">没有匹配的案例</p>
          <p className="font-hand mt-1 text-sm text-muted-foreground">换一个关键词或清空筛选条件</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pb-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            上一页
          </Button>
          <span className="font-hand text-sm">{page} / {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
};

export default CaseMaterials;
