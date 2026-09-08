import {
  buildDiagnosisSubjectCoverageRules,
  buildOnionProductPathRules,
  buildProfessionalReportFramework,
} from '../../client/src/config/report-prompt-templates';

describe('report prompt templates', () => {
  it('builds the seven-section business diagnosis with supplemental analysis', () => {
    const prompt = buildProfessionalReportFramework('diagnosis');

    expect(prompt).toContain('## 1. 顾问先讲：诊断总结');
    expect(prompt).toContain('### 1.1 家长补充信息切入分析');
    expect(prompt).toContain('## 2. 家长能看到的现象');
    expect(prompt).toContain('## 3. 背后根因');
    expect(prompt).toContain('**核心问题：**');
    expect(prompt).toContain('**背后根因：**');
    expect(prompt).toContain('**家长怎么验证：**');
    expect(prompt).toContain('## 4. 下一个关键节点预警');
    expect(prompt).toContain('## 5. 量化危机链条');
    expect(prompt).toContain('## 6. 洋葱执行计划');
    expect(prompt).toContain('### 6.1 未来7天');
    expect(prompt).toContain('### 6.2 未来1个月');
    expect(prompt).toContain('### 6.3 当前学期');
    expect(prompt).toContain('### 6.4 专属学习规划与协同跟进');
    expect(prompt).toContain('## 7. 洋葱学园承接方案 + 可复制话术');
    expect(prompt).toContain('7个章节必须全部输出');
    expect(prompt).toContain('### 7.2 开场共鸣话术');
    expect(prompt).toContain('### 7.6 促进行动话术');
    expect(prompt).toContain('### 7.7 可搭配素材');
    expect(prompt).toContain('单科1400-2200个中文字符');
    expect(prompt).toContain('把家长检查方法写进验收标准');
    expect(prompt).toContain('洋葱怎么介入');
    expect(prompt).toContain('作用机制');
    expect(prompt).toContain('同步打底');
    expect(prompt).toContain('分层培优');
    expect(prompt).toContain('每科1行但两个路径都必须完整');
    expect(prompt).toContain('作用机制');
    expect(prompt).toContain('选择与顺序');
    expect(prompt).toContain('教学进度校验（最高优先级）');
    expect(prompt).toContain('按常规校历推测，需用学校课表/教材目录/最近作业核实');
    expect(prompt).toContain('为什么现在做');
    expect(prompt).toContain('当前不适合提前做什么');
    expect(prompt).toContain('用户补充信息使用规则（业务最高优先级）');
    expect(prompt).toContain('5-8分钟动画短课');
    expect(prompt).toContain('结构化问题、场景与产品路由');
    expect(prompt).toContain('价格、优惠、名额、套餐、退款、分期');
    expect(prompt).toContain('CAP、PRB、SCN、OBJ等编号仅用于系统内部关联');
    expect(prompt).toContain('顾问老师负责');
    expect(prompt).toContain('助教只在实际服务范围内');
    expect(prompt).toContain('诊断 → 规划 → 学习 → 练习 → 反馈 → 调整');
    expect(prompt).toContain('不直接代做或只报答案');
    expect(prompt).toContain('助教规划截图');
    expect(prompt).toContain('生成优先级为“第1节诊断话术 > 第7节洋葱承接和可复制话术 > 第6节执行与助教跟进');
    expect(prompt).toContain('不得截掉6.4、7.1或7.2-7.7');
    expect(prompt).toContain('同步约40%、培优约60%');
    expect(prompt).toContain('题型/试卷验证');
  });

  it('keeps three observations and problems for one subject', () => {
    const prompt = buildDiagnosisSubjectCoverageRules(['数学']);

    expect(prompt).toContain('单科诊断');
    expect(prompt).toContain('数学');
    expect(prompt).toContain('3个家长可观察现象');
    expect(prompt).toContain('3个核心问题');
    expect(prompt).toContain('按三个周期输出该科洋葱执行方案');
    expect(prompt).toContain('同步打底');
    expect(prompt).toContain('分层培优');
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
    expect(prompt).toContain('每个科目至少2行产品承接');
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
    expect(prompt).toContain('只解释“年级 + 学期 + 学科 + 知识点”的共性学习规律');
    expect(prompt).toContain('没有可靠关联就省略');
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
    expect(rules).toContain('禁止只抛出');
    expect(rules).toContain('所有分数段、所有已填科目');
    expect(rules).toContain('基础题型、常考点和得分步骤');
    expect(rules).toContain('小学培优');
    expect(rules).toContain('初中侧重');
    expect(rules).toContain('高中侧重');
    expect(rules).toContain('助教只在实际服务范围内协助制定周计划');
    expect(rules).toContain('同步约40%、培优约60%');
    expect(rules).toContain('试卷库');
    expect(rules).toContain('解决一类题');
    expect(rules).toContain('诊断 → 规划 → 学习 → 练习 → 反馈 → 调整');
  });
});
