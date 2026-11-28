import { server, app, io } from '../server/index.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'medisync_enterprise_jwt_secret_2026';
let currentPort = null;
let serverInstance = null;

export async function startTestServer() {
  if (server.listening) {
    server.unref();
    const addr = server.address();
    const port = typeof addr === 'object' && addr !== null ? addr.port : 5000;
    return `http://127.0.0.1:${port}`;
  }

  return new Promise((resolve, reject) => {
    // Listen on dynamic port 0
    server.listen(0, '127.0.0.1', () => {
      server.unref();
      const port = server.address().port;
      resolve(`http://127.0.0.1:${port}`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        server.listen(0, '127.0.0.1', () => {
          server.unref();
          const port = server.address().port;
          resolve(`http://127.0.0.1:${port}`);
        });
      } else {
        reject(err);
      }
    });
  });
}

export async function stopTestServer() {
  // Graceful no-op when shared across test files
  return Promise.resolve();
}

export function generateToken(payload = {}) {
  const defaultPayload = {
    id: 'usr_admin_test',
    email: 'admin.qa@medisync.gov.in',
    name: 'QA Admin User',
    role: 'admin',
    hospitalId: 'hosp-chn-01'
  };
  const merged = { ...defaultPayload, ...payload };
  const signOptions = merged.exp ? {} : { expiresIn: '2h' };
  return jwt.sign(merged, JWT_SECRET, signOptions);
}

export async function apiRequest(baseUrl, path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return {
    status: response.status,
    headers: response.headers,
    data
  };
}
