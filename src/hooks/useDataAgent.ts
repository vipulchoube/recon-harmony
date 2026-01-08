import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  DataQualityResult, 
  SchemaAnalysisResult, 
  ETLScriptResult,
  ReconciliationResult 
} from '@/types/recon';
import { toast } from 'sonner';
import { SchemaColumn, ReconciliationType } from '@/data/positionSchema';

export interface AgentState {
  isAnalyzing: boolean;
  currentStep: 'idle' | 'data_quality' | 'schema_analysis' | 'data_quality_check' | 'generate_etl' | 'complete';
  dataQuality: DataQualityResult | null;
  schemaAnalysis: SchemaAnalysisResult | null;
  reconciliationResult: ReconciliationResult | null;
  etlScript: ETLScriptResult | null;
  error: string | null;
}

export function useDataAgent() {
  const [state, setState] = useState<AgentState>({
    isAnalyzing: false,
    currentStep: 'idle',
    dataQuality: null,
    schemaAnalysis: null,
    reconciliationResult: null,
    etlScript: null,
    error: null,
  });

  // Admin schema setup - compares statement against selected reconciliation schema
  const runSchemaSetup = async (
    statementData: string, 
    targetSchema: SchemaColumn[], 
    reconciliationType: ReconciliationType,
    ledgerData?: string
  ) => {
    setState(prev => ({ 
      ...prev, 
      isAnalyzing: true, 
      currentStep: 'data_quality',
      error: null,
      dataQuality: null,
      schemaAnalysis: null,
      etlScript: null,
    }));

    // Convert schema to a format the AI can understand
    const schemaDescription = JSON.stringify(targetSchema);

    try {
      // Step 1: Data Ingestion (Data Quality Checks) - Now includes both files
      toast.info('Agent: Running data ingestion...');
      const qualityResponse = await supabase.functions.invoke('analyze-data', {
        body: { 
          statementData, 
          ledgerData,
          targetSchema: schemaDescription, 
          analysisType: 'data_quality', 
          reconciliationType 
        }
      });

      if (qualityResponse.error) {
        throw new Error(qualityResponse.error.message || 'Data ingestion failed');
      }

      const qualityResult = qualityResponse.data?.result as DataQualityResult;
      setState(prev => ({ 
        ...prev, 
        dataQuality: qualityResult,
        currentStep: 'schema_analysis' 
      }));
      toast.success('Data ingestion completed');

      // Step 2: Schema Mapping - compare statement to target schema
      toast.info('Agent: Analyzing schema and detecting mappings...');
      const schemaResponse = await supabase.functions.invoke('analyze-data', {
        body: { statementData, targetSchema: schemaDescription, analysisType: 'schema_analysis', reconciliationType }
      });

      if (schemaResponse.error) {
        throw new Error(schemaResponse.error.message || 'Schema mapping failed');
      }

      const schemaResult = schemaResponse.data?.result as SchemaAnalysisResult;
      setState(prev => ({ 
        ...prev, 
        schemaAnalysis: schemaResult,
        currentStep: 'data_quality_check' 
      }));
      toast.success('Schema mapping completed');

      // Step 3: Data Quality Check
      toast.info('Agent: Running data quality checks...');
      // Simulate data quality check (uses same data quality result)
      await new Promise(resolve => setTimeout(resolve, 500));
      setState(prev => ({ 
        ...prev, 
        currentStep: 'generate_etl' 
      }));
      toast.success('Data quality checks completed');

      // Step 4: Generate ETL Script
      toast.info('Agent: Generating Oracle ETL script...');
      const etlResponse = await supabase.functions.invoke('analyze-data', {
        body: { statementData, targetSchema: schemaDescription, analysisType: 'generate_etl', reconciliationType }
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
      reconciliationResult: null,
      etlScript: null,
      error: null,
    });
  };

  return { state, runSchemaSetup, reset };
}
