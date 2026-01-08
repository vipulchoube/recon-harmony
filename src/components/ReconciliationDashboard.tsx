import { useState, useEffect, useMemo } from 'react';
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
import { ReconciliationResult, ExceptionCode, EXCEPTION_DEFINITIONS, ExceptionRecord, OtherException } from '@/types/recon';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useRecon, AssignedCase } from '@/context/ReconContext';

interface ReconciliationDashboardProps {
  result: ReconciliationResult;
}

type CaseStatus = 'OPEN' | 'UNDER REVIEW' | 'CLOSED';

interface CaseState {
  caseId: string;
  status: CaseStatus;
  assignedTo: string;
  exceptionCode: ExceptionCode | '' | 'NEW';
  customExceptionCode?: string;
  customReasonCode?: string;
  comments: { author: string; content: string; createdAt: Date }[];
}

// Auto-assignment rules
const AUTO_ASSIGN_RULES: Record<ExceptionCode, string> = {
  '102': 'Domestic settlement team',
  '106': 'Euroclear settlement team',
  '101': '',
  '103': '',
  '104': '',
  '105': '',
  'OTHER': '',
};

export function ReconciliationDashboard({ result }: ReconciliationDashboardProps) {
  const { addAssignedCase } = useRecon();
  const [exceptionCodeFilter, setExceptionCodeFilter] = useState<string>('all');
  const [reasonCodeFilter, setReasonCodeFilter] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<ExceptionRecord | null>(null);
  const [selectedOtherCase, setSelectedOtherCase] = useState<OtherException | null>(null);
  const [selectedOtherIndex, setSelectedOtherIndex] = useState<number>(-1);
  const [caseDialogOpen, setCaseDialogOpen] = useState(false);
  const [otherCaseDialogOpen, setOtherCaseDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [assignTo, setAssignTo] = useState('');
  
  // Track case states for exception records
  const [caseStates, setCaseStates] = useState<Record<string, CaseState>>({});
  // Track case states for OTHER exceptions
  const [otherCaseStates, setOtherCaseStates] = useState<Record<string, CaseState>>({});
  // Track if auto-assignment has been applied
  const [autoAssignApplied, setAutoAssignApplied] = useState(false);

  const getExceptionDescription = (code: ExceptionCode): string => {
    const def = EXCEPTION_DEFINITIONS.find(d => d.code === code);
    return def?.category || 'OTHER';
  };

  // Only show exception records with codes 101-106 in the Exception Records table
  const validExceptionCodes = ['101', '102', '103', '104', '105', '106'];
  const exceptionRecords101to106 = result.exceptions?.records?.filter(r => 
    validExceptionCodes.includes(r.exception_code)
  ) || [];
  
  // Get unique exception codes and reason codes for filters (only from 101-106)
  const uniqueExceptionCodes = [...new Set(exceptionRecords101to106.map(r => r.exception_code))];
  const uniqueReasonCodes = [...new Set(exceptionRecords101to106.map(r => r.reason_code).filter(Boolean))];

  // Filter exception records (only 101-106)
  const filteredRecords = exceptionRecords101to106.filter(record => {
    const matchesExceptionCode = exceptionCodeFilter === 'all' || record.exception_code === exceptionCodeFilter;
    const matchesReasonCode = reasonCodeFilter === 'all' || record.reason_code === reasonCodeFilter;
    return matchesExceptionCode && matchesReasonCode;
  });
  
  // OTHER exceptions = ONLY from the dedicated otherExceptions array (no duplication from records)
  const otherExceptions = result.exceptions?.otherExceptions || [];

  // Chart label mapping
  const codeLabels: Record<string, string> = {
    '101': '101-Feed Issue',
    '102': '102-Cancelled Trade',
    '103': '103-Unsettled Trade',
    '104': '104-Not Settled in Market',
    '105': '105-Wrong Account',
    '106': '106-Partial Settlement',
    'OTHER': 'OTHER',
  };

  // Reason code descriptions
  const reasonCodeDescriptions: Record<string, string> = {
    '101': 'Feed Issue',
    '102': 'Cancelled Trade',
    '103': 'Unsettled Trade',
    '104': 'Not Settled in Market but Closed Internally',
    '105': 'Booked to Wrong Account',
    '106': 'Partial Settlement',
    'OTHER': 'Other Exception',
  };

  // Prepare chart data from actual exception records (single source of truth)
  const chartData = useMemo(() => {
    const records = result.exceptions?.records || [];
    
    // Count known exceptions by code
    const countByCode: Record<string, number> = {};
    records.forEach(r => {
      if (validExceptionCodes.includes(r.exception_code)) {
        countByCode[r.exception_code] = (countByCode[r.exception_code] || 0) + 1;
      }
    });
    
    // Count OTHER exceptions (already computed as otherExceptions.length)
    const otherTotal = otherExceptions.length;
    
    // Build chart data - show ALL exception codes (101-106) plus OTHER
    const allCodes = ['101', '102', '103', '104', '105', '106', 'OTHER'];
    return allCodes.map(code => ({
      name: codeLabels[code] || code,
      code: code,
      count: code === 'OTHER' ? otherTotal : (countByCode[code] || 0),
    }));
  }, [result.exceptions?.records, otherExceptions.length]);

  const chartColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

  const getCaseId = (record: ExceptionRecord, index: number) => {
    return `CASE-${record.exception_code}-${index + 1}`;
  };

  const getOtherCaseId = (index: number) => {
    return `CASE-OTHER-${index + 1}`;
  };

  // Auto-assign 102 to Domestic settlement team and 106 to Euroclear settlement team
  useEffect(() => {
    if (autoAssignApplied || exceptionRecords101to106.length === 0) return;

    const autoAssignments: Record<string, CaseState> = {};
    
    exceptionRecords101to106.forEach((record, index) => {
      const autoAssignTeam = AUTO_ASSIGN_RULES[record.exception_code];
      if (autoAssignTeam) {
        const caseId = `CASE-${record.exception_code}-${index + 1}`;
        autoAssignments[caseId] = {
          caseId,
          status: 'UNDER REVIEW',
          assignedTo: autoAssignTeam,
          exceptionCode: record.exception_code,
          comments: []
        };
        
        // Push to context for Ops User screen
        addAssignedCase({
          caseId,
          exceptionCode: record.exception_code,
          reasonCode: record.reason_code,
          transactionRef: record.transaction_ref,
          ledgerSwiftRef: record.ledger_swiftref,
          settlementSwiftRef: record.settlement_swiftref,
          isin: record.isin,
          valueDate: record.value_date,
          amount: record.amount,
          quantity: record.quantity,
          assignedTo: autoAssignTeam,
          status: 'UNDER REVIEW',
          comments: [],
          assignedAt: new Date()
        });
      }
    });

    if (Object.keys(autoAssignments).length > 0) {
      setCaseStates(prev => ({ ...prev, ...autoAssignments }));
      setAutoAssignApplied(true);
      toast.success(`Auto-assigned ${Object.keys(autoAssignments).length} exceptions to teams`);
    }
  }, [exceptionRecords101to106, autoAssignApplied, addAssignedCase]);

  const getCaseState = (caseId: string): CaseState => {
    return caseStates[caseId] || {
      caseId,
      status: 'OPEN',
      assignedTo: '',
      exceptionCode: '',
      comments: []
    };
  };

  const getOtherCaseState = (caseId: string): CaseState => {
    return otherCaseStates[caseId] || {
      caseId,
      status: 'OPEN',
      assignedTo: '',
      exceptionCode: '',
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

  const handleOtherCaseClick = (record: OtherException, index: number) => {
    setSelectedOtherCase(record);
    setSelectedOtherIndex(index);
    const caseId = getOtherCaseId(index);
    const state = getOtherCaseState(caseId);
    setAssignTo(state.assignedTo);
    setOtherCaseDialogOpen(true);
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
        status: 'UNDER REVIEW'
      }
    }));

    // Push to context for Ops User screen
    addAssignedCase({
      caseId,
      exceptionCode: selectedCase.exception_code,
      reasonCode: selectedCase.reason_code,
      transactionRef: selectedCase.transaction_ref,
      ledgerSwiftRef: selectedCase.ledger_swiftref,
      settlementSwiftRef: selectedCase.settlement_swiftref,
      isin: selectedCase.isin,
      valueDate: selectedCase.value_date,
      amount: selectedCase.amount,
      quantity: selectedCase.quantity,
      assignedTo: assignTo,
      status: 'UNDER REVIEW',
      comments: currentState.comments,
      assignedAt: new Date()
    });
    
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
        status: 'CLOSED'
      }
    }));
    
    setCaseDialogOpen(false);
    toast.success('Case closed');
  };

  const handleStatusChange = (newStatus: CaseStatus) => {
    if (!selectedCase) return;
    const caseId = getCaseId(selectedCase, filteredRecords.indexOf(selectedCase));
    const currentState = getCaseState(caseId);
    
    setCaseStates(prev => ({
      ...prev,
      [caseId]: {
        ...currentState,
        status: newStatus
      }
    }));
    
    toast.success(`Status updated to ${newStatus}`);
  };

  // Other case handlers
  const handleOtherAddComment = () => {
    if (!selectedOtherCase || !newComment.trim()) return;
    const caseId = getOtherCaseId(selectedOtherIndex);
    const currentState = getOtherCaseState(caseId);
    
    setOtherCaseStates(prev => ({
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

  const handleOtherAssign = () => {
    if (!selectedOtherCase || !assignTo.trim()) return;
    const caseId = getOtherCaseId(selectedOtherIndex);
    const currentState = getOtherCaseState(caseId);
    
    setOtherCaseStates(prev => ({
      ...prev,
      [caseId]: {
        ...currentState,
        assignedTo: assignTo,
        status: 'UNDER REVIEW'
      }
    }));
    
    toast.success(`Case assigned to ${assignTo}`);
  };

  const handleOtherCloseCase = () => {
    if (!selectedOtherCase) return;
    const caseId = getOtherCaseId(selectedOtherIndex);
    const currentState = getOtherCaseState(caseId);
    
    setOtherCaseStates(prev => ({
      ...prev,
      [caseId]: {
        ...currentState,
        status: 'CLOSED'
      }
    }));
    
    setOtherCaseDialogOpen(false);
    toast.success('Case closed');
  };

  const handleOtherStatusChange = (newStatus: CaseStatus) => {
    if (!selectedOtherCase) return;
    const caseId = getOtherCaseId(selectedOtherIndex);
    const currentState = getOtherCaseState(caseId);
    
    setOtherCaseStates(prev => ({
      ...prev,
      [caseId]: {
        ...currentState,
        status: newStatus
      }
    }));
    
    toast.success(`Status updated to ${newStatus}`);
  };

  const handleOtherExceptionCodeChange = (code: ExceptionCode | '' | 'NEW') => {
    if (!selectedOtherCase) return;
    const caseId = getOtherCaseId(selectedOtherIndex);
    const currentState = getOtherCaseState(caseId);
    
    setOtherCaseStates(prev => ({
      ...prev,
      [caseId]: {
        ...currentState,
        exceptionCode: code,
        // Clear custom fields if not NEW
        customExceptionCode: code === 'NEW' ? currentState.customExceptionCode : undefined,
        customReasonCode: code === 'NEW' ? currentState.customReasonCode : undefined,
      }
    }));
    
    if (code === 'NEW') {
      toast.info('Enter custom exception code and reason code');
    } else {
      toast.success(`Exception code updated to ${code || 'None'}`);
    }
  };

  const handleCustomExceptionChange = (field: 'code' | 'reason', value: string) => {
    if (!selectedOtherCase) return;
    const caseId = getOtherCaseId(selectedOtherIndex);
    const currentState = getOtherCaseState(caseId);
    
    setOtherCaseStates(prev => ({
      ...prev,
      [caseId]: {
        ...currentState,
        customExceptionCode: field === 'code' ? value : currentState.customExceptionCode,
        customReasonCode: field === 'reason' ? value : currentState.customReasonCode,
      }
    }));
  };

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
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
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
                  <TableHead className="text-foreground">Transaction Ref</TableHead>
                  <TableHead className="text-foreground">Ledger SwiftRef</TableHead>
                  <TableHead className="text-foreground">Settlement SwiftRef</TableHead>
                  <TableHead className="text-foreground">ISIN</TableHead>
                  <TableHead className="text-foreground">Value Date</TableHead>
                  <TableHead className="text-foreground">Assigned To</TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
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
                      <TableCell className="text-foreground">{reasonCodeDescriptions[record.exception_code] || record.reason_code}</TableCell>
                      <TableCell className="font-mono text-foreground">{record.transaction_ref}</TableCell>
                      <TableCell className="font-mono text-info">{record.ledger_swiftref}</TableCell>
                      <TableCell className="font-mono text-info">{record.settlement_swiftref || 'None'}</TableCell>
                      <TableCell className="font-mono text-foreground">{record.isin}</TableCell>
                      <TableCell className="text-foreground">{record.value_date}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {caseState.assignedTo || '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          caseState.status === 'CLOSED' ? 'bg-success/20 text-success' :
                          caseState.status === 'UNDER REVIEW' ? 'bg-warning/20 text-warning' :
                          'bg-destructive/20 text-destructive'
                        }`}>
                          {caseState.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* OTHER Exceptions Section */}
        {otherExceptions.length > 0 && (
          <div className="mt-4">
            <h4 className="text-lg font-medium text-foreground mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              OTHER Exceptions
            </h4>
            <ScrollArea className="h-48">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">Case ID</TableHead>
                    <TableHead className="text-foreground">Exception Code</TableHead>
                    <TableHead className="text-foreground">Reason Code</TableHead>
                    <TableHead className="text-foreground">Exception Description (AI-generated)</TableHead>
                    <TableHead className="text-foreground">Transaction Ref</TableHead>
                    <TableHead className="text-foreground">Ledger SwiftRef</TableHead>
                    <TableHead className="text-foreground">Settlement SwiftRef</TableHead>
                    <TableHead className="text-foreground">ISIN</TableHead>
                    <TableHead className="text-foreground">Value Date</TableHead>
                    <TableHead className="text-foreground">Assigned To</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {otherExceptions.map((ex, i) => {
                    const caseId = getOtherCaseId(i);
                    const caseState = getOtherCaseState(caseId);
                    return (
                      <TableRow key={i}>
                        <TableCell>
                          <button 
                            onClick={() => handleOtherCaseClick(ex, i)}
                            className="font-mono text-primary hover:underline cursor-pointer text-left"
                          >
                            {caseId}
                          </button>
                        </TableCell>
                        <TableCell className="font-mono text-warning">
                          {caseState.exceptionCode === 'NEW' 
                            ? (caseState.customExceptionCode || 'NEW')
                            : (caseState.exceptionCode || '-')}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {caseState.exceptionCode === 'NEW'
                            ? (caseState.customReasonCode || 'Custom')
                            : caseState.exceptionCode 
                              ? getExceptionDescription(caseState.exceptionCode as ExceptionCode) 
                              : 'OTHER'}
                        </TableCell>
                        <TableCell className="text-foreground text-sm max-w-xs truncate" title={ex.other_description}>
                          {ex.other_description || '-'}
                        </TableCell>
                        <TableCell className="font-mono text-primary">{ex.transaction_ref}</TableCell>
                        <TableCell className="font-mono text-info">{ex.ledger_swiftref || '-'}</TableCell>
                        <TableCell className="font-mono text-info">{ex.settlement_swiftref || '-'}</TableCell>
                        <TableCell className="font-mono text-foreground">{ex.isin || '-'}</TableCell>
                        <TableCell className="text-foreground">{ex.value_date || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {caseState.assignedTo || '-'}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            caseState.status === 'CLOSED' ? 'bg-success/20 text-success' :
                            caseState.status === 'UNDER REVIEW' ? 'bg-warning/20 text-warning' :
                            'bg-destructive/20 text-destructive'
                          }`}>
                            {caseState.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
                    <p className="text-foreground">{reasonCodeDescriptions[selectedCase.exception_code] || selectedCase.reason_code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Transaction Ref</p>
                    <p className="font-mono text-foreground">{selectedCase.transaction_ref}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded inline-block ${
                      getCaseState(getCaseId(selectedCase, filteredRecords.indexOf(selectedCase))).status === 'CLOSED' ? 'bg-success/20 text-success' :
                      getCaseState(getCaseId(selectedCase, filteredRecords.indexOf(selectedCase))).status === 'UNDER REVIEW' ? 'bg-warning/20 text-warning' :
                      'bg-destructive/20 text-destructive'
                    }`}>
                      {getCaseState(getCaseId(selectedCase, filteredRecords.indexOf(selectedCase))).status}
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

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setCaseDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCloseCase}
                    className="bg-success hover:bg-success/90"
                    disabled={getCaseState(getCaseId(selectedCase, filteredRecords.indexOf(selectedCase))).status === 'CLOSED'}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Close Case
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* OTHER Case Details Dialog */}
        <Dialog open={otherCaseDialogOpen} onOpenChange={setOtherCaseDialogOpen}>
          <DialogContent className="bg-card border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Case Details - {getOtherCaseId(selectedOtherIndex)}
              </DialogTitle>
            </DialogHeader>
            
            {selectedOtherCase && (
              <div className="space-y-4">
                {/* Case Info */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/50">
                  <div>
                    <p className="text-xs text-muted-foreground">Exception Code</p>
                    <Select 
                      value={getOtherCaseState(getOtherCaseId(selectedOtherIndex)).exceptionCode || 'none'}
                      onValueChange={(val) => handleOtherExceptionCodeChange(val === 'none' ? '' : val as ExceptionCode | '' | 'NEW')}
                    >
                      <SelectTrigger className="w-full h-8">
                        <SelectValue placeholder="Select exception code..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {EXCEPTION_DEFINITIONS.map(def => (
                          <SelectItem key={def.code} value={def.code}>
                            {def.code} - {def.category}
                          </SelectItem>
                        ))}
                        <SelectItem value="NEW" className="text-primary font-medium">+ NEW Exception</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Reason Code</p>
                    <p className="text-foreground">
                      {(() => {
                        const state = getOtherCaseState(getOtherCaseId(selectedOtherIndex));
                        if (state.exceptionCode === 'NEW' && state.customReasonCode) {
                          return state.customReasonCode;
                        }
                        return state.exceptionCode 
                          ? getExceptionDescription(state.exceptionCode as ExceptionCode)
                          : 'OTHER';
                      })()}
                    </p>
                  </div>
                  
                  {/* Custom Exception Fields - shown when NEW is selected */}
                  {getOtherCaseState(getOtherCaseId(selectedOtherIndex)).exceptionCode === 'NEW' && (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Custom Exception Code</p>
                        <Input
                          placeholder="Enter exception code..."
                          value={getOtherCaseState(getOtherCaseId(selectedOtherIndex)).customExceptionCode || ''}
                          onChange={(e) => handleCustomExceptionChange('code', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Custom Reason Code</p>
                        <Input
                          placeholder="Enter reason code..."
                          value={getOtherCaseState(getOtherCaseId(selectedOtherIndex)).customReasonCode || ''}
                          onChange={(e) => handleCustomExceptionChange('reason', e.target.value)}
                          className="h-8"
                        />
                      </div>
                    </>
                  )}
                  
                  <div>
                    <p className="text-xs text-muted-foreground">Transaction Ref</p>
                    <p className="font-mono text-foreground">{selectedOtherCase.transaction_ref}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded inline-block ${
                      getOtherCaseState(getOtherCaseId(selectedOtherIndex)).status === 'CLOSED' ? 'bg-success/20 text-success' :
                      getOtherCaseState(getOtherCaseId(selectedOtherIndex)).status === 'UNDER REVIEW' ? 'bg-warning/20 text-warning' :
                      'bg-destructive/20 text-destructive'
                    }`}>
                      {getOtherCaseState(getOtherCaseId(selectedOtherIndex)).status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ISIN</p>
                    <p className="font-mono text-foreground">{selectedOtherCase.isin || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-mono text-foreground">
                      {selectedOtherCase.amount != null 
                        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(selectedOtherCase.amount)
                        : '-'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Other Description</p>
                    <p className="text-foreground text-sm">{selectedOtherCase.other_description}</p>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Comments
                  </Label>
                  <ScrollArea className="h-24 border rounded-lg p-2">
                    {getOtherCaseState(getOtherCaseId(selectedOtherIndex)).comments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No comments yet</p>
                    ) : (
                      <div className="space-y-2">
                        {getOtherCaseState(getOtherCaseId(selectedOtherIndex)).comments.map((c, i) => (
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
                    <Button onClick={handleOtherAddComment} size="sm" className="self-end">
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
                    <Button onClick={handleOtherAssign} variant="outline" size="sm">
                      Assign
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setOtherCaseDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleOtherCloseCase}
                    className="bg-success hover:bg-success/90"
                    disabled={getOtherCaseState(getOtherCaseId(selectedOtherIndex)).status === 'CLOSED'}
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
