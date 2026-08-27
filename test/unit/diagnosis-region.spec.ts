import {
  buildDiagnosisRegionSnapshot,
  isDiagnosisRegionSnapshotCompatible,
} from '../../client/src/utils/diagnosis-region';

describe('diagnosis region snapshot', () => {
  it('prefers the structured region selected for the current generation', () => {
    expect(buildDiagnosisRegionSnapshot(
      '山西省 长沙市',
      { province: '湖南省', city: '长沙市', county: '岳麓区' },
      { province: '湖南省', city: '长沙市' },
    )).toBe('湖南省 长沙市 岳麓区');
  });

  it('rejects a cached report whose province does not match the profile', () => {
    expect(isDiagnosisRegionSnapshotCompatible(
      '山西省 长沙市',
      { province: '湖南省', city: '长沙市' },
    )).toBe(false);
  });
});
