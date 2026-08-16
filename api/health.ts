import { setCorsHeaders } from './_lib/auth.ts';

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.status(200).json({
    status: 'ok',
    store: '🚀 Mabs Store ⚡',
    environment: process.env.VERCEL ? 'vercel-serverless' : 'node',
    time: new Date().toISOString(),
  });
}
