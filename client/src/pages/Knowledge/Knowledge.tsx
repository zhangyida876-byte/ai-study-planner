import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Layers, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import WobblyCard from '@client/src/components/WobblyCard';
import { Button } from '@/components/ui/button';
import { knowledge } from '@client/src/api';
import type { KnowledgePoint, KnowledgePointListItem, ChapterUnit } from '@shared/api.interface';
import KnowledgeDetailPanel from './KnowledgeDetailPanel';
import KnowledgeFilterPanel, { REGION_VERSION_MAP, getVersionForProvinceSubject } from './KnowledgeFilterPanel';
import { useRequiredStage } from '@client/src/hooks/use-stage';
import { useStageProfile } from '@client/src/hooks/use-stage-profile';
import ProfileAutofillBanner from '@client/src/components/ProfileAutofillBanner';
import { getKnowledgeAutofillFromProfile } from '@client/src/utils/stage-profile-sync';
import { stagePath } from '@client/src/config/stages';
import { loadModuleSession, saveModuleSession } from '@client/src/utils/module-session';

const PAGE_SIZE = 20;

interface KnowledgeSessionState {
  province: string;
  city: string;
  region: string;
  isCustomRegion: boolean;
  customRegionText: string;
  grade: string;
  semester: string;
  subject: string;
  version: string;
  searchInput: string;
  keyword: string;
  selectedChapter: string;
}

const Knowledge: React.FC = () => {
  const { stageSlug, stageConfig } = useRequiredStage();
  const { profile, regionText, updateProfile } = useStageProfile(stageSlug);
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [isCustomRegion, setIsCustomRegion] = useState(false);
  const [customRegionText, setCustomRegionText] = useState('');
  const [grade, setGrade] = useState('');
  const [profileDirty, setProfileDirty] = useState(false);
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
  const [selectedChapter, setSelectedChapter] = useState('');
  const [chapterUnits, setChapterUnits] = useState<ChapterUnit[]>([]);
  const [hasQueried, setHasQueried] = useState(false);
  const hydratedRef = useRef(false);
  const applyingProfileRef = useRef(false);

  const effectiveVersion = version === '__all__'
    ? (province ? REGION_VERSION_MAP[province] || '' : '')
    : version;
  const effectiveSubject = subject === '__all__' ? '' : subject;

  const fetchList = useCallback(async (fetchPage?: number) => {
    const currentPage = fetchPage ?? page;
    setLoading(true);
    try {
      const params: {
        version?: string;
        subject?: string;
        chapter?: string;
        grade?: string;
        semester?: string;
        page: number;
        pageSize: number;
      } = {
        page: currentPage,
        pageSize: PAGE_SIZE,
      };
      if (effectiveVersion) params.version = effectiveVersion;
      if (effectiveSubject) params.subject = effectiveSubject;
      if (selectedChapter) params.chapter = selectedChapter;
      if (grade) params.grade = grade;
      if (semester) params.semester = semester;

      const res = await knowledge.getKnowledgePoints(params);
      setItems(res.items);
      setTotal(res.total);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [effectiveVersion, effectiveSubject, selectedChapter, grade, semester, page]);

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

  const fetchFilteredSearch = useCallback(async (kw: string, searchPage: number) => {
    if (!kw.trim()) return;
    setLoading(true);
    try {
      const params: {
        version?: string;
        subject?: string;
        chapter?: string;
        grade?: string;
        semester?: string;
        keyword: string;
        page: number;
        pageSize: number;
      } = {
        keyword: kw.trim(),
        page: searchPage,
        pageSize: PAGE_SIZE,
      };
      if (effectiveVersion) params.version = effectiveVersion;
      if (effectiveSubject) params.subject = effectiveSubject;
      if (selectedChapter) params.chapter = selectedChapter;
      if (grade) params.grade = grade;
      if (semester) params.semester = semester;

      const res = await knowledge.searchKnowledgePointsFiltered(params);
      setItems(res.items);
      setTotal(res.total);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [effectiveVersion, effectiveSubject, selectedChapter, grade, semester]);

  useEffect(() => {
    if (effectiveVersion || effectiveSubject || grade || semester) {
      setHasQueried(true);
      setPage(1);
      setSelectedChapter('');
      fetchList(1);
    }
  }, [effectiveVersion, effectiveSubject, grade, semester]);

  useEffect(() => {
    if (selectedChapter) {
      setPage(1);
      fetchList(1);
    }
  }, [selectedChapter]);

  useEffect(() => {
    if (items.length === 0 && hasQueried && !loading && (effectiveVersion || effectiveSubject || grade)) {
      knowledge.getChapters({
        version: effectiveVersion || undefined,
        subject: effectiveSubject || undefined,
        grade: grade || undefined,
      }).then((res) => setChapterUnits(res.items)).catch(() => setChapterUnits([]));
    } else {
      setChapterUnits([]);
    }
  }, [items.length, hasQueried, loading, effectiveVersion, effectiveSubject, grade]);

  useEffect(() => {
    const cached = loadModuleSession<KnowledgeSessionState>(stageSlug, 'knowledge');
    if (!cached) return;
    setProvince(cached.province || '');
    setCity(cached.city || '');
    setRegion(cached.region || '');
    setIsCustomRegion(Boolean(cached.isCustomRegion));
    setCustomRegionText(cached.customRegionText || '');
    setGrade(cached.grade || '');
    setSemester(cached.semester || '');
    setSubject(cached.subject || '__all__');
    setVersion(cached.version || '__all__');
    setSearchInput(cached.searchInput || '');
    setKeyword(cached.keyword || '');
    setSelectedChapter(cached.selectedChapter || '');
    hydratedRef.current = true;
  }, [stageSlug]);

  useEffect(() => {
    if (!profile.updatedAt) return;
    applyingProfileRef.current = true;
    const fill = getKnowledgeAutofillFromProfile(profile);
    setProvince(fill.province || '');
    setCity(fill.city || '');
    if (fill.region) {
      setRegion(fill.region);
      setIsCustomRegion(false);
      setCustomRegionText('');
    } else {
      setRegion('');
    }
    setGrade(fill.grade || '');
    queueMicrotask(() => {
      applyingProfileRef.current = false;
      hydratedRef.current = true;
    });
  }, [profile.updatedAt, profile]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (applyingProfileRef.current) return;
    saveModuleSession<KnowledgeSessionState>(stageSlug, 'knowledge', {
      province,
      city,
      region,
      isCustomRegion,
      customRegionText,
      grade,
      semester,
      subject,
      version,
      searchInput,
      keyword,
      selectedChapter,
    });
  }, [
    stageSlug,
    province,
    city,
    region,
    isCustomRegion,
    customRegionText,
    grade,
    semester,
    subject,
    version,
    searchInput,
    keyword,
    selectedChapter,
  ]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (applyingProfileRef.current) return;
    if (!profileDirty) return;
    const timer = setTimeout(() => {
      updateProfile({
        province,
        city,
        grade,
      });
      setProfileDirty(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [updateProfile, province, city, grade, profileDirty]);

  const handleSyncProfileBack = useCallback(() => {
    updateProfile({
      province,
      city,
      grade,
    });
    toast.success('已同步回学段主页档案');
    setProfileDirty(false);
  }, [updateProfile, province, city, grade]);

  const handleSearch = () => {
    if (!searchInput.trim()) return;
    const kw = searchInput.trim();
    setKeyword(kw);
    setPage(1);
    setHasQueried(true);
    setSelectedId(null);
    setDetail(null);
    setSelectedChapter('');
    if (effectiveVersion || effectiveSubject || grade || semester) {
      fetchFilteredSearch(kw, 1);
    } else {
      fetchSearch(kw, 1);
    }
  };

  const handleSelectChapter = useCallback((chapter: string): void => {
    setSelectedChapter(chapter);
    setPage(1);
    setKeyword('');
    setSearchInput('');
    setSelectedId(null);
    setDetail(null);
  }, []);

  const handleProvinceChange = useCallback((val: string): void => {
    setProfileDirty(true);
    if (val === '__custom__') {
      setIsCustomRegion(true);
    } else {
      setIsCustomRegion(false);
      setProvince(val);
      setCity('');
      setRegion(val);
      const effectiveSubj = subject === '__all__' ? '' : subject;
      const autoVersion = effectiveSubj
        ? getVersionForProvinceSubject(val, effectiveSubj)
        : REGION_VERSION_MAP[val];
      if (autoVersion) setVersion(autoVersion);
    }
  }, [subject]);

  const handleSubjectChange = useCallback((val: string): void => {
    setSubject(val);
    const effectiveSubj = val === '__all__' ? '' : val;
    if (province && effectiveSubj) {
      const autoVersion = getVersionForProvinceSubject(province, effectiveSubj);
      if (autoVersion) setVersion(autoVersion);
    }
  }, [province]);

  const handleCityChange = useCallback((val: string): void => {
    setProfileDirty(true);
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

  const handleReset = useCallback((): void => {
    setProvince('');
    setCity('');
    setRegion('');
    setIsCustomRegion(false);
    setCustomRegionText('');
    setGrade('');
    setSemester('');
    setSubject('__all__');
    setVersion('__all__');
    setSearchInput('');
    setKeyword('');
    setItems([]);
    setTotal(0);
    setPage(1);
    setSelectedId(null);
    setDetail(null);
    setSelectedChapter('');
    setChapterUnits([]);
    setHasQueried(false);
  }, []);

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
        <Button variant="ghost" size="sm" className="font-hand mb-2 -ml-2" asChild>
          <Link to={stagePath(stageSlug)}>
            <ArrowLeft className="mr-1 size-4" />
            返回{stageConfig.label}主页
          </Link>
        </Button>
        <h1 className="mb-2 font-marker text-3xl font-bold">
          {stageConfig.label} · 知识点查询
        </h1>
        <p className="font-hand mb-4 text-sm text-muted-foreground">
          按地区/年级/版本查询，或输入知识点反向检索
        </p>

        <ProfileAutofillBanner
          stageSlug={stageSlug}
          profile={profile}
          regionText={regionText}
          showSyncBack={profileDirty}
          onSyncBack={handleSyncProfileBack}
        />

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
            autoVersion={province && subject !== '__all__' ? getVersionForProvinceSubject(province, subject === '__all__' ? '' : subject) : province ? REGION_VERSION_MAP[province] : undefined}
            onProvinceChange={handleProvinceChange}
            onCityChange={handleCityChange}
            onGradeChange={(g) => { setProfileDirty(true); setGrade(g); }}
            onSemesterChange={setSemester}
            onSubjectChange={handleSubjectChange}
            onVersionChange={setVersion}
            onSearchInputChange={setSearchInput}
            onSearch={handleSearch}
            onReset={handleReset}
            isCustomRegion={isCustomRegion}
            onCustomRegionToggle={() => setIsCustomRegion(!isCustomRegion)}
            customRegionText={customRegionText}
            onCustomRegionTextChange={setCustomRegionText}
            onCustomRegionSubmit={handleCustomRegionSubmit}
            allowedGrades={stageConfig.knowledgeGrades}
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
              <div>
                {chapterUnits.length > 0 ? (
                  <>
                    <div className="mb-3 flex items-center gap-2">
                      <Layers className="size-4 text-pen-blue" />
                      <span className="font-marker text-sm font-bold text-ink">
                        当前筛选下未找到精确匹配，以下是可用的章节单元：
                      </span>
                    </div>
                    <WobblyCard
                      hoverable={false}
                      wobblyIndex={1}
                      className="overflow-hidden"
                    >
                      {chapterUnits.map((unit: ChapterUnit, idx: number) => (
                        <div
                          key={`${unit.subject}-${unit.chapter}`}
                          className="group cursor-pointer px-5 py-3 transition-all duration-200 hover:translate-x-1 hover:bg-accent/50"
                          style={{ borderBottom: idx !== chapterUnits.length - 1 ? '2px dashed rgba(45,45,45,0.2)' : 'none' }}
                          onClick={() => handleSelectChapter(unit.chapter)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-marker text-sm font-bold group-hover:text-marker-red">
                                {unit.chapter}
                              </h3>
                              <div className="mt-1 flex items-center gap-2">
                                <span className="inline-block rounded-sm border border-ink/40 bg-pen-blue/10 px-1.5 py-0.5 font-hand text-xs rotate-1">
                                  {unit.subject}
                                </span>
                                <span className="font-hand text-xs text-muted-foreground">
                                  {unit.count} 个知识点
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="ml-3 size-4 shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:text-marker-red" />
                          </div>
                        </div>
                      ))}
                    </WobblyCard>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16">
                    <BookOpen className="mb-3 size-10 text-muted-foreground/40" />
                    <p className="text-center font-marker text-lg font-bold text-ink">
                      当前筛选条件下暂无知识点
                    </p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      {effectiveSubject && (
                        <span className="rounded-sm border-2 border-marker-red/40 bg-marker-red/5 px-2 py-1 font-hand text-xs text-marker-red">
                          学科：{effectiveSubject}
                        </span>
                      )}
                      {effectiveVersion && (
                        <span className="rounded-sm border-2 border-pen-blue/40 bg-pen-blue/5 px-2 py-1 font-hand text-xs text-pen-blue">
                          版本：{effectiveVersion}
                        </span>
                      )}
                      {grade && (
                        <span className="rounded-sm border-2 border-ink/20 bg-accent/50 px-2 py-1 font-hand text-xs">
                          年级：{grade}
                        </span>
                      )}
                    </div>
                    <p className="mt-4 text-center font-hand text-sm text-muted-foreground">
                      请尝试切换学科、版本或年级，或直接搜索关键词
                    </p>
                  </div>
                )}
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
                  <div className="flex items-center gap-2">
                    <span className="font-hand text-sm text-muted-foreground">
                      共 {total} 条结果
                    </span>
                    {selectedChapter && (
                      <span className="inline-flex items-center gap-1 rounded-sm border border-ink/40 bg-postit-yellow/60 px-2 py-0.5 font-hand text-xs">
                        {selectedChapter}
                        <button
                          type="button"
                          onClick={() => { setSelectedChapter(''); setPage(1); fetchList(1); }}
                          className="ml-1 text-ink/50 hover:text-marker-red"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
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
                        if (keyword) {
                          if (effectiveVersion || effectiveSubject) {
                            fetchFilteredSearch(keyword, newPage);
                          } else {
                            fetchSearch(keyword, newPage);
                          }
                        } else {
                          fetchList(newPage);
                        }
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
                        if (keyword) {
                          if (effectiveVersion || effectiveSubject) {
                            fetchFilteredSearch(keyword, newPage);
                          } else {
                            fetchSearch(keyword, newPage);
                          }
                        } else {
                          fetchList(newPage);
                        }
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
                  stageSlug={stageSlug}
                  profile={profile}
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
                  stageSlug={stageSlug}
                  profile={profile}
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
