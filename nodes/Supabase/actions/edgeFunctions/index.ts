/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { supabaseEdgeFunctionRequest, supabaseManagementRequest } from '../../transport';
import { parseJson } from '../../utils';

/**
 * Invoke edge function
 */
export async function invoke(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const functionName = this.getNodeParameter('functionName', index) as string;
  const bodyInput = this.getNodeParameter('body', index, '{}') as string;
  const headersInput = this.getNodeParameter('headers', index, '{}') as string;

  const body = parseJson(bodyInput);
  const headers = parseJson(headersInput, {});

  const response = await supabaseEdgeFunctionRequest.call(this, functionName, body, headers);

  return [{ json: response }];
}

/**
 * List functions (Management API)
 */
export async function listFunctions(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const projectRef = this.getNodeParameter('projectRef', index) as string;

  const response = await supabaseManagementRequest.call(
    this,
    `/projects/${projectRef}/functions`,
    'GET',
  );

  const functions = Array.isArray(response) ? response : [response];
  return functions.map((fn: IDataObject) => ({ json: fn }));
}

/**
 * Get function details (Management API)
 */
export async function getFunction(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const projectRef = this.getNodeParameter('projectRef', index) as string;
  const functionSlug = this.getNodeParameter('functionSlug', index) as string;

  const response = await supabaseManagementRequest.call(
    this,
    `/projects/${projectRef}/functions/${functionSlug}`,
    'GET',
  );

  return [{ json: response }];
}

/**
 * Deploy function (Management API)
 */
export async function deployFunction(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const projectRef = this.getNodeParameter('projectRef', index) as string;
  const functionSlug = this.getNodeParameter('functionSlug', index) as string;
  const options = this.getNodeParameter('options', index, {}) as IDataObject;

  const body: IDataObject = {
    slug: functionSlug,
  };

  if (options.name) {
    body.name = options.name;
  }

  if (options.verifyJwt !== undefined) {
    body.verify_jwt = options.verifyJwt;
  }

  if (options.importMap) {
    body.import_map = options.importMap;
  }

  if (options.entrypointPath) {
    body.entrypoint_path = options.entrypointPath;
  }

  const response = await supabaseManagementRequest.call(
    this,
    `/projects/${projectRef}/functions/${functionSlug}`,
    'PUT',
    body,
  );

  return [{ json: response }];
}

/**
 * Edge Functions operations map
 */
export const edgeFunctionsOperations = {
  invoke,
  listFunctions,
  getFunction,
  deployFunction,
};
