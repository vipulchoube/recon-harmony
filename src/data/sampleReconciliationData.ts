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

// Batch size for AI processing
export const BATCH_SIZE = 30;

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
    
    const isException = 
      tradeStatus === 'CANCELLED' ||
      settlementStatus === 'OPEN' ||
      settlementStatus === 'PARTIALLY SETTLED' ||
      !statementRecord;
    
    if (isException) {
      openLedgerRecords.push(ledgerRecord);
    }
  });
  
  return { ledgerRecords: openLedgerRecords, statementRecords, statementMap };
}

// Convert a batch of records to CSV
export function recordsToCSV(
  ledgerRecords: Record<string, string>[], 
  statementMap: Map<string, Record<string, string>>
): { ledgerCSV: string; statementCSV: string } {
  if (ledgerRecords.length === 0) {
    return { ledgerCSV: '', statementCSV: '' };
  }
  
  const ledgerHeaders = Object.keys(ledgerRecords[0]);
  const transactionRefs = new Set(ledgerRecords.map(r => r.TransactionRef));
  
  // Get matching statement records
  const matchingStatementRecords: Record<string, string>[] = [];
  transactionRefs.forEach(ref => {
    const record = statementMap.get(ref);
    if (record) matchingStatementRecords.push(record);
  });
  
  const ledgerCSV = [
    ledgerHeaders.join(','),
    ...ledgerRecords.map(row => ledgerHeaders.map(h => row[h] || '').join(','))
  ].join('\n');
  
  const statementHeaders = matchingStatementRecords.length > 0 
    ? Object.keys(matchingStatementRecords[0]) 
    : [];
  
  const statementCSV = statementHeaders.length > 0 ? [
    statementHeaders.join(','),
    ...matchingStatementRecords.map(row => statementHeaders.map(h => row[h] || '').join(','))
  ].join('\n') : '';
  
  return { ledgerCSV, statementCSV };
}

// Split records into batches
export function getBatches<T>(records: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < records.length; i += batchSize) {
    batches.push(records.slice(i, i + batchSize));
  }
  return batches;
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
  
  // Find matches and exceptions based on business rules:
  // - CANCELLED trades are exceptions (no settlement expected)
  // - OPEN settlement status means not yet settled - exception
  // - PARTIALLY SETTLED means partial match - exception
  // - SwiftRef mismatch (different prefix CP vs AP but same suffix) - may still match
  // - Records not in statement - exception
  const openExceptionRecords: OpenExceptionRecord[] = [];
  let autoMatched = 0;
  
  ledgerRecords.forEach(ledgerRecord => {
    const transactionRef = ledgerRecord.TransactionRef;
    const statementRecord = statementMap.get(transactionRef);
    const tradeStatus = ledgerRecord.TradeStatus?.toUpperCase() || '';
    const settlementStatus = ledgerRecord.SettlementStatus?.toUpperCase() || '';
    
    // CANCELLED trades are exceptions - they won't settle
    if (tradeStatus === 'CANCELLED') {
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
      return;
    }
    
    // OPEN settlement status - not yet settled
    if (settlementStatus === 'OPEN') {
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
      return;
    }
    
    // PARTIALLY SETTLED - partial exception
    if (settlementStatus === 'PARTIALLY SETTLED') {
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
      return;
    }
    
    // Check if record exists in statement
    if (!statementRecord) {
      openExceptionRecords.push({
        transactionRef,
        ledgerSwiftRef: ledgerRecord.Swiftref || '',
        settlementSwiftRef: '',
        isin: ledgerRecord['Security ISIN'] || '',
        valueDate: ledgerRecord.ValueDate || '',
        exceptionCode: '',
        reasonCode: '',
        assignedTo: '',
      });
      return;
    }
    
    // SETTLED with matching record in statement - auto-matched
    autoMatched++;
  });
  
  return {
    totalRecords,
    autoMatched,
    openExceptions: openExceptionRecords.length,
    aiIdentifiedExceptions: 0,
    openExceptionRecords,
  };
}
