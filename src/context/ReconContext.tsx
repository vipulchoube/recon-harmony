import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Exception, UploadedFile, Reconciliation, CaseStatus, Comment } from '@/types/recon';
import { mockExceptions, mockUploadedFiles, mockReconciliations } from '@/data/mockData';

interface ReconContextType {
  exceptions: Exception[];
  uploadedFiles: UploadedFile[];
  reconciliations: Reconciliation[];
  updateExceptionStatus: (id: string, status: CaseStatus) => void;
  addComment: (exceptionId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  addUploadedFile: (file: UploadedFile) => void;
  updateFileProgress: (id: string, progress: number, status?: UploadedFile['status']) => void;
}

const ReconContext = createContext<ReconContextType | undefined>(undefined);

export function ReconProvider({ children }: { children: ReactNode }) {
  const [exceptions, setExceptions] = useState<Exception[]>(mockExceptions);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(mockUploadedFiles);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>(mockReconciliations);

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
        updateExceptionStatus,
        addComment,
        addUploadedFile,
        updateFileProgress,
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
