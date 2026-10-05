export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  return res.end(
    JSON.stringify({
      ok: true,
      timestamp: new Date().toISOString(),
      status: 'received',
    })
  );
}
