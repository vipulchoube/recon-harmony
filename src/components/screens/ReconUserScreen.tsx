import { BarChart3, TrendingUp, AlertCircle, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRecon } from '@/context/ReconContext';
import { ReconciliationDashboard } from '@/components/ReconciliationDashboard';

export function ReconUserScreen() {
  const { exceptions, reconciliationResult } = useRecon();

  const openCount = exceptions.filter((e) => e.status === 'open').length;
  const reviewCount = exceptions.filter((e) => e.status === 'under_review').length;
  const resolvedCount = exceptions.filter((e) => e.status === 'resolved').length;
  const totalCount = exceptions.length;

  const stats = [
    {
      title: 'Total Exceptions',
      value: totalCount,
      icon: BarChart3,
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Open Cases',
      value: openCount,
      icon: AlertCircle,
      trend: '-5%',
      trendUp: false,
      variant: 'destructive' as const,
    },
    {
      title: 'Under Review',
      value: reviewCount,
      icon: TrendingUp,
      trend: '+2',
      trendUp: true,
      variant: 'warning' as const,
    },
    {
      title: 'Resolved',
      value: resolvedCount,
      icon: CheckCircle,
      trend: '+8%',
      trendUp: true,
      variant: 'success' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Reconciliation Dashboard</h2>
        <p className="text-muted-foreground">Overview of trade reconciliation status</p>
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
                Upload ledger and statement files in the Admin screen to run reconciliation analysis.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {exceptions.slice(0, 5).map((exc) => (
              <div
                key={exc.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      exc.status === 'open'
                        ? 'bg-destructive'
                        : exc.status === 'under_review'
                        ? 'bg-warning'
                        : 'bg-success'
                    }`}
                  />
                  <div>
                    <p className="font-medium text-foreground font-mono text-sm">{exc.caseId}</p>
                    <p className="text-xs text-muted-foreground">{exc.description}</p>
                  </div>
                </div>
                <span
                  className={`status-badge ${
                    exc.status === 'open'
                      ? 'status-open'
                      : exc.status === 'under_review'
                      ? 'status-review'
                      : 'status-resolved'
                  }`}
                >
                  {exc.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}