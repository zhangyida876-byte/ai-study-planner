const SCORE_ALIAS_MAP: Record<string, string[]> = {
  语文: ['语文', '语'],
  数学: ['数学', '数'],
  英语: ['英语', '英'],
  物理: ['物理', '物'],
  化学: ['化学', '化'],
  生物: ['生物', '生'],
  历史: ['历史', '史'],
  地理: ['地理', '地'],
  政治: ['政治', '道法', '政', '政治道法'],
};

function toFieldPattern(alias: string): string {
  return alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseScoreOverviewToSubjectScores(
  scoresOverview: string,
): Record<string, number> {
  const text = scoresOverview.trim();
  if (!text) return {};

  const output: Record<string, number> = {};
  for (const [subject, aliases] of Object.entries(SCORE_ALIAS_MAP)) {
    for (const alias of aliases) {
      const pattern = new RegExp(`${toFieldPattern(alias)}\\s*[:：]?\\s*(\\d{1,3})`);
      const matched = text.match(pattern);
      if (matched) {
        const score = Number.parseInt(matched[1], 10);
        if (Number.isFinite(score)) {
          output[subject] = score;
          break;
        }
      }
    }
  }
  return output;
}
