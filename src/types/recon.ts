export type UserRole = 'recon' | 'ops' | 'admin' | 'recon_lead';

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
  reconciliationResult?: ReconciliationResult;
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
  script?: string;
  tables?: ETLTable[];
  procedures?: ETLProcedure[];
  executionOrder?: string[];
  rawResponse?: string; // Fallback for unparsed content
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

// Exception Codes based on trade break categories
export type ExceptionCode = '101' | '102' | '103' | '104' | '105' | '106' | 'OTHER';

export interface ExceptionDefinition {
  code: ExceptionCode;
  category: string;
  description: string;
  autoMatchingCriteria: string;
  note: string;
}

export const EXCEPTION_DEFINITIONS: ExceptionDefinition[] = [
  {
    code: '101',
    category: 'Feed Issue',
    description: 'Detect trades where the settlement feed is missing or delayed, resulting in no corresponding record in the market/custodian system',
    autoMatchingCriteria: 'Trade_Date + SWIFTRef + TransactionRef',
    note: 'If no matching record exists in Settlement File, flag as Feed Issue'
  },
  {
    code: '102',
    category: 'Cancelled Trade',
    description: 'Identify lifecycle mismatches where internal system shows a trade as cancelled, but external market/custodian shows it as settled',
    autoMatchingCriteria: 'Ledger.Trade_Status = CANCELLED AND Settlement.Settlement_State = SETTLED',
    note: 'Lifecycle mismatch is always flagged'
  },
  {
    code: '103',
    category: 'Unsettled Trade',
    description: 'Detect trades that are open internally but already settled in the market, indicating missing internal updates',
    autoMatchingCriteria: 'Ledger.Trade_Status = OPEN AND Settlement.Settlement_State = SETTLED',
    note: 'Thresholds / Tolerances: None'
  },
  {
    code: '104',
    category: 'Not Settled in Market but Closed Internally',
    description: 'Identify trades manually marked as settled internally but not reflected in the market, indicating forced closure errors',
    autoMatchingCriteria: 'Ledger.Status = MANUAL_SETTLED AND Settlement.Status = !SETTLED',
    note: 'Thresholds / Tolerances: None'
  },
  {
    code: '105',
    category: 'Booked to Wrong Account',
    description: 'Detect trades where internal ledger entry is recorded against an incorrect account',
    autoMatchingCriteria: 'Match by Transaction_Ref, SwiftRef, Quantity, Amount, ValueDate but BalancePool mismatch or TradeType/Direction mismatch',
    note: 'Thresholds / Tolerances: None'
  },
  {
    code: '106',
    category: 'Partial Settlement',
    description: 'Identify trades where only a portion of the quantity is settled, leaving an outstanding balance',
    autoMatchingCriteria: 'Ledger.Settled_Quantity > Settlement.Settled_Quantity',
    note: 'Thresholds / Tolerances: None'
  }
];

// Reconciliation Result Types
export interface ReconciliationResult {
  summary: ExceptionSummary[];
  matching: MatchingResult;
  exceptions: ExceptionResult;
  expectedOutput: ExpectedOutputRow[];
}

export interface ExceptionSummary {
  exceptionCode: ExceptionCode;
  exceptionDescription: string;
  count: number;
}

export interface MatchingResult {
  matchedCount: number;
  unmatchedCount: number;
  totalRecords: number;
  matchedRecords: MatchedRecord[];
}

export interface MatchedRecord {
  exception_code: ExceptionCode;
  reason_code: string;
  match_status: 'MATCHED' | 'UNMATCHED';
  confidence: number;
  transaction_ref: string;
  ledger_swiftref: string;
  settlement_swiftref: string | null;
  isin: string;
  quantity: number;
  amount: number;
  value_date: string;
}

export interface ExceptionResult {
  exceptionCounts: { code: ExceptionCode; count: number }[];
  records: ExceptionRecord[];
  otherExceptions: OtherException[];
}

export interface ExceptionRecord {
  exception_code: ExceptionCode;
  reason_code: string;
  match_status: 'MATCHED' | 'UNMATCHED';
  confidence: number;
  transaction_ref: string;
  ledger_swiftref: string;
  settlement_swiftref: string | null;
  isin: string;
  quantity: number;
  amount: number;
  value_date: string;
}

export interface OtherException {
  transaction_ref: string;
  ledger_index: number;
  settlement_index: number | null;
  other_subtype: string;
  other_description: string;
  reason_code: string;
  ledger_swiftref?: string;
  settlement_swiftref?: string;
  isin?: string;
  value_date?: string;
  amount?: number;
  quantity?: number;
}

export interface ExpectedOutputRow {
  department: string | null;
  balance_pool: string | null;
  security_isin: string;
  ledger_or_statement_break: 'L' | 'S';
  direction: string;
  quantity: number;
  amount: number;
  currency: string;
  value_date: string;
  our_settlement_ref: string;
  reason_code: string;
}
