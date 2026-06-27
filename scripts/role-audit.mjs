/**
 * Role audit — login + API access for every seeded role.
 * Run: node scripts/role-audit.mjs
 */
import dotenv from 'dotenv';
dotenv.config();

const BASE = process.env.API_BASE || 'http://localhost:3000/api';
const PASSWORD = 'Password123!';

const ROLES = [
  { email: 'admin@coalmine.com', role: 'Super admin', tier: 'admin' },
  { email: 'mineadmin@coalmine.com', role: 'Mine admin', tier: 'admin' },
  { email: 'safety@coalmine.com', role: 'Safety Manager', tier: 'manager' },
  { email: 'shift@coalmine.com', role: 'Shift Incharge', tier: 'manager' },
  { email: 'inspector@coalmine.com', role: 'Inspector', tier: 'manager' },
  { email: 'worker1@coalmine.com', role: 'worker', tier: 'worker' },
];

/** [method, path, expectByTier: { worker, manager, admin }] */
const ENDPOINTS = [
  ['GET', '/auth/me', { worker: 200, manager: 200, admin: 200 }],
  ['GET', '/dashboard/summary', { worker: 200, manager: 200, admin: 200 }],
  ['GET', '/getAllLogs?limit=5&page=1', { worker: 200, manager: 200, admin: 200 }],
  ['GET', '/trainings?isActive=true', { worker: 200, manager: 200, admin: 200 }],
  ['GET', '/compliance-center', { worker: 200, manager: 200, admin: 200 }],
  ['GET', '/emergencies/active', { worker: 200, manager: 200, admin: 200 }],
  ['GET', '/work-permits', { worker: 200, manager: 200, admin: 200 }],
  ['GET', '/hazard-zones', { worker: 200, manager: 200, admin: 200 }],
  ['GET', '/mines/getAllMines', { worker: 200, manager: 200, admin: 200 }],
  ['GET', '/getAudit', { worker: 403, manager: 403, admin: 200 }],
  ['GET', '/users/getAllusers', { worker: 403, manager: 403, admin: 200 }],
  ['GET', '/getAllRes', { worker: 403, manager: 200, admin: 200 }],
  ['GET', '/leaderboard?limit=5', { worker: 200, manager: 200, admin: 200 }],
  ['GET', '/alerts/getallalerts?limit=5', { worker: 200, manager: 200, admin: 200 }],
  ['GET', '/near-miss', { worker: 200, manager: 200, admin: 200 }],
  ['GET', '/contractors', { worker: 200, manager: 200, admin: 200 }],
];

async function request(method, path, token, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.status;
}

async function login(email) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.token;
}

async function main() {
  console.log(`\n🔐 Role audit — ${BASE}\n`);

  try {
    const health = await fetch(`${BASE.replace(/\/api$/, '')}/api/health`);
    if (!health.ok) throw new Error('health check failed');
  } catch {
    console.error('❌ Backend not running on port 3000. Start: cd CoalMine-B && npm run dev\n');
    process.exit(1);
  }

  const failures = [];
  const passes = [];

  for (const account of ROLES) {
    console.log(`\n── ${account.role} (${account.email}) ──`);
    const token = await login(account.email);
    if (!token) {
      failures.push({ role: account.role, test: 'login', detail: 'Login failed' });
      console.log('  FAIL login');
      continue;
    }
    console.log('  OK login');

    const meRes = await fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = await meRes.json();
    const perms = me.permissions?.length ?? me.user?.permissions?.length ?? 0;
    console.log(`  OK /auth/me — role=${me.role || me.user?.role}, permissions=${perms}`);

    for (const [method, path, expected] of ENDPOINTS) {
      const want = expected[account.tier];
      let status;
      try {
        status = await request(method, path, token);
      } catch (e) {
        status = 0;
      }
      const ok = status === want || (want === 200 && status >= 200 && status < 300);
      const label = `${method} ${path.split('?')[0]}`;
      if (ok) {
        passes.push({ role: account.role, test: label });
        console.log(`  OK ${label} → ${status}`);
      } else {
        failures.push({ role: account.role, test: label, detail: `expected ${want}, got ${status}` });
        console.log(`  FAIL ${label} → ${status} (expected ${want})`);
      }
    }
  }

  console.log('\n══════════════════════════════════════');
  console.log(`Passed: ${passes.length}  Failed: ${failures.length}`);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log(`  • [${f.role}] ${f.test}: ${f.detail}`));
    process.exit(1);
  }
  console.log('\n✅ All roles passed API audit\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
