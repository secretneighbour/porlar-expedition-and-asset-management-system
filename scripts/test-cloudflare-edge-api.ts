import { onRequest } from '../functions/api/[[catchall]]';

async function runTests() {
  console.log('--- TEST 1: GET /api/health ---');
  const reqHealth = new Request('https://polar-expedition.pages.dev/api/health', {
    method: 'GET',
    headers: { Origin: 'https://polar-expedition.pages.dev' },
  });
  const resHealth = await onRequest({ request: reqHealth, env: {} });
  console.log(`Status: ${resHealth.status}, Content-Type: ${resHealth.headers.get('content-type')}`);
  const jsonHealth = await resHealth.json();
  console.log('Health JSON:', JSON.stringify(jsonHealth));
  if (resHealth.status !== 200 || jsonHealth.status !== 'ok') {
    throw new Error('Health check failed');
  }

  console.log('\n--- TEST 2: POST /api/auth/login (VALID CREDENTIALS) ---');
  const reqLoginValid = new Request('https://polar-expedition.pages.dev/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://polar-expedition.pages.dev',
    },
    body: JSON.stringify({
      userId: 'RSC-0142',
      password: 'polar2026',
      role: 'researcher',
      remember: true,
    }),
  });
  const resLoginValid = await onRequest({ request: reqLoginValid, env: {} });
  console.log(`Status: ${resLoginValid.status}, Content-Type: ${resLoginValid.headers.get('content-type')}`);
  const jsonLoginValid = await resLoginValid.json();
  console.log('Login Valid JSON:', JSON.stringify(jsonLoginValid));
  if (resLoginValid.status !== 200 || !jsonLoginValid.success || !jsonLoginValid.token) {
    throw new Error('Valid login failed');
  }

  console.log('\n--- TEST 3: POST /api/auth/login (INVALID CREDENTIALS) ---');
  const reqLoginInvalid = new Request('https://polar-expedition.pages.dev/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://polar-expedition.pages.dev',
    },
    body: JSON.stringify({
      userId: 'RSC-0142',
      password: 'wrongpassword',
      role: 'researcher',
    }),
  });
  const resLoginInvalid = await onRequest({ request: reqLoginInvalid, env: {} });
  console.log(`Status: ${resLoginInvalid.status}, Content-Type: ${resLoginInvalid.headers.get('content-type')}`);
  const jsonLoginInvalid = await resLoginInvalid.json();
  console.log('Login Invalid JSON:', JSON.stringify(jsonLoginInvalid));
  if (resLoginInvalid.status !== 401 || jsonLoginInvalid.error?.code !== 'INVALID_CREDENTIALS') {
    throw new Error('Invalid login check failed');
  }

  console.log('\n--- TEST 4: POST /api/auth/login (ROLE MISMATCH) ---');
  const reqRoleMismatch = new Request('https://polar-expedition.pages.dev/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://polar-expedition.pages.dev',
    },
    body: JSON.stringify({
      userId: 'RSC-0142', // Researcher, not Asset Manager
      password: 'polar2026',
      role: 'asset',
    }),
  });
  const resRoleMismatch = await onRequest({ request: reqRoleMismatch, env: {} });
  console.log(`Status: ${resRoleMismatch.status}, Content-Type: ${resRoleMismatch.headers.get('content-type')}`);
  const jsonRoleMismatch = await resRoleMismatch.json();
  console.log('Role Mismatch JSON:', JSON.stringify(jsonRoleMismatch));
  if (resRoleMismatch.status !== 403 || jsonRoleMismatch.error?.code !== 'ROLE_MISMATCH') {
    throw new Error('Role mismatch check failed');
  }

  console.log('\n--- TEST 5: GET /api/heartbeat ---');
  const reqHeartbeat = new Request('https://polar-expedition.pages.dev/api/heartbeat', {
    method: 'GET',
    headers: { Origin: 'https://polar-expedition.pages.dev' },
  });
  const resHeartbeat = await onRequest({ request: reqHeartbeat, env: {} });
  const jsonHeartbeat = await resHeartbeat.json();
  console.log(`Status: ${resHeartbeat.status}, JSON:`, JSON.stringify(jsonHeartbeat));
  if (resHeartbeat.status !== 200 || !jsonHeartbeat.ok) {
    throw new Error('Heartbeat failed');
  }

  console.log('\n--- TEST 6: GET /api/unknown-endpoint (404 JSON, NEVER HTML) ---');
  const reqUnknown = new Request('https://polar-expedition.pages.dev/api/unknown-endpoint', {
    method: 'GET',
    headers: { Origin: 'https://polar-expedition.pages.dev' },
  });
  const resUnknown = await onRequest({ request: reqUnknown, env: {} });
  const contentType = resUnknown.headers.get('content-type') || '';
  const jsonUnknown = await resUnknown.json();
  console.log(`Status: ${resUnknown.status}, Content-Type: ${contentType}, JSON:`, JSON.stringify(jsonUnknown));
  if (resUnknown.status !== 404 || !contentType.includes('application/json')) {
    throw new Error('404 JSON check failed');
  }

  console.log('\nALL 6 CLOUDFLARE EDGE API TESTS PASSED WITH 100% SUCCESS!');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
