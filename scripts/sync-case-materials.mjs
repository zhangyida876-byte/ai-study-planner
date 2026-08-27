#!/usr/bin/env node

import { execFile, execFileSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const baseToken = process.env.CASE_LIBRARY_BASE_TOKEN || 'RU54bIWd9aJgW9sqypmcTaC1nFb';
const tableId = process.env.CASE_LIBRARY_TABLE_ID || 'tbl8Xeiesb4nJkn6';
const appId = process.env.CASE_LIBRARY_APP_ID || 'app_4ke0jqzqjy118';
const outputPath = resolve('client/src/data/case-materials.json');
const cacheDir = resolve('.case-material-sync');
const fields = [
  '图片',
  '人工标签',
  '所属学段',
  '具体年级',
  '图片类型',
  'AI标题',
  'AI适用场景',
  'AI推荐话术',
  'AI推荐标签',
  'AI搜索关键词',
  'AI证据句',
  'AI内容总结',
  'AI素材价值',
  'AI分析状态',
];

function parseEnvelope(raw) {
  const start = raw.indexOf('{');
  const result = JSON.parse(raw.slice(start));
  if (!result.ok) {
    throw new Error(result.error?.message || 'lark-cli request failed');
  }
  return result.data;
}

function runCli(args) {
  const raw = execFileSync('lark-cli', args, {
    encoding: 'utf8',
    maxBuffer: 100 * 1024 * 1024,
    env: {
      ...process.env,
      LARKSUITE_CLI_NO_UPDATE_NOTIFIER: '1',
      LARKSUITE_CLI_NO_SKILLS_NOTIFIER: '1',
    },
  });
  return parseEnvelope(raw);
}

async function runCliAsync(args) {
  const { stdout } = await execFileAsync('lark-cli', args, {
    maxBuffer: 100 * 1024 * 1024,
    env: {
      ...process.env,
      LARKSUITE_CLI_NO_UPDATE_NOTIFIER: '1',
      LARKSUITE_CLI_NO_SKILLS_NOTIFIER: '1',
    },
  });
  return parseEnvelope(stdout);
}

function firstValue(value) {
  if (Array.isArray(value)) return String(value[0] || '');
  return String(value || '');
}

function splitTerms(value) {
  return String(value || '')
    .split(/[、,，;；\n]+/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extensionFor(file) {
  const extension = extname(file.name || '').toLowerCase();
  if (extension && extension.length <= 6) return extension;
  return '.png';
}

function fetchRecords() {
  const records = [];
  let offset = 0;
  while (true) {
    const args = [
      'base',
      '+record-list',
      '--base-token',
      baseToken,
      '--table-id',
      tableId,
      '--limit',
      '200',
      '--offset',
      String(offset),
      '--as',
      'user',
      '--format',
      'json',
    ];
    for (const field of fields) args.push('--field-id', field);
    const data = runCli(args);
    data.data.forEach((row, index) => {
      const mapped = Object.fromEntries(fields.map((field, fieldIndex) => [field, row[fieldIndex]]));
      records.push({ id: data.record_id_list[index], fields: mapped });
    });
    if (!data.has_more) break;
    offset += data.data.length;
  }
  return records;
}

function fetchUploadedFiles() {
  const files = new Map();
  let pageToken = '';
  while (true) {
    const args = [
      'apps',
      '+file-list',
      '--app-id',
      appId,
      '--as',
      'user',
      '--page-size',
      '200',
      '--format',
      'json',
    ];
    if (pageToken) args.push('--page-token', pageToken);
    const data = runCli(args);
    for (const item of data.items || []) files.set(item.file_name, item.download_url);
    if (!data.has_more || !data.next_page_token) break;
    pageToken = data.next_page_token;
  }
  return files;
}

async function migrateImage(recordId, file, uploadedFiles) {
  const fileName = `${file.file_token}${extensionFor(file)}`;
  const existingUrl = uploadedFiles.get(fileName);
  if (existingUrl) return existingUrl;

  const relativePath = `.case-material-sync/${fileName}`;
  await runCliAsync([
    'base',
    '+record-download-attachment',
    '--base-token',
    baseToken,
    '--table-id',
    tableId,
    '--record-id',
    recordId,
    '--file-token',
    file.file_token,
    '--output',
    relativePath,
    '--overwrite',
    '--as',
    'user',
    '--format',
    'json',
  ]);
  const uploaded = await runCliAsync([
    'apps',
    '+file-upload',
    '--app-id',
    appId,
    '--file',
    relativePath,
    '--as',
    'user',
    '--format',
    'json',
  ]);
  uploadedFiles.set(fileName, uploaded.download_url);
  return uploaded.download_url;
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function consume() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, consume));
  return results;
}

async function main() {
  await mkdir(cacheDir, { recursive: true });
  const records = fetchRecords();
  const uploadedFiles = fetchUploadedFiles();
  const attachments = records.flatMap((record) =>
    (record.fields['图片'] || []).map((file) => ({ recordId: record.id, file })),
  );

  console.log(`Syncing ${records.length} records and ${attachments.length} images...`);
  let completed = 0;
  await mapWithConcurrency(attachments, 4, async ({ recordId, file }) => {
    const url = await migrateImage(recordId, file, uploadedFiles);
    completed += 1;
    if (completed % 20 === 0 || completed === attachments.length) {
      console.log(`Images ${completed}/${attachments.length}`);
    }
    return { token: file.file_token, url };
  });

  const materials = records.map((record) => {
    const value = record.fields;
    const imageFiles = value['图片'] || [];
    const images = imageFiles
      .map((file) => uploadedFiles.get(`${file.file_token}${extensionFor(file)}`))
      .filter(Boolean);
    return {
      id: record.id,
      images,
      title: String(value['AI标题'] || value['人工标签'] || '案例素材'),
      manualTag: String(value['人工标签'] || ''),
      stage: firstValue(value['所属学段']) || '通用',
      grade: firstValue(value['具体年级']),
      imageType: firstValue(value['图片类型']) || '其他',
      aiTags: splitTerms(value['AI推荐标签']),
      keywords: splitTerms(value['AI搜索关键词']),
      scenario: String(value['AI适用场景'] || ''),
      pitch: String(value['AI推荐话术'] || ''),
      evidence: String(value['AI证据句'] || ''),
      summary: String(value['AI内容总结'] || ''),
      value: String(value['AI素材价值'] || ''),
      status: String(value['AI分析状态'] || '待分析'),
    };
  });

  await writeFile(outputPath, `${JSON.stringify(materials, null, 2)}\n`, 'utf8');
  await rm(cacheDir, { recursive: true, force: true });
  console.log(`Wrote ${materials.length} materials to ${outputPath}`);
}

main().catch(async (error) => {
  try {
    await readFile(outputPath, 'utf8');
  } catch {
    await writeFile(outputPath, '[]\n', 'utf8');
  }
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
