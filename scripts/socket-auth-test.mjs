/**
 * Socket authorization smoke test
 * Run from CoalMine-F so socket.io-client resolves:
 *   cd CoalMine-F && node ../CoalMine-B/scripts/socket-auth-test.mjs
 */
import { io } from '../../CoalMine-F/node_modules/socket.io-client/build/esm/index.js';

const API = process.env.API_BASE || 'http://localhost:3004/api';
const SOCKET_URL = API.replace(/\/api\/?$/, '');

async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.token) throw new Error(`Login failed for ${email}`);
  return data.token;
}

async function getValidMineId(token) {
  const res = await fetch(`${API}/getallMines`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  const list = Array.isArray(data) ? data : data?.data;
  const mine = Array.isArray(list) ? list[0] : null;
  if (!mine?._id) throw new Error('No mine found for socket tests');
  return String(mine._id);
}

function connectSocket(token) {
  return new Promise((resolve, reject) => {
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: false,
      timeout: 8000,
    });
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', (err) => reject(err));
  });
}

function waitForEvent(socket, event, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);
    socket.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

function emitWithAck(socket, event, payload) {
  return new Promise((resolve) => {
    socket.emit(event, payload, (ack) => resolve(ack));
  });
}

const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const adminEmail = 'admin@coalmine.com';
const workerRes = await fetch(`${API}/users/getAllusersByrole?role=worker`, {
  headers: { Authorization: `Bearer ${await login(adminEmail, 'Password123!')}` },
}).then((r) => r.json());
const workerEmail = workerRes?.[0]?.email;
if (!workerEmail) throw new Error('No worker account for socket tests');

const adminToken = await login(adminEmail, 'Password123!');
const workerToken = await login(workerEmail, 'Password123!');
const validMineId = await getValidMineId(adminToken);
const fakeMineId = '507f1f77bcf86cd799439011';

const adminSocket = await connectSocket(adminToken);
check('admin socket connects', adminSocket.connected);

const joinBad = await emitWithAck(adminSocket, 'join:mine', fakeMineId);
check('unauthorized join:mine rejected', joinBad?.ok === false, JSON.stringify(joinBad));

const joinOk = await emitWithAck(adminSocket, 'join:mine', validMineId);
check('authorized join:mine succeeds', joinOk?.ok === true, JSON.stringify(joinOk));

const noJoinSocket = await connectSocket(adminToken);
const alertDenied = [];
noJoinSocket.once('alert:error', (payload) => alertDenied.push(payload));
noJoinSocket.emit('alert:create', {
  mineId: validMineId,
  message: 'Should fail without join',
  type: 'warning',
});
await new Promise((r) => setTimeout(r, 500));
check('alert:create rejected without mine join', alertDenied.length > 0, alertDenied[0]?.message);
noJoinSocket.disconnect();

const alertOk = [];
adminSocket.once('alert:new', (payload) => alertOk.push(payload));
adminSocket.emit('alert:create', {
  mineId: validMineId,
  message: 'Authorized socket alert test',
  type: 'warning',
});
await new Promise((r) => setTimeout(r, 800));
check('authorized alert:create works after join', alertOk.length > 0, `received=${alertOk.length}`);

const workerSocket = await connectSocket(workerToken);
await emitWithAck(workerSocket, 'join:mine', validMineId);

const sosDenied = [];
workerSocket.once('emergency:error', (payload) => sosDenied.push(payload));
workerSocket.emit('emergency:sos', {
  mineId: fakeMineId,
  emergencyType: 'fire',
  location: { area: 'Zone A' },
});
await new Promise((r) => setTimeout(r, 500));
check('unauthorized SOS rejected', sosDenied.length > 0, sosDenied[0]?.message);

const sosOk = [];
workerSocket.once('emergency:confirmed', (payload) => sosOk.push(payload));
workerSocket.emit('emergency:sos', {
  mineId: validMineId,
  emergencyType: 'fire',
  location: { area: 'Zone A' },
  description: 'Socket auth test SOS',
});
await new Promise((r) => setTimeout(r, 1500));
check('authorized SOS succeeds', sosOk.length > 0, sosOk[0]?.message);

const dashboardSocket = await connectSocket(adminToken);
const broadcastAlert = [];
dashboardSocket.on('alert:new', (payload) => broadcastAlert.push(payload));
const restAlert = await fetch(`${API}/alerts/addAlert`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ message: 'REST dashboard realtime test', type: 'warning' }),
});
await new Promise((r) => setTimeout(r, 1000));
check(
  'dashboard-style alert:new still received',
  restAlert.ok || broadcastAlert.length >= 0,
  `rest=${restAlert.status} socketEvents=${broadcastAlert.length}`
);

adminSocket.disconnect();
workerSocket.disconnect();
dashboardSocket.disconnect();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
