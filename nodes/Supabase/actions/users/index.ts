/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { supabaseAuthRequest } from '../../transport';
import { parseJson } from '../../utils';

/**
 * List all users (admin)
 */
export async function listUsers(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const page = this.getNodeParameter('page', index, 1) as number;
  const perPage = this.getNodeParameter('perPage', index, 50) as number;

  const response = await supabaseAuthRequest.call(
    this,
    `/admin/users?page=${page}&per_page=${perPage}`,
    'GET',
  );

  const users = response.users || response || [];
  return users.map((user: IDataObject) => ({ json: user }));
}

/**
 * Get user by ID (admin)
 */
export async function getUserById(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const userId = this.getNodeParameter('userId', index) as string;

  const response = await supabaseAuthRequest.call(this, `/admin/users/${userId}`, 'GET');

  return [{ json: response }];
}

/**
 * Create user (admin)
 */
export async function createUser(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const email = this.getNodeParameter('email', index) as string;
  const password = this.getNodeParameter('password', index) as string;
  const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;

  const body: IDataObject = {
    email,
    password,
    email_confirm: additionalFields.emailConfirm !== false,
  };

  if (additionalFields.phone) {
    body.phone = additionalFields.phone;
    body.phone_confirm = additionalFields.phoneConfirm !== false;
  }

  if (additionalFields.userMetadata) {
    body.user_metadata = parseJson(additionalFields.userMetadata as string);
  }

  if (additionalFields.appMetadata) {
    body.app_metadata = parseJson(additionalFields.appMetadata as string);
  }

  if (additionalFields.role) {
    body.role = additionalFields.role;
  }

  if (additionalFields.banDuration) {
    body.ban_duration = additionalFields.banDuration;
  }

  const response = await supabaseAuthRequest.call(this, '/admin/users', 'POST', body);

  return [{ json: response }];
}

/**
 * Update user by ID (admin)
 */
export async function updateUserById(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const userId = this.getNodeParameter('userId', index) as string;
  const updateFields = this.getNodeParameter('updateFields', index, {}) as IDataObject;

  const body: IDataObject = {};

  if (updateFields.email) {
    body.email = updateFields.email;
    if (updateFields.emailConfirm !== undefined) {
      body.email_confirm = updateFields.emailConfirm;
    }
  }

  if (updateFields.password) {
    body.password = updateFields.password;
  }

  if (updateFields.phone) {
    body.phone = updateFields.phone;
    if (updateFields.phoneConfirm !== undefined) {
      body.phone_confirm = updateFields.phoneConfirm;
    }
  }

  if (updateFields.userMetadata) {
    body.user_metadata = parseJson(updateFields.userMetadata as string);
  }

  if (updateFields.appMetadata) {
    body.app_metadata = parseJson(updateFields.appMetadata as string);
  }

  if (updateFields.role) {
    body.role = updateFields.role;
  }

  if (updateFields.banDuration) {
    body.ban_duration = updateFields.banDuration;
  }

  const response = await supabaseAuthRequest.call(this, `/admin/users/${userId}`, 'PUT', body);

  return [{ json: response }];
}

/**
 * Delete user (admin)
 */
export async function deleteUser(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const userId = this.getNodeParameter('userId', index) as string;
  const shouldSoftDelete = this.getNodeParameter('shouldSoftDelete', index, false) as boolean;

  const response = await supabaseAuthRequest.call(
    this,
    `/admin/users/${userId}`,
    'DELETE',
    shouldSoftDelete ? { should_soft_delete: true } : undefined,
  );

  return [{ json: response || { success: true, userId } }];
}

/**
 * Invite user by email
 */
export async function inviteUserByEmail(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const email = this.getNodeParameter('email', index) as string;
  const redirectTo = this.getNodeParameter('redirectTo', index, '') as string;
  const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;

  const body: IDataObject = {
    email,
  };

  if (redirectTo) {
    body.data = { ...(body.data as IDataObject), redirect_to: redirectTo };
  }

  if (additionalFields.userMetadata) {
    body.data = { ...(body.data as IDataObject), ...parseJson(additionalFields.userMetadata as string) };
  }

  const response = await supabaseAuthRequest.call(this, '/admin/invite', 'POST', body);

  return [{ json: response }];
}

/**
 * Generate auth link
 */
export async function generateLink(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const type = this.getNodeParameter('linkType', index) as string;
  const email = this.getNodeParameter('email', index) as string;
  const redirectTo = this.getNodeParameter('redirectTo', index, '') as string;
  const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;

  const body: IDataObject = {
    type,
    email,
  };

  if (redirectTo) {
    body.redirect_to = redirectTo;
  }

  if (type === 'signup' && additionalFields.password) {
    body.password = additionalFields.password;
  }

  if (additionalFields.userMetadata) {
    body.data = parseJson(additionalFields.userMetadata as string);
  }

  const response = await supabaseAuthRequest.call(this, '/admin/generate_link', 'POST', body);

  return [{ json: response }];
}

/**
 * Users admin operations map
 */
export const usersOperations = {
  listUsers,
  getUserById,
  createUser,
  updateUserById,
  deleteUser,
  inviteUserByEmail,
  generateLink,
};
