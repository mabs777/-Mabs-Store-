import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { parseRequestBody, sendJsonResponse, handleOptions, requireAdminAuth } from './_lib/auth.ts';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    sendJsonResponse(res, 405, { success: false, error: 'Method Not Allowed' });
    return;
  }

  // Verify Admin Authentication before issuing client upload token
  if (!requireAdminAuth(req, res)) return;

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    console.error('[Blob Upload Error]: BLOB_READ_WRITE_TOKEN environment variable is not configured.');
    sendJsonResponse(res, 500, {
      success: false,
      error: 'Vercel Blob storage is not configured. Please set the BLOB_READ_WRITE_TOKEN environment variable in Vercel.',
    });
    return;
  }

  try {
    const body = (await parseRequestBody(req)) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request: req,
      token: blobToken,
      onBeforeGenerateToken: async (pathname) => {
        // Validate file type & extension
        const lower = pathname.toLowerCase();
        const isApk = lower.endsWith('.apk');
        const isImage = lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp') || lower.endsWith('.svg') || lower.endsWith('.gif');

        if (!isApk && !isImage) {
          throw new Error('Only APK files and image files (PNG, JPG, WEBP, SVG, GIF) are allowed.');
        }

        return {
          allowedContentTypes: [
            'application/vnd.android.package-archive',
            'application/octet-stream',
            'application/x-zip-compressed',
            'application/zip',
            'image/png',
            'image/jpeg',
            'image/webp',
            'image/svg+xml',
            'image/gif',
          ],
          maximumSizeInBytes: isApk ? 500 * 1024 * 1024 : 10 * 1024 * 1024, // 500MB for APKs, 10MB for images
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log(`[Blob Upload Complete]: ${blob.pathname} -> ${blob.url}`);
      },
    });

    sendJsonResponse(res, 200, jsonResponse);
  } catch (err: any) {
    console.error('[Blob Upload Handler Error]:', err?.stack || err?.message || err);
    sendJsonResponse(res, 400, {
      success: false,
      error: err?.message || 'Failed to generate Vercel Blob client upload token.',
    });
  }
}
