import type { IntegrationConfig, ExternalSyncItem } from '../types';
import type { IntegrationAdapter, TestConnectionResult, SyncResult } from './types';
import { sanitizeExternalText } from './sanitizer';

export class GmailAdapter implements IntegrationAdapter {
  provider = 'gmail' as const;

  private getHeaders(token: string) {
    return {
      Authorization: `Bearer ${token.trim()}`,
      Accept: 'application/json',
    };
  }

  async testConnection(config: IntegrationConfig): Promise<TestConnectionResult> {
    const token = config.apiKeyOrToken;
    if (!token || !token.trim()) {
      return {
        success: false,
        message: 'Gmail OAuth Access Token is required.',
      };
    }

    const tStart = performance.now();
    try {
      // Test fetching Gmail user profile
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: this.getHeaders(token),
      });

      const latencyMs = Math.round(performance.now() - tStart);

      if (res.status === 401) {
        return {
          success: false,
          message: 'Invalid or expired Gmail access token. Please re-authenticate.',
          latencyMs,
        };
      }

      if (res.status === 403) {
        return {
          success: false,
          message: 'Gmail permission denied. Ensure https://www.googleapis.com/auth/gmail.readonly scope is granted.',
          latencyMs,
        };
      }

      if (!res.ok) {
        return {
          success: false,
          message: `Gmail API error (HTTP ${res.status}): ${res.statusText}`,
          latencyMs,
        };
      }

      const profile = await res.json();
      return {
        success: true,
        message: `Successfully connected to Gmail as ${profile.emailAddress}`,
        accountLabel: profile.emailAddress,
        latencyMs,
        details: {
          messagesTotal: profile.messagesTotal,
          threadsTotal: profile.threadsTotal,
          historyId: profile.historyId,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Network failure connecting to Gmail API: ${err?.message || 'Check your connection'}`,
        latencyMs: Math.round(performance.now() - tStart),
      };
    }
  }

  async sync(config: IntegrationConfig, lastSyncedAt?: string): Promise<SyncResult> {
    const token = config.apiKeyOrToken;
    if (!token) {
      return {
        success: false,
        items: [],
        itemsCount: 0,
        error: 'Missing Gmail access token',
      };
    }

    const items: ExternalSyncItem[] = [];
    const nowIso = new Date().toISOString();

    try {
      // Fetch recent messages list
      const listRes = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15&q=in:inbox',
        { headers: this.getHeaders(token) }
      );

      if (!listRes.ok) {
        if (listRes.status === 401) throw new Error('Invalid or expired Gmail token');
        if (listRes.status === 403) throw new Error('Gmail read permission denied');
        throw new Error(`Gmail sync failed (HTTP ${listRes.status})`);
      }

      const listData = await resListToJson(listRes);
      const messageRefs: any[] = listData.messages || [];

      // Fetch details for top messages
      for (const ref of messageRefs.slice(0, 12)) {
        try {
          const msgRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${ref.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
            { headers: this.getHeaders(token) }
          );

          if (msgRes.ok) {
            const msg = await msgRes.json();
            const headers = msg.payload?.headers || [];
            const subjectHeader = headers.find((h: any) => h.name?.toLowerCase() === 'subject')?.value || '(No Subject)';
            const fromHeader = headers.find((h: any) => h.name?.toLowerCase() === 'from')?.value || 'Unknown Sender';
            const dateHeader = headers.find((h: any) => h.name?.toLowerCase() === 'date')?.value || nowIso;

            const labelIds = msg.labelIds || [];
            const isUnread = labelIds.includes('UNREAD');
            const isImportant = labelIds.includes('IMPORTANT') || labelIds.includes('STARRED');

            items.push({
              id: `gmail_${msg.id}`,
              integrationId: 'gmail',
              provider: 'gmail',
              itemType: 'email',
              externalId: msg.id,
              title: sanitizeExternalText(subjectHeader),
              summary: sanitizeExternalText(msg.snippet || ''),
              status: isUnread ? 'unread' : 'read',
              author: sanitizeExternalText(fromHeader),
              timestamp: new Date(dateHeader).toISOString() || nowIso,
              metadata: {
                isImportant,
                isUnread,
                threadId: msg.threadId,
                labels: labelIds,
              },
              lastSyncedAt: nowIso,
            });
          }
        } catch {
          // Continue syncing other messages if single message fails
        }
      }

      return {
        success: true,
        items,
        itemsCount: items.length,
        syncSummary: `Successfully synchronized ${items.length} recent emails from Gmail.`,
      };
    } catch (err: any) {
      return {
        success: false,
        items: [],
        itemsCount: 0,
        error: err?.message || 'Failed to complete Gmail sync',
      };
    }
  }
}

async function resListToJson(res: Response): Promise<any> {
  return await res.json();
}
