import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Archive, CalendarDays, FileText, Loader2, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { caseArchive as caseArchiveApi } from '@client/src/api';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@client/src/components/ui/alert-dialog';
import { Streamdown } from '@client/src/components/ui/streamdown';
import WobblyCard from '@client/src/components/WobblyCard';
import type {
  CaseArchiveListItem,
  CaseArchiveRecord,
  CaseArtifactType,
} from '@shared/api.interface';

const ARTIFACT_LABELS: Record<CaseArtifactType, string> = {
  diagnosis: '学情诊断',
  study_plan: '执行课表',
  advice: '个性化话术',
};

function getDateGroup(value: string): string {
  const date = new Date(value);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.floor((today.getTime() - target.getTime()) / 86400000);
  if (dayDiff === 0) return '今天';
  if (dayDiff === 1) return '昨天';
  if (dayDiff < 7) return '本周';
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

const History: React.FC = () => {
  const [items, setItems] = useState<CaseArchiveListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [artifactType, setArtifactType] = useState<string>('all');
  const [stage, setStage] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<CaseArchiveRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CaseArchiveListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadArchives = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await caseArchiveApi.getCaseArchives({
        pageSize: 100,
        search: search.trim() || undefined,
        stage: stage === 'all' ? undefined : stage,
        artifactType:
          artifactType === 'all' ? undefined : (artifactType as CaseArtifactType),
      });
      setItems(response.items);
      setTotal(response.total);
    } catch {
      toast.error('历史档案加载失败');
    } finally {
      setLoading(false);
    }
  }, [artifactType, search, stage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadArchives();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadArchives]);

  const groups = useMemo(() => {
    const grouped = new Map<string, CaseArchiveListItem[]>();
    for (const item of items) {
      const key = getDateGroup(item.createdAt);
      grouped.set(key, [...(grouped.get(key) || []), item]);
    }
    return Array.from(grouped.entries());
  }, [items]);

  const openDetail = useCallback(async (id: string): Promise<void> => {
    setDetailLoading(true);
    try {
      setDetail(await caseArchiveApi.getCaseArchive(id));
    } catch {
      toast.error('历史内容加载失败');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const confirmDelete = useCallback(async (): Promise<void> => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await caseArchiveApi.deleteCaseArchive(deleteTarget.id);
      setDeleteTarget(null);
      if (detail?.id === deleteTarget.id) setDetail(null);
      toast.success('历史记录已删除');
      await loadArchives();
    } catch {
      toast.error('删除失败');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, detail?.id, loadArchives]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">历史档案</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          诊断、执行课表和个性化话术生成完成后自动归档
        </p>
      </div>

      <WobblyCard variant="white" wobblyIndex={0} hoverable={false} className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索学生、目标学校或报告标题"
              className="pl-9"
            />
          </div>
          <Select value={artifactType} onValueChange={setArtifactType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部内容</SelectItem>
              <SelectItem value="diagnosis">学情诊断</SelectItem>
              <SelectItem value="study_plan">执行课表</SelectItem>
              <SelectItem value="advice">个性化话术</SelectItem>
            </SelectContent>
          </Select>
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部学段</SelectItem>
              <SelectItem value="elementary">小学</SelectItem>
              <SelectItem value="middle">初中</SelectItem>
              <SelectItem value="high">高中</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </WobblyCard>

      <div className="flex items-center gap-2 text-sm text-ink/65">
        <Archive className="size-4" />
        共 {total} 份历史内容
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          正在加载历史档案...
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center text-muted-foreground">
          <Archive className="mb-3 size-12 opacity-30" />
          <p>暂无匹配的历史内容</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([group, groupItems]) => (
            <section key={group}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink/70">
                <CalendarDays className="size-4" />
                {group}
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {groupItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex min-w-0 items-start gap-3 rounded-md border-2 border-ink/20 bg-white p-4"
                  >
                    <FileText className="mt-1 size-5 shrink-0 text-pen-blue" />
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => void openDetail(item.id)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-ink">{item.studentName}</span>
                        <span className="text-xs text-pen-blue">
                          {ARTIFACT_LABELS[item.artifactType]}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-ink/75">{item.title}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {[item.grade, item.region, item.targetSchool].filter(Boolean).join(' · ')}
                        {' · '}{formatTime(item.createdAt)}
                      </p>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="删除记录"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 className="size-4 text-marker-red" />
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Dialog open={detail != null || detailLoading} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto border-[3px] border-ink">
          <DialogHeader>
            <DialogTitle>{detail?.title || '正在加载...'}</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
          ) : detail ? (
            <>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{detail.studentName}</span>
                <span>{detail.grade}</span>
                <span>{detail.region}</span>
                {detail.targetSchool ? <span>目标：{detail.targetSchool}</span> : null}
                <span>{formatTime(detail.createdAt)}</span>
              </div>
              <div className="report-readable prose prose-sm max-w-none">
                <Streamdown>{detail.content}</Streamdown>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除这份历史记录？</AlertDialogTitle>
            <AlertDialogDescription>
              将删除“{deleteTarget?.studentName} · {deleteTarget?.title}”，删除后无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDelete()}
              disabled={deleting}
              className="bg-marker-red text-white"
            >
              {deleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default History;
