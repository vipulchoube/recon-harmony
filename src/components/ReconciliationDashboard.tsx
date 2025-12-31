import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileSpreadsheet,
  AlertTriangle,
  Filter,
  X,
  MessageSquare,
  UserPlus,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ReconciliationResult, ExceptionCode, EXCEPTION_DEFINITIONS, ExceptionRecord } from '@/types/recon';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ReconciliationDashboardProps {
  result: ReconciliationResult;
}

interface CaseState {
  caseId: string;
  status: 'open' | 'under_review' | 'closed';
  assignedTo: string;
  comments: { author: string; content: string; createdAt: Date }[];
}

export function ReconciliationDashboard({ result }: ReconciliationDashboardProps) {
  const [exceptionCodeFilter, setExceptionCodeFilter] = useState<string>('all');
  const [reasonCodeFilter, setReasonCodeFilter] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<ExceptionRecord | null>(null);
  const [caseDialogOpen, setCaseDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [assignTo, setAssignTo] = useState('');
  
  // Track case states
  const [caseStates, setCaseStates] = useState<Record<string, CaseState>>({});

  const getExceptionDescription = (code: ExceptionCode): string => {
    const def = EXCEPTION_DEFINITIONS.find(d => d.code === code);
    return def?.category || 'OTHER';
  };

  // Get unique exception codes and reason codes for filters
  const uniqueExceptionCodes = [...new Set(result.exceptions?.records?.map(r => r.exception_code) || [])];
  const uniqueReasonCodes = [...new Set(result.exceptions?.records?.map(r => r.reason_code).filter(Boolean) || [])];

  // Filter exception records
  const filteredRecords = result.exceptions?.records?.filter(record => {
    const matchesExceptionCode = exceptionCodeFilter === 'all' || record.exception_code === exceptionCodeFilter;
    const matchesReasonCode = reasonCodeFilter === 'all' || record.reason_code === reasonCodeFilter;
    return matchesExceptionCode && matchesReasonCode;
  }) || [];

  // Prepare chart data from summary
  const chartData = result.summary?.map(item => ({
    name: `${item.exceptionCode} - ${item.exceptionDescription}`,
    code: item.exceptionCode,
    count: item.count,
  })) || [];

  const chartColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

  const getCaseId = (record: ExceptionRecord, index: number) => {
    return `CASE-${record.exception_code}-${index + 1}`;
  };

  const getCaseState = (caseId: string): CaseState => {
    return caseStates[caseId] || {
      caseId,
      status: 'open',
      assignedTo: '',
      comments: []
    };
  };

  const handleCaseClick = (record: ExceptionRecord, index: number) => {
    setSelectedCase(record);
    const caseId = getCaseId(record, index);
    const state = getCaseState(caseId);
    setAssignTo(state.assignedTo);
    setCaseDialogOpen(true);
  };

  const handleAddComment = () => {
    if (!selectedCase || !newComment.trim()) return;
    const caseId = getCaseId(selectedCase, filteredRecords.indexOf(selectedCase));
    const currentState = getCaseState(caseId);
    
    setCaseStates(prev => ({
      ...prev,
      [caseId]: {
        ...currentState,
        comments: [
          ...currentState.comments,
          { author: 'Current User', content: newComment, createdAt: new Date() }
        ]
      }
    }));
    
    setNewComment('');
    toast.success('Comment added');
  };

  const handleAssign = () => {
    if (!selectedCase || !assignTo.trim()) return;
    const caseId = getCaseId(selectedCase, filteredRecords.indexOf(selectedCase));
    const currentState = getCaseState(caseId);
    
    setCaseStates(prev => ({
      ...prev,
      [caseId]: {
        ...currentState,
        assignedTo: assignTo,
        status: 'under_review'
      }
    }));
    
    toast.success(`Case assigned to ${assignTo}`);
  };

  const handleCloseCase = () => {
    if (!selectedCase) return;
    const caseId = getCaseId(selectedCase, filteredRecords.indexOf(selectedCase));
    const currentState = getCaseState(caseId);
    
    setCaseStates(prev => ({
      ...prev,
      [caseId]: {
        ...currentState,
        status: 'closed'
      }
    }));
    
    setCaseDialogOpen(false);
    toast.success('Case closed');
  };

  // Calculate case counts
  const openCases = Object.values(caseStates).filter(c => c.status === 'open').length;
  const underReviewCases = Object.values(caseStates).filter(c => c.status === 'under_review').length;
  const closedCases = Object.values(caseStates).filter(c => c.status === 'closed').length;
  const totalCases = filteredRecords.length;
  const newCases = totalCases - openCases - underReviewCases - closedCases;

  const clearFilters = () => {
    setExceptionCodeFilter('all');
    setReasonCodeFilter('all');
  };

  const hasActiveFilters = exceptionCodeFilter !== 'all' || reasonCodeFilter !== 'all';

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          Reconciliation Results
        </CardTitle>
        <CardDescription>
          Trade matching analysis with exception detection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Exception Summary Bar Chart */}
        <div className="p-4 rounded-lg bg-secondary/50 border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Exception Summary</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value: number) => [value, 'Count']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Exceptions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Exception Records
            </h3>
            
            {/* Filters */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
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
              </div>
              
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="h-72">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-foreground">Case ID</TableHead>
                  <TableHead className="text-foreground">Exception Code</TableHead>
                  <TableHead className="text-foreground">Reason Code</TableHead>
                  <TableHead className="text-foreground">Match Status</TableHead>
                  <TableHead className="text-foreground">Transaction Ref</TableHead>
                  <TableHead className="text-foreground">Ledger SwiftRef</TableHead>
                  <TableHead className="text-foreground">Settlement SwiftRef</TableHead>
                  <TableHead className="text-foreground">ISIN</TableHead>
                  <TableHead className="text-right text-foreground">Quantity</TableHead>
                  <TableHead className="text-right text-foreground">Amount</TableHead>
                  <TableHead className="text-foreground">Value Date</TableHead>
                  <TableHead className="text-foreground">Assigned To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record, i) => {
                  const caseId = getCaseId(record, i);
                  const caseState = getCaseState(caseId);
                  return (
                    <TableRow key={i}>
                      <TableCell>
                        <button 
                          onClick={() => handleCaseClick(record, i)}
                          className="font-mono text-primary hover:underline cursor-pointer text-left"
                        >
                          {caseId}
                        </button>
                      </TableCell>
                      <TableCell className="font-mono text-primary">{record.exception_code}</TableCell>
                      <TableCell className="text-foreground">{record.reason_code}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          record.match_status === 'MATCHED' 
                            ? 'bg-success/20 text-success' 
                            : 'bg-destructive/20 text-destructive'
                        }`}>
                          {record.match_status}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-foreground">{record.transaction_ref}</TableCell>
                      <TableCell className="font-mono text-info">{record.ledger_swiftref}</TableCell>
                      <TableCell className="font-mono text-info">{record.settlement_swiftref || 'None'}</TableCell>
                      <TableCell className="font-mono text-foreground">{record.isin}</TableCell>
                      <TableCell className="text-right font-mono text-foreground">{record.quantity}</TableCell>
                      <TableCell className="text-right font-mono text-foreground">{record.amount}</TableCell>
                      <TableCell className="text-foreground">{record.value_date}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {caseState.assignedTo || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* OTHER Exceptions Section */}
        {result.exceptions?.otherExceptions && 
         result.exceptions.otherExceptions.length > 0 && (
          <div className="mt-4">
            <h4 className="text-lg font-medium text-foreground mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              OTHER Exceptions (Agent Explanation)
            </h4>
            <ScrollArea className="h-40">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">Transaction Ref</TableHead>
                    <TableHead className="text-foreground">Ledger Index</TableHead>
                    <TableHead className="text-foreground">Settlement Index</TableHead>
                    <TableHead className="text-foreground">Other Subtype</TableHead>
                    <TableHead className="text-foreground">Other Description</TableHead>
                    <TableHead className="text-foreground">Reason Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.exceptions.otherExceptions.map((ex, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-primary">{ex.transaction_ref}</TableCell>
                      <TableCell className="font-mono text-foreground">{ex.ledger_index}</TableCell>
                      <TableCell className="font-mono text-foreground">{ex.settlement_index ?? 'None'}</TableCell>
                      <TableCell className="text-warning">{ex.other_subtype}</TableCell>
                      <TableCell className="text-foreground text-sm max-w-md">{ex.other_description}</TableCell>
                      <TableCell className="font-mono text-foreground">{ex.reason_code}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        {/* Case Details Dialog */}
        <Dialog open={caseDialogOpen} onOpenChange={setCaseDialogOpen}>
          <DialogContent className="bg-card border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Case Details - {selectedCase && getCaseId(selectedCase, filteredRecords.indexOf(selectedCase))}
              </DialogTitle>
            </DialogHeader>
            
            {selectedCase && (
              <div className="space-y-4">
                {/* Case Info */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/50">
                  <div>
                    <p className="text-xs text-muted-foreground">Exception Code</p>
                    <p className="font-mono text-primary">{selectedCase.exception_code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Reason Code</p>
                    <p className="text-foreground">{selectedCase.reason_code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Transaction Ref</p>
                    <p className="font-mono text-foreground">{selectedCase.transaction_ref}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      getCaseState(getCaseId(selectedCase, filteredRecords.indexOf(selectedCase))).status === 'closed'
                        ? 'bg-success/20 text-success'
                        : getCaseState(getCaseId(selectedCase, filteredRecords.indexOf(selectedCase))).status === 'under_review'
                        ? 'bg-warning/20 text-warning'
                        : 'bg-destructive/20 text-destructive'
                    }`}>
                      {getCaseState(getCaseId(selectedCase, filteredRecords.indexOf(selectedCase))).status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ISIN</p>
                    <p className="font-mono text-foreground">{selectedCase.isin}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-mono text-foreground">{selectedCase.amount}</p>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Comments
                  </Label>
                  <ScrollArea className="h-24 border rounded-lg p-2">
                    {getCaseState(getCaseId(selectedCase, filteredRecords.indexOf(selectedCase))).comments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No comments yet</p>
                    ) : (
                      <div className="space-y-2">
                        {getCaseState(getCaseId(selectedCase, filteredRecords.indexOf(selectedCase))).comments.map((c, i) => (
                          <div key={i} className="text-sm p-2 bg-secondary/50 rounded">
                            <span className="font-medium text-foreground">{c.author}:</span>{' '}
                            <span className="text-muted-foreground">{c.content}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  <div className="flex gap-2">
                    <Textarea 
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="h-16"
                    />
                    <Button onClick={handleAddComment} size="sm" className="self-end">
                      Add
                    </Button>
                  </div>
                </div>

                {/* Assign Section */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Assign To
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Enter assignee name..."
                      value={assignTo}
                      onChange={(e) => setAssignTo(e.target.value)}
                    />
                    <Button onClick={handleAssign} variant="outline" size="sm">
                      Assign
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setCaseDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCloseCase}
                    className="bg-success hover:bg-success/90"
                    disabled={getCaseState(getCaseId(selectedCase, filteredRecords.indexOf(selectedCase))).status === 'closed'}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Close Case
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
