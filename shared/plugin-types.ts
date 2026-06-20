// ---- plugin:exam_policy_search_1 ----
// ============================================================
// 插件 exam_policy_search_1 (中考考情政策搜索) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface ExamPolicySearchOneInput {
  /** 中考所在地区（如北京市、上海市、广东省等） */
  region: string;
  /** 中考年份（如2025年、2026年等） */
  year: string;
  /** 补充搜索关键词（如政策调整、考纲变化、报名时间等，可选） */
  keyword?: string;
}

/**
 * capabilityClient.load('exam_policy_search_1').call<ExamPolicySearchOneOutput>('searchSummary', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { summary } = result;
 */
export interface ExamPolicySearchOneOutput {
  /** [object Object] */
  summary: string;
}
// ---- end:exam_policy_search_1 ----

// ---- plugin:exam_schedule_timeline_generator_1 ----
// ============================================================
// 插件 exam_schedule_timeline_generator_1 (中考时间路线图生成) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface ExamScheduleTimelineGeneratorOneInput {
  /** 学生当前年级（如：初一、初二、初三） */
  current_grade: string;
  /** 学生所在地区（如：北京市、广东省、上海市） */
  region: string;
}

/**
 * capabilityClient.load('exam_schedule_timeline_generator_1').call<ExamScheduleTimelineGeneratorOneOutput>('textGenerate', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { content, response } = result;
 */
export interface ExamScheduleTimelineGeneratorOneOutput {
  /** [object Object] */
  content: string;
  /** [object Object] */
  response?: string;
}
// ---- end:exam_schedule_timeline_generator_1 ----

// ---- plugin:study_plan_report_generate_1 ----
// ============================================================
// 插件 study_plan_report_generate_1 (升学规划报告生成) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface StudyPlanReportGenerateOneInput {
  /** 学生其他相关信息（如年级、偏好专业、意向学校等，可选） */
  student_additional_info?: string;
  /** 学生当前各科成绩明细，包含科目名称、分数、满分值 */
  student_scores: string;
  /** 目标地区升学政策及各批次学校录取分数线数据 */
  region_admission_policy: string;
}

/**
 * capabilityClient.load('study_plan_report_generate_1').call<StudyPlanReportGenerateOneOutput>('textGenerate', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { response, content } = result;
 */
export interface StudyPlanReportGenerateOneOutput {
  /** [object Object] */
  response?: string;
  /** [object Object] */
  content: string;
}
// ---- end:study_plan_report_generate_1 ----

// ---- plugin:academic_diagnosis_report_generator_1 ----
// ============================================================
// 插件 academic_diagnosis_report_generator_1 (学情诊断报告生成) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface AcademicDiagnosisReportGeneratorOneInput {
  /** 学生学习困扰描述 */
  learning_problems?: string;
  /** 学生所在年级 */
  student_grade: string;
  /** 学生所在地区 */
  student_region?: string;
  /** 学生各科成绩详情 */
  subject_scores: string;
}

/**
 * capabilityClient.load('academic_diagnosis_report_generator_1').call<AcademicDiagnosisReportGeneratorOneOutput>('textGenerate', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { content, response } = result;
 */
export interface AcademicDiagnosisReportGeneratorOneOutput {
  /** [object Object] */
  content: string;
  /** [object Object] */
  response?: string;
}
// ---- end:academic_diagnosis_report_generator_1 ----

// ---- plugin:high_school_search_by_region_1 ----
// ============================================================
// 插件 high_school_search_by_region_1 (按地区搜索重点高中名单) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface HighSchoolSearchByRegionOneInput {
  /** 需要搜索高中的地区（如：北京市海淀区、广东省广州市） */
  region: string;
}

/**
 * capabilityClient.load('high_school_search_by_region_1').call<HighSchoolSearchByRegionOneOutput>('searchSummary', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { summary } = result;
 */
export interface HighSchoolSearchByRegionOneOutput {
  /** [object Object] */
  summary: string;
}
// ---- end:high_school_search_by_region_1 ----

// ---- plugin:high_school_admission_score_query_1 ----
// ============================================================
// 插件 high_school_admission_score_query_1 (高中录取分数线查询) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface HighSchoolAdmissionScoreQueryOneInput {
  /** 地区（如：北京市、上海市浦东新区等） */
  region: string;
  /** 目标学校名称 */
  school_name: string;
  /** 考试类型（中考/高考） */
  exam_type: string;
}

/**
 * capabilityClient.load('high_school_admission_score_query_1').call<HighSchoolAdmissionScoreQueryOneOutput>('searchSummary', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { summary } = result;
 */
export interface HighSchoolAdmissionScoreQueryOneOutput {
  /** [object Object] */
  summary: string;
}
// ---- end:high_school_admission_score_query_1 ----