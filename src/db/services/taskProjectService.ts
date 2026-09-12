import { db } from '../db';
import type { Task, Project } from '../../types';
import { logActivity } from './activityService';

export async function getAllProjects(): Promise<Project[]> {
  return await db.projects.toArray();
}

export async function createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  const now = new Date().toISOString();
  const project: Project = {
    id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  await db.projects.put(project);
  await logActivity('created_project', 'project', `Created project "${project.name}"`, project.id);
  return project;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project> {
  const existing = await db.projects.get(id);
  if (!existing) throw new Error(`Project ${id} not found`);

  const updated: Project = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await db.projects.put(updated);
  await logActivity('updated_project', 'project', `Updated project "${updated.name}" (${updated.progress}% done)`, id);
  return updated;
}

export async function deleteProject(id: string): Promise<void> {
  const existing = await db.projects.get(id);
  if (existing) {
    await db.projects.delete(id);

    // Unlink dependent tasks, features, and bugs so they remain accessible in backlog
    const tasks = await db.tasks.where('projectId').equals(id).toArray();
    for (const t of tasks) {
      await db.tasks.update(t.id, { projectId: undefined, projectName: undefined });
    }
    const features = await db.features.where('projectId').equals(id).toArray();
    for (const f of features) {
      await db.features.update(f.id, { projectId: undefined });
    }
    const bugs = await db.bugs.where('projectId').equals(id).toArray();
    for (const b of bugs) {
      await db.bugs.update(b.id, { projectId: undefined });
    }

    await logActivity('deleted_project', 'project', `Deleted project "${existing.name}"`, id);
  }
}

export async function getAllTasks(): Promise<Task[]> {
  const list = await db.tasks.toArray();
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
  const now = new Date().toISOString();
  const task: Task = {
    id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...data,
    tags: data.tags || [],
    createdAt: now,
    updatedAt: now,
    completedAt: data.status === 'done' ? now : undefined,
  };

  await db.tasks.put(task);
  await logActivity('created_task', 'task', `Created task "${task.title}"`, task.id);
  return task;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  const existing = await db.tasks.get(id);
  if (!existing) throw new Error(`Task with ID ${id} not found`);

  const isMarkingDone = updates.status === 'done' && existing.status !== 'done';
  const now = new Date().toISOString();

  const updated: Task = {
    ...existing,
    ...updates,
    completedAt: isMarkingDone ? now : updates.status && updates.status !== 'done' ? undefined : existing.completedAt,
    updatedAt: now,
  };

  await db.tasks.put(updated);
  if (isMarkingDone) {
    await logActivity('completed_task', 'task', `Completed task "${updated.title}"`, id);
  } else {
    await logActivity('updated_task', 'task', `Updated task "${updated.title}" (${updated.status})`, id);
  }
  return updated;
}

export async function deleteTask(id: string): Promise<void> {
  const existing = await db.tasks.get(id);
  if (existing) {
    await db.tasks.delete(id);
    await logActivity('deleted_task', 'task', `Deleted task "${existing.title}"`, id);
  }
}
