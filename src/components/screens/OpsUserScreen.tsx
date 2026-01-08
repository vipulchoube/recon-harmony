import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRecon, AssignedCase } from '@/context/ReconContext';
import { AlertCircle, Clock, CheckCircle2, Filter, X, Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { EXCEPTION_DEFINITIONS, ExceptionCode } from '@/types/recon';

type CaseStatus = 'OPEN' | 'UNDER REVIEW' | 'CLOSED';

export function OpsUserScreen() {
  const { assignedCases, updateAssignedCase } = useRecon();
  const [selectedCase, setSelectedCase] = useState<AssignedCase | null>(null);
  const [caseDialogOpen, setCaseDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [assignToFilter, setAssignToFilter] = useState<string>('all');
  const [exceptionCodeFilter, setExceptionCodeFilter] = useState<string>('all');
  const [reasonCodeFilter, setReasonCodeFilter] = useState<string>('all');

  // Get unique values for filters from assigned cases
  const uniqueAssignees = [...new Set(assignedCases.map(c => c.assignedTo).filter(Boolean))];
  const uniqueExceptionCodes = [...new Set(assignedCases.map(c => c.exceptionCode))];
  const uniqueReasonCodes = [...new Set(assignedCases.map(c => c.reasonCode).filter(Boolean))];

  // Filter records based on all filters
  const filteredCases = assignedCases.filter(assignedCase => {
    const matchesAssignTo = assignToFilter === 'all' || assignedCase.assignedTo === assignToFilter;
    const matchesExceptionCode = exceptionCodeFilter === 'all' || assignedCase.exceptionCode === exceptionCodeFilter;
    const matchesReasonCode = reasonCodeFilter === 'all' || assignedCase.reasonCode === reasonCodeFilter;
    return matchesAssignTo && matchesExceptionCode && matchesReasonCode;
  });

  // Reason code descriptions matching ReconciliationDashboard
  const reasonCodeDescriptions: Record<string, string> = {
    '101': 'Feed Issue',
    '102': 'Cancelled Trade',
    '103': 'Unsettled Trade',
    '104': 'Not Settled in Market but Closed Internally',
    '105': 'Booked to Wrong Account',
    '106': 'Partial Settlement',
    'OTHER': 'Other Exception',
  };

  const getExceptionDescription = (code: ExceptionCode): string => {
    const def = EXCEPTION_DEFINITIONS.find(d => d.code === code);
    return def?.category || 'OTHER';
  };

  // Calculate stats from assigned cases
  const reviewCount = assignedCases.filter(c => c.status === 'UNDER REVIEW').length;
  const closedCount = assignedCases.filter(c => c.status === 'CLOSED').length;
  const totalCount = reviewCount + closedCount;

  const stats = [
    { title: 'Total Cases', value: totalCount, icon: AlertCircle, variant: 'default' as const },
    { title: 'Under Review', value: reviewCount, icon: Clock, variant: 'warning' as const },
    { title: 'Closed', value: closedCount, icon: CheckCircle2, variant: 'success' as const },
  ];

  const handleCaseClick = (assignedCase: AssignedCase) => {
    setSelectedCase(assignedCase);
    setAssignTo(assignedCase.assignedTo);
    setCaseDialogOpen(true);
  };

  const handleAddComment = () => {
    if (!selectedCase || !newComment.trim()) return;
    const newCommentObj = { author: 'Current User', content: newComment, createdAt: new Date() };
    updateAssignedCase(selectedCase.caseId, {
      comments: [...selectedCase.comments, newCommentObj]
    });
    setSelectedCase(prev => prev ? { ...prev, comments: [...prev.comments, newCommentObj] } : null);
    setNewComment('');
    toast.success('Comment added');
  };

  const handleAssign = () => {
    if (!selectedCase || !assignTo.trim()) return;
    updateAssignedCase(selectedCase.caseId, {
      assignedTo: assignTo,
      status: 'UNDER REVIEW'
    });
    setSelectedCase(prev => prev ? { ...prev, assignedTo: assignTo, status: 'UNDER REVIEW' } : null);
    toast.success(`Case assigned to ${assignTo}`);
  };

  const handleStatusChange = (newStatus: CaseStatus) => {
    if (!selectedCase) return;
    updateAssignedCase(selectedCase.caseId, { status: newStatus });
    setSelectedCase(prev => prev ? { ...prev, status: newStatus } : null);
    toast.success(`Status updated to ${newStatus}`);
  };

  const handleCloseCase = () => {
    if (!selectedCase) return;
    updateAssignedCase(selectedCase.caseId, { status: 'CLOSED' });
    setCaseDialogOpen(false);
    toast.success('Case closed');
  };

  const clearFilters = () => {
    setAssignToFilter('all');
    setExceptionCodeFilter('all');
    setReasonCodeFilter('all');
  };

  const hasActiveFilters = assignToFilter !== 'all' || exceptionCodeFilter !== 'all' || reasonCodeFilter !== 'all';

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
              <stat.icon className={`h-4 w-4 ${stat.variant === 'warning' ? 'text-warning' : stat.variant === 'success' ? 'text-success' : 'text-muted-foreground'}`} />
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
              
              {/* Assign To Filter - Primary filter at the top */}
              <Select value={assignToFilter} onValueChange={setAssignToFilter}>
                <SelectTrigger className="w-48 h-8 text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Assign To" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {uniqueAssignees.map(assignee => (
                    <SelectItem key={assignee} value={assignee}>{assignee}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={exceptionCodeFilter} onValueChange={setExceptionCodeFilter}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue placeholder="Exception Code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Codes</SelectItem>
                  {uniqueExceptionCodes.map(code => (
                    <SelectItem key={code} value={code}>{code} - {getExceptionDescription(code)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={reasonCodeFilter} onValueChange={setReasonCodeFilter}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue placeholder="Reason Code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reasons</SelectItem>
                  {uniqueReasonCodes.map(code => (
                    <SelectItem key={code} value={code}>{code}</SelectItem>
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
            {filteredCases.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No cases assigned yet</p>
                <p className="text-sm">Cases will appear here when assigned from the Recon User screen</p>
              </div>
            ) : (
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
                  {filteredCases.map((assignedCase) => (
                    <TableRow key={assignedCase.caseId}>
                      <TableCell>
                        <button 
                          onClick={() => handleCaseClick(assignedCase)} 
                          className="font-mono text-primary hover:underline"
                        >
                          {assignedCase.caseId}
                        </button>
                      </TableCell>
                      <TableCell className="font-mono text-primary">{assignedCase.exceptionCode}</TableCell>
                      <TableCell>{reasonCodeDescriptions[assignedCase.exceptionCode] || assignedCase.reasonCode}</TableCell>
                      <TableCell className="font-mono">{assignedCase.transactionRef}</TableCell>
                      <TableCell className="font-mono text-info">{assignedCase.ledgerSwiftRef}</TableCell>
                      <TableCell className="font-mono text-info">{assignedCase.settlementSwiftRef || 'None'}</TableCell>
                      <TableCell className="font-mono">{assignedCase.isin}</TableCell>
                      <TableCell>{assignedCase.valueDate}</TableCell>
                      <TableCell>{assignedCase.assignedTo || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          assignedCase.status === 'CLOSED' ? 'bg-success/20 text-success' : 
                          assignedCase.status === 'UNDER REVIEW' ? 'bg-warning/20 text-warning' : 
                          'bg-destructive/20 text-destructive'
                        }`}>
                          {assignedCase.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={caseDialogOpen} onOpenChange={setCaseDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>Case Details - {selectedCase?.caseId}</DialogTitle>
          </DialogHeader>
          {selectedCase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/50">
                <div>
                  <p className="text-xs text-muted-foreground">Exception Code</p>
                  <p className="font-mono text-primary">{selectedCase.exceptionCode}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reason Code</p>
                  <p>{reasonCodeDescriptions[selectedCase.exceptionCode] || selectedCase.reasonCode}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Transaction Ref</p>
                  <p className="font-mono">{selectedCase.transactionRef}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <span className={`text-xs font-medium px-2 py-1 rounded inline-block ${
                    selectedCase.status === 'CLOSED' ? 'bg-success/20 text-success' :
                    selectedCase.status === 'UNDER REVIEW' ? 'bg-warning/20 text-warning' :
                    'bg-destructive/20 text-destructive'
                  }`}>
                    {selectedCase.status}
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
                <div>
                  <p className="text-xs text-muted-foreground">Ledger SwiftRef</p>
                  <p className="font-mono text-info">{selectedCase.ledgerSwiftRef}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Settlement SwiftRef</p>
                  <p className="font-mono text-info">{selectedCase.settlementSwiftRef || 'None'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Value Date</p>
                  <p>{selectedCase.valueDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <p className="font-mono">{selectedCase.quantity}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Comments</Label>
                <ScrollArea className="h-20 border rounded-lg p-2">
                  {selectedCase.comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No comments</p>
                  ) : (
                    selectedCase.comments.map((c, i) => (
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
                  <Button onClick={handleAddComment} size="sm" className="self-end">Add</Button>
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
                  <Button onClick={handleAssign} variant="outline" size="sm">Assign</Button>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setCaseDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleCloseCase} 
                  className="bg-success hover:bg-success/90" 
                  disabled={selectedCase.status === 'CLOSED'}
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