/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { supabaseManagementRequest } from '../../transport';

/**
 * List all projects
 */
export async function listProjects(
  this: IExecuteFunctions,
  _index: number,
): Promise<INodeExecutionData[]> {
  const response = await supabaseManagementRequest.call(this, '/projects', 'GET');

  const projects = Array.isArray(response) ? response : [response];
  return projects.map((project: IDataObject) => ({ json: project }));
}

/**
 * Get project details
 */
export async function getProject(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const projectRef = this.getNodeParameter('projectRef', index) as string;

  const response = await supabaseManagementRequest.call(this, `/projects/${projectRef}`, 'GET');

  return [{ json: response }];
}

/**
 * Create new project
 */
export async function createProject(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const name = this.getNodeParameter('name', index) as string;
  const organizationId = this.getNodeParameter('organizationId', index) as string;
  const region = this.getNodeParameter('region', index) as string;
  const dbPassword = this.getNodeParameter('dbPassword', index) as string;
  const options = this.getNodeParameter('options', index, {}) as IDataObject;

  const body: IDataObject = {
    name,
    organization_id: organizationId,
    region,
    db_pass: dbPassword,
  };

  if (options.plan) {
    body.plan = options.plan;
  }

  if (options.kpsEnabled !== undefined) {
    body.kps_enabled = options.kpsEnabled;
  }

  const response = await supabaseManagementRequest.call(this, '/projects', 'POST', body);

  return [{ json: response }];
}

/**
 * Delete project
 */
export async function deleteProject(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const projectRef = this.getNodeParameter('projectRef', index) as string;

  const response = await supabaseManagementRequest.call(
    this,
    `/projects/${projectRef}`,
    'DELETE',
  );

  return [{ json: response || { success: true, projectRef } }];
}

/**
 * Pause project
 */
export async function pauseProject(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const projectRef = this.getNodeParameter('projectRef', index) as string;

  const response = await supabaseManagementRequest.call(
    this,
    `/projects/${projectRef}/pause`,
    'POST',
  );

  return [{ json: response || { success: true, projectRef, status: 'paused' } }];
}

/**
 * Restore paused project
 */
export async function restoreProject(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const projectRef = this.getNodeParameter('projectRef', index) as string;

  const response = await supabaseManagementRequest.call(
    this,
    `/projects/${projectRef}/restore`,
    'POST',
  );

  return [{ json: response || { success: true, projectRef, status: 'restored' } }];
}

/**
 * Get project API keys
 */
export async function getProjectApiKeys(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const projectRef = this.getNodeParameter('projectRef', index) as string;

  const response = await supabaseManagementRequest.call(
    this,
    `/projects/${projectRef}/api-keys`,
    'GET',
  );

  const keys = Array.isArray(response) ? response : [response];
  return keys.map((key: IDataObject) => ({ json: key }));
}

/**
 * Get project settings
 */
export async function getProjectSettings(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const projectRef = this.getNodeParameter('projectRef', index) as string;

  const response = await supabaseManagementRequest.call(
    this,
    `/projects/${projectRef}/config`,
    'GET',
  );

  return [{ json: response }];
}

/**
 * Management Projects operations map
 */
export const managementProjectsOperations = {
  listProjects,
  getProject,
  createProject,
  deleteProject,
  pauseProject,
  restoreProject,
  getProjectApiKeys,
  getProjectSettings,
};
