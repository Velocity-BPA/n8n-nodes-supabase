/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IAuthenticateGeneric,
  ICredentialDataDecryptedObject,
  ICredentialTestRequest,
  ICredentialType,
  IHttpRequestHelper,
  INodeProperties,
} from 'n8n-workflow';

export class SupabaseApi implements ICredentialType {
  name = 'supabaseApi';
  displayName = 'Supabase API';
  documentationUrl = 'https://supabase.com/docs/guides/api';
  properties: INodeProperties[] = [
    {
      displayName: 'Project URL',
      name: 'projectUrl',
      type: 'string',
      default: '',
      placeholder: 'https://your-project.supabase.co',
      description: 'The URL of your Supabase project',
      required: true,
    },
    {
      displayName: 'Authentication Type',
      name: 'authType',
      type: 'options',
      options: [
        {
          name: 'Anon Key (Public)',
          value: 'anonKey',
          description: 'Public key that respects Row Level Security (RLS) policies',
        },
        {
          name: 'Service Role Key (Admin)',
          value: 'serviceRoleKey',
          description: 'Admin key that bypasses RLS - use server-side only',
        },
        {
          name: 'Management API',
          value: 'managementApi',
          description: 'Personal Access Token for Supabase Management API',
        },
      ],
      default: 'anonKey',
      description: 'The type of authentication to use',
    },
    {
      displayName: 'Anon Key',
      name: 'anonKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'The anonymous/public API key from your Supabase project settings',
      displayOptions: {
        show: {
          authType: ['anonKey'],
        },
      },
      required: true,
    },
    {
      displayName: 'Service Role Key',
      name: 'serviceRoleKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description:
        'The service role key from your Supabase project settings. WARNING: This key bypasses Row Level Security!',
      displayOptions: {
        show: {
          authType: ['serviceRoleKey'],
        },
      },
      required: true,
    },
    {
      displayName: 'Management API Token',
      name: 'managementApiToken',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description:
        'Personal Access Token for the Supabase Management API. Generate from your account settings.',
      displayOptions: {
        show: {
          authType: ['managementApi'],
        },
      },
      required: true,
    },
    {
      displayName: 'Region',
      name: 'region',
      type: 'string',
      default: '',
      placeholder: 'us-east-1',
      description: 'The AWS region of your Supabase project (optional)',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        apikey: '={{$credentials.authType === "anonKey" ? $credentials.anonKey : ($credentials.authType === "serviceRoleKey" ? $credentials.serviceRoleKey : "")}}',
        Authorization:
          '={{$credentials.authType === "managementApi" ? "Bearer " + $credentials.managementApiToken : "Bearer " + ($credentials.authType === "anonKey" ? $credentials.anonKey : $credentials.serviceRoleKey)}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL:
        '={{$credentials.authType === "managementApi" ? "https://api.supabase.com/v1" : $credentials.projectUrl}}',
      url: '={{$credentials.authType === "managementApi" ? "/projects" : "/rest/v1/"}}',
      method: 'GET',
      headers: {
        apikey:
          '={{$credentials.authType === "anonKey" ? $credentials.anonKey : ($credentials.authType === "serviceRoleKey" ? $credentials.serviceRoleKey : "")}}',
        Authorization:
          '={{$credentials.authType === "managementApi" ? "Bearer " + $credentials.managementApiToken : "Bearer " + ($credentials.authType === "anonKey" ? $credentials.anonKey : $credentials.serviceRoleKey)}}',
      },
    },
  };
}
