import logger from '../utils/logger.js';

let admin = null;
let messaging = null;

const initFirebase = async () => {
  if (messaging) return messaging;
  try {
    const mod = await import('firebase-admin');
    admin = mod.default;
    if (!admin.apps.length) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        const cred = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        admin.initializeApp({ credential: admin.credential.cert(cred) });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp({ credential: admin.credential.applicationDefault() });
      } else {
        return null;
      }
    }
    messaging = admin.messaging();
    return messaging;
  } catch (err) {
    logger.warn(`Push notifications unavailable: ${err.message}`);
    return null;
  }
};

export const sendPushToTokens = async (tokens, { title, body, data = {} }) => {
  const unique = [...new Set((tokens || []).filter(Boolean))];
  if (!unique.length) return { sent: 0, failed: 0 };

  const msg = await initFirebase();
  if (!msg) {
    if (process.env.FIREBASE_SERVER_KEY) {
      return sendLegacyFcm(unique, { title, body, data });
    }
    return { sent: 0, failed: unique.length, skipped: true };
  }

  try {
    const response = await msg.sendEachForMulticast({
      tokens: unique,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    });
    return { sent: response.successCount, failed: response.failureCount };
  } catch (err) {
    logger.error(`FCM send error: ${err.message}`);
    return { sent: 0, failed: unique.length, error: err.message };
  }
};

const sendLegacyFcm = async (tokens, { title, body, data }) => {
  try {
    const axios = (await import('axios')).default;
    let sent = 0;
    for (const token of tokens) {
      await axios.post(
        'https://fcm.googleapis.com/fcm/send',
        { to: token, notification: { title, body }, data },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `key=${process.env.FIREBASE_SERVER_KEY}`,
          },
        }
      );
      sent += 1;
    }
    return { sent, failed: tokens.length - sent };
  } catch (err) {
    logger.error(`Legacy FCM error: ${err.message}`);
    return { sent: 0, failed: tokens.length };
  }
};

export const sendPushToUsers = async (userIds, payload) => {
  const User = (await import('../models/User.js')).default;
  const users = await User.find({ _id: { $in: userIds } }).select('fcmTokens');
  const tokens = users.flatMap((u) => u.fcmTokens || []);
  return sendPushToTokens(tokens, payload);
};

export const sendPushToMine = async (mineId, payload) => {
  const User = (await import('../models/User.js')).default;
  const users = await User.find({ fcmTokens: { $exists: true, $ne: [] } }).select('fcmTokens');
  const tokens = users.flatMap((u) => u.fcmTokens || []);
  return sendPushToTokens(tokens, payload);
};

export const notifyEmergency = async (mineId, emergency) => {
  return sendPushToMine(mineId, {
    title: '🚨 EMERGENCY ALERT',
    body: `${(emergency.emergencyType || 'emergency').replace(/_/g, ' ').toUpperCase()} — immediate action required`,
    data: { type: 'emergency', emergencyId: String(emergency._id), mineId: String(mineId) },
  });
};

export const notifyEvacuation = async (mineId, emergencyId) => {
  return sendPushToMine(mineId, {
    title: '⚠️ EVACUATION ORDER',
    body: 'Evacuate immediately. Proceed to your designated muster point.',
    data: { type: 'evacuation', emergencyId: String(emergencyId), mineId: String(mineId) },
  });
};

export const notifyGasDanger = async (mineId, message) => {
  return sendPushToMine(mineId, {
    title: '☣️ GAS ALERT',
    body: message || 'Dangerous gas levels detected',
    data: { type: 'gas_danger', mineId: String(mineId) },
  });
};

export const notifyMaintenanceOverdue = async (mineId, taskName) => {
  return sendPushToMine(mineId, {
    title: '🔧 Overdue Maintenance',
    body: `Critical task overdue: ${taskName}`,
    data: { type: 'maintenance_overdue', mineId: String(mineId) },
  });
};

export default {
  sendPushToTokens,
  sendPushToUsers,
  sendPushToMine,
  notifyEmergency,
  notifyEvacuation,
  notifyGasDanger,
  notifyMaintenanceOverdue,
};
