/* 前后端共享的类型写在这里 */

/* ===== Announcement 公告模块 ===== */
export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface AnnouncementListResponse {
  items: Announcement[];
}

/* ===== Diagnosis 学情诊断模块 ===== */
export type DiagnosisStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface DiagnosisRecord {
  id: string;
  studentName: string;
  grade: string;
  region: string;
  scores: Record<string, number>;
  problemDesc: string;
  report: string | null;
  status: DiagnosisStatus;
  createdAt: string;
}

export interface DiagnosisRecordListItem {
  id: string;
  studentName: string;
  grade: string;
  region: string;
  status: DiagnosisStatus;
  createdAt: string;
}

export interface CreateDiagnosisRequest {
  studentName: string;
  grade: string;
  region: string;
  scores: Record<string, number>;
  problemDesc: string;
}

export interface UpdateDiagnosisRequest {
  report?: string;
  status: DiagnosisStatus;
}

export interface DiagnosisListResponse {
  items: DiagnosisRecordListItem[];
  total: number;
}

export interface DiagnosisCreateResponse {
  id: string;
  status: DiagnosisStatus;
}

export interface DiagnosisUpdateResponse {
  success: boolean;
}

/* ===== Plan 升学规划模块 ===== */
export type PlanStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface TimelineNode {
  date: string;
  title: string;
  content: string;
}

export interface PlanRecord {
  id: string;
  region: string;
  scores: Record<string, number>;
  policyData: Record<string, unknown> | null;
  planReport: string | null;
  timeline: TimelineNode[] | null;
  status: PlanStatus;
  createdAt: string;
}

export interface CreatePlanRequest {
  region: string;
  scores: Record<string, number>;
}

export interface UpdatePlanRequest {
  planReport?: string;
  timeline?: TimelineNode[];
  status: PlanStatus;
}

export interface PlanCreateResponse {
  id: string;
  status: PlanStatus;
}

export interface PlanUpdateResponse {
  success: boolean;
}

/* ===== Policy 升学政策模块 ===== */
export interface AdmissionLine {
  batch: string;
  school: string;
  score: number;
  rate?: string;
}

export interface AdmissionPolicy {
  id: string;
  region: string;
  year: number;
  totalScore: number;
  scoreStructure: Record<string, number>;
  admissionLines: AdmissionLine[];
  policyContent: string;
}

export interface AdmissionPolicyListResponse {
  items: AdmissionPolicy[];
}

/* ===== Knowledge 知识点查询模块 ===== */
export interface KnowledgePointContent {
  coreKnowledge: string;
  solutionMethods: string;
  commonMistakes: string;
}

export interface KnowledgePoint {
  id: string;
  version: string;
  subject: string;
  chapter: string;
  name: string;
  content: KnowledgePointContent;
}

export interface KnowledgePointListItem {
  id: string;
  version: string;
  subject: string;
  chapter: string;
  name: string;
}

export interface KnowledgePointListResponse {
  items: KnowledgePointListItem[];
  total: number;
}

export interface KnowledgePointSearchResponse {
  items: KnowledgePointListItem[];
  total: number;
}

export interface ChapterUnit {
  chapter: string;
  subject: string;
  count: number;
}

export interface ChapterListResponse {
  items: ChapterUnit[];
}
