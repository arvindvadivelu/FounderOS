import type { IntegrationConfig, ExternalSyncItem } from '../types';
import type { IntegrationAdapter, TestConnectionResult, SyncResult } from './types';
import { sanitizeExternalText } from './sanitizer';

export class GoogleCalendarAdapter implements IntegrationAdapter {
  provider = 'google-calendar' as const;

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
        message: 'Google Calendar OAuth Access Token or API Key is required.',
      };
    }

    const tStart = performance.now();
    try {
      // Test fetching primary calendar metadata
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
        headers: this.getHeaders(token),
      });

      const latencyMs = Math.round(performance.now() - tStart);

      if (res.status === 401) {
        return {
          success: false,
          message: 'Invalid or expired Google OAuth access token. Please re-authenticate via Google Identity Services.',
          latencyMs,
        };
      }

      if (res.status === 403) {
        return {
          success: false,
          message: 'Google Calendar permission denied. Ensure https://www.googleapis.com/auth/calendar.readonly scope is granted.',
          latencyMs,
        };
      }

      if (!res.ok) {
        return {
          success: false,
          message: `Google Calendar API error (HTTP ${res.status}): ${res.statusText}`,
          latencyMs,
        };
      }

      const calData = await res.json();
      return {
        success: true,
        message: `Successfully connected to Google Calendar (${calData.summary || calData.id})`,
        accountLabel: calData.id || config.accountEmail || 'Google Calendar Primary',
        latencyMs,
        details: {
          timeZone: calData.timeZone,
          summary: calData.summary,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Network failure connecting to Google Calendar API: ${err?.message || 'Check your connection'}`,
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
        error: 'Missing Google Calendar token',
      };
    }

    const items: ExternalSyncItem[] = [];
    const now = new Date();
    const nowIso = now.toISOString();
    // Look from 7 days ago to 30 days ahead
    const timeMin = new Date(now.getTime() - 7 * 86400000).toISOString();
    const timeMax = new Date(now.getTime() + 30 * 86400000).toISOString();

    try {
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
        timeMin
      )}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=50`;

      const res = await fetch(url, { headers: this.getHeaders(token) });

      if (!res.ok) {
        if (res.status === 401) throw new Error('Invalid or expired Google Calendar token');
        if (res.status === 403) throw new Error('Google Calendar permission denied');
        throw new Error(`Google Calendar sync failed (HTTP ${res.status})`);
      }

      const data = await res.json();
      const events: any[] = data.items || [];

      for (const event of events) {
        if (!event.id) continue;

        const start = event.start?.dateTime || event.start?.date || nowIso;
        const end = event.end?.dateTime || event.end?.date;
        const isAllDay = !event.start?.dateTime;
        const attendeesCount = (event.attendees || []).length;
        const meetLink = event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri || '';

        const isDeadline =
          (event.summary || '').toLowerCase().includes('deadline') ||
          (event.summary || '').toLowerCase().includes('due') ||
          (event.summary || '').toLowerCase().includes('launch');

        items.push({
          id: `gcal_${event.id}`,
          integrationId: 'google-calendar',
          provider: 'google-calendar',
          itemType: isDeadline ? 'deadline' : 'meeting',
          externalId: event.id,
          title: sanitizeExternalText(event.summary || '(No Title)'),
          summary: sanitizeExternalText(event.description || ''),
          status: event.status || 'confirmed',
          author: sanitizeExternalText(event.organizer?.email || 'organizer'),
          url: event.htmlLink || meetLink || undefined,
          timestamp: start,
          metadata: {
            start,
            end,
            isAllDay,
            meetLink,
            attendeesCount,
            location: sanitizeExternalText(event.location || ''),
          },
          lastSyncedAt: nowIso,
        });
      }

      return {
        success: true,
        items,
        itemsCount: items.length,
        syncSummary: `Successfully synchronized ${items.length} calendar events from Google Calendar.`,
      };
    } catch (err: any) {
      return {
        success: false,
        items: [],
        itemsCount: 0,
        error: err?.message || 'Failed to complete Google Calendar sync',
      };
    }
  }
}
