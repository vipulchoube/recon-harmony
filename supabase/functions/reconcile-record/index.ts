import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RecordPair {
  ledgerRecord: Record<string, string>;
  statementRecord: Record<string, string> | null;
  index: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ledgerRecord, statementRecord, index } = await req.json() as RecordPair;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert trade reconciliation analyst. Your task is to analyze a ledger record and its corresponding statement record (if available) to determine the exception code.

Exception codes are:
- 101: Feed Issue - No matching settlement record found in statement
- 102: Cancelled Trade - Trade cancelled in ledger but settled in statement
- 103: Unsettled Trade - Trade open in ledger but shows as settled in statement
- 104: Not Settled in Market - Manual settlement flagged but not settled in market
- 105: Wrong Account - Balance Pool mismatch between ledger and statement
- 106: Partial Settlement - Trade only partially settled
- OTHER: Data quality issues, missing ISIN, or other edge cases

Analyze the data and determine the most appropriate exception code based on:
1. Trade status mismatches
2. Settlement status discrepancies
3. Balance pool differences
4. Quantity/amount partial matches
5. Missing or incomplete data

You MUST respond with a JSON object containing:
{
  "exception_code": "101" | "102" | "103" | "104" | "105" | "106" | "OTHER",
  "reason": "Brief explanation of why this exception code was assigned",
  "confidence": 0.0 to 1.0
}`;

    const userPrompt = `Analyze this trade record pair:

LEDGER RECORD:
${JSON.stringify(ledgerRecord, null, 2)}

STATEMENT RECORD:
${statementRecord ? JSON.stringify(statementRecord, null, 2) : "NO MATCHING STATEMENT RECORD FOUND"}

Determine the exception code and provide your analysis.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the AI response
    let result;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Fallback to deterministic logic
      result = fallbackAnalysis(ledgerRecord, statementRecord);
    }

    // Build the exception record
    const exceptionRecord = {
      index,
      transaction_ref: ledgerRecord.TransactionRef || "",
      ledger_swiftref: ledgerRecord.Swiftref || "",
      settlement_swiftref: statementRecord?.Swiftref || null,
      isin: ledgerRecord["Security ISIN"] || "",
      value_date: ledgerRecord.ValueDate || "",
      amount: parseInt(ledgerRecord.Amount || "0", 10),
      quantity: parseInt(ledgerRecord.Quantity || "0", 10),
      exception_code: result.exception_code || "OTHER",
      reason_code: result.exception_code || "OTHER",
      reason: result.reason || "AI analysis",
      confidence: result.confidence || 0.8,
      match_status: "UNMATCHED",
    };

    return new Response(JSON.stringify({ success: true, record: exceptionRecord }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Reconciliation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Fallback deterministic analysis
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
