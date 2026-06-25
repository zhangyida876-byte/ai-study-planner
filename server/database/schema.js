"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.planRecordTable = exports.learningSituationDataTable = exports.knowledgePointTable = exports.diagnosisRecordTable = exports.admissionPolicyTable = exports.diagnosisRecord = exports.planRecord = exports.knowledgePoint = exports.admissionPolicy = exports.learningSituationData = exports.fileAttachmentArray = exports.userProfileArray = exports.fileAttachment = exports.userProfile = exports.customTimestamptz = void 0;
exports.escapeLiteral = escapeLiteral;
/* eslint-disable */
/** auto generated, do not edit */
var drizzle_orm_1 = require("drizzle-orm");
var pg_core_1 = require("drizzle-orm/pg-core");
exports.customTimestamptz = (0, pg_core_1.customType)({
    dataType: function (config) {
        var precision = typeof (config === null || config === void 0 ? void 0 : config.precision) !== 'undefined'
            ? " (".concat(config.precision, ")")
            : '';
        return "timestamptz".concat(precision);
    },
    toDriver: function (value) {
        if (value == null)
            return value;
        if (typeof value === 'number')
            return new Date(value).toISOString();
        if (typeof value === 'string')
            return value;
        if (value instanceof Date)
            return value.toISOString();
        throw new Error('Invalid timestamp value');
    },
    fromDriver: function (value) {
        if (value instanceof Date)
            return value;
        return new Date(value);
    },
});
exports.userProfile = (0, pg_core_1.customType)({
    dataType: function () {
        return 'user_profile';
    },
    toDriver: function (value) {
        return (0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["ROW(", ")::user_profile"], ["ROW(", ")::user_profile"])), value);
    },
    fromDriver: function (value) {
        var userId = value.slice(1, -1).split(',')[0];
        return userId.trim();
    },
});
exports.fileAttachment = (0, pg_core_1.customType)({
    dataType: function () {
        return 'file_attachment';
    },
    toDriver: function (value) {
        return (0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["ROW(", ",", ")::file_attachment"], ["ROW(", ",", ")::file_attachment"])), value.bucket_id, value.file_path);
    },
    fromDriver: function (value) {
        var _a = value.slice(1, -1).split(','), bucketId = _a[0], filePath = _a[1];
        return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
    },
});
function escapeLiteral(str) {
    return "'" + str.replace(/'/g, "''") + "'";
}
exports.userProfileArray = (0, pg_core_1.customType)({
    dataType: function () {
        return 'user_profile[]';
    },
    toDriver: function (value) {
        if (!value || value.length === 0) {
            return (0, drizzle_orm_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["'{}'::user_profile[]"], ["'{}'::user_profile[]"])));
        }
        var elements = value.map(function (id) { return "ROW(".concat(escapeLiteral(id), ")::user_profile"); }).join(',');
        return drizzle_orm_1.sql.raw("ARRAY[".concat(elements, "]::user_profile[]"));
    },
    fromDriver: function (value) {
        if (!value || value === '{}')
            return [];
        var inner = value.slice(1, -1);
        var matches = inner.match(/\([^)]*\)/g) || [];
        return matches.map(function (m) { return m.slice(1, -1).split(',')[0].trim(); });
    },
});
exports.fileAttachmentArray = (0, pg_core_1.customType)({
    dataType: function () {
        return 'file_attachment[]';
    },
    toDriver: function (value) {
        if (!value || value.length === 0) {
            return (0, drizzle_orm_1.sql)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["'{}'::file_attachment[]"], ["'{}'::file_attachment[]"])));
        }
        var elements = value.map(function (f) {
            return "ROW(".concat(escapeLiteral(f.bucket_id), ",").concat(escapeLiteral(f.file_path), ")::file_attachment");
        }).join(',');
        return drizzle_orm_1.sql.raw("ARRAY[".concat(elements, "]::file_attachment[]"));
    },
    fromDriver: function (value) {
        if (!value || value === '{}')
            return [];
        var inner = value.slice(1, -1);
        var matches = inner.match(/\([^)]*\)/g) || [];
        return matches.map(function (m) {
            var _a = m.slice(1, -1).split(','), bucketId = _a[0], filePath = _a[1];
            return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
        });
    },
});
// Synced table: data is auto-synced from external source. Do not rename or delete this table.
exports.learningSituationData = (0, pg_core_1.pgTable)("learning_situation_data", {
    id: (0, pg_core_1.uuid)("id").primaryKey().unique().defaultRandom(),
    // Synced field: auto-synced, do not modify or delete
    baseRecordId: (0, pg_core_1.varchar)("base_record_id").unique(),
    // Synced field: auto-synced, do not modify or delete
    dataType: (0, pg_core_1.text)("data_type"),
    // Synced field: auto-synced, do not modify or delete
    region: (0, pg_core_1.text)("region"),
    // Synced field: auto-synced, do not modify or delete
    gradeLevel: (0, pg_core_1.text)("grade_level"),
    // Synced field: auto-synced, do not modify or delete
    coreContent: (0, pg_core_1.text)("core_content"),
    // Synced field: auto-synced, do not modify or delete
    officialSourceLink: (0, pg_core_1.text)("official_source_link"),
    // Synced field: auto-synced, do not modify or delete
    officialReleaseTime: (0, pg_core_1.text)("official_release_time"),
    // Synced field: auto-synced, do not modify or delete
    collectionUpdateTime: (0, pg_core_1.text)("collection_update_time"),
    // Synced field: auto-synced, do not modify or delete
    dataStatus: (0, pg_core_1.text)("data_status"),
    // Synced field: auto-synced, do not modify or delete
    year: (0, pg_core_1.bigint)("year", { mode: 'number' }),
    // Synced field: auto-synced, do not modify or delete
    duplicateCheckKey: (0, pg_core_1.text)("duplicate_check_key"),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: (0, exports.customTimestamptz)("_created_at", { precision: 6 }).notNull().default((0, drizzle_orm_1.sql)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["now()"], ["now()"])))),
    // System field: Creator (auto-filled, do not modify)
    createdBy: (0, exports.userProfile)("_created_by"),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: (0, exports.customTimestamptz)("_updated_at", { precision: 6 }).notNull().default((0, drizzle_orm_1.sql)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["now()"], ["now()"])))),
    // System field: Updater (auto-filled, do not modify)
    updatedBy: (0, exports.userProfile)("_updated_by"),
}, function (table) { return [
    (0, pg_core_1.uniqueIndex)("unq_1868248208479271").on(table.id),
    (0, pg_core_1.uniqueIndex)("unq_1868248208480407").on(table.baseRecordId),
]; });
exports.admissionPolicy = (0, pg_core_1.pgTable)("admission_policy", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    region: (0, pg_core_1.varchar)("region", { length: 100 }).notNull(),
    year: (0, pg_core_1.integer)("year").notNull(),
    totalScore: (0, pg_core_1.integer)("total_score").notNull(),
    /**
     * @type Record<string, number>
     */
    scoreStructure: (0, pg_core_1.jsonb)("score_structure").notNull().default('{}'),
    /**
     * @type Array<{batch: string, school: string, score: number}>
     */
    admissionLines: (0, pg_core_1.jsonb)("admission_lines").notNull().default('[]'),
    policyContent: (0, pg_core_1.text)("policy_content"),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: (0, exports.customTimestamptz)("_created_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))),
    // System field: Creator (auto-filled, do not modify)
    createdBy: (0, exports.userProfile)("_created_by").default((0, drizzle_orm_1.sql)(templateObject_8 || (templateObject_8 = __makeTemplateObject(["CASE\n    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL"], ["CASE\n    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL"])))),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: (0, exports.customTimestamptz)("_updated_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql)(templateObject_9 || (templateObject_9 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))),
    // System field: Updater (auto-filled, do not modify)
    updatedBy: (0, exports.userProfile)("_updated_by").default((0, drizzle_orm_1.sql)(templateObject_10 || (templateObject_10 = __makeTemplateObject(["CASE\n    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL"], ["CASE\n    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL"])))),
}, function (table) { return [
    (0, pg_core_1.index)("idx_admission_policy_region").on(table.region),
]; });
exports.knowledgePoint = (0, pg_core_1.pgTable)("knowledge_point", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    version: (0, pg_core_1.varchar)("version", { length: 100 }).notNull(),
    subject: (0, pg_core_1.varchar)("subject", { length: 100 }).notNull(),
    chapter: (0, pg_core_1.varchar)("chapter", { length: 200 }).notNull(),
    name: (0, pg_core_1.varchar)("name", { length: 200 }).notNull(),
    /**
     * @type {coreKnowledge: string, solutionMethods: string, commonMistakes: string}
     */
    content: (0, pg_core_1.jsonb)("content").notNull().default('{}'),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: (0, exports.customTimestamptz)("_created_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql)(templateObject_11 || (templateObject_11 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))),
    // System field: Creator (auto-filled, do not modify)
    createdBy: (0, exports.userProfile)("_created_by").default((0, drizzle_orm_1.sql)(templateObject_12 || (templateObject_12 = __makeTemplateObject(["CASE\n    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL"], ["CASE\n    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL"])))),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: (0, exports.customTimestamptz)("_updated_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql)(templateObject_13 || (templateObject_13 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))),
    // System field: Updater (auto-filled, do not modify)
    updatedBy: (0, exports.userProfile)("_updated_by").default((0, drizzle_orm_1.sql)(templateObject_14 || (templateObject_14 = __makeTemplateObject(["CASE\n    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL"], ["CASE\n    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL"])))),
}, function (table) { return [
    (0, pg_core_1.index)("idx_knowledge_point_version").on(table.version),
    (0, pg_core_1.index)("idx_knowledge_point_subject").on(table.subject),
]; });
exports.planRecord = (0, pg_core_1.pgTable)("plan_record", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    region: (0, pg_core_1.varchar)("region", { length: 100 }).notNull(),
    /**
     * @type Record<string, number>
     */
    scores: (0, pg_core_1.jsonb)("scores").notNull().default('{}'),
    policyData: (0, pg_core_1.jsonb)("policy_data"),
    planReport: (0, pg_core_1.text)("plan_report"),
    /**
     * @type Array<{date: string, title: string, content: string}>
     */
    timeline: (0, pg_core_1.jsonb)("timeline"),
    status: (0, pg_core_1.varchar)("status", { length: 20 }).notNull().default('pending'),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: (0, exports.customTimestamptz)("_created_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql)(templateObject_15 || (templateObject_15 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))),
    // System field: Creator (auto-filled, do not modify)
    createdBy: (0, exports.userProfile)("_created_by").default((0, drizzle_orm_1.sql)(templateObject_16 || (templateObject_16 = __makeTemplateObject(["CASE\n    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL"], ["CASE\n    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL"])))),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: (0, exports.customTimestamptz)("_updated_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql)(templateObject_17 || (templateObject_17 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))),
    // System field: Updater (auto-filled, do not modify)
    updatedBy: (0, exports.userProfile)("_updated_by").default((0, drizzle_orm_1.sql)(templateObject_18 || (templateObject_18 = __makeTemplateObject(["CASE\n    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL"], ["CASE\n    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL"])))),
});
exports.diagnosisRecord = (0, pg_core_1.pgTable)("diagnosis_record", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    grade: (0, pg_core_1.varchar)("grade", { length: 50 }).notNull(),
    region: (0, pg_core_1.varchar)("region", { length: 100 }).notNull(),
    /**
     * @type Record<string, number>
     */
    scores: (0, pg_core_1.jsonb)("scores").notNull().default('{}'),
    problemDesc: (0, pg_core_1.text)("problem_desc"),
    report: (0, pg_core_1.text)("report"),
    status: (0, pg_core_1.varchar)("status", { length: 20 }).notNull().default('pending'),
    studentName: (0, pg_core_1.varchar)("student_name", { length: 100 }).notNull(),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: (0, exports.customTimestamptz)("_created_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql)(templateObject_19 || (templateObject_19 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))),
    // System field: Creator (auto-filled, do not modify)
    createdBy: (0, exports.userProfile)("_created_by").default((0, drizzle_orm_1.sql)(templateObject_20 || (templateObject_20 = __makeTemplateObject(["CASE\n    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL"], ["CASE\n    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL"])))),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: (0, exports.customTimestamptz)("_updated_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql)(templateObject_21 || (templateObject_21 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))),
    // System field: Updater (auto-filled, do not modify)
    updatedBy: (0, exports.userProfile)("_updated_by").default((0, drizzle_orm_1.sql)(templateObject_22 || (templateObject_22 = __makeTemplateObject(["CASE\n    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL"], ["CASE\n    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL"])))),
});
// table aliases
exports.admissionPolicyTable = exports.admissionPolicy;
exports.diagnosisRecordTable = exports.diagnosisRecord;
exports.knowledgePointTable = exports.knowledgePoint;
exports.learningSituationDataTable = exports.learningSituationData;
exports.planRecordTable = exports.planRecord;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22;
