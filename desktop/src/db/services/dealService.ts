import { db } from '../db';
import type { Deal } from '../../types';
import { logActivity } from './activityService';
import { realtimeSync } from '../../services/realtimeSyncService';

export async function getAllDeals(): Promise<Deal[]> {
  return await db.deals.toArray();
}

export async function createDeal(data: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deal> {
  const now = new Date().toISOString();
  const deal: Deal = {
    id: `deal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  await db.deals.put(deal);
  await logActivity('created_deal', 'deal', `Created deal "${deal.name}" ($${deal.value.toLocaleString()})`, deal.id);
  realtimeSync.broadcast('deals', 'create', deal);
  return deal;
}

export async function updateDeal(id: string, updates: Partial<Deal>): Promise<Deal> {
  const existing = await db.deals.get(id);
  if (!existing) throw new Error(`Deal with ID ${id} not found`);

  const updated: Deal = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await db.deals.put(updated);
  await logActivity('updated_deal', 'deal', `Updated deal "${updated.name}" (${updated.stage})`, id);
  realtimeSync.broadcast('deals', 'update', updated);
  return updated;
}

export async function deleteDeal(id: string): Promise<void> {
  const existing = await db.deals.get(id);
  if (existing) {
    await db.deals.delete(id);
    await logActivity('deleted_deal', 'deal', `Deleted deal "${existing.name}"`, id);
    realtimeSync.broadcast('deals', 'delete', existing);
  }
}
