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
  Bot
} from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AgentAnalysisPanelProps {
  state: AgentState;
}

export function AgentAnalysisPanel({ state }: AgentAnalysisPanelProps) {
  const { currentStep, isAnalyzing, dataQuality, schemaAnalysis, etlScript } = state;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const downloadScript = () => {
    if (!etlScript?.script) return;
    const blob = new Blob([etlScript.script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'oracle_etl_script.sql';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('ETL script downloaded');
  };

  const steps = [
    { id: 'data_quality', label: 'Data Quality', icon: CheckCircle },
    { id: 'schema_analysis', label: 'Schema Analysis', icon: Database },
    { id: 'generate_etl', label: 'ETL Script', icon: Code },
  ];

  const getStepStatus = (stepId: string) => {
    const stepOrder = ['data_quality', 'schema_analysis', 'generate_etl', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepId);
    
    if (currentStep === stepId && isAnalyzing) return 'active';
    if (stepIndex < currentIndex || currentStep === 'complete') return 'complete';
    return 'pending';
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Agent Analysis
        </CardTitle>
        <CardDescription>
          Automated data quality checks, schema analysis, and ETL generation
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
                  <div className={`w-16 h-0.5 mx-2 ${
                    getStepStatus(steps[index + 1].id) !== 'pending' 
                      ? 'bg-success' 
                      : 'bg-muted'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Results Tabs */}
        {(dataQuality || schemaAnalysis || etlScript) && (
          <Tabs defaultValue="quality" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-secondary">
              <TabsTrigger value="quality" disabled={!dataQuality}>
                Data Quality
              </TabsTrigger>
              <TabsTrigger value="schema" disabled={!schemaAnalysis}>
                Schema
              </TabsTrigger>
              <TabsTrigger value="etl" disabled={!etlScript}>
                ETL Script
              </TabsTrigger>
            </TabsList>

            {/* Data Quality Tab */}
            <TabsContent value="quality" className="space-y-4">
              {dataQuality && (
                <>
                  <div className="grid grid-cols-4 gap-3">
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
                    <div className="p-3 rounded-lg bg-destructive/10 text-center">
                      <p className="text-2xl font-bold font-mono text-destructive">
                        {dataQuality.summary?.failed || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                    <div className="p-3 rounded-lg bg-warning/10 text-center">
                      <p className="text-2xl font-bold font-mono text-warning">
                        {dataQuality.summary?.criticalIssues || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Critical</p>
                    </div>
                  </div>
                  
                  <ScrollArea className="h-64">
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

            {/* Schema Tab */}
            <TabsContent value="schema" className="space-y-4">
              {schemaAnalysis && (
                <>
                  {/* Column Mappings */}
                  {schemaAnalysis.mappings && schemaAnalysis.mappings.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">Column Mappings</h4>
                      <div className="space-y-2">
                        {schemaAnalysis.mappings.map((mapping, i) => (
                          <div key={i} className="p-2 rounded bg-secondary/50 border border-border/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-primary">{mapping.ledgerColumn}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="font-mono text-xs text-info">{mapping.statementColumn}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                mapping.matchConfidence > 0.8 
                                  ? 'bg-success/20 text-success' 
                                  : mapping.matchConfidence > 0.5 
                                  ? 'bg-warning/20 text-warning'
                                  : 'bg-destructive/20 text-destructive'
                              }`}>
                                {Math.round(mapping.matchConfidence * 100)}% match
                              </span>
                              {mapping.transformationNeeded && (
                                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                                  Transform needed
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Schema Corrections */}
                  {schemaAnalysis.schemaCorrections && schemaAnalysis.schemaCorrections.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">Suggested Corrections</h4>
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {schemaAnalysis.schemaCorrections.map((correction, i) => (
                            <div key={i} className="p-2 rounded bg-warning/10 border border-warning/30">
                              <div className="flex items-center gap-2 mb-1">
                                <AlertTriangle className="h-3 w-3 text-warning" />
                                <span className="text-xs font-medium text-foreground">
                                  {correction.file.toUpperCase()} - {correction.column}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-destructive line-through">{correction.currentValue}</span>
                                <span className="text-muted-foreground">→</span>
                                <span className="text-success">{correction.suggestedValue}</span>
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

            {/* ETL Script Tab */}
            <TabsContent value="etl" className="space-y-4">
              {etlScript && (
                <>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground">Oracle PL/SQL ETL Script</h4>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(etlScript.script)}
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
                        Download
                      </Button>
                    </div>
                  </div>

                  {/* Tables & Procedures Overview */}
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

                  {/* Script Preview */}
                  <ScrollArea className="h-64 rounded border border-border bg-background">
                    <pre className="p-4 text-xs font-mono text-foreground whitespace-pre-wrap">
                      {etlScript.script}
                    </pre>
                  </ScrollArea>

                  {/* Execution Order */}
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
          </Tabs>
        )}

        {/* Idle State */}
        {currentStep === 'idle' && !isAnalyzing && (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Upload both ledger and statement files to start AI analysis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
