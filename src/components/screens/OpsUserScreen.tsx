import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRecon } from "@/context/ReconContext";
import { AlertCircle, Clock, CheckCircle2, Filter, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { EXCEPTION_DEFINITIONS, ExceptionCode } from "@/types/recon";

type CaseStatus = "OPEN" | "UNDER REVIEW" | "CLOSED";

export function OpsUserScreen() {
  const { reconciliationResult } = useRecon();
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [caseDialogOpen, setCaseDialogOpen] = useState(false);
  const [caseStates, setCaseStates] = useState<
    Record<string, { status: CaseStatus; assignedTo: string; comments: any[] }>
  >({});
  const [newComment, setNewComment] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [exceptionCodeFilter, setExceptionCodeFilter] = useState<string>("all");
  const [reasonCodeFilter, setReasonCodeFilter] = useState<string>("all");

  const records = reconciliationResult?.exceptions?.records || [];

  // Get unique values for filters
  const uniqueExceptionCodes = [...new Set(records.map((r) => r.exception_code))];
  const uniqueReasonCodes = [...new Set(records.map((r) => r.reason_code).filter(Boolean))];

  // Filter records
  const filteredRecords = records.filter((record) => {
    const matchesExceptionCode = exceptionCodeFilter === "all" || record.exception_code === exceptionCodeFilter;
    const matchesReasonCode = reasonCodeFilter === "all" || record.reason_code === reasonCodeFilter;
    return matchesExceptionCode && matchesReasonCode;
  });

  const getExceptionDescription = (code: ExceptionCode): string => {
    const def = EXCEPTION_DEFINITIONS.find((d) => d.code === code);
    return def?.category || "OTHER";
  };

  const getCaseId = (index: number, code: string) => `CASE-${code}-${index + 1}`;

  const getCaseState = (caseId: string) =>
    caseStates[caseId] || { status: "OPEN" as CaseStatus, assignedTo: "", comments: [] };

  const openCount =
    Object.values(caseStates).filter((c) => c.status === "OPEN").length +
    (records.length - Object.keys(caseStates).length);
  const reviewCount = Object.values(caseStates).filter((c) => c.status === "UNDER REVIEW").length;
  const closedCount = Object.values(caseStates).filter((c) => c.status === "CLOSED").length;

  const stats = [
    { title: "Total Cases", value: reviewCount + closedCount, icon: AlertCircle, variant: "destructive" as const },
    { title: "Under Review", value: reviewCount, icon: Clock, variant: "warning" as const },
    { title: "Closed", value: closedCount, icon: CheckCircle2, variant: "success" as const },
  ];

  const handleCaseClick = (record: any, index: number) => {
    setSelectedCase({ ...record, index });
    const caseId = getCaseId(index, record.exception_code);
    setAssignTo(getCaseState(caseId).assignedTo);
    setCaseDialogOpen(true);
  };

  const handleAddComment = () => {
    if (!selectedCase || !newComment.trim()) return;
    const caseId = getCaseId(selectedCase.index, selectedCase.exception_code);
    const current = getCaseState(caseId);
    setCaseStates((prev) => ({
      ...prev,
      [caseId]: {
        ...current,
        comments: [...current.comments, { author: "Current User", content: newComment, createdAt: new Date() }],
      },
    }));
    setNewComment("");
    toast.success("Comment added");
  };

  const handleAssign = () => {
    if (!selectedCase || !assignTo.trim()) return;
    const caseId = getCaseId(selectedCase.index, selectedCase.exception_code);
    const current = getCaseState(caseId);
    setCaseStates((prev) => ({ ...prev, [caseId]: { ...current, assignedTo: assignTo, status: "UNDER REVIEW" } }));
    toast.success(`Case assigned to ${assignTo}`);
  };

  const handleStatusChange = (newStatus: CaseStatus) => {
    if (!selectedCase) return;
    const caseId = getCaseId(selectedCase.index, selectedCase.exception_code);
    const current = getCaseState(caseId);
    setCaseStates((prev) => ({ ...prev, [caseId]: { ...current, status: newStatus } }));
    toast.success(`Status updated to ${newStatus}`);
  };

  const handleCloseCase = () => {
    if (!selectedCase) return;
    const caseId = getCaseId(selectedCase.index, selectedCase.exception_code);
    const current = getCaseState(caseId);
    setCaseStates((prev) => ({ ...prev, [caseId]: { ...current, status: "CLOSED" } }));
    setCaseDialogOpen(false);
    toast.success("Case closed");
  };

  const clearFilters = () => {
    setExceptionCodeFilter("all");
    setReasonCodeFilter("all");
  };

  const hasActiveFilters = exceptionCodeFilter !== "all" || reasonCodeFilter !== "all";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Operations Dashboard</h2>
        <p className="text-muted-foreground">Manage and resolve reconciliation exceptions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon
                className={`h-4 w-4 ${stat.variant === "destructive" ? "text-destructive" : stat.variant === "warning" ? "text-warning" : "text-success"}`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Cases</CardTitle>
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={exceptionCodeFilter} onValueChange={setExceptionCodeFilter}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue placeholder="Exception Code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Codes</SelectItem>
                  {uniqueExceptionCodes.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code} - {getExceptionDescription(code)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={reasonCodeFilter} onValueChange={setReasonCodeFilter}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue placeholder="Reason Code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reasons</SelectItem>
                  {uniqueReasonCodes.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Exception Code</TableHead>
                  <TableHead>Reason Code</TableHead>
                  <TableHead>Transaction Ref</TableHead>
                  <TableHead>Ledger SwiftRef</TableHead>
                  <TableHead>Settlement SwiftRef</TableHead>
                  <TableHead>ISIN</TableHead>
                  <TableHead>Value Date</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record, i) => {
                  const caseId = getCaseId(i, record.exception_code);
                  const state = getCaseState(caseId);
                  return (
                    <TableRow key={i}>
                      <TableCell>
                        <button
                          onClick={() => handleCaseClick(record, i)}
                          className="font-mono text-primary hover:underline"
                        >
                          {caseId}
                        </button>
                      </TableCell>
                      <TableCell className="font-mono text-primary">{record.exception_code}</TableCell>
                      <TableCell>{record.reason_code}</TableCell>
                      <TableCell className="font-mono">{record.transaction_ref}</TableCell>
                      <TableCell className="font-mono text-info">{record.ledger_swiftref}</TableCell>
                      <TableCell className="font-mono text-info">{record.settlement_swiftref || "None"}</TableCell>
                      <TableCell className="font-mono">{record.isin}</TableCell>
                      <TableCell>{record.value_date}</TableCell>
                      <TableCell>{state.assignedTo || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${state.status === "CLOSED" ? "bg-success/20 text-success" : state.status === "UNDER REVIEW" ? "bg-warning/20 text-warning" : "bg-destructive/20 text-destructive"}`}
                        >
                          {state.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={caseDialogOpen} onOpenChange={setCaseDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Case Details - {selectedCase && getCaseId(selectedCase.index, selectedCase.exception_code)}
            </DialogTitle>
          </DialogHeader>
          {selectedCase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/50">
                <div>
                  <p className="text-xs text-muted-foreground">Exception Code</p>
                  <p className="font-mono text-primary">{selectedCase.exception_code}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reason Code</p>
                  <p>{selectedCase.reason_code}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Transaction Ref</p>
                  <p className="font-mono">{selectedCase.transaction_ref}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded inline-block ${
                      getCaseState(getCaseId(selectedCase.index, selectedCase.exception_code)).status === "CLOSED"
                        ? "bg-success/20 text-success"
                        : getCaseState(getCaseId(selectedCase.index, selectedCase.exception_code)).status ===
                            "UNDER REVIEW"
                          ? "bg-warning/20 text-warning"
                          : "bg-destructive/20 text-destructive"
                    }`}
                  >
                    {getCaseState(getCaseId(selectedCase.index, selectedCase.exception_code)).status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-mono">{selectedCase.amount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ISIN</p>
                  <p className="font-mono">{selectedCase.isin}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Comments</Label>
                <ScrollArea className="h-20 border rounded-lg p-2">
                  {getCaseState(getCaseId(selectedCase.index, selectedCase.exception_code)).comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No comments</p>
                  ) : (
                    getCaseState(getCaseId(selectedCase.index, selectedCase.exception_code)).comments.map((c, i) => (
                      <div key={i} className="text-sm p-2 bg-secondary/50 rounded mb-1">
                        <span className="font-medium">{c.author}:</span> {c.content}
                      </div>
                    ))
                  )}
                </ScrollArea>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="h-12"
                  />
                  <Button onClick={handleAddComment} size="sm" className="self-end">
                    Add
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assign To</Label>
                <div className="flex gap-2">
                  <Select value={assignTo} onValueChange={setAssignTo}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select team..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Euroclear settlement team">Euroclear settlement team</SelectItem>
                      <SelectItem value="Crest settlement team">Crest settlement team</SelectItem>
                      <SelectItem value="Clearstream settlement team">Clearstream settlement team</SelectItem>
                      <SelectItem value="Domestic settlement team">Domestic settlement team</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAssign} variant="outline" size="sm">
                    Assign
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setCaseDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCloseCase}
                  className="bg-success hover:bg-success/90"
                  disabled={
                    getCaseState(getCaseId(selectedCase.index, selectedCase.exception_code)).status === "CLOSED"
                  }
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Close Case
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
