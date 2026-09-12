import { useState, useEffect } from 'react';
import { processConversationTurn } from './toolRunner';
import { getMessagesByConversation } from '../db/services/aiStorageService';
import type { AIMessage, AIToolCall } from '../types';

export interface ActiveExecutionState {
  conversationId: string;
  userPrompt: string;
  status: string;
  startTime: number;
  error?: string;
}

export interface TurnExecutionResult {
  assistantMessage: AIMessage;
  proposedActions?: AIToolCall[];
}

export interface StartTurnParams {
  conversationId: string;
  userPrompt: string;
  history?: AIMessage[];
}

type Listener = () => void;

class AIChatService {
  private activeExecutions: Map<string, ActiveExecutionState> = new Map();
  private executionPromises: Map<string, Promise<TurnExecutionResult>> = new Map();
  private listeners: Set<Listener> = new Set();

  /**
   * Subscribe to background chat execution state changes.
   */
  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error('Error notifying AIChatService listener:', err);
      }
    }
  }

  /**
   * Check if a specific conversation is actively processing a turn.
   */
  public isConversationActive(conversationId: string): boolean {
    return this.activeExecutions.has(conversationId);
  }

  /**
   * Get the active execution details for a conversation.
   */
  public getActiveExecution(conversationId: string): ActiveExecutionState | undefined {
    return this.activeExecutions.get(conversationId);
  }

  /**
   * Check if ANY conversation is currently running in the background.
   */
  public hasAnyActive(): boolean {
    return this.activeExecutions.size > 0;
  }

  /**
   * Get all actively running executions.
   */
  public getAllActive(): ActiveExecutionState[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Starts or attaches to a background conversation turn.
   * Runs independently of any React component lifecycle.
   */
  public startConversationTurn(params: StartTurnParams): Promise<TurnExecutionResult> {
    const { conversationId, userPrompt } = params;
    if (!conversationId || !userPrompt.trim()) {
      return Promise.reject(new Error('Valid conversationId and non-empty userPrompt are required'));
    }

    // If already actively running for this conversation, return the active promise
    const existingPromise = this.executionPromises.get(conversationId);
    if (existingPromise) {
      return existingPromise;
    }

    const state: ActiveExecutionState = {
      conversationId,
      userPrompt,
      status: 'Connecting to AI CEO...',
      startTime: Date.now(),
    };

    this.activeExecutions.set(conversationId, state);
    this.notify();

    const turnPromise = (async () => {
      try {
        // Guarantee complete conversation history from Dexie if not supplied
        let history = params.history;
        if (!history || history.length === 0) {
          history = await getMessagesByConversation(conversationId);
        }

        const result = await processConversationTurn({
          conversationId,
          userPrompt,
          history,
          onProgress: (progressStatus: string) => {
            const current = this.activeExecutions.get(conversationId);
            if (current) {
              current.status = progressStatus;
              this.notify();
            }
          },
        });

        return result;
      } catch (err: any) {
        console.error(`AI background execution failed for conversation ${conversationId}:`, err);
        const current = this.activeExecutions.get(conversationId);
        if (current) {
          current.error = err?.message || 'Execution failed';
          current.status = `Error: ${current.error}`;
          this.notify();
        }
        throw err;
      } finally {
        // Clean up from active registry
        this.activeExecutions.delete(conversationId);
        this.executionPromises.delete(conversationId);
        this.notify();
      }
    })();

    this.executionPromises.set(conversationId, turnPromise);
    return turnPromise;
  }
}

// Global Singleton Instance
export const aiChatService = new AIChatService();

/**
 * React hook to reactively subscribe to AI background execution state.
 * Pass a conversationId to track a specific thread, or omit to track global state.
 */
export function useAIChatState(conversationId?: string) {
  const [, setTick] = useState<number>(0);

  useEffect(() => {
    // Re-render when any background execution state changes
    const unsubscribe = aiChatService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const anyActive = aiChatService.hasAnyActive();
  const allActive = aiChatService.getAllActive();

  const isActive = conversationId ? aiChatService.isConversationActive(conversationId) : anyActive;
  const activeState = conversationId
    ? aiChatService.getActiveExecution(conversationId)
    : allActive[0];

  const status = activeState?.status || '';

  return {
    isActive,
    activeState,
    anyActive,
    allActive,
    status,
    startTurn: (params: StartTurnParams) => aiChatService.startConversationTurn(params),
  };
}
