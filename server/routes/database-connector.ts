/**
 * API routes for the database connector
 */
import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { 
  testDatabaseConnection,
  getDatabaseConfigurations,
  getDatabaseConfiguration,
  saveDatabaseConfiguration,
  deleteDatabaseConfiguration,
  listDatabaseTables,
  getTableSchema,
  executeQuery,
  buildAndExecuteQuery
} from '../services/database-connector';
import { QueryOptions } from '../services/database-connector/types';

const router = express.Router();

// Schema for database connection validation
const databaseConnectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(["mysql", "postgres", "sqlserver", "oracle"], {
    required_error: "Please select a database type",
  }),
  host: z.string().min(1, "Host is required"),
  port: z.number({
    required_error: "Port is required",
    invalid_type_error: "Port must be a number",
  }).int().positive(),
  database: z.string().min(1, "Database name is required"),
  schema: z.string().optional(),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  ssl: z.boolean().optional(),
  rejectUnauthorized: z.boolean().optional(),
  tags: z.array(z.string()).optional()
});

// Get all database connections
router.get('/connections', async (req: Request, res: Response) => {
  try {
    const connections = await getDatabaseConfigurations();
    
    // Don't send credentials in the response for security
    const sanitizedConnections = connections.map(conn => ({
      ...conn,
      credentials: undefined
    }));
    
    res.json(sanitizedConnections);
  } catch (error) {
    console.error('Error fetching database connections:', error);
    res.status(500).json({ 
      message: "Failed to fetch database connections", 
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get a specific database connection
router.get('/connections/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const connection = await getDatabaseConfiguration(id);
    
    if (!connection) {
      return res.status(404).json({ message: "Database connection not found" });
    }
    
    // Don't send credentials in the response for security
    const { credentials, ...sanitizedConnection } = connection;
    
    res.json(sanitizedConnection);
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to fetch database connection", 
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Create a new database connection
router.post('/connections', async (req: Request, res: Response) => {
  try {
    const validatedData = databaseConnectionSchema.parse(req.body);
    
    const newConnection = await saveDatabaseConfiguration({
      id: uuidv4(),
      ...validatedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      createdBy: req.body.createdBy || req.body.username || 'system'
    });
    
    // Don't send credentials in the response
    const { credentials, ...sanitizedConnection } = newConnection;
    
    res.status(201).json(sanitizedConnection);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid database connection data", 
        errors: fromZodError(error).message 
      });
    }
    
    res.status(500).json({ 
      message: "Failed to create database connection", 
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Update an existing database connection
router.put('/connections/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const existingConnection = await getDatabaseConfiguration(id);
    
    if (!existingConnection) {
      return res.status(404).json({ message: "Database connection not found" });
    }
    
    const validatedData = databaseConnectionSchema.parse(req.body);
    
    const updatedConnection = await saveDatabaseConfiguration({
      id,
      ...validatedData,
      updatedAt: new Date().toISOString(),
      createdAt: existingConnection.createdAt,
      lastConnected: existingConnection.lastConnected
    });
    
    // Don't send credentials in the response
    const { credentials, ...sanitizedConnection } = updatedConnection;
    
    res.json(sanitizedConnection);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid database connection data", 
        errors: fromZodError(error).message 
      });
    }
    
    res.status(500).json({ 
      message: "Failed to update database connection", 
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Delete a database connection
router.delete('/connections/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const success = await deleteDatabaseConfiguration(id);
    
    if (!success) {
      return res.status(404).json({ message: "Database connection not found" });
    }
    
    res.json({ success: true, message: "Database connection deleted successfully" });
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to delete database connection", 
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Test a database connection
router.post('/connections/test', async (req: Request, res: Response) => {
  try {
    // Validate connection details
    const validatedData = databaseConnectionSchema.parse(req.body);
    
    // Test the connection
    const result = await testDatabaseConnection(validatedData);
    
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid database connection data", 
        errors: fromZodError(error).message 
      });
    }
    
    res.status(500).json({ 
      message: "Failed to test database connection", 
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get tables for a database connection
router.get('/connections/:id/tables', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const tables = await listDatabaseTables(id);
    
    res.json(tables);
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to fetch tables", 
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get schema for a table
router.get('/connections/:id/tables/:tableName/schema', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const tableName = req.params.tableName;
    
    const schema = await getTableSchema(id, tableName);
    
    res.json(schema);
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to fetch table schema", 
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Execute a custom SQL query
router.post('/connections/:id/query', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { query, params } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: "Query is required" });
    }
    
    const result = await executeQuery(id, query, params || []);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to execute query", 
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Execute a query using the query builder
router.post('/connections/:id/queryBuilder', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const options: QueryOptions = req.body;
    
    if (!options.table) {
      return res.status(400).json({ message: "Table name is required" });
    }
    
    const result = await buildAndExecuteQuery(id, options);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to execute query", 
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;