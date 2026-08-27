import type { StageSlug } from '../config/stages';
import {
  getInternalResourceCatalog,
  getObjectionScriptCatalog,
} from '../config/internal-resource-library';
import * as caseMaterialsModule from './case-materials.json';

export type DailyScriptCategory = 'objection' | 'case' | 'product';

export interface DailyScriptItem {
  id: string;
  category: DailyScriptCategory;
  title: string;
  content: string;
  source: string;
}

interface CaseMaterialSource {
  id: string;
  stage: string;
  title: string;
  manualTag: string;
  pitch: string;
  summary: string;
}

interface CaseMaterialJsonModule {
  default: CaseMaterialSource[];
}

const STAGE_LABELS: Record<StageSlug, string> = {
  elementary: '小学',
  middle: '初中',
  high: '高中',
};

const CASE_MATERIALS_VALUE = caseMaterialsModule as unknown as
  | CaseMaterialSource[]
  | CaseMaterialJsonModule;
const CASE_MATERIALS: CaseMaterialSource[] = Array.isArray(CASE_MATERIALS_VALUE)
  ? CASE_MATERIALS_VALUE
  : CASE_MATERIALS_VALUE.default;

function hashText(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function stableShuffle<T>(items: T[], seed: number): T[] {
  const output = [...items];
  const random = seededRandom(seed);
  for (let index = output.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [output[index], output[target]] = [output[target], output[index]];
  }
  return output;
}

function compactScript(value: string, maxLength = 420): string {
  const marker = '具体话术：';
  const markerIndex = value.indexOf(marker);
  const selected = markerIndex >= 0 ? value.slice(markerIndex + marker.length) : value;
  const compact = selected.replace(/\s+/gu, ' ').trim();
  if (compact.length <= maxLength) return compact;
  const shortened = compact.slice(0, maxLength);
  const boundary = Math.max(
    shortened.lastIndexOf('。'),
    shortened.lastIndexOf('！'),
    shortened.lastIndexOf('？'),
  );
  return `${shortened.slice(0, boundary > maxLength * 0.6 ? boundary + 1 : maxLength)}...`;
}

export function formatDailyScriptDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildDailyScripts(input: {
  stageSlug: StageSlug;
  dateKey: string;
  batch: number;
}): DailyScriptItem[] {
  const stageLabel = STAGE_LABELS[input.stageSlug];
  const seedBase = hashText(`${input.dateKey}:${input.stageSlug}:${input.batch}`);
  const objectionPool = getObjectionScriptCatalog().filter(
    (item) => item.stageLabel === '通用' || item.stageLabel.includes(stageLabel),
  );
  const objectionItems = stableShuffle(objectionPool, seedBase).slice(0, 3).map((item) => ({
    id: `objection:${item.id}`,
    category: 'objection' as const,
    title: item.title,
    content: compactScript(item.content),
    source: item.source,
  }));

  const casePool = CASE_MATERIALS.filter(
    (item) => item.stage === stageLabel || item.stage === '通用',
  ).filter((item) => Boolean(item.pitch || item.manualTag || item.summary));
  const caseItems = stableShuffle(casePool, seedBase ^ 0x9e3779b9).slice(0, 2).map((item) => ({
    id: `case:${item.id}`,
    category: 'case' as const,
    title: item.title || item.manualTag || '案例素材',
    content: compactScript(item.pitch || item.manualTag || item.summary, 300),
    source: '案例素材库',
  }));

  const productPool = getInternalResourceCatalog(input.stageSlug);
  const product = stableShuffle(productPool, seedBase ^ 0x85ebca6b)[0];
  const productItem: DailyScriptItem = {
    id: `product:${hashText(product || stageLabel)}`,
    category: 'product',
    title: `${stageLabel}产品沟通口径`,
    content: product || '以公司当期课程与活动口径为准。',
    source: '内部资源库',
  };

  return [...objectionItems, ...caseItems, productItem];
}
