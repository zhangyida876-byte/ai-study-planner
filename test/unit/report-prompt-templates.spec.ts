import {
  buildOnionProductPathRules,
  buildProfessionalReportFramework,
} from '../../client/src/config/report-prompt-templates';

describe('report prompt templates', () => {
  it('keeps diagnosis focused on current level, target gap and urgency', () => {
    const prompt = buildProfessionalReportFramework('diagnosis');

    expect(prompt).toContain('## 一、单科学情诊断');
    expect(prompt).toContain('## 二、多科综合判断');
    expect(prompt).toContain('## 三、目标学校与差距');
    expect(prompt).toContain('## 四、核心危机链');
    expect(prompt).toContain('## 五、备考时间图');
    expect(prompt).toContain('## 六、给家长的危机沟通话术');
    expect(prompt).toContain('这里不输出每日课表');
    expect(prompt).toContain('未填写时不得停止生成');
    expect(prompt).toContain('普通高中、重点高中各1所');
    expect(prompt).toContain('当前教学阶段和教材版本依据');
    expect(prompt).toContain('重难点与常见错法');
    expect(prompt).toContain('页面会根据当前年级和日期显示可视化时间轴');
    expect(prompt).toContain('每段最多2句话');
  });

  it('extends planning through subject selection, majors and employment', () => {
    const prompt = buildProfessionalReportFramework('plan');

    expect(prompt).toContain('## 二、可选升学路径对比');
    expect(prompt).toContain('重点高中、普通高中、中职/职教高考');
    expect(prompt).toContain('“5:5分流”不得当作全国统一比例');
    expect(prompt).toContain('## 三、高中选科预测');
    expect(prompt).toContain('## 四、大学专业与就业方向影响');
    expect(prompt).toContain('禁止用“物理差/历史差”直接推导');
    expect(prompt).toContain('禁止输出逐月日程');
    expect(prompt).toContain('独立的备考路线图');
  });

  it('keeps knowledge analysis within the requested knowledge point', () => {
    const prompt = buildProfessionalReportFramework('knowledge');

    expect(prompt).toContain('## 一、知识点位置与掌握标准');
    expect(prompt).toContain('## 五、诊断验证方案');
    expect(prompt).toContain('不展开学校梯度、志愿、选科或就业规划');
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
