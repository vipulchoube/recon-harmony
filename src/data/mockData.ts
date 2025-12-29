import { Exception, UploadedFile, Reconciliation, CaseStatus } from '@/types/recon';

export const mockExceptions: Exception[] = [
  {
    id: 'EXC-001',
    caseId: 'CASE-2024-001',
    description: 'Trade quantity mismatch on AAPL stock transaction',
    mismatchedFields: [
      { fieldName: 'Quantity', ledgerValue: '1000', statementValue: '1050' },
      { fieldName: 'Settlement Date', ledgerValue: '2024-01-15', statementValue: '2024-01-16' },
    ],
    status: 'open',
    assignee: 'John Smith',
    createdAt: new Date('2024-01-14'),
    comments: [],
  },
  {
    id: 'EXC-002',
    caseId: 'CASE-2024-002',
    description: 'Missing ISIN code for bond transaction',
    mismatchedFields: [
      { fieldName: 'ISIN', ledgerValue: 'US0378331005', statementValue: 'N/A' },
    ],
    status: 'open',
    assignee: 'Sarah Johnson',
    createdAt: new Date('2024-01-13'),
    comments: [],
  },
  {
    id: 'EXC-003',
    caseId: 'CASE-2024-003',
    description: 'Currency conversion rate discrepancy',
    mismatchedFields: [
      { fieldName: 'FX Rate', ledgerValue: '1.0856', statementValue: '1.0892' },
      { fieldName: 'Amount (USD)', ledgerValue: '10856.00', statementValue: '10892.00' },
    ],
    status: 'under_review',
    assignee: 'Mike Chen',
    createdAt: new Date('2024-01-12'),
    comments: [
      {
        id: 'CMT-001',
        author: 'Mike Chen',
        content: 'Investigating rate source discrepancy',
        createdAt: new Date('2024-01-12T10:30:00'),
      },
    ],
  },
  {
    id: 'EXC-004',
    caseId: 'CASE-2024-004',
    description: 'Duplicate transaction entry detected',
    mismatchedFields: [
      { fieldName: 'Transaction ID', ledgerValue: 'TXN-789', statementValue: 'TXN-789-DUP' },
    ],
    status: 'under_review',
    assignee: 'Emily Davis',
    createdAt: new Date('2024-01-11'),
    comments: [],
  },
  {
    id: 'EXC-005',
    caseId: 'CASE-2024-005',
    description: 'Settlement amount variance within threshold',
    mismatchedFields: [
      { fieldName: 'Net Amount', ledgerValue: '50000.00', statementValue: '50000.12' },
    ],
    status: 'resolved',
    assignee: 'John Smith',
    createdAt: new Date('2024-01-10'),
    resolvedAt: new Date('2024-01-11'),
    comments: [
      {
        id: 'CMT-002',
        author: 'John Smith',
        content: 'Variance within acceptable threshold. Marked as resolved.',
        createdAt: new Date('2024-01-11T14:00:00'),
      },
    ],
  },
  {
    id: 'EXC-006',
    caseId: 'CASE-2024-006',
    description: 'Counterparty name mismatch corrected',
    mismatchedFields: [
      { fieldName: 'Counterparty', ledgerValue: 'Goldman Sachs', statementValue: 'GS International' },
    ],
    status: 'resolved',
    assignee: 'Sarah Johnson',
    createdAt: new Date('2024-01-09'),
    resolvedAt: new Date('2024-01-10'),
    comments: [],
  },
];

export const mockUploadedFiles: UploadedFile[] = [
  {
    id: 'FILE-001',
    name: 'Q4_2024_Ledger.csv',
    type: 'ledger',
    uploadedAt: new Date('2024-01-15T09:00:00'),
    status: 'completed',
    progress: 100,
    schema: [
      { columnName: 'TransactionID', dataType: 'STRING', mapped: true },
      { columnName: 'ISIN', dataType: 'STRING', mapped: true },
      { columnName: 'Quantity', dataType: 'INTEGER', mapped: true },
      { columnName: 'Price', dataType: 'DECIMAL', mapped: true },
      { columnName: 'TradeDate', dataType: 'DATE', mapped: true },
      { columnName: 'SettlementDate', dataType: 'DATE', mapped: true },
      { columnName: 'Counterparty', dataType: 'STRING', mapped: true },
      { columnName: 'Currency', dataType: 'STRING', mapped: true },
    ],
    transformationRules: [
      { id: 'TR-001', name: 'Date Normalization', description: 'Convert all dates to ISO 8601 format', applied: true },
      { id: 'TR-002', name: 'Currency Standardization', description: 'Map currency codes to ISO 4217', applied: true },
      { id: 'TR-003', name: 'ISIN Validation', description: 'Validate ISIN format and checksum', applied: true },
    ],
    dataChecks: [
      { id: 'DC-001', name: 'Null Check', passed: true, details: 'No null values in required fields' },
      { id: 'DC-002', name: 'Duplicate Check', passed: true, details: 'No duplicate transaction IDs found' },
      { id: 'DC-003', name: 'ISIN Validation', passed: false, details: '30 records have missing or invalid ISIN' },
    ],
    stats: {
      totalRecords: 1000,
      processedRecords: 970,
      errorRecords: 30,
      errorDetails: ['30 records have missing ISIN codes'],
    },
  },
];

export const mockReconciliations: Reconciliation[] = [
  {
    id: 'RECON-001',
    name: 'Q4 2024 Trade Reconciliation',
    createdAt: new Date('2024-01-15'),
    status: 'active',
  },
];

export function getExceptionsByStatus(status: CaseStatus): Exception[] {
  return mockExceptions.filter((exc) => exc.status === status);
}
