import { pinyin } from 'pinyin-pro';

const ROOT_ADCODE = '100000';
const STORAGE_PREFIX = 'region-network-cache-v1:';
const STORAGE_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const MAINLAND_PROVINCES: Array<{ name: string; adcode: string }> = [
  { name: '北京市', adcode: '110000' },
  { name: '天津市', adcode: '120000' },
  { name: '河北省', adcode: '130000' },
  { name: '山西省', adcode: '140000' },
  { name: '内蒙古自治区', adcode: '150000' },
  { name: '辽宁省', adcode: '210000' },
  { name: '吉林省', adcode: '220000' },
  { name: '黑龙江省', adcode: '230000' },
  { name: '上海市', adcode: '310000' },
  { name: '江苏省', adcode: '320000' },
  { name: '浙江省', adcode: '330000' },
  { name: '安徽省', adcode: '340000' },
  { name: '福建省', adcode: '350000' },
  { name: '江西省', adcode: '360000' },
  { name: '山东省', adcode: '370000' },
  { name: '河南省', adcode: '410000' },
  { name: '湖北省', adcode: '420000' },
  { name: '湖南省', adcode: '430000' },
  { name: '广东省', adcode: '440000' },
  { name: '广西壮族自治区', adcode: '450000' },
  { name: '海南省', adcode: '460000' },
  { name: '重庆市', adcode: '500000' },
  { name: '四川省', adcode: '510000' },
  { name: '贵州省', adcode: '520000' },
  { name: '云南省', adcode: '530000' },
  { name: '西藏自治区', adcode: '540000' },
  { name: '陕西省', adcode: '610000' },
  { name: '甘肃省', adcode: '620000' },
  { name: '青海省', adcode: '630000' },
  { name: '宁夏回族自治区', adcode: '640000' },
  { name: '新疆维吾尔自治区', adcode: '650000' },
];

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

function buildRegionOption(name: string, adcode: string, level: string): RegionOption {
  const aliases = buildAliases(name);
  const py = buildPinyin(name);
  return {
    name,
    adcode,
    level,
    aliases,
    pinyinFull: py.full,
    pinyinInitials: py.initials,
  };
}

export function createCustomRegionOption(name: string, level = 'custom'): RegionOption {
  return buildRegionOption(name, `custom-${level}-${name}`, level);
}

export const STATIC_PROVINCES: RegionOption[] = MAINLAND_PROVINCES.map((item) =>
  buildRegionOption(item.name, item.adcode, 'province'),
);

function parseRegionItems(raw: any[]): RegionOption[] {
  return raw
    .map((item) => item?.properties)
    .filter(Boolean)
    .map((props) => {
      const name = String(props.name || '');
      const adcode = String(props.adcode || '');
      const level = String(props.level || '');
      return buildRegionOption(name, adcode, level);
    })
    .filter((item) => item.name && item.adcode)
    .sort((a, b) => a.adcode.localeCompare(b.adcode, 'zh-Hans-CN'));
}

function readStorage(key: string, allowExpired = false): RegionOption[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPayload;
    if (!parsed?.timestamp || !Array.isArray(parsed.items)) return null;
    if (!allowExpired && Date.now() - parsed.timestamp > STORAGE_TTL_MS) return null;
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
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`区域数据获取失败: ${response.status}`);
    }
    const payload = (await response.json()) as { features?: any[] };
    const items = parseRegionItems(payload.features || []);
    memoryCache.set(adcode, items);
    writeStorage(adcode, items);
    return items;
  } catch (error) {
    const staleStorage = readStorage(adcode, true);
    if (staleStorage) {
      memoryCache.set(adcode, staleStorage);
      return staleStorage;
    }
    throw error;
  }
}

export async function loadProvinces(): Promise<RegionOption[]> {
  try {
    const items = await fetchRegionChildren(ROOT_ADCODE);
    return items.length > 0 ? items : STATIC_PROVINCES;
  } catch {
    return STATIC_PROVINCES;
  }
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
