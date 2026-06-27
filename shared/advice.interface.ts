export type AdviceStageSlug = 'elementary' | 'middle' | 'high';

export type SourceType = '官方' | '学校' | '内部测评' | '用户填写' | '历史记录' | 'AI推断';
export type AdviceRole = 'sales' | 'parent';
export type RiskLevel = 'low' | 'medium' | 'high';
export type AdviceSourceFilter = 'all' | 'official' | 'internal';

export interface AdviceDataSourceMeta {
  source_name: string;
  source_type: SourceType;
  region: string;
  grade: string;
  updated_at: string;
  confidence: number;
  limitation: string;
  need_confirm: boolean;
}

export interface StudentSnapshot {
  stageSlug: AdviceStageSlug;
  stageLabel: string;
  grade: string;
  region: string;
  school: string;
  schoolType?: string;
  currentScoreText: string;
  currentTotalScore: number;
  targetSchool: string;
  targetScore?: number;
  targetMajor?: string;
  rankText?: string;
  trendText?: string;
  weakSubjects: string;
  strongSubjects: string;
  parentGoal?: string;
  careerIntent?: string;
}

export interface DiagnosisProblemItem {
  title: string;
  symptom: string;
  reason: string;
  impact: string;
  urgency: '高' | '中' | '低';
  solution: string;
}

export interface DiagnosisRiskItem {
  title: string;
  level: RiskLevel;
  detail: string;
}

export interface DiagnosisOpportunityItem {
  title: string;
  detail: string;
  product_mapping: string[];
}

export interface StructuredDiagnosis {
  levelLabel: '薄弱' | '中等' | '中上' | '优秀' | '冲刺名校';
  regionPosition: string;
  targetGap: {
    scoreGap: number | null;
    rankGap: string;
    abilityGap: string;
  };
  coreProblems: DiagnosisProblemItem[];
  risks: DiagnosisRiskItem[];
  opportunities: DiagnosisOpportunityItem[];
}

export interface AdviceScriptTemplate {
  scene: string;
  user_role: AdviceRole;
  intent: string;
  input_required: string[];
  script: string;
  fallback_script: string;
  forbidden_words: string[];
  product_mapping: string[];
  next_action: string;
}

export interface ParentSection {
  title: string;
  content: string;
}
