import {
  parseReportSections,
  resolveReportSectionLayout,
} from '../../client/src/pages/Diagnosis/diagnosis-report-layout';

describe('diagnosis report view layout', () => {
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
      isLegacy: false,
    });
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
      isLegacy: true,
    });
  });
});
