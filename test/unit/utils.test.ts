/**
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1 (BSL 1.1)
 * See LICENSE file for details
 */

import {
	buildPostgRESTQuery,
	parseFilters,
	buildSelectColumns,
	buildOrderBy,
	parseJson,
	normalizeUrl,
	getMimeType,
} from '../../nodes/Supabase/utils';
import type { PostgRESTFilter } from '../../nodes/Supabase/constants';

describe('Supabase Utils', () => {
	describe('buildPostgRESTQuery', () => {
		it('should build simple equality filter', () => {
			const filters: PostgRESTFilter[] = [
				{ column: 'name', operator: 'eq', value: 'John' },
			];
			const query = buildPostgRESTQuery(filters);
			expect(query).toBe('name=eq.John');
		});

		it('should build multiple filters', () => {
			const filters: PostgRESTFilter[] = [
				{ column: 'status', operator: 'eq', value: 'active' },
				{ column: 'age', operator: 'gte', value: '18' },
			];
			const query = buildPostgRESTQuery(filters);
			expect(query).toBe('status=eq.active&age=gte.18');
		});

		it('should handle IN operator with array', () => {
			const filters: PostgRESTFilter[] = [
				{ column: 'id', operator: 'in', value: '1,2,3' },
			];
			const query = buildPostgRESTQuery(filters);
			expect(query).toBe('id=in.(1,2,3)');
		});

		it('should handle IS operator for null checks', () => {
			const filters: PostgRESTFilter[] = [
				{ column: 'deleted_at', operator: 'is', value: 'null' },
			];
			const query = buildPostgRESTQuery(filters);
			expect(query).toBe('deleted_at=is.null');
		});

		it('should handle LIKE operator', () => {
			const filters: PostgRESTFilter[] = [
				{ column: 'email', operator: 'like', value: '%@gmail.com' },
			];
			const query = buildPostgRESTQuery(filters);
			expect(query).toBe('email=like.%@gmail.com');
		});

		it('should return empty string for empty filters', () => {
			const query = buildPostgRESTQuery([]);
			expect(query).toBe('');
		});

		it('should handle neq operator', () => {
			const filters: PostgRESTFilter[] = [
				{ column: 'status', operator: 'neq', value: 'deleted' },
			];
			const query = buildPostgRESTQuery(filters);
			expect(query).toBe('status=neq.deleted');
		});

		it('should handle gt and lt operators', () => {
			const filters: PostgRESTFilter[] = [
				{ column: 'age', operator: 'gt', value: '18' },
				{ column: 'age', operator: 'lt', value: '65' },
			];
			const query = buildPostgRESTQuery(filters);
			expect(query).toBe('age=gt.18&age=lt.65');
		});

		it('should handle ilike operator (case-insensitive)', () => {
			const filters: PostgRESTFilter[] = [
				{ column: 'name', operator: 'ilike', value: '%john%' },
			];
			const query = buildPostgRESTQuery(filters);
			expect(query).toBe('name=ilike.%john%');
		});
	});

	describe('parseFilters', () => {
		it('should parse filter objects from n8n UI input', () => {
			const input = {
				filters: {
					filter: [
						{ column: 'name', operator: 'eq', value: 'Test' },
					],
				},
			};
			const result = parseFilters(input);
			expect(result).toEqual([
				{ column: 'name', operator: 'eq', value: 'Test' },
			]);
		});

		it('should handle empty input', () => {
			const result = parseFilters({});
			expect(result).toEqual([]);
		});

		it('should handle input without filters property', () => {
			const result = parseFilters({ other: 'value' });
			expect(result).toEqual([]);
		});

		it('should parse multiple filters', () => {
			const input = {
				filters: {
					filter: [
						{ column: 'status', operator: 'eq', value: 'active' },
						{ column: 'created_at', operator: 'gte', value: '2024-01-01' },
					],
				},
			};
			const result = parseFilters(input);
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({ column: 'status', operator: 'eq', value: 'active' });
			expect(result[1]).toEqual({ column: 'created_at', operator: 'gte', value: '2024-01-01' });
		});

		it('should skip filters without column or operator', () => {
			const input = {
				filters: {
					filter: [
						{ column: 'name', operator: 'eq', value: 'Test' },
						{ value: 'incomplete' },
						{ column: 'status' },
					],
				},
			};
			const result = parseFilters(input);
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({ column: 'name', operator: 'eq', value: 'Test' });
		});
	});

	describe('buildSelectColumns', () => {
		it('should build column selection string from array', () => {
			const columns = ['id', 'name', 'email'];
			const result = buildSelectColumns(columns);
			expect(result).toBe('id,name,email');
		});

		it('should handle single column in array', () => {
			const columns = ['id'];
			const result = buildSelectColumns(columns);
			expect(result).toBe('id');
		});

		it('should return * for empty array', () => {
			const result = buildSelectColumns([]);
			expect(result).toBe('*');
		});

		it('should handle string input', () => {
			const result = buildSelectColumns('id,name,email');
			expect(result).toBe('id,name,email');
		});

		it('should return * for empty string', () => {
			const result = buildSelectColumns('   ');
			expect(result).toBe('*');
		});

		it('should filter empty strings from array', () => {
			const columns = ['id', '', 'name', ''];
			const result = buildSelectColumns(columns);
			expect(result).toBe('id,name');
		});
	});

	describe('buildOrderBy', () => {
		it('should build ascending order', () => {
			const orderBy = [{ column: 'created_at', direction: 'asc' }];
			const result = buildOrderBy(orderBy);
			expect(result).toBe('created_at.asc');
		});

		it('should build descending order', () => {
			const orderBy = [{ column: 'updated_at', direction: 'desc' }];
			const result = buildOrderBy(orderBy);
			expect(result).toBe('updated_at.desc');
		});

		it('should handle nullsFirst option', () => {
			const orderBy = [{ column: 'name', direction: 'asc', nullsFirst: true }];
			const result = buildOrderBy(orderBy);
			expect(result).toBe('name.asc.nullsfirst');
		});

		it('should handle multiple order columns', () => {
			const orderBy = [
				{ column: 'status', direction: 'asc' },
				{ column: 'created_at', direction: 'desc' },
			];
			const result = buildOrderBy(orderBy);
			expect(result).toBe('status.asc,created_at.desc');
		});

		it('should return empty string for empty array', () => {
			const result = buildOrderBy([]);
			expect(result).toBe('');
		});

		it('should default to ascending when no direction specified', () => {
			const orderBy = [{ column: 'name' }];
			const result = buildOrderBy(orderBy);
			expect(result).toBe('name.asc');
		});
	});

	describe('parseJson', () => {
		it('should parse valid JSON string', () => {
			const result = parseJson('{"key": "value"}');
			expect(result).toEqual({ key: 'value' });
		});

		it('should return default value for invalid JSON', () => {
			const result = parseJson('invalid json', { default: true });
			expect(result).toEqual({ default: true });
		});

		it('should return empty object for invalid JSON without default', () => {
			const result = parseJson('invalid json');
			expect(result).toEqual({});
		});

		it('should return fallback for empty string', () => {
			const result = parseJson('', { empty: true });
			expect(result).toEqual({ empty: true });
		});

		it('should parse array JSON', () => {
			const result = parseJson('[1, 2, 3]');
			expect(result).toEqual([1, 2, 3]);
		});

		it('should parse nested JSON', () => {
			const result = parseJson('{"user": {"name": "John", "age": 30}}');
			expect(result).toEqual({ user: { name: 'John', age: 30 } });
		});
	});

	describe('normalizeUrl', () => {
		it('should remove trailing slash', () => {
			const result = normalizeUrl('https://example.supabase.co/');
			expect(result).toBe('https://example.supabase.co');
		});

		it('should remove multiple trailing slashes', () => {
			const result = normalizeUrl('https://example.supabase.co///');
			expect(result).toBe('https://example.supabase.co');
		});

		it('should keep URL without trailing slash', () => {
			const result = normalizeUrl('https://example.supabase.co');
			expect(result).toBe('https://example.supabase.co');
		});

		it('should handle empty string', () => {
			const result = normalizeUrl('');
			expect(result).toBe('');
		});

		it('should preserve path without trailing slash', () => {
			const result = normalizeUrl('https://example.supabase.co/api/v1');
			expect(result).toBe('https://example.supabase.co/api/v1');
		});

		it('should remove trailing slash from path', () => {
			const result = normalizeUrl('https://example.supabase.co/api/v1/');
			expect(result).toBe('https://example.supabase.co/api/v1');
		});
	});

	describe('getMimeType', () => {
		it('should return correct MIME type for common extensions', () => {
			expect(getMimeType('image.png')).toBe('image/png');
			expect(getMimeType('document.pdf')).toBe('application/pdf');
			expect(getMimeType('data.json')).toBe('application/json');
			expect(getMimeType('page.html')).toBe('text/html');
			expect(getMimeType('style.css')).toBe('text/css');
			expect(getMimeType('script.js')).toBe('application/javascript');
		});

		it('should return correct MIME type for image formats', () => {
			expect(getMimeType('photo.jpg')).toBe('image/jpeg');
			expect(getMimeType('photo.jpeg')).toBe('image/jpeg');
			expect(getMimeType('animation.gif')).toBe('image/gif');
			expect(getMimeType('icon.svg')).toBe('image/svg+xml');
			expect(getMimeType('photo.webp')).toBe('image/webp');
		});

		it('should return octet-stream for unknown extensions', () => {
			expect(getMimeType('file.xyz')).toBe('application/octet-stream');
			expect(getMimeType('file.unknown')).toBe('application/octet-stream');
		});

		it('should handle files without extension', () => {
			expect(getMimeType('README')).toBe('application/octet-stream');
			expect(getMimeType('Dockerfile')).toBe('application/octet-stream');
		});

		it('should be case-insensitive', () => {
			expect(getMimeType('IMAGE.PNG')).toBe('image/png');
			expect(getMimeType('Document.PDF')).toBe('application/pdf');
			expect(getMimeType('Data.JSON')).toBe('application/json');
		});

		it('should handle files with multiple dots', () => {
			expect(getMimeType('file.name.with.dots.png')).toBe('image/png');
			expect(getMimeType('archive.tar.gz')).toBe('application/gzip');
		});

		it('should return correct MIME for text files', () => {
			expect(getMimeType('readme.txt')).toBe('text/plain');
			expect(getMimeType('file.csv')).toBe('text/csv');
			expect(getMimeType('file.xml')).toBe('application/xml');
		});

		it('should return correct MIME for archive files', () => {
			expect(getMimeType('archive.zip')).toBe('application/zip');
		});
	});
});
