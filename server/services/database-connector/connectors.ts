/**
 * Database connectors for different database types
 */

import { DatabaseConfig, DatabaseType, ExternalDbConnector, ConnectionTestResult, TableSchema, QueryResult, QueryOptions } from './types';
import { buildQueryForDialect } from './query-builder';

/**
 * Create a connector for the specified database configuration
 */
export function createConnector(config: DatabaseConfig): ExternalDbConnector {
  switch (config.type) {
    case 'postgres':
      return new PostgresConnector(config);
    case 'mysql':
      return new MySQLConnector(config);
    case 'sqlserver':
      return new SQLServerConnector(config);
    case 'oracle':
      return new OracleConnector(config);
    default:
      throw new Error(`Unsupported database type: ${config.type}`);
  }
}

/**
 * Base class for database connectors
 */
abstract class BaseConnector implements ExternalDbConnector {
  protected config: DatabaseConfig;
  protected isConnected: boolean = false;
  
  constructor(config: DatabaseConfig) {
    this.config = config;
  }
  
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract executeQuery(query: string, params?: any[]): Promise<QueryResult>;
  abstract listTables(): Promise<string[]>;
  abstract getTableSchema(tableName: string): Promise<TableSchema>;
  
  /**
   * Test database connection
   */
  async testConnection(): Promise<ConnectionTestResult> {
    try {
      await this.connect();
      return {
        success: true,
        message: 'Successfully connected to database',
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
      };
    } finally {
      try {
        await this.disconnect();
      } catch (error) {
        console.error('Error disconnecting during connection test:', error);
      }
    }
  }
  
  /**
   * Build and execute a query using the query builder
   */
  async buildQuery(options: QueryOptions): Promise<QueryResult> {
    const { query, params } = buildQueryForDialect(options, this.config.type);
    return this.executeQuery(query, params);
  }
}

/**
 * PostgreSQL connector
 */
class PostgresConnector extends BaseConnector {
  private client: any = null;
  
  async connect(): Promise<void> {
    if (this.isConnected) return;
    
    try {
      // In a real implementation, we would use the 'pg' package
      // This is a stub implementation for demonstration purposes
      // const { Client } = require('pg');
      
      const { username, password } = JSON.parse(this.config.credentials);
      
      this.client = {
        connect: async () => {},
        query: async (query: string, params: any[]) => {
          return {
            rows: [],
            rowCount: 0,
            fields: []
          };
        },
        end: async () => {}
      };
      
      // In a real implementation:
      // this.client = new Client({
      //   host: this.config.host,
      //   port: this.config.port,
      //   database: this.config.database,
      //   user: username,
      //   password: password,
      //   schema: this.config.schema
      // });
      
      // await this.client.connect();
      
      this.isConnected = true;
    } catch (error) {
      throw new Error(`Failed to connect to PostgreSQL database: ${error.message}`);
    }
  }
  
  async disconnect(): Promise<void> {
    if (!this.isConnected || !this.client) return;
    
    try {
      await this.client.end();
      this.isConnected = false;
    } catch (error) {
      throw new Error(`Failed to disconnect from PostgreSQL database: ${error.message}`);
    }
  }
  
  async executeQuery(query: string, params: any[] = []): Promise<QueryResult> {
    if (!this.isConnected) {
      await this.connect();
    }
    
    try {
      const startTime = Date.now();
      const result = await this.client.query(query, params);
      const executionTime = Date.now() - startTime;
      
      return {
        columns: result.fields.map((field: any) => field.name),
        rows: result.rows,
        rowCount: result.rowCount,
        metadata: {
          executionTime,
          query
        }
      };
    } catch (error) {
      throw new Error(`PostgreSQL query execution failed: ${error.message}`);
    }
  }
  
  async listTables(): Promise<string[]> {
    const query = `
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = $1 OR schemaname = 'public'
      ORDER BY tablename
    `;
    
    const schema = this.config.schema || 'public';
    const result = await this.executeQuery(query, [schema]);
    
    return result.rows.map((row: any) => row.tablename);
  }
  
  async getTableSchema(tableName: string): Promise<TableSchema> {
    const columnsQuery = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable = 'YES' as is_nullable,
        column_default,
        pg_get_serial_sequence(quote_ident($1), column_name) IS NOT NULL as is_auto_increment
      FROM information_schema.columns
      WHERE table_name = $1
        AND (table_schema = $2 OR table_schema = 'public')
      ORDER BY ordinal_position
    `;
    
    const pkQuery = `
      SELECT a.attname
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = $1::regclass
        AND i.indisprimary
    `;
    
    const fkQuery = `
      SELECT
        kcu.column_name,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = $1
        AND (tc.table_schema = $2 OR tc.table_schema = 'public')
    `;
    
    const schema = this.config.schema || 'public';
    
    // Get columns
    const columnsResult = await this.executeQuery(columnsQuery, [tableName, schema]);
    
    // Get primary keys
    const pkResult = await this.executeQuery(pkQuery, [`${schema}.${tableName}`]);
    const primaryKeys = pkResult.rows.map((row: any) => row.attname);
    
    // Get foreign keys
    const fkResult = await this.executeQuery(fkQuery, [tableName, schema]);
    const foreignKeys = fkResult.rows.map((row: any) => ({
      columnName: row.column_name,
      referencedTable: row.referenced_table,
      referencedColumn: row.referenced_column
    }));
    
    // Build columns
    const columns = columnsResult.rows.map((row: any) => {
      const isPrimaryKey = primaryKeys.includes(row.column_name);
      
      return {
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable,
        isPrimaryKey,
        isAutoIncrement: row.is_auto_increment,
        defaultValue: row.column_default
      };
    });
    
    return {
      tableName,
      columns,
      primaryKeys,
      foreignKeys
    };
  }
}

/**
 * MySQL connector
 */
class MySQLConnector extends BaseConnector {
  private connection: any = null;
  
  async connect(): Promise<void> {
    if (this.isConnected) return;
    
    try {
      // In a real implementation, we would use the 'mysql2/promise' package
      // This is a stub implementation for demonstration purposes
      // const mysql = require('mysql2/promise');
      
      const { username, password } = JSON.parse(this.config.credentials);
      
      this.connection = {
        execute: async (query: string, params: any[]) => {
          return [[], []];
        },
        end: async () => {}
      };
      
      // In a real implementation:
      // this.connection = await mysql.createConnection({
      //   host: this.config.host,
      //   port: this.config.port,
      //   database: this.config.database,
      //   user: username,
      //   password: password
      // });
      
      this.isConnected = true;
    } catch (error) {
      throw new Error(`Failed to connect to MySQL database: ${error.message}`);
    }
  }
  
  async disconnect(): Promise<void> {
    if (!this.isConnected || !this.connection) return;
    
    try {
      await this.connection.end();
      this.isConnected = false;
    } catch (error) {
      throw new Error(`Failed to disconnect from MySQL database: ${error.message}`);
    }
  }
  
  async executeQuery(query: string, params: any[] = []): Promise<QueryResult> {
    if (!this.isConnected) {
      await this.connect();
    }
    
    try {
      const startTime = Date.now();
      const [rows, fields] = await this.connection.execute(query, params);
      const executionTime = Date.now() - startTime;
      
      return {
        columns: fields ? fields.map((field: any) => field.name) : [],
        rows: Array.isArray(rows) ? rows : [],
        rowCount: Array.isArray(rows) ? rows.length : 0,
        metadata: {
          executionTime,
          query
        }
      };
    } catch (error) {
      throw new Error(`MySQL query execution failed: ${error.message}`);
    }
  }
  
  async listTables(): Promise<string[]> {
    const query = 'SHOW TABLES';
    const result = await this.executeQuery(query);
    
    return result.rows.map((row: any) => Object.values(row)[0] as string);
  }
  
  async getTableSchema(tableName: string): Promise<TableSchema> {
    // Get columns
    const columnsQuery = `DESCRIBE \`${tableName}\``;
    const columnsResult = await this.executeQuery(columnsQuery);
    
    // Get primary keys
    const pkQuery = `
      SELECT k.COLUMN_NAME
      FROM information_schema.table_constraints t
      JOIN information_schema.key_column_usage k
      USING(constraint_name,table_schema,table_name)
      WHERE t.constraint_type='PRIMARY KEY'
        AND t.table_schema=DATABASE()
        AND t.table_name='${tableName}'
    `;
    const pkResult = await this.executeQuery(pkQuery);
    const primaryKeys = pkResult.rows.map((row: any) => row.COLUMN_NAME);
    
    // Get foreign keys
    const fkQuery = `
      SELECT
        k.COLUMN_NAME,
        k.REFERENCED_TABLE_NAME,
        k.REFERENCED_COLUMN_NAME
      FROM information_schema.key_column_usage k
      JOIN information_schema.table_constraints t
      USING(constraint_name,table_schema,table_name)
      WHERE t.constraint_type='FOREIGN KEY'
        AND t.table_schema=DATABASE()
        AND t.table_name='${tableName}'
    `;
    const fkResult = await this.executeQuery(fkQuery);
    const foreignKeys = fkResult.rows.map((row: any) => ({
      columnName: row.COLUMN_NAME,
      referencedTable: row.REFERENCED_TABLE_NAME,
      referencedColumn: row.REFERENCED_COLUMN_NAME
    }));
    
    // Build columns
    const columns = columnsResult.rows.map((row: any) => {
      const isPrimaryKey = primaryKeys.includes(row.Field);
      
      return {
        name: row.Field,
        type: row.Type,
        nullable: row.Null === 'YES',
        isPrimaryKey,
        isAutoIncrement: row.Extra.includes('auto_increment'),
        defaultValue: row.Default
      };
    });
    
    return {
      tableName,
      columns,
      primaryKeys,
      foreignKeys
    };
  }
}

/**
 * SQL Server connector
 */
class SQLServerConnector extends BaseConnector {
  private pool: any = null;
  
  async connect(): Promise<void> {
    if (this.isConnected) return;
    
    try {
      // In a real implementation, we would use the 'mssql' package
      // This is a stub implementation for demonstration purposes
      // const sql = require('mssql');
      
      const { username, password } = JSON.parse(this.config.credentials);
      
      // In a real implementation:
      // const config = {
      //   user: username,
      //   password: password,
      //   server: this.config.host,
      //   port: this.config.port,
      //   database: this.config.database,
      //   options: {
      //     encrypt: true,
      //     trustServerCertificate: true
      //   }
      // };
      
      // this.pool = await sql.connect(config);
      
      this.pool = {
        request: () => ({
          query: async (query: string) => {
            return {
              recordset: [],
              recordsets: [[]],
              rowsAffected: [0],
              output: {}
            };
          }
        }),
        close: async () => {}
      };
      
      this.isConnected = true;
    } catch (error) {
      throw new Error(`Failed to connect to SQL Server database: ${error.message}`);
    }
  }
  
  async disconnect(): Promise<void> {
    if (!this.isConnected || !this.pool) return;
    
    try {
      await this.pool.close();
      this.isConnected = false;
    } catch (error) {
      throw new Error(`Failed to disconnect from SQL Server database: ${error.message}`);
    }
  }
  
  async executeQuery(query: string, params: any[] = []): Promise<QueryResult> {
    if (!this.isConnected) {
      await this.connect();
    }
    
    try {
      const startTime = Date.now();
      const request = this.pool.request();
      
      // Add parameters if provided
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
      
      const result = await request.query(query);
      const executionTime = Date.now() - startTime;
      
      return {
        columns: result.recordset && result.recordset.length > 0
          ? Object.keys(result.recordset[0])
          : [],
        rows: result.recordset || [],
        rowCount: result.rowsAffected[0] || 0,
        metadata: {
          executionTime,
          query
        }
      };
    } catch (error) {
      throw new Error(`SQL Server query execution failed: ${error.message}`);
    }
  }
  
  async listTables(): Promise<string[]> {
    const query = `
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
        AND TABLE_CATALOG = '${this.config.database}'
      ORDER BY TABLE_NAME
    `;
    
    const result = await this.executeQuery(query);
    return result.rows.map((row: any) => row.TABLE_NAME);
  }
  
  async getTableSchema(tableName: string): Promise<TableSchema> {
    // Get columns
    const columnsQuery = `
      SELECT 
        c.COLUMN_NAME, 
        c.DATA_TYPE,
        c.IS_NULLABLE = 'YES' as IS_NULLABLE,
        c.COLUMN_DEFAULT,
        COLUMNPROPERTY(OBJECT_ID(c.TABLE_SCHEMA + '.' + c.TABLE_NAME), c.COLUMN_NAME, 'IsIdentity') as IS_IDENTITY
      FROM INFORMATION_SCHEMA.COLUMNS c
      WHERE c.TABLE_NAME = '${tableName}'
        AND c.TABLE_CATALOG = '${this.config.database}'
      ORDER BY c.ORDINAL_POSITION
    `;
    
    // Get primary keys
    const pkQuery = `
      SELECT c.name as COLUMN_NAME
      FROM sys.indexes i
      INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      INNER JOIN sys.tables t ON i.object_id = t.object_id
      WHERE i.is_primary_key = 1
        AND t.name = '${tableName}'
    `;
    
    // Get foreign keys
    const fkQuery = `
      SELECT 
        COL_NAME(fk.parent_object_id, fkc.parent_column_id) as COLUMN_NAME,
        OBJECT_NAME(fk.referenced_object_id) as REFERENCED_TABLE,
        COL_NAME(fk.referenced_object_id, fkc.referenced_column_id) as REFERENCED_COLUMN
      FROM sys.foreign_keys fk
      INNER JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
      INNER JOIN sys.tables t ON fk.parent_object_id = t.object_id
      WHERE t.name = '${tableName}'
    `;
    
    // Execute queries
    const columnsResult = await this.executeQuery(columnsQuery);
    const pkResult = await this.executeQuery(pkQuery);
    const fkResult = await this.executeQuery(fkQuery);
    
    // Process results
    const primaryKeys = pkResult.rows.map((row: any) => row.COLUMN_NAME);
    
    const foreignKeys = fkResult.rows.map((row: any) => ({
      columnName: row.COLUMN_NAME,
      referencedTable: row.REFERENCED_TABLE,
      referencedColumn: row.REFERENCED_COLUMN
    }));
    
    const columns = columnsResult.rows.map((row: any) => {
      const isPrimaryKey = primaryKeys.includes(row.COLUMN_NAME);
      
      return {
        name: row.COLUMN_NAME,
        type: row.DATA_TYPE,
        nullable: row.IS_NULLABLE,
        isPrimaryKey,
        isAutoIncrement: row.IS_IDENTITY === 1,
        defaultValue: row.COLUMN_DEFAULT
      };
    });
    
    return {
      tableName,
      columns,
      primaryKeys,
      foreignKeys
    };
  }
}

/**
 * Oracle connector
 */
class OracleConnector extends BaseConnector {
  private connection: any = null;
  
  async connect(): Promise<void> {
    if (this.isConnected) return;
    
    try {
      // In a real implementation, we would use the 'oracledb' package
      // This is a stub implementation for demonstration purposes
      // const oracledb = require('oracledb');
      // oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
      
      const credentials = JSON.parse(this.config.credentials);
      
      // In a real implementation:
      // this.connection = await oracledb.getConnection({
      //   user: credentials.username,
      //   password: credentials.password,
      //   connectString: `${this.config.host}:${this.config.port}/${this.config.database}`
      // });
      
      this.connection = {
        execute: async (query: string, bindParams: any, options: any) => {
          return {
            rows: [],
            metaData: [],
            rowsAffected: 0
          };
        },
        close: async () => {}
      };
      
      this.isConnected = true;
    } catch (error) {
      throw new Error(`Failed to connect to Oracle database: ${error.message}`);
    }
  }
  
  async disconnect(): Promise<void> {
    if (!this.isConnected || !this.connection) return;
    
    try {
      await this.connection.close();
      this.isConnected = false;
    } catch (error) {
      throw new Error(`Failed to disconnect from Oracle database: ${error.message}`);
    }
  }
  
  async executeQuery(query: string, params: any[] = []): Promise<QueryResult> {
    if (!this.isConnected) {
      await this.connect();
    }
    
    try {
      const startTime = Date.now();
      
      // Convert array params to object params
      const bindParams = {};
      params.forEach((param, index) => {
        bindParams[`:${index + 1}`] = param;
      });
      
      const options = { autoCommit: true };
      const result = await this.connection.execute(query, bindParams, options);
      const executionTime = Date.now() - startTime;
      
      return {
        columns: result.metaData ? result.metaData.map((col: any) => col.name) : [],
        rows: result.rows || [],
        rowCount: result.rows ? result.rows.length : 0,
        metadata: {
          executionTime,
          query
        }
      };
    } catch (error) {
      throw new Error(`Oracle query execution failed: ${error.message}`);
    }
  }
  
  async listTables(): Promise<string[]> {
    const schema = this.config.schema || (JSON.parse(this.config.credentials)).username.toUpperCase();
    
    const query = `
      SELECT table_name 
      FROM all_tables 
      WHERE owner = :1
      ORDER BY table_name
    `;
    
    const result = await this.executeQuery(query, [schema]);
    return result.rows.map((row: any) => row.TABLE_NAME);
  }
  
  async getTableSchema(tableName: string): Promise<TableSchema> {
    const schema = this.config.schema || (JSON.parse(this.config.credentials)).username.toUpperCase();
    
    // Get columns
    const columnsQuery = `
      SELECT
        column_name,
        data_type,
        nullable = 'Y' as is_nullable,
        data_default,
        identity_column = 'YES' as is_identity
      FROM all_tab_columns
      WHERE owner = :1
        AND table_name = :2
      ORDER BY column_id
    `;
    
    // Get primary keys
    const pkQuery = `
      SELECT 
        cols.column_name
      FROM all_constraints cons, all_cons_columns cols
      WHERE cons.constraint_type = 'P'
        AND cons.owner = :1
        AND cons.table_name = :2
        AND cons.constraint_name = cols.constraint_name
        AND cons.owner = cols.owner
      ORDER BY cols.position
    `;
    
    // Get foreign keys
    const fkQuery = `
      SELECT
        acc.column_name,
        r_cons.table_name as referenced_table,
        r_acc.column_name as referenced_column
      FROM all_constraints cons
      JOIN all_cons_columns acc ON acc.constraint_name = cons.constraint_name AND acc.owner = cons.owner
      JOIN all_constraints r_cons ON r_cons.constraint_name = cons.r_constraint_name AND r_cons.owner = cons.r_owner
      JOIN all_cons_columns r_acc ON r_acc.constraint_name = r_cons.constraint_name AND r_acc.owner = r_cons.owner
      WHERE cons.constraint_type = 'R'
        AND cons.owner = :1
        AND cons.table_name = :2
    `;
    
    // Execute queries
    const columnsResult = await this.executeQuery(columnsQuery, [schema, tableName]);
    const pkResult = await this.executeQuery(pkQuery, [schema, tableName]);
    const fkResult = await this.executeQuery(fkQuery, [schema, tableName]);
    
    // Process results
    const primaryKeys = pkResult.rows.map((row: any) => row.COLUMN_NAME);
    
    const foreignKeys = fkResult.rows.map((row: any) => ({
      columnName: row.COLUMN_NAME,
      referencedTable: row.REFERENCED_TABLE,
      referencedColumn: row.REFERENCED_COLUMN
    }));
    
    const columns = columnsResult.rows.map((row: any) => {
      const isPrimaryKey = primaryKeys.includes(row.COLUMN_NAME);
      
      return {
        name: row.COLUMN_NAME,
        type: row.DATA_TYPE,
        nullable: row.IS_NULLABLE,
        isPrimaryKey,
        isAutoIncrement: row.IS_IDENTITY,
        defaultValue: row.DATA_DEFAULT
      };
    });
    
    return {
      tableName,
      columns,
      primaryKeys,
      foreignKeys
    };
  }
}