/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { logLicensingNotice } from './utils';
import { databaseOperations } from './actions/database';
import { authOperations } from './actions/auth';
import { usersOperations } from './actions/users';
import { storageOperations } from './actions/storage';
import { edgeFunctionsOperations } from './actions/edgeFunctions';
import { realtimeOperations } from './actions/realtime';
import { managementProjectsOperations } from './actions/managementProjects';
import { managementOrganizationsOperations } from './actions/managementOrganizations';
import { managementDatabaseOperations } from './actions/managementDatabase';
import { managementSecretsOperations } from './actions/managementSecrets';
import { OAUTH_PROVIDERS, SUPABASE_REGIONS } from './constants';

export class Supabase implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Supabase',
    name: 'supabase',
    icon: 'file:supabase.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
    description: 'Interact with Supabase - Database, Auth, Storage, Edge Functions, and Management APIs',
    defaults: {
      name: 'Supabase',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'supabaseApi',
        required: true,
      },
    ],
    properties: [
      // Resource selection
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Database', value: 'database' },
          { name: 'Auth', value: 'auth' },
          { name: 'Users (Admin)', value: 'users' },
          { name: 'Storage', value: 'storage' },
          { name: 'Edge Functions', value: 'edgeFunctions' },
          { name: 'Realtime', value: 'realtime' },
          { name: 'Management: Projects', value: 'managementProjects' },
          { name: 'Management: Organizations', value: 'managementOrganizations' },
          { name: 'Management: Database', value: 'managementDatabase' },
          { name: 'Management: Secrets', value: 'managementSecrets' },
        ],
        default: 'database',
      },

      // ==================== DATABASE OPERATIONS ====================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['database'] } },
        options: [
          { name: 'Select', value: 'select', description: 'Query data from table', action: 'Select data from table' },
          { name: 'Insert', value: 'insert', description: 'Insert row(s) into table', action: 'Insert data into table' },
          { name: 'Update', value: 'update', description: 'Update row(s) in table', action: 'Update data in table' },
          { name: 'Upsert', value: 'upsert', description: 'Insert or update row(s)', action: 'Upsert data in table' },
          { name: 'Delete', value: 'delete', description: 'Delete row(s) from table', action: 'Delete data from table' },
          { name: 'RPC', value: 'rpc', description: 'Call database function', action: 'Call database function' },
          { name: 'Count', value: 'count', description: 'Count rows matching criteria', action: 'Count rows in table' },
        ],
        default: 'select',
      },
      // Database common fields
      {
        displayName: 'Table',
        name: 'table',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['database'], operation: ['select', 'insert', 'update', 'upsert', 'delete', 'count'] } },
        description: 'Name of the table to operate on',
      },
      {
        displayName: 'Columns',
        name: 'columns',
        type: 'string',
        default: '*',
        displayOptions: { show: { resource: ['database'], operation: ['select'] } },
        description: 'Columns to select (comma-separated, * for all). Supports PostgREST syntax like "id,name,posts(title)".',
      },
      {
        displayName: 'Data (JSON)',
        name: 'data',
        type: 'json',
        default: '{}',
        required: true,
        displayOptions: { show: { resource: ['database'], operation: ['insert', 'update', 'upsert'] } },
        description: 'Data to insert/update as JSON object or array of objects',
      },
      {
        displayName: 'On Conflict',
        name: 'onConflict',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['database'], operation: ['upsert'] } },
        description: 'Column(s) with unique constraint for conflict resolution',
      },
      {
        displayName: 'Return Data',
        name: 'returnData',
        type: 'boolean',
        default: true,
        displayOptions: { show: { resource: ['database'], operation: ['insert', 'update', 'upsert', 'delete'] } },
        description: 'Whether to return the affected rows',
      },
      {
        displayName: 'Function Name',
        name: 'functionName',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['database'], operation: ['rpc'] } },
        description: 'Name of the database function to call',
      },
      {
        displayName: 'Arguments (JSON)',
        name: 'arguments',
        type: 'json',
        default: '{}',
        displayOptions: { show: { resource: ['database'], operation: ['rpc'] } },
        description: 'Arguments to pass to the function',
      },
      {
        displayName: 'Count Type',
        name: 'countType',
        type: 'options',
        options: [
          { name: 'Exact', value: 'exact' },
          { name: 'Planned', value: 'planned' },
          { name: 'Estimated', value: 'estimated' },
        ],
        default: 'exact',
        displayOptions: { show: { resource: ['database'], operation: ['count'] } },
      },
      // Filters
      {
        displayName: 'Filters',
        name: 'filters',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true },
        default: {},
        displayOptions: { show: { resource: ['database'], operation: ['select', 'update', 'delete', 'count'] } },
        options: [
          {
            name: 'filter',
            displayName: 'Filter',
            values: [
              { displayName: 'Column', name: 'column', type: 'string', default: '' },
              {
                displayName: 'Operator',
                name: 'operator',
                type: 'options',
                options: [
                  { name: 'Equals', value: 'eq' },
                  { name: 'Not Equals', value: 'neq' },
                  { name: 'Greater Than', value: 'gt' },
                  { name: 'Greater Than or Equal', value: 'gte' },
                  { name: 'Less Than', value: 'lt' },
                  { name: 'Less Than or Equal', value: 'lte' },
                  { name: 'Like', value: 'like' },
                  { name: 'ILike (Case Insensitive)', value: 'ilike' },
                  { name: 'Is (NULL/TRUE/FALSE)', value: 'is' },
                  { name: 'In', value: 'in' },
                  { name: 'Contains', value: 'contains' },
                  { name: 'Overlaps', value: 'overlaps' },
                ],
                default: 'eq',
              },
              { displayName: 'Value', name: 'value', type: 'string', default: '' },
            ],
          },
        ],
      },
      // Order By
      {
        displayName: 'Order By',
        name: 'orderBy',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true },
        default: {},
        displayOptions: { show: { resource: ['database'], operation: ['select'] } },
        options: [
          {
            name: 'order',
            displayName: 'Order',
            values: [
              { displayName: 'Column', name: 'column', type: 'string', default: '' },
              {
                displayName: 'Direction',
                name: 'direction',
                type: 'options',
                options: [
                  { name: 'Ascending', value: 'asc' },
                  { name: 'Descending', value: 'desc' },
                ],
                default: 'asc',
              },
              { displayName: 'Nulls First', name: 'nullsFirst', type: 'boolean', default: false },
            ],
          },
        ],
      },
      // Pagination
      {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        default: 100,
        displayOptions: { show: { resource: ['database'], operation: ['select'] } },
      },
      {
        displayName: 'Offset',
        name: 'offset',
        type: 'number',
        default: 0,
        displayOptions: { show: { resource: ['database'], operation: ['select'] } },
      },

      // ==================== AUTH OPERATIONS ====================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['auth'] } },
        options: [
          { name: 'Sign Up', value: 'signUp', action: 'Sign up new user' },
          { name: 'Sign In', value: 'signIn', action: 'Sign in with email password' },
          { name: 'Sign In with OTP', value: 'signInWithOtp', action: 'Sign in with magic link OTP' },
          { name: 'Sign In with OAuth', value: 'signInWithOAuth', action: 'Get OAuth sign in URL' },
          { name: 'Sign Out', value: 'signOut', action: 'Sign out user' },
          { name: 'Get User', value: 'getUser', action: 'Get current user' },
          { name: 'Update User', value: 'updateUser', action: 'Update user attributes' },
          { name: 'Reset Password', value: 'resetPasswordForEmail', action: 'Send password reset email' },
          { name: 'Verify OTP', value: 'verifyOtp', action: 'Verify OTP token' },
          { name: 'Refresh Session', value: 'refreshSession', action: 'Refresh access token' },
          { name: 'Set Session', value: 'setSession', action: 'Set session manually' },
          { name: 'Get Session', value: 'getSession', action: 'Get current session' },
        ],
        default: 'signIn',
      },
      // Auth fields
      {
        displayName: 'Email',
        name: 'email',
        type: 'string',
        placeholder: 'user@example.com',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['auth'], operation: ['signUp', 'signIn', 'resetPasswordForEmail'] } },
      },
      {
        displayName: 'Password',
        name: 'password',
        type: 'string',
        typeOptions: { password: true },
        default: '',
        required: true,
        displayOptions: { show: { resource: ['auth'], operation: ['signUp', 'signIn'] } },
      },
      {
        displayName: 'User Metadata (JSON)',
        name: 'userMetadata',
        type: 'json',
        default: '{}',
        displayOptions: { show: { resource: ['auth'], operation: ['signUp'] } },
      },
      {
        displayName: 'Redirect URL',
        name: 'emailRedirectTo',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['auth'], operation: ['signUp', 'signInWithOtp', 'resetPasswordForEmail'] } },
      },
      {
        displayName: 'OTP Type',
        name: 'otpType',
        type: 'options',
        options: [
          { name: 'Email', value: 'email' },
          { name: 'Phone', value: 'phone' },
        ],
        default: 'email',
        displayOptions: { show: { resource: ['auth'], operation: ['signInWithOtp'] } },
      },
      {
        displayName: 'Email',
        name: 'email',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['auth'], operation: ['signInWithOtp'], otpType: ['email'] } },
      },
      {
        displayName: 'Phone',
        name: 'phone',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['auth'], operation: ['signInWithOtp'], otpType: ['phone'] } },
      },
      {
        displayName: 'Should Create User',
        name: 'shouldCreateUser',
        type: 'boolean',
        default: true,
        displayOptions: { show: { resource: ['auth'], operation: ['signInWithOtp'] } },
      },
      {
        displayName: 'Provider',
        name: 'provider',
        type: 'options',
        options: OAUTH_PROVIDERS.map((p) => ({ name: p.charAt(0).toUpperCase() + p.slice(1), value: p })),
        default: 'google',
        displayOptions: { show: { resource: ['auth'], operation: ['signInWithOAuth'] } },
      },
      {
        displayName: 'Redirect To',
        name: 'redirectTo',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['auth'], operation: ['signInWithOAuth', 'resetPasswordForEmail'] } },
      },
      {
        displayName: 'Scopes',
        name: 'scopes',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['auth'], operation: ['signInWithOAuth'] } },
        description: 'OAuth scopes (space-separated)',
      },
      {
        displayName: 'Access Token',
        name: 'accessToken',
        type: 'string',
        typeOptions: { password: true },
        default: '',
        required: true,
        displayOptions: { show: { resource: ['auth'], operation: ['signOut', 'getUser', 'updateUser', 'setSession', 'getSession'] } },
      },
      {
        displayName: 'Scope',
        name: 'scope',
        type: 'options',
        options: [
          { name: 'Global (All Sessions)', value: 'global' },
          { name: 'Local (Current Session)', value: 'local' },
          { name: 'Others (Other Sessions)', value: 'others' },
        ],
        default: 'global',
        displayOptions: { show: { resource: ['auth'], operation: ['signOut'] } },
      },
      {
        displayName: 'Update Fields',
        name: 'updateFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: { show: { resource: ['auth'], operation: ['updateUser'] } },
        options: [
          { displayName: 'Email', name: 'email', type: 'string', default: '' },
          { displayName: 'Password', name: 'password', type: 'string', typeOptions: { password: true }, default: '' },
          { displayName: 'Phone', name: 'phone', type: 'string', default: '' },
          { displayName: 'User Metadata (JSON)', name: 'userMetadata', type: 'json', default: '{}' },
        ],
      },
      {
        displayName: 'Verify Type',
        name: 'verifyType',
        type: 'options',
        options: [
          { name: 'Email', value: 'email' },
          { name: 'Phone', value: 'phone' },
        ],
        default: 'email',
        displayOptions: { show: { resource: ['auth'], operation: ['verifyOtp'] } },
      },
      {
        displayName: 'Email',
        name: 'email',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['auth'], operation: ['verifyOtp'], verifyType: ['email'] } },
      },
      {
        displayName: 'Phone',
        name: 'phone',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['auth'], operation: ['verifyOtp'], verifyType: ['phone'] } },
      },
      {
        displayName: 'Token',
        name: 'token',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['auth'], operation: ['verifyOtp'] } },
      },
      {
        displayName: 'Type',
        name: 'type',
        type: 'options',
        options: [
          { name: 'Email', value: 'email' },
          { name: 'SMS', value: 'sms' },
          { name: 'Signup', value: 'signup' },
          { name: 'Recovery', value: 'recovery' },
          { name: 'Invite', value: 'invite' },
          { name: 'Magic Link', value: 'magiclink' },
          { name: 'Email Change', value: 'email_change' },
        ],
        default: 'email',
        displayOptions: { show: { resource: ['auth'], operation: ['verifyOtp'] } },
      },
      {
        displayName: 'Refresh Token',
        name: 'refreshToken',
        type: 'string',
        typeOptions: { password: true },
        default: '',
        required: true,
        displayOptions: { show: { resource: ['auth'], operation: ['refreshSession', 'setSession'] } },
      },

      // ==================== USERS (ADMIN) OPERATIONS ====================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['users'] } },
        options: [
          { name: 'List Users', value: 'listUsers', action: 'List all users' },
          { name: 'Get User by ID', value: 'getUserById', action: 'Get user by ID' },
          { name: 'Create User', value: 'createUser', action: 'Create user admin' },
          { name: 'Update User by ID', value: 'updateUserById', action: 'Update user admin' },
          { name: 'Delete User', value: 'deleteUser', action: 'Delete user' },
          { name: 'Invite User by Email', value: 'inviteUserByEmail', action: 'Send invite email' },
          { name: 'Generate Link', value: 'generateLink', action: 'Generate auth link' },
        ],
        default: 'listUsers',
      },
      {
        displayName: 'Page',
        name: 'page',
        type: 'number',
        default: 1,
        displayOptions: { show: { resource: ['users'], operation: ['listUsers'] } },
      },
      {
        displayName: 'Per Page',
        name: 'perPage',
        type: 'number',
        default: 50,
        displayOptions: { show: { resource: ['users'], operation: ['listUsers'] } },
      },
      {
        displayName: 'User ID',
        name: 'userId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['users'], operation: ['getUserById', 'updateUserById', 'deleteUser'] } },
      },
      {
        displayName: 'Email',
        name: 'email',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['users'], operation: ['createUser', 'inviteUserByEmail', 'generateLink'] } },
      },
      {
        displayName: 'Password',
        name: 'password',
        type: 'string',
        typeOptions: { password: true },
        default: '',
        required: true,
        displayOptions: { show: { resource: ['users'], operation: ['createUser'] } },
      },
      {
        displayName: 'Should Soft Delete',
        name: 'shouldSoftDelete',
        type: 'boolean',
        default: false,
        displayOptions: { show: { resource: ['users'], operation: ['deleteUser'] } },
      },
      {
        displayName: 'Redirect To',
        name: 'redirectTo',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['users'], operation: ['inviteUserByEmail', 'generateLink'] } },
      },
      {
        displayName: 'Link Type',
        name: 'linkType',
        type: 'options',
        options: [
          { name: 'Signup', value: 'signup' },
          { name: 'Magic Link', value: 'magiclink' },
          { name: 'Recovery', value: 'recovery' },
          { name: 'Invite', value: 'invite' },
          { name: 'Email Change (Current)', value: 'email_change_current' },
          { name: 'Email Change (New)', value: 'email_change_new' },
        ],
        default: 'signup',
        displayOptions: { show: { resource: ['users'], operation: ['generateLink'] } },
      },
      {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: { show: { resource: ['users'], operation: ['createUser', 'inviteUserByEmail', 'generateLink'] } },
        options: [
          { displayName: 'Email Confirm', name: 'emailConfirm', type: 'boolean', default: true },
          { displayName: 'Phone', name: 'phone', type: 'string', default: '' },
          { displayName: 'Phone Confirm', name: 'phoneConfirm', type: 'boolean', default: true },
          { displayName: 'User Metadata (JSON)', name: 'userMetadata', type: 'json', default: '{}' },
          { displayName: 'App Metadata (JSON)', name: 'appMetadata', type: 'json', default: '{}' },
          { displayName: 'Role', name: 'role', type: 'string', default: '' },
          { displayName: 'Ban Duration', name: 'banDuration', type: 'string', default: '' },
          { displayName: 'Password', name: 'password', type: 'string', typeOptions: { password: true }, default: '' },
        ],
      },
      {
        displayName: 'Update Fields',
        name: 'updateFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: { show: { resource: ['users'], operation: ['updateUserById'] } },
        options: [
          { displayName: 'Email', name: 'email', type: 'string', default: '' },
          { displayName: 'Email Confirm', name: 'emailConfirm', type: 'boolean', default: true },
          { displayName: 'Password', name: 'password', type: 'string', typeOptions: { password: true }, default: '' },
          { displayName: 'Phone', name: 'phone', type: 'string', default: '' },
          { displayName: 'Phone Confirm', name: 'phoneConfirm', type: 'boolean', default: true },
          { displayName: 'User Metadata (JSON)', name: 'userMetadata', type: 'json', default: '{}' },
          { displayName: 'App Metadata (JSON)', name: 'appMetadata', type: 'json', default: '{}' },
          { displayName: 'Role', name: 'role', type: 'string', default: '' },
          { displayName: 'Ban Duration', name: 'banDuration', type: 'string', default: '' },
        ],
      },

      // ==================== STORAGE OPERATIONS ====================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['storage'] } },
        options: [
          { name: 'List Buckets', value: 'listBuckets', action: 'List all buckets' },
          { name: 'Get Bucket', value: 'getBucket', action: 'Get bucket info' },
          { name: 'Create Bucket', value: 'createBucket', action: 'Create new bucket' },
          { name: 'Update Bucket', value: 'updateBucket', action: 'Update bucket settings' },
          { name: 'Delete Bucket', value: 'deleteBucket', action: 'Delete bucket' },
          { name: 'Empty Bucket', value: 'emptyBucket', action: 'Empty all files in bucket' },
          { name: 'List Files', value: 'listFiles', action: 'List files in bucket folder' },
          { name: 'Upload File', value: 'uploadFile', action: 'Upload file' },
          { name: 'Download File', value: 'downloadFile', action: 'Download file' },
          { name: 'Get Public URL', value: 'getPublicUrl', action: 'Get public URL for file' },
          { name: 'Create Signed URL', value: 'createSignedUrl', action: 'Create signed URL' },
          { name: 'Move File', value: 'moveFile', action: 'Move rename file' },
          { name: 'Copy File', value: 'copyFile', action: 'Copy file' },
          { name: 'Delete Files', value: 'deleteFiles', action: 'Delete files' },
        ],
        default: 'listBuckets',
      },
      {
        displayName: 'Bucket ID',
        name: 'bucketId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['storage'], operation: ['getBucket', 'createBucket', 'updateBucket', 'deleteBucket', 'emptyBucket', 'listFiles', 'uploadFile', 'downloadFile', 'getPublicUrl', 'createSignedUrl', 'moveFile', 'copyFile', 'deleteFiles'] } },
      },
      {
        displayName: 'File Path',
        name: 'filePath',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['storage'], operation: ['uploadFile', 'downloadFile', 'getPublicUrl', 'createSignedUrl'] } },
        description: 'Path to the file within the bucket',
      },
      {
        displayName: 'Binary Property',
        name: 'binaryPropertyName',
        type: 'string',
        default: 'data',
        displayOptions: { show: { resource: ['storage'], operation: ['uploadFile', 'downloadFile'] } },
      },
      {
        displayName: 'Prefix',
        name: 'prefix',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['storage'], operation: ['listFiles'] } },
        description: 'Filter files by prefix/folder path',
      },
      {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        default: 100,
        displayOptions: { show: { resource: ['storage'], operation: ['listFiles'] } },
      },
      {
        displayName: 'Offset',
        name: 'offset',
        type: 'number',
        default: 0,
        displayOptions: { show: { resource: ['storage'], operation: ['listFiles'] } },
      },
      {
        displayName: 'Sort By',
        name: 'sortBy',
        type: 'collection',
        placeholder: 'Add Sort',
        default: {},
        displayOptions: { show: { resource: ['storage'], operation: ['listFiles'] } },
        options: [
          { displayName: 'Column', name: 'column', type: 'options', options: [{ name: 'Name', value: 'name' }, { name: 'Created At', value: 'created_at' }, { name: 'Updated At', value: 'updated_at' }], default: 'name' },
          { displayName: 'Order', name: 'order', type: 'options', options: [{ name: 'Ascending', value: 'asc' }, { name: 'Descending', value: 'desc' }], default: 'asc' },
        ],
      },
      {
        displayName: 'From Path',
        name: 'fromPath',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['storage'], operation: ['moveFile', 'copyFile'] } },
      },
      {
        displayName: 'To Path',
        name: 'toPath',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['storage'], operation: ['moveFile', 'copyFile'] } },
      },
      {
        displayName: 'File Paths',
        name: 'filePaths',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['storage'], operation: ['deleteFiles'] } },
        description: 'Comma-separated list of file paths to delete',
      },
      {
        displayName: 'Expires In (Seconds)',
        name: 'expiresIn',
        type: 'number',
        default: 3600,
        displayOptions: { show: { resource: ['storage'], operation: ['createSignedUrl'] } },
      },
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        displayOptions: { show: { resource: ['storage'], operation: ['createBucket', 'updateBucket', 'uploadFile', 'getPublicUrl', 'createSignedUrl'] } },
        options: [
          { displayName: 'Public', name: 'public', type: 'boolean', default: false },
          { displayName: 'File Size Limit', name: 'fileSizeLimit', type: 'number', default: 0 },
          { displayName: 'Allowed MIME Types', name: 'allowedMimeTypes', type: 'string', default: '' },
          { displayName: 'Cache Control', name: 'cacheControl', type: 'string', default: '3600' },
          { displayName: 'Upsert', name: 'upsert', type: 'boolean', default: false },
          { displayName: 'Width', name: 'width', type: 'number', default: 0 },
          { displayName: 'Height', name: 'height', type: 'number', default: 0 },
          { displayName: 'Quality', name: 'quality', type: 'number', default: 80 },
          { displayName: 'Format', name: 'format', type: 'options', options: [{ name: 'Origin', value: 'origin' }, { name: 'AVIF', value: 'avif' }, { name: 'WebP', value: 'webp' }], default: 'origin' },
          { displayName: 'Resize', name: 'resize', type: 'options', options: [{ name: 'Cover', value: 'cover' }, { name: 'Contain', value: 'contain' }, { name: 'Fill', value: 'fill' }], default: 'cover' },
          { displayName: 'Download', name: 'download', type: 'string', default: '' },
          { displayName: 'Transform (JSON)', name: 'transform', type: 'json', default: '{}' },
        ],
      },

      // ==================== EDGE FUNCTIONS OPERATIONS ====================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['edgeFunctions'] } },
        options: [
          { name: 'Invoke', value: 'invoke', action: 'Invoke edge function' },
          { name: 'List Functions', value: 'listFunctions', action: 'List functions management API' },
          { name: 'Get Function', value: 'getFunction', action: 'Get function details' },
          { name: 'Deploy Function', value: 'deployFunction', action: 'Deploy function' },
        ],
        default: 'invoke',
      },
      {
        displayName: 'Function Name',
        name: 'functionName',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['edgeFunctions'], operation: ['invoke'] } },
      },
      {
        displayName: 'Body (JSON)',
        name: 'body',
        type: 'json',
        default: '{}',
        displayOptions: { show: { resource: ['edgeFunctions'], operation: ['invoke'] } },
      },
      {
        displayName: 'Headers (JSON)',
        name: 'headers',
        type: 'json',
        default: '{}',
        displayOptions: { show: { resource: ['edgeFunctions'], operation: ['invoke'] } },
      },
      {
        displayName: 'Project Ref',
        name: 'projectRef',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['edgeFunctions'], operation: ['listFunctions', 'getFunction', 'deployFunction'] } },
        description: 'The project reference ID from your Supabase dashboard',
      },
      {
        displayName: 'Function Slug',
        name: 'functionSlug',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['edgeFunctions'], operation: ['getFunction', 'deployFunction'] } },
      },
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        displayOptions: { show: { resource: ['edgeFunctions'], operation: ['deployFunction'] } },
        options: [
          { displayName: 'Name', name: 'name', type: 'string', default: '' },
          { displayName: 'Verify JWT', name: 'verifyJwt', type: 'boolean', default: true },
          { displayName: 'Import Map', name: 'importMap', type: 'string', default: '' },
          { displayName: 'Entrypoint Path', name: 'entrypointPath', type: 'string', default: '' },
        ],
      },

      // ==================== REALTIME OPERATIONS ====================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['realtime'] } },
        options: [
          { name: 'Create Channel', value: 'createChannel', action: 'Create realtime channel' },
          { name: 'Subscribe to Changes', value: 'subscribeToChanges', action: 'Subscribe to DB changes' },
          { name: 'Subscribe to Broadcast', value: 'subscribeToBroadcast', action: 'Subscribe to broadcasts' },
          { name: 'Subscribe to Presence', value: 'subscribeToPresence', action: 'Subscribe to presence' },
          { name: 'Unsubscribe', value: 'unsubscribe', action: 'Unsubscribe from channel' },
        ],
        default: 'createChannel',
      },
      {
        displayName: 'Channel Name',
        name: 'channelName',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['realtime'] } },
      },
      {
        displayName: 'Schema',
        name: 'schema',
        type: 'string',
        default: 'public',
        displayOptions: { show: { resource: ['realtime'], operation: ['subscribeToChanges'] } },
      },
      {
        displayName: 'Table',
        name: 'table',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['realtime'], operation: ['subscribeToChanges'] } },
      },
      {
        displayName: 'Event',
        name: 'event',
        type: 'options',
        options: [
          { name: 'All', value: '*' },
          { name: 'INSERT', value: 'INSERT' },
          { name: 'UPDATE', value: 'UPDATE' },
          { name: 'DELETE', value: 'DELETE' },
        ],
        default: '*',
        displayOptions: { show: { resource: ['realtime'], operation: ['subscribeToChanges'] } },
      },
      {
        displayName: 'Filter',
        name: 'filter',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['realtime'], operation: ['subscribeToChanges'] } },
        description: 'PostgREST filter syntax (e.g., "id=eq.1")',
      },
      {
        displayName: 'Event',
        name: 'event',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['realtime'], operation: ['subscribeToBroadcast'] } },
      },
      {
        displayName: 'User Key',
        name: 'userKey',
        type: 'string',
        default: 'user_id',
        displayOptions: { show: { resource: ['realtime'], operation: ['subscribeToPresence'] } },
      },
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        displayOptions: { show: { resource: ['realtime'], operation: ['createChannel'] } },
        options: [
          { displayName: 'Presence', name: 'presence', type: 'boolean', default: false },
          { displayName: 'Broadcast', name: 'broadcast', type: 'boolean', default: false },
        ],
      },

      // ==================== MANAGEMENT: PROJECTS ====================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['managementProjects'] } },
        options: [
          { name: 'List Projects', value: 'listProjects', action: 'List all projects' },
          { name: 'Get Project', value: 'getProject', action: 'Get project details' },
          { name: 'Create Project', value: 'createProject', action: 'Create new project' },
          { name: 'Delete Project', value: 'deleteProject', action: 'Delete project' },
          { name: 'Pause Project', value: 'pauseProject', action: 'Pause project' },
          { name: 'Restore Project', value: 'restoreProject', action: 'Restore paused project' },
          { name: 'Get API Keys', value: 'getProjectApiKeys', action: 'Get API keys' },
          { name: 'Get Settings', value: 'getProjectSettings', action: 'Get settings' },
        ],
        default: 'listProjects',
      },
      {
        displayName: 'Project Ref',
        name: 'projectRef',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['managementProjects'], operation: ['getProject', 'deleteProject', 'pauseProject', 'restoreProject', 'getProjectApiKeys', 'getProjectSettings'] } },
      },
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['managementProjects'], operation: ['createProject'] } },
      },
      {
        displayName: 'Organization ID',
        name: 'organizationId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['managementProjects'], operation: ['createProject'] } },
      },
      {
        displayName: 'Region',
        name: 'region',
        type: 'options',
        options: SUPABASE_REGIONS.map((r) => ({ name: r.name, value: r.value })),
        default: 'us-east-1',
        displayOptions: { show: { resource: ['managementProjects'], operation: ['createProject'] } },
      },
      {
        displayName: 'Database Password',
        name: 'dbPassword',
        type: 'string',
        typeOptions: { password: true },
        default: '',
        required: true,
        displayOptions: { show: { resource: ['managementProjects'], operation: ['createProject'] } },
      },
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        displayOptions: { show: { resource: ['managementProjects'], operation: ['createProject'] } },
        options: [
          { displayName: 'Plan', name: 'plan', type: 'options', options: [{ name: 'Free', value: 'free' }, { name: 'Pro', value: 'pro' }], default: 'free' },
          { displayName: 'KPS Enabled', name: 'kpsEnabled', type: 'boolean', default: false },
        ],
      },

      // ==================== MANAGEMENT: ORGANIZATIONS ====================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['managementOrganizations'] } },
        options: [
          { name: 'List Organizations', value: 'listOrganizations', action: 'List organizations' },
          { name: 'Get Organization', value: 'getOrganization', action: 'Get organization' },
          { name: 'Create Organization', value: 'createOrganization', action: 'Create organization' },
          { name: 'Get Members', value: 'getOrganizationMembers', action: 'Get members' },
        ],
        default: 'listOrganizations',
      },
      {
        displayName: 'Organization ID',
        name: 'organizationId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['managementOrganizations'], operation: ['getOrganization', 'getOrganizationMembers'] } },
      },
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['managementOrganizations'], operation: ['createOrganization'] } },
      },
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        displayOptions: { show: { resource: ['managementOrganizations'], operation: ['createOrganization'] } },
        options: [
          { displayName: 'Billing Email', name: 'billingEmail', type: 'string', default: '' },
        ],
      },

      // ==================== MANAGEMENT: DATABASE ====================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['managementDatabase'] } },
        options: [
          { name: 'Run SQL', value: 'runSql', action: 'Execute SQL query' },
          { name: 'Get Schemas', value: 'getSchemas', action: 'List schemas' },
          { name: 'Get Tables', value: 'getTables', action: 'List tables' },
          { name: 'Get Columns', value: 'getColumns', action: 'Get table columns' },
          { name: 'Get Types', value: 'getTypes', action: 'Get custom types' },
          { name: 'Get Extensions', value: 'getExtensions', action: 'List extensions' },
          { name: 'Enable Extension', value: 'enableExtension', action: 'Enable extension' },
        ],
        default: 'runSql',
      },
      {
        displayName: 'Project Ref',
        name: 'projectRef',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['managementDatabase'] } },
      },
      {
        displayName: 'Query',
        name: 'query',
        type: 'string',
        typeOptions: { rows: 5 },
        default: '',
        required: true,
        displayOptions: { show: { resource: ['managementDatabase'], operation: ['runSql'] } },
        description: 'SQL query to execute',
      },
      {
        displayName: 'Schema',
        name: 'schema',
        type: 'string',
        default: 'public',
        displayOptions: { show: { resource: ['managementDatabase'], operation: ['getTables', 'getColumns', 'getTypes', 'enableExtension'] } },
      },
      {
        displayName: 'Table',
        name: 'table',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['managementDatabase'], operation: ['getColumns'] } },
      },
      {
        displayName: 'Extension Name',
        name: 'extensionName',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['managementDatabase'], operation: ['enableExtension'] } },
      },

      // ==================== MANAGEMENT: SECRETS ====================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['managementSecrets'] } },
        options: [
          { name: 'List Secrets', value: 'listSecrets', action: 'List project secrets' },
          { name: 'Create Secret', value: 'createSecret', action: 'Create secret' },
          { name: 'Delete Secrets', value: 'deleteSecrets', action: 'Delete secrets' },
        ],
        default: 'listSecrets',
      },
      {
        displayName: 'Project Ref',
        name: 'projectRef',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['managementSecrets'] } },
      },
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['managementSecrets'], operation: ['createSecret'] } },
      },
      {
        displayName: 'Value',
        name: 'value',
        type: 'string',
        typeOptions: { password: true },
        default: '',
        required: true,
        displayOptions: { show: { resource: ['managementSecrets'], operation: ['createSecret'] } },
      },
      {
        displayName: 'Secret Names',
        name: 'secretNames',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['managementSecrets'], operation: ['deleteSecrets'] } },
        description: 'Comma-separated list of secret names to delete',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    // Log licensing notice once
    logLicensingNotice(this);

    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        let result: INodeExecutionData[] = [];

        switch (resource) {
          case 'database':
            result = await (databaseOperations as any)[operation].call(this, i);
            break;
          case 'auth':
            result = await (authOperations as any)[operation].call(this, i);
            break;
          case 'users':
            result = await (usersOperations as any)[operation].call(this, i);
            break;
          case 'storage':
            result = await (storageOperations as any)[operation].call(this, i);
            break;
          case 'edgeFunctions':
            result = await (edgeFunctionsOperations as any)[operation].call(this, i);
            break;
          case 'realtime':
            result = await (realtimeOperations as any)[operation].call(this, i);
            break;
          case 'managementProjects':
            result = await (managementProjectsOperations as any)[operation].call(this, i);
            break;
          case 'managementOrganizations':
            result = await (managementOrganizationsOperations as any)[operation].call(this, i);
            break;
          case 'managementDatabase':
            result = await (managementDatabaseOperations as any)[operation].call(this, i);
            break;
          case 'managementSecrets':
            result = await (managementSecretsOperations as any)[operation].call(this, i);
            break;
          default:
            throw new Error(`Unknown resource: ${resource}`);
        }

        returnData.push(...result);
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: (error as Error).message,
            },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
