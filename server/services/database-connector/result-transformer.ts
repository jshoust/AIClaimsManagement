/**
 * Result transformer for query results
 */
import { QueryResult } from './types';

/**
 * Transform a query result based on configuration options
 */
export function transformQueryResult(
  result: QueryResult,
  transformOptions: {
    filter?: Record<string, any>;
    formatDates?: Record<string, string>;
    formatNumbers?: Record<string, string>;
    excludeColumns?: string[];
    includeColumns?: string[];
    limitRows?: number;
    mapColumnNames?: Record<string, string>;
  } = {}
): QueryResult {
  let { rows, columns, rowCount, metadata } = result;
  
  // Apply column filtering (include/exclude)
  if (transformOptions.includeColumns?.length) {
    // Only keep specified columns
    const newColumns = columns.filter(col => transformOptions.includeColumns?.includes(col));
    rows = rows.map(row => {
      const newRow: Record<string, any> = {};
      newColumns.forEach(col => {
        newRow[col] = row[col];
      });
      return newRow;
    });
    columns = newColumns;
  } else if (transformOptions.excludeColumns?.length) {
    // Remove specified columns
    const newColumns = columns.filter(col => !transformOptions.excludeColumns?.includes(col));
    rows = rows.map(row => {
      const newRow: Record<string, any> = {};
      newColumns.forEach(col => {
        newRow[col] = row[col];
      });
      return newRow;
    });
    columns = newColumns;
  }
  
  // Apply row filtering
  if (transformOptions.filter && Object.keys(transformOptions.filter).length > 0) {
    rows = rows.filter(row => {
      return Object.entries(transformOptions.filter || {}).every(([key, value]) => {
        // Skip if the column doesn't exist
        if (row[key] === undefined) return true;
        
        // Simple equality check
        if (typeof value !== 'object') {
          return row[key] === value;
        }
        
        // Complex conditions
        if (value.$eq !== undefined) return row[key] === value.$eq;
        if (value.$ne !== undefined) return row[key] !== value.$ne;
        if (value.$gt !== undefined) return row[key] > value.$gt;
        if (value.$gte !== undefined) return row[key] >= value.$gte;
        if (value.$lt !== undefined) return row[key] < value.$lt;
        if (value.$lte !== undefined) return row[key] <= value.$lte;
        if (value.$in !== undefined) return Array.isArray(value.$in) && value.$in.includes(row[key]);
        if (value.$nin !== undefined) return Array.isArray(value.$nin) && !value.$nin.includes(row[key]);
        if (value.$contains !== undefined && typeof row[key] === 'string') 
          return row[key].includes(String(value.$contains));
        if (value.$startsWith !== undefined && typeof row[key] === 'string') 
          return row[key].startsWith(String(value.$startsWith));
        if (value.$endsWith !== undefined && typeof row[key] === 'string') 
          return row[key].endsWith(String(value.$endsWith));
        
        return true;
      });
    });
  }
  
  // Apply row limit
  if (transformOptions.limitRows !== undefined && transformOptions.limitRows >= 0) {
    rows = rows.slice(0, transformOptions.limitRows);
  }
  
  // Format dates and numbers
  if (transformOptions.formatDates || transformOptions.formatNumbers) {
    rows = rows.map(row => {
      const newRow = { ...row };
      
      // Format dates
      if (transformOptions.formatDates) {
        Object.entries(transformOptions.formatDates).forEach(([column, format]) => {
          if (newRow[column] && newRow[column] instanceof Date) {
            // Simple date formatting - in a real implementation would use a library like date-fns
            newRow[column] = formatDate(newRow[column], format);
          }
        });
      }
      
      // Format numbers
      if (transformOptions.formatNumbers) {
        Object.entries(transformOptions.formatNumbers).forEach(([column, format]) => {
          if (typeof newRow[column] === 'number') {
            // Simple number formatting - in a real implementation would use more robust formatting
            newRow[column] = formatNumber(newRow[column], format);
          }
        });
      }
      
      return newRow;
    });
  }
  
  // Rename columns
  if (transformOptions.mapColumnNames && Object.keys(transformOptions.mapColumnNames).length > 0) {
    const columnMap = transformOptions.mapColumnNames;
    const newColumns = columns.map(col => columnMap[col] || col);
    
    rows = rows.map(row => {
      const newRow: Record<string, any> = {};
      Object.keys(row).forEach(key => {
        const newKey = columnMap[key] || key;
        newRow[newKey] = row[key];
      });
      return newRow;
    });
    
    columns = newColumns;
  }
  
  return {
    columns,
    rows,
    rowCount: rows.length,
    metadata
  };
}

/**
 * Simple date formatter
 */
function formatDate(date: Date, format: string): string {
  // Very basic implementation - in a real app would use date-fns or similar
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  // Replace tokens in format string
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * Simple number formatter
 */
function formatNumber(num: number, format: string): string {
  // Very basic implementation - in a real app would use a proper number formatting library
  switch (format.toLowerCase()) {
    case 'currency':
      return `$${num.toFixed(2)}`;
    case 'percent':
      return `${(num * 100).toFixed(2)}%`;
    case 'integer':
      return Math.round(num).toString();
    case 'decimal1':
      return num.toFixed(1);
    case 'decimal2':
      return num.toFixed(2);
    case 'decimal3':
      return num.toFixed(3);
    default:
      return num.toString();
  }
}