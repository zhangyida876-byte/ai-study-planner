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
    expect(prompt).toContain('## 7. 当前节点未来7天行动清单');
    expect(prompt).toContain('## 8. 从现在到下一次关键考试');
    expect(prompt).toContain('临近开学时聚焦开学摸底和第一次月考');
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
