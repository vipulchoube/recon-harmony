import { useState, useMemo, useEffect } from "react";
import { BarChart3, CheckCircle2, XCircle, FileSpreadsheet, AlertTriangle, Play, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useRecon } from "@/context/ReconContext";
import { ReconciliationDashboard } from "@/components/ReconciliationDashboard";
import { useReconciliation } from "@/hooks/useReconciliation";
import { computePreReconciliationStats, sampleLedgerData, sampleStatementData } from "@/data/sampleReconciliationData";
import { AIActivityLog } from "@/components/AIActivityLog";
import type { ExceptionCode } from "@/types/recon";

const KNOWN_EXCEPTION_CODES = new Set<ExceptionCode>(['101', '102', '103', '104', '105', '106']);

function normalizeExceptionCode(code?: string | null): ExceptionCode {
  if (!code) return 'OTHER';
  return (KNOWN_EXCEPTION_CODES.has(code as ExceptionCode) ? code : 'OTHER') as ExceptionCode;
}

export function ReconUserScreen() {
  const { reconciliationResult, setReconciliationResult, ledgerData, statementData, setLedgerData, setStatementData } = useRecon();
  const { state: reconState, runReconciliation } = useReconciliation();

  // Compute pre-reconciliation stats from sample data
  const preReconStats = useMemo(() => computePreReconciliationStats(), []);

  // Compute AI-identified counts from reconciliation result
  const { knownCount, otherCount } = useMemo(() => {
    if (!reconciliationResult?.exceptions) {
      return { knownCount: 0, otherCount: 0 };
    }

    const validCodes = ['101', '102', '103', '104', '105', '106'];
    const records = reconciliationResult.exceptions.records || [];
    const otherExceptionsFromResult = reconciliationResult.exceptions.otherExceptions || [];

    const known = records.filter(r => validCodes.includes(r.exception_code)).length;
    const otherFromRecords = records.filter(r => !validCodes.includes(r.exception_code)).length;
    const otherTotal = otherExceptionsFromResult.length + otherFromRecords;

    return { knownCount: known, otherCount: otherTotal };
  }, [reconciliationResult]);

  // Update context when reconciliation completes (and normalize unknown tags to OTHER)
  useEffect(() => {
    const incoming = reconState.reconciliationResult;
    if (!incoming || incoming === reconciliationResult) return;

    const normalized = {
      ...incoming,
      exceptions: incoming.exceptions
        ? {
            ...incoming.exceptions,
            records: (incoming.exceptions.records || []).map(r => ({
              ...r,
              exception_code: normalizeExceptionCode(r.exception_code),
            })),
          }
        : incoming.exceptions,
    };

    setReconciliationResult(normalized);
  }, [reconState.reconciliationResult, reconciliationResult, setReconciliationResult]);

  // Determine which stats to show based on whether AI reconciliation has run
  const hasAIReconciliation = !!reconciliationResult;

  // CRITICAL: Open Exceptions ALWAYS shows the pre-reconciliation value (constant)
  const displayOpenExceptions = preReconStats.openExceptions;
  const displayTotalRecords = preReconStats.totalRecords;
  const displayAutoMatched = preReconStats.autoMatched;

  // AI-identified exceptions is 0 before reconciliation, then shows known (101-106) count
  const aiIdentifiedExceptions = hasAIReconciliation ? knownCount : 0;

  const handleStartReconciliation = async () => {
    if (!ledgerData) {
      setLedgerData(sampleLedgerData);
    }
    if (!statementData) {
      setStatementData(sampleStatementData);
    }
    await runReconciliation();
  };
  const stats = [
    {
      title: "Total Records",
      value: displayTotalRecords,
      icon: BarChart3,
    },
    {
      title: "Auto-Matched",
      value: displayAutoMatched,
      icon: CheckCircle2,
      variant: "success" as const,
    },
    {
      title: "Open Exceptions",
      value: displayOpenExceptions,
      icon: XCircle,
      variant: "warning" as const,
    },
    {
      title: "AI-identified Exceptions",
      value: aiIdentifiedExceptions,
      icon: AlertTriangle,
      variant: "destructive" as const,
    },
  ];

  const canStartRecon = !reconState.isReconciling;

  // Progress calculation
  const progressPercent = reconState.progress 
    ? Math.round((reconState.progress.processedRecords / reconState.progress.totalRecords) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reconciliation Dashboard</h2>
          <p className="text-muted-foreground">Overview of trade reconciliation status</p>
        </div>
        <Button onClick={handleStartReconciliation} disabled={!canStartRecon} size="lg">
          {reconState.isReconciling ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          {reconState.isReconciling ? "Reconciling..." : "Start AI Reconciliation"}
        </Button>
      </div>

      {/* Progress Indicator */}
      {reconState.isReconciling && reconState.progress && (
        <Card className="glass-card border-primary/20">
          <CardContent className="py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-foreground font-medium">
                    AI analyzing record {reconState.progress.currentBatch} of {reconState.progress.totalRecords}
                  </span>
                </div>
                <span className="font-mono text-primary font-bold">
                  {reconState.progress.processedRecords} / {reconState.progress.totalRecords}
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {progressPercent}% complete • Processing 1 record at a time with AI analysis
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="glass-card overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon
                className={`h-4 w-4 ${
                  stat.variant === "destructive"
                    ? "text-destructive"
                    : stat.variant === "warning"
                      ? "text-warning"
                      : stat.variant === "success"
                        ? "text-success"
                        : "text-primary"
                }`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Activity Log - Show during and after reconciliation */}
      {(reconState.isReconciling || reconState.activityLogs.length > 0) && (
        <AIActivityLog logs={reconState.activityLogs} title="AI Reconciliation Activity" />
      )}

      {/* Reconciliation Results - Show only when AI reconciliation has completed (not during) */}
      {reconciliationResult && !reconState.isReconciling && <ReconciliationDashboard result={reconciliationResult} />}

      {/* Show Open Exceptions Table before AI reconciliation (not during) */}
      {!reconciliationResult && !reconState.isReconciling && preReconStats.openExceptionRecords.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Open Exceptions</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exception Code</TableHead>
                    <TableHead>Reason Code</TableHead>
                    <TableHead>Transaction Ref</TableHead>
                    <TableHead>Ledger SwiftRef</TableHead>
                    <TableHead>Settlement SwiftRef</TableHead>
                    <TableHead>ISIN</TableHead>
                    <TableHead>Value Date</TableHead>
                    <TableHead>Assigned To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preReconStats.openExceptionRecords.map((record, index) => (
                    <TableRow key={`${record.transactionRef}-${index}`}>
                      <TableCell className="text-muted-foreground">-</TableCell>
                      <TableCell className="text-muted-foreground">-</TableCell>
                      <TableCell className="font-mono">{record.transactionRef}</TableCell>
                      <TableCell className="font-mono">{record.ledgerSwiftRef || '-'}</TableCell>
                      <TableCell className="font-mono">{record.settlementSwiftRef || '-'}</TableCell>
                      <TableCell className="font-mono">{record.isin || '-'}</TableCell>
                      <TableCell>{record.valueDate || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">-</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Placeholder when no data at all (not during reconciliation) */}
      {!reconciliationResult && !reconState.isReconciling && preReconStats.openExceptionRecords.length === 0 && (
        <Card className="glass-card">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Reconciliation Results</h3>
              <p className="text-sm">
                Click Start AI Reconciliation to begin the reconciliation process.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
