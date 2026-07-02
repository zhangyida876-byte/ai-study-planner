import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, FileText, Search, Sparkles } from 'lucide-react';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';

import { capabilityClient } from '@lark-apaas/client-toolkit';
import { policy as policyApi } from '@client/src/api';
import { PLUGIN_IDS, getEducationStage, streamPolicySearch, extractSubjectMaxHintsFromPolicyText } from '@client/src/api/plugins';
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
import type { StageProfile } from '@client/src/types/stage-profile';
import { parseScoreOverviewToSubjectScores } from '@client/src/utils/score-overview';
import {
  createCustomRegionOption,
  filterRegionOptions,
  findOptionByName,
  loadCities,
  loadCounties,
  loadProvinces,
  type RegionOption,
} from '@client/src/utils/region-network';

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

const DEFAULT_SCHOOLS: string[] = [
  '华中师范大学第一附属中学', '武汉中学', '武汉二中', '武汉六中',
  '武汉外国语学校', '武汉实验外国语学校', '武汉十一中',
  '武钢三中', '武汉三中', '武汉育才高级中学', '武汉汉铁高级中学',
  '武汉市第四十九中学', '武汉光谷第一中学', '武汉光谷第二高级中学',
  '华师一附中光谷分校', '武汉睿升学校', '武汉经济技术开发区第一中学',
  '洪山高级中学', '武汉市第十五中学', '武汉市第二十中学',
];

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

function resolveSubjectMax(
  label: string,
  fallback: number,
  hints: Record<string, number>,
): number {
  const direct = hints[label];
  if (typeof direct === 'number' && direct > 0) return direct;
  if (label === '政治&道法') {
    const daofa = hints['道法'] ?? hints['政治'];
    if (typeof daofa === 'number' && daofa > 0) return daofa;
  }
  return fallback;
}

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
  stageProfile?: StageProfile;
  onProfileFieldsChange?: () => void;
  onRegionPartsChange?: (parts: { province: string; city: string; county: string }) => void;
  onFormSnapshotChange?: (data: DiagnosisFormData) => void;
}

const SUBJECT_LABEL_TO_FIELD: Partial<Record<string, keyof DiagnosisFormData>> = {
  语文: 'chinese',
  数学: 'math',
  英语: 'english',
  物理: 'physics',
  化学: 'chemistry',
  生物: 'biology',
  历史: 'history',
  地理: 'geography',
  政治: 'politics',
};

const DiagnosisForm: React.FC<DiagnosisFormProps> = ({
  onSubmit,
  isGenerating,
  onMajorInfoChange,
  allowedGrades,
  stageLabel,
  stageProfile,
  onProfileFieldsChange,
  onRegionPartsChange,
  onFormSnapshotChange,
}) => {
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [county, setCounty] = useState('');
  const [isCustomRegion, setIsCustomRegion] = useState(false);
  const [regionLoading, setRegionLoading] = useState(false);
  const [provinceOptions, setProvinceOptions] = useState<RegionOption[]>([]);
  const [cityOptions, setCityOptions] = useState<RegionOption[]>([]);
  const [countyOptions, setCountyOptions] = useState<RegionOption[]>([]);
  const [provinceSearch, setProvinceSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [countySearch, setCountySearch] = useState('');
  const [cityLoadFailed, setCityLoadFailed] = useState(false);
  const [countyLoadFailed, setCountyLoadFailed] = useState(false);
  const [customCityMode, setCustomCityMode] = useState(false);
  const [customCountyMode, setCustomCountyMode] = useState(false);
  const [scoreSuggesting, setScoreSuggesting] = useState(false);
  const [scoreSuggested, setScoreSuggested] = useState(false);
  const [majorInfoContent, setMajorInfoContent] = useState('');
  const [majorInfoLoading, setMajorInfoLoading] = useState(false);
  const [internetSubjectMaxHints, setInternetSubjectMaxHints] = useState<Record<string, number>>({});
  const customRegionRef = useRef('');
  const applyingProfileRef = useRef(false);
  const lastAppliedProfileKeyRef = useRef('');

  const form = useForm<DiagnosisFormData>({
    resolver: zodResolver(diagnosisFormSchema) as unknown as Parameters<typeof useForm<DiagnosisFormData>>[0]['resolver'],
    defaultValues: FORM_DEFAULTS,
  });

  const markProfileDirty = useCallback(() => {
    onProfileFieldsChange?.();
  }, [onProfileFieldsChange]);

  const profileSnapshotKey = useMemo(() => {
    if (!stageProfile) return '';
    return JSON.stringify({
      studentName: stageProfile.studentName,
      province: stageProfile.province,
      city: stageProfile.city,
      county: stageProfile.county,
      grade: stageProfile.grade,
      targetSchool: stageProfile.targetSchool,
      targetScore: stageProfile.targetScore,
      targetMajor: stageProfile.targetMajor,
      examDate: stageProfile.examDate,
      boardingType: stageProfile.boardingType,
      examMode: stageProfile.examMode,
      weeklyStudyHours: stageProfile.weeklyStudyHours,
      weakSubjects: stageProfile.weakSubjects,
      scoresOverview: stageProfile.scoresOverview,
      updatedAt: stageProfile.updatedAt,
    });
  }, [stageProfile]);

  useEffect(() => {
    if (!stageProfile) return;
    if (profileSnapshotKey && profileSnapshotKey === lastAppliedProfileKeyRef.current) return;
    applyingProfileRef.current = true;
    if (stageProfile.studentName) form.setValue('studentName', stageProfile.studentName);
    if (stageProfile.grade) {
      const safeGrade = allowedGrades?.includes(stageProfile.grade)
        ? stageProfile.grade
        : (allowedGrades?.[allowedGrades.length - 1] || stageProfile.grade);
      form.setValue('grade', safeGrade);
    }
    if (stageProfile.province) {
      setSelectedProvince(stageProfile.province);
      setSelectedCity(stageProfile.city || '');
      setCounty(stageProfile.county || '');
      setIsCustomRegion(false);
      form.setValue('region', buildRegionText(stageProfile.province, stageProfile.city, stageProfile.county));
      onRegionPartsChange?.({
        province: stageProfile.province,
        city: stageProfile.city || '',
        county: stageProfile.county || '',
      });
    }
    form.setValue('targetSchool', stageProfile.targetSchool || '');
    form.setValue('targetScore', stageProfile.targetScore);
    setScoreSuggested(stageProfile.targetScore != null);
    if (stageProfile.targetMajor) form.setValue('targetMajor', stageProfile.targetMajor);
    if (stageProfile.examDate) form.setValue('examDate', stageProfile.examDate);
    if (stageProfile.boardingType) form.setValue('boardingType', stageProfile.boardingType);
    if (stageProfile.examMode) form.setValue('examMode', stageProfile.examMode);
    if (stageProfile.weeklyStudyHours) {
      const weekly = parseFloat(stageProfile.weeklyStudyHours);
      if (!Number.isNaN(weekly)) form.setValue('monthlyStudyHours', Math.round(weekly * 4));
    }
    if (stageProfile.weakSubjects || stageProfile.scoresOverview) {
      const hint = [
        stageProfile.weakSubjects ? `薄弱科目：${stageProfile.weakSubjects}` : '',
        stageProfile.scoresOverview ? `成绩概览：${stageProfile.scoresOverview}` : '',
      ].filter(Boolean).join('；');
      const current = form.getValues('problemDesc');
      if (!current?.trim()) form.setValue('problemDesc', hint);
    }
    if (stageProfile.scoresOverview) {
      const parsedScores = parseScoreOverviewToSubjectScores(stageProfile.scoresOverview);
      for (const [label, score] of Object.entries(parsedScores)) {
        const fieldName = SUBJECT_LABEL_TO_FIELD[label];
        if (fieldName) {
          form.setValue(fieldName, score);
        }
      }
    }
    queueMicrotask(() => {
      applyingProfileRef.current = false;
      if (profileSnapshotKey) {
        lastAppliedProfileKeyRef.current = profileSnapshotKey;
      }
    });
  }, [form, profileSnapshotKey, stageProfile, onRegionPartsChange, allowedGrades]);

  useEffect(() => {
    if (!onProfileFieldsChange) return;
    const tracked = new Set([
      'studentName', 'grade', 'region', 'targetSchool', 'targetMajor',
      'targetScore', 'examDate', 'boardingType', 'examMode', 'problemDesc',
      'chinese', 'math', 'english', 'physics', 'chemistry', 'biology',
      'history', 'geography', 'politics',
    ]);
    const sub = form.watch((_value, info) => {
      if (info.type === 'change' && info.name && tracked.has(info.name) && !applyingProfileRef.current) {
        onProfileFieldsChange?.();
        onFormSnapshotChange?.(form.getValues());
      }
    });
    return () => sub.unsubscribe();
  }, [form, onProfileFieldsChange, onFormSnapshotChange]);

  useEffect(() => {
    let cancelled = false;
    const fetchProvinces = async () => {
      setRegionLoading(true);
      try {
        const items = await loadProvinces();
        if (cancelled) return;
        setProvinceOptions(items);
      } catch {
        if (!cancelled) {
          setProvinceOptions([]);
          toast.error('地区列表联网加载失败，请稍后重试');
        }
      } finally {
        if (!cancelled) setRegionLoading(false);
      }
    };
    fetchProvinces();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedProvince || isCustomRegion) {
      setCityOptions([]);
      setCountyOptions([]);
      return;
    }
    const province = findOptionByName(provinceOptions, selectedProvince);
    if (!province) return;
    let cancelled = false;
    const fetchCities = async () => {
      setRegionLoading(true);
      setCityLoadFailed(false);
      try {
        const items = await loadCities(province);
        if (cancelled) return;
        setCityOptions(items);
      } catch {
        if (!cancelled) {
          setCityOptions([]);
          setCityLoadFailed(true);
        }
      } finally {
        if (!cancelled) setRegionLoading(false);
      }
    };
    fetchCities();
    return () => {
      cancelled = true;
    };
  }, [selectedProvince, provinceOptions, isCustomRegion]);

  useEffect(() => {
    if (!selectedCity || isCustomRegion) {
      setCountyOptions([]);
      return;
    }
    const city = findOptionByName(cityOptions, selectedCity);
    if (!city) {
      setCountyOptions([]);
      return;
    }
    let cancelled = false;
    const fetchCounties = async () => {
      setRegionLoading(true);
      setCountyLoadFailed(false);
      try {
        const items = await loadCounties(city);
        if (cancelled) return;
        setCountyOptions(items);
      } catch {
        if (!cancelled) {
          setCountyOptions([]);
          setCountyLoadFailed(true);
        }
      } finally {
        if (!cancelled) setRegionLoading(false);
      }
    };
    fetchCounties();
    return () => {
      cancelled = true;
    };
  }, [selectedCity, cityOptions, isCustomRegion]);

  const watchedGrade = form.watch('grade');
  const watchedMode = form.watch('examMode');
  const watchedPhysics = form.watch('physics');
  const watchedHistory = form.watch('history');
  const watchedRegion = form.watch('region');
  const watchedMajor = form.watch('targetMajor');
  const isHighSchool = ['高一', '高二', '高三'].includes(watchedGrade);
  const isMiddleSchool = ['初一', '初二', '初三'].includes(watchedGrade);
  const isElementary = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'].includes(watchedGrade);

  const watchedSchool = form.watch('targetSchool');

  useEffect(() => {
    if (!watchedRegion || !watchedGrade) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const stage = getEducationStage(watchedGrade);
        const keyword =
          stage === 'elementary'
            ? '小升初 科目 分值 总分构成'
            : stage === 'middle'
              ? '中考 科目 分值 总分构成'
              : '高考 科目 分值 总分构成';
        const year = String(new Date().getFullYear());
        let full = '';
        for await (const chunk of streamPolicySearch({
          region: watchedRegion,
          year,
          keyword,
        })) {
          if (cancelled) break;
          full += chunk;
        }
        if (!cancelled) {
          setInternetSubjectMaxHints(extractSubjectMaxHintsFromPolicyText(full));
        }
      } catch {
        if (!cancelled) setInternetSubjectMaxHints({});
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [watchedRegion, watchedGrade]);

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

  const filteredProvinces = filterRegionOptions(provinceOptions, provinceSearch);
  const filteredCities = filterRegionOptions(
    selectedCity && !findOptionByName(cityOptions, selectedCity)
      ? [...cityOptions, createCustomRegionOption(selectedCity, 'city')]
      : cityOptions,
    citySearch,
  );
  const filteredCounties = filterRegionOptions(
    county && !findOptionByName(countyOptions, county)
      ? [...countyOptions, createCustomRegionOption(county, 'county')]
      : countyOptions,
    countySearch,
  );
  const selectedCityValue = customCityMode || (selectedCity && !findOptionByName(cityOptions, selectedCity))
    ? '__custom_city__'
    : selectedCity;
  const selectedCountyValue = customCountyMode || (county && !findOptionByName(countyOptions, county))
    ? '__custom_county__'
    : county;

  const handleProvinceChange = useCallback((val: string) => {
    markProfileDirty();
    setSelectedProvince(val);
    setSelectedCity('');
    setCounty('');
    setCitySearch('');
    setCountySearch('');
    setCityLoadFailed(false);
    setCountyLoadFailed(false);
    setCustomCityMode(false);
    setCustomCountyMode(false);
    if (val === '__custom__') {
      setIsCustomRegion(true);
      form.setValue('region', customRegionRef.current || '');
      setCityOptions([]);
      setCountyOptions([]);
      onRegionPartsChange?.({ province: '', city: '', county: '' });
    } else {
      setIsCustomRegion(false);
      form.setValue('region', val);
      onRegionPartsChange?.({ province: val, city: '', county: '' });
    }
  }, [form, markProfileDirty, onRegionPartsChange]);

  const handleCityChange = useCallback((val: string) => {
    markProfileDirty();
    const next = val === '__custom_city__' ? '' : val;
    setSelectedCity(next);
    setCounty('');
    setCountySearch('');
    setCustomCityMode(val === '__custom_city__');
    setCustomCountyMode(false);
    form.setValue('region', buildRegionText(selectedProvince, next, ''));
    onRegionPartsChange?.({ province: selectedProvince, city: next, county: '' });
  }, [form, selectedProvince, markProfileDirty, onRegionPartsChange]);

  const handleCountyChange = useCallback((val: string) => {
    markProfileDirty();
    const next = val === '__custom_county__' ? '' : val;
    setCounty(next);
    setCustomCountyMode(val === '__custom_county__');
    form.setValue('region', buildRegionText(selectedProvince, selectedCity, next));
    onRegionPartsChange?.({ province: selectedProvince, city: selectedCity, county: next });
  }, [form, selectedProvince, selectedCity, markProfileDirty, onRegionPartsChange]);

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
    const effectiveMax = resolveSubjectMax(subject.label, subject.max, internetSubjectMaxHints);
    return (
    <FormField
      key={String(subject.name)}
      control={form.control}
      name={subject.name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm">
            {subject.label}
            <span className="ml-1 text-xs font-normal text-ink/50">(满分{effectiveMax})</span>
          </FormLabel>
          <FormControl>
            <Input
              type="number"
              placeholder={`0-${effectiveMax}`}
              min={0}
              max={effectiveMax}
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
              <div className="mb-2 rounded-md border border-dashed border-pen-blue/30 bg-pen-blue/5 px-3 py-2 text-xs text-ink/70">
                当前地区：{watchedRegion || '未选择'}
                {regionLoading && <span className="ml-2 text-pen-blue">正在加载地区列表...</span>}
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                <Select onValueChange={handleProvinceChange} value={isCustomRegion ? '__custom__' : selectedProvince}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={regionLoading ? '联网加载中...' : '省/直辖市'} />
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
                    {filteredProvinces.map((p) => (
                        <SelectItem key={p.adcode} value={p.name}>{p.name}</SelectItem>
                      ))}
                    <SelectItem value="__custom__">手动输入...</SelectItem>
                  </SelectContent>
                </Select>
                {!isCustomRegion && selectedProvince && (
                  <Select onValueChange={handleCityChange} value={selectedCityValue}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={regionLoading ? '联网加载中...' : '市/区'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <div className="p-1" onKeyDown={(e) => e.stopPropagation()}>
                        <Input
                          placeholder="模糊/拼音/别名（如 wulanhaote）"
                          value={citySearch}
                          onChange={(e) => setCitySearch(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      {filteredCities.map((c) => (
                        <SelectItem key={c.adcode} value={c.name}>{c.name}</SelectItem>
                      ))}
                      <SelectItem value="__custom_city__">自定义城市/盟/州...</SelectItem>
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
              {!isCustomRegion && (customCityMode || cityLoadFailed || (selectedCity && !findOptionByName(cityOptions, selectedCity))) && (
                <Input
                  placeholder={cityLoadFailed ? '城市联网失败，可直接输入城市' : '输入城市/盟/州'}
                  value={selectedCity}
                  onChange={(e) => {
                    const next = e.target.value;
                    markProfileDirty();
                    setSelectedCity(next);
                    setCounty('');
                    form.setValue('region', buildRegionText(selectedProvince, next, ''));
                    onRegionPartsChange?.({ province: selectedProvince, city: next, county: '' });
                  }}
                  className="mt-2"
                />
              )}
              {!isCustomRegion && selectedCity && (
                <Select onValueChange={handleCountyChange} value={selectedCountyValue}>
                  <FormControl>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder={regionLoading ? '联网加载中...' : '区/县（选填）'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <div className="p-1" onKeyDown={(e) => e.stopPropagation()}>
                      <Input
                        placeholder="模糊/拼音/别名"
                        value={countySearch}
                        onChange={(e) => setCountySearch(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    {filteredCounties.map((item) => (
                      <SelectItem key={item.adcode} value={item.name}>{item.name}</SelectItem>
                    ))}
                    <SelectItem value="__custom_county__">手动输入区县...</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {!isCustomRegion && selectedCity && (customCountyMode || countyLoadFailed || (county && !findOptionByName(countyOptions, county))) && (
                <Input
                  placeholder={countyLoadFailed ? '区县联网失败，可选填手输' : '输入区/县/旗（选填）'}
                  value={county}
                  onChange={(e) => {
                    const next = e.target.value;
                    markProfileDirty();
                    setCounty(next);
                    form.setValue('region', buildRegionText(selectedProvince, selectedCity, next));
                    onRegionPartsChange?.({ province: selectedProvince, city: selectedCity, county: next });
                  }}
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
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={isElementary ? '输入目标初中名称' : isHighSchool ? '输入目标大学名称' : '输入目标院校名称'}
                      className="pl-8"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        field.onChange(e);
                        setScoreSuggested(false);
                      }}
                    />
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
                  必考（3科，满分各150）
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
