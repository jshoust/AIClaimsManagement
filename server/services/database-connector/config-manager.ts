/**
 * Database configuration manager
 * 
 * Handles saving and retrieving database connection configurations
 */
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseConfig } from './types';
import { db } from '../../db';
import { eq } from 'drizzle-orm';
import { externalDatabases } from '../../../shared/schema';

// Path for storing database configurations if using file storage
const CONFIG_PATH = path.join(process.cwd(), 'data', 'db-connections.json');

// Using environment variable to determine storage type
const STORAGE_TYPE = process.env.DB_CONFIG_STORAGE || 'database'; // 'file' or 'database'

/**
 * Initialize the configuration storage if needed
 */
async function initializeStorage(): Promise<void> {
  if (STORAGE_TYPE === 'file') {
    try {
      // Create directory if it doesn't exist
      await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
      
      // Check if the file exists
      try {
        await fs.access(CONFIG_PATH);
      } catch {
        // File doesn't exist, create it with empty array
        await fs.writeFile(CONFIG_PATH, JSON.stringify([], null, 2));
      }
    } catch (error) {
      console.error('Error initializing database configuration storage:', error);
      throw error;
    }
  }
  // For database storage, we assume the table already exists
}

/**
 * Get all database configurations
 */
export async function getDatabaseConfig(): Promise<DatabaseConfig[]> {
  await initializeStorage();
  
  try {
    if (STORAGE_TYPE === 'file') {
      const data = await fs.readFile(CONFIG_PATH, 'utf-8');
      return JSON.parse(data) as DatabaseConfig[];
    } else {
      // Use database storage
      const configs = await db.select().from(externalDatabases);
      return configs.map(config => ({
        ...config,
        credentials: JSON.parse(config.credentials as string) as DatabaseConfig['credentials'],
        tags: config.tags ? JSON.parse(config.tags as string) as string[] : undefined
      }));
    }
  } catch (error) {
    console.error('Error getting database configurations:', error);
    return [];
  }
}

/**
 * Save a database configuration
 */
export async function saveDatabaseConfig(config: DatabaseConfig): Promise<DatabaseConfig> {
  await initializeStorage();
  
  // Generate id if not provided
  if (!config.id) {
    config.id = uuidv4();
    config.createdAt = new Date().toISOString();
  }
  
  config.updatedAt = new Date().toISOString();
  
  try {
    if (STORAGE_TYPE === 'file') {
      // Get existing configs
      const configs = await getDatabaseConfig();
      
      // Find index of existing config if updating
      const existingIndex = configs.findIndex(c => c.id === config.id);
      
      if (existingIndex >= 0) {
        // Update existing
        configs[existingIndex] = config;
      } else {
        // Add new
        configs.push(config);
      }
      
      // Save back to file
      await fs.writeFile(CONFIG_PATH, JSON.stringify(configs, null, 2));
    } else {
      // Use database storage
      // Handle credentials serialization
      const dbConfig = {
        ...config,
        credentials: JSON.stringify(config.credentials),
        tags: config.tags ? JSON.stringify(config.tags) : null
      };
      
      // Check if config exists
      const existingConfig = await db.select({ id: externalDatabases.id })
        .from(externalDatabases)
        .where(eq(externalDatabases.id, config.id));
      
      if (existingConfig.length > 0) {
        // Update existing
        await db.update(externalDatabases)
          .set(dbConfig)
          .where(eq(externalDatabases.id, config.id));
      } else {
        // Insert new
        await db.insert(externalDatabases).values(dbConfig);
      }
    }
    
    return config;
  } catch (error) {
    console.error('Error saving database configuration:', error);
    throw error;
  }
}

/**
 * Delete a database configuration
 */
export async function deleteDatabaseConfig(id: string): Promise<boolean> {
  await initializeStorage();
  
  try {
    if (STORAGE_TYPE === 'file') {
      // Get existing configs
      const configs = await getDatabaseConfig();
      
      // Filter out the one to delete
      const newConfigs = configs.filter(c => c.id !== id);
      
      // Save back to file
      await fs.writeFile(CONFIG_PATH, JSON.stringify(newConfigs, null, 2));
    } else {
      // Use database storage
      await db.delete(externalDatabases)
        .where(eq(externalDatabases.id, id));
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting database configuration:', error);
    return false;
  }
}