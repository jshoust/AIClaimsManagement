/**
 * Database connector service
 * Provides unified interface for connecting to and querying external databases
 */
import { 
  DatabaseConfig, 
  ExternalDbConnector,
  ConnectionTestResult,
  QueryResult,
  TableSchema,
  QueryOptions
} from './types';
import { 
  createSqlServerConnector,
  createMySqlConnector,
  createPostgresConnector, 
  createOracleConnector 
} from './connectors';
import { 
  getDbConfigurations,
  getDbConfiguration,
  saveDbConfiguration,
  updateLastConnected,
  deleteDbConfiguration
} from './config-manager';
import { transformQueryResult } from './result-transformer';
import { buildQuery } from './query-builder';

// Cache for database connectors
const connectorCache: Record<string, { connector: ExternalDbConnector, lastUsed: number }> = {};
// Timeout for connector cache in milliseconds (30 minutes)
const CONNECTOR_CACHE_TIMEOUT = 30 * 60 * 1000;

/**
 * Get a database connector for the specified configuration
 */
function getConnector(config: DatabaseConfig): ExternalDbConnector {
  // Check if we have a cached connector
  if (connectorCache[config.id] && 
     (Date.now() - connectorCache[config.id].lastUsed) < CONNECTOR_CACHE_TIMEOUT) {
    // Update the last used timestamp
    connectorCache[config.id].lastUsed = Date.now();
    return connectorCache[config.id].connector;
  }

  // Create a new connector based on the database type
  let connector: ExternalDbConnector;
  
  switch (config.type) {
    case 'sqlserver':
      connector = createSqlServerConnector(config);
      break;
    case 'mysql':
      connector = createMySqlConnector(config);
      break;
    case 'postgres':
      connector = createPostgresConnector(config);
      break;
    case 'oracle':
      connector = createOracleConnector(config);
      break;
    default:
      throw new Error(`Unsupported database type: ${config.type}`);
  }
  
  // Cache the connector
  connectorCache[config.id] = {
    connector,
    lastUsed: Date.now()
  };
  
  return connector;
}

/**
 * Clean up expired connectors in the cache
 */
function cleanupConnectorCache() {
  const now = Date.now();
  
  Object.entries(connectorCache).forEach(async ([id, cache]) => {
    if ((now - cache.lastUsed) > CONNECTOR_CACHE_TIMEOUT) {
      // Close the connection
      try {
        await cache.connector.close();
      } catch (error) {
        console.error(`Error closing connection for ${id}:`, error);
      }
      
      // Remove from cache
      delete connectorCache[id];
    }
  });
}

// Run cache cleanup every 15 minutes
setInterval(cleanupConnectorCache, 15 * 60 * 1000);

/**
 * Test a database connection
 */
export async function testConnection(config: DatabaseConfig): Promise<ConnectionTestResult> {
  try {
    let connector: ExternalDbConnector;
    
    try {
      // For test connections, don't use the cache
      switch (config.type) {
        case 'sqlserver':
          connector = createSqlServerConnector(config);
          break;
        case 'mysql':
          connector = createMySqlConnector(config);
          break;
        case 'postgres':
          connector = createPostgresConnector(config);
          break;
        case 'oracle':
          connector = createOracleConnector(config);
          break;
        default:
          return {
            success: false,
            message: `Unsupported database type: ${config.type}`
          };
      }
      
      // Test the connection
      await connector.testConnection();
      
      // Close the connection
      await connector.close();
      
      return {
        success: true,
        message: 'Connection successful'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Connection failed',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Execute a query on a database
 */
export async function executeQuery(
  configId: string, 
  query: string,
  options?: QueryOptions
): Promise<QueryResult> {
  try {
    // Get the database configuration
    const config = await getDbConfiguration(configId);
    
    if (!config) {
      throw new Error(`Database configuration not found: ${configId}`);
    }
    
    // Get the connector
    const connector = getConnector(config);
    
    // Handle query builder if configured
    if (options?.useQueryBuilder && options.queryBuilderConfig) {
      query = buildQuery(options.queryBuilderConfig, config.type);
    }
    
    // Execute the query
    const result = await connector.executeQuery(query, options?.parameters);
    
    // Update the last connected timestamp
    await updateLastConnected(configId);
    
    // Transform the result if needed
    if (options?.transformConfig) {
      return transformQueryResult(result, options.transformConfig);
    }
    
    return result;
  } catch (error) {
    console.error('Error executing query:', error);
    
    // Return an error result
    return {
      columns: [],
      rows: [],
      metadata: {
        warnings: [error instanceof Error ? error.message : String(error)]
      }
    };
  }
}

/**
 * List tables in a database
 */
export async function listTables(configId: string): Promise<string[]> {
  try {
    // Get the database configuration
    const config = await getDbConfiguration(configId);
    
    if (!config) {
      throw new Error(`Database configuration not found: ${configId}`);
    }
    
    // Get the connector
    const connector = getConnector(config);
    
    // List tables
    const tables = await connector.listTables();
    
    // Update the last connected timestamp
    await updateLastConnected(configId);
    
    return tables;
  } catch (error) {
    console.error('Error listing tables:', error);
    throw error;
  }
}

/**
 * Get schema for a table
 */
export async function getTableSchema(configId: string, tableName: string): Promise<TableSchema> {
  try {
    // Get the database configuration
    const config = await getDbConfiguration(configId);
    
    if (!config) {
      throw new Error(`Database configuration not found: ${configId}`);
    }
    
    // Get the connector
    const connector = getConnector(config);
    
    // Get table schema
    const schema = await connector.getTableSchema(tableName);
    
    // Update the last connected timestamp
    await updateLastConnected(configId);
    
    return schema;
  } catch (error) {
    console.error('Error getting table schema:', error);
    throw error;
  }
}

// Re-export configuration management functions
export { 
  getDbConfigurations,
  getDbConfiguration,
  saveDbConfiguration,
  deleteDbConfiguration
};