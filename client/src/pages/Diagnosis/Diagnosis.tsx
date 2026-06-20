import React, { useState, useCallback, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Copy, Check, Loader2, FileText } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { diagnosis as diagnosisApi } from '@client/src/api';
import { streamDiagnosisReport, buildScoresText } from '@client/src/api/plugins';
import WobblyCard from '@client/src/components/WobblyCard';
import { Streamdown } from '@client/src/components/ui/streamdown';
import { Button } from '@/components/ui/button';
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

/* ===== Schema & Constants ===== */

const optionalScore = () => z.number().min(0).max(150).optional();
const optionalScoreLow = () => z.number().min(0).max(100).optional();

const diagnosisFormSchema = z.object({
  grade: z.string().min(1, '请选择年级'),
  region: z.string().min(1, '请选择地区'),
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

type DiagnosisFormData = z.infer<typeof diagnosisFormSchema>;

const GRADE_OPTIONS = [
  '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
  '初一', '初二', '初三',
  '高一', '高二', '高三',
  '中职',
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

const CUSTOM_REGION_KEY = '__custom__';

const SUBJECT_FIELDS: Array<{
  name: keyof DiagnosisFormData;
  label: string;
  max: number;
}> = [
  { name: 'chinese', label: '语文', max: 150 },
  { name: 'math', label: '数学', max: 150 },
  { name: 'english', label: '英语', max: 150 },
  { name: 'physics', label: '物理', max: 100 },
  { name: 'chemistry', label: '化学', max: 100 },
  { name: 'biology', label: '生物', max: 100 },
  { name: 'history', label: '历史', max: 100 },
  { name: 'geography', label: '地理', max: 100 },
  { name: 'politics', label: '政治&道法', max: 100 },
];

const FORM_DEFAULTS: DiagnosisFormData = {
  grade: '',
  region: '',
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

/* ===== Component ===== */

const Diagnosis: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [isCustomRegion, setIsCustomRegion] = useState(false);
  const [regionSearch, setRegionSearch] = useState('');
  const customRegionRef = useRef('');

  const form = useForm<DiagnosisFormData>({
    resolver: zodResolver(diagnosisFormSchema) as unknown as Parameters<typeof useForm<DiagnosisFormData>>[0]['resolver'],
    defaultValues: FORM_DEFAULTS,
  });

  const onSubmit = useCallback(
    async (data: DiagnosisFormData) => {
      const scores: Record<string, number> = {};
      for (const field of SUBJECT_FIELDS) {
        const val = data[field.name];
        if (typeof val === 'number') {
          scores[field.label] = val;
        }
      }

      if (Object.keys(scores).length === 0) {
        toast.error('请至少填写一科成绩');
        return;
      }

      setIsGenerating(true);
      setReportContent('');

      let recordId: string | null = null;
      try {
        const createRes = await diagnosisApi.createDiagnosisRecord({
          grade: data.grade,
          region: data.region,
          scores,
          problemDesc: data.problemDesc || '',
        });
        recordId = createRes.id;

        const scoresText = buildScoresText(scores);
        const generator = streamDiagnosisReport({
          student_grade: data.grade,
          student_region: data.region,
          subject_scores: scoresText,
          learning_problems: data.problemDesc || '无',
        });

        let fullContent = '';
        for await (const chunk of generator) {
          fullContent += chunk;
          setReportContent(fullContent);
        }

        if (recordId) {
          await diagnosisApi.updateDiagnosisRecord(recordId, {
            status: 'completed',
            report: fullContent,
          });
        }

        setIsCustomRegion(false);
        setRegionSearch('');
        toast.success('诊断报告生成完成');
      } catch (error) {
        logger.error('诊断报告生成失败', String(error));
        toast.error('诊断报告生成失败，请重试');
        if (recordId) {
          try {
            await diagnosisApi.updateDiagnosisRecord(recordId, {
              status: 'failed',
            });
          } catch {
            /* ignore update failure */
          }
        }
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(reportContent);
      setCopied(true);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('复制失败');
    }
  }, [reportContent]);

  const handleRegionChange = useCallback(
    (value: string) => {
      if (value === CUSTOM_REGION_KEY) {
        setIsCustomRegion(true);
        form.setValue('region', customRegionRef.current || '');
      } else {
        setIsCustomRegion(false);
        customRegionRef.current = '';
        setRegionSearch('');
        form.setValue('region', value);
      }
    },
    [form]
  );

  /* ===== Render ===== */

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* ===== Left: Form ===== */}
      <div className="w-full shrink-0 lg:w-96">
        <WobblyCard variant="white" decoration="tape" wobblyIndex={0} hoverable={false}>
          <div className="p-6">
            <h2 className="font-marker mb-6 text-2xl font-bold">学生信息</h2>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* Grade */}
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        年级 <span className="text-marker-red">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="请选择年级" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GRADE_OPTIONS.map((g: string) => (
                            <SelectItem key={g} value={g}>
                              {g}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Region */}
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        地区 <span className="text-marker-red">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={handleRegionChange}
                        value={isCustomRegion ? CUSTOM_REGION_KEY : field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="请选择或搜索地区" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <div
                            className="p-1"
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <Input
                              placeholder="搜索省/市/区..."
                              value={regionSearch}
                              onChange={(e) => setRegionSearch(e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                          {Object.entries(PROVINCE_CITIES)
                            .filter(
                              ([province, cities]) =>
                                !regionSearch ||
                                province.includes(regionSearch) ||
                                cities.some((c) =>
                                  c.includes(regionSearch)
                                )
                            )
                            .slice(0, 30)
                            .map(([province, cities]) => (
                              <React.Fragment key={province}>
                                <SelectItem value={province}>
                                  {province}
                                </SelectItem>
                                {cities
                                  .filter(
                                    (c) =>
                                      !regionSearch ||
                                      c.includes(regionSearch)
                                  )
                                  .map((city) => (
                                    <SelectItem
                                      key={`${province}-${city}`}
                                      value={`${province}-${city}`}
                                      className="pl-8"
                                    >
                                      {city}
                                    </SelectItem>
                                  ))}
                              </React.Fragment>
                            ))}
                          <SelectItem value={CUSTOM_REGION_KEY}>
                            手动输入...
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {isCustomRegion && (
                        <Input
                          placeholder="请输入地区名称"
                          value={field.value || ''}
                          onChange={(e) => {
                            customRegionRef.current = e.target.value;
                            field.onChange(e);
                          }}
                          className="mt-2"
                        />
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Subject Scores */}
                <div>
                  <FormLabel className="mb-3 block">各科成绩</FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    {SUBJECT_FIELDS.map(({ name, label, max }) => (
                      <FormField
                        key={name}
                        control={form.control}
                        name={name}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">{label}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder={`0-${max}`}
                                min={0}
                                max={max}
                                name={field.name}
                                ref={field.ref}
                                disabled={field.disabled}
                                value={
                                  field.value !== undefined &&
                                  field.value !== null
                                    ? String(field.value)
                                    : ''
                                }
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  field.onChange(
                                    raw === ''
                                      ? undefined
                                      : Number(raw)
                                  );
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isGenerating}
                >
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
          </div>
        </WobblyCard>
      </div>

      {/* ===== Right: Report ===== */}
      <div className="min-w-0 flex-1">
        {isGenerating || reportContent ? (
          <WobblyCard
            variant="yellow"
            decoration="tack"
            wobblyIndex={1}
            hoverable={false}
          >
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-marker text-2xl font-bold">
                  诊断报告
                </h2>
                {reportContent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    disabled={isGenerating}
                  >
                    {copied ? (
                      <>
                        <Check className="mr-1 size-4" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 size-4" />
                        复制全文
                      </>
                    )}
                  </Button>
                )}
              </div>

              {isGenerating && !reportContent && (
                <div className="flex items-center gap-3 py-12 font-hand text-xl text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" />
                  正在生成诊断报告...
                </div>
              )}

              {reportContent && (
                <div className="font-hand prose-headings:font-marker">
                  <Streamdown>{reportContent}</Streamdown>
                </div>
              )}
            </div>
          </WobblyCard>
        ) : (
          <div className="flex h-full min-h-[400px] items-center justify-center">
            <p className="font-hand text-xl text-muted-foreground">
              填写学生信息，开始诊断
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Diagnosis;
