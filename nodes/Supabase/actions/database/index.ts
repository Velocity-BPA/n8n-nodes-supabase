/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { supabaseDatabaseRequest, supabaseRpcRequest } from '../../transport';
import {
  buildOrderBy,
  buildPostgRESTQuery,
  buildSelectColumns,
  parseFilters,
  parseJson,
} from '../../utils';

/**
 * Select data from a table
 */
export async function select(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const table = this.getNodeParameter('table', index) as string;
  const columns = this.getNodeParameter('columns', index, '*') as string;
  const filterOptions = this.getNodeParameter('filters', index, {}) as IDataObject;
  const orderByOptions = this.getNodeParameter('orderBy', index, {}) as IDataObject;
  const limit = this.getNodeParameter('limit', index, 100) as number;
  const offset = this.getNodeParameter('offset', index, 0) as number;

  // Build query parameters
  const queryParts: string[] = [];

  // Add select columns
  queryParts.push(`select=${buildSelectColumns(columns)}`);

  // Add filters
  const filters = parseFilters(filterOptions);
  if (filters.length > 0) {
    queryParts.push(buildPostgRESTQuery(filters));
  }

  // Add ordering
  if (orderByOptions.orderBy && Array.isArray((orderByOptions.orderBy as IDataObject).order)) {
    const orderBy = buildOrderBy((orderByOptions.orderBy as IDataObject).order as IDataObject[]);
    if (orderBy) {
      queryParts.push(`order=${orderBy}`);
    }
  }

  // Add pagination
  if (limit) {
    queryParts.push(`limit=${limit}`);
  }
  if (offset) {
    queryParts.push(`offset=${offset}`);
  }

  const queryParams = queryParts.join('&');

  const response = await supabaseDatabaseRequest.call(this, table, 'GET', {
    queryParams,
  });

  const responseData = Array.isArray(response) ? response : [response];
  return responseData.map((item: IDataObject) => ({ json: item }));
}

/**
 * Insert row(s) into a table
 */
export async function insert(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const table = this.getNodeParameter('table', index) as string;
  const dataInput = this.getNodeParameter('data', index) as string;
  const returnData = this.getNodeParameter('returnData', index, true) as boolean;

  const data = parseJson(dataInput);
  const body = Array.isArray(data) ? data : [data];

  const response = await supabaseDatabaseRequest.call(this, table, 'POST', {
    body,
    returnRepresentation: returnData,
  });

  const responseData = Array.isArray(response) ? response : [response];
  return responseData.map((item: IDataObject) => ({ json: item }));
}

/**
 * Update row(s) in a table
 */
export async function update(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const table = this.getNodeParameter('table', index) as string;
  const dataInput = this.getNodeParameter('data', index) as string;
  const filterOptions = this.getNodeParameter('filters', index, {}) as IDataObject;
  const returnData = this.getNodeParameter('returnData', index, true) as boolean;

  const data = parseJson(dataInput);

  // Build filter query
  const filters = parseFilters(filterOptions);
  const queryParams = buildPostgRESTQuery(filters);

  const response = await supabaseDatabaseRequest.call(this, table, 'PATCH', {
    body: data,
    queryParams,
    returnRepresentation: returnData,
  });

  const responseData = Array.isArray(response) ? response : [response];
  return responseData.map((item: IDataObject) => ({ json: item }));
}

/**
 * Upsert row(s) in a table
 */
export async function upsert(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const table = this.getNodeParameter('table', index) as string;
  const dataInput = this.getNodeParameter('data', index) as string;
  const onConflict = this.getNodeParameter('onConflict', index, '') as string;
  const returnData = this.getNodeParameter('returnData', index, true) as boolean;

  const data = parseJson(dataInput);
  const body = Array.isArray(data) ? data : [data];

  let queryParams = '';
  if (onConflict) {
    queryParams = `on_conflict=${onConflict}`;
  }

  const response = await supabaseDatabaseRequest.call(this, table, 'POST', {
    body,
    queryParams,
    returnRepresentation: returnData,
    prefer: 'resolution=merge-duplicates',
  });

  const responseData = Array.isArray(response) ? response : [response];
  return responseData.map((item: IDataObject) => ({ json: item }));
}

/**
 * Delete row(s) from a table
 */
export async function deleteRows(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const table = this.getNodeParameter('table', index) as string;
  const filterOptions = this.getNodeParameter('filters', index, {}) as IDataObject;
  const returnData = this.getNodeParameter('returnData', index, true) as boolean;

  // Build filter query
  const filters = parseFilters(filterOptions);
  const queryParams = buildPostgRESTQuery(filters);

  const response = await supabaseDatabaseRequest.call(this, table, 'DELETE', {
    queryParams,
    returnRepresentation: returnData,
  });

  const responseData = Array.isArray(response) ? response : [response];
  return responseData.map((item: IDataObject) => ({ json: item }));
}

/**
 * Call a database RPC function
 */
export async function rpc(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]> {
  const functionName = this.getNodeParameter('functionName', index) as string;
  const argsInput = this.getNodeParameter('arguments', index, '{}') as string;

  const args = parseJson(argsInput, {});

  const response = await supabaseRpcRequest.call(this, functionName, args);

  const responseData = Array.isArray(response) ? response : [response];
  return responseData.map((item: IDataObject) => ({ json: item }));
}

/**
 * Count rows matching criteria
 */
export async function count(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]> {
  const table = this.getNodeParameter('table', index) as string;
  const filterOptions = this.getNodeParameter('filters', index, {}) as IDataObject;
  const countType = this.getNodeParameter('countType', index, 'exact') as
    | 'exact'
    | 'planned'
    | 'estimated';

  // Build filter query
  const filters = parseFilters(filterOptions);
  let queryParams = 'select=count';
  if (filters.length > 0) {
    queryParams += `&${buildPostgRESTQuery(filters)}`;
  }

  const response = await supabaseDatabaseRequest.call(this, table, 'HEAD', {
    queryParams,
    count: countType,
    headers: {
      Prefer: `count=${countType}`,
    },
  });

  // Parse count from Content-Range header or response
  let countValue = 0;
  if (response && typeof response === 'object') {
    const headers = response.headers || {};
    const contentRange = headers['content-range'] || '';
    const match = contentRange.match(/\/(\d+)/);
    if (match) {
      countValue = parseInt(match[1], 10);
    }
  }

  return [{ json: { count: countValue } }];
}

/**
 * Database operations map
 */
export const databaseOperations = {
  select,
  insert,
  update,
  upsert,
  delete: deleteRows,
  rpc,
  count,
};
