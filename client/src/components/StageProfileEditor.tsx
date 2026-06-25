import React, { useEffect, useState } from 'react';
import { Save, User } from 'lucide-react';
import { toast } from 'sonner';
import WobblyCard from '@client/src/components/WobblyCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { StageConfig } from '@client/src/config/stages';
import type { StageProfile } from '@client/src/types/stage-profile';
import { PROVINCE_CITIES, PROVINCES } from '@client/src/pages/Plan/regionData';

interface StageProfileEditorProps {
  stageConfig: StageConfig;
  profile: StageProfile;
  onSave: (profile: StageProfile) => void;
  countdownDays: number | null;
  regionText: string;
}

const StageProfileEditor: React.FC<StageProfileEditorProps> = ({
  stageConfig,
  profile,
  onSave,
  countdownDays,
  regionText,
}) => {
  const [draft, setDraft] = useState<StageProfile>(profile);

  useEffect(() => {
    setDraft(profile);
  }, [profile.updatedAt]);

  const cities = PROVINCE_CITIES[draft.province] || [];

  const patch = (partial: Partial<StageProfile>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  };

  const handleSave = () => {
    if (!draft.grade) {
      toast.error('请选择当前年级');
      return;
    }
    if (!draft.province) {
      toast.error('请选择省份');
      return;
    }
    onSave(draft);
    toast.success('学生档案已保存，将同步到本学段全部功能模块');
  };

  return (
    <WobblyCard variant="white" decoration="tape" wobblyIndex={1} hoverable={false} className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <User className="size-5 text-pen-blue" />
          <h2 className="font-marker text-lg font-bold">全局学生档案</h2>
        </div>
        <p className="font-hand text-xs text-muted-foreground">
          填写后自动同步至学情诊断、升学规划、知识点、学习规划
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label className="font-hand">学生姓名</Label>
          <Input
            className="font-hand mt-1"
            value={draft.studentName}
            onChange={(e) => patch({ studentName: e.target.value })}
            placeholder="如：张三"
          />
        </div>
        <div>
          <Label className="font-hand">省份 *</Label>
          <Select value={draft.province} onValueChange={(v) => patch({ province: v, city: '', county: '' })}>
            <SelectTrigger className="font-hand mt-1"><SelectValue placeholder="选择省份" /></SelectTrigger>
            <SelectContent>
              {PROVINCES.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="font-hand">城市</Label>
          <Select value={draft.city} onValueChange={(v) => patch({ city: v })} disabled={!draft.province}>
            <SelectTrigger className="font-hand mt-1"><SelectValue placeholder="选择城市" /></SelectTrigger>
            <SelectContent>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="font-hand">区县</Label>
          <Input
            className="font-hand mt-1"
            value={draft.county}
            onChange={(e) => patch({ county: e.target.value })}
            placeholder="区/县"
          />
        </div>
        <div>
          <Label className="font-hand">当前年级 *</Label>
          <Select value={draft.grade} onValueChange={(v) => patch({ grade: v })}>
            <SelectTrigger className="font-hand mt-1"><SelectValue placeholder="选择年级" /></SelectTrigger>
            <SelectContent>
              {stageConfig.grades.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="font-hand">当前学校</Label>
          <Input
            className="font-hand mt-1"
            value={draft.school}
            onChange={(e) => patch({ school: e.target.value })}
          />
        </div>
        <div>
          <Label className="font-hand">{stageConfig.targetLabel}</Label>
          <Input
            className="font-hand mt-1"
            value={draft.targetSchool}
            onChange={(e) => patch({ targetSchool: e.target.value })}
            placeholder={stageConfig.slug === 'high' ? '如：武汉大学' : '如：华师一附中'}
          />
        </div>
        {stageConfig.slug === 'high' && (
          <div>
            <Label className="font-hand">目标专业（选填）</Label>
            <Input
              className="font-hand mt-1"
              value={draft.targetMajor}
              onChange={(e) => patch({ targetMajor: e.target.value })}
            />
          </div>
        )}
        <div>
          <Label className="font-hand">目标考试时间</Label>
          <Input
            type="date"
            className="font-hand mt-1"
            value={draft.examDate}
            onChange={(e) => patch({ examDate: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="font-hand">当前成绩概览</Label>
          <Input
            className="font-hand mt-1"
            value={draft.scoresOverview}
            onChange={(e) => patch({ scoresOverview: e.target.value })}
            placeholder="如：语92 数78 英85 物70"
          />
        </div>
        <div>
          <Label className="font-hand">薄弱科目</Label>
          <Input
            className="font-hand mt-1"
            value={draft.weakSubjects}
            onChange={(e) => patch({ weakSubjects: e.target.value })}
            placeholder="如：数学、物理"
          />
        </div>
        <div>
          <Label className="font-hand">优势科目</Label>
          <Input
            className="font-hand mt-1"
            value={draft.strongSubjects}
            onChange={(e) => patch({ strongSubjects: e.target.value })}
          />
        </div>
        <div>
          <Label className="font-hand">每周可支配学习时间（小时）</Label>
          <Input
            className="font-hand mt-1"
            value={draft.weeklyStudyHours}
            onChange={(e) => patch({ weeklyStudyHours: e.target.value })}
            placeholder="如：12"
          />
        </div>
        <div>
          <Label className="font-hand">住读 / 走读</Label>
          <Select
            value={draft.boardingType || '__none__'}
            onValueChange={(v) => patch({ boardingType: v === '__none__' ? '' : (v as 'day' | 'boarding') })}
          >
            <SelectTrigger className="font-hand mt-1"><SelectValue placeholder="请选择" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">未选择</SelectItem>
              <SelectItem value="day">走读</SelectItem>
              <SelectItem value="boarding">住读</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {stageConfig.slug === 'high' && (
          <div>
            <Label className="font-hand">高考模式</Label>
            <Select value={draft.examMode || '__none__'} onValueChange={(v) => patch({ examMode: v === '__none__' ? '' : v })}>
              <SelectTrigger className="font-hand mt-1"><SelectValue placeholder="请选择" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">未选择</SelectItem>
                <SelectItem value="3+1+2">3+1+2</SelectItem>
                <SelectItem value="3+3">3+3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-ink/10 pt-4">
        <div className="font-hand text-sm text-ink/70">
          {regionText && <span className="mr-3">📍 {regionText}</span>}
          {draft.grade && <span className="mr-3">🎓 {draft.grade}</span>}
          {countdownDays != null && draft.examDate && (
            <span className="text-marker-red">距{stageConfig.examLabel} {countdownDays} 天</span>
          )}
        </div>
        <Button className="font-hand" onClick={handleSave}>
          <Save className="mr-1 size-4" />
          保存档案
        </Button>
      </div>
    </WobblyCard>
  );
};

export default StageProfileEditor;
