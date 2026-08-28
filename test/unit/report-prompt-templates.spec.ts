import {
  buildOnionProductPathRules,
  buildProfessionalReportFramework,
} from '../../client/src/config/report-prompt-templates';

describe('report prompt templates', () => {
  it('unifies diagnosis, target gap and executable planning', () => {
    const prompt = buildProfessionalReportFramework('diagnosis');

    expect(prompt).toContain('## 1. 一句话判断');
    expect(prompt).toContain('## 2. 家长能观察到的3-5个现象');
    expect(prompt).toContain('## 3. 现象背后的深层根因');
    expect(prompt).toContain('## 5. 最值得老师先讲的3个问题');
    expect(prompt).toContain('## 7. 开学前7天行动清单');
    expect(prompt).toContain('开学第一周');
    expect(prompt).toContain('开学第一个月');
    expect(prompt).toContain('## 9. 洋葱学园承接方案');
    expect(prompt).toContain('## 10. 课程顾问口播话术');
    expect(prompt).toContain('30秒短版');
    expect(prompt).toContain('2分钟完整版');
    expect(prompt).toContain('1400-2000个中文字符');
    expect(prompt).toContain('家长怎么检查');
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

    expect(prompt).toContain('## 一、知识点在当前学期的位置与掌握标准');
    expect(prompt).toContain('## 二、未掌握时家长能看到的具体现象');
    expect(prompt).toContain('## 六、7天行动清单');
    expect(prompt).toContain('## 八、洋葱学园承接建议');
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
