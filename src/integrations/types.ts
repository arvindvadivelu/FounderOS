import type {
  IntegrationRecord,
  ExternalSyncItem,
  IntegrationConfig,
  IntegrationProvider,
  SyncLog,
} from '../types';

export interface TestConnectionResult {
  success: boolean;
  message: string;
  accountLabel?: string;
  latencyMs?: number;
  rateLimitRemaining?: number;
  rateLimitReset?: string;
  details?: Record<string, any>;
  requiresBackend?: boolean;
}

export interface SyncResult {
  success: boolean;
  items: ExternalSyncItem[];
  itemsCount: number;
  error?: string;
  rateLimitRemaining?: number;
  syncSummary?: string;
}

export interface IntegrationAdapter {
  provider: IntegrationProvider;
  testConnection(config: IntegrationConfig): Promise<TestConnectionResult>;
  sync(config: IntegrationConfig, lastSyncedAt?: string): Promise<SyncResult>;
}
