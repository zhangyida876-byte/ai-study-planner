import React, { useState, useCallback, useRef, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, FileText, Search, Sparkles } from 'lucide-react';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';

import { capabilityClient } from '@lark-apaas/client-toolkit';
import { policy as policyApi } from '@client/src/api';
import { PLUGIN_IDS, getEducationStage } from '@client/src/api/plugins';
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
import { logger } from '@lark-apaas/client-toolkit/logger';

/* ===== Schema & Constants ===== */

const optionalScore = () => z.number().min(0).max(150).optional();
const optionalScoreLow = () => z.number().min(0).max(100).optional();

const diagnosisFormSchema = z.object({
  studentName: z.string().optional(),
  grade: z.string().min(1, '请选择年级'),
  region: z.string().min(1, '请选择地区'),
  boardingType: z.string().optional(),
  monthlyStudyHours: z.number().optional(),
  examMode: z.string().optional(),
  examDate: z.string().optional(),
  targetSchool: z.string().optional(),
  targetMajor: z.string().optional(),
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

const BOARDING_OPTIONS = [
  { value: 'day', label: '走读' },
  { value: 'boarding', label: '住读' },
];

const HS_MODES: Array<{ value: string; label: string }> = [
  { value: '3+1+2', label: '3+1+2（物理/历史 二选一）' },
  { value: '3+3', label: '3+3（六选三）' },
];

// 根据地区、年级、考试模式获取科目满分
const getSubjectMaxScore = (subject: string, grade: string, region?: string, examMode?: string): number => {
  const stage = getEducationStage(grade);
  
  // 高考所有主科都是150，副科100
  if (stage === 'high') {
    if (['chinese', 'math', 'english'].includes(subject)) return 150;
    return 100;
  }
  
  // 小学都是100分
  if (stage === 'elementary') {
    return 100;
  }
  
  // 中考根据地区区分
  if (region) {
    // 部分地区中考主科120分
    const regionsWith120 = ['广东省', '山东省', '四川省', '河南省', '湖北省', '湖南省'];
    if (regionsWith120.some(r => region.includes(r))) {
      if (['chinese', 'math', 'english'].includes(subject)) return 120;
      return 100;
    }
    
    // 上海等地中考150分
    const regionsWith150 = ['北京市', '上海市', '江苏省', '浙江省'];
    if (regionsWith150.some(r => region.includes(r))) {
      return 150;
    }
  }
  
  // 默认中考主科150，副科100
  if (['chinese', 'math', 'english'].includes(subject)) return 150;
  return 100;
};

const DEFAULT_SCHOOLS: string[] = [
  '华中师范大学第一附属中学', '武汉中学', '武汉二中', '武汉六中',
  '武汉外国语学校', '武汉实验外国语学校', '武汉十一中',
  '武钢三中', '武汉三中', '武汉育才高级中学', '武汉汉铁高级中学',
  '武汉市第四十九中学', '武汉光谷第一中学', '武汉光谷第二高级中学',
  '华师一附中光谷分校', '武汉睿升学校', '武汉经济技术开发区第一中学',
  '洪山高级中学', '武汉市第十五中学', '武汉市第二十中学',
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

const ELEMENTARY_SUBJECTS: Array<{ name: keyof DiagnosisFormData; label: string; max: number }> = [
  { name: 'chinese', label: '语文', max: 100 },
  { name: 'math', label: '数学', max: 100 },
  { name: 'english', label: '英语', max: 100 },
];

const MIDDLE_SUBJECTS: Array<{ name: keyof DiagnosisFormData; label: string; max: number }> = [
  { name: 'chinese', label: '语文', max: 120 },
  { name: 'math', label: '数学', max: 120 },
  { name: 'english', label: '英语', max: 120 },
  { name: 'physics', label: '物理', max: 100 },
  { name: 'chemistry', label: '化学', max: 100 },
  { name: 'biology', label: '生物', max: 100 },
  { name: 'history', label: '历史', max: 100 },
  { name: 'geography', label: '地理', max: 100 },
  { name: 'politics', label: '政治&道法', max: 100 },
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

const STAGE_SUBJECTS: Record<string, typeof NORMAL_SUBJECTS> = {
  elementary: ELEMENTARY_SUBJECTS,
  middle: MIDDLE_SUBJECTS,
};

function getStageSubjects(grade: string): typeof NORMAL_SUBJECTS {
  if (['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'].includes(grade)) return ELEMENTARY_SUBJECTS;
  if (['初一', '初二', '初三'].includes(grade)) return MIDDLE_SUBJECTS;
  return NORMAL_SUBJECTS;
}

const FORM_DEFAULTS: DiagnosisFormData = {
  studentName: '',
  grade: '',
  region: '',
  boardingType: undefined,
  monthlyStudyHours: undefined,
  examMode: undefined,
  examDate: '',
  targetSchool: '',
  targetMajor: '',
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
  const isElementary = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'].includes(grade);
  const isMiddle = ['初一', '初二', '初三'].includes(grade);

  if (isElementary) return ELEMENTARY_SUBJECTS;
  if (!isHighSchool) return isMiddle ? MIDDLE_SUBJECTS : NORMAL_SUBJECTS;

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
  onMajorInfoChange?: (content: string) => void;
  allowedGrades?: string[];
  stageLabel?: string;
}

const DiagnosisForm: React.FC<DiagnosisFormProps> = ({
  onSubmit,
  isGenerating,
  onMajorInfoChange,
  allowedGrades,
  stageLabel,
}) => {
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [county, setCounty] = useState('');
  const [isCustomRegion, setIsCustomRegion] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schoolOpen, setSchoolOpen] = useState(false);
  const [scoreSuggesting, setScoreSuggesting] = useState(false);
  const [scoreSuggested, setScoreSuggested] = useState(false);
  const [fetchedSchools, setFetchedSchools] = useState<string[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [majorInfoContent, setMajorInfoContent] = useState('');
  const [majorInfoLoading, setMajorInfoLoading] = useState(false);
  const customRegionRef = useRef('');
  const schoolCacheRef = useRef<Record<string, string[]>>({});

  const form = useForm<DiagnosisFormData>({
    resolver: zodResolver(diagnosisFormSchema) as unknown as Parameters<typeof useForm<DiagnosisFormData>>[0]['resolver'],
    defaultValues: FORM_DEFAULTS,
  });

  const watchedGrade = form.watch('grade');
  const watchedMode = form.watch('examMode');
  const watchedPhysics = form.watch('physics');
  const watchedHistory = form.watch('history');
  const watchedRegion = form.watch('region');
  const watchedMajor = form.watch('targetMajor');
  const isHighSchool = ['高一', '高二', '高三'].includes(watchedGrade);
  const isMiddleSchool = ['初一', '初二', '初三'].includes(watchedGrade);
  const isElementary = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'].includes(watchedGrade);

  const displaySchools = fetchedSchools.length > 0 ? fetchedSchools : [];
  const filteredSchools = schoolSearch
    ? displaySchools.filter((s) => s.includes(schoolSearch))
    : displaySchools;

  useEffect(() => {
    if (!watchedRegion || isCustomRegion) return;
    const stage = getEducationStage(watchedGrade);
    const cacheKey = `${watchedRegion}_${stage}`;
    if (schoolCacheRef.current[cacheKey]) {
      setFetchedSchools(schoolCacheRef.current[cacheKey]);
      return;
    }
    let cancelled = false;
    const schoolType = stage === 'elementary' ? '初中' : stage === 'high' ? '大学' : '高中';
    const fetchSchools = async () => {
      setSchoolsLoading(true);
      try {
        if (stage === 'middle') {
          const result = await policyApi.searchSchools(watchedRegion);
          if (cancelled) return;
          const names = result.schools.map((s) => s.name);
          const unique = [...new Set(names)];
          schoolCacheRef.current[cacheKey] = unique;
          setFetchedSchools(unique);
        } else if (stage === 'high') {
          const streamResult = capabilityClient
            .load(PLUGIN_IDS.HIGH_SCHOOL_REGION_SEARCH)
            .callStream('searchSummary', { region: watchedRegion } as Record<string, unknown>);
          let fullContent = '';
          for await (const chunk of streamResult as AsyncIterable<Record<string, unknown>>) {
            if (cancelled) break;
            const delta = typeof chunk?.summary === 'string' ? chunk.summary : '';
            if (delta) fullContent += delta;
          }
          if (cancelled) return;
          const lines = fullContent.split('\n').map((l: string) => l.trim()).filter(Boolean);
          const names = lines
            .filter((l: string) => !l.startsWith('#') && !l.startsWith('|') && !l.startsWith('\u6570\u636e') && !l.startsWith('\u4fe1\u606f') && !l.startsWith('\u5907\u6ce8'))
            .map((l: string) => l.replace(/^[\d.\-\s]+/, '').replace(/^[-*]\s*/, '').replace(/\uff08.*\uff09$/, '').replace(/\(.*\)$/, '').trim())
            .filter((l: string) => l.length >= 2 && l.length <= 30);
          const unique = [...new Set(names)];
          schoolCacheRef.current[cacheKey] = unique;
          setFetchedSchools(unique);
        } else {
          const streamResult = capabilityClient
            .load(PLUGIN_IDS.JUNIOR_HIGH_SEARCH)
            .callStream('searchSummary', { region: watchedRegion } as Record<string, unknown>);
          let fullContent = '';
          for await (const chunk of streamResult as AsyncIterable<Record<string, unknown>>) {
            if (cancelled) break;
            const delta = typeof chunk?.summary === 'string' ? chunk.summary : '';
            if (delta) fullContent += delta;
          }
          if (cancelled) return;
          const lines = fullContent.split('\n').map((l: string) => l.trim()).filter(Boolean);
          const names = lines
            .filter((l: string) => !l.startsWith('#') && !l.startsWith('-') && !l.startsWith('*') && !l.startsWith('|') && !l.startsWith('\u6570\u636e') && !l.startsWith('\u4fe1\u606f') && !l.startsWith('\u5907\u6ce8'))
            .map((l: string) => l.replace(/^[\d.\-\s]+/, '').replace(/\uff08.*\uff09$/, '').trim())
            .filter((l: string) => l.length >= 2 && l.length <= 30);
          const unique = [...new Set(names)];
          schoolCacheRef.current[cacheKey] = unique;
          setFetchedSchools(unique);
        }
      } catch (err) {
        if (!cancelled) {
          logger.error(`搜索${schoolType}失败`, String(err));
          setFetchedSchools([]);
        }
      } finally {
        if (!cancelled) setSchoolsLoading(false);
      }
    };
    fetchSchools();
    return () => { cancelled = true; };
  }, [watchedRegion, isCustomRegion, watchedGrade]);

  const watchedSchool = form.watch('targetSchool');

  useEffect(() => {
    if (!watchedRegion || !watchedSchool || isElementary) return;
    if (isHighSchool && watchedMajor) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      const fetchScore = async () => {
        setScoreSuggesting(true);
        setScoreSuggested(false);
        try {
          if (isMiddleSchool) {
            const result = await policyApi.searchSchools(watchedRegion);
            if (cancelled) return;
            const match = result.schools.find(
              (s) => s.name === watchedSchool || s.name.includes(watchedSchool) || watchedSchool.includes(s.name)
            );
            if (match && match.score > 0) {
              form.setValue('targetScore', match.score);
              setScoreSuggested(true);
              return;
            }
          }
        } catch {
          // database lookup failed, try AI plugin
        }
        try {
          const isHS = ['高一', '高二', '高三'].includes(watchedGrade);
          const examType = isHS ? '高考' : '中考';
          const streamResult = capabilityClient
            .load('high_school_admission_score_query_1')
            .callStream('searchSummary', {
              region: watchedRegion,
              school_name: watchedSchool,
              exam_type: examType,
            });
          let fullContent = '';
          for await (const chunk of streamResult as AsyncIterable<Record<string, unknown>>) {
            if (cancelled) break;
            const delta = typeof chunk?.content === 'string' ? chunk.content : '';
            if (delta) fullContent += delta;
          }
          if (cancelled) return;
          const matches = fullContent.match(/(\d{3})\s*分/g);
          const scores = matches?.map((m: string) => parseInt(m, 10)).filter((n: number) => n >= 200 && n <= 900) ?? [];
          if (scores.length > 0) {
            form.setValue('targetScore', Math.max(...scores));
            setScoreSuggested(true);
          }
        } catch (err) {
          if (!cancelled) {
            const msg = String(err);
            if (msg.includes('RateLimit') || msg.includes('频繁')) {
              logger.info('分数线查询限流，跳过');
            } else {
              logger.error('获取分数线失败', String(msg));
            }
          }
        } finally {
          if (!cancelled) setScoreSuggesting(false);
        }
      };
      fetchScore();
    }, 800);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [watchedRegion, watchedSchool, watchedGrade, watchedMajor, isElementary, isMiddleSchool, isHighSchool, form]);

  useEffect(() => {
    if (!isHighSchool || !watchedRegion || !watchedSchool || !watchedMajor) {
      if (!watchedMajor) setMajorInfoContent('');
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      const fetchMajorInfo = async () => {
        setMajorInfoLoading(true);
        setMajorInfoContent('');
        try {
          const selectedSubjects = watchedMode
            ? [
                ...(watchedPhysics != null ? ['物理'] : []),
                ...(watchedHistory != null ? ['历史'] : []),
                ...(['chemistry', 'biology', 'geography', 'politics'] as const)
                  .filter((k) => form.getValues(k) != null)
                  .map((k) => ({ chemistry: '化学', biology: '生物', geography: '地理', politics: '政治' } as Record<string, string>)[k]),
              ].join('+')
            : '';
          const streamResult = capabilityClient
            .load(PLUGIN_IDS.MAJOR_CAREER_QUERY)
            .callStream('searchSummary', {
              region: watchedRegion,
              university_name: watchedSchool,
              major_name: watchedMajor,
              selected_subjects: selectedSubjects || undefined,
            } as Record<string, unknown>);
          let fullContent = '';
          for await (const chunk of streamResult as AsyncIterable<Record<string, unknown>>) {
            if (cancelled) break;
            const delta = typeof chunk?.summary === 'string' ? chunk.summary : '';
            if (delta) {
              fullContent += delta;
              if (!cancelled) setMajorInfoContent(fullContent);
            }
          }
          if (!cancelled) {
            const matches = fullContent.match(/(\d{3})\s*分/g);
            const scores = matches?.map((m: string) => parseInt(m, 10)).filter((n: number) => n >= 200 && n <= 900) ?? [];
            if (scores.length > 0) {
              form.setValue('targetScore', Math.max(...scores));
              setScoreSuggested(true);
            }
            onMajorInfoChange?.(fullContent);
          }
        } catch (err) {
          if (!cancelled) {
            const msg = String(err);
            if (msg.includes('RateLimit') || msg.includes('频繁')) {
              logger.info('专业查询限流，请稍后重试');
              setMajorInfoContent('查询过于频繁，请稍后重新输入专业名称触发查询');
            } else {
              logger.error('查询专业信息失败', String(msg));
            }
          }
        } finally {
          if (!cancelled) setMajorInfoLoading(false);
        }
      };
      fetchMajorInfo();
    }, 800);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [isHighSchool, watchedRegion, watchedSchool, watchedMajor, watchedMode, watchedPhysics, watchedHistory, form]);

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

  const renderSubjectInput = (subject: { name: keyof DiagnosisFormData; label: string; max: number }) => {
    // 动态计算满分，优先根据地区和年级适配
    const dynamicMax = getSubjectMaxScore(subject.name, watchedGrade, watchedRegion, watchedMode);
    return (
      <FormField
        key={String(subject.name)}
        control={form.control}
        name={subject.name}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm">
              {subject.label}
              <span className="ml-1 text-xs font-normal text-ink/50">(满分{dynamicMax})</span>
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder={`0-${dynamicMax}`}
                min={0}
                max={dynamicMax}
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
  };

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
                  {GRADE_OPTIONS.filter((g) => !allowedGrades || allowedGrades.includes(g)).map((g: string) => (
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

        {/* Boarding Type */}
        <FormField
          control={form.control}
          name="boardingType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>走读/住读</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BOARDING_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Monthly Study Hours */}
        <FormField
          control={form.control}
          name="monthlyStudyHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>每月可支配学习时间（小时）</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="如：120"
                  min={0}
                  max={720}
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

        {/* Exam Date (for middle/high school) */}
        {(isHighSchool || isMiddleSchool) && (
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

        {/* Target School (searchable) & Score */}
        <div className={isElementary ? '' : 'grid grid-cols-2 gap-3'}>
          <FormField
            control={form.control}
            name="targetSchool"
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel>
                  {isElementary ? '目标初中' : isHighSchool ? '目标大学' : '目标院校'}
                  {schoolsLoading && (
                    <span className="ml-1.5 inline-flex items-center gap-1 text-xs text-pen-blue">
                      <Loader2 className="size-3 animate-spin" />
                      搜索中
                    </span>
                  )}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={isElementary ? '搜索或手动输入初中院校名称' : isHighSchool ? '搜索或手动输入大学院校名称' : '搜索或手动输入高中院校名称，支持初中/高中/大学查询'}
                      className="pl-8"
                      {...field}
                      value={field.value ?? ''}
                      onFocus={() => setSchoolOpen(true)}
                      onBlur={() => setTimeout(() => setSchoolOpen(false), 200)}
                      onChange={(e) => {
                        field.onChange(e);
                        setSchoolSearch(e.target.value);
                      }}
                    />
                    {schoolOpen && (
                      <div className="absolute top-full z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border-2 border-ink/20 bg-card shadow-md">
                        {schoolsLoading ? (
                          <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
                            <Loader2 className="size-3 animate-spin" />
                            正在查询{isElementary ? '初中' : isHighSchool ? '大学' : '学校'}数据...
                          </div>
                        ) : filteredSchools.length > 0 ? (
                          filteredSchools.map((school) => (
                            <button
                              key={school}
                              type="button"
                              className="w-full px-3 py-1.5 text-left text-xs hover:bg-accent"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                field.onChange(school);
                                setSchoolSearch('');
                                setSchoolOpen(false);
                                setScoreSuggested(false);
                              }}
                            >
                              {school}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-3 text-xs text-muted-foreground">
                            暂无匹配学校，请直接输入
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {!isElementary && (
            <FormField
              control={form.control}
              name="targetScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isHighSchool ? '大学投档线' : '最新分数线'}
                    {scoreSuggesting && (
                      <span className="ml-1.5 inline-flex items-center gap-1 text-xs text-pen-blue">
                        <Loader2 className="size-3 animate-spin" />
                        查询中
                      </span>
                    )}
                    {scoreSuggested && field.value != null && (
                      <span className="ml-1.5 inline-flex items-center gap-1 text-xs text-emerald-600">
                        <Sparkles className="size-3" />
                        已匹配
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={isHighSchool ? '选择大学后自动匹配投档线' : '选择院校后自动匹配分数线'}
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
          )}
        </div>

        {/* Target Major (high school only, after university selected) */}
        {isHighSchool && watchedSchool && (
          <FormField
            control={form.control}
            name="targetMajor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  目标专业
                  {majorInfoLoading && (
                    <span className="ml-1.5 inline-flex items-center gap-1 text-xs text-pen-blue">
                      <Loader2 className="size-3 animate-spin" />
                      查询中
                    </span>
                  )}
                  {majorInfoContent && !majorInfoLoading && (
                    <span className="ml-1.5 inline-flex items-center gap-1 text-xs text-emerald-600">
                      <Sparkles className="size-3" />
                      已获取
                    </span>
                  )}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="输入专业名称，如：计算机科学与技术"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      field.onChange(e);
                      if (!e.target.value) setMajorInfoContent('');
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Subject Scores */}
        <div>
          <FormLabel className="mb-3 block">各科成绩</FormLabel>

          {isHighSchool && watchedMode ? (
            <div className="space-y-4">
              {/* Core: 3 required */}
              <div>
                <p className="font-hand mb-2 text-xs font-semibold text-pen-blue">
                  必考（3科，满分各{getSubjectMaxScore('chinese', watchedGrade, watchedRegion, watchedMode)}）
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
              {getStageSubjects(watchedGrade).map(renderSubjectInput)}
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
