import { sendJsonResponse, handleOptions } from './_lib/auth.ts';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;

  sendJsonResponse(res, 200, {
    status: 'ok',
    store: '🚀 Mabs Store ⚡',
    environment: process.env.VERCEL ? 'vercel-serverless' : 'node',
    time: new Date().toISOString(),
  });
}
