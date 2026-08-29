import {
  buildTeachingProgressPromptContext,
  getTeachingProgressRule,
} from '../../client/src/config/teaching-progress-map';

const openingDate = new Date('2026-08-29T09:00:00+08:00');

describe('teaching progress map', () => {
  it('keeps high-one opening math on sets and logic instead of function synthesis', () => {
    const rule = getTeachingProgressRule({
      stage: 'high', grade: '高一', semester: '上学期', subject: '数学', date: openingDate,
    });

    expect(rule.currentContent.join('、')).toContain('集合');
    expect(rule.currentContent.join('、')).toContain('逻辑');
    expect(rule.currentContent.join('、')).not.toContain('函数单调性综合');
    expect(rule.doNotAdvance.join('、')).toContain('函数单调性综合');
  });

  it('does not advance seventh-grade opening math to zhongkao final problems', () => {
    const rule = getTeachingProgressRule({
      stage: 'middle', grade: '七年级', semester: '上学期', subject: '数学', date: openingDate,
    });

    expect(rule.currentContent.join('、')).toContain('有理数');
    expect(rule.doNotAdvance.join('、')).toContain('中考压轴题');
  });

  it('keeps primary opening advice within the current age band', () => {
    const rule = getTeachingProgressRule({
      stage: 'elementary', grade: '二年级', semester: '上学期', subject: '数学', date: openingDate,
    });

    expect(rule.currentContent.join('、')).toMatch(/数感|口算/u);
    expect(rule.doNotAdvance.join('、')).toContain('高年级分数');
  });

  it('includes the date judgment and school-progress verification boundary', () => {
    const context = buildTeachingProgressPromptContext({
      stage: 'high', grade: '高一', semester: '上学期', subjects: ['数学', '物理'], date: openingDate,
    });

    expect(context).toContain('当前日期/学期阶段判断');
    expect(context).toContain('学校课表、教材目录、最近作业');
    expect(context).toContain('现在不应提前安排');
  });
});
