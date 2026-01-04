/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IDataObject,
  IExecuteFunctions,
  IHttpRequestMethods,
  IHttpRequestOptions,
  ILoadOptionsFunctions,
  JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { SUPABASE_ENDPOINTS, type SupabaseCredentials } from '../constants';
import { getApiKey, normalizeUrl } from '../utils';

export interface SupabaseRequestOptions {
  method: IHttpRequestMethods;
  endpoint: string;
  body?: IDataObject | IDataObject[] | string;
  qs?: IDataObject;
  headers?: Record<string, string>;
  isManagementApi?: boolean;
  returnFullResponse?: boolean;
  encoding?: 'arraybuffer' | 'stream';
}

/**
 * Make a request to the Supabase REST API
 */
export async function supabaseApiRequest(
  this: IExecuteFunctions | ILoadOptionsFunctions,
  options: SupabaseRequestOptions,
): Promise<any> {
  const credentials = (await this.getCredentials('supabaseApi')) as unknown as SupabaseCredentials;

  const { method, endpoint, body, qs, headers = {}, isManagementApi, returnFullResponse, encoding } =
    options;

  // Determine base URL
  let baseUrl: string;
  if (isManagementApi || credentials.authType === 'managementApi') {
    baseUrl = SUPABASE_ENDPOINTS.MANAGEMENT;
  } else {
    baseUrl = normalizeUrl(credentials.projectUrl);
  }

  // Build request options
  const requestOptions: IHttpRequestOptions = {
    method,
    url: `${baseUrl}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    qs,
    returnFullResponse,
  };

  // Add API key headers for non-management API requests
  if (!isManagementApi && credentials.authType !== 'managementApi') {
    const apiKey = getApiKey(credentials);
    requestOptions.headers!['apikey'] = apiKey;
    requestOptions.headers!['Authorization'] = `Bearer ${apiKey}`;
  }

  // Add body if present
  if (body) {
    if (typeof body === 'string') {
      requestOptions.body = body;
    } else {
      requestOptions.body = body;
      requestOptions.json = true;
    }
  }

  // Set encoding if specified
  if (encoding) {
    requestOptions.encoding = encoding;
  }

  try {
    const response = await this.helpers.httpRequestWithAuthentication.call(
      this,
      'supabaseApi',
      requestOptions,
    );
    return response;
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as JsonObject, {
      message: (error as Error).message,
    });
  }
}

/**
 * Make a request to the Supabase Database REST API (PostgREST)
 */
export async function supabaseDatabaseRequest(
  this: IExecuteFunctions | ILoadOptionsFunctions,
  table: string,
  method: IHttpRequestMethods,
  options: {
    body?: IDataObject | IDataObject[];
    queryParams?: string;
    headers?: Record<string, string>;
    returnRepresentation?: boolean;
    prefer?: string;
    count?: 'exact' | 'planned' | 'estimated';
  } = {},
): Promise<any> {
  const { body, queryParams = '', headers = {}, returnRepresentation, prefer, count } = options;

  // Build endpoint
  let endpoint = `${SUPABASE_ENDPOINTS.REST}/${table}`;
  if (queryParams) {
    endpoint += `?${queryParams}`;
  }

  // Build Prefer header
  const preferParts: string[] = [];
  if (returnRepresentation) {
    preferParts.push('return=representation');
  }
  if (prefer) {
    preferParts.push(prefer);
  }
  if (count) {
    preferParts.push(`count=${count}`);
  }
  if (preferParts.length > 0) {
    headers['Prefer'] = preferParts.join(',');
  }

  return supabaseApiRequest.call(this, {
    method,
    endpoint,
    body,
    headers,
  });
}

/**
 * Make a request to the Supabase Auth API
 */
export async function supabaseAuthRequest(
  this: IExecuteFunctions | ILoadOptionsFunctions,
  endpoint: string,
  method: IHttpRequestMethods,
  body?: IDataObject,
  headers?: Record<string, string>,
): Promise<any> {
  return supabaseApiRequest.call(this, {
    method,
    endpoint: `${SUPABASE_ENDPOINTS.AUTH}${endpoint}`,
    body,
    headers,
  });
}

/**
 * Make a request to the Supabase Storage API
 */
export async function supabaseStorageRequest(
  this: IExecuteFunctions | ILoadOptionsFunctions,
  endpoint: string,
  method: IHttpRequestMethods,
  body?: IDataObject | Buffer,
  headers?: Record<string, string>,
  encoding?: 'arraybuffer' | 'stream',
): Promise<any> {
  const requestHeaders = { ...headers };

  // Handle binary data
  if (body instanceof Buffer) {
    requestHeaders['Content-Type'] = headers?.['Content-Type'] || 'application/octet-stream';
  }

  return supabaseApiRequest.call(this, {
    method,
    endpoint: `${SUPABASE_ENDPOINTS.STORAGE}${endpoint}`,
    body: body as any,
    headers: requestHeaders,
    encoding,
  });
}

/**
 * Make a request to the Supabase Edge Functions API
 */
export async function supabaseEdgeFunctionRequest(
  this: IExecuteFunctions | ILoadOptionsFunctions,
  functionName: string,
  body?: IDataObject | string,
  headers?: Record<string, string>,
): Promise<any> {
  return supabaseApiRequest.call(this, {
    method: 'POST',
    endpoint: `${SUPABASE_ENDPOINTS.FUNCTIONS}/${functionName}`,
    body: body as IDataObject,
    headers,
  });
}

/**
 * Make a request to the Supabase Management API
 */
export async function supabaseManagementRequest(
  this: IExecuteFunctions | ILoadOptionsFunctions,
  endpoint: string,
  method: IHttpRequestMethods,
  body?: IDataObject | IDataObject[] | string[],
  qs?: IDataObject,
): Promise<any> {
  return supabaseApiRequest.call(this, {
    method,
    endpoint,
    body: body as IDataObject,
    qs,
    isManagementApi: true,
  });
}

/**
 * Call a database RPC function
 */
export async function supabaseRpcRequest(
  this: IExecuteFunctions | ILoadOptionsFunctions,
  functionName: string,
  args?: IDataObject,
): Promise<any> {
  return supabaseApiRequest.call(this, {
    method: 'POST',
    endpoint: `${SUPABASE_ENDPOINTS.REST}/rpc/${functionName}`,
    body: args,
  });
}

/**
 * Upload a file to Supabase Storage
 */
export async function supabaseStorageUpload(
  this: IExecuteFunctions,
  bucket: string,
  path: string,
  fileBuffer: Buffer,
  contentType: string,
  options: {
    cacheControl?: string;
    upsert?: boolean;
  } = {},
): Promise<any> {
  const { cacheControl = '3600', upsert = false } = options;

  const credentials = (await this.getCredentials('supabaseApi')) as unknown as SupabaseCredentials;
  const baseUrl = normalizeUrl(credentials.projectUrl);
  const apiKey = getApiKey(credentials);

  const requestOptions: IHttpRequestOptions = {
    method: 'POST',
    url: `${baseUrl}${SUPABASE_ENDPOINTS.STORAGE}/object/${bucket}/${path}`,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
      'x-upsert': String(upsert),
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    body: fileBuffer,
  };

  try {
    return await this.helpers.httpRequest(requestOptions);
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as JsonObject, {
      message: `Failed to upload file: ${(error as Error).message}`,
    });
  }
}

/**
 * Download a file from Supabase Storage
 */
export async function supabaseStorageDownload(
  this: IExecuteFunctions,
  bucket: string,
  path: string,
): Promise<Buffer> {
  const credentials = (await this.getCredentials('supabaseApi')) as unknown as SupabaseCredentials;
  const baseUrl = normalizeUrl(credentials.projectUrl);
  const apiKey = getApiKey(credentials);

  const requestOptions: IHttpRequestOptions = {
    method: 'GET',
    url: `${baseUrl}${SUPABASE_ENDPOINTS.STORAGE}/object/${bucket}/${path}`,
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    encoding: 'arraybuffer',
    returnFullResponse: true,
  };

  try {
    const response = await this.helpers.httpRequest(requestOptions);
    return Buffer.from(response.body as ArrayBuffer);
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as JsonObject, {
      message: `Failed to download file: ${(error as Error).message}`,
    });
  }
}
