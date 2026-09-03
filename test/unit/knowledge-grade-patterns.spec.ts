import { getKnowledgeGradeChapterPatterns } from '../../server/modules/knowledge/knowledge-grade-patterns';

describe('getKnowledgeGradeChapterPatterns', () => {
  it('maps senior high semesters to the chapter naming stored in the database', () => {
    expect(getKnowledgeGradeChapterPatterns('高一', '上学期')).toEqual([
      '高一必修第一册',
    ]);
    expect(getKnowledgeGradeChapterPatterns('高一', '下学期')).toEqual([
      '高一必修第二册',
    ]);
    expect(getKnowledgeGradeChapterPatterns('高二', '下学期')).toEqual([
      '高二选择性必修第二册',
      '高二选择性必修第三册',
    ]);
    expect(getKnowledgeGradeChapterPatterns('高三', '上学期')).toEqual([
      '高三复习',
    ]);
  });

  it('keeps elementary and middle-school chapter matching compatible', () => {
    expect(getKnowledgeGradeChapterPatterns('四年级', '上学期')).toEqual([
      '四年级上册',
    ]);
    expect(getKnowledgeGradeChapterPatterns('七年级')).toEqual([
      '七年级上',
      '七年级下',
      '七年级全',
    ]);
  });
});
