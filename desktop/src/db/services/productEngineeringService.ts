import { db } from '../db';
import type { Feature, Bug } from '../../types';
import { logActivity } from './activityService';

// Feature Services
export async function getAllFeatures(): Promise<Feature[]> {
  const list = await db.features.toArray();
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createFeature(data: Omit<Feature, 'id' | 'createdAt' | 'updatedAt'>): Promise<Feature> {
  const now = new Date().toISOString();
  const feat: Feature = {
    id: `feat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  await db.features.put(feat);
  await logActivity('created_feature', 'feature', `Added feature idea "${feat.title}"`, feat.id);
  return feat;
}

export async function updateFeature(id: string, updates: Partial<Feature>): Promise<Feature> {
  const existing = await db.features.get(id);
  if (!existing) throw new Error(`Feature ${id} not found`);

  const updated: Feature = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await db.features.put(updated);
  await logActivity('updated_feature', 'feature', `Updated feature "${updated.title}" (${updated.status})`, id);
  return updated;
}

export async function deleteFeature(id: string): Promise<void> {
  const existing = await db.features.get(id);
  if (existing) {
    await db.features.delete(id);
    await logActivity('deleted_feature', 'feature', `Deleted feature "${existing.title}"`, id);
  }
}

// Bug Services
export async function getAllBugs(): Promise<Bug[]> {
  const list = await db.bugs.toArray();
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createBug(data: Omit<Bug, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bug> {
  const now = new Date().toISOString();
  const bug: Bug = {
    id: `bug_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...data,
    createdAt: now,
    updatedAt: now,
    resolvedAt: data.status === 'resolved' ? now : undefined,
  };

  await db.bugs.put(bug);
  await logActivity('created_bug', 'bug', `Reported bug "${bug.title}" (${bug.severity})`, bug.id);
  return bug;
}

export async function updateBug(id: string, updates: Partial<Bug>): Promise<Bug> {
  const existing = await db.bugs.get(id);
  if (!existing) throw new Error(`Bug ${id} not found`);

  const isResolved = updates.status === 'resolved' && existing.status !== 'resolved';
  const now = new Date().toISOString();

  const updated: Bug = {
    ...existing,
    ...updates,
    resolvedAt: isResolved ? now : updates.status && updates.status !== 'resolved' ? undefined : existing.resolvedAt,
    updatedAt: now,
  };

  await db.bugs.put(updated);
  await logActivity('updated_bug', 'bug', `Updated bug "${updated.title}" (${updated.status})`, id);
  return updated;
}

export async function deleteBug(id: string): Promise<void> {
  const existing = await db.bugs.get(id);
  if (existing) {
    await db.bugs.delete(id);
    await logActivity('deleted_bug', 'bug', `Deleted bug "${existing.title}"`, id);
  }
}
