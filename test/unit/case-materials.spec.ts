import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface CaseMaterialFixture {
  id: string;
  images: string[];
  stage: string;
  title: string;
}

describe('case material snapshot', () => {
  const path = resolve(process.cwd(), 'client/src/data/case-materials.json');
  const materials: CaseMaterialFixture[] = JSON.parse(readFileSync(path, 'utf8'));

  it('contains the complete Feishu Base snapshot with migrated images', () => {
    expect(materials).toHaveLength(327);
    expect(materials.every((material) => material.id && material.title)).toBe(true);
    expect(materials.every((material) => material.images.length > 0)).toBe(true);
    expect(materials.flatMap((material) => material.images)).toHaveLength(466);
  });

  it('contains material for every supported education stage', () => {
    const stages = new Set(materials.map((material) => material.stage));

    expect(stages).toEqual(new Set(['小学', '初中', '高中', '通用']));
  });

  it('uses only Miaoda application storage URLs', () => {
    expect(materials.flatMap((material) => material.images).every((url) => (
      url.startsWith('/spark/app/app_4ke0jqzqjy118/runtime/api/v1/storage/object/')
    ))).toBe(true);
  });
});
