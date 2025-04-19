/**
 * Type definitions for database connector functionality
 */

// Supported database types
export type DatabaseType = 'postgres' | 'mysql' | 'sqlserver' | 'oracle';

// Configuration for a database connection
export interface DatabaseConfig {
  id: string;
  name: string;
  description: string;
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  schema?: string;
  credentials: string; // encrypted credentials
  createdAt: string;
  updatedAt: string;
  lastConnected?: string;
  tags: string | string[] | null; // can be comma-separated string, array, or null
  isActive: boolean;
  createdBy: string;
  
  // Additional properties for connection testing and creation but not stored
  username?: string;
  user?: string;
  password?: string;
  ssl?: boolean;
  rejectUnauthorized?: boolean;
}

// Result of a database connection test
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency?: number;
  serverInfo?: Record<string, any>;
}

// Result of a database query
export interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  metadata: {
    executionTime: number;
    query: string;
  };
}

// Options for building a query
export interface QueryOptions {
  table: string;
  columns?: string[];
  where?: Record<string, any>;
  orderBy?: Array<{
    column: string;
    direction: 'asc' | 'desc';
  }>;
  limit?: number;
  offset?: number;
}

// Schema information for a table
export interface TableSchema {
  tableName: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    defaultValue?: any;
  }>;
  primaryKey?: string[];
  foreignKeys?: Array<{
    column: string;
    referencedTable: string;
    referencedColumn: string;
  }>;
  indexes?: Array<{
    name: string;
    columns: string[];
    isUnique: boolean;
  }>;
}

// Interface for database connectors
export interface ExternalDbConnector {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  testConnection(): Promise<ConnectionTestResult>;
  executeQuery(query: string, params?: any[]): Promise<QueryResult>;
  buildQuery(options: QueryOptions): Promise<QueryResult>;
  listTables(): Promise<string[]>;
  getTableSchema(tableName: string): Promise<TableSchema>;
}