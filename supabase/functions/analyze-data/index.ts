import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  ledgerData: string;
  statementData: string;
  analysisType: 'data_quality' | 'schema_analysis' | 'generate_etl' | 'reconciliation';
}

const EXCEPTION_RULES = `
Exception Rules for Trade Reconciliation (codes 101-106):

101 - Feed Issue: Trades where settlement feed is missing or delayed. Match using Trade_Date + SWIFTRef + TransactionRef. If no matching record in Settlement File, flag as Feed Issue.

102 - Cancelled Trade: Lifecycle mismatch where internal shows CANCELLED but external shows SETTLED. Match by Transaction_Ref + SwiftRef. Flag if Ledger.Trade_Status = CANCELLED AND Settlement.Settlement_State = SETTLED.

103 - Unsettled Trade: Trades open internally but settled in market. Match by Transaction_Ref + SwiftRef. Flag if Ledger.Trade_Status = OPEN AND Settlement.Settlement_State = SETTLED.

104 - Not Settled in Market but Closed Internally: Trades manually marked settled internally but not in market. Match by Transaction_Ref + SWIFTRef + Quantity. Flag if Ledger.Status = MANUAL_SETTLED AND Settlement.Status != SETTLED.

105 - Booked to Wrong Account: Internal ledger recorded against incorrect account. Match all fields (Transaction_Ref, SwiftRef, Quantity, Amount, ValueDate) but BalancePool differs OR TradeType/Direction mismatch.

106 - Partial Settlement: Only portion of quantity settled. Match by Transaction_Ref + SWIFTRef + Quantity. Flag if Ledger.Settled_Quantity > Settlement.Settled_Quantity.

OTHER - Any exception that doesn't fit codes 101-106. Provide detailed description with other_subtype and other_description.
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ledgerData, statementData, analysisType } = await req.json() as AnalysisRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Processing ${analysisType} analysis request`);

    let systemPrompt = '';
    let userPrompt = '';

    if (analysisType === 'data_quality') {
      systemPrompt = `You are a data quality analyst AI agent specialized in trade reconciliation. Analyze the provided CSV data and identify:
1. Data quality issues (nulls, duplicates, invalid formats)
2. Column data type mismatches
3. Referential integrity issues
4. Business rule violations for trade data (ISIN validation, date formats, quantity/price validation)

Respond with a JSON object with this structure:
{
  "checks": [
    {
      "id": "string",
      "name": "string", 
      "passed": boolean,
      "severity": "error" | "warning" | "info",
      "details": "string",
      "affectedRows": number,
      "recommendation": "string"
    }
  ],
  "summary": {
    "totalChecks": number,
    "passed": number,
    "failed": number,
    "criticalIssues": number
  }
}`;
      userPrompt = `Analyze the following trade data for quality issues:

LEDGER DATA:
${ledgerData}

STATEMENT DATA:
${statementData}

Perform comprehensive data quality checks and return the results as JSON.`;
    } else if (analysisType === 'schema_analysis') {
      systemPrompt = `You are a schema analysis AI agent. Analyze the provided CSV data and:
1. Infer column data types
2. Detect schema mismatches between ledger and statement
3. Suggest schema corrections for invalid values
4. Map columns between the two datasets

Respond with a JSON object with this structure:
{
  "ledgerSchema": [
    {
      "columnName": "string",
      "inferredType": "STRING" | "INTEGER" | "DECIMAL" | "DATE" | "BOOLEAN",
      "nullable": boolean,
      "sampleValues": ["string"],
      "issues": ["string"]
    }
  ],
  "statementSchema": [...same structure...],
  "mappings": [
    {
      "ledgerColumn": "string",
      "statementColumn": "string",
      "matchConfidence": number,
      "transformationNeeded": boolean,
      "transformationRule": "string"
    }
  ],
  "schemaCorrections": [
    {
      "file": "ledger" | "statement",
      "column": "string",
      "currentValue": "string",
      "suggestedValue": "string",
      "reason": "string"
    }
  ]
}`;
      userPrompt = `Analyze the schema of these CSV files:

LEDGER DATA:
${ledgerData}

STATEMENT DATA:
${statementData}

Infer types, detect mismatches, and suggest corrections as JSON.`;
    } else if (analysisType === 'generate_etl') {
      systemPrompt = `You are an ETL script generator AI agent specialized in Oracle database. Generate a CONCISE PL/SQL ETL script that:
1. Creates staging tables for ledger and statement data
2. Performs basic data transformation
3. Creates a simple reconciliation output table

Keep the script SHORT and focused - max 100 lines of SQL. This is a proof of concept.

IMPORTANT: Return ONLY a valid JSON object (no markdown). Use this exact structure:
{
  "script": "-- Your SQL script here (use \\n for newlines)",
  "tables": [{"name": "table_name", "purpose": "description", "columns": []}],
  "procedures": [],
  "executionOrder": ["step1", "step2"]
}`;
      userPrompt = `Based on these CSV structures, generate a SHORT Oracle PL/SQL ETL script (max 100 lines):

LEDGER DATA SAMPLE:
${ledgerData}

STATEMENT DATA SAMPLE:
${statementData}

Generate a production-ready Oracle ETL script with staging tables, transformations, and reconciliation logic.`;
    } else if (analysisType === 'reconciliation') {
      systemPrompt = `You are a trade reconciliation AI agent. Analyze ledger and statement data to perform matching and exception detection.

${EXCEPTION_RULES}

CRITICAL RULES:
1. A "MATCHED" record is one where ALL key fields match: Transaction_Ref, SwiftRef, ISIN, Value_Date, Quantity, and Amount (within tolerance).
2. MATCHED records MUST ONLY appear in "matching.matchedRecords" - NEVER in "exceptions.records" or "otherExceptions".
3. "exceptions.records" MUST ONLY contain records with match_status = "UNMATCHED".
4. "otherExceptions" MUST ONLY contain UNMATCHED breaks that don't fit codes 101-106.
5. exception_code "OTHER" is ONLY valid for UNMATCHED records with breaks that don't fit 101-106.
6. A fully matched trade with NO discrepancies should have exception_code = null or be omitted from exceptions entirely.

You MUST respond with a JSON object with this EXACT structure:
{
  "summary": [
    {
      "exceptionCode": "101" | "102" | "103" | "104" | "105" | "106" | "OTHER",
      "exceptionDescription": "FEED ISSUE" | "CANCELLED TRADE" | "UNSETTLED TRADE" | "NOT SETTLED IN MARKET" | "BOOKED TO WRONG ACCOUNT" | "PARTIAL SETTLEMENT" | "OTHER",
      "count": number
    }
  ],
  "matching": {
    "matchedCount": number,
    "unmatchedCount": number,
    "totalRecords": number,
    "matchedRecords": [
      {
        "match_status": "MATCHED",
        "confidence": number (0-1),
        "transaction_ref": "string",
        "ledger_swiftref": "string",
        "settlement_swiftref": "string",
        "isin": "string",
        "quantity": number,
        "amount": number,
        "value_date": "string (DD-MMM format)"
      }
    ]
  },
  "exceptions": {
    "exceptionCounts": [
      {"code": "101" | "102" | "103" | "104" | "105" | "106" | "OTHER", "count": number}
    ],
    "records": [
      {
        "exception_code": "101" | "102" | "103" | "104" | "105" | "106" | "OTHER",
        "reason_code": "string",
        "match_status": "UNMATCHED",
        "confidence": number,
        "transaction_ref": "string",
        "ledger_swiftref": "string",
        "settlement_swiftref": "string or null",
        "isin": "string",
        "quantity": number,
        "amount": number,
        "value_date": "string"
      }
    ],
    "otherExceptions": [
      {
        "transaction_ref": "string",
        "ledger_index": number,
        "settlement_index": number or null,
        "other_subtype": "string",
        "other_description": "string (detailed AI-generated explanation)",
        "reason_code": "OTHER",
        "match_status": "UNMATCHED",
        "ledger_swiftref": "string",
        "settlement_swiftref": "string or null",
        "isin": "string",
        "value_date": "string"
      }
    ]
  },
  "expectedOutput": [
    {
      "department": "string or null",
      "balance_pool": "string or null",
      "security_isin": "string",
      "ledger_or_statement_break": "L" | "S",
      "direction": "Debit" | "Credit",
      "quantity": number,
      "amount": number,
      "currency": "string (e.g., USD)",
      "value_date": "string (DD-MMM format)",
      "our_settlement_ref": "string",
      "reason_code": "string (e.g., FEED ISSUE, TRADE CANCELLED, etc.)"
    }
  ]
}

VALIDATION CHECKLIST (verify before responding):
- [ ] Every record in exceptions.records has match_status = "UNMATCHED"
- [ ] Every record in otherExceptions has match_status = "UNMATCHED"  
- [ ] No record with match_status = "MATCHED" appears in exceptions.records or otherExceptions
- [ ] matchedRecords only contains fully matched trades with NO breaks`;
      userPrompt = `Perform trade reconciliation on these CSV files:

LEDGER DATA:
${ledgerData}

STATEMENT DATA:
${statementData}

Match records between ledger and statement using the exception rules. For each record:
1. Try to find a match using Transaction_Ref, SwiftRef, and other key fields
2. If ALL key fields match perfectly, mark as MATCHED and add ONLY to matchedRecords
3. If there is ANY mismatch, mark as UNMATCHED and add to exceptions.records with appropriate exception_code
4. For exceptions not fitting 101-106, use OTHER and add to otherExceptions
5. NEVER put MATCHED records in exceptions.records or otherExceptions

Return the complete reconciliation result as JSON.`;
    }

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
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response content from AI");
    }

    console.log(`${analysisType} analysis completed successfully`);

    // Parse JSON from the response (handle markdown code blocks)
    let parsedResult;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      parsedResult = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.log("Raw content length:", content.length);
      
      // For ETL analysis, try to extract the script from the rawResponse
      if (analysisType === 'generate_etl') {
        // Try to extract script from partial JSON or markdown code block
        const sqlMatch = content.match(/```(?:sql|plsql)?\s*([\s\S]*?)\s*```/);
        const scriptMatch = content.match(/"script"\s*:\s*"([\s\S]*?)(?:"|$)/);
        
        if (sqlMatch) {
          parsedResult = { 
            script: sqlMatch[1],
            tables: [],
            procedures: [],
            executionOrder: []
          };
        } else if (scriptMatch) {
          parsedResult = { 
            script: scriptMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'),
            tables: [],
            procedures: [],
            executionOrder: []
          };
        } else {
          // Use raw content as the script itself
          parsedResult = { rawResponse: content };
        }
      } else {
        parsedResult = { rawResponse: content };
      }
    }

    // Post-processing validation for reconciliation: remove MATCHED entries from exceptions
    if (analysisType === 'reconciliation' && parsedResult && !parsedResult.rawResponse) {
      console.log("Running post-processing validation for reconciliation results");
      
      // Filter out MATCHED entries from exceptions.records
      if (parsedResult.exceptions?.records) {
        const originalCount = parsedResult.exceptions.records.length;
        parsedResult.exceptions.records = parsedResult.exceptions.records.filter(
          (record: any) => record.match_status !== "MATCHED"
        );
        const removedCount = originalCount - parsedResult.exceptions.records.length;
        if (removedCount > 0) {
          console.log(`Removed ${removedCount} MATCHED entries from exceptions.records`);
        }
      }
      
      // Filter out MATCHED entries from otherExceptions
      if (parsedResult.exceptions?.otherExceptions) {
        const originalCount = parsedResult.exceptions.otherExceptions.length;
        parsedResult.exceptions.otherExceptions = parsedResult.exceptions.otherExceptions.filter(
          (record: any) => record.match_status !== "MATCHED"
        );
        const removedCount = originalCount - parsedResult.exceptions.otherExceptions.length;
        if (removedCount > 0) {
          console.log(`Removed ${removedCount} MATCHED entries from otherExceptions`);
        }
      }
      
      // Recompute exception counts based on filtered records
      if (parsedResult.exceptions?.records) {
        const countsByCode: Record<string, number> = {};
        parsedResult.exceptions.records.forEach((record: any) => {
          const code = record.exception_code || "OTHER";
          countsByCode[code] = (countsByCode[code] || 0) + 1;
        });
        
        // Add OTHER exceptions count
        if (parsedResult.exceptions.otherExceptions?.length > 0) {
          countsByCode["OTHER"] = (countsByCode["OTHER"] || 0) + parsedResult.exceptions.otherExceptions.length;
        }
        
        parsedResult.exceptions.exceptionCounts = Object.entries(countsByCode).map(([code, count]) => ({
          code,
          count
        }));
      }
      
      // Recompute summary counts
      if (parsedResult.summary && Array.isArray(parsedResult.summary)) {
        const summaryCountsByCode: Record<string, { desc: string; count: number }> = {};
        
        // Count from exceptions.records
        parsedResult.exceptions?.records?.forEach((record: any) => {
          const code = record.exception_code || "OTHER";
          const desc = record.reason_code || "OTHER";
          if (!summaryCountsByCode[code]) {
            summaryCountsByCode[code] = { desc, count: 0 };
          }
          summaryCountsByCode[code].count++;
        });
        
        // Count from otherExceptions
        parsedResult.exceptions?.otherExceptions?.forEach(() => {
          if (!summaryCountsByCode["OTHER"]) {
            summaryCountsByCode["OTHER"] = { desc: "OTHER", count: 0 };
          }
          summaryCountsByCode["OTHER"].count++;
        });
        
        parsedResult.summary = Object.entries(summaryCountsByCode).map(([code, data]) => ({
          exceptionCode: code,
          exceptionDescription: data.desc,
          count: data.count
        }));
      }
      
      console.log("Post-processing validation completed");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      analysisType,
      result: parsedResult 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-data function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});