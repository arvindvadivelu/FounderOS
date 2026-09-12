import { db } from '../db';
import type { Activity } from '../../types';

export async function logActivity(
  action: string,
  entityType: Activity['entityType'],
  title: string,
  entityId?: string,
  details?: string
): Promise<void> {
  const activity: Activity = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    action,
    entityType,
    entityId,
    title,
    details,
    timestamp: new Date().toISOString(),
  };
  await db.activities.put(activity);
}

export async function getRecentActivities(limit: number = 20): Promise<Activity[]> {
  const all = await db.activities.toArray();
  return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
}
