/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

/**
 * Create realtime channel
 * Note: This returns configuration for client-side WebSocket connection
 */
export async function createChannel(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const channelName = this.getNodeParameter('channelName', index) as string;
  const options = this.getNodeParameter('options', index, {}) as IDataObject;

  const credentials = await this.getCredentials('supabaseApi');
  const projectUrl = (credentials.projectUrl as string).replace('https://', 'wss://');
  const apiKey =
    credentials.authType === 'anonKey'
      ? credentials.anonKey
      : credentials.serviceRoleKey || credentials.anonKey;

  const channelConfig = {
    channelName,
    websocketUrl: `${projectUrl}/realtime/v1/websocket`,
    apiKey,
    options: {
      presence: options.presence || false,
      broadcast: options.broadcast || false,
      postgres_changes: options.postgresChanges || [],
    },
  };

  return [
    {
      json: {
        message:
          'Channel configuration created. Use this configuration with Supabase Realtime client library.',
        config: channelConfig,
      },
    },
  ];
}

/**
 * Subscribe to database changes
 * Note: Returns subscription configuration
 */
export async function subscribeToChanges(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const channelName = this.getNodeParameter('channelName', index) as string;
  const schema = this.getNodeParameter('schema', index, 'public') as string;
  const table = this.getNodeParameter('table', index) as string;
  const event = this.getNodeParameter('event', index, '*') as string;
  const filter = this.getNodeParameter('filter', index, '') as string;

  const credentials = await this.getCredentials('supabaseApi');
  const projectUrl = (credentials.projectUrl as string).replace('https://', 'wss://');
  const apiKey =
    credentials.authType === 'anonKey'
      ? credentials.anonKey
      : credentials.serviceRoleKey || credentials.anonKey;

  const subscriptionConfig: IDataObject = {
    channelName,
    websocketUrl: `${projectUrl}/realtime/v1/websocket`,
    apiKey,
    subscription: {
      type: 'postgres_changes',
      event,
      schema,
      table,
    },
  };

  if (filter) {
    (subscriptionConfig.subscription as IDataObject).filter = filter;
  }

  return [
    {
      json: {
        message:
          'Subscription configuration created. Use this with Supabase Realtime client to receive database changes.',
        config: subscriptionConfig,
      },
    },
  ];
}

/**
 * Subscribe to broadcasts
 * Note: Returns subscription configuration
 */
export async function subscribeToBroadcast(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const channelName = this.getNodeParameter('channelName', index) as string;
  const event = this.getNodeParameter('event', index) as string;

  const credentials = await this.getCredentials('supabaseApi');
  const projectUrl = (credentials.projectUrl as string).replace('https://', 'wss://');
  const apiKey =
    credentials.authType === 'anonKey'
      ? credentials.anonKey
      : credentials.serviceRoleKey || credentials.anonKey;

  const subscriptionConfig = {
    channelName,
    websocketUrl: `${projectUrl}/realtime/v1/websocket`,
    apiKey,
    subscription: {
      type: 'broadcast',
      event,
    },
  };

  return [
    {
      json: {
        message:
          'Broadcast subscription configuration created. Use this with Supabase Realtime client.',
        config: subscriptionConfig,
      },
    },
  ];
}

/**
 * Subscribe to presence
 * Note: Returns subscription configuration
 */
export async function subscribeToPresence(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const channelName = this.getNodeParameter('channelName', index) as string;
  const userKey = this.getNodeParameter('userKey', index, 'user_id') as string;

  const credentials = await this.getCredentials('supabaseApi');
  const projectUrl = (credentials.projectUrl as string).replace('https://', 'wss://');
  const apiKey =
    credentials.authType === 'anonKey'
      ? credentials.anonKey
      : credentials.serviceRoleKey || credentials.anonKey;

  const subscriptionConfig = {
    channelName,
    websocketUrl: `${projectUrl}/realtime/v1/websocket`,
    apiKey,
    subscription: {
      type: 'presence',
      key: userKey,
    },
  };

  return [
    {
      json: {
        message: 'Presence subscription configuration created. Use this with Supabase Realtime client.',
        config: subscriptionConfig,
      },
    },
  ];
}

/**
 * Unsubscribe from channel
 * Note: Returns configuration for unsubscribing
 */
export async function unsubscribe(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const channelName = this.getNodeParameter('channelName', index) as string;

  return [
    {
      json: {
        message: `To unsubscribe from channel "${channelName}", call channel.unsubscribe() on your Supabase client.`,
        channelName,
        action: 'unsubscribe',
      },
    },
  ];
}

/**
 * Realtime operations map
 */
export const realtimeOperations = {
  createChannel,
  subscribeToChanges,
  subscribeToBroadcast,
  subscribeToPresence,
  unsubscribe,
};
