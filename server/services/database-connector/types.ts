/**
 * Type definitions for the database connector
 */

export type DatabaseType = 'sqlserver' | 'mysql' | 'postgres' | 'oracle';

export interface DatabaseCredentials {
  username: string;
  password: string;
  useWindowsAuth?: boolean;
  connectionString?: string;
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

export interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
  metadata?: {
    totalRows?: number;
    executionTime?: number;
    affectedRows?: number;
    warnings?: string[];
  };
}

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  referencedTable?: string;
  referencedColumn?: string;
  description?: string;
  length?: number;
  precision?: number;
  scale?: number;
}

export interface TableSchema {
  tableName: string;
  columns: ColumnDefinition[];
  primaryKeys: string[];
  foreignKeys: {
    column: string;
    referencedTable: string;
    referencedColumn: string;
  }[];
  indexes: {
    name: string;
    columns: string[];
    isUnique: boolean;
  }[];
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: string;
}

export interface TransformConfig {
  filterConditions?: FilterCondition[];
  dateFormatOptions?: DateFormatConfig[];
  sortOptions?: SortOption[];
  pagination?: {
    limit: number;
    offset: number;
  };
}

export interface FilterCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'in' | 'between';
  value: any;
}

export interface DateFormatConfig {
  field: string;
  format: string;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QueryBuilderConfig {
  select: string[];
  from: string;
  joins?: JoinConfig[];
  where?: WhereCondition[];
  groupBy?: string[];
  having?: WhereCondition[];
  orderBy?: SortOption[];
  limit?: number;
  offset?: number;
}

export interface JoinConfig {
  type: 'inner' | 'left' | 'right' | 'full';
  table: string;
  on: {
    leftField: string;
    operator: string;
    rightField: string;
  };
}

export interface WhereCondition {
  field: string;
  operator: string;
  value: any;
  logic?: 'and' | 'or';
}

export interface QueryOptions {
  parameters?: Record<string, any>;
  timeout?: number;
  maxRows?: number;
  transformConfig?: TransformConfig;
  useQueryBuilder?: boolean;
  queryBuilderConfig?: QueryBuilderConfig;
}

export interface ExternalDbConnector {
  testConnection(): Promise<void>;
  executeQuery(query: string, parameters?: Record<string, any>): Promise<QueryResult>;
  listTables(): Promise<string[]>;
  getTableSchema(tableName: string): Promise<TableSchema>;
  close(): Promise<void>;
}