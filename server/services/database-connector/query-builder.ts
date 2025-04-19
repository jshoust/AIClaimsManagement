/**
 * Query builder for generating SQL queries for different database types
 */
import { 
  DatabaseType, 
  QueryBuilderConfig, 
  JoinConfig, 
  WhereCondition,
  SortOption 
} from './types';

/**
 * Build a SQL query based on the provided configuration
 */
export function buildQuery(config: QueryBuilderConfig, dbType: DatabaseType): string {
  // Start with the SELECT clause
  let query = 'SELECT ';
  
  // Add columns
  if (config.select && config.select.length > 0) {
    query += config.select.map(col => escapeIdentifier(col, dbType)).join(', ');
  } else {
    query += '*';
  }
  
  // Add FROM clause
  query += ` FROM ${escapeIdentifier(config.from, dbType)}`;
  
  // Add JOINs if any
  if (config.joins && config.joins.length > 0) {
    config.joins.forEach(join => {
      query += ` ${buildJoinClause(join, col => escapeIdentifier(col, dbType))}`;
    });
  }
  
  // Add WHERE clause if conditions exist
  if (config.where && config.where.length > 0) {
    query += ` WHERE ${buildWhereClause(config.where, col => escapeIdentifier(col, dbType), dbType)}`;
  }
  
  // Add GROUP BY clause
  if (config.groupBy && config.groupBy.length > 0) {
    query += ` GROUP BY ${config.groupBy.map(col => escapeIdentifier(col, dbType)).join(', ')}`;
  }
  
  // Add HAVING clause
  if (config.having && config.having.length > 0) {
    query += ` HAVING ${buildWhereClause(config.having, col => escapeIdentifier(col, dbType), dbType)}`;
  }
  
  // Add ORDER BY clause
  if (config.orderBy && config.orderBy.length > 0) {
    query += ` ORDER BY ${config.orderBy.map(sort => 
      `${escapeIdentifier(sort.field, dbType)} ${sort.direction.toUpperCase()}`
    ).join(', ')}`;
  }
  
  // Add LIMIT and OFFSET clauses based on database type
  if (config.limit !== undefined) {
    switch (dbType) {
      case 'oracle':
        // Oracle doesn't support LIMIT directly, we'll handle this in the main connector
        if (config.offset !== undefined) {
          query = `SELECT * FROM (SELECT a.*, ROWNUM rnum FROM (${query}) a WHERE ROWNUM <= ${config.limit + config.offset}) WHERE rnum > ${config.offset}`;
        } else {
          query = `SELECT * FROM (${query}) WHERE ROWNUM <= ${config.limit}`;
        }
        break;
        
      case 'sqlserver':
        // SQL Server uses TOP/OFFSET/FETCH
        if (config.offset !== undefined) {
          // If there's an OFFSET, we need ORDER BY
          if (!config.orderBy || config.orderBy.length === 0) {
            // Add a dummy ORDER BY if none exists
            query += ` ORDER BY (SELECT NULL)`;
          }
          query += ` OFFSET ${config.offset} ROWS FETCH NEXT ${config.limit} ROWS ONLY`;
        } else {
          // SQL Server TOP clause goes in SELECT
          query = query.replace('SELECT ', `SELECT TOP ${config.limit} `);
        }
        break;
        
      default:
        // MySQL & PostgreSQL use standard LIMIT/OFFSET
        query += ` LIMIT ${config.limit}`;
        if (config.offset !== undefined) {
          query += ` OFFSET ${config.offset}`;
        }
    }
  }
  
  return query;
}

/**
 * Build a JOIN clause for the query
 */
function buildJoinClause(join: JoinConfig, escapeIdentifier: (name: string) => string): string {
  let joinClause = '';
  
  // Determine join type
  switch (join.type) {
    case 'inner':
      joinClause = 'INNER JOIN';
      break;
    case 'left':
      joinClause = 'LEFT JOIN';
      break;
    case 'right':
      joinClause = 'RIGHT JOIN';
      break;
    case 'full':
      joinClause = 'FULL OUTER JOIN';
      break;
    default:
      joinClause = 'JOIN';
  }
  
  // Add table and ON condition
  joinClause += ` ${escapeIdentifier(join.table)} ON ${escapeIdentifier(join.on.leftField)} ${join.on.operator} ${escapeIdentifier(join.on.rightField)}`;
  
  return joinClause;
}

/**
 * Build a WHERE clause for the query
 */
function buildWhereClause(
  conditions: WhereCondition[], 
  escapeIdentifier: (name: string) => string, 
  dbType: DatabaseType
): string {
  if (conditions.length === 0) {
    return '';
  }
  
  return conditions.map((condition, index) => {
    // Logic operator (AND/OR) - not needed for the first condition
    const logicOp = index === 0 ? '' : ` ${condition.logic || 'AND'} `;
    
    // Build the condition
    let conditionStr = '';
    const fieldName = escapeIdentifier(condition.field, dbType);
    
    switch (condition.operator.toLowerCase()) {
      case 'equals':
      case '=':
        conditionStr = `${fieldName} = ${formatValue(condition.value, dbType)}`;
        break;
        
      case 'notequals':
      case '!=':
      case '<>':
        conditionStr = `${fieldName} <> ${formatValue(condition.value, dbType)}`;
        break;
        
      case 'contains':
      case 'like':
        conditionStr = dbType === 'sqlserver' 
          ? `${fieldName} LIKE N'%' + ${formatValue(condition.value, dbType, false)} + N'%'`
          : `${fieldName} LIKE CONCAT('%', ${formatValue(condition.value, dbType, false)}, '%')`;
        break;
        
      case 'startswith':
      case 'startswith':
        conditionStr = dbType === 'sqlserver'
          ? `${fieldName} LIKE ${formatValue(condition.value, dbType, false)} + N'%'`
          : `${fieldName} LIKE CONCAT(${formatValue(condition.value, dbType, false)}, '%')`;
        break;
        
      case 'endswith':
      case 'endswith':
        conditionStr = dbType === 'sqlserver'
          ? `${fieldName} LIKE N'%' + ${formatValue(condition.value, dbType, false)}`
          : `${fieldName} LIKE CONCAT('%', ${formatValue(condition.value, dbType, false)})`;
        break;
        
      case 'greaterthan':
      case '>':
        conditionStr = `${fieldName} > ${formatValue(condition.value, dbType)}`;
        break;
        
      case 'lessthan':
      case '<':
        conditionStr = `${fieldName} < ${formatValue(condition.value, dbType)}`;
        break;
        
      case 'greaterthanorequals':
      case '>=':
        conditionStr = `${fieldName} >= ${formatValue(condition.value, dbType)}`;
        break;
        
      case 'lessthanorequals':
      case '<=':
        conditionStr = `${fieldName} <= ${formatValue(condition.value, dbType)}`;
        break;
        
      case 'in':
        if (Array.isArray(condition.value)) {
          const values = condition.value.map(v => formatValue(v, dbType)).join(', ');
          conditionStr = `${fieldName} IN (${values})`;
        } else {
          conditionStr = `${fieldName} IN (${formatValue(condition.value, dbType)})`;
        }
        break;
        
      case 'between':
        if (Array.isArray(condition.value) && condition.value.length >= 2) {
          conditionStr = `${fieldName} BETWEEN ${formatValue(condition.value[0], dbType)} AND ${formatValue(condition.value[1], dbType)}`;
        } else {
          conditionStr = `${fieldName} = ${formatValue(condition.value, dbType)}`;
        }
        break;
        
      case 'isnull':
        conditionStr = `${fieldName} IS NULL`;
        break;
        
      case 'isnotnull':
        conditionStr = `${fieldName} IS NOT NULL`;
        break;
        
      default:
        conditionStr = `${fieldName} = ${formatValue(condition.value, dbType)}`;
    }
    
    return logicOp + conditionStr;
  }).join('');
}

/**
 * Format a value for SQL based on its type and the database engine
 */
function formatValue(value: any, dbType: DatabaseType, addQuotes = true): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  if (typeof value === 'boolean') {
    switch (dbType) {
      case 'sqlserver':
      case 'postgres':
        return value ? '1' : '0';
      case 'mysql':
        return value ? 'TRUE' : 'FALSE';
      case 'oracle':
        return value ? '1' : '0';
      default:
        return value ? '1' : '0';
    }
  }
  
  if (value instanceof Date) {
    switch (dbType) {
      case 'sqlserver':
        return `CONVERT(DATETIME, '${value.toISOString().slice(0, 19).replace('T', ' ')}')`;
      case 'mysql':
        return addQuotes ? `'${value.toISOString().slice(0, 19).replace('T', ' ')}'` : value.toISOString().slice(0, 19).replace('T', ' ');
      case 'postgres':
        return addQuotes ? `'${value.toISOString()}'` : value.toISOString();
      case 'oracle':
        return `TO_TIMESTAMP('${value.toISOString().slice(0, 19).replace('T', ' ')}', 'YYYY-MM-DD HH24:MI:SS')`;
      default:
        return addQuotes ? `'${value.toISOString()}'` : value.toISOString();
    }
  }
  
  // Handle strings
  if (typeof value === 'string') {
    // Escape single quotes by doubling them
    const escaped = value.replace(/'/g, "''");
    
    if (!addQuotes) {
      return escaped;
    }
    
    switch (dbType) {
      case 'sqlserver':
        return `N'${escaped}'`; // Use Unicode strings for SQL Server
      default:
        return `'${escaped}'`;
    }
  }
  
  // Handle arrays by converting to string
  if (Array.isArray(value)) {
    return value.map(v => formatValue(v, dbType)).join(', ');
  }
  
  // For objects, convert to JSON string
  if (typeof value === 'object') {
    return addQuotes ? `'${JSON.stringify(value).replace(/'/g, "''")}'` : JSON.stringify(value).replace(/'/g, "''");
  }
  
  // Default fallback
  return addQuotes ? `'${String(value).replace(/'/g, "''")}'` : String(value).replace(/'/g, "''");
}

/**
 * Escape an identifier (table or column name) based on database type
 */
function escapeIdentifier(identifier: string, dbType: DatabaseType): string {
  // If the identifier already has quotes or brackets, return as is
  if (/^[\[\]"`'].*[\[\]"`']$/.test(identifier)) {
    return identifier;
  }
  
  // If it's a qualified name (contains dots), escape each part
  if (identifier.includes('.')) {
    return identifier.split('.')
      .map(part => escapeIdentifier(part, dbType))
      .join('.');
  }
  
  // Handle * for SELECT *
  if (identifier === '*') {
    return '*';
  }
  
  // Escape based on database type
  switch (dbType) {
    case 'sqlserver':
      return `[${identifier}]`;
    case 'mysql':
      return `\`${identifier}\``;
    case 'postgres':
      return `"${identifier}"`;
    case 'oracle':
      return `"${identifier}"`;
    default:
      return `"${identifier}"`;
  }
}