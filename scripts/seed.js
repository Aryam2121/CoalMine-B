/**
 * Bulk seed — ~2000+ realistic coal-mine records
 *
 *   node scripts/seed.js              # skip if users exist
 *   node scripts/seed.js --fresh      # wipe + seed
 *   node scripts/seed.js --fresh --count=3000
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import User from '../models/User.js';
import Mine from '../models/Mine.js';
import CoalMine from '../models/coalMineModel.js';
import Location from '../models/locationModel.js';
import Alert from '../models/Alert.js';
import Maintenance from '../models/Maintenance.js';
import Resource from '../models/Resource.js';
import Productivity from '../models/Productivity.js';
import ShiftLog from '../models/ShiftLog.js';
import SafetyPlan from '../models/SafetyPlanModel.js';
import CompilanceReport from '../models/CompilanceModel.js';
import SafetyReport from '../models/SafetyReport.js';
import AuditLog from '../models/Audit.js';
import Achievement from '../models/Achievement.js';
import Attendance from '../models/Attendance.js';
import WorkPermit from '../models/WorkPermit.js';
import Equipment from '../models/Equipment.js';
import HazardZone from '../models/HazardZone.js';
import ContractorVisitor from '../models/ContractorVisitor.js';
import NearMissReport from '../models/NearMissReport.js';
import SafetyDrill from '../models/SafetyDrill.js';
import ChatMessage from '../models/ChatMessage.js';

const FRESH = process.argv.includes('--fresh');
const PASSWORD = 'Password123!';

const countArg = process.argv.find((a) => a.startsWith('--count='));
const TARGET_TOTAL = countArg ? parseInt(countArg.split('=')[1], 10) : 2000;

const MINE_SITES = [
  { name: 'Jharia Coalfield', lat: 23.7519, lng: 86.4207, location: 'Dhanbad, Jharkhand' },
  { name: 'Singrauli Basin', lat: 24.1991, lng: 82.6745, location: 'Singrauli, MP' },
  { name: 'Talcher Coalfield', lat: 20.9487, lng: 85.2315, location: 'Angul, Odisha' },
  { name: 'Raniganj Coalfield', lat: 23.6167, lng: 87.0833, location: 'Bardhaman, West Bengal' },
  { name: 'Korba Gevra Mine', lat: 22.3595, lng: 82.7501, location: 'Korba, Chhattisgarh' },
  { name: 'Bokaro Steel City Mine', lat: 23.6693, lng: 86.1511, location: 'Bokaro, Jharkhand' },
  { name: 'Wardha Valley', lat: 20.7453, lng: 78.6022, location: 'Chandrapur, Maharashtra' },
  { name: 'Mahanadi Coalfields', lat: 21.8829, lng: 84.0325, location: 'Sambalpur, Odisha' },
  { name: 'North Karanpura', lat: 23.85, lng: 85.45, location: 'Hazaribagh, Jharkhand' },
  { name: 'Ib Valley', lat: 21.95, lng: 83.92, location: 'Jharsuguda, Odisha' },
];

const FIRST_NAMES = ['Rajesh', 'Priya', 'Amit', 'Suresh', 'Vikram', 'Anil', 'Ramesh', 'Mohit', 'Sanjay', 'Deepak', 'Kavita', 'Pooja', 'Arjun', 'Rahul', 'Neha', 'Manoj', 'Sunita', 'Ravi', 'Geeta', 'Arun'];
const LAST_NAMES = ['Kumar', 'Sharma', 'Verma', 'Patel', 'Singh', 'Yadav', 'Das', 'Gupta', 'Mishra', 'Reddy', 'Nair', 'Iyer', 'Joshi', 'Mehta', 'Rao'];

const ALERT_TEMPLATES = [
  'Methane level {v}% in Section {s} — ventilation adjusted',
  'Conveyor belt #{n} bearing temperature elevated',
  'PPE compliance audit due in Shaft {s}',
  'Gas reading spike near return airway Panel {s}',
  'Roof fall risk after blasting in Panel {s}',
  'DGMS inspection reminder — Zone {s}',
  'Refuge chamber {n} restocked and verified',
  'Seismic activity {v} — structural survey ordered',
  'Water ingress in gallery {s} — pumps active',
  'Unauthorized access attempt at Gate {n}',
  'Dust suppression cycle completed — Section {s}',
  'Shift handover: {n} open hazards noted',
  'Oxygen deficiency alarm — Level {s}',
  'Equipment {n} failed pre-start check',
  'Fire watcher assigned to hot work Area {s}',
];

const MAINT_TASKS = [
  'Inspect ventilation fan', 'Replace roof bolts', 'Calibrate methane sensors',
  'Repair conveyor motor', 'Test emergency radios', 'Pump maintenance',
  'Fire line pressure check', 'Hydraulic hose replacement', 'Drill bit changeout',
  'Cable tray inspection', 'Transformer oil sampling', 'Haul road grading',
  'Dust collector filter swap', 'Rescue chamber supply audit', 'Gas detector calibration',
];

const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const STATUSES_MAINT = ['pending', 'in-progress', 'completed', 'overdue', 'cancelled'];
const CATEGORIES_MAINT = ['preventive', 'corrective', 'predictive', 'emergency'];
const COMPLIANCE_NAMES = ['DGMS Quarterly Return', 'Environmental Clearance', 'Explosives Audit', 'Insurance Renewal', 'Ventilation Plan Review', 'Mine Plan Amendment', 'Safety Committee Minutes', 'Incident Statistics'];
const COMPLIANCE_STATUS = ['Approved', 'Pending', 'Rejected'];
const RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical'];
const REPORT_STATUS = ['Pending', 'Reviewed', 'Resolved'];
const AUDIT_ACTIONS = ['LOGIN', 'LOGOUT', 'ALERT_CREATE', 'ALERT_RESOLVE', 'REPORT_CREATE', 'SHIFT_LOG', 'MAINTENANCE_UPDATE', 'USER_UPDATE', 'EXPORT', 'BACKUP'];
const SHIFT_NOTES = ['Handover complete', 'DGMS items pending', 'Awaiting ventilation report', 'Night crew briefed', 'Equipment lockout verified'];
const SHIFT_STATUS = ['pending', 'in-progress', 'completed'];
const RESOURCE_TYPES = ['fuel', 'material', 'equipment', 'electricity', 'water', 'coal'];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pad = (n) => String(n).padStart(2, '0');

const daysAgo = (n, hour = rand(6, 20)) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, rand(0, 59), 0, 0);
  return d;
};

const dateStr = (d) => d.toISOString().split('T')[0];

const formatAlert = (tpl) =>
  tpl
    .replace('{v}', (Math.random() * 2 + 0.5).toFixed(1))
    .replace('{s}', pick(SECTIONS))
    .replace('{n}', String(rand(1, 12)));

async function batchInsert(Model, docs, label, chunkSize = 500) {
  if (!docs.length) return;
  let inserted = 0;
  for (let i = 0; i < docs.length; i += chunkSize) {
    const chunk = docs.slice(i, i + chunkSize);
    await Model.insertMany(chunk, { ordered: false });
    inserted += chunk.length;
    process.stdout.write(`\r  ${label}: ${inserted}/${docs.length}`);
  }
  console.log('');
}

async function clearCollections() {
  const models = [
    User, Mine, CoalMine, Location, Alert, Maintenance, Resource, Productivity,
    ShiftLog, SafetyPlan, CompilanceReport, SafetyReport, AuditLog, Achievement, Attendance,
    WorkPermit, Equipment, HazardZone, ContractorVisitor, NearMissReport, SafetyDrill, ChatMessage,
  ];
  for (const M of models) {
    await M.deleteMany({});
    console.log(`  cleared ${M.modelName}`);
  }
}

function allocateCounts(total) {
  const ratios = {
    alerts: 0.22,
    maintenance: 0.18,
    productivity: 0.18,
    shiftLogs: 0.14,
    auditLogs: 0.1,
    attendance: 0.08,
    compliance: 0.04,
    safetyReports: 0.03,
    safetyPlans: 0.02,
    resources: 0.01,
  };
  const counts = {};
  let assigned = 0;
  const keys = Object.keys(ratios);
  keys.forEach((k, i) => {
    if (i === keys.length - 1) {
      counts[k] = total - assigned;
    } else {
      counts[k] = Math.round(total * ratios[k]);
      assigned += counts[k];
    }
  });
  return counts;
}

async function seed() {
  console.log(`\n🌱 Bulk seed target: ~${TARGET_TOTAL} documents\n`);
  await mongoose.connect(process.env.DB_URI);
  console.log('Connected to MongoDB\n');

  if (FRESH) {
    console.log('Clearing collections...');
    await clearCollections();
  } else {
    const n = await User.countDocuments();
    if (n > 0) {
      console.log(`Database has ${n} users. Use --fresh to reset.\n`);
      await mongoose.disconnect();
      return;
    }
  }

  const counts = allocateCounts(TARGET_TOTAL);
  console.log('Planned counts:', counts, '\n');

  const hashed = await bcrypt.hash(PASSWORD, 10);

  console.log('Creating users...');
  const coreUsers = [
    { name: 'Rajesh Kumar', email: 'admin@coalmine.com', password: hashed, role: 'Super admin' },
    { name: 'Priya Sharma', email: 'safety@coalmine.com', password: hashed, role: 'Safety Manager' },
    { name: 'Amit Verma', email: 'shift@coalmine.com', password: hashed, role: 'Shift Incharge' },
    { name: 'Suresh Patel', email: 'inspector@coalmine.com', password: hashed, role: 'Inspector' },
    { name: 'Mohit Gupta', email: 'mineadmin@coalmine.com', password: hashed, role: 'Mine admin' },
  ];

  const extraWorkers = Array.from({ length: 45 }, (_, i) => ({
    name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    email: `worker${i + 1}@coalmine.com`,
    password: hashed,
    role: 'worker',
  }));

  const users = await User.insertMany([...coreUsers, ...extraWorkers]);
  const staff = users.filter((u) => u.role !== 'worker');
  const workers = users.filter((u) => u.role === 'worker');
  const admin = users.find((u) => u.role === 'Super admin');
  console.log(`  ${users.length} users\n`);

  console.log('Creating mines & locations...');
  const mines = await Mine.insertMany(
    MINE_SITES.map((m) => ({
      name: m.name,
      latitude: m.lat + (Math.random() - 0.5) * 0.05,
      longitude: m.lng + (Math.random() - 0.5) * 0.05,
      status: pick(['active', 'active', 'active', 'inactive', 'under construction']),
      location: m.location,
    }))
  );

  await CoalMine.insertMany(
    MINE_SITES.map((m, i) => ({
      name: m.name,
      location: { latitude: m.lat, longitude: m.lng },
      workers: Array.from({ length: rand(3, 8) }, (_, j) => ({
        name: workers[(i + j) % workers.length].name,
        role: pick(['miner', 'supervisor', 'engineer']),
        contact: `98${rand(10000000, 99999999)}`,
      })),
    }))
  );

  await Location.insertMany(
    MINE_SITES.flatMap((m) => [
      {
        name: `${m.name} — Main Shaft`,
        coordinates: { type: 'Point', coordinates: [m.lng, m.lat] },
      },
      {
        name: `${m.name} — Panel ${pick(SECTIONS)}`,
        coordinates: {
          type: 'Point',
          coordinates: [m.lng + (Math.random() - 0.5) * 0.08, m.lat + (Math.random() - 0.5) * 0.08],
        },
      },
    ])
  );
  console.log(`  ${mines.length} mines, ${MINE_SITES.length * 2} locations\n`);

  console.log('Generating bulk documents...');

  const alerts = Array.from({ length: counts.alerts }, (_, i) => {
    const resolved = Math.random() > 0.55;
    const creator = pick(staff);
    const resolver = resolved ? pick(staff) : null;
    return {
      message: formatAlert(pick(ALERT_TEMPLATES)),
      type: Math.random() > 0.75 ? 'critical' : 'warning',
      timestamp: daysAgo(rand(0, 180)),
      createdBy: creator._id,
      resolved,
      resolvedBy: resolved ? resolver._id : null,
      resolvedAt: resolved ? daysAgo(rand(0, 30)) : null,
    };
  });
  await batchInsert(Alert, alerts, 'Alerts');

  const maintenance = Array.from({ length: counts.maintenance }, () => {
    const mine = pick(mines);
    const worker = pick(workers);
    const status = pick(STATUSES_MAINT);
    const days = rand(1, 120);
    return {
      mineId: mine._id,
      task: `${pick(MAINT_TASKS)} — ${pick(SECTIONS)} @ ${mine.name.split(' ')[0]}`,
      category: pick(CATEGORIES_MAINT),
      priority: rand(1, 3),
      status,
      date: daysAgo(days),
      dueDate: daysAgo(days - rand(-14, 21)),
      description: `Work order for ${mine.name}. Assigned to ${worker.name}.`,
      assignedTo: worker._id,
      equipmentName: `EQ-${rand(100, 999)}`,
    };
  });
  await batchInsert(Maintenance, maintenance, 'Maintenance');

  const productivity = Array.from({ length: counts.productivity }, (_, i) => {
    const d = daysAgo(i % 365);
    const base = 55 + Math.sin(i / 12) * 20 + rand(0, 15);
    return {
      date: d,
      value: [Math.round(base), Math.round(base * 0.9), Math.round(base * 1.08)],
      description: `Output index ${dateStr(d)} — ${pick(MINE_SITES).name}`,
    };
  });
  await batchInsert(Productivity, productivity, 'Productivity');

  const shiftLogs = Array.from({ length: counts.shiftLogs }, () => {
    const mine = pick(mines);
    const h1 = rand(0, 23);
    const h2 = (h1 + 8) % 24;
    return {
      shiftDetails: `${pick(['Day', 'Night', 'Evening'])} shift at ${mine.name}: ${pick(MAINT_TASKS).toLowerCase()} completed.`,
      shiftStartTime: `${pad(h1)}:00`,
      shiftEndTime: `${pad(h2)}:00`,
      status: pick(SHIFT_STATUS),
      notes: pick(SHIFT_NOTES),
    };
  });
  await batchInsert(ShiftLog, shiftLogs, 'Shift logs');

  const auditLogs = Array.from({ length: counts.auditLogs }, () => {
    const u = pick(users);
    return {
      user: u.name,
      action: pick(AUDIT_ACTIONS),
      details: `${pick(AUDIT_ACTIONS)} — ${pick(MINE_SITES).name} / ${pick(SECTIONS)}`,
      timestamp: daysAgo(rand(0, 90)),
    };
  });
  await batchInsert(AuditLog, auditLogs, 'Audit logs');

  const attendance = Array.from({ length: counts.attendance }, () => {
    const w = pick(workers);
    const d = daysAgo(rand(0, 60));
    return {
      userId: w._id,
      name: w.name,
      department: pick(['Mining', 'Maintenance']),
      date: dateStr(d),
      status: Math.random() > 0.12 ? 'Present' : 'Absent',
    };
  });
  await batchInsert(Attendance, attendance, 'Attendance');

  const compliance = Array.from({ length: counts.compliance }, () => ({
    name: `${pick(COMPLIANCE_NAMES)} — ${pick(MINE_SITES).name} #${rand(100, 999)}`,
    date: daysAgo(rand(0, 400)),
    status: pick(COMPLIANCE_STATUS),
    details: `Regulatory filing for ${pick(MINE_SITES).location}. Ref: DGMS/${rand(1000, 9999)}/${new Date().getFullYear()}.`,
  }));
  await batchInsert(CompilanceReport, compliance, 'Compliance');

  const safetyReports = Array.from({ length: counts.safetyReports }, () => {
    const mine = pick(mines);
    return {
      reportTitle: `${pick(['Near-miss', 'Minor injury', 'Equipment failure', 'Gas alarm', 'Roof fall'])} — ${mine.name}`,
      description: `Incident logged at ${mine.location}. Investigation ${pick(['open', 'ongoing', 'closed'])}.`,
      riskLevel: pick(RISK_LEVELS),
      incidentDate: daysAgo(rand(0, 200)),
      location: `${mine.name} Panel ${pick(SECTIONS)}`,
      status: pick(REPORT_STATUS),
      createdBy: pick(staff).name,
      approvedBy: Math.random() > 0.4 ? pick(staff).name : null,
    };
  });
  await batchInsert(SafetyReport, safetyReports, 'Safety reports');

  const safetyPlans = Array.from({ length: counts.safetyPlans }, () => ({
    hazardDetails: `${pick(['Roof instability', 'Dust exposure', 'Hauler traffic', 'Water ingress', 'Electrical hazard'])} — ${pick(SECTIONS)}`,
    riskLevel: pick(['Low', 'Medium', 'High']),
    mitigationMeasures: pick([
      'Additional bolting and daily survey',
      'Mist sprinklers and PPE enforcement',
      'Traffic control and speed limits',
      'Pump deployment and barrier tapes',
      'Lockout-tagout and insulated tools',
    ]),
    status: pick(['draft', 'approved', 'rejected']),
    createdBy: pick(staff).name,
  }));
  await batchInsert(SafetyPlan, safetyPlans, 'Safety plans');

  const resources = Array.from({ length: counts.resources }, (_, i) => {
    const mine = mines[i % mines.length];
    const type = pick(RESOURCE_TYPES);
    const used = rand(15, 90);
    return {
      mineId: mine._id,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} stock — ${mine.name.split(' ')[0]}`,
      type,
      used,
      available: 100 - used,
      unit: type === 'coal' ? 'tonnes' : '%',
      supplier: 'Central Stores — Korba',
      location: mine.location,
    };
  });
  await batchInsert(Resource, resources, 'Resources');

  console.log('Safety features (permits, equipment, zones, etc.)...');
  const { spawnSync } = await import('child_process');
  spawnSync(process.execPath, ['scripts/seed-safety-features.js', '--force'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: process.env,
  });

  await Achievement.insertMany([
    { name: '7-Day Safety Streak', description: 'No recordable incidents for 7 shifts', target: 7, progressKey: 'safetyStreak', milestone: 'Bronze' },
    { name: 'PPE Compliance 100%', description: 'Pass full PPE audit', target: 1, progressKey: 'ppeAudit', milestone: 'Gold' },
    { name: 'Training Modules', description: 'Complete 5 modules', target: 5, progressKey: 'trainingModules', milestone: 'Silver' },
    { name: 'Hazard Reports', description: 'File 10 observations', target: 10, progressKey: 'hazardReports', milestone: 'Bronze' },
    { name: '30-Day Attendance', description: 'Present 30 days', target: 30, progressKey: 'attendance30', milestone: 'Gold' },
    { name: 'Zero Critical Week', description: 'No critical alerts for 7 days', target: 7, progressKey: 'zeroCritical', milestone: 'Platinum' },
  ]);

  const totalDocs =
    users.length +
    mines.length +
    MINE_SITES.length * 2 +
    counts.alerts +
    counts.maintenance +
    counts.productivity +
    counts.shiftLogs +
    counts.auditLogs +
    counts.attendance +
    counts.compliance +
    counts.safetyReports +
    counts.safetyPlans +
    counts.resources +
    6;

  console.log('\n✅ Bulk seed complete!\n');
  console.log(`  Total documents: ~${totalDocs}`);
  console.log(`  Password (all users): ${PASSWORD}`);
  console.log('  Login: admin@coalmine.com | safety@coalmine.com | worker1@coalmine.com\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
