import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  ledgerData?: string;
  statementData: string;
  targetSchema?: string;
  reconciliationType?: 'position' | 'nostro' | 'cash';
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
    const { ledgerData, statementData, targetSchema, reconciliationType, analysisType } = await req.json() as AnalysisRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Processing ${analysisType} analysis request for ${reconciliationType || 'default'} reconciliation`);

    let systemPrompt = '';
    let userPrompt = '';

    if (analysisType === 'data_quality') {
      systemPrompt = `You are a data quality analyst AI agent specialized in trade reconciliation. Analyze the provided CSV data and identify:
1. Data quality issues (nulls, duplicates, invalid formats)
2. Column data type mismatches
3. Referential integrity issues
4. Business rule violations for trade data (ISIN validation, date formats, quantity/price validation)

IMPORTANT: You are analyzing REAL uploaded files. Perform actual data analysis:
- Count actual duplicate rows by comparing key fields (like Transaction_Ref, ISIN combinations)
- Check for actual null/empty values in each column
- Validate actual date formats in date columns
- Validate actual numeric values in quantity/amount columns
- Check ISIN format validity (12 characters, alphanumeric)

If the data is clean and valid, report it as PASSING. Do not fail checks just for theoretical issues.

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
  },
  "ledgerAnalysis": {
    "rowCount": number,
    "columnCount": number,
    "issues": []
  },
  "statementAnalysis": {
    "rowCount": number,
    "columnCount": number,
    "issues": []
  }
}`;
      userPrompt = `Analyze the following data files for quality issues. Perform ACTUAL checks on the real data provided:

${ledgerData ? `LEDGER DATA:
${ledgerData}

` : ''}STATEMENT DATA:
${statementData}

${targetSchema ? `TARGET SCHEMA (for reference):
${targetSchema}` : ''}

Perform these specific checks on the ACTUAL data:
1. NULL/EMPTY CHECK: Count rows with null or empty values in each column
2. DUPLICATE CHECK: Count actual duplicate rows based on key fields (Transaction_Ref, ISIN)
3. DATE FORMAT CHECK: Verify date columns have consistent valid formats
4. NUMERIC VALIDATION: Verify quantity and amount columns contain valid numbers
5. ISIN VALIDATION: Check ISIN format (should be 12 alphanumeric characters)
6. REQUIRED FIELDS: Check that key fields are populated

Return the results as JSON. Mark checks as PASSED if no issues found.`;
    } else if (analysisType === 'schema_analysis') {
      systemPrompt = `You are a schema analysis AI agent. Analyze statement CSV columns and map them to target schema columns.

IMPORTANT: Keep response CONCISE. Return only the essential mappings.

Respond with this EXACT JSON structure (no markdown):
{
  "statementSchema": [
    {"columnName": "string", "inferredType": "STRING|INTEGER|DECIMAL|DATE", "nullable": false, "sampleValues": [], "issues": []}
  ],
  "targetSchema": [],
  "mappings": [
    {"ledgerColumn": "target column name", "statementColumn": "statement column name", "matchConfidence": 0.95, "transformationNeeded": false, "transformationRule": ""}
  ],
  "schemaCorrections": []
}

Match columns by name similarity. Return matchConfidence between 0 and 1. Keep sampleValues empty to reduce response size.`;
      userPrompt = `Map statement columns to target schema columns.

TARGET SCHEMA:
${targetSchema}

STATEMENT HEADERS (first line):
${statementData.split('\n')[0]}

Return the JSON mapping. Be concise.`;
    } else if (analysisType === 'generate_etl') {
      systemPrompt = `You are an ETL script generator AI agent specialized in Oracle database. Generate a CONCISE PL/SQL ETL script that:
1. Creates staging tables for LEDGER data and STATEMENT data
2. Performs basic data transformation between ledger and statement
3. Creates a simple reconciliation output table

Keep the script SHORT and focused - max 100 lines of SQL. This is a proof of concept.

IMPORTANT: Return ONLY a valid JSON object (no markdown). Use this exact structure:
{
  "script": "-- Your SQL script here (use \\n for newlines)",
  "tables": [{"name": "table_name", "purpose": "description", "columns": []}],
  "procedures": [],
  "executionOrder": ["step1", "step2"]
}`;
      userPrompt = `Based on the LEDGER and STATEMENT data structures, generate a SHORT Oracle PL/SQL ETL script (max 100 lines):

LEDGER DATA SAMPLE:
${ledgerData || 'No ledger data provided'}

STATEMENT DATA SAMPLE:
${statementData}

Generate a production-ready Oracle ETL script with staging tables for LEDGER and STATEMENT, transformations, and reconciliation logic for ${reconciliationType || 'position'} reconciliation.`;
    } else if (analysisType === 'reconciliation') {
      systemPrompt = `You are a trade reconciliation AI agent. Analyze ledger and statement data to perform matching and exception detection.

${EXCEPTION_RULES}

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
        "exception_code": "101" | "102" | "103" | "104" | "105" | "106" | "OTHER",
        "reason_code": "FEED ISSUE" | "TRADE CANCELLED IN GLOSS" | "UNSETTLED IN GLOSS" | "NOT SETTLED IN MARKET" | "BOOKED TO WRONG ACCOUNT" | "PARTIAL SETTLEMENT" | "OTHER",
        "match_status": "MATCHED" | "UNMATCHED",
        "confidence": number (0-1),
        "transaction_ref": "string",
        "ledger_swiftref": "string",
        "settlement_swiftref": "string or null",
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
        "match_status": "MATCHED" | "UNMATCHED",
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

IMPORTANT:
- Analyze every row from both ledger and statement
- Apply matching rules based on exception codes 101-106
- For any exception not fitting 101-106, classify as OTHER with detailed explanation
- Calculate confidence scores based on how many matching criteria are met
- Generate expectedOutput for all records that have exceptions
- If a record has a mismatch that does not clearly fit exception codes 101-106, you MUST classify it as OTHER and provide a detailed explanation in other_description.`;
      userPrompt = `Perform trade reconciliation on these CSV files:

LEDGER DATA:
${ledgerData}

STATEMENT DATA:
${statementData}

Match records between ledger and statement using the exception rules. For each record:
1. Try to find a match using Transaction_Ref, SwiftRef, and other key fields
2. Determine the exception code (101-106 or OTHER) based on the mismatch type
3. Calculate a confidence score for matched records
4. Generate the expected output with reason codes

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
      console.log("Raw content preview:", content.substring(0, 500));
      
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
      } else if (analysisType === 'schema_analysis') {
        // Try to extract partial schema analysis from truncated JSON
        console.log("Attempting to extract partial schema analysis...");
        
        // Try to extract mappings array even if JSON is incomplete
        const mappingsMatch = content.match(/"mappings"\s*:\s*\[([\s\S]*?)(?:\]|$)/);
        const statementSchemaMatch = content.match(/"statementSchema"\s*:\s*\[([\s\S]*?)(?:\]|$)/);
        
        // Build partial result with defaults
        parsedResult = {
          statementSchema: [],
          targetSchema: [],
          mappings: [],
          schemaCorrections: []
        };
        
        // Try to parse extracted mappings
        if (mappingsMatch) {
          try {
            // Complete the array and parse
            let mappingsJson = '[' + mappingsMatch[1];
            // Try to close any unclosed objects/arrays
            const openBraces = (mappingsJson.match(/{/g) || []).length;
            const closeBraces = (mappingsJson.match(/}/g) || []).length;
            for (let i = 0; i < openBraces - closeBraces; i++) {
              mappingsJson += '}';
            }
            mappingsJson += ']';
            parsedResult.mappings = JSON.parse(mappingsJson);
          } catch (e) {
            console.log("Could not parse mappings:", e);
          }
        }
        
        // Try to parse statement schema
        if (statementSchemaMatch) {
          try {
            let schemaJson = '[' + statementSchemaMatch[1];
            const openBraces = (schemaJson.match(/{/g) || []).length;
            const closeBraces = (schemaJson.match(/}/g) || []).length;
            for (let i = 0; i < openBraces - closeBraces; i++) {
              schemaJson += '}';
            }
            schemaJson += ']';
            parsedResult.statementSchema = JSON.parse(schemaJson);
          } catch (e) {
            console.log("Could not parse statement schema:", e);
          }
        }
      } else {
        parsedResult = { rawResponse: content };
      }
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