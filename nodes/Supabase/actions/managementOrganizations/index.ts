/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { supabaseManagementRequest } from '../../transport';

/**
 * List organizations
 */
export async function listOrganizations(
  this: IExecuteFunctions,
  _index: number,
): Promise<INodeExecutionData[]> {
  const response = await supabaseManagementRequest.call(this, '/organizations', 'GET');

  const orgs = Array.isArray(response) ? response : [response];
  return orgs.map((org: IDataObject) => ({ json: org }));
}

/**
 * Get organization
 */
export async function getOrganization(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const organizationId = this.getNodeParameter('organizationId', index) as string;

  const response = await supabaseManagementRequest.call(
    this,
    `/organizations/${organizationId}`,
    'GET',
  );

  return [{ json: response }];
}

/**
 * Create organization
 */
export async function createOrganization(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const name = this.getNodeParameter('name', index) as string;
  const options = this.getNodeParameter('options', index, {}) as IDataObject;

  const body: IDataObject = {
    name,
  };

  if (options.billingEmail) {
    body.billing_email = options.billingEmail;
  }

  const response = await supabaseManagementRequest.call(this, '/organizations', 'POST', body);

  return [{ json: response }];
}

/**
 * Get organization members
 */
export async function getOrganizationMembers(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const organizationId = this.getNodeParameter('organizationId', index) as string;

  const response = await supabaseManagementRequest.call(
    this,
    `/organizations/${organizationId}/members`,
    'GET',
  );

  const members = Array.isArray(response) ? response : [response];
  return members.map((member: IDataObject) => ({ json: member }));
}

/**
 * Management Organizations operations map
 */
export const managementOrganizationsOperations = {
  listOrganizations,
  getOrganization,
  createOrganization,
  getOrganizationMembers,
};
