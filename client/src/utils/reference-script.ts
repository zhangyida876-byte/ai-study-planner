export function pickFirstSentence(text: string): string {
  if (!text.trim()) return '';
  const cleaned = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/[#>*_\-\[\]\(\)]/g, ' ')
    .replace(/\d+\.\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const pieces = cleaned
    .replace(/\s+/g, ' ')
    .split(/[。！？!?；;]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 6);
  return pieces[0] || '';
}

export function buildReferenceScript(lines: string[], maxLength = 300): string {
  const merged = lines
    .filter(Boolean)
    .join('。')
    .replace(/。{2,}/g, '。')
    .replace(/\s+/g, ' ')
    .replace(/^[，。\s]+|[，。\s]+$/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/[#*]/g, '')
    .replace(/内部话术重点[:：]?/g, '先按一个原则')
    .replace(/这次诊断最重要结论是[:：]?/g, '我先说最关键一点：')
    .replace(/最关键一句是[:：]?/g, '先说一句最实在的：')
    .trim();
  if (!merged) return '';
  const normalized = merged.endsWith('。') ? merged : `${merged}。`;
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 3))}...`;
}
