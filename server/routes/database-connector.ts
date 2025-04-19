/**
 * API routes for external database connections
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import * as configManager from '../services/database-connector/config-manager';
import * as databaseConnector from '../services/database-connector';
import { DatabaseConfig, ConnectionTestResult, TableSchema, QueryOptions } from '../services/database-connector/types';

const router = Router();

/**
 * Get all external database configurations
 */
router.get('/connections', async (_req: Request, res: Response) => {
  try {
    const configs = await configManager.getDbConfigurations();
    return res.json(configs);
  } catch (error) {
    console.error('Error fetching database configurations:', error);
    return res.status(500).json({ error: 'Failed to fetch database configurations' });
  }
});

/**
 * Get a specific database configuration
 */
router.get('/connections/:id', async (req: Request, res: Response) => {
  try {
    const config = await configManager.getDbConfiguration(req.params.id);
    if (!config) {
      return res.status(404).json({ error: 'Database configuration not found' });
    }
    return res.json(config);
  } catch (error) {
    console.error('Error fetching database configuration:', error);
    return res.status(500).json({ error: 'Failed to fetch database configuration' });
  }
});

/**
 * Validation schema for database connection
 */
const dbConnectionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['mysql', 'postgres', 'sqlserver', 'oracle']),
  host: z.string().min(1, 'Host is required'),
  port: z.number().int().positive('Port must be a positive integer'),
  database: z.string().min(1, 'Database name is required'),
  schema: z.string().optional(),
  username: z.string().min(1, 'Username is required'),
  password: z.string(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  createdBy: z.string().default('admin')
});

/**
 * Create a new database connection
 */
router.post('/connections', async (req: Request, res: Response) => {
  try {
    const validation = dbConnectionSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid data', details: validation.error.format() });
    }
    
    const { username, password, tags, ...rest } = validation.data;
    
    // Store password securely (encrypted in a real-world scenario)
    const credentials = JSON.stringify({ username, password });
    
    const newConnection: DatabaseConfig = {
      id: uuidv4(),
      credentials,
      tags: tags ? tags.join(',') : null,
      ...rest,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const savedConfig = await configManager.saveDbConfiguration(newConnection);
    return res.status(201).json(savedConfig);
  } catch (error) {
    console.error('Error creating database connection:', error);
    return res.status(500).json({ error: 'Failed to create database connection' });
  }
});

/**
 * Update an existing database connection
 */
router.put('/connections/:id', async (req: Request, res: Response) => {
  try {
    const existingConfig = await configManager.getDbConfiguration(req.params.id);
    
    if (!existingConfig) {
      return res.status(404).json({ error: 'Database configuration not found' });
    }
    
    const validation = dbConnectionSchema.partial().safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid data', details: validation.error.format() });
    }
    
    const { username, password, tags, ...rest } = validation.data;
    
    // Get existing credentials
    let credentials = existingConfig.credentials;
    
    // If either username or password is provided, update credentials
    if (username || password) {
      const existingCreds = JSON.parse(existingConfig.credentials);
      credentials = JSON.stringify({
        username: username || existingCreds.username,
        password: password || existingCreds.password
      });
    }
    
    const updatedConnection: DatabaseConfig = {
      ...existingConfig,
      ...rest,
      credentials,
      tags: tags ? tags.join(',') : existingConfig.tags,
      updatedAt: new Date().toISOString()
    };
    
    const savedConfig = await configManager.saveDbConfiguration(updatedConnection);
    return res.json(savedConfig);
  } catch (error) {
    console.error('Error updating database connection:', error);
    return res.status(500).json({ error: 'Failed to update database connection' });
  }
});

/**
 * Test a database connection
 */
router.post('/connections/test', async (req: Request, res: Response) => {
  try {
    const validation = dbConnectionSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid data', details: validation.error.format() });
    }
    
    const { username, password, tags, ...rest } = validation.data;
    
    const testConfig: DatabaseConfig = {
      id: 'test',
      credentials: JSON.stringify({ username, password }),
      tags: tags ? tags.join(',') : null,
      ...rest,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const result = await databaseConnector.testConnection(testConfig);
    return res.json(result);
  } catch (error) {
    console.error('Error testing database connection:', error);
    return res.status(500).json({ error: 'Failed to test database connection' });
  }
});

/**
 * List tables for a specific database connection
 */
router.get('/connections/:id/tables', async (req: Request, res: Response) => {
  try {
    const tables = await databaseConnector.listTables(req.params.id);
    return res.json(tables);
  } catch (error) {
    console.error('Error listing tables:', error);
    return res.status(500).json({ error: 'Failed to list tables' });
  }
});

/**
 * Get schema for a specific table
 */
router.get('/connections/:id/tables/:tableName/schema', async (req: Request, res: Response) => {
  try {
    const schema = await databaseConnector.getTableSchema(req.params.id, req.params.tableName);
    return res.json(schema);
  } catch (error) {
    console.error('Error getting table schema:', error);
    return res.status(500).json({ error: 'Failed to get table schema' });
  }
});

/**
 * Execute a query on a specific database connection
 */
router.post('/connections/:id/query', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const result = await databaseConnector.executeQuery(req.params.id, query);
    return res.json(result);
  } catch (error) {
    console.error('Error executing query:', error);
    return res.status(500).json({ error: 'Failed to execute query' });
  }
});

/**
 * Execute a query using the query builder
 */
router.post('/connections/:id/query-builder', async (req: Request, res: Response) => {
  try {
    const validationSchema = z.object({
      table: z.string(),
      columns: z.array(z.string()).optional(),
      where: z.record(z.any()).optional(),
      orderBy: z.array(z.object({ column: z.string(), direction: z.enum(['asc', 'desc']) })).optional(),
      limit: z.number().int().positive().optional(),
      offset: z.number().int().min(0).optional()
    });
    
    const validation = validationSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid query options', details: validation.error.format() });
    }
    
    const queryOptions: QueryOptions = validation.data;
    
    const result = await databaseConnector.executeQuery(req.params.id, '', queryOptions);
    return res.json(result);
  } catch (error) {
    console.error('Error executing query:', error);
    return res.status(500).json({ error: 'Failed to execute query' });
  }
});

export default router;