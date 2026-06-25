import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Stethoscope,
  GraduationCap,
  BookOpen,
  Sparkles,
  Pin,
} from 'lucide-react';
import WobblyCard from '@client/src/components/WobblyCard';
import { announcement } from '@client/src/api';
import { fetchBitableData } from '@client/src/api/plugins';
import type { Announcement } from '@shared/api.interface';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';

interface FeatureCardConfig {
  title: string;
  description: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  iconColor: string;
  path: string;
  decoration: 'tape' | 'tack' | 'none';
  rotate: number;
  wobblyIndex: number;
  variant: 'white' | 'yellow' | 'blue';
  customDecoration?: React.ReactNode;
}

const featureCards: FeatureCardConfig[] = [
  {
    title: '学情诊断',
    description: '诊断学生学习问题，输出解决方案与危害分析',
    icon: Stethoscope,
    iconColor: 'text-marker-red',
    path: '/diagnosis',
    decoration: 'tape',
    rotate: -1,
    wobblyIndex: 0,
    variant: 'white',
  },
  {
    title: '升学规划',
    description: '考情政策、分数线、规划报告与时间路线图',
    icon: GraduationCap,
    iconColor: 'text-pen-blue',
    path: '/plan',
    decoration: 'tack',
    rotate: 1,
    wobblyIndex: 1,
    variant: 'white',
  },
  {
    title: '知识点查询&解读',
    description: '各版本各学科知识点双向查询与详情',
    icon: BookOpen,
    iconColor: 'text-pen-blue',
    path: '/knowledge',
    decoration: 'none',
    rotate: -1,
    wobblyIndex: 2,
    variant: 'white',
    customDecoration: (
      <div className="absolute -top-2 -right-2 z-10">
        <Pin
          className="size-6 text-marker-red"
          strokeWidth={2.5}
        />
      </div>
    ),
  },
];

const Workbench: React.FC = () => {
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
          选择下方功能入口，快速开始诊断、规划与知识点查询
        </p>
      </div>

      {/* 功能入口卡片 */}
      <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {featureCards.map((card) => {
          const Icon = card.icon;
          return (
            <NavLink
              key={card.path}
              to={card.path}
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-marker-red"
            >
              <WobblyCard
                variant={card.variant}
                decoration={card.decoration}
                wobblyIndex={card.wobblyIndex}
                rotate={card.rotate}
                hoverable={true}
                className="transition-all duration-300 hover:-translate-y-1"
              >
                {card.customDecoration}
                <div className="flex flex-col items-start gap-4 p-6">
                  <div
                    className={`flex size-14 items-center justify-center rounded-full border-2 border-ink ${card.variant === 'yellow' ? 'bg-postit-yellow' : 'bg-accent'}`}
                  >
                    <Icon
                      className={`size-7 ${card.iconColor}`}
                      strokeWidth={2}
                    />
                  </div>
                  <div>
                    <h3 className="font-marker text-xl text-ink">
                      {card.title}
                    </h3>
                    <p className="font-hand mt-2 text-base text-ink/60">
                      {card.description}
                    </p>
                  </div>
                  <span className="font-hand mt-auto text-sm font-semibold text-pen-blue">
                    点击进入 →
                  </span>
                </div>
              </WobblyCard>
            </NavLink>
          );
        })}
       </div>

      {/* 飞书多维表格读取区域 - 紧凑样式 */}
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
