import { buildMiddleSchoolBenchmarkContext } from '../../client/src/utils/school-benchmarks';

describe('school benchmark selection', () => {
  it('selects one key and one ordinary high-school reference', () => {
    const result = buildMiddleSchoolBenchmarkContext(
      [
        { name: '市第一中学', score: 650, batch: '示范高中统招' },
        { name: '市第二中学', score: 610, batch: '统招' },
        { name: '市普通高中', score: 560, batch: '普通高中统招' },
      ],
      2026,
    );

    expect(result.complete).toBe(true);
    expect(result.text).toContain('重点高中参考：市第一中学，650分');
    expect(result.text).toContain('普通高中参考：市普通高中，560分');
    expect(result.text).toContain('2026年');
    expect(result.text).toContain('不代表教育部门官方学校等级认定');
  });

  it('reports incomplete data when only one school line exists', () => {
    const result = buildMiddleSchoolBenchmarkContext(
      [{ name: '市第一中学', score: 650, batch: '统招' }],
      2026,
    );

    expect(result.complete).toBe(false);
    expect(result.text).toContain('本地数据不足');
  });
});
