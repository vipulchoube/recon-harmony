import { useState, useCallback, useRef } from "react";
import { ReconciliationResult, ExceptionCode, ExceptionRecord, OtherException } from "@/types/recon";
import { toast } from "sonner";
import { getOpenExceptionRecords } from "@/data/sampleReconciliationData";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: "info" | "success" | "error" | "processing";
}

export interface ReconciliationState {
  isReconciling: boolean;
  reconciliationResult: ReconciliationResult | null;
  error: string | null;
  progress: {
    currentBatch: number;
    totalBatches: number;
    processedRecords: number;
    totalRecords: number;
  } | null;
  activityLogs: ActivityLogEntry[];
}

export function useReconciliation() {
  const [state, setState] = useState<ReconciliationState>({
    isReconciling: false,
    reconciliationResult: null,
    error: null,
    progress: null,
    activityLogs: [],
  });
  
  const abortRef = useRef(false);

  const addLog = (message: string, type: ActivityLogEntry["type"] = "info") => {
    const entry: ActivityLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      message,
      type,
    };
    setState((prev) => ({
      ...prev,
      activityLogs: [...prev.activityLogs, entry],
    }));
  };

  const runReconciliation = useCallback(async () => {
    abortRef.current = false;
    
    setState({
      isReconciling: true,
      error: null,
      reconciliationResult: null,
      progress: null,
      activityLogs: [],
    });

    addLog("Starting AI reconciliation process...", "info");

    try {
      const { ledgerRecords, statementMap } = getOpenExceptionRecords();
      const totalRecords = ledgerRecords.length;

      if (totalRecords === 0) {
        addLog("No open exceptions to process", "info");
        toast.info("No open exceptions to process");
        setState((prev) => ({ ...prev, isReconciling: false }));
        return;
      }

      addLog(`Found ${totalRecords} exceptions to process`, "info");
      addLog("Initializing AI analysis engine...", "processing");
      toast.info(`Processing ${totalRecords} exceptions with AI...`);

      // Initialize result structure
      const exceptionRecords: ExceptionRecord[] = [];
      const otherExceptions: OtherException[] = [];
      const exceptionCounts = new Map<ExceptionCode, number>();

      // Process records one at a time
      for (let i = 0; i < ledgerRecords.length; i++) {
        if (abortRef.current) {
          addLog("Reconciliation cancelled by user", "error");
          toast.info("Reconciliation cancelled");
          break;
        }

        const ledgerRecord = ledgerRecords[i];
        const transactionRef = ledgerRecord.TransactionRef;
        const statementRecord = statementMap.get(transactionRef) || null;

        addLog(`Analyzing record ${i + 1}/${totalRecords}: ${transactionRef}`, "processing");

        // Update progress
        setState((prev) => ({
          ...prev,
          progress: {
            currentBatch: i + 1,
            totalBatches: totalRecords,
            processedRecords: i,
            totalRecords,
          },
        }));

        try {
          // Call the AI edge function
          const { data, error } = await supabase.functions.invoke("reconcile-record", {
            body: {
              ledgerRecord,
              statementRecord,
              index: i,
            },
          });

          if (error) {
            console.error("Edge function error:", error);
            addLog(`Error on record ${transactionRef}, using fallback analysis`, "error");
            // Use fallback on error
            const fallback = fallbackAnalysis(ledgerRecord, statementRecord);
            processResult(fallback, ledgerRecord, statementRecord, i, exceptionRecords, otherExceptions, exceptionCounts);
            addLog(`Classified ${transactionRef} as ${fallback.exception_code} (fallback)`, "info");
          } else if (data?.record) {
            const record = data.record;
            const code = record.exception_code as ExceptionCode;
            
            addLog(`AI classified ${transactionRef} as ${code} (confidence: ${(record.confidence * 100).toFixed(0)}%)`, "success");
            exceptionCounts.set(code, (exceptionCounts.get(code) || 0) + 1);

            if (code === "OTHER") {
              otherExceptions.push({
                transaction_ref: record.transaction_ref,
                ledger_swiftref: record.ledger_swiftref,
                settlement_swiftref: record.settlement_swiftref,
                isin: record.isin,
                value_date: record.value_date,
                amount: record.amount,
                quantity: record.quantity,
                ledger_index: i,
                settlement_index: 0,
                other_subtype: "AI_CLASSIFIED",
                other_description: record.reason || "AI analysis",
                reason_code: "OTHER",
              });
            } else {
              exceptionRecords.push({
                transaction_ref: record.transaction_ref,
                ledger_swiftref: record.ledger_swiftref,
                settlement_swiftref: record.settlement_swiftref,
                isin: record.isin,
                value_date: record.value_date,
                amount: record.amount,
                quantity: record.quantity,
                exception_code: code,
                reason_code: code,
                match_status: "UNMATCHED",
                confidence: record.confidence || 0.8,
              });
            }
          }
        } catch (fetchError) {
          console.error("Fetch error for record", i, fetchError);
          addLog(`Network error on record ${transactionRef}, using fallback`, "error");
          // Use fallback on network error
          const fallback = fallbackAnalysis(ledgerRecord, statementRecord);
          processResult(fallback, ledgerRecord, statementRecord, i, exceptionRecords, otherExceptions, exceptionCounts);
          addLog(`Classified ${transactionRef} as ${fallback.exception_code} (fallback)`, "info");
        }

        // Update the result in real-time after each record
        const currentResult: ReconciliationResult = {
          summary: Array.from(exceptionCounts.entries()).map(([code, count]) => ({
            exceptionCode: code,
            exceptionDescription: getExceptionDescription(code),
            count,
          })),
          matching: {
            matchedCount: 0,
            unmatchedCount: exceptionRecords.length + otherExceptions.length,
            totalRecords: totalRecords,
            matchedRecords: [],
          },
          exceptions: {
            exceptionCounts: Array.from(exceptionCounts.entries())
              .filter(([code]) => code !== "OTHER")
              .map(([code, count]) => ({ code, count })),
            records: [...exceptionRecords],
            otherExceptions: [...otherExceptions],
          },
          expectedOutput: [],
        };

        setState((prev) => ({
          ...prev,
          reconciliationResult: currentResult,
          progress: {
            currentBatch: i + 1,
            totalBatches: totalRecords,
            processedRecords: i + 1,
            totalRecords,
          },
        }));

        // Small delay between requests to avoid rate limiting
        if (i < ledgerRecords.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      addLog(`Reconciliation complete! Processed ${totalRecords} records`, "success");
      setState((prev) => ({
        ...prev,
        isReconciling: false,
      }));

      toast.success(`Reconciliation completed! Processed ${totalRecords} records with AI.`);
    } catch (error) {
      console.error("Reconciliation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Reconciliation failed";
      addLog(`Fatal error: ${errorMessage}`, "error");
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isReconciling: false,
        progress: null,
      }));
      toast.error("Reconciliation failed", { description: errorMessage });
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    setState({
      isReconciling: false,
      reconciliationResult: null,
      error: null,
      progress: null,
      activityLogs: [],
    });
  }, []);

  return { state, runReconciliation, reset };
}

function processResult(
  result: { exception_code: string; reason: string; confidence: number },
  ledgerRecord: Record<string, string>,
  statementRecord: Record<string, string> | null,
  index: number,
  exceptionRecords: ExceptionRecord[],
  otherExceptions: OtherException[],
  exceptionCounts: Map<ExceptionCode, number>
) {
  const code = result.exception_code as ExceptionCode;
  exceptionCounts.set(code, (exceptionCounts.get(code) || 0) + 1);

  if (code === "OTHER") {
    otherExceptions.push({
      transaction_ref: ledgerRecord.TransactionRef,
      ledger_swiftref: ledgerRecord.Swiftref || "",
      settlement_swiftref: statementRecord?.Swiftref || "",
      isin: ledgerRecord["Security ISIN"] || "",
      value_date: ledgerRecord.ValueDate || "",
      amount: parseInt(ledgerRecord.Amount || "0", 10),
      quantity: parseInt(ledgerRecord.Quantity || "0", 10),
      ledger_index: index,
      settlement_index: 0,
      other_subtype: "FALLBACK",
      other_description: result.reason,
      reason_code: "OTHER",
    });
  } else {
    exceptionRecords.push({
      transaction_ref: ledgerRecord.TransactionRef,
      ledger_swiftref: ledgerRecord.Swiftref || "",
      settlement_swiftref: statementRecord?.Swiftref || null,
      isin: ledgerRecord["Security ISIN"] || "",
      value_date: ledgerRecord.ValueDate || "",
      amount: parseInt(ledgerRecord.Amount || "0", 10),
      quantity: parseInt(ledgerRecord.Quantity || "0", 10),
      exception_code: code,
      reason_code: code,
      match_status: "UNMATCHED",
      confidence: result.confidence,
    });
  }
}

function fallbackAnalysis(
  ledgerRecord: Record<string, string>,
  statementRecord: Record<string, string> | null
): { exception_code: string; reason: string; confidence: number } {
  const tradeStatus = ledgerRecord.TradeStatus?.toUpperCase() || "";
  const settlementStatus = ledgerRecord.SettlementStatus?.toUpperCase() || "";

  if (!statementRecord) {
    return { exception_code: "101", reason: "No matching settlement record found", confidence: 1.0 };
  }

  const statementState = statementRecord["Settlement State"]?.toUpperCase() || "";
  const manualSettlement = statementRecord.ManualSettlement?.toUpperCase() || "";
  const ledgerBalancePool = ledgerRecord.Balance_Pool || "";
  const statementBalancePool = statementRecord.Balance_Pool || "";

  if (tradeStatus === "CANCELLED" && statementState === "SETTLED") {
    return { exception_code: "102", reason: "Trade cancelled in ledger but settled in statement", confidence: 1.0 };
  }

  if (settlementStatus === "OPEN" && statementState === "SETTLED") {
    return { exception_code: "103", reason: "Trade open in ledger but settled in statement", confidence: 1.0 };
  }

  if (manualSettlement === "Y" && statementState !== "SETTLED") {
    return { exception_code: "104", reason: "Manual settlement flagged but not settled in market", confidence: 1.0 };
  }

  if (ledgerBalancePool && statementBalancePool && ledgerBalancePool !== statementBalancePool) {
    return { exception_code: "105", reason: "Balance Pool mismatch", confidence: 1.0 };
  }

  if (settlementStatus === "PARTIALLY SETTLED" || statementState === "PARTIALLY SETTLED") {
    return { exception_code: "106", reason: "Partial settlement detected", confidence: 1.0 };
  }

  return { exception_code: "OTHER", reason: "Unclassified exception", confidence: 0.5 };
}

function getExceptionDescription(code: ExceptionCode): string {
  const descriptions: Record<ExceptionCode, string> = {
    "101": "Feed Issue",
    "102": "Cancelled Trade",
    "103": "Unsettled Trade",
    "104": "Not Settled in Market",
    "105": "Wrong Account",
    "106": "Partial Settlement",
    OTHER: "Other Exception",
  };
  return descriptions[code] || "Unknown Exception";
}
