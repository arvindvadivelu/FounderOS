import { useEffect, useState } from 'react';

export type RealtimeOperation = 'create' | 'update' | 'delete';

export interface RealtimeEvent<T = any> {
  id: string;
  table: string;
  operation: RealtimeOperation;
  record?: T;
  timestamp: string;
  sourceTabId: string;
}

export type RealtimeEventListener = (event: RealtimeEvent) => void;

// Generate a unique ID for this browser tab or execution context
export const CURRENT_TAB_ID: string =
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `tab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const CHANNEL_NAME = 'founderos_realtime_bus';

class RealtimeSyncManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<RealtimeEventListener> = new Set();
  private isInitialized = false;
  private eventCount = 0;
  private lastEventTimestamp: string | null = null;
  private statusListeners: Set<(status: { isConnected: boolean; lastEventAt: string | null; eventCount: number }) => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    if (this.isInitialized) return;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        if (typeof (this.channel as any).unref === 'function') {
          (this.channel as any).unref();
        }
        this.channel.onmessage = (messageEvent: MessageEvent<RealtimeEvent>) => {
          const event = messageEvent.data;
          if (event && event.sourceTabId !== CURRENT_TAB_ID) {
            this.handleIncomingEvent(event);
          }
        };
      } catch (err) {
        console.warn('Realtime BroadcastChannel initialization failed:', err);
      }
    }
    this.isInitialized = true;
  }

  private handleIncomingEvent(event: RealtimeEvent) {
    this.eventCount++;
    this.lastEventTimestamp = event.timestamp;
    this.notifyStatusListeners();

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in realtime event listener:', err);
      }
    }
  }

  private notifyStatusListeners() {
    const status = {
      isConnected: Boolean(this.channel),
      lastEventAt: this.lastEventTimestamp,
      eventCount: this.eventCount,
    };
    for (const sl of this.statusListeners) {
      try {
        sl(status);
      } catch {
        // Safe swallow for unmounted listeners
      }
    }
  }

  /**
   * Broadcast an event to all other tabs and notify local subscribers
   */
  public broadcast<T = any>(table: string, operation: RealtimeOperation, record?: T): RealtimeEvent<T> {
    const event: RealtimeEvent<T> = {
      id: `rt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      table,
      operation,
      record,
      timestamp: new Date().toISOString(),
      sourceTabId: CURRENT_TAB_ID,
    };

    // Update local stats
    this.eventCount++;
    this.lastEventTimestamp = event.timestamp;
    this.notifyStatusListeners();

    // Broadcast across windows / tabs
    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch (err) {
        console.warn('Could not post to BroadcastChannel:', err);
      }
    }

    // Notify local listeners
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in local realtime event listener:', err);
      }
    }

    return event;
  }

  /**
   * Subscribe to real-time events from other tabs or this tab
   */
  public subscribe(listener: RealtimeEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Subscribe to connection status changes
   */
  public subscribeStatus(
    callback: (status: { isConnected: boolean; lastEventAt: string | null; eventCount: number }) => void
  ): () => void {
    this.statusListeners.add(callback);
    callback({
      isConnected: Boolean(this.channel),
      lastEventAt: this.lastEventTimestamp,
      eventCount: this.eventCount,
    });
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public getStatus() {
    return {
      isConnected: Boolean(this.channel),
      lastEventAt: this.lastEventTimestamp,
      eventCount: this.eventCount,
    };
  }

  public close() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
    this.statusListeners.clear();
    this.isInitialized = false;
  }
}

export const realtimeSync = new RealtimeSyncManager();

/**
 * React hook to observe real-time synchronization status
 */
export function useRealtimeSyncStatus() {
  const [status, setStatus] = useState(realtimeSync.getStatus());

  useEffect(() => {
    const unsubscribe = realtimeSync.subscribeStatus(setStatus);
    return unsubscribe;
  }, []);

  return status;
}

/**
 * React hook to listen for specific table real-time events
 */
export function useRealtimeTableEvents(table: string, onEvent: (event: RealtimeEvent) => void) {
  useEffect(() => {
    const unsubscribe = realtimeSync.subscribe((event) => {
      if (event.table === table) {
        onEvent(event);
      }
    });
    return unsubscribe;
  }, [table, onEvent]);
}
