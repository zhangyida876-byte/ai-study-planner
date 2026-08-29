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
import CaseMaterialMultiFilter from './CaseMaterialMultiFilter';
import {
  matchesCaseMaterialTags,
  scoreCaseMaterial,
  violatesCaseMaterialProtectedTerm,
} from '@client/src/utils/case-material-search';
import { copyCaseMaterialImages } from '@client/src/utils/case-material-clipboard';

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
  focus?: string;
  searchText?: string;
  status: string;
}

interface RankedMaterial extends CaseMaterial {
  relevance: number;
}

const SOURCE_BASE_URL =
  'https://guanghe.feishu.cn/wiki/HdqqwpMKbi0pmvkhWWQcXLtNnOd?table=tbl8Xeiesb4nJkn6&view=vewc8sRCjT';
const PAGE_SIZE = 12;
const MATERIALS: CaseMaterial[] = caseMaterialsData;

function buildShareText(material: CaseMaterial): string {
  return material.pitch.trim()
    || material.manualTag.trim()
    || material.summary.trim()
    || '您可以先看一下这个真实案例。';
}

async function writeRichClipboard(material: CaseMaterial, includeText: boolean): Promise<void> {
  await copyCaseMaterialImages({
    imageUrls: material.images,
    text: buildShareText(material),
    includeText,
  });
}

const CaseMaterials: React.FC = () => {
  const { stageConfig } = useRequiredStage();
  const [query, setQuery] = useState('');
  const [selectedStages, setSelectedStages] = useState<string[]>([stageConfig.label]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedImageTypes, setSelectedImageTypes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState('');

  useEffect(() => {
    setSelectedStages([stageConfig.label]);
    setSelectedGrades([]);
    setPage(1);
  }, [stageConfig.label]);

  const grades = useMemo(
    () => [...new Set(MATERIALS.filter((item) => (
      selectedStages.length === 0
      || item.stage === '通用'
      || selectedStages.includes(item.stage)
    ))
      .map((item) => item.grade)
      .filter(Boolean))],
    [selectedStages],
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
    .map((item) => ({ ...item, relevance: scoreCaseMaterial(item, query) }))
    .filter((item) => {
      if (selectedStages.length && item.stage !== '通用' && !selectedStages.includes(item.stage)) return false;
      if (selectedGrades.length && !selectedGrades.includes(item.grade)) return false;
      if (selectedImageTypes.length && !selectedImageTypes.includes(item.imageType)) return false;
      if (!matchesCaseMaterialTags(item, selectedTags)) return false;
      if (violatesCaseMaterialProtectedTerm(item, query)) return false;
      if (query.trim() && item.relevance <= 0) return false;
      return true;
    })
    .sort((left, right) => right.relevance - left.relevance), [
      query,
      selectedGrades,
      selectedImageTypes,
      selectedStages,
      selectedTags,
    ]);
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const visibleResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, selectedStages, selectedGrades, selectedImageTypes, selectedTags]);

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
      if (!includeText) {
        toast.error('图片复制失败，请检查浏览器剪贴板权限后重试');
        return;
      }
      try {
        await navigator.clipboard.writeText(buildShareText(material));
        toast.warning('图文复制受浏览器限制，本次仅复制了推荐话术');
      } catch {
        toast.error('复制失败，请检查浏览器剪贴板权限');
      }
    }
  };

  const clearFilters = (): void => {
    setQuery('');
    setSelectedStages([stageConfig.label]);
    setSelectedGrades([]);
    setSelectedImageTypes([]);
    setSelectedTags([]);
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
            <CaseMaterialMultiFilter
              label="学段"
              options={['小学', '初中', '高中']}
              selected={selectedStages}
              onChange={(next) => {
                setSelectedStages(next);
                setSelectedGrades([]);
              }}
            />
            <CaseMaterialMultiFilter
              label="年级"
              options={grades}
              selected={selectedGrades}
              onChange={setSelectedGrades}
            />
            <CaseMaterialMultiFilter
              label="案例类型"
              options={imageTypes}
              selected={selectedImageTypes}
              onChange={setSelectedImageTypes}
            />
            <Button type="button" variant="ghost" className="font-hand" onClick={clearFilters}>
              <X className="mr-1 size-4" />清空筛选
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {commonTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTags((current) => (
                  current.includes(tag)
                    ? current.filter((item) => item !== tag)
                    : [...current, tag]
                ))}
                className={`border-2 border-ink px-2.5 py-1 font-hand text-xs transition-transform hover:-translate-y-0.5 ${
                  selectedTags.includes(tag) ? 'bg-postit-yellow font-bold' : 'bg-white'
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
