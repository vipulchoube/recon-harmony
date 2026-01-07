import { useMemo } from "react";
import { Users, CheckCircle2, Clock, AlertTriangle, TrendingUp, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Mock data for Recon Lead dashboard
const teamMembers = [
  { id: 1, name: "Sarah Johnson", role: "Senior Analyst", assigned: 12, resolved: 8, pending: 4, avgResolutionTime: "2.3h" },
  { id: 2, name: "Mike Chen", role: "Analyst", assigned: 18, resolved: 15, pending: 3, avgResolutionTime: "1.8h" },
  { id: 3, name: "Emily Davis", role: "Senior Analyst", assigned: 10, resolved: 10, pending: 0, avgResolutionTime: "2.1h" },
  { id: 4, name: "James Wilson", role: "Analyst", assigned: 15, resolved: 11, pending: 4, avgResolutionTime: "2.5h" },
  { id: 5, name: "Lisa Brown", role: "Junior Analyst", assigned: 8, resolved: 5, pending: 3, avgResolutionTime: "3.2h" },
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
  { id: 1, action: "Case #1234 resolved", user: "Sarah Johnson", time: "5 min ago", type: "resolved" },
  { id: 2, action: "Case #1235 escalated", user: "Mike Chen", time: "12 min ago", type: "escalated" },
  { id: 3, action: "Case #1236 assigned", user: "Emily Davis", time: "25 min ago", type: "assigned" },
  { id: 4, action: "Case #1237 resolved", user: "James Wilson", time: "32 min ago", type: "resolved" },
  { id: 5, action: "Case #1238 under review", user: "Lisa Brown", time: "45 min ago", type: "review" },
];

export function ReconLeadScreen() {
  const stats = useMemo(() => {
    const totalAssigned = teamMembers.reduce((sum, m) => sum + m.assigned, 0);
    const totalResolved = teamMembers.reduce((sum, m) => sum + m.resolved, 0);
    const totalPending = teamMembers.reduce((sum, m) => sum + m.pending, 0);
    const resolutionRate = Math.round((totalResolved / totalAssigned) * 100);
    
    return {
      totalTeamMembers: teamMembers.length,
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
        <h2 className="text-2xl font-bold text-foreground">Recon Lead Dashboard</h2>
        <p className="text-muted-foreground">Team performance and exception management overview</p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Team Members</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground">{stats.totalTeamMembers}</div>
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
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-center">Assigned</TableHead>
                    <TableHead className="text-center">Resolved</TableHead>
                    <TableHead className="text-center">Pending</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Avg Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => {
                    const progress = Math.round((member.resolved / member.assigned) * 100);
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell className="text-muted-foreground">{member.role}</TableCell>
                        <TableCell className="text-center font-mono">{member.assigned}</TableCell>
                        <TableCell className="text-center font-mono text-success">{member.resolved}</TableCell>
                        <TableCell className="text-center font-mono text-warning">{member.pending}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={progress} className="h-2 w-16" />
                            <span className="text-xs text-muted-foreground">{progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">{member.avgResolutionTime}</TableCell>
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
                    <div className={`mt-1 h-2 w-2 rounded-full ${
                      activity.type === 'resolved' ? 'bg-success' :
                      activity.type === 'escalated' ? 'bg-destructive' :
                      activity.type === 'assigned' ? 'bg-primary' :
                      'bg-warning'
                    }`} />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.user} • {activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

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
                    <Badge variant="outline" className="font-mono">{exception.code}</Badge>
                    <span className="text-sm font-medium">{exception.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold font-mono">{exception.count}</span>
                    <span className="text-xs text-muted-foreground">
                      of {totalExceptions} total
                    </span>
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-xs ${
                  exception.trend === 'up' ? 'text-destructive' :
                  exception.trend === 'down' ? 'text-success' :
                  'text-muted-foreground'
                }`}>
                  {exception.trend === 'up' && <AlertTriangle className="h-3 w-3" />}
                  {exception.trend === 'down' && <TrendingUp className="h-3 w-3 rotate-180" />}
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
