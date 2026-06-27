/**
 * Seed safety-feature collections (work permits, equipment, hazard zones, etc.)
 * Safe to run on existing DB — skips collections that already have data.
 *
 *   node scripts/seed-safety-features.js
 *   node scripts/seed-safety-features.js --force   # wipe & re-seed these collections only
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import Mine from '../models/Mine.js';
import User from '../models/User.js';
import WorkPermit from '../models/WorkPermit.js';
import Equipment from '../models/Equipment.js';
import HazardZone from '../models/HazardZone.js';
import ContractorVisitor from '../models/ContractorVisitor.js';
import NearMissReport from '../models/NearMissReport.js';
import SafetyDrill from '../models/SafetyDrill.js';
import ChatMessage from '../models/ChatMessage.js';

const FORCE = process.argv.includes('--force');

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const WORK_TYPES = ['hot_work', 'confined_space', 'electrical', 'excavation', 'height_work', 'other'];
const PERMIT_STATUS = ['pending', 'approved', 'active', 'expired', 'completed'];
const EQUIP_TYPES = ['Ventilation fan', 'Conveyor belt', 'Gas detector', 'Pump set', 'Haul truck', 'Roof bolter', 'Transformer', 'Compressor'];
const EQUIP_STATUS = ['operational', 'warning', 'malfunction', 'maintenance', 'offline'];
const ZONE_TYPES = ['restricted', 'gas_prone', 'blasting', 'unstable_roof', 'evacuation_route', 'muster_point'];
const ZONE_STATUS = ['clear', 'restricted', 'evacuation', 'closed'];
const NEAR_MISS_CATS = ['fall', 'equipment', 'gas', 'electrical', 'structural', 'vehicle', 'ppe', 'other'];
const NEAR_MISS_TITLES = [
  'Loose roof bolt observed before fall',
  'Hauler reversed without spotter',
  'Gas detector alarm — false positive suspected',
  'Worker entered restricted zone without permit',
  'Cable tray obstruction in walkway',
  'PPE non-compliance at shaft entry',
  'Water seepage near working face',
  'Scaffold tag expired but area in use',
];
const DRILL_TYPES = ['fire', 'gas', 'evacuation', 'collapse', 'medical', 'communication'];
const DRILL_STATUS = ['scheduled', 'in_progress', 'completed'];
const CHAT_CHANNELS = ['shift', 'safety', 'maintenance'];
const CHAT_SAMPLES = {
  shift: [
    'Handover complete — Panel C ventilation check pending.',
    'Night crew on site. All gas readings normal at 06:00.',
    'Conveyor #3 stopped for bearing inspection — ETA 2 hours.',
    'Shift log submitted. DGMS items flagged for morning review.',
  ],
  safety: [
    'Reminder: PPE audit in Section B at 14:00.',
    'Near-miss reported at Panel D — review required.',
    'Muster point drill scheduled Friday 09:00.',
    'Gas levels stable across all active panels.',
  ],
  maintenance: [
    'Pump maintenance WO-442 assigned to Rahul.',
    'Ventilation fan V-12 vibration reading elevated.',
    'Scheduled downtime for transformer T-7 tonight.',
    'Spare parts for roof bolter arrived at stores.',
  ],
};

const COMPANIES = ['Tata Projects', 'L&T Mining', 'Coal India Contractors', 'Vedanta Services', 'BEML Ltd', 'Visitor — DGMS'];

async function seedCollection(Model, docs, label, forceClear = true) {
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
  console.log('\n🛡️  Seeding safety-feature data\n');
  await mongoose.connect(process.env.DB_URI);

  const mines = await Mine.find().lean();
  const users = await User.find().lean();
  if (!mines.length) {
    console.error('No mines in database. Run npm run seed:fresh first.');
    process.exit(1);
  }
  if (!users.length) {
    console.error('No users in database. Run npm run seed:fresh first.');
    process.exit(1);
  }

  const staff = users.filter((u) => u.role !== 'worker');
  const workers = users.filter((u) => u.role === 'worker');
  const allStaff = staff.length ? staff : users;

  let total = 0;

  const workPermits = [];
  mines.forEach((mine, mi) => {
    for (let i = 0; i < 8; i++) {
      const requester = pick(allStaff);
      const fromDays = rand(-5, 14);
      workPermits.push({
        mineId: mine._id,
        permitNumber: `PTW-SEED-${mi}-${i}`,
        workType: pick(WORK_TYPES),
        title: `${pick(WORK_TYPES).replace(/_/g, ' ')} — ${mine.name.split(' ')[0]} Panel ${String.fromCharCode(65 + (i % 8))}`,
        description: `Authorized work at ${mine.location || mine.name}. Safety briefing completed.`,
        location: { area: `Panel ${String.fromCharCode(65 + (i % 8))}`, level: `Level ${rand(1, 4)}` },
        requestedBy: requester._id,
        approvedBy: pick(PERMIT_STATUS) !== 'pending' ? pick(allStaff)._id : undefined,
        status: pick(PERMIT_STATUS),
        validFrom: daysAgo(Math.max(0, -fromDays)),
        validUntil: daysFromNow(rand(1, 30)),
        hazards: ['Fire', 'Gas', 'Fall hazard'].slice(0, rand(1, 3)),
        precautions: ['Fire watcher', 'Gas monitor', 'Lockout-tagout'].slice(0, rand(2, 3)),
      });
    }
  });
  total += await seedCollection(WorkPermit, workPermits, 'work permits');

  const equipment = [];
  mines.forEach((mine, mi) => {
    for (let i = 0; i < 12; i++) {
      const type = pick(EQUIP_TYPES);
      equipment.push({
        mineId: mine._id,
        equipmentId: `EQ-${mi + 1}-${String(i + 1).padStart(3, '0')}`,
        name: `${type} — ${mine.name.split(' ')[0]}`,
        type,
        manufacturer: pick(['BEML', 'Caterpillar', 'Komatsu', 'Sandvik', 'Atlas Copco']),
        criticality: pick(['low', 'medium', 'high', 'critical']),
        status: pick(EQUIP_STATUS),
        location: { area: `Section ${String.fromCharCode(65 + (i % 6))}`, level: `L${rand(1, 3)}` },
        installDate: daysAgo(rand(100, 2000)),
        failureCount: rand(0, 5),
        lastMaintenance: daysAgo(rand(1, 60)),
        nextMaintenance: daysFromNow(rand(7, 90)),
      });
    }
  });
  total += await seedCollection(Equipment, equipment, 'equipment items');

  const hazardZones = [];
  mines.forEach((mine) => {
    const site = mine.latitude != null ? mine : { latitude: 23.6 + Math.random() * 0.5, longitude: 86.1 + Math.random() * 0.5 };
    for (let i = 0; i < 5; i++) {
      hazardZones.push({
        mineId: mine._id,
        name: `${pick(['Restricted', 'Gas-prone', 'Blasting', 'Evacuation', 'Muster'])} zone — ${mine.name.split(' ')[0]} ${i + 1}`,
        zoneType: pick(ZONE_TYPES),
        status: pick(ZONE_STATUS),
        center: {
          latitude: (site.latitude || 23.6) + (Math.random() - 0.5) * 0.02,
          longitude: (site.longitude || 86.1) + (Math.random() - 0.5) * 0.02,
        },
        radiusMeters: pick([50, 75, 100, 150, 200]),
        requiresAuthorization: true,
        alertMessage: pick(['Unauthorized entry prohibited', 'Gas monitoring required', 'Blasting in progress', 'Evacuation route — keep clear']),
        createdBy: pick(allStaff)._id,
        active: true,
      });
    }
  });
  total += await seedCollection(HazardZone, hazardZones, 'hazard zones');

  const contractors = [];
  mines.forEach((mine) => {
    for (let i = 0; i < 6; i++) {
      contractors.push({
        mineId: mine._id,
        type: i % 3 === 0 ? 'visitor' : 'contractor',
        name: `${pick(['Raj', 'Amit', 'Suresh', 'Vikram', 'Deepak', 'Sanjay'])} ${pick(['Mehta', 'Singh', 'Das', 'Reddy', 'Nair'])}`,
        company: pick(COMPANIES),
        phone: `9${rand(100000000, 999999999)}`,
        purpose: pick(['Equipment install', 'DGMS inspection', 'Electrical audit', 'Ventilation survey', 'Safety training', 'Site tour']),
        hostUser: pick(allStaff)._id,
        checkInAt: daysAgo(rand(0, 2)),
        status: 'checked_in',
        safetyBriefingCompleted: Math.random() > 0.2,
        registeredBy: pick(allStaff)._id,
      });
    }
    for (let i = 0; i < 4; i++) {
      contractors.push({
        mineId: mine._id,
        type: 'contractor',
        name: `${pick(['Ramesh', 'Arun', 'Manoj', 'Kavita'])} ${pick(['Patel', 'Sharma', 'Gupta'])}`,
        company: pick(COMPANIES.slice(0, 4)),
        purpose: 'Completed maintenance work',
        checkInAt: daysAgo(rand(3, 10)),
        checkOutAt: daysAgo(rand(1, 2)),
        status: 'checked_out',
        safetyBriefingCompleted: true,
        registeredBy: pick(allStaff)._id,
      });
    }
  });
  total += await seedCollection(ContractorVisitor, contractors, 'contractor/visitor records');

  const nearMiss = [];
  mines.forEach((mine) => {
    for (let i = 0; i < 10; i++) {
      nearMiss.push({
        mineId: mine._id,
        reportedBy: pick(workers.length ? workers : users)._id,
        title: pick(NEAR_MISS_TITLES),
        description: `Observation logged at ${mine.name}. Immediate area secured and supervisor notified.`,
        category: pick(NEAR_MISS_CATS),
        severity: pick(['low', 'medium', 'high']),
        location: { area: `Panel ${String.fromCharCode(65 + (i % 8))}` },
        status: pick(['submitted', 'reviewing', 'actioned', 'closed']),
      });
    }
  });
  total += await seedCollection(NearMissReport, nearMiss, 'near-miss reports');

  const drills = [];
  mines.forEach((mine) => {
    for (let i = 0; i < 8; i++) {
      const status = pick(DRILL_STATUS);
      drills.push({
        mineId: mine._id,
        title: `${pick(DRILL_TYPES)} drill — ${mine.name.split(' ')[0]}`,
        drillType: pick(DRILL_TYPES),
        scheduledDate: daysFromNow(rand(-30, 60)),
        completedDate: status === 'completed' ? daysAgo(rand(1, 20)) : undefined,
        status,
        objectives: ['Account all personnel', 'Test communication', 'Verify muster points'],
        createdBy: pick(allStaff)._id,
        results: status === 'completed' ? {
          responseTimeMinutes: rand(8, 25),
          personnelAccounted: rand(45, 120),
          personnelTotal: rand(50, 125),
          score: rand(70, 98),
          notes: 'Drill completed within acceptable response time.',
        } : undefined,
      });
    }
  });
  total += await seedCollection(SafetyDrill, drills, 'safety drills');

  const chatMessages = [];
  mines.forEach((mine) => {
    CHAT_CHANNELS.forEach((channel) => {
      CHAT_SAMPLES[channel].forEach((text, i) => {
        const author = pick(users);
        chatMessages.push({
          mineId: mine._id,
          channel,
          userId: author._id,
          userName: author.name,
          message: text,
          createdAt: daysAgo(rand(0, 7)),
        });
      });
      for (let i = 0; i < 6; i++) {
        const author = pick(users);
        chatMessages.push({
          mineId: mine._id,
          channel,
          userId: author._id,
          userName: author.name,
          message: pick(CHAT_SAMPLES[channel]),
          createdAt: daysAgo(rand(0, 14)),
        });
      }
    });
  });
  total += await seedCollection(ChatMessage, chatMessages, 'chat messages');

  console.log(`\n✅ Done — ${total} new documents seeded`);
  if (total === 0) console.log('   (all safety-feature collections already populated; use --force to replace)\n');
  else console.log('   Refresh the app to see Work Permits, Equipment, Hazard Zones, etc.\n');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
