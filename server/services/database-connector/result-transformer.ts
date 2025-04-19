/**
 * Result transformer for query results
 */
import { QueryResult, TransformConfig, FilterCondition, DateFormatConfig } from './types';
import { format as formatDate } from 'date-fns';

/**
 * Transform a query result based on the provided configuration
 */
export function transformQueryResult(result: QueryResult, config?: TransformConfig): QueryResult {
  if (!config) {
    return result;
  }
  
  let transformedResult = { ...result };
  
  // Apply filtering if configured
  if (config.filterConditions && config.filterConditions.length > 0) {
    transformedResult.rows = filterRows(transformedResult.rows, config.filterConditions);
    
    // Update metadata if available
    if (transformedResult.metadata) {
      transformedResult.metadata.totalRows = transformedResult.rows.length;
    }
  }
  
  // Apply date formatting if configured
  if (config.dateFormatOptions && config.dateFormatOptions.length > 0) {
    transformedResult.rows = formatDates(transformedResult.rows, config.dateFormatOptions);
  }
  
  // Apply sorting if configured
  if (config.sortOptions && config.sortOptions.length > 0) {
    transformedResult.rows.sort((a, b) => {
      for (const sort of config.sortOptions || []) {
        const fieldA = a[sort.field];
        const fieldB = b[sort.field];
        
        // Skip if both values are undefined
        if (fieldA === undefined && fieldB === undefined) {
          continue;
        }
        
        // Handle nulls (null values come last)
        if (fieldA === null && fieldB !== null) return sort.direction === 'asc' ? 1 : -1;
        if (fieldA !== null && fieldB === null) return sort.direction === 'asc' ? -1 : 1;
        
        // Regular comparison
        if (fieldA < fieldB) return sort.direction === 'asc' ? -1 : 1;
        if (fieldA > fieldB) return sort.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }
  
  // Apply pagination if configured
  if (config.pagination) {
    const { limit, offset } = config.pagination;
    transformedResult.rows = transformedResult.rows.slice(offset, offset + limit);
  }
  
  return transformedResult;
}

/**
 * Filter rows based on filter conditions
 */
function filterRows(rows: any[], filterConditions: FilterCondition[]): any[] {
  return rows.filter(row => {
    return filterConditions.every(condition => {
      const fieldValue = row[condition.field];
      
      // Handle null values
      if (fieldValue === null || fieldValue === undefined) {
        return false;
      }
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
          
        case 'notEquals':
          return fieldValue !== condition.value;
          
        case 'contains':
          return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
          
        case 'greaterThan':
          return fieldValue > condition.value;
          
        case 'lessThan':
          return fieldValue < condition.value;
          
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(fieldValue);
          
        case 'between':
          return Array.isArray(condition.value) && 
            fieldValue >= condition.value[0] && 
            fieldValue <= condition.value[1];
            
        default:
          return true;
      }
    });
  });
}

/**
 * Format date fields based on format configuration
 */
function formatDates(rows: any[], dateFormatConfigs: DateFormatConfig[]): any[] {
  return rows.map(row => {
    const formattedRow = { ...row };
    
    dateFormatConfigs.forEach(config => {
      const value = row[config.field];
      
      if (value && (value instanceof Date || !isNaN(new Date(value).getTime()))) {
        const dateObj = value instanceof Date ? value : new Date(value);
        formattedRow[config.field] = formatDateValue(dateObj, config.format);
      }
    });
    
    return formattedRow;
  });
}

/**
 * Format a date according to the specified format string
 */
function formatDateValue(date: Date, format: string): string {
  try {
    return formatDate(date, format);
  } catch (error) {
    console.error('Error formatting date:', error);
    return date.toISOString();
  }
}