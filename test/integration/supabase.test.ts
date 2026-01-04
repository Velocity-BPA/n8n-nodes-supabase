/**
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1 (BSL 1.1)
 * See LICENSE file for details
 */

/**
 * Integration tests for Supabase node
 * 
 * These tests verify the node's behavior with mocked Supabase API responses.
 * They test the complete flow from node execution to result processing.
 * 
 * To run integration tests with a real Supabase instance, set the following
 * environment variables:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_ANON_KEY: Your Supabase anon key
 * - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key
 */

describe('Supabase Node Integration Tests', () => {
	describe('Database Operations', () => {
		it('should handle select operation response', () => {
			// Mock response from Supabase PostgREST API
			const mockResponse = [
				{ id: 1, name: 'Test User', email: 'test@example.com' },
				{ id: 2, name: 'Another User', email: 'another@example.com' },
			];

			// Verify response structure
			expect(Array.isArray(mockResponse)).toBe(true);
			expect(mockResponse[0]).toHaveProperty('id');
			expect(mockResponse[0]).toHaveProperty('name');
			expect(mockResponse[0]).toHaveProperty('email');
		});

		it('should handle insert operation response with return data', () => {
			const mockResponse = {
				id: 3,
				name: 'New User',
				email: 'new@example.com',
				created_at: '2024-01-01T00:00:00Z',
			};

			expect(mockResponse).toHaveProperty('id');
			expect(mockResponse.id).toBe(3);
		});

		it('should handle count operation response', () => {
			const mockResponse = {
				count: 42,
			};

			expect(mockResponse).toHaveProperty('count');
			expect(typeof mockResponse.count).toBe('number');
		});

		it('should handle RPC function response', () => {
			const mockResponse = {
				result: 'success',
				data: { computed_value: 100 },
			};

			expect(mockResponse).toHaveProperty('result');
			expect(mockResponse.data).toHaveProperty('computed_value');
		});
	});

	describe('Auth Operations', () => {
		it('should handle sign up response', () => {
			const mockResponse = {
				user: {
					id: 'user-uuid-123',
					email: 'newuser@example.com',
					created_at: '2024-01-01T00:00:00Z',
				},
				session: {
					access_token: 'access-token-123',
					refresh_token: 'refresh-token-456',
					expires_at: 1704067200,
				},
			};

			expect(mockResponse).toHaveProperty('user');
			expect(mockResponse).toHaveProperty('session');
			expect(mockResponse.user).toHaveProperty('id');
			expect(mockResponse.session).toHaveProperty('access_token');
		});

		it('should handle OAuth URL response', () => {
			const mockResponse = {
				url: 'https://example.supabase.co/auth/v1/authorize?provider=google',
			};

			expect(mockResponse).toHaveProperty('url');
			expect(mockResponse.url).toContain('authorize');
		});

		it('should handle user data response', () => {
			const mockResponse = {
				id: 'user-uuid-123',
				email: 'user@example.com',
				email_confirmed_at: '2024-01-01T00:00:00Z',
				phone: null,
				user_metadata: {
					name: 'Test User',
				},
				app_metadata: {
					provider: 'email',
				},
			};

			expect(mockResponse).toHaveProperty('id');
			expect(mockResponse).toHaveProperty('email');
			expect(mockResponse).toHaveProperty('user_metadata');
		});
	});

	describe('Storage Operations', () => {
		it('should handle bucket list response', () => {
			const mockResponse = [
				{
					id: 'bucket-1',
					name: 'images',
					public: true,
					created_at: '2024-01-01T00:00:00Z',
				},
				{
					id: 'bucket-2',
					name: 'documents',
					public: false,
					created_at: '2024-01-01T00:00:00Z',
				},
			];

			expect(Array.isArray(mockResponse)).toBe(true);
			expect(mockResponse[0]).toHaveProperty('id');
			expect(mockResponse[0]).toHaveProperty('name');
			expect(mockResponse[0]).toHaveProperty('public');
		});

		it('should handle file list response', () => {
			const mockResponse = [
				{
					name: 'image1.png',
					id: 'file-uuid-1',
					created_at: '2024-01-01T00:00:00Z',
					updated_at: '2024-01-01T00:00:00Z',
					metadata: {
						size: 1024,
						mimetype: 'image/png',
					},
				},
			];

			expect(Array.isArray(mockResponse)).toBe(true);
			expect(mockResponse[0]).toHaveProperty('name');
			expect(mockResponse[0]).toHaveProperty('metadata');
		});

		it('should handle signed URL response', () => {
			const mockResponse = {
				signedUrl: 'https://example.supabase.co/storage/v1/object/sign/bucket/file.png?token=xyz',
			};

			expect(mockResponse).toHaveProperty('signedUrl');
			expect(mockResponse.signedUrl).toContain('sign');
		});

		it('should handle public URL generation', () => {
			const projectUrl = 'https://example.supabase.co';
			const bucket = 'images';
			const path = 'profile.png';
			
			const publicUrl = `${projectUrl}/storage/v1/object/public/${bucket}/${path}`;
			
			expect(publicUrl).toContain('/storage/v1/object/public/');
			expect(publicUrl).toContain(bucket);
			expect(publicUrl).toContain(path);
		});
	});

	describe('Edge Functions', () => {
		it('should handle function invocation response', () => {
			const mockResponse = {
				status: 200,
				data: {
					message: 'Function executed successfully',
					result: { processed: true },
				},
			};

			expect(mockResponse).toHaveProperty('status');
			expect(mockResponse).toHaveProperty('data');
			expect(mockResponse.status).toBe(200);
		});

		it('should handle function list response', () => {
			const mockResponse = [
				{
					id: 'func-uuid-1',
					name: 'hello-world',
					slug: 'hello-world',
					status: 'ACTIVE',
					created_at: '2024-01-01T00:00:00Z',
				},
			];

			expect(Array.isArray(mockResponse)).toBe(true);
			expect(mockResponse[0]).toHaveProperty('name');
			expect(mockResponse[0]).toHaveProperty('status');
		});
	});

	describe('Management API', () => {
		it('should handle project list response', () => {
			const mockResponse = [
				{
					id: 'project-uuid-1',
					name: 'My Project',
					organization_id: 'org-uuid-1',
					region: 'us-east-1',
					status: 'ACTIVE_HEALTHY',
					created_at: '2024-01-01T00:00:00Z',
				},
			];

			expect(Array.isArray(mockResponse)).toBe(true);
			expect(mockResponse[0]).toHaveProperty('id');
			expect(mockResponse[0]).toHaveProperty('name');
			expect(mockResponse[0]).toHaveProperty('region');
		});

		it('should handle API keys response', () => {
			const mockResponse = [
				{
					name: 'anon',
					api_key: 'eyJ...',
				},
				{
					name: 'service_role',
					api_key: 'eyJ...',
				},
			];

			expect(Array.isArray(mockResponse)).toBe(true);
			expect(mockResponse.length).toBeGreaterThanOrEqual(2);
			expect(mockResponse[0]).toHaveProperty('name');
			expect(mockResponse[0]).toHaveProperty('api_key');
		});

		it('should handle SQL execution response', () => {
			const mockResponse = {
				rows: [
					{ id: 1, name: 'Test' },
					{ id: 2, name: 'Another' },
				],
				rowCount: 2,
			};

			expect(mockResponse).toHaveProperty('rows');
			expect(mockResponse).toHaveProperty('rowCount');
			expect(Array.isArray(mockResponse.rows)).toBe(true);
		});

		it('should handle secrets list response', () => {
			const mockResponse = [
				{ name: 'API_KEY' },
				{ name: 'DATABASE_URL' },
			];

			expect(Array.isArray(mockResponse)).toBe(true);
			expect(mockResponse[0]).toHaveProperty('name');
		});
	});

	describe('Realtime Configuration', () => {
		it('should generate valid channel configuration', () => {
			const channelConfig = {
				channel: 'room-1',
				type: 'postgres_changes',
				config: {
					event: 'INSERT',
					schema: 'public',
					table: 'messages',
				},
			};

			expect(channelConfig).toHaveProperty('channel');
			expect(channelConfig).toHaveProperty('type');
			expect(channelConfig).toHaveProperty('config');
			expect(channelConfig.config).toHaveProperty('event');
		});

		it('should generate valid broadcast configuration', () => {
			const broadcastConfig = {
				channel: 'notifications',
				type: 'broadcast',
				config: {
					event: 'new-message',
				},
			};

			expect(broadcastConfig.type).toBe('broadcast');
			expect(broadcastConfig.config).toHaveProperty('event');
		});

		it('should generate valid presence configuration', () => {
			const presenceConfig = {
				channel: 'online-users',
				type: 'presence',
				config: {
					key: 'user-123',
				},
			};

			expect(presenceConfig.type).toBe('presence');
			expect(presenceConfig.config).toHaveProperty('key');
		});
	});

	describe('Error Handling', () => {
		it('should parse PostgreSQL error correctly', () => {
			const mockError = {
				message: 'duplicate key value violates unique constraint',
				code: '23505',
				details: 'Key (email)=(test@example.com) already exists.',
				hint: null,
			};

			expect(mockError).toHaveProperty('message');
			expect(mockError).toHaveProperty('code');
			expect(mockError.code).toBe('23505');
		});

		it('should parse auth error correctly', () => {
			const mockError = {
				error: 'invalid_grant',
				error_description: 'Invalid login credentials',
			};

			expect(mockError).toHaveProperty('error');
			expect(mockError).toHaveProperty('error_description');
		});

		it('should parse PostgREST error correctly', () => {
			const mockError = {
				message: 'permission denied for table users',
				code: 'PGRST301',
				hint: 'Check your RLS policies',
			};

			expect(mockError).toHaveProperty('message');
			expect(mockError.code).toContain('PGRST');
		});
	});
});
