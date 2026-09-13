import { db } from '../db';
import type { Goal, Note } from '../../types';
import { logActivity } from './activityService';
import { realtimeSync } from '../../services/realtimeSyncService';

// Goal Services
export async function getAllGoals(): Promise<Goal[]> {
  return await db.goals.toArray();
}

export async function createGoal(data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
  const now = new Date().toISOString();
  const goal: Goal = {
    id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  await db.goals.put(goal);
  await logActivity('created_goal', 'goal', `Set company goal "${goal.title}"`, goal.id);
  realtimeSync.broadcast('goals', 'create', goal);
  return goal;
}

export async function updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
  const existing = await db.goals.get(id);
  if (!existing) throw new Error(`Goal ${id} not found`);

  const updated: Goal = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await db.goals.put(updated);
  await logActivity('updated_goal', 'goal', `Updated goal "${updated.title}" (${updated.currentValue}/${updated.target} ${updated.unit})`, id);
  realtimeSync.broadcast('goals', 'update', updated);
  return updated;
}

export async function deleteGoal(id: string): Promise<void> {
  const existing = await db.goals.get(id);
  if (existing) {
    await db.goals.delete(id);
    await logActivity('deleted_goal', 'goal', `Deleted goal "${existing.title}"`, id);
    realtimeSync.broadcast('goals', 'delete', existing);
  }
}

// Note Services
export async function getAllNotes(): Promise<Note[]> {
  const list = await db.notes.toArray();
  return list.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export async function createNote(data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
  const now = new Date().toISOString();
  const note: Note = {
    id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...data,
    tags: data.tags || [],
    createdAt: now,
    updatedAt: now,
  };

  await db.notes.put(note);
  await logActivity('created_note', 'note', `Created note "${note.title}"`, note.id);
  realtimeSync.broadcast('notes', 'create', note);
  return note;
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<Note> {
  const existing = await db.notes.get(id);
  if (!existing) throw new Error(`Note ${id} not found`);

  const updated: Note = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await db.notes.put(updated);
  await logActivity('updated_note', 'note', `Updated note "${updated.title}"`, id);
  realtimeSync.broadcast('notes', 'update', updated);
  return updated;
}

export async function deleteNote(id: string): Promise<void> {
  const existing = await db.notes.get(id);
  if (existing) {
    await db.notes.delete(id);
    await logActivity('deleted_note', 'note', `Deleted note "${existing.title}"`, id);
    realtimeSync.broadcast('notes', 'delete', existing);
  }
}
