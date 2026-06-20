import React, { useState, useCallback, useEffect } from 'react';
import { ArrowRight, Search, BookOpen, Filter } from 'lucide-react';
import WobblyCard from '@client/src/components/WobblyCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { knowledge } from '@client/src/api';
import type { KnowledgePoint, KnowledgePointListItem } from '@shared/api.interface';
import KnowledgeDetailPanel from './KnowledgeDetailPanel';

type QueryMode = 'version' | 'search';

const VERSIONS = ['人教版', '北师大版', '苏教版'];
const SUBJECTS = [
  '数学', '语文', '英语', '物理', '化学', '生物', '历史', '地理',
];
const PAGE_SIZE = 20;

const Knowledge: React.FC = () => {
  const [mode, setMode] = useState<QueryMode>('version');
  const [version, setVersion] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [items, setItems] = useState<KnowledgePointListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<KnowledgePoint | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [chapters, setChapters] = useState<string[]>([]);
  const [hasQueried, setHasQueried] = useState(false);

  const fetchList = useCallback(async (fetchPage?: number) => {
    const currentPage = fetchPage ?? page;
    setLoading(true);
    try {
      const res = await knowledge.getKnowledgePoints({
        version: version || undefined,
        subject: subject || undefined,
        chapter: chapter || undefined,
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
  }, [version, subject, chapter, page]);

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

  // Version mode: auto-fetch when filters change, reset to page 1
  useEffect(() => {
    if (mode === 'version' && (version || subject || chapter)) {
      setHasQueried(true);
      setPage(1);
      fetchList(1);
    }
  }, [mode, version, subject, chapter]);

  // Search mode: fetch when keyword changes
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleModeChange = (val: string) => {
    setMode(val as QueryMode);
    setItems([]);
    setTotal(0);
    setPage(1);
    setSelectedId(null);
    setDetail(null);
    setHasQueried(false);
  };

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
        {/* Header */}
        <h1 className="mb-6 font-marker text-3xl font-bold">
          知识点查询
        </h1>

        {/* Search Bar */}
        <WobblyCard
          decoration="tape"
          wobblyIndex={0}
          hoverable={false}
          className="mb-6 p-5"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={mode === 'version' ? 'default' : 'outline'}
                size="sm"
                className="font-hand"
                onClick={() => handleModeChange('version')}
              >
                <Filter className="size-4" />
                按版本查询
              </Button>
              <Button
                variant={mode === 'search' ? 'default' : 'outline'}
                size="sm"
                className="font-hand"
                onClick={() => handleModeChange('search')}
              >
                <Search className="size-4" />
                按知识点搜索
              </Button>
            </div>

            {mode === 'version' ? (
              <div className="flex flex-1 flex-wrap items-center gap-3">
                <Select value={version} onValueChange={setVersion}>
                  <SelectTrigger className="font-hand w-40">
                    <SelectValue placeholder="教材版本" />
                  </SelectTrigger>
                  <SelectContent>
                    {VERSIONS.map((v: string) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="font-hand w-32">
                    <SelectValue placeholder="学科" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s: string) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={chapter} onValueChange={setChapter}>
                  <SelectTrigger className="font-hand w-44">
                    <SelectValue placeholder="章节" />
                  </SelectTrigger>
                  <SelectContent>
                    {chapters.length > 0 ? (
                      chapters.map((c: string) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__none__" disabled>
                        请先选择版本和学科
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex flex-1 items-center gap-3">
                <Input
                  className="font-hand h-10 flex-1"
                  placeholder="输入知识点关键词..."
                  value={searchInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchInput(e.target.value)
                  }
                  onKeyDown={handleKeyDown}
                />
                <Button
                  className="font-hand h-10"
                  onClick={handleSearch}
                  disabled={!searchInput.trim()}
                >
                  <Search className="size-4" />
                  搜索
                </Button>
              </div>
            )}
          </div>
        </WobblyCard>

        {/* Content Area */}
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* List Area */}
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

                {/* Pagination */}
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
                        if (mode === 'search') fetchSearch(keyword, newPage);
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
                        if (mode === 'search') fetchSearch(keyword, newPage);
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

          {/* Detail Panel - Desktop */}
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

          {/* Detail Panel - Mobile/Tablet (< 1024px) */}
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
