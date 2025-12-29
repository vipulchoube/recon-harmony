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
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  schema?: SchemaMapping[];
  transformationRules?: TransformationRule[];
  dataChecks?: DataCheck[];
  stats?: FileStats;
}

export interface SchemaMapping {
  columnName: string;
  dataType: string;
  mapped: boolean;
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
