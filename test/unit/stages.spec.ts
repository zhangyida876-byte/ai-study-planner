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

      expect(knowledge?.label).toBe('专业学情查询');
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
        'phone',
        'wechat',
        'knowledge',
        'history',
        'materials',
        'scripts',
      ]);
      expect(features.find((feature) => feature.slug === 'phone')?.label)
        .toBe('电话学情话术系统');
      expect(features.find((feature) => feature.slug === 'wechat')?.label)
        .toBe('微信学情跟进看板');
      expect(features.find((feature) => feature.slug === 'diagnosis')?.sidebarVisible)
        .toBe(false);
      expect(features.find((feature) => feature.slug === 'future')?.sidebarVisible)
        .toBe(false);
      expect(stagePath(stage, 'future')).toBe(`/${stage}/future`);
      expect(stagePath(stage, 'scripts')).toBe(`/${stage}/scripts`);
    },
  );
});
