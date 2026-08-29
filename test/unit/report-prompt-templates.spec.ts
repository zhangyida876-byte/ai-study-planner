import {
  buildDiagnosisSubjectCoverageRules,
  buildOnionProductPathRules,
  buildProfessionalReportFramework,
} from '../../client/src/config/report-prompt-templates';

describe('report prompt templates', () => {
  it('unifies diagnosis, target gap and executable planning', () => {
    const prompt = buildProfessionalReportFramework('diagnosis');

    expect(prompt).toContain('## 1. 一句话结论');
    expect(prompt).toContain('## 2. 各科家长可观察现象');
    expect(prompt).toContain('## 3. 各科核心问题与根因');
    expect(prompt).toContain('### 跨科共性问题');
    expect(prompt).toContain('## 4. 当前日期、学期阶段与真实教学进度');
    expect(prompt).toContain('## 5. 升学或阶段目标影响');
    expect(prompt).toContain('## 6. 家长可执行动作');
    expect(prompt).toContain('### A. 未来一周');
    expect(prompt).toContain('### B. 开学第一周');
    expect(prompt).toContain('### C. 开学第一个月');
    expect(prompt).toContain('## 7. 洋葱学园承接方案');
    expect(prompt).toContain('## 8. 课程顾问转述话术');
    expect(prompt).toContain('30秒短版');
    expect(prompt).toContain('2分钟完整版');
    expect(prompt).toContain('单科1400-2000个中文字符');
    expect(prompt).toContain('不得限制为总共3行');
    expect(prompt).toContain('家长怎么检查');
    expect(prompt).toContain('教学进度校验（最高优先级）');
    expect(prompt).toContain('按常规校历推测，需用学校课表/教材目录/最近作业核实');
    expect(prompt).toContain('为什么现在做');
    expect(prompt).toContain('现在不要提前做什么');
  });

  it('keeps three observations and problems for one subject', () => {
    const prompt = buildDiagnosisSubjectCoverageRules(['数学']);

    expect(prompt).toContain('单科诊断');
    expect(prompt).toContain('数学');
    expect(prompt).toContain('3个家长可观察现象');
    expect(prompt).toContain('3个核心问题');
    expect(prompt).toContain('未来一周、开学第一周、开学第一个月');
    expect(prompt).toContain('不输出跨科共性问题');
  });

  it.each([
    ['数学', '英语'],
    ['语文', '数学', '英语'],
    ['语文', '数学', '英语', '物理'],
  ])('keeps every subject in multi-subject diagnosis: %j', (...subjects: string[]) => {
    const prompt = buildDiagnosisSubjectCoverageRules(subjects);

    expect(prompt).toContain(`${subjects.length}科诊断`);
    expect(prompt).toContain(`已填写科目：${subjects.join('、')}`);
    expect(prompt).toContain('每科至少2个家长可观察现象');
    expect(prompt).toContain('每科至少2个核心问题');
    expect(prompt).toContain('跨科共性问题');
    expect(prompt).toContain('每个科目至少1行产品承接');
    expect(prompt).toContain('禁止只分析最低分科目');
    expect(prompt).toContain('禁止为了控制篇幅删掉已填写科目');
  });

  it('requires concrete elementary and high-school subject depth', () => {
    const prompt = buildProfessionalReportFramework('diagnosis');

    expect(prompt).toContain('小学禁止只写“培养习惯、打好基础”');
    expect(prompt).toContain('自然拼读');
    expect(prompt).toContain('分数/小数/百分数');
    expect(prompt).toContain('高中禁止只写“高考压力大、提高综合能力”');
    expect(prompt).toContain('选科赋分');
    expect(prompt).toContain('当前模块/题型');
  });

  it('extends planning through subject selection, majors and employment', () => {
    const prompt = buildProfessionalReportFramework('plan');

    expect(prompt).toContain('## 二、可选升学路径对比');
    expect(prompt).toContain('重点高中、普通高中、中职/职教高考');
    expect(prompt).toContain('“5:5分流”不得当作全国统一比例');
    expect(prompt).toContain('## 三、选科、专业与就业影响');
    expect(prompt).toContain('## 五、报告结论');
    expect(prompt).toContain('禁止用“物理差/历史差”直接推导');
    expect(prompt).toContain('禁止输出逐月日程');
    expect(prompt).toContain('700-1000个中文字符');
  });

  it('keeps knowledge analysis within the requested knowledge point', () => {
    const prompt = buildProfessionalReportFramework('knowledge');

    expect(prompt).toContain('## 一、当前时间节点与最近一次关键考试');
    expect(prompt).toContain('## 三、近期考试重点与知识点位置');
    expect(prompt).toContain('## 七、未来7天行动清单');
    expect(prompt).toContain('## 十、洋葱学园承接建议');
    expect(prompt).toContain('第四单元等后续内容只能作为次级提醒');
    expect(prompt).toContain('不对某个孩子下最终升学结论');
  });

  it.each(['diagnosis', 'plan', 'knowledge'] as const)(
    'applies shared evidence controls to %s',
    (type) => {
      const prompt = buildProfessionalReportFramework(type);

      expect(prompt).toContain('基础薄弱（<60%）');
      expect(prompt).toContain('禁止编造精确数字');
    },
  );

  it('maps the verified Onion product capabilities to learning actions', () => {
    const rules = buildOnionProductPathRules();

    expect(rules).toContain('AI功能');
    expect(rules).toContain('同步课');
    expect(rules).toContain('知识点课程');
    expect(rules).toContain('解题/培优课');
    expect(rules).toContain('阶段测评、练习与错题复盘');
    expect(rules).toContain('禁止保分、保录取');
  });
});
