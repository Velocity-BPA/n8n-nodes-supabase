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
 * Sign up a new user
 */
export async function signUp(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const email = this.getNodeParameter('email', index) as string;
  const password = this.getNodeParameter('password', index) as string;
  const userMetadata = this.getNodeParameter('userMetadata', index, '{}') as string;
  const emailRedirectTo = this.getNodeParameter('emailRedirectTo', index, '') as string;

  const body: IDataObject = {
    email,
    password,
  };

  if (userMetadata) {
    body.data = parseJson(userMetadata);
  }

  if (emailRedirectTo) {
    body.options = { emailRedirectTo };
  }

  const response = await supabaseAuthRequest.call(this, '/signup', 'POST', body);

  return [{ json: response }];
}

/**
 * Sign in with email and password
 */
export async function signIn(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const email = this.getNodeParameter('email', index) as string;
  const password = this.getNodeParameter('password', index) as string;

  const response = await supabaseAuthRequest.call(
    this,
    '/token?grant_type=password',
    'POST',
    { email, password },
  );

  return [{ json: response }];
}

/**
 * Sign in with OTP (magic link)
 */
export async function signInWithOtp(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const otpType = this.getNodeParameter('otpType', index) as 'email' | 'phone';
  const emailRedirectTo = this.getNodeParameter('emailRedirectTo', index, '') as string;
  const shouldCreateUser = this.getNodeParameter('shouldCreateUser', index, true) as boolean;

  const body: IDataObject = {
    options: {
      shouldCreateUser,
    },
  };

  if (otpType === 'email') {
    body.email = this.getNodeParameter('email', index) as string;
    if (emailRedirectTo) {
      (body.options as IDataObject).emailRedirectTo = emailRedirectTo;
    }
  } else {
    body.phone = this.getNodeParameter('phone', index) as string;
  }

  const response = await supabaseAuthRequest.call(this, '/otp', 'POST', body);

  return [{ json: response }];
}

/**
 * Get OAuth sign-in URL
 */
export async function signInWithOAuth(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const provider = this.getNodeParameter('provider', index) as string;
  const redirectTo = this.getNodeParameter('redirectTo', index, '') as string;
  const scopes = this.getNodeParameter('scopes', index, '') as string;

  const credentials = await this.getCredentials('supabaseApi');
  const projectUrl = credentials.projectUrl as string;

  let oauthUrl = `${projectUrl}/auth/v1/authorize?provider=${provider}`;

  if (redirectTo) {
    oauthUrl += `&redirect_to=${encodeURIComponent(redirectTo)}`;
  }

  if (scopes) {
    oauthUrl += `&scopes=${encodeURIComponent(scopes)}`;
  }

  return [
    {
      json: {
        provider,
        url: oauthUrl,
      },
    },
  ];
}

/**
 * Sign out user
 */
export async function signOut(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const accessToken = this.getNodeParameter('accessToken', index) as string;
  const scope = this.getNodeParameter('scope', index, 'global') as 'global' | 'local' | 'others';

  const response = await supabaseAuthRequest.call(this, '/logout', 'POST', { scope }, {
    Authorization: `Bearer ${accessToken}`,
  });

  return [{ json: response || { success: true } }];
}

/**
 * Get current user
 */
export async function getUser(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const accessToken = this.getNodeParameter('accessToken', index) as string;

  const response = await supabaseAuthRequest.call(this, '/user', 'GET', undefined, {
    Authorization: `Bearer ${accessToken}`,
  });

  return [{ json: response }];
}

/**
 * Update user attributes
 */
export async function updateUser(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const accessToken = this.getNodeParameter('accessToken', index) as string;
  const updateFields = this.getNodeParameter('updateFields', index, {}) as IDataObject;

  const body: IDataObject = {};

  if (updateFields.email) {
    body.email = updateFields.email;
  }
  if (updateFields.password) {
    body.password = updateFields.password;
  }
  if (updateFields.phone) {
    body.phone = updateFields.phone;
  }
  if (updateFields.userMetadata) {
    body.data = parseJson(updateFields.userMetadata as string);
  }

  const response = await supabaseAuthRequest.call(this, '/user', 'PUT', body, {
    Authorization: `Bearer ${accessToken}`,
  });

  return [{ json: response }];
}

/**
 * Send password reset email
 */
export async function resetPasswordForEmail(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const email = this.getNodeParameter('email', index) as string;
  const redirectTo = this.getNodeParameter('redirectTo', index, '') as string;

  const body: IDataObject = { email };

  if (redirectTo) {
    body.redirectTo = redirectTo;
  }

  const response = await supabaseAuthRequest.call(this, '/recover', 'POST', body);

  return [{ json: response || { success: true, email } }];
}

/**
 * Verify OTP token
 */
export async function verifyOtp(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const otpType = this.getNodeParameter('verifyType', index) as string;
  const token = this.getNodeParameter('token', index) as string;
  const type = this.getNodeParameter('type', index) as string;

  const body: IDataObject = {
    token,
    type,
  };

  if (otpType === 'email') {
    body.email = this.getNodeParameter('email', index) as string;
  } else {
    body.phone = this.getNodeParameter('phone', index) as string;
  }

  const response = await supabaseAuthRequest.call(this, '/verify', 'POST', body);

  return [{ json: response }];
}

/**
 * Refresh access token
 */
export async function refreshSession(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const refreshToken = this.getNodeParameter('refreshToken', index) as string;

  const response = await supabaseAuthRequest.call(
    this,
    '/token?grant_type=refresh_token',
    'POST',
    { refresh_token: refreshToken },
  );

  return [{ json: response }];
}

/**
 * Set session manually
 */
export async function setSession(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const accessToken = this.getNodeParameter('accessToken', index) as string;
  const refreshToken = this.getNodeParameter('refreshToken', index) as string;

  // Validate the access token by getting user info
  const response = await supabaseAuthRequest.call(this, '/user', 'GET', undefined, {
    Authorization: `Bearer ${accessToken}`,
  });

  return [
    {
      json: {
        user: response,
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    },
  ];
}

/**
 * Get current session
 */
export async function getSession(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const accessToken = this.getNodeParameter('accessToken', index) as string;

  const response = await supabaseAuthRequest.call(this, '/user', 'GET', undefined, {
    Authorization: `Bearer ${accessToken}`,
  });

  return [
    {
      json: {
        user: response,
        access_token: accessToken,
      },
    },
  ];
}

/**
 * Auth operations map
 */
export const authOperations = {
  signUp,
  signIn,
  signInWithOtp,
  signInWithOAuth,
  signOut,
  getUser,
  updateUser,
  resetPasswordForEmail,
  verifyOtp,
  refreshSession,
  setSession,
  getSession,
};
