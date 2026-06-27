/**
 * Seed compliance, training, emergencies, and leaderboard data.
 * Safe on existing DB — skips populated collections unless --force.
 *
 *   node scripts/seed-operations-data.js
 *   node scripts/seed-operations-data.js --force
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import Mine from '../models/Mine.js';
import User from '../models/User.js';
import ComplianceRecord from '../models/ComplianceRecord.js';
import { Training, Leaderboard } from '../models/Training.js';
import EmergencyResponse from '../models/EmergencyResponse.js';

const FORCE = process.argv.includes('--force');

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

const TRAINING_MODULES = [
  { title: 'Underground Gas Detection', category: 'safety_procedures', type: 'quiz', difficulty: 'beginner', duration: 45, points: 150, mandatory: true },
  { title: 'PPE Requirements & Inspection', category: 'safety_procedures', type: 'interactive', difficulty: 'beginner', duration: 30, points: 100, mandatory: true },
  { title: 'Conveyor Belt Safety', category: 'equipment_operation', type: 'video', difficulty: 'intermediate', duration: 60, points: 120 },
  { title: 'Emergency Evacuation Procedures', category: 'emergency_response', type: 'simulation', difficulty: 'intermediate', duration: 90, points: 200, mandatory: true },
  { title: 'Silicosis & Dust Control', category: 'health_hazards', type: 'document', difficulty: 'intermediate', duration: 40, points: 110 },
  { title: 'DGMS Compliance Overview', category: 'compliance', type: 'quiz', difficulty: 'advanced', duration: 75, points: 180 },
  { title: 'Mine First Aid & Trauma', category: 'first_aid', type: 'interactive', difficulty: 'intermediate', duration: 120, points: 250, certificate: true },
  { title: 'Roof Control & Ground Support', category: 'safety_procedures', type: 'video', difficulty: 'advanced', duration: 55, points: 130 },
  { title: 'Hot Work & Fire Prevention', category: 'emergency_response', type: 'quiz', difficulty: 'beginner', duration: 35, points: 100 },
  { title: 'Shift Handover Communication', category: 'communication', type: 'document', difficulty: 'beginner', duration: 25, points: 80 },
];

const COMPLIANCE_TEMPLATES = [
  { type: 'certificate', name: 'DGMS Operating License', authority: 'Directorate General of Mines Safety', days: 180 },
  { type: 'certificate', name: 'Environmental Clearance Certificate', authority: 'Ministry of Environment', days: 45 },
  { type: 'certificate', name: 'Explosives Storage License', authority: 'Petroleum & Explosives Safety Org', days: -15 },
  { type: 'certificate', name: 'Ventilation Plan Approval', authority: 'DGMS Regional Office', days: 365 },
  { type: 'inspection', name: 'Quarterly Safety Inspection', authority: 'Internal Safety Team', days: 14 },
  { type: 'inspection', name: 'Electrical Systems Audit', authority: 'Certified Electrical Inspector', days: -7 },
  { type: 'inspection', name: 'Rescue Equipment Check', authority: 'Mine Rescue Team', days: 30 },
];

async function seedCollection(Model, docs, label) {
  const existing = await Model.countDocuments();
  if (existing > 0 && !FORCE) {
    console.log(`  skip ${label} (${existing} already exist)`);
    return 0;
  }
  if (FORCE && existing > 0) {
    await Model.deleteMany({});
    console.log(`  cleared ${label}`);
  }
  if (!docs.length) return 0;
  await Model.insertMany(docs, { ordered: false });
  console.log(`  + ${docs.length} ${label}`);
  return docs.length;
}

async function main() {
  console.log('\n📋 Seeding operations data (compliance, training, emergencies)\n');
  await mongoose.connect(process.env.DB_URI);

  const mines = await Mine.find().lean();
  const users = await User.find().lean();
  if (!mines.length || !users.length) {
    console.error('Run npm run seed:fresh first.');
    process.exit(1);
  }

  const admin = users.find((u) => u.role?.toLowerCase().includes('admin')) || users[0];
  const staff = users.filter((u) => u.role !== 'worker');
  const workers = users.filter((u) => u.role === 'worker');
  let total = 0;

  const compliance = [];
  mines.forEach((mine) => {
    COMPLIANCE_TEMPLATES.forEach((t, i) => {
      const isCert = t.type === 'certificate';
      compliance.push({
        mineId: mine._id,
        type: t.type,
        name: `${t.name} — ${mine.name.split(' ')[0]}`,
        description: `${t.name} for ${mine.name}`,
        issuingAuthority: t.authority,
        certificateNumber: isCert ? `CERT-${mine._id.toString().slice(-4)}-${i}` : undefined,
        expiryDate: isCert ? daysFromNow(t.days) : undefined,
        scheduledDate: !isCert ? daysFromNow(t.days) : undefined,
        assignedTo: pick(staff)._id,
        reminderDays: [30, 7, 1],
      });
    });
  });
  total += await seedCollection(ComplianceRecord, compliance, 'compliance records');

  const trainings = TRAINING_MODULES.map((m) => ({
    title: m.title,
    description: `Mandatory safety training module covering ${m.title.toLowerCase()} for underground coal operations.`,
    category: m.category,
    type: m.type,
    difficulty: m.difficulty,
    duration: m.duration,
    content: {
      questions: [
        { question: `What is the primary focus of ${m.title}?`, options: ['Safety compliance', 'Production speed', 'Cost reduction', 'None'], correctAnswer: 0, points: 10 },
        { question: 'When must you report a hazard?', options: ['End of shift', 'Immediately', 'Weekly', 'Never'], correctAnswer: 1, points: 10 },
      ],
    },
    passingScore: 70,
    certificateEligible: m.certificate || false,
    points: m.points,
    badges: m.certificate ? [{ name: 'Safety Certified', description: 'Completed with certificate', icon: '🏅' }] : [],
    isActive: true,
    isMandatory: m.mandatory || false,
    expiryDuration: m.mandatory ? 12 : undefined,
    createdBy: admin._id,
    enrolledUsers: workers.slice(0, rand(3, 8)).map((w, idx) => ({
      userId: w._id,
      progress: pick([0, 25, 50, 75, 100]),
      completed: idx % 3 === 0,
      score: idx % 3 === 0 ? rand(75, 98) : undefined,
      enrolledAt: daysAgo(rand(1, 30)),
    })),
  }));
  total += await seedCollection(Training, trainings, 'training courses');

  const leaderboard = users.slice(0, 30).map((u, i) => ({
    userId: u._id,
    totalPoints: rand(100, 2500) - i * 20,
    level: Math.max(1, Math.floor(rand(1, 8) - i * 0.1)),
    statistics: {
      trainingsCompleted: rand(0, 6),
      quizzesPassed: rand(0, 8),
      averageScore: rand(70, 95),
      totalTimeSpent: rand(60, 600),
      certificatesEarned: rand(0, 3),
    },
    badges: i < 5 ? [{ badgeName: 'Safety Champion', category: 'safety_procedures' }] : [],
    rank: i + 1,
  }));
  total += await seedCollection(Leaderboard, leaderboard, 'leaderboard entries');

  const emergencies = [];
  const demoMines = mines.slice(0, Math.min(4, mines.length));
  demoMines.forEach((mine, mi) => {
    const reporter = pick(staff);
    const affected = workers.slice(0, rand(5, 12));
    emergencies.push({
      emergencyId: `EMG-DEMO-${mi + 1}-${Date.now().toString(36).toUpperCase()}`,
      mineId: mine._id,
      reportedBy: reporter._id,
      emergencyType: pick(['gas_leak', 'fire', 'collapse', 'flooding', 'equipment_failure']),
      severity: pick(['moderate', 'major', 'critical']),
      status: 'active',
      description: `Active incident at ${mine.name} — automated demo record for evacuation command center.`,
      location: { area: `Panel ${String.fromCharCode(65 + mi)}`, level: `Level ${rand(1, 3)}`, latitude: mine.latitude, longitude: mine.longitude },
      affectedPersonnel: affected.map((w) => ({ userId: w._id, status: pick(['unknown', 'safe', 'missing', 'injured']) })),
      timeline: [{ event: 'Emergency reported', performedBy: reporter._id, notes: 'Demo seed incident' }],
      evacuationStatus: { initiated: false },
    });
  });

  if (demoMines[0] && workers.length) {
    const mine = demoMines[0];
    const musterRoll = workers.slice(0, 10).map((w, i) => ({
      userId: w._id,
      name: w.name,
      status: pick(['safe', 'safe', 'evacuated', 'missing', 'unknown']),
      musterPoint: pick(['Muster Point A', 'Muster Point B']),
    }));
    emergencies.push({
      emergencyId: `EMG-EVAC-DEMO-${Date.now().toString(36).toUpperCase()}`,
      mineId: mine._id,
      reportedBy: admin._id,
      emergencyType: 'gas_leak',
      severity: 'critical',
      status: 'responding',
      description: `CRITICAL: Elevated methane at ${mine.name} Panel C — evacuation in progress (demo).`,
      location: { area: 'Panel C', level: 'Level 2', latitude: mine.latitude, longitude: mine.longitude },
      affectedPersonnel: workers.slice(0, 15).map((w) => ({ userId: w._id, status: 'unknown' })),
      timeline: [
        { event: 'Emergency reported', performedBy: admin._id },
        { event: 'Evacuation initiated', performedBy: admin._id, notes: 'All personnel to muster points' },
      ],
      evacuationStatus: {
        initiated: true,
        completedAt: daysAgo(1),
        evacuationRoutes: ['Main shaft exit', 'Emergency exit A', 'West gallery route'],
        musterPoints: [
          { name: 'Muster Point A', latitude: (mine.latitude || 23.6) + 0.001, longitude: (mine.longitude || 86.1) + 0.001, radiusMeters: 50 },
          { name: 'Muster Point B', latitude: (mine.latitude || 23.6) - 0.001, longitude: (mine.longitude || 86.1) - 0.001, radiusMeters: 50 },
        ],
        musterRoll,
        personnelEvacuated: musterRoll.filter((r) => r.status === 'safe' || r.status === 'evacuated').length,
        personnelRemaining: musterRoll.filter((r) => r.status === 'missing' || r.status === 'unknown').length,
      },
    });
  }
  total += await seedCollection(EmergencyResponse, emergencies, 'active emergencies');

  console.log(`\n✅ Done — ${total} documents seeded\n`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
