import Maintenance from '../models/Maintenance.js';
import { emitToMine } from '../utils/socketHandler.js';
import { notifyMaintenanceOverdue } from '../services/pushNotificationService.js';
import logger from '../utils/logger.js';

const MS_DAY = 24 * 60 * 60 * 1000;

const addInterval = (date, interval, value) => {
  const d = new Date(date);
  if (interval === 'daily') d.setDate(d.getDate() + value);
  else if (interval === 'weekly') d.setDate(d.getDate() + 7 * value);
  else if (interval === 'monthly') d.setMonth(d.getMonth() + value);
  else d.setDate(d.getDate() + 7 * value);
  return d;
};

export const processRecurringMaintenance = async () => {
  const recurring = await Maintenance.find({
    'recurringSchedule.isRecurring': true,
    status: { $in: ['completed', 'pending', 'in-progress'] },
  });

  let created = 0;
  let overdueNotified = 0;

  for (const task of recurring) {
    const { interval = 'weekly', intervalValue = 1 } = task.recurringSchedule || {};
    const nextDue = task.dueDate ? new Date(task.dueDate) : new Date();

    if (task.status === 'completed' && nextDue <= new Date()) {
      const newDue = addInterval(nextDue, interval, intervalValue);
      const clone = await Maintenance.create({
        mineId: task.mineId,
        task: task.task,
        description: task.description,
        priority: task.priority,
        category: task.category,
        equipmentId: task.equipmentId,
        equipmentName: task.equipmentName,
        assignedTo: task.assignedTo,
        dueDate: newDue,
        status: 'pending',
        recurringSchedule: task.recurringSchedule,
      });
      emitToMine(String(task.mineId), 'maintenance:created', clone);
      created += 1;
    }

    if (task.status !== 'completed' && task.dueDate && new Date(task.dueDate) < new Date()) {
      if (task.status !== 'overdue') {
        task.status = 'overdue';
        await task.save();
        emitToMine(String(task.mineId), 'maintenance:updated', task);
        if (task.priority >= 4) {
          await notifyMaintenanceOverdue(task.mineId, task.task);
          overdueNotified += 1;
        }
      }
    }
  }

  return { processed: recurring.length, created, overdueNotified };
};

export const startRecurringMaintenanceScheduler = (intervalMs = 60 * 60 * 1000) => {
  const run = () => {
    processRecurringMaintenance().catch((err) =>
      logger.error(`[recurring-maintenance] ${err.message}`)
    );
  };
  run();
  return setInterval(run, intervalMs);
};

export default { processRecurringMaintenance, startRecurringMaintenanceScheduler };
