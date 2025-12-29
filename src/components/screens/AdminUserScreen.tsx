import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRecon } from '@/context/ReconContext';
import { UploadedFile, SchemaMapping, TransformationRule, DataCheck } from '@/types/recon';
import { Upload, FileSpreadsheet, Settings2, CheckCircle, XCircle, Loader2, Plus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AdminUserScreen() {
  const { uploadedFiles, addUploadedFile, updateFileProgress } = useRecon();
  const [isUploading, setIsUploading] = useState<'ledger' | 'statement' | null>(null);
  const ledgerInputRef = useRef<HTMLInputElement>(null);
  const statementInputRef = useRef<HTMLInputElement>(null);
  const [newReconName, setNewReconName] = useState('');

  const handleFileUpload = (type: 'ledger' | 'statement', file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Invalid file type', {
        description: 'Please upload a CSV file',
      });
      return;
    }

    setIsUploading(type);

    const newFile: UploadedFile = {
      id: `FILE-${Date.now()}`,
      name: file.name,
      type,
      uploadedAt: new Date(),
      status: 'processing',
      progress: 0,
    };

    addUploadedFile(newFile);

    // Simulate processing
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        updateFileProgress(newFile.id, 100, 'completed');
        setIsUploading(null);
        toast.success('File processed successfully', {
          description: `${file.name} has been uploaded and processed`,
        });

        // Add mock schema data after processing
        const processedFile: Partial<UploadedFile> = {
          schema: generateMockSchema(),
          transformationRules: generateMockRules(),
          dataChecks: generateMockChecks(),
          stats: {
            totalRecords: 1000,
            processedRecords: 970,
            errorRecords: 30,
            errorDetails: ['30 records have missing ISIN codes'],
          },
        };
        // Update with full data (simplified for demo)
      } else {
        updateFileProgress(newFile.id, Math.min(progress, 99));
      }
    }, 200);
  };

  const generateMockSchema = (): SchemaMapping[] => [
    { columnName: 'TransactionID', dataType: 'STRING', mapped: true },
    { columnName: 'ISIN', dataType: 'STRING', mapped: true },
    { columnName: 'Quantity', dataType: 'INTEGER', mapped: true },
    { columnName: 'Price', dataType: 'DECIMAL', mapped: true },
    { columnName: 'TradeDate', dataType: 'DATE', mapped: true },
    { columnName: 'SettlementDate', dataType: 'DATE', mapped: false },
  ];

  const generateMockRules = (): TransformationRule[] => [
    { id: 'TR-001', name: 'Date Normalization', description: 'Convert all dates to ISO 8601', applied: true },
    { id: 'TR-002', name: 'Currency Standardization', description: 'Map to ISO 4217', applied: true },
  ];

  const generateMockChecks = (): DataCheck[] => [
    { id: 'DC-001', name: 'Null Check', passed: true, details: 'No null values in required fields' },
    { id: 'DC-002', name: 'ISIN Validation', passed: false, details: '30 records have missing ISIN' },
  ];

  const handleSetupNewRecon = () => {
    if (!newReconName.trim()) {
      toast.error('Please enter a reconciliation name');
      return;
    }
    toast.success('New reconciliation created', {
      description: `"${newReconName}" has been set up successfully`,
    });
    setNewReconName('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Admin Configuration</h2>
        <p className="text-muted-foreground">Upload files and configure reconciliation settings</p>
      </div>

      {/* Upload Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Upload Ledger
            </CardTitle>
            <CardDescription>Upload your ledger data in CSV format</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={ledgerInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload('ledger', file);
              }}
            />
            <Button
              onClick={() => ledgerInputRef.current?.click()}
              disabled={isUploading === 'ledger'}
              className="w-full"
              variant="outline"
            >
              {isUploading === 'ledger' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {isUploading === 'ledger' ? 'Uploading...' : 'Select Ledger File'}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-info" />
              Upload Statement
            </CardTitle>
            <CardDescription>Upload your statement data in CSV format</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={statementInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload('statement', file);
              }}
            />
            <Button
              onClick={() => statementInputRef.current?.click()}
              disabled={isUploading === 'statement'}
              className="w-full"
              variant="outline"
            >
              {isUploading === 'statement' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {isUploading === 'statement' ? 'Uploading...' : 'Select Statement File'}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-warning" />
              New Reconciliation
            </CardTitle>
            <CardDescription>Set up a new reconciliation process</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Setup New Reconciliation
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Create New Reconciliation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="recon-name">Reconciliation Name</Label>
                    <Input
                      id="recon-name"
                      placeholder="e.g., Q1 2024 Trade Recon"
                      value={newReconName}
                      onChange={(e) => setNewReconName(e.target.value)}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <Button onClick={handleSetupNewRecon} className="w-full">
                    Create Reconciliation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Uploaded Files</h3>
          {uploadedFiles.map((file) => (
            <FileDetailsCard key={file.id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}

function FileDetailsCard({ file }: { file: UploadedFile }) {
  const mappedCount = file.schema?.filter((s) => s.mapped).length || 0;
  const totalColumns = file.schema?.length || 0;
  const mappedPercentage = totalColumns > 0 ? Math.round((mappedCount / totalColumns) * 100) : 0;

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base font-mono">{file.name}</CardTitle>
              <CardDescription>
                Uploaded {file.uploadedAt.toLocaleDateString()} • {file.type.toUpperCase()}
              </CardDescription>
            </div>
          </div>
          <span
            className={`status-badge ${
              file.status === 'completed'
                ? 'status-resolved'
                : file.status === 'processing'
                ? 'status-review'
                : 'status-open'
            }`}
          >
            {file.status === 'processing' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            {file.status}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        {file.status === 'processing' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Processing...</span>
              <span className="font-mono text-foreground">{Math.round(file.progress)}%</span>
            </div>
            <Progress value={file.progress} className="h-2" />
          </div>
        )}

        {file.status === 'completed' && (
          <>
            {/* Stats */}
            {file.stats && (
              <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                <h4 className="text-sm font-medium text-foreground mb-3">Processing Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold font-mono text-foreground">
                      {file.stats.totalRecords.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Records</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-mono text-success">
                      {file.stats.processedRecords.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Processed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-mono text-destructive">
                      {file.stats.errorRecords.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Errors</p>
                  </div>
                </div>
                {file.stats.errorDetails.length > 0 && (
                  <div className="mt-3 p-2 rounded bg-destructive/10 border border-destructive/20">
                    <p className="text-xs text-destructive">{file.stats.errorDetails[0]}</p>
                  </div>
                )}
              </div>
            )}

            {/* Schema Mapping */}
            {file.schema && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-foreground">Schema Mapping</h4>
                  <span className="text-xs font-mono text-primary">
                    {mappedPercentage}% mapped ({mappedCount}/{totalColumns})
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {file.schema.map((col) => (
                    <div
                      key={col.columnName}
                      className={`p-2 rounded border text-xs ${
                        col.mapped
                          ? 'bg-success/10 border-success/30 text-success'
                          : 'bg-destructive/10 border-destructive/30 text-destructive'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {col.mapped ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        <span className="font-mono font-medium">{col.columnName}</span>
                      </div>
                      <span className="text-muted-foreground">{col.dataType}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transformation Rules */}
            {file.transformationRules && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Transformation Rules</h4>
                <div className="space-y-2">
                  {file.transformationRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-2 rounded bg-secondary/50 border border-border/50"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{rule.name}</p>
                          <p className="text-xs text-muted-foreground">{rule.description}</p>
                        </div>
                      </div>
                      <span className="status-badge status-resolved">Applied</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Checks */}
            {file.dataChecks && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Data Quality Checks</h4>
                <div className="space-y-2">
                  {file.dataChecks.map((check) => (
                    <div
                      key={check.id}
                      className={`flex items-center justify-between p-2 rounded border ${
                        check.passed
                          ? 'bg-success/10 border-success/30'
                          : 'bg-destructive/10 border-destructive/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {check.passed ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">{check.name}</p>
                          <p className="text-xs text-muted-foreground">{check.details}</p>
                        </div>
                      </div>
                      <span
                        className={`status-badge ${check.passed ? 'status-resolved' : 'status-open'}`}
                      >
                        {check.passed ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
