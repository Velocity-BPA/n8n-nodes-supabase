/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { supabaseManagementRequest } from '../../transport';

/**
 * Run SQL query
 */
export async function runSql(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const projectRef = this.getNodeParameter('projectRef', index) as string;
  const query = this.getNodeParameter('query', index) as string;

  const response = await supabaseManagementRequest.call(
    this,
    `/projects/${projectRef}/database/query`,
    'POST',
    { query },
  );

  // Handle different response formats
  if (Array.isArray(response)) {
    return response.map((row: IDataObject) => ({ json: row }));
  }

  return [{ json: response }];
}

/**
 * Get schemas
 */
export async function getSchemas(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const projectRef = this.getNodeParameter('projectRef', index) as string;

  const response = await supabaseManagementRequest.call(
    this,
    `/projects/${projectRef}/database/schemas`,
    'GET',
  );

  const schemas = Array.isArray(response) ? response : [response];
  return schemas.map((schema: IDataObject) => ({ json: schema }));
}

/**
 * Get tables
 */
export async function getTables(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const projectRef = this.getNodeParameter('projectRef', index) as string;
  const schema = this.getNodeParameter('schema', index, 'public') as string;

  const response = await supabaseManagementRequest.call(
    this,
    `/projects/${projectRef}/database/tables`,
    'GET',
    undefined,
    { schema },
  );

  const tables = Array.isArray(response) ? response : [response];
  return tables.map((table: IDataObject) => ({ json: table }));
}

/**
 * Get table columns
 */
export async function getColumns(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const projectRef = this.getNodeParameter('projectRef', index) as string;
  const schema = this.getNodeParameter('schema', index, 'public') as string;
  const table = this.getNodeParameter('table', index) as string;

  const response = await supabaseManagementRequest.call(
    this,
    `/projects/${projectRef}/database/columns`,
    'GET',
    undefined,
    { schema, table },
  );

  const columns = Array.isArray(response) ? response : [response];
  return columns.map((column: IDataObject) => ({ json: column }));
}

/**
 * Get custom types
 */
export async function getTypes(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const projectRef = this.getNodeParameter('projectRef', index) as string;
  const schema = this.getNodeParameter('schema', index, 'public') as string;

  const response = await supabaseManagementRequest.call(
    this,
    `/projects/${projectRef}/database/types`,
    'GET',
    undefined,
    { schema },
  );

  const types = Array.isArray(response) ? response : [response];
  return types.map((type: IDataObject) => ({ json: type }));
}

/**
 * Get extensions
 */
export async function getExtensions(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const projectRef = this.getNodeParameter('projectRef', index) as string;

  const response = await supabaseManagementRequest.call(
    this,
    `/projects/${projectRef}/database/extensions`,
    'GET',
  );

  const extensions = Array.isArray(response) ? response : [response];
  return extensions.map((ext: IDataObject) => ({ json: ext }));
}

/**
 * Enable extension
 */
export async function enableExtension(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const projectRef = this.getNodeParameter('projectRef', index) as string;
  const extensionName = this.getNodeParameter('extensionName', index) as string;
  const schema = this.getNodeParameter('schema', index, 'extensions') as string;

  const response = await supabaseManagementRequest.call(
    this,
    `/projects/${projectRef}/database/extensions`,
    'POST',
    {
      name: extensionName,
      schema,
    },
  );

  return [{ json: response || { success: true, extension: extensionName, schema } }];
}

/**
 * Management Database operations map
 */
export const managementDatabaseOperations = {
  runSql,
  getSchemas,
  getTables,
  getColumns,
  getTypes,
  getExtensions,
  enableExtension,
};
