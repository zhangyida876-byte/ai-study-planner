import { STAGE_CONFIGS, stagePath } from '../../client/src/config/stages';

describe('stage feature navigation', () => {
  it.each(['elementary', 'middle', 'high'] as const)(
    'restores knowledge lookup for the %s stage',
    (stage) => {
      const knowledge = STAGE_CONFIGS[stage].features.find((feature) => feature.slug === 'knowledge');

      expect(knowledge?.label).toBe('版本及知识点查询');
      expect(stagePath(stage, 'knowledge')).toBe(`/${stage}/knowledge`);
    },
  );

  it.each(['elementary', 'middle', 'high'] as const)(
    'includes the case material library for the %s stage',
    (stage) => {
      const materials = STAGE_CONFIGS[stage].features.find(
        (feature) => feature.slug === 'materials',
      );

      expect(materials?.label).toBe('案例素材库');
      expect(stagePath(stage, 'materials')).toBe(`/${stage}/materials`);
    },
  );
});
