import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Exception, UploadedFile, Reconciliation, CaseStatus, Comment, ReconciliationResult, ExceptionCode } from '@/types/recon';
import { mockExceptions, mockUploadedFiles, mockReconciliations } from '@/data/mockData';
import { ReconciliationType } from '@/data/positionSchema';

// Assigned exception structure for Ops User screen
export interface AssignedCase {
  caseId: string;
  exceptionCode: ExceptionCode;
  reasonCode: string;
  transactionRef: string;
  ledgerSwiftRef: string;
  settlementSwiftRef: string | null;
  isin: string;
  valueDate: string;
  amount: number;
  quantity: number;
  assignedTo: string;
  status: 'OPEN' | 'UNDER REVIEW' | 'CLOSED';
  comments: { author: string; content: string; createdAt: Date }[];
  assignedAt: Date;
}

interface ReconContextType {
  exceptions: Exception[];
  uploadedFiles: UploadedFile[];
  reconciliations: Reconciliation[];
  reconciliationResult: ReconciliationResult | null;
  ledgerData: string;
  statementData: string;
  reconciliationType: ReconciliationType;
  assignedCases: AssignedCase[];
  updateExceptionStatus: (id: string, status: CaseStatus) => void;
  addComment: (exceptionId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  addUploadedFile: (file: UploadedFile) => void;
  updateFileProgress: (id: string, progress: number, status?: UploadedFile['status']) => void;
  setReconciliationResult: (result: ReconciliationResult | null) => void;
  setLedgerData: (data: string) => void;
  setStatementData: (data: string) => void;
  setReconciliationType: (type: ReconciliationType) => void;
  addAssignedCase: (assignedCase: AssignedCase) => void;
  updateAssignedCase: (caseId: string, updates: Partial<AssignedCase>) => void;
}

const ReconContext = createContext<ReconContextType | undefined>(undefined);

export function ReconProvider({ children }: { children: ReactNode }) {
  const [exceptions, setExceptions] = useState<Exception[]>(mockExceptions);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(mockUploadedFiles);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>(mockReconciliations);
  const [reconciliationResult, setReconciliationResult] = useState<ReconciliationResult | null>(null);
  const [ledgerData, setLedgerData] = useState<string>('');
  const [statementData, setStatementData] = useState<string>('');
  const [reconciliationType, setReconciliationType] = useState<ReconciliationType>('position');
  const [assignedCases, setAssignedCases] = useState<AssignedCase[]>([]);

  const addAssignedCase = (assignedCase: AssignedCase) => {
    setAssignedCases(prev => {
      // Avoid duplicates
      if (prev.some(c => c.caseId === assignedCase.caseId)) {
        return prev.map(c => c.caseId === assignedCase.caseId ? assignedCase : c);
      }
      return [...prev, assignedCase];
    });
  };

  const updateAssignedCase = (caseId: string, updates: Partial<AssignedCase>) => {
    setAssignedCases(prev =>
      prev.map(c => c.caseId === caseId ? { ...c, ...updates } : c)
    );
  };

  const updateExceptionStatus = (id: string, status: CaseStatus) => {
    setExceptions((prev) =>
      prev.map((exc) =>
        exc.id === id
          ? {
              ...exc,
              status,
              resolvedAt: status === 'resolved' ? new Date() : undefined,
            }
          : exc
      )
    );
  };

  const addComment = (exceptionId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => {
    setExceptions((prev) =>
      prev.map((exc) =>
        exc.id === exceptionId
          ? {
              ...exc,
              comments: [
                ...exc.comments,
                {
                  ...comment,
                  id: `CMT-${Date.now()}`,
                  createdAt: new Date(),
                },
              ],
            }
          : exc
      )
    );
  };

  const addUploadedFile = (file: UploadedFile) => {
    setUploadedFiles((prev) => [...prev, file]);
  };

  const updateFileProgress = (id: string, progress: number, status?: UploadedFile['status']) => {
    setUploadedFiles((prev) =>
      prev.map((file) =>
        file.id === id
          ? {
              ...file,
              progress,
              status: status || file.status,
            }
          : file
      )
    );
  };

  return (
    <ReconContext.Provider
      value={{
        exceptions,
        uploadedFiles,
        reconciliations,
        reconciliationResult,
        ledgerData,
        statementData,
        reconciliationType,
        assignedCases,
        updateExceptionStatus,
        addComment,
        addUploadedFile,
        updateFileProgress,
        setReconciliationResult,
        setLedgerData,
        setStatementData,
        setReconciliationType,
        addAssignedCase,
        updateAssignedCase,
      }}
    >
      {children}
    </ReconContext.Provider>
  );
}

export function useRecon() {
  const context = useContext(ReconContext);
  if (!context) {
    throw new Error('useRecon must be used within a ReconProvider');
  }
  return context;
}
