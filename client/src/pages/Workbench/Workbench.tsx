import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, School } from 'lucide-react';
import WobblyCard from '@client/src/components/WobblyCard';
import { announcement } from '@client/src/api';
import { fetchBitableData } from '@client/src/api/plugins';
import type { Announcement } from '@shared/api.interface';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { STAGE_LIST } from '@client/src/config/stages';
import { stagePath } from '@client/src/config/stages';

const Workbench: React.FC = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [bitableData, setBitableData] = useState<any>(null);
  const [loadingBitable, setLoadingBitable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchAnnouncements = async () => {
      try {
        const res = await announcement.getAnnouncements();
        if (!cancelled) {
          setAnnouncements(res.items);
        }
      } catch {
        if (!cancelled) {
          setAnnouncements([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingAnnouncements(false);
        }
      }
    };
    fetchAnnouncements();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* 欢迎语 */}
      <div className="mb-10">
        <h1 className="font-marker text-3xl text-ink">
          <Sparkles className="mr-2 inline-block size-8 text-marker-red" />
          洋葱课程顾问学情&升学工作台
        </h1>
        <p className="font-hand mt-2 text-lg text-ink/60">
          请先选择学段，再进入学情诊断、升学规划、知识点查询或个性化学习规划
        </p>
      </div>

      <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3">
        {STAGE_LIST.map((stage, index) => (
          <NavLink
            key={stage.slug}
            to={stagePath(stage.slug)}
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-marker-red"
          >
            <WobblyCard
              variant={index === 1 ? 'yellow' : 'white'}
              decoration={index === 0 ? 'tape' : index === 1 ? 'tack' : 'none'}
              wobblyIndex={index}
              rotate={index === 0 ? -1 : index === 2 ? 1 : 0}
              hoverable
              className="h-full transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex flex-col gap-4 p-6">
                <div className="flex size-14 items-center justify-center rounded-full border-2 border-ink bg-accent">
                  <School className="size-7 text-pen-blue" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-marker text-xl text-ink">{stage.label}</h3>
                  <p className="font-hand mt-2 text-base text-ink/60">{stage.subtitle}</p>
                  <ul className="font-hand mt-3 space-y-1 text-sm text-ink/55">
                    {stage.focusPoints.slice(0, 2).map((p) => (
                      <li key={p}>· {p}</li>
                    ))}
                  </ul>
                </div>
                <span className="font-hand mt-auto text-sm font-semibold text-pen-blue">
                  进入{stage.label} →
                </span>
              </div>
            </WobblyCard>
          </NavLink>
        ))}
      </div>

      {/* 飞书多维表格读取区域 - 仅开发/预览环境显示 */}
      {!isProduction && (
        <div className="mb-12">
          <WobblyCard variant="yellow" decoration="tape" wobblyIndex={3} hoverable={false}>
            <div className="flex items-center justify-between gap-4 p-4">
              <div className="flex-1">
                <h2 className="font-marker text-lg font-bold">飞书多维表格数据</h2>
                <p className="font-hand text-xs text-ink/60">读取指定表格数据用于系统配置</p>
              </div>
              <Button size="sm" onClick={async () => {
                setLoadingBitable(true);
                try {
                  const data = await fetchBitableData();
                  setBitableData(data);
                  toast(`成功读取 ${data.total} 条记录`);
                } catch (err) {
                  logger.error('读取表格失败', String(err));
                  toast('读取表格失败，请检查权限配置');
                } finally {
                  setLoadingBitable(false);
                }
              }} disabled={loadingBitable}>
                {loadingBitable ? <><Loader2 className="mr-1 size-3 animate-spin" />读取中</> : '读取数据'}
              </Button>
            </div>
          </WobblyCard>
        </div>
      )}

      {/* 公告栏 */}
      <WobblyCard
        variant="white"
        decoration="none"
        wobblyIndex={3}
        hoverable={false}
      >
        <div className="p-6">
          <h2 className="font-marker mb-4 text-xl text-ink">
            📢 系统公告
          </h2>
          {loadingAnnouncements ? (
            <div className="font-hand space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-6 animate-pulse rounded bg-accent"
                />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <p className="font-hand text-base text-ink/40">
              暂无公告
            </p>
          ) : (
            <ul className="font-hand space-y-0">
              {announcements.map((item, idx) => (
                <li
                  key={item.id}
                  className={`py-3 ${idx < announcements.length - 1 ? 'border-b-2 border-dashed border-ink/20' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="font-marker text-base font-bold text-ink">
                        {item.title}
                      </span>
                      <p className="mt-1 text-sm text-ink/60">
                        {item.content}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-ink/40">
                      {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </WobblyCard>
    </div>
  );
};

export default Workbench;
