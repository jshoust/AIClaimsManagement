/**
 * Configuration manager for database connections
 * Handles storing and retrieving database configurations
 */

import { db } from '../../db';
import { externalDatabases } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { DatabaseConfig, DatabaseType } from './types';

/**
 * Get all database configurations
 */
export async function getDbConfigurations(): Promise<DatabaseConfig[]> {
  try {
    const dbConfigs = await db.select().from(externalDatabases);
    
    return dbConfigs.map(config => ({
      id: config.id,
      name: config.name,
      description: config.description || '',
      type: config.type as DatabaseType,
      host: config.host,
      port: config.port,
      database: config.database,
      schema: config.schema,
      credentials: config.credentials,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
      lastConnected: config.lastConnected?.toISOString(),
      tags: config.tags ? config.tags.split(',') : null,
      isActive: config.isActive,
      createdBy: config.createdBy
    }));
  } catch (error) {
    console.error('Error fetching database configurations:', error);
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
    
    return {
      id: config.id,
      name: config.name,
      description: config.description || '',
      type: config.type as DatabaseType,
      host: config.host,
      port: config.port,
      database: config.database,
      schema: config.schema,
      credentials: config.credentials,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
      lastConnected: config.lastConnected?.toISOString(),
      tags: config.tags,
      isActive: config.isActive,
      createdBy: config.createdBy
    };
  } catch (error) {
    console.error(`Error fetching database configuration ${id}:`, error);
    return null;
  }
}

/**
 * Save a database configuration
 */
export async function saveDbConfiguration(config: DatabaseConfig): Promise<DatabaseConfig> {
  try {
    // Check if configuration already exists
    const existing = await getDbConfiguration(config.id);
    
    if (existing) {
      // Update existing configuration
      await db.update(externalDatabases)
        .set({
          name: config.name,
          description: config.description,
          type: config.type,
          host: config.host,
          port: config.port,
          database: config.database,
          schema: config.schema,
          credentials: config.credentials,
          updatedAt: new Date(),
          tags: config.tags,
          isActive: config.isActive
        })
        .where(eq(externalDatabases.id, config.id));
      
      return await getDbConfiguration(config.id) as DatabaseConfig;
    } else {
      // Insert new configuration
      const [inserted] = await db.insert(externalDatabases)
        .values({
          id: config.id,
          name: config.name,
          description: config.description,
          type: config.type,
          host: config.host,
          port: config.port,
          database: config.database,
          schema: config.schema,
          credentials: config.credentials,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: config.tags,
          isActive: config.isActive,
          createdBy: config.createdBy
        })
        .returning();
      
      return {
        id: inserted.id,
        name: inserted.name,
        description: inserted.description || '',
        type: inserted.type as DatabaseType,
        host: inserted.host,
        port: inserted.port,
        database: inserted.database,
        schema: inserted.schema,
        credentials: inserted.credentials,
        createdAt: inserted.createdAt.toISOString(),
        updatedAt: inserted.updatedAt.toISOString(),
        lastConnected: inserted.lastConnected?.toISOString(),
        tags: inserted.tags,
        isActive: inserted.isActive,
        createdBy: inserted.createdBy
      };
    }
  } catch (error) {
    console.error(`Error saving database configuration ${config.id}:`, error);
    throw new Error(`Failed to save database configuration: ${error.message}`);
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
    console.error(`Error updating lastConnected for database ${id}:`, error);
  }
}

/**
 * Delete a database configuration
 */
export async function deleteDbConfiguration(id: string): Promise<boolean> {
  try {
    const result = await db.delete(externalDatabases)
      .where(eq(externalDatabases.id, id))
      .returning({ id: externalDatabases.id });
    
    return result.length > 0;
  } catch (error) {
    console.error(`Error deleting database configuration ${id}:`, error);
    return false;
  }
}