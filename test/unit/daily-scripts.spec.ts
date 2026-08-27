import { buildDailyScripts } from '../../client/src/data/daily-scripts';

describe('daily golden scripts', () => {
  it('keeps the same recommendations stable for one date and stage', () => {
    const input = { stageSlug: 'middle' as const, dateKey: '2026-08-27', batch: 0 };

    expect(buildDailyScripts(input)).toEqual(buildDailyScripts(input));
  });

  it('returns the expected local recommendation mix', () => {
    const items = buildDailyScripts({
      stageSlug: 'middle',
      dateKey: '2026-08-27',
      batch: 0,
    });

    expect(items).toHaveLength(6);
    expect(items.filter((item) => item.category === 'objection')).toHaveLength(3);
    expect(items.filter((item) => item.category === 'case')).toHaveLength(2);
    expect(items.filter((item) => item.category === 'product')).toHaveLength(1);
  });

  it('changes the recommendation batch without using AI', () => {
    const first = buildDailyScripts({
      stageSlug: 'high',
      dateKey: '2026-08-27',
      batch: 0,
    });
    const second = buildDailyScripts({
      stageSlug: 'high',
      dateKey: '2026-08-27',
      batch: 1,
    });

    expect(second.map((item) => item.id)).not.toEqual(first.map((item) => item.id));
  });
});
