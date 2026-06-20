import React, { useState, useCallback, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, FileText } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

/* ===== Schema & Constants ===== */

const optionalScore = () => z.number().min(0).max(150).optional();
const optionalScoreLow = () => z.number().min(0).max(100).optional();

const diagnosisFormSchema = z.object({
  studentName: z.string().optional(),
  grade: z.string().min(1, '请选择年级'),
  region: z.string().min(1, '请选择地区'),
  examMode: z.string().optional(),
  examDate: z.string().optional(),
  targetSchool: z.string().optional(),
  targetScore: z.number().optional(),
  chinese: optionalScore(),
  math: optionalScore(),
  english: optionalScore(),
  physics: optionalScoreLow(),
  chemistry: optionalScoreLow(),
  biology: optionalScoreLow(),
  history: optionalScoreLow(),
  geography: optionalScoreLow(),
  politics: optionalScoreLow(),
  problemDesc: z.string().optional(),
});

export type DiagnosisFormData = z.infer<typeof diagnosisFormSchema>;

const GRADE_OPTIONS = [
  '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
  '初一', '初二', '初三',
  '高一', '高二', '高三',
  '中职',
];

const HS_MODES: Array<{ value: string; label: string }> = [
  { value: '3+1+2', label: '3+1+2（物理/历史 二选一）' },
  { value: '3+3', label: '3+3（六选三）' },
];

const PROVINCE_CITIES: Record<string, string[]> = {
  '北京市': ['东城区', '西城区', '朝阳区', '海淀区', '丰台区', '通州区', '大兴区', '昌平区'],
  '天津市': ['和平区', '南开区', '河西区', '河东区', '滨海新区', '武清区'],
  '上海市': ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '浦东新区', '闵行区', '宝山区', '嘉定区', '松江区'],
  '重庆市': ['渝中区', '江北区', '沙坪坝区', '九龙坡区', '南岸区', '北碚区', '渝北区', '巴南区'],
  '河北省': ['石家庄', '唐山', '秦皇岛', '邯郸', '保定', '廊坊', '沧州', '邢台', '衡水'],
  '山西省': ['太原', '大同', '长治', '晋城', '临汾', '运城', '晋中', '吕梁'],
  '内蒙古': ['呼和浩特', '包头', '鄂尔多斯', '赤峰', '通辽', '呼伦贝尔'],
  '辽宁省': ['沈阳', '大连', '鞍山', '抚顺', '本溪', '锦州', '营口'],
  '吉林省': ['长春', '吉林', '四平', '通化', '延边', '松原'],
  '黑龙江省': ['哈尔滨', '齐齐哈尔', '大庆', '牡丹江', '佳木斯', '绥化'],
  '江苏省': ['南京', '苏州', '无锡', '常州', '南通', '徐州', '扬州', '镇江', '泰州', '连云港'],
  '浙江省': ['杭州', '宁波', '温州', '嘉兴', '绍兴', '金华', '台州', '湖州'],
  '安徽省': ['合肥', '芜湖', '蚌埠', '马鞍山', '安庆', '阜阳', '宿州', '滁州'],
  '福建省': ['福州', '厦门', '泉州', '漳州', '莆田', '三明', '龙岩', '宁德'],
  '江西省': ['南昌', '九江', '赣州', '景德镇', '上饶', '宜春', '吉安'],
  '山东省': ['济南', '青岛', '烟台', '潍坊', '淄博', '临沂', '济宁', '泰安', '威海', '德州'],
  '河南省': ['郑州', '洛阳', '开封', '南阳', '新乡', '安阳', '焦作', '许昌', '商丘'],
  '湖北省': ['武汉', '宜昌', '襄阳', '荆州', '十堰', '黄石', '孝感', '黄冈', '荆门', '咸宁'],
  '湖南省': ['长沙', '株洲', '湘潭', '衡阳', '岳阳', '常德', '邵阳', '永州'],
  '广东省': ['广州', '深圳', '东莞', '佛山', '珠海', '惠州', '中山', '汕头', '湛江', '茂名'],
  '广西': ['南宁', '桂林', '柳州', '北海', '玉林', '梧州', '百色'],
  '海南省': ['海口', '三亚', '儋州', '琼海'],
  '四川省': ['成都', '绵阳', '德阳', '宜宾', '泸州', '达州', '南充', '乐山', '自贡'],
  '贵州省': ['贵阳', '遵义', '毕节', '六盘水', '安顺', '铜仁'],
  '云南省': ['昆明', '曲靖', '大理', '玉溪', '红河', '楚雄', '文山'],
  '西藏': ['拉萨', '日喀则', '昌都', '林芝'],
  '陕西省': ['西安', '咸阳', '宝鸡', '渭南', '汉中', '延安', '榆林', '安康'],
  '甘肃省': ['兰州', '天水', '白银', '酒泉', '张掖', '武威', '庆阳'],
  '青海省': ['西宁', '海东', '海西'],
  '宁夏': ['银川', '石嘴山', '吴忠', '中卫', '固原'],
  '新疆': ['乌鲁木齐', '克拉玛依', '喀什', '伊犁', '阿克苏', '昌吉'],
};

const PROVINCES = Object.keys(PROVINCE_CITIES);

const CORE_SUBJECTS: Array<{ name: keyof DiagnosisFormData; label: string; max: number }> = [
  { name: 'chinese', label: '语文', max: 150 },
  { name: 'math', label: '数学', max: 150 },
  { name: 'english', label: '英语', max: 150 },
];

const PREFERRED_12: Array<{ name: keyof DiagnosisFormData; label: string; max: number }> = [
  { name: 'physics', label: '物理', max: 100 },
  { name: 'history', label: '历史', max: 100 },
];

const ELECTIVE_12: Array<{ name: keyof DiagnosisFormData; label: string; max: number }> = [
  { name: 'chemistry', label: '化学', max: 100 },
  { name: 'biology', label: '生物', max: 100 },
  { name: 'politics', label: '政治&道法', max: 100 },
  { name: 'geography', label: '地理', max: 100 },
];

const ALL_ELECTIVES: Array<{ name: keyof DiagnosisFormData; label: string; max: number }> = [
  { name: 'physics', label: '物理', max: 100 },
  { name: 'chemistry', label: '化学', max: 100 },
  { name: 'biology', label: '生物', max: 100 },
  { name: 'history', label: '历史', max: 100 },
  { name: 'geography', label: '地理', max: 100 },
  { name: 'politics', label: '政治&道法', max: 100 },
];

const NORMAL_SUBJECTS: Array<{ name: keyof DiagnosisFormData; label: string; max: number }> = [
  ...CORE_SUBJECTS,
  { name: 'physics', label: '物理', max: 100 },
  { name: 'chemistry', label: '化学', max: 100 },
  { name: 'biology', label: '生物', max: 100 },
  { name: 'history', label: '历史', max: 100 },
  { name: 'geography', label: '地理', max: 100 },
  { name: 'politics', label: '政治&道法', max: 100 },
];

const FORM_DEFAULTS: DiagnosisFormData = {
  studentName: '',
  grade: '',
  region: '',
  examMode: undefined,
  examDate: '',
  targetSchool: '',
  targetScore: undefined,
  chinese: undefined,
  math: undefined,
  english: undefined,
  physics: undefined,
  chemistry: undefined,
  biology: undefined,
  history: undefined,
  geography: undefined,
  politics: undefined,
  problemDesc: '',
};

/* ===== Helpers ===== */

function getActiveSubjectFields(data: DiagnosisFormData) {
  const grade = data.grade;
  const isHighSchool = ['高一', '高二', '高三'].includes(grade);

  if (!isHighSchool) return NORMAL_SUBJECTS;

  const mode = data.examMode;
  if (mode === '3+1+2') {
    const preferred = data.physics != null ? 'physics' : data.history != null ? 'history' : null;
    const electives = ELECTIVE_12.filter((s) => data[s.name] != null);
    return [
      ...CORE_SUBJECTS,
      ...PREFERRED_12,
      ...electives,
    ];
  }

  if (mode === '3+3') {
    const selected = ALL_ELECTIVES.filter((s) => data[s.name] != null);
    return [...CORE_SUBJECTS, ...selected];
  }

  return CORE_SUBJECTS;
}

function buildRegionText(province: string, city: string, county: string): string {
  const parts = [province, city, county].filter(Boolean);
  return parts.join(' ');
}

/* ===== Component ===== */

interface DiagnosisFormProps {
  onSubmit: (data: DiagnosisFormData) => void;
  isGenerating: boolean;
}

const DiagnosisForm: React.FC<DiagnosisFormProps> = ({ onSubmit, isGenerating }) => {
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [county, setCounty] = useState('');
  const [isCustomRegion, setIsCustomRegion] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState('');
  const customRegionRef = useRef('');

  const form = useForm<DiagnosisFormData>({
    resolver: zodResolver(diagnosisFormSchema) as unknown as Parameters<typeof useForm<DiagnosisFormData>>[0]['resolver'],
    defaultValues: FORM_DEFAULTS,
  });

  const watchedGrade = form.watch('grade');
  const watchedMode = form.watch('examMode');
  const watchedPhysics = form.watch('physics');
  const watchedHistory = form.watch('history');
  const isHighSchool = ['高一', '高二', '高三'].includes(watchedGrade);

  const cities = PROVINCE_CITIES[selectedProvince] || [];

  const handleProvinceChange = useCallback((val: string) => {
    setSelectedProvince(val);
    setSelectedCity('');
    setCounty('');
    if (val === '__custom__') {
      setIsCustomRegion(true);
      form.setValue('region', customRegionRef.current || '');
    } else {
      setIsCustomRegion(false);
      form.setValue('region', val);
    }
  }, [form]);

  const handleCityChange = useCallback((val: string) => {
    setSelectedCity(val);
    setCounty('');
    form.setValue('region', buildRegionText(selectedProvince, val, ''));
  }, [form, selectedProvince]);

  const handleCountyChange = useCallback((val: string) => {
    setCounty(val);
    form.setValue('region', buildRegionText(selectedProvince, selectedCity, val));
  }, [form, selectedProvince, selectedCity]);

  const handleFormSubmit = useCallback((data: DiagnosisFormData) => {
    const activeFields = getActiveSubjectFields(data);
    const scores: Record<string, number> = {};
    for (const field of activeFields) {
      const val = data[field.name];
      if (typeof val === 'number') {
        scores[field.label] = val;
      }
    }

    if (Object.keys(scores).length === 0) {
      toast.error('请至少填写一科成绩');
      return;
    }

    onSubmit(data);
  }, [onSubmit]);

  const renderSubjectInput = (subject: { name: keyof DiagnosisFormData; label: string; max: number }) => (
    <FormField
      key={String(subject.name)}
      control={form.control}
      name={subject.name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm">{subject.label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              placeholder={`0-${subject.max}`}
              min={0}
              max={subject.max}
              name={field.name}
              ref={field.ref}
              disabled={field.disabled}
              value={
                field.value !== undefined && field.value !== null
                  ? String(field.value)
                  : ''
              }
              onChange={(e) => {
                const raw = e.target.value;
                field.onChange(raw === '' ? undefined : Number(raw));
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Student Name */}
        <FormField
          control={form.control}
          name="studentName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>学生姓名/昵称</FormLabel>
              <FormControl>
                <Input
                  placeholder="请输入学生姓名或昵称"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Grade */}
        <FormField
          control={form.control}
          name="grade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                年级 <span className="text-marker-red">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="请选择年级" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GRADE_OPTIONS.map((g: string) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* High School Mode */}
        {isHighSchool && (
          <FormField
            control={form.control}
            name="examMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>高考选科模式</FormLabel>
                <Select
                  onValueChange={(val) => {
                    field.onChange(val);
                    form.setValue('physics', undefined);
                    form.setValue('chemistry', undefined);
                    form.setValue('biology', undefined);
                    form.setValue('history', undefined);
                    form.setValue('geography', undefined);
                    form.setValue('politics', undefined);
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="请选择选科模式" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {HS_MODES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Region: Province → City → County */}
        <FormField
          control={form.control}
          name="region"
          render={() => (
            <FormItem>
              <FormLabel>
                地区 <span className="text-marker-red">*</span>
              </FormLabel>
              <div className="grid grid-cols-2 gap-2">
                <Select onValueChange={handleProvinceChange} value={isCustomRegion ? '__custom__' : selectedProvince}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="省/直辖市" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <div className="p-1" onKeyDown={(e) => e.stopPropagation()}>
                      <Input
                        placeholder="搜索省份..."
                        value={provinceSearch}
                        onChange={(e) => setProvinceSearch(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    {PROVINCES
                      .filter((p) => !provinceSearch || p.includes(provinceSearch))
                      .map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    <SelectItem value="__custom__">手动输入...</SelectItem>
                  </SelectContent>
                </Select>
                {!isCustomRegion && selectedProvince && (
                  <Select onValueChange={handleCityChange} value={selectedCity}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="市/区" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cities.map((c: string) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {isCustomRegion && (
                <Input
                  placeholder="请输入完整地区名称"
                  value={customRegionRef.current}
                  onChange={(e) => {
                    customRegionRef.current = e.target.value;
                    form.setValue('region', e.target.value);
                  }}
                  className="mt-2"
                />
              )}
              {!isCustomRegion && selectedCity && (
                <Input
                  placeholder="区/县（选填）"
                  value={county}
                  onChange={(e) => handleCountyChange(e.target.value)}
                  className="mt-2"
                />
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Exam Date (for middle/high school) */}
        {(isHighSchool || ['初一', '初二', '初三'].includes(watchedGrade)) && (
          <FormField
            control={form.control}
            name="examDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {isHighSchool ? '高考' : '中考'}日期
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    placeholder="选择考试日期"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Target School & Score */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="targetSchool"
            render={({ field }) => (
              <FormItem>
                <FormLabel>目标院校</FormLabel>
                <FormControl>
                  <Input
                    placeholder="如：华中师范大学一附中"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="targetScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>目标分数</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="目标分数线"
                    value={
                      field.value !== undefined && field.value !== null
                        ? String(field.value)
                        : ''
                    }
                    onChange={(e) => {
                      const raw = e.target.value;
                      field.onChange(raw === '' ? undefined : Number(raw));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Subject Scores */}
        <div>
          <FormLabel className="mb-3 block">各科成绩</FormLabel>

          {isHighSchool && watchedMode ? (
            <div className="space-y-4">
              {/* Core: 3 required */}
              <div>
                <p className="font-hand mb-2 text-xs font-semibold text-pen-blue">
                  必考（3科）
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {CORE_SUBJECTS.map(renderSubjectInput)}
                </div>
              </div>

              {watchedMode === '3+1+2' && (
                <>
                  {/* Preferred: 1 choose */}
                  <div>
                    <p className="font-hand mb-2 text-xs font-semibold text-pen-blue">
                      首选科目（二选一）
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {PREFERRED_12.map(renderSubjectInput)}
                    </div>
                  </div>
                  {/* Electives: 2 from 4 */}
                  {(watchedPhysics != null || watchedHistory != null) && (
                    <div>
                      <p className="font-hand mb-2 text-xs font-semibold text-pen-blue">
                        再选科目（四选二，填写2科即可）
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {ELECTIVE_12.map(renderSubjectInput)}
                      </div>
                    </div>
                  )}
                </>
              )}

              {watchedMode === '3+3' && (
                <div>
                  <p className="font-hand mb-2 text-xs font-semibold text-pen-blue">
                    选考科目（六选三，填写3科即可）
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {ALL_ELECTIVES.map(renderSubjectInput)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {NORMAL_SUBJECTS.map(renderSubjectInput)}
            </div>
          )}
        </div>

        {/* Problem Description */}
        <FormField
          control={form.control}
          name="problemDesc"
          render={({ field }) => (
            <FormItem>
              <FormLabel>学习困扰</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="描述学生遇到的学习问题（选填）"
                  className="min-h-[80px] resize-none"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <FileText className="mr-2 size-4" />
              生成诊断报告
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default DiagnosisForm;
