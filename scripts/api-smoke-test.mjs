/**
 * Quick API smoke test — run: node scripts/api-smoke-test.mjs
 * Requires MongoDB + server on PORT (default 3000).
 */
import dotenv from 'dotenv';
dotenv.config();

const BASE = process.env.API_BASE || 'http://localhost:3000/api';

async function request(method, path, { token, body, formData } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !formData) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: formData ? body : body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, ok: res.ok, data };
}

const results = [];

function record(name, { status, ok }) {
  const pass = ok || status === 304;
  results.push({ name, status, pass });
  const icon = pass ? 'OK' : 'FAIL';
  console.log(`${icon} ${name} → ${status}`);
}

async function main() {
  console.log(`Testing ${BASE}\n`);

  const healthRes = await fetch(`${BASE.replace(/\/api$/, '')}/api/health`);
  record('health', { status: healthRes.status, ok: healthRes.ok });

  const login = await request('POST', '/auth/login', {
    body: { email: 'admin@coalmine.com', password: 'Password123!' },
  });
  record('auth login', login);
  if (!login.ok) {
    console.error('\nLogin failed — start server and ensure seed admin exists.');
    process.exit(1);
  }
  const token = login.data.token;
  const today = new Date().toISOString().split('T')[0];

  const authed = [
    ['GET', '/auth/me'],
    ['GET', '/auth/signup-roles'],
    ['GET', '/attendance?role=worker&date=' + today],
    ['GET', '/getAllSafety'],
    ['GET', '/getAllRes'],
    ['GET', '/getallMines'],
    ['GET', '/getAllLogs?limit=5&page=1'],
    ['GET', '/getReports'],
    ['GET', '/getAllReports'],
    ['GET', '/getAudit'],
    ['GET', '/alerts/getallalerts?limit=5&page=1'],
    ['GET', '/getallTask'],
    ['GET', '/trainings'],
    ['GET', '/leaderboard?limit=5'],
    ['GET', '/emergencies/active'],
    ['GET', '/getAchieve'],
    ['GET', '/dashboard/summary'],
    ['GET', '/prod/getData?limit=5&page=1'],
    ['GET', '/users/getAllusers'],
  ];

  for (const [method, path] of authed) {
    const r = await request(method, path, { token });
    record(`${method} ${path.split('?')[0]}`, r);
  }

  // Critical mutations (non-destructive where possible)
  const workers = await request('GET', `/attendance?role=worker&date=${today}`, { token });
  if (workers.ok && Array.isArray(workers.data) && workers.data[0]) {
    const uid = String(workers.data[0]._id);
    record(
      'PUT /attendance',
      await request('PUT', '/attendance', {
        token,
        body: { userId: uid, date: today, status: 'Present' },
      })
    );
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log('Failed:', failed.map((f) => f.name).join(', '));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
