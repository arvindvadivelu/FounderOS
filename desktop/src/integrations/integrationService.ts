import { db } from '../db';
import type {
  IntegrationRecord,
  ExternalSyncItem,
  SyncLog,
  IntegrationProvider,
  IntegrationConfig,
} from '../types';
import { GitHubAdapter } from './githubAdapter';
import { GoogleCalendarAdapter } from './googleCalendarAdapter';
import { GmailAdapter } from './gmailAdapter';
import { PaymentAdapter } from './paymentAdapter';
import type { IntegrationAdapter, TestConnectionResult, SyncResult } from './types';
import { sanitizeExternalRecord } from './sanitizer';

// Adapter instance registry
const adapters: Record<IntegrationProvider, IntegrationAdapter> = {
  github: new GitHubAdapter(),
  'google-calendar': new GoogleCalendarAdapter(),
  gmail: new GmailAdapter(),
  stripe: new PaymentAdapter('stripe'),
  razorpay: new PaymentAdapter('razorpay'),
};

export const DEFAULT_INTEGRATIONS: IntegrationRecord[] = [
  {
    id: 'github',
    provider: 'github',
    name: 'GitHub',
    category: 'development',
    authType: 'token',
    status: 'disconnected',
    requiresBackend: false,
    description: 'Sync repositories, issues, pull requests, commits, and engineering velocity.',
    capabilities: ['Repositories', 'Issues & PRs', 'Commits', 'Releases', 'Engineering Velocity'],
    requiredScopes: ['repo (Full control of private repositories)', 'read:user (Read user profile data)'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'google-calendar',
    provider: 'google-calendar',
    name: 'Google Calendar',
    category: 'calendar',
    authType: 'oauth2',
    status: 'disconnected',
    requiresBackend: false,
    description: 'Sync meetings, daily schedules, customer demos, and executive deadlines.',
    capabilities: ['Today Agenda', 'Upcoming Meetings', 'Deadlines', 'Google Meet Links'],
    requiredScopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'gmail',
    provider: 'gmail',
    name: 'Gmail',
    category: 'email',
    authType: 'oauth2',
    status: 'disconnected',
    requiresBackend: false,
    description: 'Read-only synchronization of important inbound emails, customer replies, and alerts.',
    capabilities: ['Recent Emails', 'Important / Starred Feed', 'Sender & Subject Tracking (Read-Only)'],
    requiredScopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'stripe',
    provider: 'stripe',
    name: 'Stripe Payments',
    category: 'payments',
    authType: 'sandbox',
    status: 'disconnected',
    requiresBackend: true,
    backendNotice: 'Live Secret Keys (sk_live_...) require a backend proxy to prevent credential exfiltration. Use Sandbox Mode or Export Sync for frontend operation.',
    description: 'Synchronize MRR, subscription renewals, customer charges, and refund metrics.',
    capabilities: ['MRR / ARR Inflow', 'Customer Charges', 'Subscription Status', 'Refunds & Disputes'],
    requiredScopes: ['Read-only Financial Feed (Sandbox / Export mode)'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'razorpay',
    provider: 'razorpay',
    name: 'Razorpay',
    category: 'payments',
    authType: 'sandbox',
    status: 'disconnected',
    requiresBackend: true,
    backendNotice: 'Direct Key Secret requires a backend proxy for security. Use Sandbox Mode for frontend operation.',
    description: 'Synchronize payments, orders, customer transactions, and international transfers.',
    capabilities: ['Payments & Invoices', 'Settlements', 'Subscription Billing'],
    requiredScopes: ['Read-only Payment Feed (Sandbox / Export mode)'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Retrieves all registered integrations merged with stored configurations in IndexedDB
 */
export async function getAllIntegrations(): Promise<IntegrationRecord[]> {
  try {
    const stored = await db.integrations.toArray();
    const storedMap = new Map(stored.map((item) => [item.id, item]));

    return DEFAULT_INTEGRATIONS.map((def) => {
      const existing = storedMap.get(def.id);
      if (existing) {
        return {
          ...def,
          ...existing,
          capabilities: def.capabilities,
          requiredScopes: def.requiredScopes,
        };
      }
      return def;
    });
  } catch (err) {
    console.warn('Failed to load integrations from IndexedDB:', err);
    return DEFAULT_INTEGRATIONS;
  }
}

/**
 * Retrieves single integration by ID
 */
export async function getIntegrationById(id: string): Promise<IntegrationRecord | undefined> {
  const all = await getAllIntegrations();
  return all.find((i) => i.id === id);
}

/**
 * Tests connection with the given credentials before committing
 */
export async function testIntegrationConnection(
  provider: IntegrationProvider,
  config: IntegrationConfig
): Promise<TestConnectionResult> {
  const adapter = adapters[provider];
  if (!adapter) {
    return {
      success: false,
      message: `No adapter found for provider "${provider}"`,
    };
  }

  return await adapter.testConnection(config);
}

/**
 * Saves/updates an integration configuration in IndexedDB
 */
export async function saveIntegration(record: Partial<IntegrationRecord> & { id: string; provider: IntegrationProvider }): Promise<IntegrationRecord> {
  const existing = (await db.integrations.get(record.id)) || DEFAULT_INTEGRATIONS.find((d) => d.id === record.id);
  const updated: IntegrationRecord = {
    ...(existing as IntegrationRecord),
    ...record,
    updatedAt: new Date().toISOString(),
  };

  await db.integrations.put(updated);
  return updated;
}

/**
 * Synchronizes an integration idempotently into IndexedDB
 */
export async function syncIntegration(
  integrationId: string,
  options: { force?: boolean } = {}
): Promise<{ success: boolean; itemsCount: number; error?: string }> {
  const integration = await getIntegrationById(integrationId);
  if (!integration) {
    return { success: false, itemsCount: 0, error: `Integration "${integrationId}" not found` };
  }

  if (integration.status !== 'connected' && !options.force && !integration.config?.apiKeyOrToken && !integration.config?.options?.useSandbox) {
    return { success: false, itemsCount: 0, error: 'Integration is not connected' };
  }

  const adapter = adapters[integration.provider];
  if (!adapter) {
    return { success: false, itemsCount: 0, error: `Adapter for "${integration.provider}" not implemented` };
  }

  const startTime = performance.now();
  const config = integration.config || {};

  // Set syncing status
  await db.integrations.update(integration.id, {
    status: 'syncing',
    lastSyncStatus: 'in_progress',
  });

  try {
    const result = await adapter.sync(config, integration.lastSyncedAt);
    const durationMs = Math.round(performance.now() - startTime);

    if (!result.success) {
      throw new Error(result.error || 'Sync failed');
    }

    let itemsCreated = 0;
    let itemsUpdated = 0;

    // Idempotent upsert into IndexedDB
    for (const rawItem of result.items) {
      const item = sanitizeExternalRecord(rawItem);
      const existing = await db.externalSyncItems.get(item.id);
      if (existing) {
        itemsUpdated++;
        await db.externalSyncItems.put({
          ...existing,
          ...item,
          // Preserve any local user tags or notes attached to the external item
          metadata: {
            ...existing.metadata,
            ...item.metadata,
          },
          lastSyncedAt: new Date().toISOString(),
        });
      } else {
        itemsCreated++;
        await db.externalSyncItems.put(item);
      }
    }

    const totalCount = await db.externalSyncItems.where('integrationId').equals(integrationId).count();

    // Log the synchronization event
    const log: SyncLog = {
      id: `sync_log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      integrationId,
      provider: integration.provider,
      status: 'success',
      itemsSynced: result.itemsCount,
      itemsCreated,
      itemsUpdated,
      itemsSkipped: 0,
      durationMs,
      createdAt: new Date().toISOString(),
    };
    await db.syncLogs.put(log);

    // Update integration metadata
    await db.integrations.update(integration.id, {
      status: 'connected',
      lastSyncedAt: new Date().toISOString(),
      lastSyncStatus: 'success',
      lastError: undefined,
      syncStats: {
        totalItems: totalCount,
        lastItemsSynced: result.itemsCount,
        lastSyncDurationMs: durationMs,
      },
    });

    return { success: true, itemsCount: result.itemsCount };
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - startTime);
    const errorMsg = err?.message || 'Unknown sync error';

    // Log the failed sync event
    const log: SyncLog = {
      id: `sync_log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      integrationId,
      provider: integration.provider,
      status: 'failed',
      itemsSynced: 0,
      itemsCreated: 0,
      itemsUpdated: 0,
      itemsSkipped: 0,
      durationMs,
      error: errorMsg,
      createdAt: new Date().toISOString(),
    };
    await db.syncLogs.put(log);

    await db.integrations.update(integration.id, {
      status: 'error',
      lastSyncStatus: 'failed',
      lastError: errorMsg,
    });

    return { success: false, itemsCount: 0, error: errorMsg };
  }
}

/**
 * Synchronizes all currently connected integrations
 */
export async function syncAllIntegrations(): Promise<Record<string, { success: boolean; itemsCount: number }>> {
  const integrations = await getAllIntegrations();
  const connected = integrations.filter((i) => i.status === 'connected');
  const results: Record<string, { success: boolean; itemsCount: number }> = {};

  for (const item of connected) {
    const res = await syncIntegration(item.id);
    results[item.id] = res;
  }

  return results;
}

/**
 * Disconnects an integration and clears credentials
 */
export async function disconnectIntegration(id: string, purgeData = false): Promise<void> {
  const existing = await db.integrations.get(id);
  if (!existing) return;

  await db.integrations.update(id, {
    status: 'disconnected',
    config: {
      ...existing.config,
      apiKeyOrToken: undefined,
      clientId: undefined,
      clientSecret: undefined,
    },
    lastError: undefined,
  });

  if (purgeData) {
    await db.externalSyncItems.where('integrationId').equals(id).delete();
  }
}

/**
 * Retrieves synchronized external items with optional filters
 */
export async function getExternalSyncItems(filters?: {
  integrationId?: string;
  provider?: IntegrationProvider;
  itemType?: string;
  limit?: number;
}): Promise<ExternalSyncItem[]> {
  try {
    let query = db.externalSyncItems.toCollection();

    if (filters?.integrationId) {
      query = db.externalSyncItems.where('integrationId').equals(filters.integrationId);
    } else if (filters?.provider) {
      query = db.externalSyncItems.where('provider').equals(filters.provider);
    } else if (filters?.itemType) {
      query = db.externalSyncItems.where('itemType').equals(filters.itemType);
    }

    const items = await query.reverse().sortBy('timestamp');
    if (filters?.limit) {
      return items.slice(0, filters.limit);
    }
    return items;
  } catch (err) {
    console.warn('Failed to query external sync items:', err);
    return [];
  }
}

/**
 * Retrieves sync audit history logs
 */
export async function getSyncLogs(integrationId?: string, limit = 20): Promise<SyncLog[]> {
  try {
    let collection = db.syncLogs.toCollection();
    if (integrationId) {
      collection = db.syncLogs.where('integrationId').equals(integrationId);
    }
    const logs = await collection.reverse().sortBy('createdAt');
    return logs.slice(0, limit);
  } catch (err) {
    console.warn('Failed to query sync logs:', err);
    return [];
  }
}

/**
 * Returns overall integration health statistics
 */
export async function getOverallIntegrationsHealth(): Promise<{
  totalCount: number;
  connectedCount: number;
  errorCount: number;
  syncingCount: number;
  totalItemsSynced: number;
  lastSyncAt?: string;
}> {
  const list = await getAllIntegrations();
  const connected = list.filter((i) => i.status === 'connected');
  const error = list.filter((i) => i.status === 'error');
  const syncing = list.filter((i) => i.status === 'syncing');
  const totalItems = await db.externalSyncItems.count();

  let latestSync: string | undefined;
  for (const item of list) {
    if (item.lastSyncedAt) {
      if (!latestSync || new Date(item.lastSyncedAt) > new Date(latestSync)) {
        latestSync = item.lastSyncedAt;
      }
    }
  }

  return {
    totalCount: list.length,
    connectedCount: connected.length,
    errorCount: error.length,
    syncingCount: syncing.length,
    totalItemsSynced: totalItems,
    lastSyncAt: latestSync,
  };
}
