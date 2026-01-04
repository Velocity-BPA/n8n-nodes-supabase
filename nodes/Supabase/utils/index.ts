/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { POSTGREST_OPERATORS, type PostgRESTFilter, type SupabaseCredentials } from '../constants';

/**
 * Licensing notice - logged once per node load
 */
let licensingNoticeLogged = false;

const LICENSING_MESSAGE =
  '[Velocity BPA Licensing Notice] This n8n node is licensed under the Business Source License 1.1 (BSL 1.1). Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA. For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.';

export function logLicensingNotice(context?: IExecuteFunctions | ILoadOptionsFunctions): void {
  if (!licensingNoticeLogged) {
    if (context && 'logger' in context) {
      context.logger.warn(LICENSING_MESSAGE);
    } else {
      // Fallback for trigger nodes and other contexts without logger
      console.warn(LICENSING_MESSAGE);
    }
    licensingNoticeLogged = true;
  }
}

/**
 * Get the appropriate API key based on auth type
 */
export function getApiKey(credentials: SupabaseCredentials): string {
  switch (credentials.authType) {
    case 'anonKey':
      return credentials.anonKey || '';
    case 'serviceRoleKey':
      return credentials.serviceRoleKey || '';
    case 'managementApi':
      return credentials.managementApiToken || '';
    default:
      return '';
  }
}

/**
 * Build PostgREST query string from filters
 */
export function buildPostgRESTQuery(filters: PostgRESTFilter[]): string {
  if (!filters || filters.length === 0) return '';

  const queryParts: string[] = [];

  for (const filter of filters) {
    const { column, operator, value } = filter;
    const op = POSTGREST_OPERATORS[operator] || operator;

    // Handle special cases
    if (operator === 'is') {
      queryParts.push(`${column}=is.${value}`);
    } else if (operator === 'in') {
      // Format: column=in.(value1,value2)
      const values = value.split(',').map((v) => v.trim());
      queryParts.push(`${column}=in.(${values.join(',')})`);
    } else if (operator === 'contains' || operator === 'containedBy' || operator === 'overlaps') {
      // Array operators: column=cs.{value1,value2}
      queryParts.push(`${column}=${op}.{${value}}`);
    } else {
      queryParts.push(`${column}=${op}.${value}`);
    }
  }

  return queryParts.join('&');
}

/**
 * Parse PostgREST filters from n8n UI input
 */
export function parseFilters(filterInput: IDataObject): PostgRESTFilter[] {
  const filters: PostgRESTFilter[] = [];

  if (filterInput.filters && Array.isArray((filterInput.filters as IDataObject).filter)) {
    const filterArray = (filterInput.filters as IDataObject).filter as IDataObject[];
    for (const f of filterArray) {
      if (f.column && f.operator) {
        filters.push({
          column: f.column as string,
          operator: f.operator as keyof typeof POSTGREST_OPERATORS,
          value: (f.value as string) || '',
        });
      }
    }
  }

  return filters;
}

/**
 * Build select columns string
 */
export function buildSelectColumns(columns: string | string[]): string {
  if (!columns) return '*';
  if (Array.isArray(columns)) {
    return columns.filter((c) => c).join(',') || '*';
  }
  return columns.trim() || '*';
}

/**
 * Build order by string
 */
export function buildOrderBy(orderBy: IDataObject[]): string {
  if (!orderBy || orderBy.length === 0) return '';

  return orderBy
    .map((order) => {
      const column = order.column as string;
      const direction = order.direction === 'desc' ? '.desc' : '.asc';
      const nullsFirst = order.nullsFirst ? '.nullsfirst' : '';
      return `${column}${direction}${nullsFirst}`;
    })
    .join(',');
}

/**
 * Parse JSON safely
 */
export function parseJson(jsonString: string, fallback: any = {}): any {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}

/**
 * Ensure URL has no trailing slash
 */
export function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Format Supabase error for n8n
 */
export function formatSupabaseError(
  context: IExecuteFunctions,
  error: any,
  itemIndex: number,
): NodeApiError {
  const message = error.message || 'Unknown Supabase error';
  const description = error.hint || error.details || error.code || '';

  return new NodeApiError(context.getNode(), error, {
    message,
    description,
    itemIndex,
  });
}

/**
 * Build pagination headers for PostgREST
 */
export function buildPaginationHeaders(
  offset?: number,
  limit?: number,
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (offset !== undefined && limit !== undefined) {
    const end = offset + limit - 1;
    headers['Range'] = `${offset}-${end}`;
    headers['Range-Unit'] = 'items';
  } else if (limit !== undefined) {
    headers['Range'] = `0-${limit - 1}`;
    headers['Range-Unit'] = 'items';
  }

  return headers;
}

/**
 * Build query string from object
 */
export function buildQueryString(params: Record<string, any>): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }

  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

/**
 * Validate required fields
 */
export function validateRequired(fields: Record<string, any>, fieldNames: string[]): void {
  for (const name of fieldNames) {
    if (fields[name] === undefined || fields[name] === null || fields[name] === '') {
      throw new Error(`Required field "${name}" is missing`);
    }
  }
}

/**
 * Convert n8n binary data to buffer
 */
export async function getBinaryDataBuffer(
  context: IExecuteFunctions,
  itemIndex: number,
  binaryPropertyName: string,
): Promise<Buffer> {
  const binaryData = context.helpers.assertBinaryData(itemIndex, binaryPropertyName);
  return context.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
}

/**
 * Get MIME type from file name
 */
export function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    json: 'application/json',
    xml: 'application/xml',
    csv: 'text/csv',
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    ts: 'application/typescript',
    zip: 'application/zip',
    gz: 'application/gzip',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    wav: 'audio/wav',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };

  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}
