/**
 * Type definitions for the external database connector service
 */

export type DatabaseType = 'sqlserver' | 'mysql' | 'postgres' | 'oracle';

export interface DatabaseCredentials {
  username: string;
  password: string;
  useWindowsAuth?: boolean; // For SQL Server
  connectionString?: string; // For direct connection string
  useSsl?: boolean;
}

export interface DatabaseConfig {
  id: string;
  name: string;
  description: string;
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  schema?: string;
  credentials: DatabaseCredentials;
  createdAt: string;
  updatedAt: string;
  lastConnected?: string;
  tags?: string[];
  isActive: boolean;
  createdBy: string;
}

export interface QueryOptions {
  parameters?: Record<string, any>;
  timeout?: number;
  useQueryBuilder?: boolean;
  queryBuilderConfig?: QueryBuilderConfig;
  transform?: boolean;
  transformConfig?: TransformConfig;
  maxRows?: number;
}

export interface QueryResult {
  columns: ColumnInfo[];
  rows: any[];
  rowCount: number;
  executionTime: number;
  metadata?: Record<string, any>;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  size?: number;
  precision?: number;
  scale?: number;
}

export interface TableSchema {
  name: string;
  columns: ColumnInfo[];
  primaryKey?: string[];
  foreignKeys?: ForeignKeyInfo[];
  indices?: IndexInfo[];
}

export interface ForeignKeyInfo {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
}

export interface IndexInfo {
  name: string;
  columns: string[];
  isUnique: boolean;
}

export interface QueryBuilderConfig {
  table: string;
  columns?: string[];
  where?: WhereCondition[];
  orderBy?: OrderByConfig[];
  groupBy?: string[];
  limit?: number;
  offset?: number;
  joins?: JoinConfig[];
}

export interface WhereCondition {
  column: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'between' | 'isNull' | 'isNotNull';
  value?: any;
  values?: any[]; // For 'in' or 'between' operators
  logic?: 'and' | 'or'; // Logic operator to connect with next condition
}

export interface OrderByConfig {
  column: string;
  direction: 'asc' | 'desc';
}

export interface JoinConfig {
  type: 'inner' | 'left' | 'right' | 'full';
  table: string;
  alias?: string;
  on: {
    leftColumn: string;
    rightColumn: string;
  }[];
}

export interface TransformConfig {
  renameColumns?: Record<string, string>;
  calculateFields?: CalculatedField[];
  filterRows?: FilterCondition[];
  formatDates?: DateFormatConfig[];
  excludeColumns?: string[];
}

export interface CalculatedField {
  name: string;
  formula: string; // e.g. "{column1} + {column2}" or more complex expressions
}

export interface FilterCondition {
  column: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
}

export interface DateFormatConfig {
  column: string;
  format: string; // e.g. "YYYY-MM-DD"
}

export interface ExternalDbConnector {
  testConnection(): Promise<void>;
  executeQuery(query: string, parameters?: Record<string, any>): Promise<QueryResult>;
  listTables(): Promise<string[]>;
  getTableSchema(tableName: string): Promise<TableSchema>;
  close(): Promise<void>;
}