export type UserRole = 'recon' | 'ops' | 'admin';

export type CaseStatus = 'open' | 'under_review' | 'resolved';

export interface Exception {
  id: string;
  caseId: string;
  description: string;
  mismatchedFields: MismatchedField[];
  status: CaseStatus;
  assignee: string;
  createdAt: Date;
  resolvedAt?: Date;
  comments: Comment[];
}

export interface MismatchedField {
  fieldName: string;
  ledgerValue: string;
  statementValue: string;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: 'ledger' | 'statement';
  uploadedAt: Date;
  status: 'processing' | 'completed' | 'failed' | 'analyzing';
  progress: number;
  rawData?: string;
  schema?: SchemaMapping[];
  transformationRules?: TransformationRule[];
  dataChecks?: DataCheck[];
  stats?: FileStats;
}

export interface SchemaMapping {
  columnName: string;
  dataType: string;
  mapped: boolean;
  inferredType?: string;
  nullable?: boolean;
  issues?: string[];
}

export interface TransformationRule {
  id: string;
  name: string;
  description: string;
  applied: boolean;
}

export interface DataCheck {
  id: string;
  name: string;
  passed: boolean;
  details: string;
  severity?: 'error' | 'warning' | 'info';
  affectedRows?: number;
  recommendation?: string;
}

export interface FileStats {
  totalRecords: number;
  processedRecords: number;
  errorRecords: number;
  errorDetails: string[];
}

export interface Reconciliation {
  id: string;
  name: string;
  createdAt: Date;
  status: 'active' | 'paused' | 'completed';
  ledgerFile?: UploadedFile;
  statementFile?: UploadedFile;
}

// Agent Analysis Types
export interface AgentAnalysisResult {
  dataQuality?: DataQualityResult;
  schemaAnalysis?: SchemaAnalysisResult;
  etlScript?: ETLScriptResult;
}

export interface DataQualityResult {
  checks: DataCheck[];
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    criticalIssues: number;
  };
}

export interface SchemaAnalysisResult {
  ledgerSchema: SchemaColumn[];
  statementSchema: SchemaColumn[];
  mappings: ColumnMapping[];
  schemaCorrections: SchemaCorrection[];
}

export interface SchemaColumn {
  columnName: string;
  inferredType: string;
  nullable: boolean;
  sampleValues: string[];
  issues: string[];
}

export interface ColumnMapping {
  ledgerColumn: string;
  statementColumn: string;
  matchConfidence: number;
  transformationNeeded: boolean;
  transformationRule?: string;
}

export interface SchemaCorrection {
  file: 'ledger' | 'statement';
  column: string;
  currentValue: string;
  suggestedValue: string;
  reason: string;
}

export interface ETLScriptResult {
  script: string;
  tables: ETLTable[];
  procedures: ETLProcedure[];
  executionOrder: string[];
}

export interface ETLTable {
  name: string;
  purpose: string;
  columns: { name: string; type: string; nullable: boolean }[];
}

export interface ETLProcedure {
  name: string;
  purpose: string;
  parameters: string[];
}
