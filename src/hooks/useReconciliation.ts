import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ReconciliationResult, ExceptionCode, ExceptionRecord, OtherException } from '@/types/recon';
import { toast } from 'sonner';
import { getOpenExceptionRecords, recordsToCSV, getBatches, BATCH_SIZE } from '@/data/sampleReconciliationData';

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

// Merge multiple reconciliation results into one, with deduplication
function mergeResults(results: ReconciliationResult[]): ReconciliationResult {
  const merged: ReconciliationResult = {
    summary: [],
    matching: {
      matchedCount: 0,
      unmatchedCount: 0,
      totalRecords: 0,
      matchedRecords: [],
    },
    exceptions: {
      exceptionCounts: [],
      records: [],
      otherExceptions: [],
    },
    expectedOutput: [],
  };

  const summaryMap = new Map<ExceptionCode, { exceptionCode: ExceptionCode; exceptionDescription: string; count: number }>();
  
  // Deduplication maps using transaction_ref as key
  const seenRecords = new Map<string, ExceptionRecord>();
  const seenOtherExceptions = new Map<string, OtherException>();

  results.forEach(result => {
    // Merge summary
    (result.summary || []).forEach(item => {
      const code = item.exceptionCode as ExceptionCode;
      const existing = summaryMap.get(code);
      if (existing) {
        existing.count += item.count;
      } else {
        summaryMap.set(code, { exceptionCode: code, exceptionDescription: item.exceptionDescription, count: item.count });
      }
    });

    // Merge matching
    if (result.matching) {
      merged.matching.matchedCount += result.matching.matchedCount || 0;
      merged.matching.unmatchedCount += result.matching.unmatchedCount || 0;
      merged.matching.totalRecords += result.matching.totalRecords || 0;
      merged.matching.matchedRecords.push(...(result.matching.matchedRecords || []));
    }

    // Merge exceptions WITH DEDUPLICATION by transaction_ref
    if (result.exceptions) {
      (result.exceptions.records || []).forEach(record => {
        const key = record.transaction_ref;
        if (key && !seenRecords.has(key)) {
          seenRecords.set(key, record);
        }
      });
      
      (result.exceptions.otherExceptions || []).forEach(other => {
        const key = other.transaction_ref;
        if (key && !seenOtherExceptions.has(key)) {
          seenOtherExceptions.set(key, other);
        }
      });
    }

    // Merge expectedOutput
    merged.expectedOutput.push(...(result.expectedOutput || []));
  });

  merged.summary = Array.from(summaryMap.values());
  
  // Cross-deduplicate: remove records from seenRecords if they exist in otherExceptions
  // This ensures a transaction_ref appears in ONLY ONE of the two arrays
  const validCodes = ['101', '102', '103', '104', '105', '106'] as const;
  
  // Convert deduplicated maps back to arrays, filtering out duplicates
  merged.exceptions.records = Array.from(seenRecords.values())
    .filter(record => {
      // If this record exists in otherExceptions, don't include it in records
      if (seenOtherExceptions.has(record.transaction_ref)) {
        return false;
      }
      // Only keep records with valid 101-106 codes
      return validCodes.includes(record.exception_code as any);
    });
  merged.exceptions.otherExceptions = Array.from(seenOtherExceptions.values());
  
  // Recalculate exceptionCounts from deduplicated records
  const recountMap = new Map<ExceptionCode, number>();
  merged.exceptions.records.forEach(r => {
    const code = r.exception_code as ExceptionCode;
    if (validCodes.includes(code as any)) {
      recountMap.set(code, (recountMap.get(code) || 0) + 1);
    }
  });
  merged.exceptions.exceptionCounts = Array.from(recountMap.entries())
    .map(([code, count]) => ({ code, count }));

  return merged;
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
      const { ledgerRecords, statementMap } = getOpenExceptionRecords();
      const batches = getBatches(ledgerRecords, BATCH_SIZE);
      const totalRecords = ledgerRecords.length;
      const totalBatches = batches.length;

      if (totalBatches === 0) {
        toast.info('No open exceptions to process');
        setState(prev => ({ ...prev, isReconciling: false }));
        return;
      }

      toast.info(`Processing ${totalRecords} exceptions in ${totalBatches} batches...`);

      const results: ReconciliationResult[] = [];
      let processedRecords = 0;

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const { ledgerCSV, statementCSV } = recordsToCSV(batch, statementMap);

        setState(prev => ({
          ...prev,
          progress: {
            currentBatch: i + 1,
            totalBatches,
            processedRecords,
            totalRecords,
          },
        }));

        const reconResponse = await supabase.functions.invoke('analyze-data', {
          body: { ledgerData: ledgerCSV, statementData: statementCSV, analysisType: 'reconciliation' }
        });

        if (reconResponse.error) {
          console.error(`Batch ${i + 1} error:`, reconResponse.error);
          // Continue with other batches even if one fails
          continue;
        }

        const batchResult = reconResponse.data?.result as ReconciliationResult & { parseError?: string };
        if (batchResult && !batchResult.parseError) {
          results.push(batchResult);
        }

        processedRecords += batch.length;
      }

      if (results.length === 0) {
        throw new Error('All batches failed to process');
      }

      const mergedResult = mergeResults(results);

      setState(prev => ({ 
        ...prev, 
        reconciliationResult: mergedResult,
        isReconciling: false,
        progress: {
          currentBatch: totalBatches,
          totalBatches,
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
