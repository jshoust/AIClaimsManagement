/**
 * Database connectors for different database types
 */
import { 
  DatabaseConfig, 
  DatabaseType, 
  ExternalDbConnector, 
  ConnectionTestResult, 
  QueryResult,
  QueryOptions,
  TableSchema
} from './types';
import { buildQueryForDialect } from './query-builder';
import pkg from 'pg';
const { Pool: PgPool } = pkg;

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
      const startTime = Date.now();
      await this.connect();
      const endTime = Date.now();
      
      return {
        success: true,
        message: 'Successfully connected to database',
        latency: endTime - startTime
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : String(error)}`
      };
    } finally {
      try {
        await this.disconnect();
      } catch (error) {
        console.error('Error disconnecting during connection test:', 
                     error instanceof Error ? error.message : String(error));
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
  private client: typeof PgPool.prototype | null = null;
  
  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }
    
    try {
      // Parse credentials
      const credentials = JSON.parse(this.config.credentials);
      
      // Create a new connection pool
      this.client = new PgPool({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: credentials.username,
        password: credentials.password,
        ssl: credentials.ssl ? {
          rejectUnauthorized: credentials.rejectUnauthorized !== false
        } : undefined,
        // Add a reasonable connection timeout
        connectionTimeoutMillis: 10000
      });
      
      // Test the connection with a simple query
      await this.client.query('SELECT 1');
      this.isConnected = true;
    } catch (error) {
      this.client = null;
      this.isConnected = false;
      throw new Error(`Failed to connect to PostgreSQL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.end();
      } catch (error) {
        console.error('Error disconnecting from PostgreSQL:', 
                      error instanceof Error ? error.message : String(error));
      } finally {
        this.client = null;
        this.isConnected = false;
      }
    }
  }
  
  async executeQuery(query: string, params: any[] = []): Promise<QueryResult> {
    if (!this.isConnected || !this.client) {
      await this.connect();
    }
    
    try {
      const startTime = Date.now();
      const result = await this.client!.query(query, params);
      const endTime = Date.now();
      
      return {
        columns: result.fields.map(field => field.name),
        rows: result.rows,
        rowCount: result.rowCount,
        metadata: {
          executionTime: endTime - startTime,
          query
        }
      };
    } catch (error) {
      throw new Error(`PostgreSQL query error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async listTables(): Promise<string[]> {
    if (!this.isConnected || !this.client) {
      await this.connect();
    }
    
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1 
      ORDER BY table_name
    `;
    
    try {
      const result = await this.client!.query(query, [this.config.schema || 'public']);
      return result.rows.map(row => row.table_name);
    } catch (error) {
      throw new Error(`Failed to list tables: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async getTableSchema(tableName: string): Promise<TableSchema> {
    if (!this.isConnected || !this.client) {
      await this.connect();
    }
    
    try {
      // Get column info
      const columnsQuery = `
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default
        FROM 
          information_schema.columns 
        WHERE 
          table_schema = $1 
          AND table_name = $2
        ORDER BY 
          ordinal_position
      `;
      
      const columnsResult = await this.client!.query(columnsQuery, [
        this.config.schema || 'public', 
        tableName
      ]);
      
      // Get primary key info
      const pkQuery = `
        SELECT 
          c.column_name
        FROM 
          information_schema.table_constraints tc
          JOIN information_schema.constraint_column_usage AS c ON tc.constraint_name = c.constraint_name
        WHERE 
          tc.constraint_type = 'PRIMARY KEY' 
          AND tc.table_schema = $1
          AND tc.table_name = $2
      `;
      
      const pkResult = await this.client!.query(pkQuery, [
        this.config.schema || 'public', 
        tableName
      ]);
      
      const primaryKeys = pkResult.rows.map(row => row.column_name);
      
      // Get foreign key info
      const fkQuery = `
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM
          information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
        WHERE
          tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = $1
          AND tc.table_name = $2
      `;
      
      const fkResult = await this.client!.query(fkQuery, [
        this.config.schema || 'public', 
        tableName
      ]);
      
      const foreignKeys = fkResult.rows.map(row => ({
        column: row.column_name,
        referencedTable: row.foreign_table_name,
        referencedColumn: row.foreign_column_name
      }));
      
      // Map columns with primary/foreign key info
      const columns = columnsResult.rows.map(col => {
        return {
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === 'YES',
          isPrimaryKey: primaryKeys.includes(col.column_name),
          isForeignKey: foreignKeys.some(fk => fk.column === col.column_name),
          defaultValue: col.column_default
        };
      });
      
      return {
        tableName,
        columns,
        primaryKey: primaryKeys,
        foreignKeys
      };
    } catch (error) {
      throw new Error(`Failed to get table schema: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * MySQL connector
 */
class MySQLConnector extends BaseConnector {
  private connection: any = null;
  
  async connect(): Promise<void> {
    if (this.isConnected && this.connection) {
      return;
    }
    
    try {
      // For this example, we're just stubbing the MySQL connector
      // as we don't want to add the dependency unless needed
      console.log('MySQL connector is stubbed');
      this.isConnected = true;
    } catch (error) {
      this.connection = null;
      this.isConnected = false;
      throw new Error(`Failed to connect to MySQL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        // Close connection logic would go here
        this.connection = null;
        this.isConnected = false;
      } catch (error) {
        console.error('Error disconnecting from MySQL:', 
                     error instanceof Error ? error.message : String(error));
      }
    }
  }
  
  async executeQuery(query: string, params: any[] = []): Promise<QueryResult> {
    try {
      // Stubbed implementation
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        metadata: {
          executionTime: 0,
          query
        }
      };
    } catch (error) {
      throw new Error(`MySQL query error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async listTables(): Promise<string[]> {
    try {
      // Stubbed implementation
      return [];
    } catch (error) {
      throw new Error(`Failed to list tables: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async getTableSchema(tableName: string): Promise<TableSchema> {
    try {
      // Stubbed implementation
      return {
        tableName,
        columns: []
      };
    } catch (error) {
      throw new Error(`Failed to get table schema: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * SQL Server connector
 */
class SQLServerConnector extends BaseConnector {
  private pool: any = null;
  
  async connect(): Promise<void> {
    if (this.isConnected && this.pool) {
      return;
    }
    
    try {
      // For this example, we're just stubbing the SQL Server connector
      console.log('SQL Server connector is stubbed');
      this.isConnected = true;
    } catch (error) {
      this.pool = null;
      this.isConnected = false;
      throw new Error(`Failed to connect to SQL Server: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.pool) {
      try {
        // Close connection logic would go here
        this.pool = null;
        this.isConnected = false;
      } catch (error) {
        console.error('Error disconnecting from SQL Server:', 
                     error instanceof Error ? error.message : String(error));
      }
    }
  }
  
  async executeQuery(query: string, params: any[] = []): Promise<QueryResult> {
    try {
      // Stubbed implementation
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        metadata: {
          executionTime: 0,
          query
        }
      };
    } catch (error) {
      throw new Error(`SQL Server query error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async listTables(): Promise<string[]> {
    try {
      // Stubbed implementation
      return [];
    } catch (error) {
      throw new Error(`Failed to list tables: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async getTableSchema(tableName: string): Promise<TableSchema> {
    try {
      // Stubbed implementation
      return {
        tableName,
        columns: []
      };
    } catch (error) {
      throw new Error(`Failed to get table schema: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Oracle connector
 */
class OracleConnector extends BaseConnector {
  private connection: any = null;
  
  async connect(): Promise<void> {
    if (this.isConnected && this.connection) {
      return;
    }
    
    try {
      // For this example, we're just stubbing the Oracle connector
      console.log('Oracle connector is stubbed');
      this.isConnected = true;
    } catch (error) {
      this.connection = null;
      this.isConnected = false;
      throw new Error(`Failed to connect to Oracle: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        // Close connection logic would go here
        this.connection = null;
        this.isConnected = false;
      } catch (error) {
        console.error('Error disconnecting from Oracle:', 
                     error instanceof Error ? error.message : String(error));
      }
    }
  }
  
  async executeQuery(query: string, params: any[] = []): Promise<QueryResult> {
    try {
      // Stub implementation
      const bindings: Record<string, any> = {};
      params.forEach((param, idx) => {
        bindings[`:${idx + 1}`] = param;
      });
      
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        metadata: {
          executionTime: 0,
          query
        }
      };
    } catch (error) {
      throw new Error(`Oracle query error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async listTables(): Promise<string[]> {
    try {
      // Stubbed implementation
      return [];
    } catch (error) {
      throw new Error(`Failed to list tables: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async getTableSchema(tableName: string): Promise<TableSchema> {
    try {
      // Stubbed implementation
      return {
        tableName,
        columns: []
      };
    } catch (error) {
      throw new Error(`Failed to get table schema: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}