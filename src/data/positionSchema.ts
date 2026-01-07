export type ReconciliationType = 'position' | 'nostro' | 'cash';

export interface SchemaColumn {
  columnName: string;
  inferredType: 'STRING' | 'INTEGER' | 'DECIMAL' | 'DATE' | 'BOOLEAN';
  nullable: boolean;
  sampleValues: string[];
  issues: string[];
}

export const positionSchema: SchemaColumn[] = [
  {
    columnName: "TransactionRef",
    inferredType: "STRING",
    nullable: false,
    sampleValues: ["250901", "62125", "231092"],
    issues: []
  },
  {
    columnName: "Swiftref",
    inferredType: "STRING",
    nullable: false,
    sampleValues: ["AP6981789Q3", "AP8206662Q2", "AP5523132Q4"],
    issues: []
  },
  {
    columnName: "Quantity",
    inferredType: "INTEGER",
    nullable: false,
    sampleValues: ["159789", "85091", "311334"],
    issues: []
  },
  {
    columnName: "Settled Quantity",
    inferredType: "INTEGER",
    nullable: false,
    sampleValues: ["159789", "85091", "311334"],
    issues: []
  },
  {
    columnName: "Price",
    inferredType: "DECIMAL",
    nullable: false,
    sampleValues: ["23.65", "89.12", "11.45"],
    issues: []
  },
  {
    columnName: "Net Amount",
    inferredType: "DECIMAL",
    nullable: false,
    sampleValues: ["3779297.85", "7570078.92", "3564774.30"],
    issues: []
  },
  {
    columnName: "Balance_Pool",
    inferredType: "STRING",
    nullable: false,
    sampleValues: ["442494697", "234842355", "903707764"],
    issues: []
  },
  {
    columnName: "Security ISIN",
    inferredType: "STRING",
    nullable: false,
    sampleValues: ["US000089573", "US000081466", "US000078680"],
    issues: []
  },
  {
    columnName: "Value_Date",
    inferredType: "DATE",
    nullable: false,
    sampleValues: ["22-Jul", "22-Jul", "21-Jul"],
    issues: []
  }
];

// All reconciliation types use the same schema for now
export const reconciliationSchemas: Record<ReconciliationType, SchemaColumn[]> = {
  position: positionSchema,
  nostro: positionSchema,
  cash: positionSchema,
};

export const reconciliationTypeLabels: Record<ReconciliationType, string> = {
  position: 'Position Recon',
  nostro: 'Nostro Recon',
  cash: 'Cash Recon',
};
