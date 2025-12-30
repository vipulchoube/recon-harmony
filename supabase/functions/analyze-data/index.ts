import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  ledgerData: string;
  statementData: string;
  analysisType: 'data_quality' | 'schema_analysis' | 'generate_etl';
}

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
      systemPrompt = `You are an ETL script generator AI agent specialized in Oracle database. Generate a complete PL/SQL ETL script that:
1. Creates staging tables for ledger and statement data
2. Performs data transformation and cleansing
3. Handles data type conversions
4. Implements error logging
5. Creates the final reconciliation output table
6. Includes exception handling

The script should be production-ready for Oracle 19c or later.

Respond with a JSON object:
{
  "script": "-- Full PL/SQL script here",
  "tables": [
    {
      "name": "string",
      "purpose": "string",
      "columns": [{"name": "string", "type": "string", "nullable": boolean}]
    }
  ],
  "procedures": [
    {
      "name": "string", 
      "purpose": "string",
      "parameters": ["string"]
    }
  ],
  "executionOrder": ["string"]
}`;
      userPrompt = `Based on these CSV structures, generate a complete Oracle PL/SQL ETL script:

LEDGER DATA SAMPLE:
${ledgerData}

STATEMENT DATA SAMPLE:
${statementData}

Generate a production-ready Oracle ETL script with staging tables, transformations, and reconciliation logic.`;
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
      parsedResult = { rawResponse: content };
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
