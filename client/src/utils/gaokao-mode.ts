const GAOKAO_3_PLUS_3_PROVINCES = ['北京市', '天津市', '上海市', '浙江省', '山东省', '海南省'];

export type GaokaoModeMatch = {
  mode: '3+3' | '3+1+2' | '';
  label: string;
  confidence: 'matched' | 'unknown';
};

function normalizeProvinceName(input: string): string {
  return input.trim().replace(/\s+/g, '');
}

export function resolveGaokaoModeByProvince(province: string): GaokaoModeMatch {
  const normalized = normalizeProvinceName(province);
  if (!normalized) {
    return {
      mode: '',
      label: '请先选择省份，系统会自动判断当地高考选科模式。',
      confidence: 'unknown',
    };
  }

  const matched3Plus3 = GAOKAO_3_PLUS_3_PROVINCES.some(
    (item) => item === normalized || item.replace(/[省市]$/, '') === normalized.replace(/[省市]$/, ''),
  );

  if (matched3Plus3) {
    return {
      mode: '3+3',
      label: `${province}当前按 3+3 新高考选科模式判断（六选三）。`,
      confidence: 'matched',
    };
  }

  if (/(省|市|自治区)$/.test(normalized)) {
    return {
      mode: '3+1+2',
      label: `${province}当前按 3+1+2 新高考选科模式判断（物理/历史二选一，再选两科）。`,
      confidence: 'matched',
    };
  }

  return {
    mode: '',
    label: `${province}未识别为标准省级行政区，高考选科模式需人工核验。`,
    confidence: 'unknown',
  };
}
