/**
 * Database connector service
 * Provides unified interface for connecting to and querying external databases
 */

import { createConnector } from './connectors';
import * as configManager from './config-manager';
import { ExternalDbConnector, DatabaseConfig, ConnectionTestResult, TableSchema, QueryOptions, QueryResult } from './types';

// Cache connectors to avoid reconnecting for every query
// Also helps with connection pooling for supported databases
const connectorCache: Record<string, { connector: ExternalDbConnector, lastUsed: number }> = {};

// Time in milliseconds after which a cached connector will be closed (5 minutes)
const CONNECTOR_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Get a database connector for the specified configuration
 */
function getConnector(config: DatabaseConfig): ExternalDbConnector {
  const cacheKey = config.id;
  const now = Date.now();
  
  // Check if we have a cached connector
  if (connectorCache[cacheKey]) {
    connectorCache[cacheKey].lastUsed = now;
    return connectorCache[cacheKey].connector;
  }
  
  // Create a new connector
  let connector: ExternalDbConnector;
  try {
    connector = createConnector(config);
    connectorCache[cacheKey] = { connector, lastUsed: now };
    
    // Update last connected timestamp
    configManager.updateLastConnected(config.id)
      .catch(err => console.error(`Failed to update last connected timestamp for ${config.id}:`, err));
    
    return connector;
  } catch (error) {
    console.error(`Failed to create connector for ${config.name}:`, error);
    throw new Error(`Failed to create database connector: ${error.message}`);
  }
}

/**
 * Clean up expired connectors in the cache
 */
function cleanupConnectorCache() {
  const now = Date.now();
  
  Object.entries(connectorCache).forEach(([key, { connector, lastUsed }]) => {
    if (now - lastUsed > CONNECTOR_EXPIRY_MS) {
      // Close the connection and remove from cache
      connector.disconnect()
        .catch(err => console.error(`Error disconnecting from database ${key}:`, err))
        .finally(() => {
          delete connectorCache[key];
          console.log(`Removed expired connector for ${key} from cache`);
        });
    }
  });
}

// Set up periodic cleanup of expired connectors
setInterval(cleanupConnectorCache, 60 * 1000); // Run every minute

/**
 * Test a database connection
 */
export async function testConnection(config: DatabaseConfig): Promise<ConnectionTestResult> {
  try {
    const startTime = Date.now();
    
    // Create a new connector specifically for testing
    let connector: ExternalDbConnector;
    try {
      connector = createConnector(config);
    } catch (error) {
      return {
        success: false,
        message: `Failed to create connector: ${error.message}`,
      };
    }
    
    // Test the connection
    try {
      const result = await connector.testConnection();
      const latency = Date.now() - startTime;
      
      return {
        ...result,
        latency,
      };
    } finally {
      // Always disconnect after testing
      await connector.disconnect().catch(err => {
        console.error(`Error disconnecting from database ${config.name}:`, err);
      });
    }
  } catch (error) {
    return {
      success: false,
      message: `Connection test failed: ${error.message}`,
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
  // Get the database configuration
  const config = await configManager.getDbConfiguration(configId);
  if (!config) {
    throw new Error(`Database configuration not found: ${configId}`);
  }
  
  // Get or create a connector
  const connector = getConnector(config);
  
  try {
    // Connect if not already connected
    await connector.connect();
    
    // Execute the query
    if (options) {
      // If options are provided, use the query builder
      return await connector.buildQuery(options);
    } else {
      // Otherwise execute the raw query
      return await connector.executeQuery(query);
    }
  } catch (error) {
    throw new Error(`Query execution failed: ${error.message}`);
  }
}

/**
 * List tables in a database
 */
export async function listTables(configId: string): Promise<string[]> {
  // Get the database configuration
  const config = await configManager.getDbConfiguration(configId);
  if (!config) {
    throw new Error(`Database configuration not found: ${configId}`);
  }
  
  // Get or create a connector
  const connector = getConnector(config);
  
  try {
    // Connect if not already connected
    await connector.connect();
    
    // List tables
    return await connector.listTables();
  } catch (error) {
    throw new Error(`Failed to list tables: ${error.message}`);
  }
}

/**
 * Get schema for a table
 */
export async function getTableSchema(configId: string, tableName: string): Promise<TableSchema> {
  // Get the database configuration
  const config = await configManager.getDbConfiguration(configId);
  if (!config) {
    throw new Error(`Database configuration not found: ${configId}`);
  }
  
  // Get or create a connector
  const connector = getConnector(config);
  
  try {
    // Connect if not already connected
    await connector.connect();
    
    // Get table schema
    return await connector.getTableSchema(tableName);
  } catch (error) {
    throw new Error(`Failed to get table schema: ${error.message}`);
  }
}