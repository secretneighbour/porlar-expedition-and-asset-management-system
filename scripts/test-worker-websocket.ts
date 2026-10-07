import { WebSocket } from 'ws';

async function testWebSocket() {
  return new Promise<void>((resolve, reject) => {
    const ws = new WebSocket('ws://127.0.0.1:8787/ws');
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error('WebSocket connection timed out'));
    }, 5000);

    ws.on('open', () => {
      console.log('✅ WebSocket connected successfully to ws://127.0.0.1:8787/ws');
      ws.send(JSON.stringify({ type: 'HEARTBEAT' }));
    });

    ws.on('message', (data) => {
      console.log('✅ Received WebSocket message:', data.toString());
      clearTimeout(timer);
      ws.close();
      resolve();
    });

    ws.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

testWebSocket()
  .then(() => {
    console.log('🎉 WebSocket Test Passed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ WebSocket Test Failed:', err);
    process.exit(1);
  });
