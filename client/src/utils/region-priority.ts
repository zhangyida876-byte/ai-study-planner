import { PROVINCE_CITIES } from '@client/src/pages/Plan/regionData';

function normalizeRegionName(value: string): string {
  return value.trim().replace(/省$|市$|区$|县$/, '');
}

export function resolveProvinceByCity(city: string): string {
  const normalizedCity = normalizeRegionName(city);
  if (!normalizedCity) return '';

  const municipality = ['北京市', '天津市', '上海市', '重庆市'].find(
    (item) => normalizeRegionName(item) === normalizedCity,
  );
  if (municipality) return municipality;

  for (const [province, cities] of Object.entries(PROVINCE_CITIES)) {
    if (cities.some((item) => normalizeRegionName(item) === normalizedCity)) {
      return province;
    }
  }
  return '';
}

export function resolvePolicyProvince(province: string, city: string): string {
  return resolveProvinceByCity(city) || province;
}
