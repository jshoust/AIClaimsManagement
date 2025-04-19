/**
 * Query builder for generating SQL queries for different database types
 */
import { 
  DatabaseType, 
  QueryBuilderConfig, 
  WhereCondition, 
  OrderByConfig,
  JoinConfig
} from './types';

/**
 * Build a SQL query based on the provided configuration
 */
export function buildQuery(config: QueryBuilderConfig, dbType: DatabaseType): string {
  const { table, columns, where, orderBy, groupBy, limit, offset, joins } = config;
  
  // Map of SQL syntax differences between database types
  const syntaxMap = {
    sqlserver: {
      limitClause: (limit: number, offset?: number) => 
        offset ? `OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY` : `TOP ${limit}`,
      escapeChar: '[',
      escapeCharEnd: ']',
      boolTrue: '1',
      boolFalse: '0'
    },
    mysql: {
      limitClause: (limit: number, offset?: number) => 
        offset ? `LIMIT ${offset}, ${limit}` : `LIMIT ${limit}`,
      escapeChar: '`',
      escapeCharEnd: '`',
      boolTrue: 'TRUE',
      boolFalse: 'FALSE'
    },
    postgres: {
      limitClause: (limit: number, offset?: number) => 
        offset ? `LIMIT ${limit} OFFSET ${offset}` : `LIMIT ${limit}`,
      escapeChar: '"',
      escapeCharEnd: '"',
      boolTrue: 'TRUE',
      boolFalse: 'FALSE'
    },
    oracle: {
      limitClause: (limit: number, offset?: number) => 
        offset 
          ? `OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY` 
          : `FETCH FIRST ${limit} ROWS ONLY`,
      escapeChar: '"',
      escapeCharEnd: '"',
      boolTrue: '1',
      boolFalse: '0'
    }
  };
  
  const syntax = syntaxMap[dbType];
  
  // Helper to escape column names based on database type
  const escapeIdentifier = (name: string) => {
    // If name already contains a dot (e.g., "table.column"), escape each part
    if (name.includes('.')) {
      return name.split('.').map(part => 
        `${syntax.escapeChar}${part}${syntax.escapeCharEnd}`
      ).join('.');
    }
    return `${syntax.escapeChar}${name}${syntax.escapeCharEnd}`;
  };
  
  // Start building the SQL query
  let sql = 'SELECT ';
  
  // Handle SQL Server specific TOP clause
  if (dbType === 'sqlserver' && limit && !offset) {
    sql += syntax.limitClause(limit) + ' ';
  }
  
  // Add columns
  if (!columns || columns.length === 0) {
    sql += '*';
  } else {
    sql += columns.map(col => escapeIdentifier(col)).join(', ');
  }
  
  // Add FROM clause
  sql += ` FROM ${escapeIdentifier(table)}`;
  
  // Add joins if any
  if (joins && joins.length > 0) {
    joins.forEach(join => {
      sql += buildJoinClause(join, escapeIdentifier);
    });
  }
  
  // Add WHERE clause if conditions are provided
  if (where && where.length > 0) {
    sql += ' WHERE ' + buildWhereClause(where, syntax, dbType);
  }
  
  // Add GROUP BY clause if provided
  if (groupBy && groupBy.length > 0) {
    sql += ' GROUP BY ' + groupBy.map(col => escapeIdentifier(col)).join(', ');
  }
  
  // Add ORDER BY clause if provided
  if (orderBy && orderBy.length > 0) {
    sql += ' ORDER BY ' + orderBy.map(
      order => `${escapeIdentifier(order.column)} ${order.direction.toUpperCase()}`
    ).join(', ');
  }
  
  // Add LIMIT/OFFSET clause based on database type
  if (limit && dbType !== 'sqlserver') {
    sql += ' ' + syntax.limitClause(limit, offset);
  } else if (limit && dbType === 'sqlserver' && offset) {
    // For SQL Server with both LIMIT and OFFSET
    sql += ' ' + syntax.limitClause(limit, offset);
  }
  
  return sql;
}

/**
 * Build a JOIN clause for the query
 */
function buildJoinClause(join: JoinConfig, escapeIdentifier: (name: string) => string): string {
  const { type, table, alias, on } = join;
  
  let joinClause = '';
  
  // Add join type
  switch (type) {
    case 'inner':
      joinClause += ' INNER JOIN';
      break;
    case 'left':
      joinClause += ' LEFT JOIN';
      break;
    case 'right':
      joinClause += ' RIGHT JOIN';
      break;
    case 'full':
      joinClause += ' FULL OUTER JOIN';
      break;
  }
  
  // Add table and alias
  joinClause += ` ${escapeIdentifier(table)}`;
  if (alias) {
    joinClause += ` AS ${escapeIdentifier(alias)}`;
  }
  
  // Add ON conditions
  joinClause += ' ON ';
  joinClause += on.map(condition => 
    `${escapeIdentifier(condition.leftColumn)} = ${escapeIdentifier(condition.rightColumn)}`
  ).join(' AND ');
  
  return joinClause;
}

/**
 * Build a WHERE clause for the query
 */
function buildWhereClause(
  conditions: WhereCondition[], 
  syntax: any,
  dbType: DatabaseType
): string {
  if (!conditions || conditions.length === 0) {
    return '';
  }
  
  const escapeIdentifier = (name: string) => {
    // If name already contains a dot (e.g., "table.column"), escape each part
    if (name.includes('.')) {
      return name.split('.').map(part => 
        `${syntax.escapeChar}${part}${syntax.escapeCharEnd}`
      ).join('.');
    }
    return `${syntax.escapeChar}${name}${syntax.escapeCharEnd}`;
  };
  
  const formatValue = (value: any): string => {
    if (value === null) {
      return 'NULL';
    }
    
    if (typeof value === 'string') {
      // Escape single quotes for SQL
      return `'${value.replace(/'/g, "''")}'`;
    }
    
    if (typeof value === 'boolean') {
      return value ? syntax.boolTrue : syntax.boolFalse;
    }
    
    if (value instanceof Date) {
      // Format date based on database type
      if (dbType === 'oracle') {
        return `TO_DATE('${value.toISOString().slice(0, 19).replace('T', ' ')}', 'YYYY-MM-DD HH24:MI:SS')`;
      } else if (dbType === 'sqlserver') {
        return `CONVERT(DATETIME, '${value.toISOString().slice(0, 19).replace('T', ' ')}')`;
      } else {
        return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
      }
    }
    
    // For numbers and other types
    return value.toString();
  };
  
  return conditions.map((condition, index) => {
    const { column, operator, value, values, logic } = condition;
    const escapedColumn = escapeIdentifier(column);
    
    let whereCondition = '';
    
    // Build the condition based on the operator
    switch (operator) {
      case 'equals':
        whereCondition = value === null 
          ? `${escapedColumn} IS NULL` 
          : `${escapedColumn} = ${formatValue(value)}`;
        break;
      case 'notEquals':
        whereCondition = value === null 
          ? `${escapedColumn} IS NOT NULL` 
          : `${escapedColumn} <> ${formatValue(value)}`;
        break;
      case 'greaterThan':
        whereCondition = `${escapedColumn} > ${formatValue(value)}`;
        break;
      case 'lessThan':
        whereCondition = `${escapedColumn} < ${formatValue(value)}`;
        break;
      case 'contains':
        // Handle LIKE syntax differences between databases
        if (dbType === 'sqlserver' || dbType === 'oracle') {
          whereCondition = `${escapedColumn} LIKE '%' + ${formatValue(value)} + '%'`;
        } else {
          whereCondition = `${escapedColumn} LIKE CONCAT('%', ${formatValue(value)}, '%')`;
        }
        break;
      case 'startsWith':
        if (dbType === 'sqlserver' || dbType === 'oracle') {
          whereCondition = `${escapedColumn} LIKE ${formatValue(value)} + '%'`;
        } else {
          whereCondition = `${escapedColumn} LIKE CONCAT(${formatValue(value)}, '%')`;
        }
        break;
      case 'endsWith':
        if (dbType === 'sqlserver' || dbType === 'oracle') {
          whereCondition = `${escapedColumn} LIKE '%' + ${formatValue(value)}`;
        } else {
          whereCondition = `${escapedColumn} LIKE CONCAT('%', ${formatValue(value)})`;
        }
        break;
      case 'in':
        if (values && values.length > 0) {
          const formattedValues = values.map(v => formatValue(v)).join(', ');
          whereCondition = `${escapedColumn} IN (${formattedValues})`;
        } else {
          // Empty IN clause typically returns no results (equivalent to false)
          whereCondition = '1 = 0';
        }
        break;
      case 'between':
        if (values && values.length >= 2) {
          whereCondition = `${escapedColumn} BETWEEN ${formatValue(values[0])} AND ${formatValue(values[1])}`;
        }
        break;
      case 'isNull':
        whereCondition = `${escapedColumn} IS NULL`;
        break;
      case 'isNotNull':
        whereCondition = `${escapedColumn} IS NOT NULL`;
        break;
    }
    
    // Add logic operator if not the last condition
    if (index < conditions.length - 1 && logic) {
      whereCondition += ` ${logic.toUpperCase()}`;
    }
    
    return whereCondition;
  }).join(' ');
}