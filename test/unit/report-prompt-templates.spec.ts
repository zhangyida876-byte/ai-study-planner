import {
  buildOnionProductPathRules,
  buildProfessionalReportFramework,
} from '../../client/src/config/report-prompt-templates';

describe('report prompt templates', () => {
  it.each(['diagnosis', 'plan', 'knowledge'] as const)(
    'builds the required six-section %s report',
    (type) => {
      const prompt = buildProfessionalReportFramework(type);

      expect(prompt).toContain('## 一、孩子当前学习水平判断');
      expect(prompt).toContain('## 二、升学定位与目标差距');
      expect(prompt).toContain('## 三、问题定位');
      expect(prompt).toContain('## 四、未来影响与紧迫性');
      expect(prompt).toContain('## 五、洋葱学园学习路径建议');
      expect(prompt).toContain('## 六、给家长的沟通话术');
      expect(prompt).toContain('基础薄弱（<60%）');
      expect(prompt).toContain('数字证据闸门');
      expect(prompt).toContain('禁止输出任何精确数字或区间');
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
