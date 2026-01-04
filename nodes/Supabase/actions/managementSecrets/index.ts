/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { supabaseManagementRequest } from '../../transport';

/**
 * List project secrets
 */
export async function listSecrets(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const projectRef = this.getNodeParameter('projectRef', index) as string;

  const response = await supabaseManagementRequest.call(
    this,
    `/projects/${projectRef}/secrets`,
    'GET',
  );

  const secrets = Array.isArray(response) ? response : [response];
  return secrets.map((secret: IDataObject) => ({ json: secret }));
}

/**
 * Create secret
 */
export async function createSecret(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const projectRef = this.getNodeParameter('projectRef', index) as string;
  const name = this.getNodeParameter('name', index) as string;
  const value = this.getNodeParameter('value', index) as string;

  const response = await supabaseManagementRequest.call(
    this,
    `/projects/${projectRef}/secrets`,
    'POST',
    [{ name, value }],
  );

  return [{ json: response || { success: true, name } }];
}

/**
 * Delete secrets
 */
export async function deleteSecrets(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const projectRef = this.getNodeParameter('projectRef', index) as string;
  const secretNames = this.getNodeParameter('secretNames', index) as string;

  const names = secretNames.split(',').map((n) => n.trim());

  const response = await supabaseManagementRequest.call(
    this,
    `/projects/${projectRef}/secrets`,
    'DELETE',
    names,
  );

  return [{ json: response || { success: true, deletedSecrets: names } }];
}

/**
 * Management Secrets operations map
 */
export const managementSecretsOperations = {
  listSecrets,
  createSecret,
  deleteSecrets,
};
