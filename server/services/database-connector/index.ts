/**
 * Database connector main service
 * Provides functionality to connect to and query external databases
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  getDbConfigurations, 
  getDbConfiguration,
  saveDbConfiguration,
  updateLastConnected,
  deleteDbConfiguration
} from './config-manager';
import { createConnector } from './connectors';
import { 
  DatabaseConfig, 
  ConnectionTestResult, 
  QueryResult, 
  QueryOptions,
  TableSchema
} from './types';

/**
 * Test a database connection configuration
 */
export async function testDatabaseConnection(connectionConfig: Partial<DatabaseConfig>): Promise<ConnectionTestResult> {
  try {
    // Create a temporary configuration
    const tempConfig: DatabaseConfig = {
      id: connectionConfig.id || uuidv4(),
      name: connectionConfig.name || 'Temporary Connection',
      description: connectionConfig.description || '',
      type: connectionConfig.type!,
      host: connectionConfig.host!,
      port: connectionConfig.port!,
      database: connectionConfig.database!,
      schema: connectionConfig.schema,
      // Store credentials as stringified JSON
      credentials: JSON.stringify({
        username: connectionConfig.username || connectionConfig.user,
        password: connectionConfig.password,
        ssl: connectionConfig.ssl,
        rejectUnauthorized: connectionConfig.rejectUnauthorized
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      createdBy: connectionConfig.createdBy || 'system',
      tags: null
    };
    
    const connector = createConnector(tempConfig);
    return await connector.testConnection();
  } catch (error) {
    console.error('Error testing database connection:', error);
    return {
      success: false,
      message: `Connection test failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Get all database configurations
 */
export async function getDatabaseConfigurations(): Promise<DatabaseConfig[]> {
  try {
    return await getDbConfigurations();
  } catch (error) {
    console.error('Error getting database configurations:', error);
    throw new Error(`Failed to get database configurations: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get a specific database configuration
 */
export async function getDatabaseConfiguration(id: string): Promise<DatabaseConfig | null> {
  try {
    return await getDbConfiguration(id);
  } catch (error) {
    console.error(`Error getting database configuration ${id}:`, error);
    throw new Error(`Failed to get database configuration: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Save a database configuration
 */
export async function saveDatabaseConfiguration(configData: Partial<DatabaseConfig>): Promise<DatabaseConfig> {
  try {
    const id = configData.id || uuidv4();
    
    // Format credentials as JSON
    const credentials = JSON.stringify({
      username: configData.username || configData.user,
      password: configData.password,
      ssl: configData.ssl,
      rejectUnauthorized: configData.rejectUnauthorized
    });
    
    const config: DatabaseConfig = {
      id,
      name: configData.name!,
      description: configData.description || '',
      type: configData.type!,
      host: configData.host!,
      port: configData.port!,
      database: configData.database!,
      schema: configData.schema,
      credentials,
      createdAt: configData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastConnected: configData.lastConnected,
      tags: Array.isArray(configData.tags) ? configData.tags.join(',') : configData.tags,
      isActive: configData.isActive !== undefined ? configData.isActive : true,
      createdBy: configData.createdBy || 'system'
    };
    
    return await saveDbConfiguration(config);
  } catch (error) {
    console.error('Error saving database configuration:', error);
    throw new Error(`Failed to save database configuration: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Delete a database configuration
 */
export async function deleteDatabaseConfiguration(id: string): Promise<boolean> {
  try {
    return await deleteDbConfiguration(id);
  } catch (error) {
    console.error(`Error deleting database configuration ${id}:`, error);
    throw new Error(`Failed to delete database configuration: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Connect to a database and return the connector
 */
export async function connectToDatabase(configId: string) {
  try {
    const config = await getDbConfiguration(configId);
    
    if (!config) {
      throw new Error(`Database configuration not found: ${configId}`);
    }
    
    const connector = createConnector(config);
    await connector.connect();
    
    // Update last connected timestamp
    await updateLastConnected(configId);
    
    return connector;
  } catch (error) {
    console.error(`Error connecting to database ${configId}:`, error);
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * List tables in a database
 */
export async function listDatabaseTables(configId: string): Promise<string[]> {
  let connector;
  try {
    connector = await connectToDatabase(configId);
    return await connector.listTables();
  } catch (error) {
    console.error(`Error listing tables for database ${configId}:`, error);
    throw new Error(`Failed to list database tables: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (connector) {
      try {
        await connector.disconnect();
      } catch (error) {
        console.error(`Error disconnecting from database ${configId}:`, error);
      }
    }
  }
}

/**
 * Get schema for a table
 */
export async function getTableSchema(configId: string, tableName: string): Promise<TableSchema> {
  let connector;
  try {
    connector = await connectToDatabase(configId);
    return await connector.getTableSchema(tableName);
  } catch (error) {
    console.error(`Error getting schema for table ${tableName} in database ${configId}:`, error);
    throw new Error(`Failed to get table schema: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (connector) {
      try {
        await connector.disconnect();
      } catch (error) {
        console.error(`Error disconnecting from database ${configId}:`, error);
      }
    }
  }
}

/**
 * Execute a query on a database
 */
export async function executeQuery(configId: string, query: string, params: any[] = []): Promise<QueryResult> {
  let connector;
  try {
    connector = await connectToDatabase(configId);
    return await connector.executeQuery(query, params);
  } catch (error) {
    console.error(`Error executing query on database ${configId}:`, error);
    throw new Error(`Failed to execute query: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (connector) {
      try {
        await connector.disconnect();
      } catch (error) {
        console.error(`Error disconnecting from database ${configId}:`, error);
      }
    }
  }
}

/**
 * Build and execute a query on a database using the query builder
 */
export async function buildAndExecuteQuery(configId: string, options: QueryOptions): Promise<QueryResult> {
  let connector;
  try {
    connector = await connectToDatabase(configId);
    return await connector.buildQuery(options);
  } catch (error) {
    console.error(`Error building and executing query on database ${configId}:`, error);
    throw new Error(`Failed to build and execute query: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (connector) {
      try {
        await connector.disconnect();
      } catch (error) {
        console.error(`Error disconnecting from database ${configId}:`, error);
      }
    }
  }
}