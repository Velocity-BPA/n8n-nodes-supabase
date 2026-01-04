/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Supabase API endpoints
 */
export const SUPABASE_ENDPOINTS = {
  REST: '/rest/v1',
  AUTH: '/auth/v1',
  STORAGE: '/storage/v1',
  REALTIME: '/realtime/v1',
  FUNCTIONS: '/functions/v1',
  MANAGEMENT: 'https://api.supabase.com/v1',
} as const;

/**
 * PostgREST operators for filtering
 */
export const POSTGREST_OPERATORS = {
  eq: 'eq',
  neq: 'neq',
  gt: 'gt',
  gte: 'gte',
  lt: 'lt',
  lte: 'lte',
  like: 'like',
  ilike: 'ilike',
  is: 'is',
  in: 'in',
  contains: 'cs',
  containedBy: 'cd',
  overlaps: 'ov',
  rangeGt: 'sl',
  rangeLt: 'sr',
  rangeGte: 'nxl',
  rangeLte: 'nxr',
  rangeAdjacent: 'adj',
  not: 'not',
  or: 'or',
  and: 'and',
  fts: 'fts',
  plfts: 'plfts',
  phfts: 'phfts',
  wfts: 'wfts',
} as const;

/**
 * Resource definitions
 */
export const RESOURCES = {
  DATABASE: 'database',
  AUTH: 'auth',
  USERS: 'users',
  STORAGE: 'storage',
  EDGE_FUNCTIONS: 'edgeFunctions',
  REALTIME: 'realtime',
  MANAGEMENT_PROJECTS: 'managementProjects',
  MANAGEMENT_ORGANIZATIONS: 'managementOrganizations',
  MANAGEMENT_DATABASE: 'managementDatabase',
  MANAGEMENT_SECRETS: 'managementSecrets',
} as const;

/**
 * Database operations
 */
export const DATABASE_OPERATIONS = {
  SELECT: 'select',
  INSERT: 'insert',
  UPDATE: 'update',
  UPSERT: 'upsert',
  DELETE: 'delete',
  RPC: 'rpc',
  COUNT: 'count',
} as const;

/**
 * Auth operations
 */
export const AUTH_OPERATIONS = {
  SIGN_UP: 'signUp',
  SIGN_IN: 'signIn',
  SIGN_IN_WITH_OTP: 'signInWithOtp',
  SIGN_IN_WITH_OAUTH: 'signInWithOAuth',
  SIGN_OUT: 'signOut',
  GET_USER: 'getUser',
  UPDATE_USER: 'updateUser',
  RESET_PASSWORD: 'resetPasswordForEmail',
  VERIFY_OTP: 'verifyOtp',
  REFRESH_SESSION: 'refreshSession',
  SET_SESSION: 'setSession',
  GET_SESSION: 'getSession',
} as const;

/**
 * User admin operations
 */
export const USERS_OPERATIONS = {
  LIST_USERS: 'listUsers',
  GET_USER_BY_ID: 'getUserById',
  CREATE_USER: 'createUser',
  UPDATE_USER_BY_ID: 'updateUserById',
  DELETE_USER: 'deleteUser',
  INVITE_USER: 'inviteUserByEmail',
  GENERATE_LINK: 'generateLink',
} as const;

/**
 * Storage operations
 */
export const STORAGE_OPERATIONS = {
  LIST_BUCKETS: 'listBuckets',
  GET_BUCKET: 'getBucket',
  CREATE_BUCKET: 'createBucket',
  UPDATE_BUCKET: 'updateBucket',
  DELETE_BUCKET: 'deleteBucket',
  EMPTY_BUCKET: 'emptyBucket',
  LIST_FILES: 'listFiles',
  UPLOAD_FILE: 'uploadFile',
  DOWNLOAD_FILE: 'downloadFile',
  GET_PUBLIC_URL: 'getPublicUrl',
  CREATE_SIGNED_URL: 'createSignedUrl',
  MOVE_FILE: 'moveFile',
  COPY_FILE: 'copyFile',
  DELETE_FILES: 'deleteFiles',
} as const;

/**
 * Edge Functions operations
 */
export const EDGE_FUNCTIONS_OPERATIONS = {
  INVOKE: 'invoke',
  LIST_FUNCTIONS: 'listFunctions',
  GET_FUNCTION: 'getFunction',
  DEPLOY_FUNCTION: 'deployFunction',
} as const;

/**
 * Realtime operations
 */
export const REALTIME_OPERATIONS = {
  CREATE_CHANNEL: 'createChannel',
  SUBSCRIBE_TO_CHANGES: 'subscribeToChanges',
  SUBSCRIBE_TO_BROADCAST: 'subscribeToBroadcast',
  SUBSCRIBE_TO_PRESENCE: 'subscribeToPresence',
  UNSUBSCRIBE: 'unsubscribe',
} as const;

/**
 * Management Projects operations
 */
export const MANAGEMENT_PROJECTS_OPERATIONS = {
  LIST_PROJECTS: 'listProjects',
  GET_PROJECT: 'getProject',
  CREATE_PROJECT: 'createProject',
  DELETE_PROJECT: 'deleteProject',
  PAUSE_PROJECT: 'pauseProject',
  RESTORE_PROJECT: 'restoreProject',
  GET_API_KEYS: 'getProjectApiKeys',
  GET_SETTINGS: 'getProjectSettings',
} as const;

/**
 * Management Organizations operations
 */
export const MANAGEMENT_ORGANIZATIONS_OPERATIONS = {
  LIST_ORGANIZATIONS: 'listOrganizations',
  GET_ORGANIZATION: 'getOrganization',
  CREATE_ORGANIZATION: 'createOrganization',
  GET_MEMBERS: 'getOrganizationMembers',
} as const;

/**
 * Management Database operations
 */
export const MANAGEMENT_DATABASE_OPERATIONS = {
  RUN_SQL: 'runSql',
  GET_SCHEMAS: 'getSchemas',
  GET_TABLES: 'getTables',
  GET_COLUMNS: 'getColumns',
  GET_TYPES: 'getTypes',
  GET_EXTENSIONS: 'getExtensions',
  ENABLE_EXTENSION: 'enableExtension',
} as const;

/**
 * Management Secrets operations
 */
export const MANAGEMENT_SECRETS_OPERATIONS = {
  LIST_SECRETS: 'listSecrets',
  CREATE_SECRET: 'createSecret',
  DELETE_SECRETS: 'deleteSecrets',
} as const;

/**
 * Trigger events
 */
export const TRIGGER_EVENTS = {
  ROW_INSERTED: 'rowInserted',
  ROW_UPDATED: 'rowUpdated',
  ROW_DELETED: 'rowDeleted',
  AUTH_USER_CREATED: 'authUserCreated',
  AUTH_USER_SIGNED_IN: 'authUserSignedIn',
  AUTH_USER_DELETED: 'authUserDeleted',
  STORAGE_OBJECT_CREATED: 'storageObjectCreated',
  STORAGE_OBJECT_DELETED: 'storageObjectDeleted',
} as const;

/**
 * OAuth providers supported by Supabase
 */
export const OAUTH_PROVIDERS = [
  'apple',
  'azure',
  'bitbucket',
  'discord',
  'facebook',
  'figma',
  'github',
  'gitlab',
  'google',
  'kakao',
  'keycloak',
  'linkedin',
  'linkedin_oidc',
  'notion',
  'slack',
  'spotify',
  'twitch',
  'twitter',
  'workos',
  'zoom',
] as const;

/**
 * Supabase regions
 */
export const SUPABASE_REGIONS = [
  { name: 'US East (N. Virginia)', value: 'us-east-1' },
  { name: 'US West (Oregon)', value: 'us-west-1' },
  { name: 'EU (Ireland)', value: 'eu-west-1' },
  { name: 'EU (Frankfurt)', value: 'eu-central-1' },
  { name: 'Asia Pacific (Singapore)', value: 'ap-southeast-1' },
  { name: 'Asia Pacific (Sydney)', value: 'ap-southeast-2' },
  { name: 'Asia Pacific (Tokyo)', value: 'ap-northeast-1' },
  { name: 'Asia Pacific (Mumbai)', value: 'ap-south-1' },
  { name: 'South America (São Paulo)', value: 'sa-east-1' },
] as const;

/**
 * Type definitions
 */
export interface SupabaseCredentials {
  projectUrl: string;
  authType: 'anonKey' | 'serviceRoleKey' | 'managementApi';
  anonKey?: string;
  serviceRoleKey?: string;
  managementApiToken?: string;
  region?: string;
}

export interface PostgRESTFilter {
  column: string;
  operator: keyof typeof POSTGREST_OPERATORS;
  value: string;
}

export interface SupabaseError {
  message: string;
  code?: string;
  hint?: string;
  details?: string;
}

export interface DatabaseRow {
  [key: string]: any;
}

export interface StorageBucket {
  id: string;
  name: string;
  owner: string;
  public: boolean;
  created_at: string;
  updated_at: string;
  file_size_limit?: number;
  allowed_mime_types?: string[];
}

export interface StorageFile {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: Record<string, any>;
}

export interface SupabaseUser {
  id: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
  last_sign_in_at?: string;
  app_metadata: Record<string, any>;
  user_metadata: Record<string, any>;
  role?: string;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: SupabaseUser;
}

export interface SupabaseProject {
  id: string;
  organization_id: string;
  name: string;
  region: string;
  created_at: string;
  status: string;
}

export interface SupabaseOrganization {
  id: string;
  name: string;
  billing_email?: string;
}

export interface EdgeFunction {
  id: string;
  slug: string;
  name: string;
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Secret {
  name: string;
  value?: string;
}
