import { useState } from 'react';
import { BarChart3, CheckCircle2, XCircle, FileSpreadsheet, AlertTriangle, Play, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRecon } from '@/context/ReconContext';
import { ReconciliationDashboard } from '@/components/ReconciliationDashboard';
import { useReconciliation } from '@/hooks/useReconciliation';

export function ReconUserScreen() {
  const { reconciliationResult, setReconciliationResult, ledgerData, statementData } = useRecon();
  const { state: reconState, runReconciliation } = useReconciliation();

  const matchedCount = reconciliationResult?.matching?.matchedCount || 0;
  const unmatchedCount = reconciliationResult?.matching?.unmatchedCount || 0;
  const totalRecords = reconciliationResult?.matching?.totalRecords || 0;
  const totalExceptions = reconciliationResult?.exceptions?.records?.length || 0;

  const handleStartReconciliation = async () => {
    if (!ledgerData || !statementData) {
      return;
    }
    await runReconciliation(ledgerData, statementData);
  };

  // Update context when reconciliation completes
  if (reconState.reconciliationResult && reconState.reconciliationResult !== reconciliationResult) {
    setReconciliationResult(reconState.reconciliationResult);
  }

  const stats = [
    {
      title: 'Total Exceptions',
      value: totalExceptions,
      icon: AlertTriangle,
      trend: '+12%',
      trendUp: true,
      variant: 'destructive' as const,
    },
    {
      title: 'Matched',
      value: matchedCount,
      icon: CheckCircle2,
      trend: '+8%',
      trendUp: true,
      variant: 'success' as const,
    },
    {
      title: 'Unmatched',
      value: unmatchedCount,
      icon: XCircle,
      trend: '-5%',
      trendUp: false,
      variant: 'warning' as const,
    },
    {
      title: 'Total Records',
      value: totalRecords,
      icon: BarChart3,
      trend: '+2%',
      trendUp: true,
    },
  ];

  const canStartRecon = ledgerData && statementData && !reconState.isReconciling;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reconciliation Dashboard</h2>
          <p className="text-muted-foreground">Overview of trade reconciliation status</p>
        </div>
        <Button 
          onClick={handleStartReconciliation}
          disabled={!canStartRecon}
          size="lg"
        >
          {reconState.isReconciling ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          {reconState.isReconciling ? 'Reconciling...' : 'Start Reconciliation'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="glass-card overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon
                className={`h-4 w-4 ${
                  stat.variant === 'destructive'
                    ? 'text-destructive'
                    : stat.variant === 'warning'
                    ? 'text-warning'
                    : stat.variant === 'success'
                    ? 'text-success'
                    : 'text-primary'
                }`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-foreground">{stat.value}</div>
              <p
                className={`text-xs mt-1 ${
                  stat.trendUp ? 'text-success' : 'text-destructive'
                }`}
              >
                {stat.trend} from last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reconciliation Results - Show when available */}
      {reconciliationResult && (
        <ReconciliationDashboard result={reconciliationResult} />
      )}

      {/* Placeholder when no reconciliation results */}
      {!reconciliationResult && (
        <Card className="glass-card">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Reconciliation Results</h3>
              <p className="text-sm">
                {!ledgerData || !statementData 
                  ? 'Upload ledger and statement files in the Admin screen first, then click Start Reconciliation.'
                  : 'Click Start Reconciliation to begin the reconciliation process.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
