import React, { useState, useCallback, useEffect } from 'react';
import { ArrowRight, Search, BookOpen } from 'lucide-react';
import WobblyCard from '@client/src/components/WobblyCard';
import { Button } from '@/components/ui/button';
import { knowledge } from '@client/src/api';
import type { KnowledgePoint, KnowledgePointListItem } from '@shared/api.interface';
import KnowledgeDetailPanel from './KnowledgeDetailPanel';
import KnowledgeFilterPanel, { REGION_VERSION_MAP } from './KnowledgeFilterPanel';

const PAGE_SIZE = 20;

const Knowledge: React.FC = () => {
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [isCustomRegion, setIsCustomRegion] = useState(false);
  const [customRegionText, setCustomRegionText] = useState('');
  const [grade, setGrade] = useState('');
  const [semester, setSemester] = useState('');
  const [subject, setSubject] = useState('__all__');
  const [version, setVersion] = useState('__all__');
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [items, setItems] = useState<KnowledgePointListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<KnowledgePoint | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [chapters, setChapters] = useState<string[]>([]);
  const [hasQueried, setHasQueried] = useState(false);

  const effectiveVersion = version === '__all__'
    ? (province ? REGION_VERSION_MAP[province] || '' : '')
    : version;
  const effectiveSubject = subject === '__all__' ? '' : subject;

  const fetchList = useCallback(async (fetchPage?: number) => {
    const currentPage = fetchPage ?? page;
    setLoading(true);
    try {
      const res = await knowledge.getKnowledgePoints({
        version: effectiveVersion || undefined,
        subject: effectiveSubject || undefined,
        chapter: chapters.length > 0 ? chapters[0] : undefined,
        page: currentPage,
        pageSize: PAGE_SIZE,
      });
      setItems(res.items);
      setTotal(res.total);
      const uniqueChapters = Array.from(
        new Set(res.items.map((item: KnowledgePointListItem) => item.chapter))
      );
      setChapters(uniqueChapters);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [effectiveVersion, effectiveSubject, chapters, page]);

  const fetchSearch = useCallback(async (kw: string, searchPage: number) => {
    if (!kw.trim()) return;
    setLoading(true);
    try {
      const res = await knowledge.searchKnowledgePoints(kw.trim(), searchPage, PAGE_SIZE);
      setItems(res.items);
      setTotal(res.total);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (effectiveVersion || effectiveSubject || grade || semester) {
      setHasQueried(true);
      setPage(1);
      fetchList(1);
    }
  }, [effectiveVersion, effectiveSubject, grade, semester]);

  const handleSearch = () => {
    if (!searchInput.trim()) return;
    const kw = searchInput.trim();
    setKeyword(kw);
    setPage(1);
    setHasQueried(true);
    setSelectedId(null);
    setDetail(null);
    fetchSearch(kw, 1);
  };

  const handleProvinceChange = useCallback((val: string): void => {
    if (val === '__custom__') {
      setIsCustomRegion(true);
    } else {
      setIsCustomRegion(false);
      setProvince(val);
      setCity('');
      setRegion(val);
      const autoVersion = REGION_VERSION_MAP[val];
      if (autoVersion) setVersion(autoVersion);
    }
  }, []);

  const handleCityChange = useCallback((val: string): void => {
    setCity(val);
    const r = [province, val].filter(Boolean).join(' ');
    setRegion(r);
  }, [province]);

  const handleCustomRegionSubmit = useCallback((): void => {
    const trimmed = customRegionText.trim();
    if (!trimmed) return;
    setRegion(trimmed);
    setIsCustomRegion(false);
  }, [customRegionText]);

  const handleSelectItem = async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const res = await knowledge.getKnowledgePoint(id);
      setDetail(res);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-paper-dots p-4 lg:p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 font-marker text-3xl font-bold">
          知识点查询
        </h1>

        <WobblyCard
          decoration="tape"
          wobblyIndex={0}
          hoverable={false}
          className="mb-6 p-5"
        >
          <KnowledgeFilterPanel
            region={region}
            province={province}
            city={city}
            grade={grade}
            semester={semester}
            subject={subject}
            version={version}
            searchInput={searchInput}
            onProvinceChange={handleProvinceChange}
            onCityChange={handleCityChange}
            onGradeChange={setGrade}
            onSemesterChange={setSemester}
            onSubjectChange={setSubject}
            onVersionChange={setVersion}
            onSearchInputChange={setSearchInput}
            onSearch={handleSearch}
            isCustomRegion={isCustomRegion}
            onCustomRegionToggle={() => setIsCustomRegion(!isCustomRegion)}
            customRegionText={customRegionText}
            onCustomRegionTextChange={setCustomRegionText}
            onCustomRegionSubmit={handleCustomRegionSubmit}
          />
        </WobblyCard>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="min-w-0 flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <p className="font-hand text-lg text-muted-foreground">
                  加载中...
                </p>
              </div>
            ) : items.length === 0 && hasQueried ? (
              <div className="flex items-center justify-center py-20">
                <p className="text-center font-hand text-lg text-muted-foreground">
                  未找到匹配的知识点
                </p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <BookOpen className="mb-4 size-12 text-muted-foreground" />
                <p className="text-center font-hand text-lg text-muted-foreground">
                  选择筛选条件或搜索关键词开始查询
                </p>
              </div>
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-hand text-sm text-muted-foreground">
                    共 {total} 条结果
                  </span>
                </div>

                <WobblyCard
                  hoverable={false}
                  wobblyIndex={1}
                  className="overflow-hidden"
                >
                  {items.map(
                    (item: KnowledgePointListItem, idx: number) => (
                      <div
                        key={item.id}
                        className={`group cursor-pointer px-5 py-4 transition-all duration-200 hover:translate-x-1 hover:bg-accent/50 ${
                          idx !== items.length - 1
                            ? 'border-b-2 border-dashed border-ink/20'
                            : ''
                        } ${
                          selectedId === item.id
                            ? 'bg-accent'
                            : ''
                        }`}
                        onClick={() => handleSelectItem(item.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-marker text-base font-bold group-hover:text-marker-red">
                              {item.name}
                            </h3>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              <span className="inline-block rounded-sm border border-ink/40 bg-postit-yellow/60 px-1.5 py-0.5 font-hand text-xs -rotate-1">
                                {item.version}
                              </span>
                              <span className="inline-block rounded-sm border border-ink/40 bg-pen-blue/10 px-1.5 py-0.5 font-hand text-xs rotate-1">
                                {item.subject}
                              </span>
                              <span className="inline-block rounded-sm border border-ink/40 bg-accent px-1.5 py-0.5 font-hand text-xs -rotate-0.5">
                                {item.chapter}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="ml-3 size-5 shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:text-marker-red" />
                        </div>
                      </div>
                    )
                  )}
                </WobblyCard>

                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-hand"
                      disabled={page <= 1}
                      onClick={() => {
                        const newPage = page - 1;
                        setPage(newPage);
                        if (keyword) fetchSearch(keyword, newPage);
                        else fetchList(newPage);
                      }}
                    >
                      上一页
                    </Button>
                    <span className="font-hand text-sm text-muted-foreground">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-hand"
                      disabled={page >= totalPages}
                      onClick={() => {
                        const newPage = page + 1;
                        setPage(newPage);
                        if (keyword) fetchSearch(keyword, newPage);
                        else fetchList(newPage);
                      }}
                    >
                      下一页
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="hidden w-96 shrink-0 lg:block">
            <div className="sticky top-6">
              <WobblyCard
                hoverable={false}
                wobblyIndex={2}
                className="p-5"
              >
                <KnowledgeDetailPanel
                  detail={detail}
                  loading={detailLoading}
                />
              </WobblyCard>
            </div>
          </div>

          {selectedId && (
            <div className="lg:hidden">
              <WobblyCard
                hoverable={false}
                wobblyIndex={2}
                className="p-5"
              >
                <KnowledgeDetailPanel
                  detail={detail}
                  loading={detailLoading}
                />
              </WobblyCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Knowledge;
