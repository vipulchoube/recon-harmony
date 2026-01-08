import { useMemo } from "react";
import { Users, CheckCircle2, Clock, AlertTriangle, TrendingUp, BarChart3, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Mock data for Recon Lead dashboard - using the 4 teams
const teams = [
  { id: 1, teamName: "Euroclear settlement team", assigned: 18, resolved: 15, pending: 3, avgResolutionTime: 22 },
  { id: 2, teamName: "Crest settlement team", assigned: 12, resolved: 8, pending: 4, avgResolutionTime: 28 },
  { id: 3, teamName: "Clearstream settlement team", assigned: 15, resolved: 12, pending: 3, avgResolutionTime: 18 },
  { id: 4, teamName: "Domestic settlement team", assigned: 10, resolved: 9, pending: 1, avgResolutionTime: 25 },
];

// Aging data for cases
const agingData = [
  { range: "0-15 min", count: 12, color: "bg-success" },
  { range: "15-30 min", count: 18, color: "bg-primary" },
  { range: "30-60 min", count: 8, color: "bg-warning" },
  { range: "1-2 hrs", count: 4, color: "bg-orange-500" },
  { range: "> 2 hrs", count: 2, color: "bg-destructive" },
];

const exceptionsByCategory = [
  { code: "101", category: "Feed Issue", count: 8, trend: "down" },
  { code: "102", category: "Cancelled Trade", count: 3, trend: "stable" },
  { code: "103", category: "Unsettled Trade", count: 12, trend: "up" },
  { code: "104", category: "Not Settled in Market", count: 5, trend: "down" },
  { code: "105", category: "Wrong Account", count: 7, trend: "stable" },
  { code: "106", category: "Partial Settlement", count: 4, trend: "down" },
];

const recentActivity = [
  { id: 1, action: "Case #1234 resolved", user: "Euroclear settlement team", time: "5 min ago", type: "resolved" },
  { id: 2, action: "Case #1235 escalated", user: "Crest settlement team", time: "12 min ago", type: "escalated" },
  { id: 3, action: "Case #1236 assigned", user: "Clearstream settlement team", time: "25 min ago", type: "assigned" },
  { id: 4, action: "Case #1237 resolved", user: "Domestic settlement team", time: "32 min ago", type: "resolved" },
  { id: 5, action: "Case #1238 under review", user: "Euroclear settlement team", time: "45 min ago", type: "review" },
];

export function ReconLeadScreen() {
  const stats = useMemo(() => {
    const totalAssigned = teams.reduce((sum, t) => sum + t.assigned, 0);
    const totalResolved = teams.reduce((sum, t) => sum + t.resolved, 0);
    const totalPending = teams.reduce((sum, t) => sum + t.pending, 0);
    const resolutionRate = Math.round((totalResolved / totalAssigned) * 100);

    return {
      totalTeams: teams.length,
      totalAssigned,
      totalResolved,
      totalPending,
      resolutionRate,
    };
  }, []);

  const totalExceptions = exceptionsByCategory.reduce((sum, e) => sum + e.count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Reconciliation Dashboard</h2>
        <p className="text-muted-foreground">Team performance and exception management overview</p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Teams</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground">{stats.totalTeams}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Assigned</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground">{stats.totalAssigned}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground">{stats.totalResolved}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground">{stats.totalPending}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolution Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground">{stats.resolutionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Team Performance Table */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Team Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Name</TableHead>
                    <TableHead className="text-center">Assigned</TableHead>
                    <TableHead className="text-center">Resolved</TableHead>
                    <TableHead className="text-center">Pending</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Avg Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team) => {
                    const progress = Math.round((team.resolved / team.assigned) * 100);
                    return (
                      <TableRow key={team.id}>
                        <TableCell className="font-medium">{team.teamName}</TableCell>
                        <TableCell className="text-center font-mono">{team.assigned}</TableCell>
                        <TableCell className="text-center font-mono text-success">{team.resolved}</TableCell>
                        <TableCell className="text-center font-mono text-warning">{team.pending}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={progress} className="h-2 w-16" />
                            <span className="text-xs text-muted-foreground">{progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">{team.avgResolutionTime} min</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
                    <div
                      className={`mt-1 h-2 w-2 rounded-full ${
                        activity.type === "resolved"
                          ? "bg-success"
                          : activity.type === "escalated"
                            ? "bg-destructive"
                            : activity.type === "assigned"
                              ? "bg-primary"
                              : "bg-warning"
                      }`}
                    />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.user} • {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Aging Dashboard */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            Case Aging Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {agingData.map((item) => {
              const totalCases = agingData.reduce((sum, a) => sum + a.count, 0);
              const percentage = Math.round((item.count / totalCases) * 100);
              return (
                <div key={item.range} className="text-center p-4 rounded-lg bg-secondary/50">
                  <div className={`mx-auto w-3 h-3 rounded-full ${item.color} mb-2`} />
                  <div className="text-2xl font-bold font-mono">{item.count}</div>
                  <div className="text-sm font-medium text-muted-foreground">{item.range}</div>
                  <div className="text-xs text-muted-foreground mt-1">{percentage}%</div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-4 rounded-full overflow-hidden flex">
              {agingData.map((item) => {
                const totalCases = agingData.reduce((sum, a) => sum + a.count, 0);
                const width = (item.count / totalCases) * 100;
                return <div key={item.range} className={`${item.color} h-full`} style={{ width: `${width}%` }} />;
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exceptions by Category */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Exceptions by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {exceptionsByCategory.map((exception) => (
              <div key={exception.code} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {exception.code}
                    </Badge>
                    <span className="text-sm font-medium">{exception.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold font-mono">{exception.count}</span>
                    <span className="text-xs text-muted-foreground">of {totalExceptions} total</span>
                  </div>
                </div>
                <div
                  className={`flex items-center gap-1 text-xs ${
                    exception.trend === "up"
                      ? "text-destructive"
                      : exception.trend === "down"
                        ? "text-success"
                        : "text-muted-foreground"
                  }`}
                >
                  {exception.trend === "up" && <AlertTriangle className="h-3 w-3" />}
                  {exception.trend === "down" && <TrendingUp className="h-3 w-3 rotate-180" />}
                  <span className="capitalize">{exception.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
