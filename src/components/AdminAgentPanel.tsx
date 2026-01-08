import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AgentState } from '@/hooks/useDataAgent';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Loader2, 
  Database, 
  Code, 
  Copy,
  Download,
  Bot,
  FileInput,
  ShieldCheck,
  Link2
} from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface AdminAgentPanelProps {
  state: AgentState;
  ledgerData?: string;
}

// Helper function to parse CSV and infer schema from ledger data
function parseLedgerSchema(csvData: string): { columnName: string; inferredType: string }[] {
  if (!csvData) return [];
  
  const lines = csvData.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const firstDataRow = lines[1].split(',').map(v => v.trim().replace(/"/g, ''));
  
  return headers.map((header, index) => {
    const sampleValue = firstDataRow[index] || '';
    let inferredType = 'STRING';
    
    // Infer type from sample value
    if (/^\d{1,2}[-\/]\w{3}[-\/]?\d{0,4}$/.test(sampleValue) || /^\d{4}-\d{2}-\d{2}$/.test(sampleValue)) {
      inferredType = 'DATE';
    } else if (/^-?\d+\.\d+$/.test(sampleValue)) {
      inferredType = 'DECIMAL';
    } else if (/^-?\d+$/.test(sampleValue)) {
      inferredType = 'INTEGER';
    } else if (sampleValue.toLowerCase() === 'true' || sampleValue.toLowerCase() === 'false') {
      inferredType = 'BOOLEAN';
    }
    
    return { columnName: header, inferredType };
  });
}

export function AdminAgentPanel({ state, ledgerData }: AdminAgentPanelProps) {
  const { currentStep, isAnalyzing, dataQuality, schemaAnalysis, etlScript } = state;
  const [approvedMappings, setApprovedMappings] = useState<Set<number>>(new Set());
  
  // Parse ledger schema from the uploaded ledger data
  const ledgerSchema = parseLedgerSchema(ledgerData || '');

  const handleApproveMapping = (index: number) => {
    setApprovedMappings(prev => new Set([...prev, index]));
    toast.success('Mapping approved and set to 100% match');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Get the ETL script content, falling back to rawResponse if script is undefined
  const getEtlContent = () => {
    if (etlScript?.script) return etlScript.script;
    if (etlScript?.rawResponse) return etlScript.rawResponse;
    return '';
  };

  const downloadScript = () => {
    const content = getEtlContent();
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'oracle_etl_script.sql';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('ETL script downloaded');
  };

  const steps = [
    { id: 'data_quality', label: 'Data Ingestion', icon: FileInput },
    { id: 'schema_analysis', label: 'Schema Mapping', icon: Database },
    { id: 'data_quality_check', label: 'Data Quality', icon: ShieldCheck },
    { id: 'generate_etl', label: 'ETL Script', icon: Code },
  ];

  const getStepStatus = (stepId: string) => {
    const stepOrder = ['data_quality', 'schema_analysis', 'data_quality_check', 'generate_etl', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepId);
    
    if (currentStep === stepId && isAnalyzing) return 'active';
    if (stepIndex < currentIndex || currentStep === 'complete') return 'complete';
    return 'pending';
  };

  const hasAnyData = dataQuality || schemaAnalysis || etlScript;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Agent Analysis
        </CardTitle>
        <CardDescription>
          Data ingestion, schema mapping, data quality checks, and Oracle ETL generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const Icon = step.icon;
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      status === 'active'
                        ? 'border-primary bg-primary/20 animate-pulse'
                        : status === 'complete'
                        ? 'border-success bg-success/20'
                        : 'border-muted bg-muted/20'
                    }`}
                  >
                    {status === 'active' ? (
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    ) : status === 'complete' ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <span className={`text-xs mt-1 ${
                    status === 'active' ? 'text-primary font-medium' :
                    status === 'complete' ? 'text-success' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    getStepStatus(steps[index + 1].id) !== 'pending' 
                      ? 'bg-success' 
                      : 'bg-muted'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Analysis Tabs */}
        {hasAnyData && (
          <Tabs defaultValue="ingestion" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-secondary">
              <TabsTrigger value="ingestion">
                <FileInput className="h-3 w-3 mr-1" />
                Data Ingestion
              </TabsTrigger>
              <TabsTrigger value="schema" disabled={!schemaAnalysis}>
                <Database className="h-3 w-3 mr-1" />
                Schema Mapping
              </TabsTrigger>
              <TabsTrigger value="quality" disabled={!dataQuality}>
                <ShieldCheck className="h-3 w-3 mr-1" />
                Data Quality
              </TabsTrigger>
              <TabsTrigger value="etl" disabled={!etlScript}>
                <Code className="h-3 w-3 mr-1" />
                ETL Script
              </TabsTrigger>
              <TabsTrigger value="automatch" disabled={!etlScript}>
                <Link2 className="h-3 w-3 mr-1" />
                Auto-match Rules
              </TabsTrigger>
            </TabsList>

            {/* Data Ingestion Tab */}
            <TabsContent value="ingestion" className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <FileInput className="h-4 w-4 text-primary" />
                  Data Ingestion Process
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      dataQuality ? 'bg-success/20' : 'bg-muted/20'
                    }`}>
                      {dataQuality ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <span className="text-xs text-muted-foreground">1</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Ledger File Ingested</p>
                      <p className="text-xs text-muted-foreground">CSV parsed and validated</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      dataQuality ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                    }`}>
                      {dataQuality ? 'Complete' : 'Pending'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      dataQuality ? 'bg-success/20' : 'bg-muted/20'
                    }`}>
                      {dataQuality ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <span className="text-xs text-muted-foreground">2</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Statement File Ingested</p>
                      <p className="text-xs text-muted-foreground">CSV parsed and validated</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      dataQuality ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                    }`}>
                      {dataQuality ? 'Complete' : 'Pending'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      schemaAnalysis ? 'bg-success/20' : 'bg-muted/20'
                    }`}>
                      {schemaAnalysis ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <span className="text-xs text-muted-foreground">3</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Schema Detected</p>
                      <p className="text-xs text-muted-foreground">Column types and mappings identified</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      schemaAnalysis ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                    }`}>
                      {schemaAnalysis ? 'Complete' : 'Pending'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      etlScript ? 'bg-success/20' : 'bg-muted/20'
                    }`}>
                      {etlScript ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <span className="text-xs text-muted-foreground">4</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">ETL Script Generated</p>
                      <p className="text-xs text-muted-foreground">Oracle PL/SQL script ready</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      etlScript ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                    }`}>
                      {etlScript ? 'Complete' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

            </TabsContent>

            {/* Schema Mapping Tab */}
            <TabsContent value="schema" className="space-y-4">
              {schemaAnalysis && (
                <>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <Database className="h-4 w-4 text-info" />
                      Column Mappings (Statement → Target Schema)
                    </h4>
                    {schemaAnalysis.mappings && schemaAnalysis.mappings.length > 0 ? (
                      <div className="space-y-2">
                        {schemaAnalysis.mappings.map((mapping, i) => {
                          const isApproved = approvedMappings.has(i);
                          const displayConfidence = isApproved ? 1 : mapping.matchConfidence;
                          const needsApproval = !isApproved && mapping.matchConfidence < 0.9;
                          
                          return (
                            <div key={i} className="p-2 rounded bg-background/50 border border-border/50 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-info bg-info/10 px-2 py-1 rounded">{mapping.statementColumn}</span>
                                <span className="text-muted-foreground text-xs">(Statement)</span>
                                <span className="text-muted-foreground">→</span>
                                <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-1 rounded">{mapping.ledgerColumn}</span>
                                <span className="text-muted-foreground text-xs">(Target)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {isApproved ? (
                                  <span className="text-xs px-2 py-0.5 rounded bg-success/20 text-success flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Approved (100% match)
                                  </span>
                                ) : (
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    displayConfidence > 0.8 
                                      ? 'bg-success/20 text-success' 
                                      : displayConfidence > 0.5 
                                      ? 'bg-warning/20 text-warning'
                                      : 'bg-destructive/20 text-destructive'
                                  }`}>
                                    {Math.round(displayConfidence * 100)}% match
                                  </span>
                                )}
                                {mapping.transformationNeeded && (
                                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                                    Transform needed
                                  </span>
                                )}
                                {needsApproval && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => handleApproveMapping(i)}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approve
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No mappings detected yet.</p>
                    )}
                  </div>

                  {schemaAnalysis.schemaCorrections && schemaAnalysis.schemaCorrections.length > 0 && (
                    <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                      <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        Schema Corrections Suggested
                      </h4>
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {schemaAnalysis.schemaCorrections.map((correction, i) => (
                            <div key={i} className="p-2 rounded bg-background/50 border border-border/50">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-foreground uppercase">
                                  {correction.file} - {correction.column}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-destructive line-through bg-destructive/10 px-2 py-0.5 rounded">{correction.currentValue}</span>
                                <span className="text-muted-foreground">→</span>
                                <span className="text-success bg-success/10 px-2 py-0.5 rounded">{correction.suggestedValue}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{correction.reason}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Data Quality Tab */}
            <TabsContent value="quality" className="space-y-4">
              {dataQuality && (
                <>
                  {/* Checks being performed */}
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Data Quality Checks Performed
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-success" />
                        <span className="text-muted-foreground">Null Value Detection</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-success" />
                        <span className="text-muted-foreground">Duplicate Record Check</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-success" />
                        <span className="text-muted-foreground">Data Type Validation</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-success" />
                        <span className="text-muted-foreground">Date Format Consistency</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-success" />
                        <span className="text-muted-foreground">Numeric Precision Check</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-success" />
                        <span className="text-muted-foreground">Required Field Validation</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-secondary/50 text-center">
                      <p className="text-2xl font-bold font-mono text-foreground">
                        {dataQuality.summary?.totalChecks || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Checks</p>
                    </div>
                    <div className="p-3 rounded-lg bg-success/10 text-center">
                      <p className="text-2xl font-bold font-mono text-success">
                        {dataQuality.summary?.passed || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Passed</p>
                    </div>
                    <div className="p-3 rounded-lg bg-warning/10 text-center">
                      <p className="text-2xl font-bold font-mono text-warning">
                        {dataQuality.summary?.failed || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Warnings</p>
                    </div>
                  </div>
                  
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {dataQuality.checks?.map((check, i) => (
                        <div
                          key={check.id || i}
                          className={`p-3 rounded-lg border ${
                            check.passed
                              ? 'bg-success/10 border-success/30'
                              : check.severity === 'error'
                              ? 'bg-destructive/10 border-destructive/30'
                              : 'bg-warning/10 border-warning/30'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {check.passed ? (
                              <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                            ) : check.severity === 'error' ? (
                              <XCircle className="h-4 w-4 text-destructive mt-0.5" />
                            ) : check.severity === 'warning' ? (
                              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                            ) : (
                              <Info className="h-4 w-4 text-info mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">{check.name}</p>
                              <p className="text-xs text-muted-foreground">{check.details}</p>
                              {check.recommendation && (
                                <p className="text-xs text-primary mt-1">
                                  💡 {check.recommendation}
                                </p>
                              )}
                              {check.affectedRows !== undefined && check.affectedRows > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Affected rows: {check.affectedRows}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </TabsContent>

            {/* ETL Script Tab */}
            <TabsContent value="etl" className="space-y-4">
              {etlScript && (
                <>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Code className="h-4 w-4 text-primary" />
                      Oracle PL/SQL ETL Script
                    </h4>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(getEtlContent())}
                        disabled={!getEtlContent()}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={downloadScript}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download .sql
                      </Button>
                    </div>
                  </div>

                  {(etlScript.tables?.length > 0 || etlScript.procedures?.length > 0) && (
                    <div className="grid grid-cols-2 gap-4">
                      {etlScript.tables?.length > 0 && (
                        <div className="p-3 rounded bg-secondary/50 border border-border/50">
                          <h5 className="text-xs font-medium text-foreground mb-2">Tables Created</h5>
                          {etlScript.tables.map((table, i) => (
                            <div key={i} className="text-xs">
                              <span className="font-mono text-primary">{table.name}</span>
                              <span className="text-muted-foreground ml-2">- {table.purpose}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {etlScript.procedures?.length > 0 && (
                        <div className="p-3 rounded bg-secondary/50 border border-border/50">
                          <h5 className="text-xs font-medium text-foreground mb-2">Procedures</h5>
                          {etlScript.procedures.map((proc, i) => (
                            <div key={i} className="text-xs">
                              <span className="font-mono text-info">{proc.name}</span>
                              <span className="text-muted-foreground ml-2">- {proc.purpose}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <ScrollArea className="h-64 rounded border border-border bg-background">
                    <pre className="p-4 text-xs font-mono text-foreground whitespace-pre-wrap">
                      {getEtlContent() || 'No script content available'}
                    </pre>
                  </ScrollArea>

                  {etlScript.rawResponse && !etlScript.script && (
                    <div className="p-2 rounded bg-warning/10 border border-warning/30 text-xs text-warning">
                      ⚠️ Script was too long for structured parsing. Displaying raw content.
                    </div>
                  )}

                  {etlScript.executionOrder?.length > 0 && (
                    <div className="p-3 rounded bg-info/10 border border-info/30">
                      <h5 className="text-xs font-medium text-foreground mb-2">Execution Order</h5>
                      <div className="flex flex-wrap gap-2">
                        {etlScript.executionOrder.map((step, i) => (
                          <span key={i} className="text-xs bg-info/20 text-info px-2 py-1 rounded font-mono">
                            {i + 1}. {step}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Auto-match Rules Tab */}
            <TabsContent value="automatch" className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <h4 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-primary" />
                  Auto-match Rules
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-medium flex items-center justify-center">1</span>
                    <span className="text-sm text-foreground">Match by Transaction Reference</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-medium flex items-center justify-center">2</span>
                    <span className="text-sm text-foreground">Match by Swift Reference</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-medium flex items-center justify-center">3</span>
                    <span className="text-sm text-foreground">Match by Settlement Status</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-medium flex items-center justify-center">4</span>
                    <span className="text-sm text-foreground">Match by Quantity</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-medium flex items-center justify-center">5</span>
                    <span className="text-sm text-foreground">Match by Amount</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-medium flex items-center justify-center">6</span>
                    <span className="text-sm text-foreground">Match by Value Date</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Schema Preview Section */}
        {schemaAnalysis && (
          <div className="grid grid-cols-2 gap-4 mt-6">
            {/* Ledger Schema Preview */}
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                Ledger Schema Preview
              </h4>
              <ScrollArea className="h-48">
                {ledgerSchema.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-foreground text-xs">Column Name</TableHead>
                        <TableHead className="text-foreground text-xs">Data Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ledgerSchema.map((col, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-xs text-primary py-1">
                            {col.columnName}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground py-1">
                            {col.inferredType}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Upload a ledger file to see its schema
                  </p>
                )}
              </ScrollArea>
            </div>

            {/* Statement Schema Preview */}
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Database className="h-4 w-4 text-info" />
                Statement Schema Preview
              </h4>
              <ScrollArea className="h-48">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-foreground text-xs">Column Name</TableHead>
                      <TableHead className="text-foreground text-xs">Data Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schemaAnalysis.statementSchema?.map((col, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs text-info py-1">
                          {col.columnName}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground py-1">
                          {col.inferredType}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* Idle State */}
        {currentStep === 'idle' && !isAnalyzing && !hasAnyData && (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Upload both ledger and statement files to start AI analysis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
