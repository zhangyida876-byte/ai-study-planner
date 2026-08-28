import {
  FEATURE_GROUPS,
  STAGE_CONFIGS,
  stagePath,
} from '../../client/src/config/stages';

describe('stage feature navigation', () => {
  it.each(['elementary', 'middle', 'high'] as const)(
    'restores knowledge lookup for the %s stage',
    (stage) => {
      const knowledge = STAGE_CONFIGS[stage].features.find((feature) => feature.slug === 'knowledge');

      expect(knowledge?.label).toBe('学情及知识点查询');
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

  it.each(['elementary', 'middle', 'high'] as const)(
    'uses the focused navigation architecture for the %s stage',
    (stage) => {
      const features = STAGE_CONFIGS[stage].features;

      expect(FEATURE_GROUPS.map((group) => group.label)).toEqual([
        '学情类',
        '案例类',
        '话术类',
      ]);
      expect(features.filter((feature) => feature.sidebarVisible !== false).map((feature) => feature.slug)).toEqual([
        'diagnosis',
        'knowledge',
        'history',
        'materials',
        'scripts',
      ]);
      expect(features.find((feature) => feature.slug === 'diagnosis')?.label)
        .toBe('学情诊断与规划');
      expect(features.find((feature) => feature.slug === 'future')?.sidebarVisible)
        .toBe(false);
      expect(stagePath(stage, 'future')).toBe(`/${stage}/future`);
      expect(stagePath(stage, 'scripts')).toBe(`/${stage}/scripts`);
    },
  );
});
