/**
 * Configuration manager for database connections
 * Handles storing and retrieving database configurations
 */
import { db } from '../../db';
import { DatabaseConfig, DatabaseType } from './types';
import { externalDatabases } from '../../../shared/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

/**
 * Get all database configurations
 */
export async function getDbConfigurations(): Promise<DatabaseConfig[]> {
  try {
    const dbConfigs = await db.select().from(externalDatabases);
    
    return dbConfigs.map(config => {
      let credentials;
      // Parse stored credentials
      try {
        credentials = JSON.parse(config.credentials);
      } catch (e) {
        credentials = { username: '', password: '' };
        console.error('Error parsing credentials for database:', config.id, e);
      }
      
      // Parse stored tags
      let tags: string[] | undefined;
      if (config.tags) {
        try {
          tags = JSON.parse(config.tags);
        } catch (e) {
          console.error('Error parsing tags for database:', config.id, e);
        }
      }
      
      return {
        id: config.id,
        name: config.name,
        description: config.description || '',
        type: config.type as DatabaseType,
        host: config.host,
        port: config.port,
        database: config.database,
        schema: config.schema || undefined,
        credentials,
        createdAt: config.createdAt.toISOString(),
        updatedAt: config.updatedAt.toISOString(),
        lastConnected: config.lastConnected ? config.lastConnected.toISOString() : undefined,
        tags,
        isActive: config.isActive,
        createdBy: config.createdBy,
      };
    });
  } catch (error) {
    console.error('Error getting database configurations:', error);
    return [];
  }
}

/**
 * Get a specific database configuration by ID
 */
export async function getDbConfiguration(id: string): Promise<DatabaseConfig | null> {
  try {
    const [config] = await db.select().from(externalDatabases).where(eq(externalDatabases.id, id));
    
    if (!config) {
      return null;
    }
    
    let credentials;
    // Parse stored credentials
    try {
      credentials = JSON.parse(config.credentials);
    } catch (e) {
      credentials = { username: '', password: '' };
      console.error('Error parsing credentials for database:', config.id, e);
    }
    
    // Parse stored tags
    let tags: string[] | undefined;
    if (config.tags) {
      try {
        tags = JSON.parse(config.tags);
      } catch (e) {
        console.error('Error parsing tags for database:', config.id, e);
      }
    }
    
    return {
      id: config.id,
      name: config.name,
      description: config.description || '',
      type: config.type as DatabaseType,
      host: config.host,
      port: config.port,
      database: config.database,
      schema: config.schema || undefined,
      credentials,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
      lastConnected: config.lastConnected ? config.lastConnected.toISOString() : undefined,
      tags,
      isActive: config.isActive,
      createdBy: config.createdBy,
    };
  } catch (error) {
    console.error('Error getting database configuration:', error);
    return null;
  }
}

/**
 * Save a database configuration
 */
export async function saveDbConfiguration(config: DatabaseConfig): Promise<DatabaseConfig> {
  try {
    // Check if config already exists
    const existingConfigs = await db.select().from(externalDatabases).where(eq(externalDatabases.id, config.id));
    const exists = existingConfigs.length > 0;
    
    // Prepare data for insertion/update
    const { credentials, tags, ...rest } = config;
    
    const dbConfig = {
      ...rest,
      credentials: typeof credentials === 'string' ? credentials : JSON.stringify(credentials),
      tags: tags ? JSON.stringify(tags) : null,
      // Use current date for updated time
      updatedAt: new Date()
    };
    
    if (exists) {
      // Update existing config
      await db.update(externalDatabases)
        .set(dbConfig)
        .where(eq(externalDatabases.id, config.id));
    } else {
      // Insert new config
      // Ensure we have an ID
      if (!dbConfig.id) {
        dbConfig.id = uuidv4();
      }
      
      // Set created time for new configs
      dbConfig.createdAt = new Date();
      
      await db.insert(externalDatabases).values(dbConfig);
    }
    
    // Return the saved config
    const savedConfig = await getDbConfiguration(dbConfig.id);
    if (!savedConfig) {
      throw new Error('Failed to retrieve saved configuration');
    }
    
    return savedConfig;
  } catch (error) {
    console.error('Error saving database configuration:', error);
    throw error;
  }
}

/**
 * Update the lastConnected timestamp for a database configuration
 */
export async function updateLastConnected(id: string): Promise<void> {
  try {
    await db.update(externalDatabases)
      .set({ lastConnected: new Date() })
      .where(eq(externalDatabases.id, id));
  } catch (error) {
    console.error('Error updating lastConnected timestamp:', error);
  }
}

/**
 * Delete a database configuration
 */
export async function deleteDbConfiguration(id: string): Promise<boolean> {
  try {
    await db.delete(externalDatabases).where(eq(externalDatabases.id, id));
    return true;
  } catch (error) {
    console.error('Error deleting database configuration:', error);
    return false;
  }
}