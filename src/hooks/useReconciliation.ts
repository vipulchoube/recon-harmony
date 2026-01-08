import { useState, useCallback } from 'react';
import { ReconciliationResult, ExceptionCode, ExceptionRecord, OtherException } from '@/types/recon';
import { toast } from 'sonner';
import { getOpenExceptionRecords } from '@/data/sampleReconciliationData';

export interface ReconciliationState {
  isReconciling: boolean;
  reconciliationResult: ReconciliationResult | null;
  error: string | null;
  progress: {
    currentBatch: number;
    totalBatches: number;
    processedRecords: number;
    totalRecords: number;
  } | null;
}

// Deterministic exception code assignment based on data patterns
function assignExceptionCode(
  ledgerRecord: Record<string, string>,
  statementRecord: Record<string, string> | undefined
): { code: ExceptionCode; description: string } {
  const tradeStatus = ledgerRecord.TradeStatus?.toUpperCase() || '';
  const settlementStatus = ledgerRecord.SettlementStatus?.toUpperCase() || '';
  const isin = ledgerRecord['Security ISIN'] || '';
  const amount = parseInt(ledgerRecord.Amount || '0', 10);
  const openAmount = parseInt(ledgerRecord['Open Amount'] || '0', 10);
  
  // 101: Feed Issue - No matching statement record
  if (!statementRecord) {
    return { code: '101', description: 'Feed Issue - No matching settlement record found in statement' };
  }
  
  const statementState = statementRecord['Settlement State']?.toUpperCase() || '';
  const manualSettlement = statementRecord.ManualSettlement?.toUpperCase() || '';
  const ledgerBalancePool = ledgerRecord.Balance_Pool || '';
  const statementBalancePool = statementRecord.Balance_Pool || '';
  
  // 102: Cancelled Trade - Ledger cancelled but statement shows settled
  if (tradeStatus === 'CANCELLED' && statementState === 'SETTLED') {
    return { code: '102', description: 'Cancelled Trade - Trade cancelled in ledger but settled in statement' };
  }
  
  // 103: Unsettled Trade - Ledger open but statement shows settled
  if (settlementStatus === 'OPEN' && statementState === 'SETTLED') {
    return { code: '103', description: 'Unsettled Trade - Trade open in ledger but shows as settled in statement' };
  }
  
  // 104: Not Settled in Market - Manual settlement with no market settlement
  if (manualSettlement === 'Y' && statementState !== 'SETTLED') {
    return { code: '104', description: 'Not Settled in Market - Manual settlement flagged but not settled in market' };
  }
  
  // 105: Wrong Account - Balance Pool mismatch
  if (ledgerBalancePool && statementBalancePool && ledgerBalancePool !== statementBalancePool) {
    return { code: '105', description: 'Wrong Account - Balance Pool mismatch between ledger and statement' };
  }
  
  // 106: Partial Settlement
  if (settlementStatus === 'PARTIALLY SETTLED' || statementState === 'PARTIALLY SETTLED') {
    return { code: '106', description: 'Partial Settlement - Trade only partially settled' };
  }
  
  // OTHER: Edge cases - empty ISIN, zero amounts with AMEND, amount mismatches
  if (!isin || isin.trim() === '') {
    return { code: 'OTHER', description: 'Data Quality Issue - Missing ISIN' };
  }
  
  if (tradeStatus === 'AMEND' && (amount === 0 || openAmount !== amount)) {
    return { code: 'OTHER', description: 'Amendment Issue - Amended trade with data discrepancy' };
  }
  
  // Fallback OTHER for any remaining edge cases
  return { code: 'OTHER', description: 'Unclassified Exception - Review required' };
}

export function useReconciliation() {
  const [state, setState] = useState<ReconciliationState>({
    isReconciling: false,
    reconciliationResult: null,
    error: null,
    progress: null,
  });

  const runReconciliation = useCallback(async () => {
    setState(prev => ({ 
      ...prev, 
      isReconciling: true, 
      error: null,
      reconciliationResult: null,
      progress: null,
    }));

    try {
      // Add 5 second delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 5000));

      const { ledgerRecords, statementMap } = getOpenExceptionRecords();
      const totalRecords = ledgerRecords.length;

      if (totalRecords === 0) {
        toast.info('No open exceptions to process');
        setState(prev => ({ ...prev, isReconciling: false }));
        return;
      }

      toast.info(`Processing ${totalRecords} exceptions...`);

      // Process all records deterministically
      const exceptionRecords: ExceptionRecord[] = [];
      const otherExceptions: OtherException[] = [];
      const exceptionCounts = new Map<ExceptionCode, number>();

      ledgerRecords.forEach(ledgerRecord => {
        const transactionRef = ledgerRecord.TransactionRef;
        const statementRecord = statementMap.get(transactionRef);
        
        const { code, description } = assignExceptionCode(ledgerRecord, statementRecord);
        
        // Update counts
        exceptionCounts.set(code, (exceptionCounts.get(code) || 0) + 1);
        
        if (code === 'OTHER') {
          otherExceptions.push({
            transaction_ref: transactionRef,
            ledger_swiftref: ledgerRecord.Swiftref || '',
            settlement_swiftref: statementRecord?.Swiftref || '',
            isin: ledgerRecord['Security ISIN'] || '',
            value_date: ledgerRecord.ValueDate || '',
            amount: parseInt(ledgerRecord.Amount || '0', 10),
            quantity: parseInt(ledgerRecord.Quantity || '0', 10),
            ledger_index: 0,
            settlement_index: 0,
            other_subtype: 'DATA_QUALITY',
            other_description: description,
            reason_code: 'OTHER',
          });
        } else {
          exceptionRecords.push({
            transaction_ref: transactionRef,
            ledger_swiftref: ledgerRecord.Swiftref || '',
            settlement_swiftref: statementRecord?.Swiftref || null,
            isin: ledgerRecord['Security ISIN'] || '',
            value_date: ledgerRecord.ValueDate || '',
            amount: parseInt(ledgerRecord.Amount || '0', 10),
            quantity: parseInt(ledgerRecord.Quantity || '0', 10),
            exception_code: code,
            reason_code: code,
            match_status: 'UNMATCHED',
            confidence: 1.0,
          });
        }
      });

      const result: ReconciliationResult = {
        summary: Array.from(exceptionCounts.entries()).map(([code, count]) => ({
          exceptionCode: code,
          exceptionDescription: getExceptionDescription(code),
          count,
        })),
        matching: {
          matchedCount: 0,
          unmatchedCount: totalRecords,
          totalRecords: totalRecords,
          matchedRecords: [],
        },
        exceptions: {
          exceptionCounts: Array.from(exceptionCounts.entries())
            .filter(([code]) => code !== 'OTHER')
            .map(([code, count]) => ({ code, count })),
          records: exceptionRecords,
          otherExceptions: otherExceptions,
        },
        expectedOutput: [],
      };

      setState(prev => ({ 
        ...prev, 
        reconciliationResult: result,
        isReconciling: false,
        progress: {
          currentBatch: 1,
          totalBatches: 1,
          processedRecords: totalRecords,
          totalRecords,
        },
      }));

      toast.success(`Reconciliation completed! Processed ${totalRecords} records.`);

    } catch (error) {
      console.error('Reconciliation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Reconciliation failed';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isReconciling: false,
        progress: null,
      }));
      toast.error('Reconciliation failed', { description: errorMessage });
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isReconciling: false,
      reconciliationResult: null,
      error: null,
      progress: null,
    });
  }, []);

  return { state, runReconciliation, reset };
}

function getExceptionDescription(code: ExceptionCode): string {
  const descriptions: Record<ExceptionCode, string> = {
    '101': 'Feed Issue',
    '102': 'Cancelled Trade',
    '103': 'Unsettled Trade',
    '104': 'Not Settled in Market',
    '105': 'Wrong Account',
    '106': 'Partial Settlement',
    'OTHER': 'Other Exception',
  };
  return descriptions[code] || 'Unknown Exception';
}
