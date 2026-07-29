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
import { toSelectValue } from '@client/src/lib/utils';

const SUBJECT_VERSION_MAP: Record<string, Record<string, string>> = {
  '北京市': { '数学': '人教版', '语文': '部编版', '英语': '人教版', '物理': '人教版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '人教版', '政治': '部编版', '体育': '人教版', '科学': '人教版' },
  '上海市': { '数学': '沪教版', '语文': '部编版', '英语': '沪教牛津版', '物理': '沪教版', '化学': '沪教版', '生物': '沪教版', '历史': '部编版', '地理': '沪教版', '政治': '部编版', '体育': '沪教版', '科学': '沪教版' },
  '江苏省': { '数学': '苏教版', '语文': '部编版', '英语': '译林版', '物理': '苏科版', '化学': '沪教版', '生物': '苏教版', '历史': '部编版', '地理': '人教版', '政治': '部编版', '体育': '苏教版', '科学': '苏教版' },
  '浙江省': { '数学': '浙教版', '语文': '部编版', '英语': '人教版', '物理': '浙教版', '化学': '浙教版', '生物': '浙教版', '历史': '部编版', '地理': '湘教版', '政治': '部编版', '体育': '浙教版', '科学': '浙教版' },
  '山东省': { '数学': '人教版', '语文': '部编版', '英语': '人教版', '物理': '人教版', '化学': '鲁教版', '生物': '人教版', '历史': '部编版', '地理': '湘教版', '政治': '部编版' },
  '广东省': { '数学': '人教版', '语文': '部编版', '英语': '人教版', '物理': '人教版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '人教版', '政治': '部编版' },
  '河南省': { '数学': '人教版', '语文': '部编版', '英语': '人教版', '物理': '人教版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '人教版', '政治': '部编版' },
  '四川省': { '数学': '人教版', '语文': '部编版', '英语': '人教版', '物理': '教科版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '人教版', '政治': '部编版' },
  '湖北省': { '数学': '人教版', '语文': '部编版', '英语': '人教版', '物理': '人教版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '人教版', '政治': '部编版' },
  '湖南省': { '数学': '人教版', '语文': '部编版', '英语': '人教版', '物理': '人教版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '湘教版', '政治': '部编版' },
  '河北省': { '数学': '人教版', '语文': '部编版', '英语': '冀教版', '物理': '人教版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '人教版', '政治': '部编版' },
  '安徽省': { '数学': '沪科版', '语文': '部编版', '英语': '人教版', '物理': '沪科版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '人教版', '政治': '部编版' },
  '福建省': { '数学': '人教版', '语文': '部编版', '英语': '人教版', '物理': '人教版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '人教版', '政治': '部编版' },
  '江西省': { '数学': '人教版', '语文': '部编版', '英语': '人教版', '物理': '人教版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '人教版', '政治': '部编版' },
  '陕西省': { '数学': '北师大版', '语文': '部编版', '英语': '人教版', '物理': '北师大版', '化学': '人教版', '生物': '北师大版', '历史': '部编版', '地理': '人教版', '政治': '部编版' },
  '重庆市': { '数学': '人教版', '语文': '部编版', '英语': '人教版', '物理': '人教版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '人教版', '政治': '部编版' },
  '天津市': { '数学': '人教版', '语文': '部编版', '英语': '人教版', '物理': '人教版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '人教版', '政治': '部编版' },
  '辽宁省': { '数学': '人教版', '语文': '部编版', '英语': '外研版', '物理': '人教版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '人教版', '政治': '部编版' },
  '吉林省': { '数学': '人教版', '语文': '部编版', '英语': '人教版', '物理': '人教版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '人教版', '政治': '部编版' },
  '黑龙江省': { '数学': '人教版', '语文': '部编版', '英语': '人教版', '物理': '人教版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '人教版', '政治': '部编版' },
  '山西省': { '数学': '人教版', '语文': '部编版', '英语': '人教版', '物理': '人教版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '人教版', '政治': '部编版' },
  '云南省': { '数学': '人教版', '语文': '部编版', '英语': '人教版', '物理': '人教版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '人教版', '政治': '部编版' },
  '贵州省': { '数学': '人教版', '语文': '部编版', '英语': '人教版', '物理': '人教版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '人教版', '政治': '部编版' },
  '广西': { '数学': '人教版', '语文': '部编版', '英语': '外研版', '物理': '人教版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '人教版', '政治': '部编版' },
  '海南省': { '数学': '人教版', '语文': '部编版', '英语': '人教版', '物理': '人教版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '人教版', '政治': '部编版' },
  '甘肃省': { '数学': '人教版', '语文': '部编版', '英语': '人教版', '物理': '人教版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '人教版', '政治': '部编版' },
  '内蒙古': { '数学': '人教版', '语文': '部编版', '英语': '人教版', '物理': '人教版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '人教版', '政治': '部编版' },
  '宁夏': { '数学': '人教版', '语文': '部编版', '英语': '人教版', '物理': '人教版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '人教版', '政治': '部编版' },
  '青海省': { '数学': '人教版', '语文': '部编版', '英语': '人教版', '物理': '人教版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '人教版', '政治': '部编版' },
  '新疆': { '数学': '人教版', '语文': '部编版', '英语': '人教版', '物理': '人教版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '人教版', '政治': '部编版' },
  '西藏': { '数学': '人教版', '语文': '部编版', '英语': '人教版', '物理': '人教版', '化学': '人教版', '生物': '人教版', '历史': '部编版', '地理': '人教版', '政治': '部编版' },
};

/** 把「内蒙古自治区 / 广西壮族自治区 / 湖南」等统一成教材表可用的省名 */
function normalizeProvinceKey(province: string): string {
  const raw = (province || '').trim();
  if (!raw) return '';
  if (SUBJECT_VERSION_MAP[raw]) return raw;

  const aliases: Array<[RegExp, string]> = [
    [/内蒙古/, '内蒙古'],
    [/广西/, '广西'],
    [/宁夏/, '宁夏'],
    [/新疆/, '新疆'],
    [/西藏/, '西藏'],
    [/北京/, '北京市'],
    [/上海/, '上海市'],
    [/天津/, '天津市'],
    [/重庆/, '重庆市'],
  ];
  for (const [re, key] of aliases) {
    if (re.test(raw) && SUBJECT_VERSION_MAP[key]) return key;
  }

  // 「湖南省」→「湖南省」；若表里是「湖南省」则直接；若用户写「湖南」则补「省」
  if (SUBJECT_VERSION_MAP[`${raw}省`]) return `${raw}省`;
  const stripped = raw.replace(/(维吾尔|壮族|回族|特别)?自治区$|省$|市$/, '');
  if (SUBJECT_VERSION_MAP[stripped]) return stripped;
  if (SUBJECT_VERSION_MAP[`${stripped}省`]) return `${stripped}省`;
  return raw;
}

function getVersionForProvinceSubject(province: string, subject: string): string {
  const key = normalizeProvinceKey(province);
  const provinceMap = SUBJECT_VERSION_MAP[key] || SUBJECT_VERSION_MAP[province];
  if (!provinceMap) return '人教版';
  return provinceMap[subject] || '人教版';
}

const REGION_VERSION_MAP: Record<string, string> = {};
for (const prov of Object.keys(SUBJECT_VERSION_MAP)) {
  const versions = Object.values(SUBJECT_VERSION_MAP[prov]);
  const unique = [...new Set(versions)];
  REGION_VERSION_MAP[prov] = unique.length === 1 ? unique[0] : unique[0];
}

export const ALL_VERSIONS = [
  '人教版', '北师大版', '苏教版', '沪教版', '浙教版', '鲁教版',
  '湘教版', '粤教版', '冀教版', '华师大版', '外研版', '译林版',
  '教科版', '中图版', '湘少版', '陕旅版', '闽教版', '湘鲁版',
  '沪科版', '苏科版', '部编版', '沪教牛津版',
];

export const ALL_SUBJECTS = [
  '数学', '语文', '英语', '物理', '化学', '生物', '历史', '地理', '政治', '体育', '科学',
];

const GRADES = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '七年级', '八年级', '九年级', '高一', '高二', '高三'];
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
  autoVersion?: string;
  onProvinceChange: (val: string) => void;
  onCityChange: (val: string) => void;
  onGradeChange: (val: string) => void;
  onSemesterChange: (val: string) => void;
  onSubjectChange: (val: string) => void;
  onVersionChange: (val: string) => void;
  onSearchInputChange: (val: string) => void;
  onSearch: () => void;
  onReset: () => void;
  isCustomRegion: boolean;
  onCustomRegionToggle: () => void;
  customRegionText: string;
  onCustomRegionTextChange: (val: string) => void;
  onCustomRegionSubmit: () => void;
  allowedGrades?: string[];
}

const KnowledgeFilterPanel: React.FC<KnowledgeFilterPanelProps> = ({
  province,
  city,
  grade,
  semester,
  subject,
  version,
  searchInput,
  autoVersion,
  onProvinceChange,
  onCityChange,
  onGradeChange,
  onSemesterChange,
  onSubjectChange,
  onVersionChange,
  onSearchInputChange,
  onSearch,
  onReset,
  isCustomRegion,
  onCustomRegionToggle,
  customRegionText,
  onCustomRegionTextChange,
  onCustomRegionSubmit,
  allowedGrades,
}) => {
  const cities = PROVINCE_CITIES[province] || [];
  const gradeOptions = allowedGrades?.length
    ? GRADES.filter((g) => allowedGrades.includes(g))
    : GRADES;

  return (
    <div className="space-y-5">
      {/* Row 1: Region */}
      <div>
        <label className="mb-2 block text-sm font-bold text-ink">地区</label>
        {isCustomRegion ? (
          <div className="flex gap-2">
            <Input
              value={customRegionText}
              onChange={(e) => onCustomRegionTextChange(e.target.value)}
              placeholder="输入地区名称"
              className="font-hand h-10 flex-1"
              onKeyDown={(e) => { if (e.key === 'Enter') onCustomRegionSubmit(); }}
            />
            <button
              type="button"
              onClick={onCustomRegionSubmit}
              className="rounded-lg border-[3px] border-ink bg-postit-yellow px-4 py-2 font-hand text-sm font-bold shadow-hard"
            >
              确定
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Select value={toSelectValue(province)} onValueChange={onProvinceChange}>
              <SelectTrigger className="font-hand h-10 w-36">
                <SelectValue placeholder="选择省/市" />
              </SelectTrigger>
              <SelectContent>
                {PROVINCES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
                <SelectItem value="__custom__">自定义地区...</SelectItem>
              </SelectContent>
            </Select>
            {province && cities.length > 0 && (
              <Select value={toSelectValue(city)} onValueChange={onCityChange}>
                <SelectTrigger className="font-hand h-10 w-36">
                  <SelectValue placeholder="选择市/区" />
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

      {/* Row 2: Grade + Semester */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-bold text-ink">年级</label>
          <Select value={toSelectValue(grade)} onValueChange={onGradeChange}>
            <SelectTrigger className="font-hand h-10">
              <SelectValue placeholder="选择年级" />
            </SelectTrigger>
            <SelectContent>
                {gradeOptions.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-ink">学期</label>
          <Select value={toSelectValue(semester)} onValueChange={onSemesterChange}>
            <SelectTrigger className="font-hand h-10">
              <SelectValue placeholder="选择学期" />
            </SelectTrigger>
            <SelectContent>
              {SEMESTERS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-ink">学科</label>
          <Select value={toSelectValue(subject)} onValueChange={onSubjectChange}>
            <SelectTrigger className="font-hand h-10">
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

        <div>
          <label className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink">
            教材版本
            {autoVersion && version === autoVersion && province && (
              <span className="rounded-sm bg-pen-blue/10 px-1.5 py-0.5 font-hand text-[10px] font-normal text-pen-blue">
                自动匹配
              </span>
            )}
          </label>
          <Select value={toSelectValue(version)} onValueChange={onVersionChange}>
            <SelectTrigger className="font-hand h-10">
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

      {/* Row 3: Search */}
      <div className="flex items-center gap-3">
        <Input
          className="font-hand h-11 flex-1"
          placeholder="输入知识点关键词搜索..."
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }}
        />
        <button
          type="button"
          onClick={onSearch}
          className="flex h-11 items-center gap-1.5 rounded-lg border-[3px] border-ink bg-postit-yellow px-5 font-hand text-sm font-bold shadow-hard transition-transform hover:-translate-y-0.5"
        >
          搜索
        </button>
        <button
          type="button"
          onClick={onReset}
          className="flex h-11 items-center gap-1.5 rounded-lg border-[3px] border-ink bg-accent px-5 font-hand text-sm font-bold shadow-hard transition-transform hover:-translate-y-0.5"
        >
          重置
        </button>
      </div>
    </div>
  );
};

export default KnowledgeFilterPanel;
export { REGION_VERSION_MAP, SUBJECT_VERSION_MAP, GRADES, SEMESTERS, getVersionForProvinceSubject };
