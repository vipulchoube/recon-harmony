import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ReconciliationResult, ExceptionCode } from '@/types/recon';
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

// Merge multiple reconciliation results into one
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
  const exceptionCountsMap = new Map<ExceptionCode, number>();

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

    // Merge exceptions
    if (result.exceptions) {
      (result.exceptions.exceptionCounts || []).forEach(ec => {
        const code = ec.code as ExceptionCode;
        const existing = exceptionCountsMap.get(code) || 0;
        exceptionCountsMap.set(code, existing + ec.count);
      });
      merged.exceptions.records.push(...(result.exceptions.records || []));
      merged.exceptions.otherExceptions.push(...(result.exceptions.otherExceptions || []));
    }

    // Merge expectedOutput
    merged.expectedOutput.push(...(result.expectedOutput || []));
  });

  merged.summary = Array.from(summaryMap.values());
  merged.exceptions.exceptionCounts = Array.from(exceptionCountsMap.entries()).map(([code, count]) => ({ code, count }));

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
