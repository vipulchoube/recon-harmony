import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CaseStatus } from '@/types/recon';
import { useRecon } from '@/context/ReconContext';
import { ExceptionCard } from '@/components/ExceptionCard';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

const tabConfig = [
  { value: 'open', label: 'Open Cases', icon: AlertCircle, status: 'open' as CaseStatus },
  { value: 'under_review', label: 'Under Review', icon: Clock, status: 'under_review' as CaseStatus },
  { value: 'resolved', label: 'Resolved', icon: CheckCircle2, status: 'resolved' as CaseStatus },
];

export function OpsUserScreen() {
  const [activeTab, setActiveTab] = useState('open');
  const { exceptions, updateExceptionStatus, addComment } = useRecon();

  const getExceptionsByStatus = (status: CaseStatus) =>
    exceptions.filter((exc) => exc.status === status);

  const handleResolve = (id: string) => {
    updateExceptionStatus(id, 'resolved');
  };

  const handleComment = (id: string, content: string) => {
    addComment(id, { author: 'Current User', content });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Operations Dashboard</h2>
        <p className="text-muted-foreground">Manage and resolve reconciliation exceptions</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-secondary border border-border">
          {tabConfig.map((tab) => {
            const count = getExceptionsByStatus(tab.status).length;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground data-[state=active]:bg-primary-foreground/20 data-[state=active]:text-primary-foreground">
                  {count}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabConfig.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-6">
            <div className="space-y-4">
              {getExceptionsByStatus(tab.status).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <tab.icon className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">No {tab.label.toLowerCase()}</p>
                  <p className="text-sm">All caught up!</p>
                </div>
              ) : (
                getExceptionsByStatus(tab.status).map((exception) => (
                  <ExceptionCard
                    key={exception.id}
                    exception={exception}
                    onResolve={handleResolve}
                    onComment={handleComment}
                  />
                ))
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
