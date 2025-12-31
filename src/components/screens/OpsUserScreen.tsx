import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CaseStatus } from '@/types/recon';
import { useRecon } from '@/context/ReconContext';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function OpsUserScreen() {
  const { reconciliationResult } = useRecon();
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [caseDialogOpen, setCaseDialogOpen] = useState(false);
  const [caseStates, setCaseStates] = useState<Record<string, { status: CaseStatus; assignedTo: string; comments: any[] }>>({});
  const [newComment, setNewComment] = useState('');
  const [assignTo, setAssignTo] = useState('');

  const records = reconciliationResult?.exceptions?.records || [];

  const getCaseId = (index: number, code: string) => `CASE-${code}-${index + 1}`;
  
  const getCaseState = (caseId: string) => caseStates[caseId] || { status: 'open' as CaseStatus, assignedTo: '', comments: [] };

  const openCount = Object.values(caseStates).filter(c => c.status === 'open').length + 
    (records.length - Object.keys(caseStates).length);
  const reviewCount = Object.values(caseStates).filter(c => c.status === 'under_review').length;
  const closedCount = Object.values(caseStates).filter(c => c.status === 'resolved').length;

  const stats = [
    { title: 'Open Cases', value: openCount, icon: AlertCircle, variant: 'destructive' as const },
    { title: 'Under Review', value: reviewCount, icon: Clock, variant: 'warning' as const },
    { title: 'Closed', value: closedCount, icon: CheckCircle2, variant: 'success' as const },
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
    setCaseStates(prev => ({
      ...prev,
      [caseId]: { ...current, comments: [...current.comments, { author: 'Current User', content: newComment, createdAt: new Date() }] }
    }));
    setNewComment('');
    toast.success('Comment added');
  };

  const handleAssign = () => {
    if (!selectedCase || !assignTo.trim()) return;
    const caseId = getCaseId(selectedCase.index, selectedCase.exception_code);
    const current = getCaseState(caseId);
    setCaseStates(prev => ({ ...prev, [caseId]: { ...current, assignedTo: assignTo, status: 'under_review' } }));
    toast.success(`Case assigned to ${assignTo}`);
  };

  const handleCloseCase = () => {
    if (!selectedCase) return;
    const caseId = getCaseId(selectedCase.index, selectedCase.exception_code);
    const current = getCaseState(caseId);
    setCaseStates(prev => ({ ...prev, [caseId]: { ...current, status: 'resolved' } }));
    setCaseDialogOpen(false);
    toast.success('Case closed');
  };

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
              <stat.icon className={`h-4 w-4 ${stat.variant === 'destructive' ? 'text-destructive' : stat.variant === 'warning' ? 'text-warning' : 'text-success'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>All Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Exception Code</TableHead>
                  <TableHead>Reason Code</TableHead>
                  <TableHead>Match Status</TableHead>
                  <TableHead>Transaction Ref</TableHead>
                  <TableHead>ISIN</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Value Date</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record, i) => {
                  const caseId = getCaseId(i, record.exception_code);
                  const state = getCaseState(caseId);
                  return (
                    <TableRow key={i}>
                      <TableCell><button onClick={() => handleCaseClick(record, i)} className="font-mono text-primary hover:underline">{caseId}</button></TableCell>
                      <TableCell className="font-mono text-primary">{record.exception_code}</TableCell>
                      <TableCell>{record.reason_code}</TableCell>
                      <TableCell><span className={`px-2 py-1 rounded text-xs ${record.match_status === 'MATCHED' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>{record.match_status}</span></TableCell>
                      <TableCell className="font-mono">{record.transaction_ref}</TableCell>
                      <TableCell className="font-mono">{record.isin}</TableCell>
                      <TableCell className="text-right font-mono">{record.quantity}</TableCell>
                      <TableCell className="text-right font-mono">{record.amount}</TableCell>
                      <TableCell>{record.value_date}</TableCell>
                      <TableCell>{state.assignedTo || '-'}</TableCell>
                      <TableCell><span className={`px-2 py-1 rounded text-xs ${state.status === 'resolved' ? 'bg-success/20 text-success' : state.status === 'under_review' ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive'}`}>{state.status.replace('_', ' ')}</span></TableCell>
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
          <DialogHeader><DialogTitle>Case Details - {selectedCase && getCaseId(selectedCase.index, selectedCase.exception_code)}</DialogTitle></DialogHeader>
          {selectedCase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/50">
                <div><p className="text-xs text-muted-foreground">Exception Code</p><p className="font-mono text-primary">{selectedCase.exception_code}</p></div>
                <div><p className="text-xs text-muted-foreground">Reason Code</p><p>{selectedCase.reason_code}</p></div>
                <div><p className="text-xs text-muted-foreground">Transaction Ref</p><p className="font-mono">{selectedCase.transaction_ref}</p></div>
                <div><p className="text-xs text-muted-foreground">Amount</p><p className="font-mono">{selectedCase.amount}</p></div>
              </div>
              <div className="space-y-2">
                <Label>Comments</Label>
                <ScrollArea className="h-20 border rounded-lg p-2">
                  {getCaseState(getCaseId(selectedCase.index, selectedCase.exception_code)).comments.length === 0 ? <p className="text-sm text-muted-foreground">No comments</p> : getCaseState(getCaseId(selectedCase.index, selectedCase.exception_code)).comments.map((c, i) => <div key={i} className="text-sm p-2 bg-secondary/50 rounded mb-1"><span className="font-medium">{c.author}:</span> {c.content}</div>)}
                </ScrollArea>
                <div className="flex gap-2"><Textarea placeholder="Add comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="h-12" /><Button onClick={handleAddComment} size="sm" className="self-end">Add</Button></div>
              </div>
              <div className="space-y-2">
                <Label>Assign To</Label>
                <div className="flex gap-2"><Input placeholder="Assignee name..." value={assignTo} onChange={(e) => setAssignTo(e.target.value)} /><Button onClick={handleAssign} variant="outline" size="sm">Assign</Button></div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setCaseDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCloseCase} className="bg-success hover:bg-success/90" disabled={getCaseState(getCaseId(selectedCase.index, selectedCase.exception_code)).status === 'resolved'}><CheckCircle2 className="h-4 w-4 mr-2" />Close Case</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
