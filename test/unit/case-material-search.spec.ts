import {
  matchesCaseMaterialTags,
  scoreCaseMaterial,
  violatesCaseMaterialProtectedTerm,
  type SearchableCaseMaterial,
} from '../../client/src/utils/case-material-search';

function material(overrides: Partial<SearchableCaseMaterial>): SearchableCaseMaterial {
  return {
    manualTag: '',
    title: '',
    pitch: '',
    scenario: '',
    evidence: '',
    aiTags: [],
    keywords: [],
    summary: '',
    imageType: '其他',
    ...overrides,
  };
}

describe('case material search', () => {
  it('expands a time objection into relevant learning evidence', () => {
    const timeCase = material({
      manualTag: '每天利用碎片时间坚持学习',
      imageType: '好评',
      summary: '孩子用较短学习时长完成查漏补缺',
    });
    const priceCase = material({
      manualTag: '课程价格认可',
      imageType: '异议',
    });

    expect(scoreCaseMaterial(timeCase, '孩子作业多没时间学'))
      .toBeGreaterThan(scoreCaseMaterial(priceCase, '孩子作业多没时间学'));
  });

  it('keeps middle exam queries separate from midterm exam materials', () => {
    const midtermCase = material({ title: '期中考试进步', summary: '期中考试成绩提升' });
    const middleExamCase = material({ title: '中考录取', summary: '中考成绩达到重点高中录取线' });

    expect(violatesCaseMaterialProtectedTerm(midtermCase, '中考提分')).toBe(true);
    expect(violatesCaseMaterialProtectedTerm(middleExamCase, '中考提分')).toBe(false);
  });

  it('requires every selected tag to match the same material', () => {
    const caseItem = material({
      aiTags: ['主动学习', '成绩提升'],
      keywords: ['初中'],
    });

    expect(matchesCaseMaterialTags(caseItem, ['主动学习', '成绩提升'])).toBe(true);
    expect(matchesCaseMaterialTags(caseItem, ['主动学习', '竞品对比'])).toBe(false);
  });
});
