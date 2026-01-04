/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { supabaseStorageRequest, supabaseStorageUpload, supabaseStorageDownload } from '../../transport';
import { getMimeType, parseJson } from '../../utils';

/**
 * List all buckets
 */
export async function listBuckets(
  this: IExecuteFunctions,
  _index: number,
): Promise<INodeExecutionData[]> {
  const response = await supabaseStorageRequest.call(this, '/bucket', 'GET');

  const buckets = Array.isArray(response) ? response : [response];
  return buckets.map((bucket: IDataObject) => ({ json: bucket }));
}

/**
 * Get bucket info
 */
export async function getBucket(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const bucketId = this.getNodeParameter('bucketId', index) as string;

  const response = await supabaseStorageRequest.call(this, `/bucket/${bucketId}`, 'GET');

  return [{ json: response }];
}

/**
 * Create new bucket
 */
export async function createBucket(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const bucketId = this.getNodeParameter('bucketId', index) as string;
  const options = this.getNodeParameter('options', index, {}) as IDataObject;

  const body: IDataObject = {
    id: bucketId,
    name: bucketId,
  };

  if (options.public !== undefined) {
    body.public = options.public;
  }

  if (options.fileSizeLimit) {
    body.file_size_limit = options.fileSizeLimit;
  }

  if (options.allowedMimeTypes) {
    body.allowed_mime_types = (options.allowedMimeTypes as string).split(',').map((t) => t.trim());
  }

  const response = await supabaseStorageRequest.call(this, '/bucket', 'POST', body as any);

  return [{ json: response }];
}

/**
 * Update bucket settings
 */
export async function updateBucket(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const bucketId = this.getNodeParameter('bucketId', index) as string;
  const options = this.getNodeParameter('options', index, {}) as IDataObject;

  const body: IDataObject = {};

  if (options.public !== undefined) {
    body.public = options.public;
  }

  if (options.fileSizeLimit !== undefined) {
    body.file_size_limit = options.fileSizeLimit;
  }

  if (options.allowedMimeTypes) {
    body.allowed_mime_types = (options.allowedMimeTypes as string).split(',').map((t) => t.trim());
  }

  const response = await supabaseStorageRequest.call(
    this,
    `/bucket/${bucketId}`,
    'PUT',
    body as any,
  );

  return [{ json: response }];
}

/**
 * Delete bucket
 */
export async function deleteBucket(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const bucketId = this.getNodeParameter('bucketId', index) as string;

  const response = await supabaseStorageRequest.call(this, `/bucket/${bucketId}`, 'DELETE');

  return [{ json: response || { success: true, bucketId } }];
}

/**
 * Empty bucket
 */
export async function emptyBucket(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const bucketId = this.getNodeParameter('bucketId', index) as string;

  const response = await supabaseStorageRequest.call(this, `/bucket/${bucketId}/empty`, 'POST');

  return [{ json: response || { success: true, bucketId } }];
}

/**
 * List files in bucket/folder
 */
export async function listFiles(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const bucketId = this.getNodeParameter('bucketId', index) as string;
  const prefix = this.getNodeParameter('prefix', index, '') as string;
  const limit = this.getNodeParameter('limit', index, 100) as number;
  const offset = this.getNodeParameter('offset', index, 0) as number;
  const sortBy = this.getNodeParameter('sortBy', index, {}) as IDataObject;

  const body: IDataObject = {
    prefix,
    limit,
    offset,
  };

  if (sortBy.column) {
    body.sortBy = {
      column: sortBy.column,
      order: sortBy.order || 'asc',
    };
  }

  const response = await supabaseStorageRequest.call(
    this,
    `/object/list/${bucketId}`,
    'POST',
    body as any,
  );

  const files = Array.isArray(response) ? response : [response];
  return files.map((file: IDataObject) => ({ json: file }));
}

/**
 * Upload file
 */
export async function uploadFile(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const bucketId = this.getNodeParameter('bucketId', index) as string;
  const filePath = this.getNodeParameter('filePath', index) as string;
  const binaryPropertyName = this.getNodeParameter('binaryPropertyName', index, 'data') as string;
  const options = this.getNodeParameter('options', index, {}) as IDataObject;

  const binaryData = this.helpers.assertBinaryData(index, binaryPropertyName);
  const fileBuffer = await this.helpers.getBinaryDataBuffer(index, binaryPropertyName);

  const contentType = binaryData.mimeType || getMimeType(binaryData.fileName || filePath);

  const response = await supabaseStorageUpload.call(
    this,
    bucketId,
    filePath,
    fileBuffer,
    contentType,
    {
      cacheControl: (options.cacheControl as string) || '3600',
      upsert: options.upsert === true,
    },
  );

  return [
    {
      json: {
        ...response,
        bucket: bucketId,
        path: filePath,
      },
    },
  ];
}

/**
 * Download file
 */
export async function downloadFile(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const bucketId = this.getNodeParameter('bucketId', index) as string;
  const filePath = this.getNodeParameter('filePath', index) as string;
  const binaryPropertyName = this.getNodeParameter('binaryPropertyName', index, 'data') as string;

  const fileBuffer = await supabaseStorageDownload.call(this, bucketId, filePath);

  const fileName = filePath.split('/').pop() || 'file';
  const mimeType = getMimeType(fileName);

  const binaryData = await this.helpers.prepareBinaryData(fileBuffer, fileName, mimeType);

  return [
    {
      json: {
        bucket: bucketId,
        path: filePath,
        fileName,
        mimeType,
        size: fileBuffer.length,
      },
      binary: {
        [binaryPropertyName]: binaryData,
      },
    },
  ];
}

/**
 * Get public URL for file
 */
export async function getPublicUrl(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const bucketId = this.getNodeParameter('bucketId', index) as string;
  const filePath = this.getNodeParameter('filePath', index) as string;
  const options = this.getNodeParameter('options', index, {}) as IDataObject;

  const credentials = await this.getCredentials('supabaseApi');
  const projectUrl = credentials.projectUrl as string;

  let publicUrl = `${projectUrl}/storage/v1/object/public/${bucketId}/${filePath}`;

  // Add transformation options
  const transformParams: string[] = [];
  if (options.width) transformParams.push(`width=${options.width}`);
  if (options.height) transformParams.push(`height=${options.height}`);
  if (options.quality) transformParams.push(`quality=${options.quality}`);
  if (options.format) transformParams.push(`format=${options.format}`);
  if (options.resize) transformParams.push(`resize=${options.resize}`);

  if (transformParams.length > 0) {
    publicUrl = `${projectUrl}/storage/v1/render/image/public/${bucketId}/${filePath}?${transformParams.join('&')}`;
  }

  return [
    {
      json: {
        publicUrl,
        bucket: bucketId,
        path: filePath,
      },
    },
  ];
}

/**
 * Create signed URL
 */
export async function createSignedUrl(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const bucketId = this.getNodeParameter('bucketId', index) as string;
  const filePath = this.getNodeParameter('filePath', index) as string;
  const expiresIn = this.getNodeParameter('expiresIn', index, 3600) as number;
  const options = this.getNodeParameter('options', index, {}) as IDataObject;

  const body: IDataObject = {
    expiresIn,
  };

  if (options.download) {
    body.download = options.download;
  }

  if (options.transform) {
    body.transform = parseJson(options.transform as string);
  }

  const response = await supabaseStorageRequest.call(
    this,
    `/object/sign/${bucketId}/${filePath}`,
    'POST',
    body as any,
  );

  const credentials = await this.getCredentials('supabaseApi');
  const projectUrl = credentials.projectUrl as string;

  return [
    {
      json: {
        signedUrl: `${projectUrl}/storage/v1${response.signedURL || response.signedUrl}`,
        path: filePath,
        expiresIn,
        token: response.token,
      },
    },
  ];
}

/**
 * Move/rename file
 */
export async function moveFile(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const bucketId = this.getNodeParameter('bucketId', index) as string;
  const fromPath = this.getNodeParameter('fromPath', index) as string;
  const toPath = this.getNodeParameter('toPath', index) as string;

  const response = await supabaseStorageRequest.call(this, `/object/move`, 'POST', {
    bucketId,
    sourceKey: fromPath,
    destinationKey: toPath,
  } as any);

  return [
    {
      json: {
        ...response,
        bucket: bucketId,
        fromPath,
        toPath,
      },
    },
  ];
}

/**
 * Copy file
 */
export async function copyFile(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const bucketId = this.getNodeParameter('bucketId', index) as string;
  const fromPath = this.getNodeParameter('fromPath', index) as string;
  const toPath = this.getNodeParameter('toPath', index) as string;

  const response = await supabaseStorageRequest.call(this, `/object/copy`, 'POST', {
    bucketId,
    sourceKey: fromPath,
    destinationKey: toPath,
  } as any);

  return [
    {
      json: {
        ...response,
        bucket: bucketId,
        fromPath,
        toPath,
      },
    },
  ];
}

/**
 * Delete files
 */
export async function deleteFiles(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const bucketId = this.getNodeParameter('bucketId', index) as string;
  const filePaths = this.getNodeParameter('filePaths', index) as string;

  const prefixes = filePaths.split(',').map((p) => p.trim());

  const response = await supabaseStorageRequest.call(this, `/object/${bucketId}`, 'DELETE', {
    prefixes,
  } as any);

  return [
    {
      json: {
        ...response,
        bucket: bucketId,
        deletedPaths: prefixes,
      },
    },
  ];
}

/**
 * Storage operations map
 */
export const storageOperations = {
  listBuckets,
  getBucket,
  createBucket,
  updateBucket,
  deleteBucket,
  emptyBucket,
  listFiles,
  uploadFile,
  downloadFile,
  getPublicUrl,
  createSignedUrl,
  moveFile,
  copyFile,
  deleteFiles,
};
