import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ReconciliationResult } from '@/types/recon';
import { toast } from 'sonner';

export interface ReconciliationState {
  isReconciling: boolean;
  reconciliationResult: ReconciliationResult | null;
  error: string | null;
}

export function useReconciliation() {
  const [state, setState] = useState<ReconciliationState>({
    isReconciling: false,
    reconciliationResult: null,
    error: null,
  });

  const runReconciliation = async (ledgerData: string, statementData: string) => {
    setState(prev => ({ 
      ...prev, 
      isReconciling: true, 
      error: null,
      reconciliationResult: null,
    }));

    try {
      toast.info('Starting reconciliation process...');
      
      const reconResponse = await supabase.functions.invoke('analyze-data', {
        body: { ledgerData, statementData, analysisType: 'reconciliation' }
      });

      if (reconResponse.error) {
        throw new Error(reconResponse.error.message || 'Reconciliation failed');
      }

      const reconResult = reconResponse.data?.result as ReconciliationResult;
      setState(prev => ({ 
        ...prev, 
        reconciliationResult: reconResult,
        isReconciling: false 
      }));
      toast.success('Reconciliation completed successfully!');

    } catch (error) {
      console.error('Reconciliation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Reconciliation failed';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isReconciling: false,
      }));
      toast.error('Reconciliation failed', { description: errorMessage });
    }
  };

  const reset = () => {
    setState({
      isReconciling: false,
      reconciliationResult: null,
      error: null,
    });
  };

  return { state, runReconciliation, reset };
}
