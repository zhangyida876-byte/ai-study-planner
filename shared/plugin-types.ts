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
  /** 学生所在年级 */
  student_grade: string;
  /** 学生所在地区 */
  student_region?: string;
  /** 学生各科成绩详情 */
  subject_scores: string;
  /** 学生学习困扰描述 */
  learning_problems?: string;
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

// ---- plugin:knowledge_point_deep_analysis_1 ----
// ============================================================
// 插件 knowledge_point_deep_analysis_1 (知识点深度分析AI插件) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface KnowledgePointDeepAnalysisOneInput {
  /** 具体知识点名称，如一元二次方程的解法、光合作用的原理等 */
  knowledge_point: string;
  /** 教材版本，如人教版、苏教版、北师大版等 */
  textbook_version: string;
  /** 学科名称，如语文、数学、英语、物理、化学等 */
  subject: string;
  /** 年级学期，如七年级上册、高一下学期等 */
  grade_semester: string;
  /** 章节名称或编号，如第一章 有理数、第二章 细胞的基本结构等 */
  chapter: string;
}

/**
 * capabilityClient.load('knowledge_point_deep_analysis_1').call<KnowledgePointDeepAnalysisOneOutput>('textGenerate', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { content, response } = result;
 */
export interface KnowledgePointDeepAnalysisOneOutput {
  /** [object Object] */
  content: string;
  /** [object Object] */
  response?: string;
}
// ---- end:knowledge_point_deep_analysis_1 ----

// ---- plugin:junior_high_school_tier_search_1 ----
// ============================================================
// 插件 junior_high_school_tier_search_1 (小升初初中梯队信息搜索) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface JuniorHighSchoolTierSearchOneInput {
  /** 地区（如：北京市海淀区、湖北省武汉市） */
  region: string;
  /** 目标初中名称（可选，为空则搜索全部） */
  school_name?: string;
}

/**
 * capabilityClient.load('junior_high_school_tier_search_1').call<JuniorHighSchoolTierSearchOneOutput>('searchSummary', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { summary } = result;
 */
export interface JuniorHighSchoolTierSearchOneOutput {
  /** [object Object] */
  summary: string;
}
// ---- end:junior_high_school_tier_search_1 ----

// ---- plugin:college_entrance_policy_search_1 ----
// ============================================================
// 插件 college_entrance_policy_search_1 (高考政策搜索插件) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface CollegeEntrancePolicySearchOneInput {
  /** 高考所在省份/地区（如湖北省、广东省等） */
  region: string;
  /** 高考年份（如2025年、2026年等） */
  year: string;
  /** 补充搜索关键词（如新高考、选科、赋分等，可选） */
  keyword?: string;
}

/**
 * capabilityClient.load('college_entrance_policy_search_1').call<CollegeEntrancePolicySearchOneOutput>('searchSummary', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { summary } = result;
 */
export interface CollegeEntrancePolicySearchOneOutput {
  /** [object Object] */
  summary: string;
}
// ---- end:college_entrance_policy_search_1 ----

// ---- plugin:college_major_admission_query_1 ----
// ============================================================
// 插件 college_major_admission_query_1 (高考院校专业信息查询) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface CollegeMajorAdmissionQueryOneInput {
  /** 考生所在省份（如湖北省、广东省等） */
  region: string;
  /** 目标大学名称 */
  university_name: string;
  /** 考生选科组合（如物理+化学+生物，可选） */
  selected_subjects?: string;
}

/**
 * capabilityClient.load('college_major_admission_query_1').call<CollegeMajorAdmissionQueryOneOutput>('searchSummary', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { summary } = result;
 */
export interface CollegeMajorAdmissionQueryOneOutput {
  /** [object Object] */
  summary: string;
}
// ---- end:college_major_admission_query_1 ----

// ---- plugin:gaokao_major_career_salary_query_1 ----
// ============================================================
// 插件 gaokao_major_career_salary_query_1 (高考专业+职业薪资综合查询) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface GaokaoMajorCareerSalaryQueryOneInput {
  /** 考生所在省份（如湖北省、广东省等） */
  region: string;
  /** 目标大学名称 */
  university_name: string;
  /** 目标专业名称 */
  major_name: string;
  /** 考生选科组合（如物理+化学+生物，可选） */
  selected_subjects?: string;
}

/**
 * capabilityClient.load('gaokao_major_career_salary_query_1').call<GaokaoMajorCareerSalaryQueryOneOutput>('searchSummary', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { summary } = result;
 */
export interface GaokaoMajorCareerSalaryQueryOneOutput {
  /** [object Object] */
  summary: string;
}
// ---- end:gaokao_major_career_salary_query_1 ----

// ---- plugin:feishu_bitable_data_reader_1 ----
// ============================================================
// 插件 feishu_bitable_data_reader_1 (飞书多维表格数据读取实例) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface FeishuBitableDataReaderOneAggregatequeryInput {
  /** [object Object] */
  filter?: {
    conjunction: string;
    conditions: {
      fieldName: string;
      operator: string;
      value: string[];
    }[];
  };
  /** [object Object] */
  expandArrayDimension?: boolean;
  /** [object Object] */
  dimensions?: string[];
  /** [object Object] */
  measures?: {
    fieldName: string;
    aggregation: string;
    alias: string;
  }[];
  /** [object Object] */
  pageToken?: string;
  /** [object Object] */
  pageSize?: number;
  /** [object Object] */
  sort?: {
    desc: boolean;
    fieldName: string;
  }[];
}

/**
 * capabilityClient.load('feishu_bitable_data_reader_1').call<FeishuBitableDataReaderOneAggregatequeryOutput>('aggregateQuery', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { result, hasMore, pageToken } = result;
 */
export interface FeishuBitableDataReaderOneAggregatequeryOutput {
  /** [object Object] */
  result: {

  }[];
  /** [object Object] */
  hasMore: boolean;
  /** [object Object] */
  pageToken?: string;
}

export interface FeishuBitableDataReaderOneBatchaddrecordsInput {
  /** [object Object] */
  records: {
    record: {

    };
  }[];
}

/**
 * capabilityClient.load('feishu_bitable_data_reader_1').call<FeishuBitableDataReaderOneBatchaddrecordsOutput>('batchAddRecords', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { records } = result;
 */
export interface FeishuBitableDataReaderOneBatchaddrecordsOutput {
  /** [object Object] */
  records: {
    id: string;
  }[];
}

export interface FeishuBitableDataReaderOneBatchupdaterecordsInput {
  /** [object Object] */
  records: {
    record: {

    };
    id: string;
  }[];
}

/**
 * capabilityClient.load('feishu_bitable_data_reader_1').call<FeishuBitableDataReaderOneBatchupdaterecordsOutput>('batchUpdateRecords', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { records } = result;
 */
export interface FeishuBitableDataReaderOneBatchupdaterecordsOutput {
  /** [object Object] */
  records: {
    id: string;
  }[];
}

export interface FeishuBitableDataReaderOneDeleterecordsInput {
  /** [object Object] */
  recordIDs: string[];
}

/**
 * capabilityClient.load('feishu_bitable_data_reader_1').call<FeishuBitableDataReaderOneDeleterecordsOutput>('deleteRecords', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { success } = result;
 */
export interface FeishuBitableDataReaderOneDeleterecordsOutput {
  /** [object Object] */
  success: boolean;
}

export interface FeishuBitableDataReaderOneGetrecordInput {
  /** [object Object] */
  recordID: string;
}

/**
 * capabilityClient.load('feishu_bitable_data_reader_1').call<FeishuBitableDataReaderOneGetrecordOutput>('getRecord', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { id, record } = result;
 */
export interface FeishuBitableDataReaderOneGetrecordOutput {
  /** [object Object] */
  id: string;
  /** [object Object] */
  record?: {

  };
}

export interface FeishuBitableDataReaderOneSearchrecordsInput {
  /** [object Object] */
  pageToken?: string;
  /** [object Object] */
  pageSize?: number;
  /** [object Object] */
  fieldNames?: string[];
  /** [object Object] */
  sort?: {
    fieldName: string;
    desc: boolean;
  }[];
  /** [object Object] */
  filter?: {
    conjunction: string;
    conditions: {
      fieldName: string;
      operator: string;
      value: string[];
    }[];
  };
}

/**
 * capabilityClient.load('feishu_bitable_data_reader_1').call<FeishuBitableDataReaderOneSearchrecordsOutput>('searchRecords', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { records, hasMore, pageToken, ... } = result;
 */
export interface FeishuBitableDataReaderOneSearchrecordsOutput {
  /** [object Object] */
  records: {
    id: string;
    record: {

    };
  }[];
  /** [object Object] */
  hasMore: boolean;
  /** [object Object] */
  pageToken?: string;
  /** [object Object] */
  total?: number;
}
// ---- end:feishu_bitable_data_reader_1 ----