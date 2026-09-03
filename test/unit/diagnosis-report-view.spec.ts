import {
  parseLabeledFields,
  parseReportSections,
  resolveReportSectionLayout,
} from '../../client/src/pages/Diagnosis/diagnosis-report-layout';

describe('diagnosis report view layout', () => {
  it('splits problem dimensions into independent display rows', () => {
    expect(parseLabeledFields([
      '**问题：** 一元一次方程移项',
      '**家长看到：** 原题会做，换个问法就卡',
      '**背后根因：** 等式性质没有形成',
      '**后续影响：** 不等式与函数建模',
      '**怎么验证：** 做两道变式题并口述依据',
    ].join('\n'))).toEqual([
      { label: '问题', value: '一元一次方程移项' },
      { label: '家长看到', value: '原题会做，换个问法就卡' },
      { label: '背后根因', value: '等式性质没有形成' },
      { label: '后续影响', value: '不等式与函数建模' },
      { label: '怎么验证', value: '做两道变式题并口述依据' },
    ]);
  });

  it('keeps the six-section report focused on conclusion, evidence, causes and seven-day actions', () => {
    const sections = parseReportSections([
      '## 1. 一句话结论',
      '结论',
      '## 2. 家长最有感的现象',
      '现象',
      '## 3. 各科核心问题与根因',
      '根因',
      '## 4. 年级学期特点与目标影响',
      '背景',
      '## 5. 未来7天家长可执行动作',
      '行动',
      '## 6. 洋葱承接方案 + 顾问话术',
      '承接',
    ].join('\n'));

    expect(resolveReportSectionLayout(sections)).toEqual({
      primaryIndexes: [1, 2, 3, 5],
      detailIndexes: [4, 6],
      version: 'compact-six',
    });
  });

  it('recognizes the current eight-section diagnosis report', () => {
    const sections = parseReportSections([
      '## 1. 当前节点与一句话结论',
      '结论',
      '## 2. 家长最有感的现象',
      '现象',
      '## 3. 各科核心问题与根因',
      '根因',
      '## 4. 各科本学期学情解读',
      '共性背景',
      '## 5. 跨学科影响',
      '真实关联',
      '## 6. 行动方案',
      '三个周期',
      '## 7. 洋葱学园承接方案',
      '承接',
      '## 8. 课程顾问转述话术',
      '话术',
    ].join('\n'));

    expect(resolveReportSectionLayout(sections)).toEqual({
      primaryIndexes: [1, 2, 3, 4, 5, 6],
      detailIndexes: [7, 8],
      version: 'current-eight',
    });
  });

  it('recognizes unnumbered product and advisor-script title variants', () => {
    const sections = parseReportSections([
      '## 当前节点与一句话结论',
      '结论',
      '## 行动方案',
      '行动',
      '## 产品承接方案',
      '承接内容',
      '## 30秒话术',
      '短版内容',
      '## 2分钟话术',
      '完整版内容',
    ].join('\n'));

    expect(sections.find((section) => section.index === 7)).toEqual({
      index: 7,
      title: '洋葱学园承接方案',
      content: '承接内容',
    });
    expect(sections.find((section) => section.index === 8)?.content).toContain('### 8.1 30秒短版');
    expect(sections.find((section) => section.index === 8)?.content).toContain('### 8.2 2分钟完整版');
  });

  it('keeps the page in current layout when optional report sections are missing', () => {
    const sections = parseReportSections([
      '## 1. 当前节点与一句话结论',
      '结论',
      '## 6. 行动方案',
      '行动',
    ].join('\n'));

    expect(resolveReportSectionLayout(sections).version).toBe('current-eight');
  });

  it('keeps archived eight-section reports readable', () => {
    const sections = Array.from({ length: 8 }, (_, index) => ({
      index: index + 1,
      title: `旧章节${index + 1}`,
      content: '旧报告内容',
    }));

    expect(resolveReportSectionLayout(sections)).toEqual({
      primaryIndexes: [1, 2, 3, 6],
      detailIndexes: [4, 5, 7, 8],
      version: 'legacy-eight',
    });
  });
});
