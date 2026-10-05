export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
  }

  // Parse body if stream or already parsed object
  let body = req.body;
  if (!body || typeof body === 'string') {
    try {
      body = typeof body === 'string' ? JSON.parse(body) : {};
    } catch {
      body = {};
    }
  }

  const { role, userId, password, remember } = body || {};

  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ ok: false, error: 'User ID is required.' }));
  }
  if (!password || typeof password !== 'string') {
    res.statusCode = 400;
    return res.end(JSON.stringify({ ok: false, error: 'Password is required.' }));
  }

  const cleanUserId = userId.trim().toUpperCase();

  // Authoritative Polar Demo Accounts
  const demoAccounts = [
    {
      id: 'RSC-0142',
      name: 'Dr. Elena Rostova',
      role: 'Scientist / Team Member',
      email: 'e.rostova@polar-expedition.org',
      expectedRole: 'researcher',
      defaultPass: 'polar2026',
      dashboardRoute: 'dashboard',
    },
    {
      id: 'AST-0101',
      name: 'Marcus Vance',
      role: 'Asset Management',
      email: 'm.vance@polar-expedition.org',
      expectedRole: 'asset',
      defaultPass: 'polar2026',
      dashboardRoute: 'assets',
    },
    {
      id: 'TRN-0301',
      name: 'Capt. Francois Mercier',
      role: 'Transportation',
      email: 'f.mercier@polar-expedition.org',
      expectedRole: 'transport',
      defaultPass: 'polar2026',
      dashboardRoute: 'transport',
    },
    {
      id: 'ADM-0001',
      name: 'Base Cmdr. Henrik Lindqvist',
      role: 'Super Admin',
      email: 'h.lindqvist@polar-expedition.org',
      expectedRole: 'admin',
      defaultPass: 'polar2026',
      dashboardRoute: 'dashboard',
    },
  ];

  const matched = demoAccounts.find(
    (acc) => acc.id === cleanUserId && (acc.defaultPass === password || password === 'polar2026')
  );

  if (matched) {
    const token = `polar-token-${Buffer.from(`${matched.id}:${Date.now()}`).toString('base64')}`;
    res.statusCode = 200;
    return res.end(
      JSON.stringify({
        ok: true,
        token,
        user: {
          id: matched.id,
          name: matched.name,
          role: matched.role,
          email: matched.email,
          active: true,
        },
        dashboardRoute: matched.dashboardRoute,
      })
    );
  }

  res.statusCode = 401;
  return res.end(
    JSON.stringify({
      ok: false,
      error: 'Authentication rejected. Verify your User ID and password (Demo: RSC-0142 / polar2026).',
    })
  );
}
