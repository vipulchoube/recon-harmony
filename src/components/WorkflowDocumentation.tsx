import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, Image, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

interface WorkflowDiagramProps {
  title: string;
  children: React.ReactNode;
}

function WorkflowDiagram({ title, children }: WorkflowDiagramProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-foreground mb-3">{title}</h3>
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        {children}
      </div>
    </div>
  );
}

function DiagramBox({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-4 py-2 rounded-lg text-center text-sm font-medium ${className}`}>
      {children}
    </div>
  );
}

function Arrow({ direction = 'down' }: { direction?: 'down' | 'right' }) {
  return (
    <div className={`flex ${direction === 'right' ? 'items-center px-2' : 'justify-center py-1'}`}>
      <span className="text-muted-foreground text-lg">
        {direction === 'right' ? '→' : '↓'}
      </span>
    </div>
  );
}

export function WorkflowDocumentation() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPNG = async () => {
    if (!contentRef.current) return;
    setIsExporting(true);
    
    try {
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#1a1a2e',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = 'traderecon-workflow.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to export PNG:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          Workflow
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>TradeRecon Workflow Documentation</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadPNG}
                disabled={isExporting}
                className="gap-2"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Image className="h-4 w-4" />
                )}
                PNG
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadPDF}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div ref={contentRef} className="p-4 bg-background rounded-lg">
          <Tabs defaultValue="main" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="main">Main Flow</TabsTrigger>
              <TabsTrigger value="exception">Exception Codes</TabsTrigger>
              <TabsTrigger value="other">OTHER Flow</TabsTrigger>
              <TabsTrigger value="data">Data Flow</TabsTrigger>
            </TabsList>

            <TabsContent value="main" className="mt-4">
              <WorkflowDiagram title="Trade Reconciliation App - Main Workflow">
                <div className="space-y-4">
                  {/* User Personas */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <DiagramBox className="bg-primary/20 border border-primary text-primary-foreground">
                      👤 Admin User
                    </DiagramBox>
                    <DiagramBox className="bg-secondary/20 border border-secondary text-secondary-foreground">
                      📊 Recon User
                    </DiagramBox>
                    <DiagramBox className="bg-accent/20 border border-accent text-accent-foreground">
                      ⚙️ Ops User
                    </DiagramBox>
                  </div>

                  {/* Flow Steps */}
                  <div className="flex flex-col items-center space-y-2">
                    <DiagramBox className="bg-primary/20 border border-primary w-64">
                      1. Upload Data Files
                    </DiagramBox>
                    <Arrow />
                    <DiagramBox className="bg-muted border border-border w-64">
                      2. AI Agent Analyzes Data
                    </DiagramBox>
                    <Arrow />
                    <DiagramBox className="bg-muted border border-border w-64">
                      3. Matching Engine Runs
                    </DiagramBox>
                    <Arrow />
                    <DiagramBox className="bg-destructive/20 border border-destructive w-64">
                      4. Exceptions Detected
                    </DiagramBox>
                    <Arrow />
                    <div className="grid grid-cols-2 gap-4">
                      <DiagramBox className="bg-secondary/20 border border-secondary">
                        5a. Recon Reviews & Classifies
                      </DiagramBox>
                      <DiagramBox className="bg-accent/20 border border-accent">
                        5b. Ops Resolves Issues
                      </DiagramBox>
                    </div>
                    <Arrow />
                    <DiagramBox className="bg-green-500/20 border border-green-500 w-64">
                      6. Exception Resolved ✓
                    </DiagramBox>
                  </div>
                </div>
              </WorkflowDiagram>
            </TabsContent>

            <TabsContent value="exception" className="mt-4">
              <WorkflowDiagram title="Exception Code Classification">
                <div className="space-y-4">
                  <DiagramBox className="bg-muted border border-border mx-auto w-64">
                    Matching Engine
                  </DiagramBox>
                  <Arrow />
                  <div className="text-center text-sm text-muted-foreground mb-2">
                    Detects Mismatch Type
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2">
                    <DiagramBox className="bg-amber-500/20 border border-amber-500 text-xs">
                      MISSING_IN_LEDGER
                    </DiagramBox>
                    <DiagramBox className="bg-orange-500/20 border border-orange-500 text-xs">
                      MISSING_IN_STATEMENT
                    </DiagramBox>
                    <DiagramBox className="bg-red-500/20 border border-red-500 text-xs">
                      AMOUNT_MISMATCH
                    </DiagramBox>
                    <DiagramBox className="bg-purple-500/20 border border-purple-500 text-xs">
                      DATE_MISMATCH
                    </DiagramBox>
                    <DiagramBox className="bg-blue-500/20 border border-blue-500 text-xs">
                      OTHER
                    </DiagramBox>
                  </div>

                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Exception Code Descriptions:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• <strong>MISSING_IN_LEDGER</strong>: Transaction in statement but not in internal records</li>
                      <li>• <strong>MISSING_IN_STATEMENT</strong>: Transaction in ledger but not in bank statement</li>
                      <li>• <strong>AMOUNT_MISMATCH</strong>: Same transaction, different amounts</li>
                      <li>• <strong>DATE_MISMATCH</strong>: Same transaction, different dates</li>
                      <li>• <strong>OTHER</strong>: Unclassified - AI agent provides description</li>
                    </ul>
                  </div>
                </div>
              </WorkflowDiagram>
            </TabsContent>

            <TabsContent value="other" className="mt-4">
              <WorkflowDiagram title="OTHER Exception Handling Flow">
                <div className="space-y-4">
                  <DiagramBox className="bg-blue-500/20 border border-blue-500 mx-auto w-72">
                    OTHER Exception Detected
                  </DiagramBox>
                  <Arrow />
                  <DiagramBox className="bg-violet-500/20 border border-violet-500 mx-auto w-72">
                    🤖 AI Agent Analyzes Mismatch
                  </DiagramBox>
                  <Arrow />
                  
                  <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                    <DiagramBox className="bg-muted border border-border">
                      Generates other_subtype
                    </DiagramBox>
                    <DiagramBox className="bg-muted border border-border">
                      Generates other_description
                    </DiagramBox>
                  </div>
                  
                  <Arrow />
                  <DiagramBox className="bg-secondary/20 border border-secondary mx-auto w-72">
                    📊 Displayed on Recon Dashboard
                  </DiagramBox>
                  <Arrow />
                  
                  <div className="p-4 bg-muted/50 rounded-lg max-w-lg mx-auto">
                    <h4 className="font-medium mb-2 text-center">User Actions Available:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <DiagramBox className="bg-primary/10 border border-primary/50 text-xs">
                        Reclassify Exception Code
                      </DiagramBox>
                      <DiagramBox className="bg-primary/10 border border-primary/50 text-xs">
                        Update Reason Code
                      </DiagramBox>
                      <DiagramBox className="bg-primary/10 border border-primary/50 text-xs">
                        Add Comments
                      </DiagramBox>
                      <DiagramBox className="bg-primary/10 border border-primary/50 text-xs">
                        Change Status
                      </DiagramBox>
                    </div>
                  </div>
                  
                  <Arrow />
                  <DiagramBox className="bg-green-500/20 border border-green-500 mx-auto w-72">
                    Exception Properly Classified ✓
                  </DiagramBox>
                </div>
              </WorkflowDiagram>
            </TabsContent>

            <TabsContent value="data" className="mt-4">
              <WorkflowDiagram title="Data Flow Architecture">
                <div className="space-y-6">
                  {/* Sequence diagram style */}
                  <div className="grid grid-cols-5 gap-2 text-center text-sm font-medium mb-4">
                    <span className="text-primary">Admin</span>
                    <span className="text-muted-foreground">Edge Fn</span>
                    <span className="text-violet-500">AI Agent</span>
                    <span className="text-secondary">Recon</span>
                    <span className="text-accent">Ops</span>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <DiagramBox className="bg-primary/20 border border-primary flex-1">
                        Upload Files
                      </DiagramBox>
                      <span className="text-muted-foreground">→</span>
                      <DiagramBox className="bg-muted border border-border flex-1">
                        analyze-data
                      </DiagramBox>
                      <span className="text-transparent">→</span>
                      <div className="flex-1" />
                      <span className="text-transparent">→</span>
                      <div className="flex-1" />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1" />
                      <span className="text-muted-foreground">→</span>
                      <DiagramBox className="bg-muted border border-border flex-1">
                        Match Records
                      </DiagramBox>
                      <span className="text-muted-foreground">→</span>
                      <DiagramBox className="bg-violet-500/20 border border-violet-500 flex-1">
                        Analyze OTHER
                      </DiagramBox>
                      <span className="text-transparent">→</span>
                      <div className="flex-1" />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1" />
                      <span className="text-transparent">→</span>
                      <DiagramBox className="bg-muted border border-border flex-1">
                        Return Results
                      </DiagramBox>
                      <span className="text-muted-foreground">→</span>
                      <DiagramBox className="bg-secondary/20 border border-secondary flex-1">
                        Review
                      </DiagramBox>
                      <span className="text-muted-foreground">→</span>
                      <DiagramBox className="bg-accent/20 border border-accent flex-1">
                        Resolve
                      </DiagramBox>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Data Context (ReconContext):</h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <DiagramBox className="bg-background border border-border">
                        ledgerRecords[]
                      </DiagramBox>
                      <DiagramBox className="bg-background border border-border">
                        statementRecords[]
                      </DiagramBox>
                      <DiagramBox className="bg-background border border-border">
                        exceptions[]
                      </DiagramBox>
                    </div>
                  </div>
                </div>
              </WorkflowDiagram>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
