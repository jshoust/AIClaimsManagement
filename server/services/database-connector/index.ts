/**
 * External Database Connector Service
 * 
 * This service provides functionality to connect to external database systems
 * in company environments, allowing the application to query and retrieve data
 * from various database sources.
 */
import { 
  createSqlServerConnector,
  createMySqlConnector,
  createPostgresConnector,
  createOracleConnector 
} from './connectors';
import { DatabaseConfig, ExternalDbConnector, QueryOptions, QueryResult } from './types';
import { getDatabaseConfig, saveDatabaseConfig } from './config-manager';
import { transformQueryResult } from './result-transformer';
import { buildQuery } from './query-builder';

/**
 * Creates a connector instance for the specified database type
 */
export function createConnector(config: DatabaseConfig): ExternalDbConnector {
  switch (config.type) {
    case 'sqlserver':
      return createSqlServerConnector(config);
    case 'mysql':
      return createMySqlConnector(config);
    case 'postgres':
      return createPostgresConnector(config);
    case 'oracle':
      return createOracleConnector(config);
    default:
      throw new Error(`Unsupported database type: ${config.type}`);
  }
}

/**
 * Get all configured database connections
 */
export async function getDbConfigurations(): Promise<DatabaseConfig[]> {
  return await getDatabaseConfig();
}

/**
 * Save a new database configuration
 */
export async function saveDbConfiguration(config: DatabaseConfig): Promise<DatabaseConfig> {
  return await saveDatabaseConfig(config);
}

/**
 * Test a database connection using the provided configuration
 */
export async function testConnection(config: DatabaseConfig): Promise<{ success: boolean; message: string }> {
  try {
    const connector = createConnector(config);
    await connector.testConnection();
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Execute a query against an external database
 */
export async function executeQuery(
  configId: string, 
  query: string, 
  options: QueryOptions = {}
): Promise<QueryResult> {
  // Get the database configuration
  const configs = await getDatabaseConfig();
  const config = configs.find(c => c.id === configId);
  
  if (!config) {
    throw new Error(`Database configuration not found for ID: ${configId}`);
  }
  
  // Create the connector for this database type
  const connector = createConnector(config);
  
  // If we're using the query builder, generate the SQL
  let finalQuery = query;
  if (options.useQueryBuilder && options.queryBuilderConfig) {
    finalQuery = buildQuery(options.queryBuilderConfig, config.type);
  }
  
  // Execute the query
  const result = await connector.executeQuery(finalQuery, options.parameters);
  
  // Transform the result if needed
  return options.transform ? transformQueryResult(result, options.transformConfig) : result;
}

/**
 * List all tables in an external database
 */
export async function listTables(configId: string): Promise<string[]> {
  // Get the database configuration
  const configs = await getDatabaseConfig();
  const config = configs.find(c => c.id === configId);
  
  if (!config) {
    throw new Error(`Database configuration not found for ID: ${configId}`);
  }
  
  // Create the connector for this database type
  const connector = createConnector(config);
  
  // Get the table list
  return await connector.listTables();
}

/**
 * Get schema information for a specific table
 */
export async function getTableSchema(configId: string, tableName: string): Promise<any> {
  // Get the database configuration
  const configs = await getDatabaseConfig();
  const config = configs.find(c => c.id === configId);
  
  if (!config) {
    throw new Error(`Database configuration not found for ID: ${configId}`);
  }
  
  // Create the connector for this database type
  const connector = createConnector(config);
  
  // Get the table schema
  return await connector.getTableSchema(tableName);
}