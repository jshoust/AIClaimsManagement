/**
 * Type definitions for database connector
 */

// Supported database types
export type DatabaseType = 'mysql' | 'postgres' | 'sqlserver' | 'oracle';

// Database configuration
export interface DatabaseConfig {
  id: string;
  name: string;
  description?: string;
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  schema?: string;
  credentials: string; // JSON string with username and password
  createdAt: string;
  updatedAt: string;
  lastConnected?: string;
  tags: string | null;
  isActive: boolean;
  createdBy: string;
}

// Connection test result
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
  latency?: number;
}

// Table schema definition
export interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isAutoIncrement?: boolean;
  defaultValue?: string;
  comment?: string;
}

// Table schema
export interface TableSchema {
  tableName: string;
  columns: TableColumn[];
  primaryKeys: string[];
  foreignKeys?: { 
    columnName: string; 
    referencedTable: string; 
    referencedColumn: string 
  }[];
}

// Query results
export interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  metadata?: {
    executionTime: number;
    query: string;
  };
}

// Query options for the query builder
export interface QueryOptions {
  table: string;
  columns?: string[];
  where?: Record<string, any>;
  orderBy?: Array<{ column: string; direction: 'asc' | 'desc' }>;
  limit?: number;
  offset?: number;
}

// External database connector interface
export interface ExternalDbConnector {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  testConnection(): Promise<ConnectionTestResult>;
  executeQuery(query: string, params?: any[]): Promise<QueryResult>;
  listTables(): Promise<string[]>;
  getTableSchema(tableName: string): Promise<TableSchema>;
  buildQuery(options: QueryOptions): Promise<QueryResult>;
}