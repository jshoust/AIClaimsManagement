/**
 * Result transformer for query results
 */
import { QueryResult, TransformConfig, FilterCondition, DateFormatConfig } from './types';

/**
 * Transform a query result based on the provided configuration
 */
export function transformQueryResult(result: QueryResult, config?: TransformConfig): QueryResult {
  if (!config) {
    return result;
  }
  
  let transformedResult = { ...result };
  
  // Clone rows to avoid modifying the original result
  let transformedRows = JSON.parse(JSON.stringify(result.rows));
  
  // Apply transformations in sequence
  
  // 1. Rename columns if specified
  if (config.renameColumns) {
    // Update the columns array
    transformedResult.columns = result.columns.map(col => {
      if (config.renameColumns && config.renameColumns[col.name]) {
        return {
          ...col,
          name: config.renameColumns[col.name]
        };
      }
      return col;
    });
    
    // Update the row objects
    transformedRows = transformedRows.map((row: any) => {
      const newRow: any = {};
      Object.keys(row).forEach(key => {
        const newKey = config.renameColumns && config.renameColumns[key] ? config.renameColumns[key] : key;
        newRow[newKey] = row[key];
      });
      return newRow;
    });
  }
  
  // 2. Calculate new fields if specified
  if (config.calculateFields && config.calculateFields.length > 0) {
    // Add calculated columns to the columns array
    config.calculateFields.forEach(calcField => {
      transformedResult.columns.push({
        name: calcField.name,
        type: 'calculated',
        nullable: true
      });
    });
    
    // Add calculated values to each row
    transformedRows = transformedRows.map((row: any) => {
      const newRow = { ...row };
      
      config.calculateFields?.forEach(calcField => {
        // Parse the formula and replace column references with actual values
        let formula = calcField.formula;
        
        // Replace all column references in the format {columnName} with the actual value
        Object.keys(row).forEach(key => {
          const regex = new RegExp(`\\{${key}\\}`, 'g');
          const value = row[key] === null ? 'null' : JSON.stringify(row[key]);
          formula = formula.replace(regex, value);
        });
        
        // Evaluate the formula (with safe eval)
        try {
          // Use Function constructor instead of eval for better security
          // Still not completely safe for untrusted user input
          const calculatedValue = new Function(`return ${formula}`)();
          newRow[calcField.name] = calculatedValue;
        } catch (error) {
          console.error(`Error calculating field ${calcField.name}:`, error);
          newRow[calcField.name] = null;
        }
      });
      
      return newRow;
    });
  }
  
  // 3. Filter rows if specified
  if (config.filterRows && config.filterRows.length > 0) {
    transformedRows = filterRows(transformedRows, config.filterRows);
    transformedResult.rowCount = transformedRows.length;
  }
  
  // 4. Format dates if specified
  if (config.formatDates && config.formatDates.length > 0) {
    transformedRows = formatDates(transformedRows, config.formatDates);
  }
  
  // 5. Exclude columns if specified
  if (config.excludeColumns && config.excludeColumns.length > 0) {
    // Update the columns array
    transformedResult.columns = transformedResult.columns.filter(
      col => !config.excludeColumns?.includes(col.name)
    );
    
    // Update the row objects
    transformedRows = transformedRows.map((row: any) => {
      const newRow: any = {};
      Object.keys(row).forEach(key => {
        if (!config.excludeColumns?.includes(key)) {
          newRow[key] = row[key];
        }
      });
      return newRow;
    });
  }
  
  transformedResult.rows = transformedRows;
  
  return transformedResult;
}

/**
 * Filter rows based on filter conditions
 */
function filterRows(rows: any[], filterConditions: FilterCondition[]): any[] {
  return rows.filter(row => {
    // A row must satisfy all filter conditions
    return filterConditions.every(condition => {
      const { column, operator, value } = condition;
      const rowValue = row[column];
      
      // Handle null values
      if (rowValue === null || rowValue === undefined) {
        return operator === 'equals' && value === null;
      }
      
      // Compare based on operator
      switch (operator) {
        case 'equals':
          return rowValue === value;
        case 'notEquals':
          return rowValue !== value;
        case 'greaterThan':
          return rowValue > value;
        case 'lessThan':
          return rowValue < value;
        case 'contains':
          return typeof rowValue === 'string' && rowValue.includes(value);
        case 'startsWith':
          return typeof rowValue === 'string' && rowValue.startsWith(value);
        case 'endsWith':
          return typeof rowValue === 'string' && rowValue.endsWith(value);
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
    const newRow = { ...row };
    
    dateFormatConfigs.forEach(config => {
      const { column, format } = config;
      const value = row[column];
      
      if (value !== null && value !== undefined) {
        try {
          // Parse the value as a date if it's a string
          const date = typeof value === 'string' ? new Date(value) : value;
          
          // Check if the date is valid
          if (date instanceof Date && !isNaN(date.getTime())) {
            // Format the date according to the specified format
            newRow[column] = formatDate(date, format);
          }
        } catch (error) {
          console.error(`Error formatting date for column ${column}:`, error);
        }
      }
    });
    
    return newRow;
  });
}

/**
 * Format a date according to the specified format string
 */
function formatDate(date: Date, format: string): string {
  // Simple date formatting implementation
  // In a real implementation, we would use a library like date-fns
  
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  // Replace format tokens with actual values
  return format
    .replace(/YYYY/g, year)
    .replace(/MM/g, month)
    .replace(/DD/g, day)
    .replace(/HH/g, hours)
    .replace(/mm/g, minutes)
    .replace(/ss/g, seconds);
}