import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  DataQualityResult, 
  SchemaAnalysisResult, 
  ETLScriptResult 
} from '@/types/recon';
import { toast } from 'sonner';

export interface AgentState {
  isAnalyzing: boolean;
  currentStep: 'idle' | 'data_quality' | 'schema_analysis' | 'generate_etl' | 'complete';
  dataQuality: DataQualityResult | null;
  schemaAnalysis: SchemaAnalysisResult | null;
  etlScript: ETLScriptResult | null;
  error: string | null;
}

export function useDataAgent() {
  const [state, setState] = useState<AgentState>({
    isAnalyzing: false,
    currentStep: 'idle',
    dataQuality: null,
    schemaAnalysis: null,
    etlScript: null,
    error: null,
  });

  const runAnalysis = async (ledgerData: string, statementData: string) => {
    setState(prev => ({ 
      ...prev, 
      isAnalyzing: true, 
      currentStep: 'data_quality',
      error: null,
      dataQuality: null,
      schemaAnalysis: null,
      etlScript: null,
    }));

    try {
      // Step 1: Data Quality Checks
      toast.info('Agent: Running data quality checks...');
      const qualityResponse = await supabase.functions.invoke('analyze-data', {
        body: { ledgerData, statementData, analysisType: 'data_quality' }
      });

      if (qualityResponse.error) {
        throw new Error(qualityResponse.error.message || 'Data quality analysis failed');
      }

      const qualityResult = qualityResponse.data?.result as DataQualityResult;
      setState(prev => ({ 
        ...prev, 
        dataQuality: qualityResult,
        currentStep: 'schema_analysis' 
      }));
      toast.success('Data quality checks completed');

      // Step 2: Schema Analysis
      toast.info('Agent: Analyzing schema and detecting mismatches...');
      const schemaResponse = await supabase.functions.invoke('analyze-data', {
        body: { ledgerData, statementData, analysisType: 'schema_analysis' }
      });

      if (schemaResponse.error) {
        throw new Error(schemaResponse.error.message || 'Schema analysis failed');
      }

      const schemaResult = schemaResponse.data?.result as SchemaAnalysisResult;
      setState(prev => ({ 
        ...prev, 
        schemaAnalysis: schemaResult,
        currentStep: 'generate_etl' 
      }));
      toast.success('Schema analysis completed');

      // Step 3: Generate ETL Script
      toast.info('Agent: Generating Oracle ETL script...');
      const etlResponse = await supabase.functions.invoke('analyze-data', {
        body: { ledgerData, statementData, analysisType: 'generate_etl' }
      });

      if (etlResponse.error) {
        throw new Error(etlResponse.error.message || 'ETL script generation failed');
      }

      const etlResult = etlResponse.data?.result as ETLScriptResult;
      setState(prev => ({ 
        ...prev, 
        etlScript: etlResult,
        currentStep: 'complete',
        isAnalyzing: false 
      }));
      toast.success('Oracle ETL script generated successfully!');

    } catch (error) {
      console.error('Agent analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isAnalyzing: false,
        currentStep: 'idle'
      }));
      toast.error('Agent analysis failed', { description: errorMessage });
    }
  };

  const reset = () => {
    setState({
      isAnalyzing: false,
      currentStep: 'idle',
      dataQuality: null,
      schemaAnalysis: null,
      etlScript: null,
      error: null,
    });
  };

  return { state, runAnalysis, reset };
}
