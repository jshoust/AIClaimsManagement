/**
 * Query builder for different database dialects
 */
import { DatabaseType, QueryOptions } from './types';

/**
 * Build a SQL query based on options and dialect
 */
export function buildQueryForDialect(options: QueryOptions, dialect: DatabaseType): { query: string; params: any[] } {
  const { table, columns = ['*'], where = {}, orderBy = [], limit, offset } = options;
  
  // Initialize parameters array
  const params: any[] = [];
  
  // Build SELECT clause
  const selectClause = `SELECT ${columns.length ? columns.join(', ') : '*'}`;
  
  // Build FROM clause with proper quoting based on dialect
  const fromClause = `FROM ${quoteIdentifier(table, dialect)}`;
  
  // Build WHERE clause
  let whereClause = '';
  const whereConditions = [];
  
  for (const [key, value] of Object.entries(where)) {
    const paramIndex = params.length + 1;
    const paramPlaceholder = getParameterPlaceholder(paramIndex, dialect);
    whereConditions.push(`${quoteIdentifier(key, dialect)} = ${paramPlaceholder}`);
    params.push(value);
  }
  
  if (whereConditions.length > 0) {
    whereClause = `WHERE ${whereConditions.join(' AND ')}`;
  }
  
  // Build ORDER BY clause
  let orderByClause = '';
  if (orderBy.length > 0) {
    const orderByClauses = orderBy.map(
      order => `${quoteIdentifier(order.column, dialect)} ${order.direction.toUpperCase()}`
    );
    orderByClause = `ORDER BY ${orderByClauses.join(', ')}`;
  }
  
  // Build LIMIT and OFFSET clauses based on dialect
  let limitOffsetClause = '';
  
  if (limit !== undefined) {
    if (dialect === 'oracle') {
      // Oracle uses ROWNUM or ROW_NUMBER() OVER(...) instead of LIMIT
      if (offset !== undefined) {
        // With both LIMIT and OFFSET, we need to use ROW_NUMBER() OVER(...) in a subquery
        const innerOrderBy = orderBy.length > 0
          ? orderByClause
          : 'ORDER BY 1'; // Oracle requires an ORDER BY for ROW_NUMBER()
        
        return {
          query: `
            SELECT *
            FROM (
              SELECT ${columns.length ? columns.join(', ') : '*'}, ROW_NUMBER() OVER(${innerOrderBy}) as rn
              FROM ${quoteIdentifier(table, dialect)}
              ${whereClause}
            )
            WHERE rn > ${offset} AND rn <= ${offset + limit}
          `,
          params
        };
      } else {
        // With just LIMIT, we can use ROWNUM
        limitOffsetClause = `WHERE ROWNUM <= ${limit}`;
      }
    } else if (dialect === 'sqlserver' && offset !== undefined) {
      // SQL Server 2012+ uses OFFSET...FETCH
      limitOffsetClause = `OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    } else {
      // MySQL and PostgreSQL
      limitOffsetClause = `LIMIT ${limit}`;
      
      if (offset !== undefined) {
        limitOffsetClause += ` OFFSET ${offset}`;
      }
    }
  } else if (offset !== undefined) {
    if (dialect === 'oracle') {
      // Oracle without LIMIT but with OFFSET
      const innerOrderBy = orderBy.length > 0
        ? orderByClause
        : 'ORDER BY 1';
      
      return {
        query: `
          SELECT *
          FROM (
            SELECT ${columns.length ? columns.join(', ') : '*'}, ROW_NUMBER() OVER(${innerOrderBy}) as rn
            FROM ${quoteIdentifier(table, dialect)}
            ${whereClause}
          )
          WHERE rn > ${offset}
        `,
        params
      };
    } else if (dialect === 'sqlserver') {
      // SQL Server 2012+ uses OFFSET...FETCH
      limitOffsetClause = `OFFSET ${offset} ROWS`;
    } else {
      // MySQL and PostgreSQL
      limitOffsetClause = `OFFSET ${offset}`;
    }
  }
  
  // Special case for SQL Server before 2012 which doesn't support OFFSET/FETCH
  if (dialect === 'sqlserver' && (limit !== undefined || offset !== undefined) && !limitOffsetClause) {
    // This is a simplified approach, a more robust implementation would use a CTE or subquery
    // with ROW_NUMBER() for older SQL Server versions
    console.warn('Warning: SQL Server before 2012 does not support OFFSET/FETCH syntax natively.');
  }
  
  // Build the final query
  const query = [
    selectClause,
    fromClause,
    whereClause,
    orderByClause,
    limitOffsetClause
  ].filter(Boolean).join(' ');
  
  return { query, params };
}

/**
 * Quote an identifier (table or column name) according to the dialect
 */
function quoteIdentifier(identifier: string, dialect: DatabaseType): string {
  switch (dialect) {
    case 'mysql':
      return `\`${identifier}\``;
    case 'postgres':
      return `"${identifier}"`;
    case 'sqlserver':
      return `[${identifier}]`;
    case 'oracle':
      return `"${identifier.toUpperCase()}"`;
    default:
      return identifier;
  }
}

/**
 * Get parameter placeholder according to the dialect
 */
function getParameterPlaceholder(index: number, dialect: DatabaseType): string {
  switch (dialect) {
    case 'postgres':
      return `$${index}`;
    case 'mysql':
      return '?';
    case 'sqlserver':
      return `@param${index}`;
    case 'oracle':
      return `:${index}`;
    default:
      return '?';
  }
}

/**
 * Safely convert a value to a SQL literal for direct inclusion in queries
 * NOTE: This should be used sparingly as it's vulnerable to SQL injection if misused
 */
function valueToSqlLiteral(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  
  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }
  
  if (Array.isArray(value)) {
    return `(${value.map(v => valueToSqlLiteral(v)).join(', ')})`;
  }
  
  // Escape single quotes in strings
  return `'${value.toString().replace(/'/g, "''")}'`;
}