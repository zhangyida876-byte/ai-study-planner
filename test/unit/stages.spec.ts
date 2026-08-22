import { STAGE_CONFIGS, stagePath } from '../../client/src/config/stages';

describe('stage feature navigation', () => {
  it.each(['elementary', 'middle', 'high'] as const)(
    'restores knowledge lookup for the %s stage',
    (stage) => {
      const knowledge = STAGE_CONFIGS[stage].features.find((feature) => feature.slug === 'knowledge');

      expect(knowledge?.label).toBe('知识点查询');
      expect(stagePath(stage, 'knowledge')).toBe(`/${stage}/knowledge`);
    },
  );
});
