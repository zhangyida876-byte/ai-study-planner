/* eslint-disable */
/** auto generated, do not edit */
import { sql } from 'drizzle-orm';
import { bigint, boolean, index, integer, jsonb, pgTable, text, uniqueIndex, uuid, varchar, customType } from "drizzle-orm/pg-core"

export const customTimestamptz = customType<{
  data: Date;
  driverData: string;
  config: { precision?: number };
}>({
  dataType(config) {
    const precision = typeof config?.precision !== 'undefined'
      ? ` (${config.precision})`
      : '';
    return `timestamptz${precision}`;
  },
  toDriver(value: Date | string | number) {
    if (value == null) return value as any;
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    throw new Error('Invalid timestamp value');
  },
  fromDriver(value: string | Date): Date {
    if (value instanceof Date) return value;
    return new Date(value);
  },
});

export const userProfile = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'user_profile';
  },
  toDriver(value: string) {
    return sql`ROW(${value})::user_profile`;
  },
  fromDriver(value: string) {
    const [userId] = value.slice(1, -1).split(',');
    return userId.trim();
  },
});

export type FileAttachment = {
  bucket_id: string;
  file_path: string;
};

export const fileAttachment = customType<{
  data: FileAttachment;
  driverData: string;
}>({
  dataType() {
    return 'file_attachment';
  },
  toDriver(value: FileAttachment) {
    return sql`ROW(${value.bucket_id},${value.file_path})::file_attachment`;
  },
  fromDriver(value: string): FileAttachment {
    const [bucketId, filePath] = value.slice(1, -1).split(',');
    return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
  },
});

export function escapeLiteral(str: string): string {
  return "'" + str.replace(/'/g, "''") + "'";
}

export const userProfileArray = customType<{
  data: string[];
  driverData: string;
}>({
  dataType() {
    return 'user_profile[]';
  },
  toDriver(value: string[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::user_profile[]`;
    }
    const elements = value.map(id => `ROW(${escapeLiteral(id)})::user_profile`).join(',');
    return sql.raw(`ARRAY[${elements}]::user_profile[]`);
  },
  fromDriver(value: string): string[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => m.slice(1, -1).split(',')[0].trim());
  },
});

export const fileAttachmentArray = customType<{
  data: FileAttachment[];
  driverData: string;
}>({
  dataType() {
    return 'file_attachment[]';
  },
  toDriver(value: FileAttachment[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::file_attachment[]`;
    }
    const elements = value.map(f =>
      `ROW(${escapeLiteral(f.bucket_id)},${escapeLiteral(f.file_path)})::file_attachment`
    ).join(',');
    return sql.raw(`ARRAY[${elements}]::file_attachment[]`);
  },
  fromDriver(value: string): FileAttachment[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => {
      const [bucketId, filePath] = m.slice(1, -1).split(',');
      return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
    });
  },
});

export const caseArchive = pgTable("case_archive", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentName: varchar("student_name", { length: 100 }).notNull(),
  stage: varchar("stage", { length: 20 }).notNull(),
  grade: varchar("grade", { length: 50 }).notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  targetSchool: varchar("target_school", { length: 200 }),
  targetScore: integer("target_score"),
  artifactType: varchar("artifact_type", { length: 30 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  /**
   * @type Record<string, unknown>
   */
  inputSnapshot: jsonb("input_snapshot").notNull().default('{}'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_case_archive_created_at").on(table.createdAt),
  index("idx_case_archive_student_name").on(table.studentName),
  index("idx_case_archive_artifact_type").on(table.artifactType),
]);

export const resourceLibrary = pgTable("resource_library", {
  id: text("id").primaryKey().default(sql`md5(((random())`),
  sourceUrl: text("source_url").notNull().unique(),
  sourceId: text("source_id"),
  title: text("title").notNull(),
  resourceType: varchar("resource_type", { length: 20 }).notNull(),
  stage: varchar("stage", { length: 20 }).notNull(),
  topic: varchar("topic", { length: 100 }).notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  priority: integer("priority").notNull().default(100),
  isLatest: boolean("is_latest").notNull().default(true),
  createdAt: customTimestamptz("created_at", { precision: 6 }).notNull().default(sql`now()`),
  updatedAt: customTimestamptz("updated_at", { precision: 6 }).notNull().default(sql`now()`),
}, (table) => [
  uniqueIndex("resource_library_source_url_key").on(table.sourceUrl),
]);

export const scriptResourceLibrary = pgTable("script_resource_library", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  sourceUrl: text("source_url").notNull().unique(),
  sourceType: varchar("source_type", { length: 20 }).notNull().default('docx'),
  category: varchar("category", { length: 80 }).notNull(),
  stage: varchar("stage", { length: 20 }).notNull().default('all'),
  tags: jsonb("tags").notNull().default('[]'),
  contentMarkdown: text("content_markdown").notNull(),
  summary: text("summary"),
  priorityNote: text("priority_note"),
  createdAt: customTimestamptz("created_at", { precision: 6 }).notNull().default(sql`now()`),
  updatedAt: customTimestamptz("updated_at", { precision: 6 }).notNull().default(sql`now()`),
}, (table) => [
  uniqueIndex("script_resource_library_source_url_key").on(table.sourceUrl),
  index("idx_script_resource_library_stage").on(table.stage),
  index("idx_script_resource_library_category").on(table.category),
]);

export const learningPlanRecord = pgTable("learning_plan_record", {
  id: uuid("id").primaryKey().defaultRandom(),
  stage: varchar("stage", { length: 20 }).notNull(),
  grade: varchar("grade", { length: 50 }).notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  school: varchar("school", { length: 200 }),
  targetSchool: varchar("target_school", { length: 200 }),
  examDate: customTimestamptz("exam_date", { precision: 6 }),
  /**
   * @type Record<string, number>
   */
  currentScores: jsonb("current_scores").notNull().default('{}'),
  /**
   * @type Record<string, number>
   */
  targetScores: jsonb("target_scores").notNull().default('{}'),
  weakSubjects: text("weak_subjects").array().notNull().default([]),
  strongSubjects: text("strong_subjects").array().notNull().default([]),
  weeklyTotalHours: integer("weekly_total_hours"),
  /**
   * @type Record<string, string>
   */
  dailyAvailableTime: jsonb("daily_available_time"),
  isBoarding: boolean("is_boarding").default(false),
  /**
   * @type Record<string, Array<{start: string, end: string}>>
   */
  availableTimeSlots: jsonb("available_time_slots"),
  hasEveningStudy: boolean("has_evening_study").default(false),
  hasExtracurricularClasses: boolean("has_extracurricular_classes").default(false),
  /**
   * @type Array<{name: string, time: string, duration: number}>
   */
  fixedActivities: jsonb("fixed_activities"),
  /**
   * @type Record<string, Array<string>>
   */
  dailySchedule: jsonb("daily_schedule"),
  /**
   * @type Record<string, "low"|"medium"|"high">
   */
  dailyHomeworkLoad: jsonb("daily_homework_load"),
  /**
   * @type Record<string, Array<"new_knowledge"|"review"|"practice"|"error_correction">>
   */
  suitableLearningTypes: jsonb("suitable_learning_types"),
  customRequirements: text("custom_requirements"),
  planContent: text("plan_content"),
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

// Synced table: data is auto-synced from external source. Do not rename or delete this table.
export const learningSituationData = pgTable("learning_situation_data", {
  id: uuid("id").primaryKey().unique().defaultRandom(),
  // Synced field: auto-synced, do not modify or delete
  baseRecordId: varchar("base_record_id").unique(),
  // Synced field: auto-synced, do not modify or delete
  dataType: text("data_type"),
  // Synced field: auto-synced, do not modify or delete
  region: text("region"),
  // Synced field: auto-synced, do not modify or delete
  gradeLevel: text("grade_level"),
  // Synced field: auto-synced, do not modify or delete
  coreContent: text("core_content"),
  // Synced field: auto-synced, do not modify or delete
  officialSourceLink: text("official_source_link"),
  // Synced field: auto-synced, do not modify or delete
  officialReleaseTime: text("official_release_time"),
  // Synced field: auto-synced, do not modify or delete
  collectionUpdateTime: text("collection_update_time"),
  // Synced field: auto-synced, do not modify or delete
  dataStatus: text("data_status"),
  // Synced field: auto-synced, do not modify or delete
  year: bigint("year", { mode: 'number' }),
  // Synced field: auto-synced, do not modify or delete
  duplicateCheckKey: text("duplicate_check_key"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  uniqueIndex("unq_1868248208479271").on(table.id),
  uniqueIndex("unq_1868248208480407").on(table.baseRecordId),
]);

export const admissionPolicy = pgTable("admission_policy", {
  id: uuid("id").primaryKey().defaultRandom(),
  region: varchar("region", { length: 100 }).notNull(),
  year: integer("year").notNull(),
  totalScore: integer("total_score").notNull(),
  /**
   * @type Record<string, number>
   */
  scoreStructure: jsonb("score_structure").notNull().default('{}'),
  /**
   * @type Array<{batch: string, school: string, score: number}>
   */
  admissionLines: jsonb("admission_lines").notNull().default('[]'),
  policyContent: text("policy_content"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_admission_policy_region").on(table.region),
]);

export const knowledgePoint = pgTable("knowledge_point", {
  id: uuid("id").primaryKey().defaultRandom(),
  version: varchar("version", { length: 100 }).notNull(),
  subject: varchar("subject", { length: 100 }).notNull(),
  chapter: varchar("chapter", { length: 200 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  /**
   * @type {coreKnowledge: string, solutionMethods: string, commonMistakes: string}
   */
  content: jsonb("content").notNull().default('{}'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_knowledge_point_version").on(table.version),
  index("idx_knowledge_point_subject").on(table.subject),
]);

export const planRecord = pgTable("plan_record", {
  id: uuid("id").primaryKey().defaultRandom(),
  region: varchar("region", { length: 100 }).notNull(),
  /**
   * @type Record<string, number>
   */
  scores: jsonb("scores").notNull().default('{}'),
  policyData: jsonb("policy_data"),
  planReport: text("plan_report"),
  /**
   * @type Array<{date: string, title: string, content: string}>
   */
  timeline: jsonb("timeline"),
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const diagnosisRecord = pgTable("diagnosis_record", {
  id: uuid("id").primaryKey().defaultRandom(),
  grade: varchar("grade", { length: 50 }).notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  /**
   * @type Record<string, number>
   */
  scores: jsonb("scores").notNull().default('{}'),
  problemDesc: text("problem_desc"),
  report: text("report"),
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  studentName: varchar("student_name", { length: 100 }).notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

// table aliases
export const admissionPolicyTable = admissionPolicy;
export const caseArchiveTable = caseArchive;
export const diagnosisRecordTable = diagnosisRecord;
export const knowledgePointTable = knowledgePoint;
export const learningPlanRecordTable = learningPlanRecord;
export const learningSituationDataTable = learningSituationData;
export const planRecordTable = planRecord;
export const resourceLibraryTable = resourceLibrary;
export const scriptResourceLibraryTable = scriptResourceLibrary;
