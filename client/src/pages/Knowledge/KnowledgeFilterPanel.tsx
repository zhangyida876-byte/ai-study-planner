import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { PROVINCES, PROVINCE_CITIES } from '@client/src/pages/Plan/regionData';

const REGION_VERSION_MAP: Record<string, string> = {
  '北京市': '人教版', '上海市': '沪教版', '江苏省': '苏教版',
  '浙江省': '浙教版', '广东省': '人教版', '山东省': '人教版',
  '河南省': '人教版', '四川省': '人教版', '湖北省': '人教版',
  '湖南省': '人教版', '河北省': '人教版', '安徽省': '人教版',
  '福建省': '人教版', '江西省': '人教版', '陕西省': '北师大版',
  '重庆市': '人教版', '天津市': '人教版', '辽宁省': '人教版',
  '吉林省': '人教版', '黑龙江省': '人教版', '山西省': '人教版',
  '云南省': '人教版', '贵州省': '人教版', '广西': '人教版',
  '海南省': '人教版', '甘肃省': '人教版', '内蒙古': '人教版',
  '宁夏': '人教版', '青海省': '人教版', '新疆': '人教版',
  '西藏': '人教版',
};

export const ALL_VERSIONS = [
  '人教版', '北师大版', '苏教版', '沪教版', '浙教版', '鲁教版',
  '湘教版', '粤教版', '冀教版', '华师大版', '外研版', '译林版',
  '教科版', '中图版', '湘少版', '陕旅版', '闽教版', '湘鲁版'
];

export const ALL_SUBJECTS = [
  '数学', '语文', '英语', '物理', '化学', '生物', '历史', '地理', '政治',
];

const GRADES = ['七年级', '八年级', '九年级', '高一', '高二', '高三'];
const SEMESTERS = ['上学期', '下学期'];

interface KnowledgeFilterPanelProps {
  region: string;
  province: string;
  city: string;
  grade: string;
  semester: string;
  subject: string;
  version: string;
  searchInput: string;
  onProvinceChange: (val: string) => void;
  onCityChange: (val: string) => void;
  onGradeChange: (val: string) => void;
  onSemesterChange: (val: string) => void;
  onSubjectChange: (val: string) => void;
  onVersionChange: (val: string) => void;
  onSearchInputChange: (val: string) => void;
  onSearch: () => void;
  isCustomRegion: boolean;
  onCustomRegionToggle: () => void;
  customRegionText: string;
  onCustomRegionTextChange: (val: string) => void;
  onCustomRegionSubmit: () => void;
}

const KnowledgeFilterPanel: React.FC<KnowledgeFilterPanelProps> = ({
  province,
  city,
  grade,
  semester,
  subject,
  version,
  searchInput,
  onProvinceChange,
  onCityChange,
  onGradeChange,
  onSemesterChange,
  onSubjectChange,
  onVersionChange,
  onSearchInputChange,
  onSearch,
  isCustomRegion,
  onCustomRegionToggle,
  customRegionText,
  onCustomRegionTextChange,
  onCustomRegionSubmit,
}) => {
  const cities = PROVINCE_CITIES[province] || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-32">
          <label className="mb-1 block text-xs font-bold text-ink">地区</label>
          {isCustomRegion ? (
            <div className="flex gap-1">
              <Input
                value={customRegionText}
                onChange={(e) => onCustomRegionTextChange(e.target.value)}
                placeholder="输入地区"
                className="font-hand h-9 text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter') onCustomRegionSubmit(); }}
              />
              <button
                type="button"
                onClick={onCustomRegionSubmit}
                className="text-xs text-pen-blue hover:underline"
              >
                确定
              </button>
            </div>
          ) : (
            <div className="flex gap-1">
              <Select value={province} onValueChange={onProvinceChange}>
                <SelectTrigger className="font-hand h-9 w-24 text-sm">
                  <SelectValue placeholder="省/市" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                  <SelectItem value="__custom__">自定义...</SelectItem>
                </SelectContent>
              </Select>
              {province && cities.length > 0 && (
                <Select value={city} onValueChange={onCityChange}>
                  <SelectTrigger className="font-hand h-9 w-20 text-sm">
                    <SelectValue placeholder="市" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        <div className="w-24">
          <label className="mb-1 block text-xs font-bold text-ink">年级</label>
          <Select value={grade} onValueChange={onGradeChange}>
            <SelectTrigger className="font-hand h-9 text-sm">
              <SelectValue placeholder="年级" />
            </SelectTrigger>
            <SelectContent>
              {GRADES.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-24">
          <label className="mb-1 block text-xs font-bold text-ink">学期</label>
          <Select value={semester} onValueChange={onSemesterChange}>
            <SelectTrigger className="font-hand h-9 text-sm">
              <SelectValue placeholder="学期" />
            </SelectTrigger>
            <SelectContent>
              {SEMESTERS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-28">
          <label className="mb-1 block text-xs font-bold text-ink">学科</label>
          <Select value={subject} onValueChange={onSubjectChange}>
            <SelectTrigger className="font-hand h-9 text-sm">
              <SelectValue placeholder="全部学科" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">全部学科</SelectItem>
              {ALL_SUBJECTS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-28">
          <label className="mb-1 block text-xs font-bold text-ink">教材版本</label>
          <Select value={version} onValueChange={onVersionChange}>
            <SelectTrigger className="font-hand h-9 text-sm">
              <SelectValue placeholder="全部版本" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">全部版本</SelectItem>
              {ALL_VERSIONS.map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Input
          className="font-hand h-10 flex-1"
          placeholder="输入知识点关键词搜索..."
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }}
        />
        <button
          type="button"
          onClick={onSearch}
          className="flex items-center gap-1.5 rounded-lg border-[3px] border-ink bg-postit-yellow px-4 py-2 font-hand text-sm font-bold shadow-hard transition-transform hover:-translate-y-0.5"
        >
          搜索
        </button>
      </div>
    </div>
  );
};

export default KnowledgeFilterPanel;
export { REGION_VERSION_MAP, GRADES, SEMESTERS };
