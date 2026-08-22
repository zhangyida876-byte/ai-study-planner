import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageCircleMore, Sparkles, School } from 'lucide-react';
import WobblyCard from '@client/src/components/WobblyCard';
import { STAGE_LIST } from '@client/src/config/stages';
import { stagePath } from '@client/src/config/stages';
import { Button } from '@/components/ui/button';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';

const Workbench: React.FC = () => {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* 欢迎语 */}
      <div className="mb-10 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-marker text-3xl text-ink">
            <Sparkles className="mr-2 inline-block size-8 text-marker-red" />
            洋葱课程顾问学情&升学工作台
          </h1>
          <p className="font-hand mt-2 text-lg text-ink/60">
            请先选择学段，再进入学情诊断、升学规划、版本及知识点查询或个性化学习规划
          </p>
        </div>
        <Button className="font-hand" variant="outline" asChild>
          <UniversalLink
            to="https://guanghe.feishu.cn/share/base/form/shrcnfls7RZiUEZRDlfxW35XDTg"
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircleMore className="mr-1 size-4" />
            反馈建议
          </UniversalLink>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
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
    </div>
  );
};

export default Workbench;
