import type { SchoolInfo } from '@shared/api.interface';

const KEY_SCHOOL_PATTERN = /重点|示范|省级|市级|一中|附中|实验/u;
const ORDINARY_SCHOOL_PATTERN = /普通|普高|一般|民办/u;

export interface SchoolBenchmarkContext {
  text: string;
  complete: boolean;
}

export function buildMiddleSchoolBenchmarkContext(
  schools: SchoolInfo[],
  year: number,
): SchoolBenchmarkContext {
  const validSchools: SchoolInfo[] = schools
    .filter((school: SchoolInfo) => school.name.trim() && school.score > 0)
    .sort((left: SchoolInfo, right: SchoolInfo) => right.score - left.score);

  if (validSchools.length === 0) {
    return { text: '', complete: false };
  }

  const keySchool: SchoolInfo =
    validSchools.find((school: SchoolInfo) =>
      KEY_SCHOOL_PATTERN.test(`${school.name} ${school.batch}`),
    ) ?? validSchools[0];
  const remainingSchools: SchoolInfo[] = validSchools.filter(
    (school: SchoolInfo) => school.name !== keySchool.name,
  );
  const ordinarySchool: SchoolInfo | undefined =
    remainingSchools.find((school: SchoolInfo) =>
      ORDINARY_SCHOOL_PATTERN.test(`${school.name} ${school.batch}`),
    ) ?? remainingSchools[Math.floor(remainingSchools.length / 2)];

  const lines: string[] = [
    `重点高中参考：${keySchool.name}，${keySchool.score}分（${year}年，${keySchool.batch}）`,
    ordinarySchool
      ? `普通高中参考：${ordinarySchool.name}，${ordinarySchool.score}分（${year}年，${ordinarySchool.batch}）`
      : '普通高中参考：本地数据不足，需联网补充并标注待核实',
    '分类说明：以上按本地已收录学校名称、批次和分数线作顾问参考分层，不代表教育部门官方学校等级认定。',
  ];

  return {
    text: lines.join('\n'),
    complete: Boolean(ordinarySchool),
  };
}
