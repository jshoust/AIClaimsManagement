/**
 * API routes for external database connections
 */
import { Router, Request, Response } from 'express';
import { z } from "zod";
import { 
  getDbConfigurations, 
  saveDbConfiguration, 
  testConnection,
  executeQuery,
  listTables,
  getTableSchema
} from '../services/database-connector';
import { DatabaseConfig, QueryOptions } from '../services/database-connector/types';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * Get all external database configurations
 */
router.get('/connections', async (_req: Request, res: Response) => {
  try {
    const connections = await getDbConfigurations();
    
    // Remove sensitive data before sending to client
    const sanitizedConnections = connections.map(conn => {
      const { credentials, ...rest } = conn;
      return {
        ...rest,
        hasCredentials: !!credentials,
      };
    });
    
    return res.json(sanitizedConnections);
  } catch (error) {
    console.error('Error fetching database connections:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch database connections',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get a specific database configuration
 */
router.get('/connections/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const connections = await getDbConfigurations();
    const connection = connections.find(conn => conn.id === id);
    
    if (!connection) {
      return res.status(404).json({ error: 'Database connection not found' });
    }
    
    // Remove sensitive data before sending to client
    const { credentials, ...sanitizedConnection } = connection;
    
    return res.json({
      ...sanitizedConnection,
      hasCredentials: !!credentials,
    });
  } catch (error) {
    console.error('Error fetching database connection:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch database connection',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Validation schema for database connection
 */
const databaseConnectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(["sqlserver", "mysql", "postgres", "oracle"]),
  host: z.string().min(1, "Host is required"),
  port: z.number().int().positive("Port must be a positive integer"),
  database: z.string().min(1, "Database name is required"),
  schema: z.string().optional(),
  credentials: z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    useWindowsAuth: z.boolean().optional(),
    connectionString: z.string().optional(),
    useSsl: z.boolean().optional()
  }),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
});

/**
 * Create a new database connection
 */
router.post('/connections', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = databaseConnectionSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid connection configuration', 
        details: validationResult.error.format() 
      });
    }
    
    const connectionData = validationResult.data;
    
    // Create a new configuration object
    const newConnection: DatabaseConfig = {
      id: uuidv4(),
      name: connectionData.name,
      description: connectionData.description || '',
      type: connectionData.type,
      host: connectionData.host,
      port: connectionData.port,
      database: connectionData.database,
      schema: connectionData.schema,
      credentials: connectionData.credentials,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: connectionData.tags,
      isActive: connectionData.isActive !== false, // Default to true if not specified
      createdBy: req.body.userId || 'system',
    };
    
    // Test the connection before saving
    const testResult = await testConnection(newConnection);
    
    if (!testResult.success) {
      return res.status(400).json({ 
        error: 'Connection test failed', 
        message: testResult.message 
      });
    }
    
    // Save the configuration
    const savedConnection = await saveDbConfiguration(newConnection);
    
    // Remove sensitive data before sending to client
    const { credentials, ...sanitizedConnection } = savedConnection;
    
    return res.status(201).json({
      ...sanitizedConnection,
      hasCredentials: true,
    });
  } catch (error) {
    console.error('Error creating database connection:', error);
    return res.status(500).json({ 
      error: 'Failed to create database connection',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Update an existing database connection
 */
router.put('/connections/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate request body
    const validationResult = databaseConnectionSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid connection configuration', 
        details: validationResult.error.format() 
      });
    }
    
    // Get existing connections
    const connections = await getDbConfigurations();
    const existingConnection = connections.find(conn => conn.id === id);
    
    if (!existingConnection) {
      return res.status(404).json({ error: 'Database connection not found' });
    }
    
    const connectionData = validationResult.data;
    
    // Update the configuration
    const updatedConnection: DatabaseConfig = {
      ...existingConnection,
      name: connectionData.name,
      description: connectionData.description || existingConnection.description,
      type: connectionData.type,
      host: connectionData.host,
      port: connectionData.port,
      database: connectionData.database,
      schema: connectionData.schema,
      credentials: connectionData.credentials,
      updatedAt: new Date().toISOString(),
      tags: connectionData.tags || existingConnection.tags,
      isActive: connectionData.isActive !== undefined 
        ? connectionData.isActive 
        : existingConnection.isActive
    };
    
    // Test the connection before saving
    const testResult = await testConnection(updatedConnection);
    
    if (!testResult.success) {
      return res.status(400).json({ 
        error: 'Connection test failed', 
        message: testResult.message 
      });
    }
    
    // Save the updated configuration
    const savedConnection = await saveDbConfiguration(updatedConnection);
    
    // Remove sensitive data before sending to client
    const { credentials, ...sanitizedConnection } = savedConnection;
    
    return res.json({
      ...sanitizedConnection,
      hasCredentials: true,
    });
  } catch (error) {
    console.error('Error updating database connection:', error);
    return res.status(500).json({ 
      error: 'Failed to update database connection',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Test a database connection
 */
router.post('/connections/test', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = databaseConnectionSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid connection configuration', 
        details: validationResult.error.format() 
      });
    }
    
    const connectionData = validationResult.data;
    
    // Create a test configuration object
    const testConfig: DatabaseConfig = {
      id: 'test-connection',
      name: connectionData.name,
      description: connectionData.description || '',
      type: connectionData.type,
      host: connectionData.host,
      port: connectionData.port,
      database: connectionData.database,
      schema: connectionData.schema,
      credentials: connectionData.credentials,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: connectionData.tags,
      isActive: true,
      createdBy: req.body.userId || 'system',
    };
    
    // Test the connection
    const result = await testConnection(testConfig);
    
    return res.json(result);
  } catch (error) {
    console.error('Error testing database connection:', error);
    return res.status(500).json({ 
      error: 'Failed to test database connection',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * List tables for a specific database connection
 */
router.get('/connections/:id/tables', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // List tables
    const tables = await listTables(id);
    
    return res.json({ tables });
  } catch (error) {
    console.error('Error listing tables:', error);
    return res.status(500).json({ 
      error: 'Failed to list tables',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get schema for a specific table
 */
router.get('/connections/:id/tables/:tableName/schema', async (req: Request, res: Response) => {
  try {
    const { id, tableName } = req.params;
    
    // Get table schema
    const schema = await getTableSchema(id, tableName);
    
    return res.json(schema);
  } catch (error) {
    console.error('Error getting table schema:', error);
    return res.status(500).json({ 
      error: 'Failed to get table schema',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Execute a query on a specific database connection
 */
router.post('/connections/:id/query', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { query, options } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Execute the query
    const result = await executeQuery(id, query, options as QueryOptions);
    
    return res.json(result);
  } catch (error) {
    console.error('Error executing query:', error);
    return res.status(500).json({ 
      error: 'Failed to execute query',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Execute a query using the query builder
 */
router.post('/connections/:id/query-builder', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { queryBuilderConfig, options } = req.body;
    
    if (!queryBuilderConfig) {
      return res.status(400).json({ error: 'Query builder configuration is required' });
    }
    
    // Set up options for query builder
    const queryOptions: QueryOptions = {
      ...options,
      useQueryBuilder: true,
      queryBuilderConfig
    };
    
    // Execute the query (pass empty string as the query parameter since we're using the builder)
    const result = await executeQuery(id, '', queryOptions);
    
    return res.json(result);
  } catch (error) {
    console.error('Error executing query builder:', error);
    return res.status(500).json({ 
      error: 'Failed to execute query builder',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;