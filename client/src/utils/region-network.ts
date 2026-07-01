import { pinyin } from 'pinyin-pro';

const ROOT_ADCODE = '100000';
const STORAGE_PREFIX = 'region-network-cache-v1:';
const STORAGE_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export interface RegionOption {
  name: string;
  adcode: string;
  level: string;
  aliases: string[];
  pinyinFull: string;
  pinyinInitials: string;
  cityProxyChildren?: RegionOption[];
}

interface CachedPayload {
  timestamp: number;
  items: RegionOption[];
}

const memoryCache = new Map<string, RegionOption[]>();

function normalizeRegionText(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/(壮族|回族|维吾尔|蒙古族|朝鲜族|土家族|苗族|彝族|满族|藏族|哈萨克族)/g, '')
    .replace(/(特别行政区|自治区|自治州|自治县|地区|盟|新区|林区|县级市|省|市|区|县|旗)$/g, '');
}

function buildAliases(name: string): string[] {
  const aliases = new Set<string>([name, normalizeRegionText(name)]);
  if (name.endsWith('市')) aliases.add(name.slice(0, -1));
  if (name.endsWith('区')) aliases.add(name.slice(0, -1));
  if (name.endsWith('县')) aliases.add(name.slice(0, -1));
  if (name.endsWith('旗')) aliases.add(name.slice(0, -1));
  if (name.includes('乌兰浩特')) aliases.add('乌市');
  return Array.from(aliases).filter(Boolean);
}

function buildPinyin(name: string): { full: string; initials: string } {
  const words = pinyin(name, { toneType: 'none', type: 'array' }) as string[];
  const full = words.join('');
  const initials = words.map((word) => word[0] || '').join('');
  return { full, initials };
}

function parseRegionItems(raw: any[]): RegionOption[] {
  return raw
    .map((item) => item?.properties)
    .filter(Boolean)
    .map((props) => {
      const name = String(props.name || '');
      const adcode = String(props.adcode || '');
      const level = String(props.level || '');
      const aliases = buildAliases(name);
      const py = buildPinyin(name);
      return {
        name,
        adcode,
        level,
        aliases,
        pinyinFull: py.full,
        pinyinInitials: py.initials,
      } satisfies RegionOption;
    })
    .filter((item) => item.name && item.adcode)
    .sort((a, b) => a.adcode.localeCompare(b.adcode, 'zh-Hans-CN'));
}

function readStorage(key: string): RegionOption[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPayload;
    if (!parsed?.timestamp || !Array.isArray(parsed.items)) return null;
    if (Date.now() - parsed.timestamp > STORAGE_TTL_MS) return null;
    return parsed.items;
  } catch {
    return null;
  }
}

function writeStorage(key: string, items: RegionOption[]): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: CachedPayload = { timestamp: Date.now(), items };
    window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(payload));
  } catch {
    // ignore storage failures
  }
}

async function fetchRegionChildren(adcode: string): Promise<RegionOption[]> {
  if (memoryCache.has(adcode)) return memoryCache.get(adcode)!;
  const fromStorage = readStorage(adcode);
  if (fromStorage) {
    memoryCache.set(adcode, fromStorage);
    return fromStorage;
  }
  const url = `https://geo.datav.aliyun.com/areas_v3/bound/${adcode}_full.json`;
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`区域数据获取失败: ${response.status}`);
  }
  const payload = (await response.json()) as { features?: any[] };
  const items = parseRegionItems(payload.features || []);
  memoryCache.set(adcode, items);
  writeStorage(adcode, items);
  return items;
}

export async function loadProvinces(): Promise<RegionOption[]> {
  return fetchRegionChildren(ROOT_ADCODE);
}

export async function loadCities(province: RegionOption): Promise<RegionOption[]> {
  const children = await fetchRegionChildren(province.adcode);
  const onlyDistrict = children.length > 0 && children.every((item) => item.level === 'district');
  if (!onlyDistrict) return children;
  return [
    {
      ...province,
      level: 'city',
      cityProxyChildren: children,
    },
  ];
}

export async function loadCounties(city: RegionOption): Promise<RegionOption[]> {
  if (city.cityProxyChildren) return city.cityProxyChildren;
  return fetchRegionChildren(city.adcode);
}

export function filterRegionOptions(options: RegionOption[], query: string): RegionOption[] {
  const q = query.trim().toLowerCase().replace(/\s+/g, '');
  if (!q) return options;
  const normalized = normalizeRegionText(q);
  return options.filter((item) => {
    const aliasMatched = item.aliases.some((alias) => alias.toLowerCase().includes(normalized));
    if (aliasMatched) return true;
    if (/^[a-z]+$/.test(q)) {
      return item.pinyinFull.includes(q) || item.pinyinInitials.includes(q);
    }
    const itemName = normalizeRegionText(item.name);
    return itemName.includes(normalized);
  });
}

export function findOptionByName(options: RegionOption[], name: string): RegionOption | undefined {
  if (!name) return undefined;
  const normalized = normalizeRegionText(name);
  return options.find((item) => {
    if (item.name === name) return true;
    return item.aliases.some((alias) => normalizeRegionText(alias) === normalized);
  });
}
