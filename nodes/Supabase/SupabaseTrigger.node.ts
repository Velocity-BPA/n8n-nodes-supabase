/**
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1 (BSL 1.1)
 * See LICENSE file for details
 */

import type {
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	IDataObject,
} from 'n8n-workflow';

import { logLicensingNotice } from './utils';

export class SupabaseTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Supabase Trigger',
		name: 'supabaseTrigger',
		icon: 'file:supabase.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Starts a workflow when Supabase events occur',
		defaults: {
			name: 'Supabase Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'supabaseApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Row Inserted',
						value: 'rowInserted',
						description: 'Triggered when a new row is inserted into a table',
					},
					{
						name: 'Row Updated',
						value: 'rowUpdated',
						description: 'Triggered when a row is updated in a table',
					},
					{
						name: 'Row Deleted',
						value: 'rowDeleted',
						description: 'Triggered when a row is deleted from a table',
					},
					{
						name: 'Auth User Created',
						value: 'authUserCreated',
						description: 'Triggered when a new user registers',
					},
					{
						name: 'Auth User Signed In',
						value: 'authUserSignedIn',
						description: 'Triggered when a user signs in',
					},
					{
						name: 'Auth User Deleted',
						value: 'authUserDeleted',
						description: 'Triggered when a user is deleted',
					},
					{
						name: 'Storage Object Created',
						value: 'storageObjectCreated',
						description: 'Triggered when a file is uploaded to storage',
					},
					{
						name: 'Storage Object Deleted',
						value: 'storageObjectDeleted',
						description: 'Triggered when a file is deleted from storage',
					},
				],
				default: 'rowInserted',
				required: true,
			},
			{
				displayName: 'Table Name',
				name: 'tableName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						event: ['rowInserted', 'rowUpdated', 'rowDeleted'],
					},
				},
				description: 'The name of the table to watch for changes',
			},
			{
				displayName: 'Schema',
				name: 'schema',
				type: 'string',
				default: 'public',
				displayOptions: {
					show: {
						event: ['rowInserted', 'rowUpdated', 'rowDeleted'],
					},
				},
				description: 'The database schema (default: public)',
			},
			{
				displayName: 'Bucket Name',
				name: 'bucketName',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						event: ['storageObjectCreated', 'storageObjectDeleted'],
					},
				},
				description: 'The storage bucket to watch (leave empty for all buckets)',
			},
			{
				displayName: 'Setup Instructions',
				name: 'setupNotice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						event: ['rowInserted', 'rowUpdated', 'rowDeleted'],
					},
				},
				// eslint-disable-next-line n8n-nodes-base/node-param-description-unneeded-backticks
				description: `To use this trigger, you need to set up a Database Webhook in Supabase:

1. Go to your Supabase Dashboard → Database → Webhooks
2. Click "Create a new hook"
3. Select the table and event type (INSERT, UPDATE, or DELETE)
4. Set the HTTP Request URL to the webhook URL shown below
5. Set Method to POST
6. Add Header: Content-Type = application/json
7. Enable the webhook

Alternatively, create a Database Function and Trigger:
\`\`\`sql
CREATE OR REPLACE FUNCTION notify_n8n()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'YOUR_WEBHOOK_URL',
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE row_to_json(NEW) END,
      'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
    )::text,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
\`\`\``,
			},
			{
				displayName: 'Auth Setup Instructions',
				name: 'authSetupNotice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						event: ['authUserCreated', 'authUserSignedIn', 'authUserDeleted'],
					},
				},
				// eslint-disable-next-line n8n-nodes-base/node-param-description-unneeded-backticks
				description: `To use auth triggers, set up a Database Webhook on the auth.users table:

1. Go to your Supabase Dashboard → Database → Webhooks
2. Click "Create a new hook"
3. Select schema: auth, table: users
4. Select the appropriate event (INSERT for user created, DELETE for user deleted)
5. Set the HTTP Request URL to the webhook URL shown below
6. Set Method to POST
7. Add Header: Content-Type = application/json

Note: For "User Signed In" events, you'll need to use an Edge Function or database trigger on auth.sessions.`,
			},
			{
				displayName: 'Storage Setup Instructions',
				name: 'storageSetupNotice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						event: ['storageObjectCreated', 'storageObjectDeleted'],
					},
				},
				// eslint-disable-next-line n8n-nodes-base/node-param-description-unneeded-backticks
				description: `To use storage triggers, set up a Database Webhook on the storage.objects table:

1. Go to your Supabase Dashboard → Database → Webhooks
2. Click "Create a new hook"
3. Select schema: storage, table: objects
4. Select INSERT for object created, DELETE for object deleted
5. Set the HTTP Request URL to the webhook URL shown below
6. Set Method to POST
7. Add Header: Content-Type = application/json`,
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Include Old Record',
						name: 'includeOldRecord',
						type: 'boolean',
						default: true,
						description: 'Whether to include the old record data for UPDATE events',
					},
					{
						displayName: 'Filter Column',
						name: 'filterColumn',
						type: 'string',
						default: '',
						description: 'Only trigger when this column changes (for UPDATE events)',
					},
					{
						displayName: 'Filter Value',
						name: 'filterValue',
						type: 'string',
						default: '',
						description: 'Only trigger when the filter column has this value',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				// Log licensing notice on first use
				logLicensingNotice();

				// Supabase webhooks are configured manually in the dashboard
				// We just return true to indicate the webhook path is ready
				return true;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				// Log licensing notice
				logLicensingNotice();

				// Webhooks are created manually in Supabase
				// This method just confirms the trigger is set up
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				// Webhooks need to be deleted manually in Supabase
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData() as IDataObject;
		const event = this.getNodeParameter('event') as string;
		const options = this.getNodeParameter('options', {}) as IDataObject;

		// Validate the incoming webhook data
		if (!bodyData || Object.keys(bodyData).length === 0) {
			return {
				workflowData: [
					[
						{
							json: {
								error: 'Empty webhook payload received',
							},
						},
					],
				],
			};
		}

		// Extract event type from payload
		const payloadType = (bodyData.type as string)?.toUpperCase();
		const tableName = bodyData.table as string;
		const schema = bodyData.schema as string;

		// Map Supabase event types to our event types
		const eventTypeMap: { [key: string]: string[] } = {
			rowInserted: ['INSERT'],
			rowUpdated: ['UPDATE'],
			rowDeleted: ['DELETE'],
			authUserCreated: ['INSERT'],
			authUserSignedIn: ['INSERT'], // For auth.sessions
			authUserDeleted: ['DELETE'],
			storageObjectCreated: ['INSERT'],
			storageObjectDeleted: ['DELETE'],
		};

		// Check if the event matches what we're listening for
		const expectedTypes = eventTypeMap[event] || [];
		if (payloadType && !expectedTypes.includes(payloadType)) {
			// Event doesn't match, don't process
			return {
				workflowData: [],
			};
		}

		// For database events, check table name
		if (['rowInserted', 'rowUpdated', 'rowDeleted'].includes(event)) {
			const expectedTable = this.getNodeParameter('tableName') as string;
			const expectedSchema = this.getNodeParameter('schema', 'public') as string;

			if (tableName && tableName !== expectedTable) {
				return { workflowData: [] };
			}
			if (schema && schema !== expectedSchema) {
				return { workflowData: [] };
			}
		}

		// For storage events, check bucket name
		if (['storageObjectCreated', 'storageObjectDeleted'].includes(event)) {
			const expectedBucket = this.getNodeParameter('bucketName', '') as string;
			const record = bodyData.record as IDataObject;
			if (expectedBucket && record && record.bucket_id !== expectedBucket) {
				return { workflowData: [] };
			}
		}

		// Apply column filter if specified
		if (options.filterColumn && options.filterValue) {
			const record = bodyData.record as IDataObject;
			if (record && record[options.filterColumn as string] !== options.filterValue) {
				return { workflowData: [] };
			}
		}

		// Build output data
		const outputData: IDataObject = {
			event: event,
			eventType: payloadType || 'UNKNOWN',
			timestamp: new Date().toISOString(),
			...bodyData,
		};

		// Remove old_record if not requested
		if (!options.includeOldRecord && outputData.old_record) {
			delete outputData.old_record;
		}

		return {
			workflowData: [
				[
					{
						json: outputData,
					},
				],
			],
		};
	}
}
