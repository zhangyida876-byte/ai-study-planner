#!/usr/bin/env node
/**
 * 自检中考权威分值表：覆盖城市、科目完整性、明显异常分值
 * 用法：node scripts/check-zhongkao-scores.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'client/src/data/zhongkao-score-profiles.ts'), 'utf8');

// 粗解析：按 cityKeys 块拆（避免引入 tsx）
const blocks = src.split(/\{\s*cityKeys:/).slice(1);
const profiles = [];
for (const block of blocks) {
  const keysMatch = block.match(/\[([^\]]+)\]/);
  const totalMatch = block.match(/total:\s*(\d+)/);
  const yearMatch = block.match(/year:\s*(\d+)/);
  const confMatch = block.match(/confidence:\s*'([^']+)'/);
  const subjectsMatch = block.match(/subjects:\s*\{([^}]+)\}/);
  if (!keysMatch || !totalMatch || !subjectsMatch) continue;
  const cityKeys = [...keysMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  const subjects = {};
  for (const m of subjectsMatch[1].matchAll(/([\u4e00-\u9fa5]+)\s*:\s*(\d+)/g)) {
    subjects[m[1]] = Number(m[2]);
  }
  profiles.push({
    cityKeys,
    total: Number(totalMatch[1]),
    year: yearMatch ? Number(yearMatch[1]) : null,
    confidence: confMatch?.[1] || 'unknown',
    subjects,
  });
}

const MAIN = ['语文', '数学', '英语'];
let errors = 0;
const warn = (msg) => console.warn(`WARN  ${msg}`);
const fail = (msg) => {
  console.error(`FAIL  ${msg}`);
  errors += 1;
};

console.log(`Loaded ${profiles.length} zhongkao profiles`);

const covered = new Set(profiles.flatMap((p) => p.cityKeys));
console.log(`Covered cities (${covered.size}): ${[...covered].join('、')}`);

for (const p of profiles) {
  const label = p.cityKeys.join('/');
  const sum = Object.values(p.subjects).reduce((a, b) => a + b, 0);
  for (const sub of MAIN) {
    if (!(sub in p.subjects)) fail(`${label}: missing ${sub}`);
    else if (p.subjects[sub] < 80 || p.subjects[sub] > 160) {
      fail(`${label}: ${sub}=${p.subjects[sub]} out of typical band`);
    }
  }
  // 语文=100 在北京是合法的；其他城市若语文=100 且总分>600 多半是卷面噪声
  if (p.subjects['语文'] === 100 && p.total >= 600 && !p.cityKeys.includes('北京')) {
    fail(`${label}: 语文=100 但总分=${p.total}，疑似卷面百分制误入（长沙类问题）`);
  }
  if (p.total < 300 || p.total > 1000) fail(`${label}: total=${p.total} abnormal`);
  if (Math.abs(sum - p.total) > 80) {
    warn(`${label}: subjectSum=${sum} vs total=${p.total} (Δ${sum - p.total}) — 需 notes 解释实验/折算`);
  }
  if (!p.year || p.year < 2024) warn(`${label}: year=${p.year} may be stale`);
}

// 关键城市必须覆盖
for (const must of ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉', '长沙', '重庆', '天津']) {
  if (![...covered].some((c) => c.includes(must))) fail(`missing required city coverage: ${must}`);
}

if (errors > 0) {
  console.error(`\nSelf-check FAILED with ${errors} error(s)`);
  process.exit(1);
}
console.log('\nSelf-check PASSED');
