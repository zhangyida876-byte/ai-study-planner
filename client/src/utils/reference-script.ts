export function pickFirstSentence(text: string): string {
  if (!text.trim()) return '';
  const pieces = text
    .replace(/\s+/g, ' ')
    .split(/[。！？!?；;]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 8);
  return pieces[0] || '';
}

export function buildReferenceScript(lines: string[], maxLength = 300): string {
  const merged = lines
    .filter(Boolean)
    .join('，')
    .replace(/，{2,}/g, '，')
    .replace(/\s+/g, ' ')
    .replace(/^[，\s]+|[，\s]+$/g, '');
  if (!merged) return '';
  if (merged.length <= maxLength) return merged;
  return `${merged.slice(0, Math.max(0, maxLength - 3))}...`;
}
