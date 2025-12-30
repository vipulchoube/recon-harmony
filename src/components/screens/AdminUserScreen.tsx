import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRecon } from '@/context/ReconContext';
import { UploadedFile } from '@/types/recon';
import { Upload, FileSpreadsheet, Settings2, CheckCircle, Loader2, Plus, Bot, Play } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDataAgent } from '@/hooks/useDataAgent';
import { AgentAnalysisPanel } from '@/components/AgentAnalysisPanel';

export function AdminUserScreen() {
  const { uploadedFiles, addUploadedFile, updateFileProgress, setReconciliationResult } = useRecon();
  const [isUploading, setIsUploading] = useState<'ledger' | 'statement' | null>(null);
  const ledgerInputRef = useRef<HTMLInputElement>(null);
  const statementInputRef = useRef<HTMLInputElement>(null);
  const [newReconName, setNewReconName] = useState('');
  const [ledgerData, setLedgerData] = useState<string>('');
  const [statementData, setStatementData] = useState<string>('');
  const { state: agentState, runAnalysis, reset: resetAgent } = useDataAgent();

  // Save reconciliation result to context when agent completes
  useEffect(() => {
    if (agentState.reconciliationResult) {
      setReconciliationResult(agentState.reconciliationResult);
    }
  }, [agentState.reconciliationResult, setReconciliationResult]);

  const handleFileUpload = async (type: 'ledger' | 'statement', file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Invalid file type', {
        description: 'Please upload a CSV file',
      });
      return;
    }

    setIsUploading(type);

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (type === 'ledger') {
        setLedgerData(content);
      } else {
        setStatementData(content);
      }
    };
    reader.readAsText(file);

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
        toast.success('File uploaded successfully', {
          description: `${file.name} is ready for analysis`,
        });
      } else {
        updateFileProgress(newFile.id, Math.min(progress, 99));
      }
    }, 150);
  };

  const handleRunAgent = () => {
    if (!ledgerData || !statementData) {
      toast.error('Missing files', {
        description: 'Please upload both ledger and statement files first',
      });
      return;
    }
    runAnalysis(ledgerData, statementData);
  };

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

  const canRunAgent = ledgerData && statementData && !agentState.isAnalyzing;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Admin Configuration</h2>
        <p className="text-muted-foreground">Upload files and run AI-powered analysis</p>
      </div>

      {/* Upload Section */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              Ledger Input
            </CardTitle>
            <CardDescription className="text-xs">Upload ledger CSV</CardDescription>
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
              variant={ledgerData ? 'default' : 'outline'}
              size="sm"
            >
              {isUploading === 'ledger' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : ledgerData ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {isUploading === 'ledger' ? 'Uploading...' : ledgerData ? 'Uploaded' : 'Select File'}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileSpreadsheet className="h-4 w-4 text-info" />
              Statement Input
            </CardTitle>
            <CardDescription className="text-xs">Upload statement CSV</CardDescription>
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
              variant={statementData ? 'default' : 'outline'}
              size="sm"
            >
              {isUploading === 'statement' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : statementData ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {isUploading === 'statement' ? 'Uploading...' : statementData ? 'Uploaded' : 'Select File'}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bot className="h-4 w-4 text-primary" />
              Run Agent
            </CardTitle>
            <CardDescription className="text-xs">Start AI analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleRunAgent}
              disabled={!canRunAgent}
              className="w-full"
              size="sm"
            >
              {agentState.isAnalyzing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {agentState.isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Settings2 className="h-4 w-4 text-warning" />
              New Recon
            </CardTitle>
            <CardDescription className="text-xs">Setup reconciliation</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Setup New
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

      {/* Agent Analysis Panel */}
      <AgentAnalysisPanel state={agentState} />

      {/* Uploaded Files History */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Upload History</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {uploadedFiles.slice(-4).map((file) => (
              <FileHistoryCard key={file.id} file={file} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FileHistoryCard({ file }: { file: UploadedFile }) {
  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className={`h-5 w-5 ${file.type === 'ledger' ? 'text-primary' : 'text-info'}`} />
            <div>
              <p className="text-sm font-mono font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {file.uploadedAt.toLocaleDateString()} • {file.type.toUpperCase()}
              </p>
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
        {file.status === 'processing' && (
          <Progress value={file.progress} className="h-1 mt-3" />
        )}
      </CardContent>
    </Card>
  );
}
