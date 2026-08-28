export type AcademicPhaseId =
  | 'winter-break'
  | 'spring-opening'
  | 'spring-monthly'
  | 'spring-midterm'
  | 'spring-final'
  | 'summer-break'
  | 'autumn-opening'
  | 'autumn-monthly'
  | 'autumn-midterm'
  | 'autumn-final';

export interface AcademicTimingContext {
  id: AcademicPhaseId;
  queryDate: string;
  semester: '上学期' | '下学期';
  phaseLabel: string;
  nearestAssessment: string;
  priorityFocus: string[];
  actionWindows: string[];
  confidenceNote: string;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function buildContext(
  id: AcademicPhaseId,
  date: Date,
  semester: AcademicTimingContext['semester'],
  phaseLabel: string,
  nearestAssessment: string,
  priorityFocus: string[],
  actionWindows: string[],
): AcademicTimingContext {
  return {
    id,
    queryDate: formatDate(date),
    semester,
    phaseLabel,
    nearestAssessment,
    priorityFocus,
    actionWindows,
    confidenceNote: '按常规校历和查询日期推测，具体开学日期、教学进度与考试范围须以学校通知为准。',
  };
}

export function resolveAcademicTiming(date: Date = new Date()): AcademicTimingContext {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const monthDay = month * 100 + day;

  if (monthDay <= 215) {
    return buildContext(
      'winter-break', date, '上学期', '上学期期末后与寒假衔接期', '春季开学摸底',
      ['复盘上学期期末试卷', '恢复计算、阅读和记忆等基础能力', '核对下学期前置知识'],
      ['未来7天', '春季开学前', '开学摸底前'],
    );
  }
  if (monthDay <= 310) {
    return buildContext(
      'spring-opening', date, '下学期', '春季开学衔接期', '开学摸底与第一次月考',
      ['检查寒假后知识恢复情况', '补上学期高频漏洞', '预习新学期第一单元'],
      ['未来7天', '开学第1周', '第一次月考前'],
    );
  }
  if (monthDay <= 405) {
    return buildContext(
      'spring-monthly', date, '下学期', '春季开学后第1个月', '第一次月考',
      ['校准新课听课与作业闭环', '处理第一单元高频错题', '用限时小测检验迁移'],
      ['未来7天', '第一次月考前', '月考后复盘'],
    );
  }
  if (monthDay <= 515) {
    return buildContext(
      'spring-midterm', date, '下学期', '下学期期中阶段', '期中考试',
      ['整合前半学期核心单元', '按错因安排专项训练', '稳定基础题与中档题得分'],
      ['期中前14天', '期中前7天', '考后复盘'],
    );
  }
  if (monthDay <= 630) {
    return buildContext(
      'spring-final', date, '下学期', '下学期期末阶段', '期末考试或升学考试',
      ['建立全学期知识结构', '聚焦反复失分模块', '完成套卷校准与错题回炉'],
      ['期末前21天', '期末前7天', '考后复盘'],
    );
  }
  if (monthDay <= 814) {
    return buildContext(
      'summer-break', date, '下学期', '暑假复盘与新学年前置期', '秋季开学摸底',
      ['复盘上学年试卷和薄弱单元', '维持基础能力手感', '为新学年第一单元补前置知识'],
      ['未来7天', '暑假后半程', '秋季开学前'],
    );
  }
  if (monthDay <= 910) {
    return buildContext(
      'autumn-opening', date, '上学期', '暑假末与秋季开学衔接期', '开学摸底与第一次月考',
      ['恢复上学年核心知识与做题手感', '定位开学考可能暴露的旧漏洞', '预习新学年第一单元'],
      ['未来7天', '开学第1周', '第一次月考前'],
    );
  }
  if (monthDay <= 1010) {
    return buildContext(
      'autumn-monthly', date, '上学期', '秋季开学后第1个月', '第一次月考',
      ['校准新学年学习节奏', '处理第一单元高频错题', '用月考范围做限时训练'],
      ['未来7天', '第一次月考前', '月考后复盘'],
    );
  }
  if (monthDay <= 1115) {
    return buildContext(
      'autumn-midterm', date, '上学期', '上学期期中阶段', '期中考试',
      ['整合前半学期核心单元', '用阶段卷定位稳定失分项', '按优先级完成查漏补缺'],
      ['期中前14天', '期中前7天', '考后复盘'],
    );
  }
  return buildContext(
    'autumn-final', date, '上学期', '上学期期末阶段', '期末考试',
    ['建立上学期知识结构', '回炉月考与期中反复错题', '完成限时套卷和考场执行训练'],
    ['期末前21天', '期末前7天', '考后复盘'],
  );
}

export function buildAcademicTimingPromptContext(date: Date = new Date()): string {
  const timing = resolveAcademicTiming(date);
  return [
    `查询日期：${timing.queryDate}`,
    `当前时间节点：${timing.phaseLabel}`,
    `当前学期：${timing.semester}`,
    `最近关键考试：${timing.nearestAssessment}`,
    `当前优先事项：${timing.priorityFocus.join('；')}`,
    `建议行动窗口：${timing.actionWindows.join(' → ')}`,
    `可信度说明：${timing.confidenceNote}`,
  ].join('\n');
}
