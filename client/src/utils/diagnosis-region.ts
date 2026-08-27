export interface DiagnosisRegionParts {
  province?: string;
  city?: string;
  county?: string;
}

function joinRegion(parts: DiagnosisRegionParts): string {
  return [parts.province, parts.city, parts.county]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
}

export function buildDiagnosisRegionSnapshot(
  formRegion: string,
  selectedParts: DiagnosisRegionParts,
  profileParts: DiagnosisRegionParts,
): string {
  return joinRegion(selectedParts) || joinRegion(profileParts) || formRegion.trim();
}

export function isDiagnosisRegionSnapshotCompatible(
  snapshotRegion: string,
  profileParts: DiagnosisRegionParts,
): boolean {
  const expected = [profileParts.province, profileParts.city]
    .map((part) => part?.trim())
    .filter(Boolean) as string[];

  if (expected.length === 0 || !snapshotRegion.trim()) return true;
  return expected.every((part) => snapshotRegion.includes(part));
}
