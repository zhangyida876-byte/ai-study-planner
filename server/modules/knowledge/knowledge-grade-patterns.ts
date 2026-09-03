export function getKnowledgeGradeChapterPatterns(
  grade: string,
  semester?: string,
): string[] {
  if (/^[一二三四五六]年级$/u.test(grade)) {
    if (semester === '上学期') return [`${grade}上册`];
    if (semester === '下学期') return [`${grade}下册`];
    return [`${grade}上`, `${grade}下`];
  }

  if (/^[七八九]年级$/u.test(grade)) {
    if (semester === '上学期') return [`${grade}上册`];
    if (semester === '下学期') return [`${grade}下册`];
    return [`${grade}上`, `${grade}下`, `${grade}全`];
  }

  if (grade === '高一') {
    if (semester === '上学期') return ['高一必修第一册'];
    if (semester === '下学期') return ['高一必修第二册'];
    return ['高一必修第一册', '高一必修第二册'];
  }

  if (grade === '高二') {
    if (semester === '上学期') return ['高二选择性必修第一册'];
    if (semester === '下学期') {
      return ['高二选择性必修第二册', '高二选择性必修第三册'];
    }
    return [
      '高二选择性必修第一册',
      '高二选择性必修第二册',
      '高二选择性必修第三册',
    ];
  }

  if (grade === '高三') return ['高三复习'];
  return [];
}
