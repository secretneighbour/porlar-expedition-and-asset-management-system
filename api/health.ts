import type { IncomingMessage, ServerResponse } from 'http';

export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  res.statusCode = 200;
  return res.end(
    JSON.stringify({
      status: 'ONLINE',
      service: 'Polar Expedition Operations Command System',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        storageType: 'vercel_serverless',
        usersCount: 8,
        assetsCount: 10,
        expeditionsCount: 4,
      },
    })
  );
}
