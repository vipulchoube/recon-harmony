// Import actual CSV data files
import sampleLedgerCSV from './Sample_Ledger_v2.csv?raw';
import sampleStatementCSV from './Sample_Statement_v2.csv?raw';

// Export the actual CSV data from files
export const sampleLedgerData = sampleLedgerCSV;
export const sampleStatementData = sampleStatementCSV;

// Helper function to parse CSV data
export function parseCSV(csvString: string): Record<string, string>[] {
  const lines = csvString.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index]?.trim() || '';
    });
    return record;
  });
}

// Get all open exception records (parsed, not CSV)
export function getOpenExceptionRecords(): { 
  ledgerRecords: Record<string, string>[]; 
  statementRecords: Record<string, string>[];
  statementMap: Map<string, Record<string, string>>;
} {
  const ledgerRecords = parseCSV(sampleLedgerData);
  const statementRecords = parseCSV(sampleStatementData);
  
  // Create a map of statement records by TransactionRef
  const statementMap = new Map<string, Record<string, string>>();
  statementRecords.forEach(record => {
    statementMap.set(record.TransactionRef, record);
  });
  
  // Find open exception ledger records
  const openLedgerRecords: Record<string, string>[] = [];
  
  ledgerRecords.forEach(ledgerRecord => {
    const transactionRef = ledgerRecord.TransactionRef;
    const statementRecord = statementMap.get(transactionRef);
    const tradeStatus = ledgerRecord.TradeStatus?.toUpperCase() || '';
    const settlementStatus = ledgerRecord.SettlementStatus?.toUpperCase() || '';
    const isin = ledgerRecord['Security ISIN'] || '';
    const amount = parseInt(ledgerRecord.Amount || '0', 10);
    const openAmount = parseInt(ledgerRecord['Open Amount'] || '0', 10);
    
    // Check for various exception conditions
    const isCancelled = tradeStatus === 'CANCELLED';
    const isOpen = settlementStatus === 'OPEN';
    const isPartiallySettled = settlementStatus === 'PARTIALLY SETTLED';
    const isMissingInStatement = !statementRecord;
    const isAmendWithDiscrepancy = tradeStatus === 'AMEND' && (amount === 0 || openAmount !== amount);
    const isMissingIsin = !isin || isin.trim() === '';
    
    // Check for Balance Pool mismatch
    let hasBalancePoolMismatch = false;
    if (statementRecord) {
      const ledgerBalancePool = ledgerRecord.Balance_Pool || '';
      const statementBalancePool = statementRecord.Balance_Pool || '';
      hasBalancePoolMismatch = ledgerBalancePool !== statementBalancePool;
    }
    
    // Check for manual settlement not settled in market
    let isManualNotSettled = false;
    if (statementRecord) {
      const manualSettlement = statementRecord.ManualSettlement?.toUpperCase() || '';
      const statementState = statementRecord['Settlement State']?.toUpperCase() || '';
      isManualNotSettled = manualSettlement === 'Y' && statementState !== 'SETTLED';
    }
    
    const isException = 
      isCancelled ||
      isOpen ||
      isPartiallySettled ||
      isMissingInStatement ||
      hasBalancePoolMismatch ||
      isManualNotSettled ||
      isAmendWithDiscrepancy ||
      isMissingIsin;
    
    if (isException) {
      openLedgerRecords.push(ledgerRecord);
    }
  });
  
  return { ledgerRecords: openLedgerRecords, statementRecords, statementMap };
}

// Pre-compute initial reconciliation stats (before AI analysis)
export interface PreReconciliationStats {
  totalRecords: number;
  autoMatched: number;
  openExceptions: number;
  aiIdentifiedExceptions: number;
  openExceptionRecords: OpenExceptionRecord[];
}

export interface OpenExceptionRecord {
  transactionRef: string;
  ledgerSwiftRef: string;
  settlementSwiftRef: string;
  isin: string;
  valueDate: string;
  exceptionCode: string;
  reasonCode: string;
  assignedTo: string;
}

export function computePreReconciliationStats(): PreReconciliationStats {
  const ledgerRecords = parseCSV(sampleLedgerData);
  const statementRecords = parseCSV(sampleStatementData);
  
  const totalRecords = ledgerRecords.length;
  
  // Create a map of statement records by TransactionRef
  const statementMap = new Map<string, Record<string, string>>();
  statementRecords.forEach(record => {
    statementMap.set(record.TransactionRef, record);
  });
  
  const openExceptionRecords: OpenExceptionRecord[] = [];
  let autoMatched = 0;
  
  ledgerRecords.forEach(ledgerRecord => {
    const transactionRef = ledgerRecord.TransactionRef;
    const statementRecord = statementMap.get(transactionRef);
    const tradeStatus = ledgerRecord.TradeStatus?.toUpperCase() || '';
    const settlementStatus = ledgerRecord.SettlementStatus?.toUpperCase() || '';
    const isin = ledgerRecord['Security ISIN'] || '';
    const amount = parseInt(ledgerRecord.Amount || '0', 10);
    const openAmount = parseInt(ledgerRecord['Open Amount'] || '0', 10);
    
    // Check for various exception conditions
    const isCancelled = tradeStatus === 'CANCELLED';
    const isOpen = settlementStatus === 'OPEN';
    const isPartiallySettled = settlementStatus === 'PARTIALLY SETTLED';
    const isMissingInStatement = !statementRecord;
    const isAmendWithDiscrepancy = tradeStatus === 'AMEND' && (amount === 0 || openAmount !== amount);
    const isMissingIsin = !isin || isin.trim() === '';
    
    // Check for Balance Pool mismatch
    let hasBalancePoolMismatch = false;
    if (statementRecord) {
      const ledgerBalancePool = ledgerRecord.Balance_Pool || '';
      const statementBalancePool = statementRecord.Balance_Pool || '';
      hasBalancePoolMismatch = ledgerBalancePool !== statementBalancePool;
    }
    
    // Check for manual settlement not settled in market
    let isManualNotSettled = false;
    if (statementRecord) {
      const manualSettlement = statementRecord.ManualSettlement?.toUpperCase() || '';
      const statementState = statementRecord['Settlement State']?.toUpperCase() || '';
      isManualNotSettled = manualSettlement === 'Y' && statementState !== 'SETTLED';
    }
    
    const isException = 
      isCancelled ||
      isOpen ||
      isPartiallySettled ||
      isMissingInStatement ||
      hasBalancePoolMismatch ||
      isManualNotSettled ||
      isAmendWithDiscrepancy ||
      isMissingIsin;
    
    if (isException) {
      openExceptionRecords.push({
        transactionRef,
        ledgerSwiftRef: ledgerRecord.Swiftref || '',
        settlementSwiftRef: statementRecord?.Swiftref || '',
        isin: ledgerRecord['Security ISIN'] || '',
        valueDate: ledgerRecord.ValueDate || '',
        exceptionCode: '',
        reasonCode: '',
        assignedTo: '',
      });
    } else {
      autoMatched++;
    }
  });
  
  console.log('[Pre-Recon Stats]', {
    totalRecords,
    autoMatched,
    openExceptions: openExceptionRecords.length,
    statementRecordsCount: statementRecords.length,
  });

  return {
    totalRecords,
    autoMatched,
    openExceptions: openExceptionRecords.length,
    aiIdentifiedExceptions: 0,
    openExceptionRecords,
  };
}
