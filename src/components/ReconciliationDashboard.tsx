import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Download,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ReconciliationResult, EXCEPTION_DEFINITIONS, ExceptionCode } from '@/types/recon';

interface ReconciliationDashboardProps {
  result: ReconciliationResult;
}

export function ReconciliationDashboard({ result }: ReconciliationDashboardProps) {
  const downloadExpectedOutput = () => {
    if (!result?.expectedOutput) return;
    const headers = ['Department', 'Balance Pool', 'Security ISIN', 'Ledger or Statement Break', 'Direction', 'Quantity', 'Amount', 'Currency', 'ValueDate', 'Our Settlement Ref', 'Reason Code'];
    const rows = result.expectedOutput.map(row => [
      row.department || 'nan',
      row.balance_pool || '',
      row.security_isin,
      row.ledger_or_statement_break,
      row.direction,
      row.quantity,
      row.amount,
      row.currency,
      row.value_date,
      row.our_settlement_ref,
      row.reason_code
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expected_output.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Expected output CSV downloaded');
  };

  const getExceptionDescription = (code: ExceptionCode): string => {
    const def = EXCEPTION_DEFINITIONS.find(d => d.code === code);
    return def?.category || 'OTHER';
  };

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
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-secondary">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="matching">Matching</TabsTrigger>
            <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
            <TabsTrigger value="expected">Expected Output</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Exception Summary</h3>
            <ScrollArea className="h-72">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">Exception Code</TableHead>
                    <TableHead className="text-foreground">Exception Description</TableHead>
                    <TableHead className="text-right text-foreground">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.summary?.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono font-medium text-primary">
                        {item.exceptionCode}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {item.exceptionDescription}
                      </TableCell>
                      <TableCell className="text-right font-mono text-foreground">
                        {item.count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          {/* Matching Tab */}
          <TabsContent value="matching" className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-4 rounded-lg bg-success/10 border border-success/30 text-center">
                <p className="text-3xl font-bold font-mono text-success">
                  {result.matching?.matchedCount || 0}
                </p>
                <p className="text-sm text-muted-foreground">Matched</p>
              </div>
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-center">
                <p className="text-3xl font-bold font-mono text-destructive">
                  {result.matching?.unmatchedCount || 0}
                </p>
                <p className="text-sm text-muted-foreground">Unmatched</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50 border border-border text-center">
                <p className="text-3xl font-bold font-mono text-foreground">
                  {result.matching?.totalRecords || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </div>
            </div>

            <h4 className="text-sm font-medium text-foreground mb-2">Matching Details</h4>
            <ScrollArea className="h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">Exception Code</TableHead>
                    <TableHead className="text-foreground">Reason Code</TableHead>
                    <TableHead className="text-foreground">Match Status</TableHead>
                    <TableHead className="text-foreground">Confidence</TableHead>
                    <TableHead className="text-foreground">Transaction Ref</TableHead>
                    <TableHead className="text-foreground">Ledger SwiftRef</TableHead>
                    <TableHead className="text-foreground">Settlement SwiftRef</TableHead>
                    <TableHead className="text-foreground">ISIN</TableHead>
                    <TableHead className="text-right text-foreground">Quantity</TableHead>
                    <TableHead className="text-right text-foreground">Amount</TableHead>
                    <TableHead className="text-foreground">Value Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.matching?.matchedRecords?.map((record, i) => (
                    <TableRow key={i}>
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
                      <TableCell className="font-mono text-foreground">
                        {(record.confidence * 1).toFixed(4)}
                      </TableCell>
                      <TableCell className="font-mono text-foreground">{record.transaction_ref}</TableCell>
                      <TableCell className="font-mono text-info">{record.ledger_swiftref}</TableCell>
                      <TableCell className="font-mono text-info">{record.settlement_swiftref || 'None'}</TableCell>
                      <TableCell className="font-mono text-foreground">{record.isin}</TableCell>
                      <TableCell className="text-right font-mono text-foreground">{record.quantity}</TableCell>
                      <TableCell className="text-right font-mono text-foreground">{record.amount}</TableCell>
                      <TableCell className="text-foreground">{record.value_date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          {/* Exceptions Tab */}
          <TabsContent value="exceptions" className="space-y-4">
            {/* Exception Counts */}
            <div className="flex flex-wrap gap-2 mb-4">
              {result.exceptions?.exceptionCounts?.map((ec, i) => (
                <div key={i} className="px-3 py-2 rounded-lg bg-secondary/50 border border-border flex items-center gap-2">
                  <span className="font-mono font-bold text-primary">{ec.code}</span>
                  <span className="text-muted-foreground">:</span>
                  <span className="font-mono text-foreground">{ec.count}</span>
                </div>
              ))}
            </div>

            <h4 className="text-sm font-medium text-foreground mb-2">Exception Records</h4>
            <ScrollArea className="h-52">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">Exception Code</TableHead>
                    <TableHead className="text-foreground">Reason Code</TableHead>
                    <TableHead className="text-foreground">Match Status</TableHead>
                    <TableHead className="text-foreground">Confidence</TableHead>
                    <TableHead className="text-foreground">Transaction Ref</TableHead>
                    <TableHead className="text-foreground">Ledger SwiftRef</TableHead>
                    <TableHead className="text-foreground">Settlement SwiftRef</TableHead>
                    <TableHead className="text-foreground">ISIN</TableHead>
                    <TableHead className="text-right text-foreground">Quantity</TableHead>
                    <TableHead className="text-right text-foreground">Amount</TableHead>
                    <TableHead className="text-foreground">Value Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.exceptions?.records?.map((record, i) => (
                    <TableRow key={i}>
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
                      <TableCell className="font-mono text-foreground">
                        {(record.confidence * 1).toFixed(4)}
                      </TableCell>
                      <TableCell className="font-mono text-foreground">{record.transaction_ref}</TableCell>
                      <TableCell className="font-mono text-info">{record.ledger_swiftref}</TableCell>
                      <TableCell className="font-mono text-info">{record.settlement_swiftref || 'None'}</TableCell>
                      <TableCell className="font-mono text-foreground">{record.isin}</TableCell>
                      <TableCell className="text-right font-mono text-foreground">{record.quantity}</TableCell>
                      <TableCell className="text-right font-mono text-foreground">{record.amount}</TableCell>
                      <TableCell className="text-foreground">{record.value_date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

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
          </TabsContent>

          {/* Expected Output Tab */}
          <TabsContent value="expected" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Expected Output (formatted)</h3>
              <Button variant="outline" size="sm" onClick={downloadExpectedOutput}>
                <Download className="h-4 w-4 mr-2" />
                Download expected_output CSV
              </Button>
            </div>
            <ScrollArea className="h-72">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">Department</TableHead>
                    <TableHead className="text-foreground">Balance Pool</TableHead>
                    <TableHead className="text-foreground">Security ISIN</TableHead>
                    <TableHead className="text-foreground">Ledger or Statement Break</TableHead>
                    <TableHead className="text-foreground">Direction</TableHead>
                    <TableHead className="text-right text-foreground">Quantity</TableHead>
                    <TableHead className="text-right text-foreground">Amount</TableHead>
                    <TableHead className="text-foreground">Currency</TableHead>
                    <TableHead className="text-foreground">ValueDate</TableHead>
                    <TableHead className="text-foreground">Our Settlement Ref</TableHead>
                    <TableHead className="text-foreground">Reason Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.expectedOutput?.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground">{row.department || 'nan'}</TableCell>
                      <TableCell className="text-foreground">{row.balance_pool || ''}</TableCell>
                      <TableCell className="font-mono text-primary">{row.security_isin}</TableCell>
                      <TableCell className="text-foreground">{row.ledger_or_statement_break}</TableCell>
                      <TableCell className="text-foreground">{row.direction}</TableCell>
                      <TableCell className="text-right font-mono text-foreground">{row.quantity}</TableCell>
                      <TableCell className="text-right font-mono text-foreground">{row.amount}</TableCell>
                      <TableCell className="text-foreground">{row.currency}</TableCell>
                      <TableCell className="text-foreground">{row.value_date}</TableCell>
                      <TableCell className="font-mono text-info">{row.our_settlement_ref}</TableCell>
                      <TableCell className="text-warning">({row.reason_code})</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}