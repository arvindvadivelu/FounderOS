import { db } from '../db';
import type { AIProvider, AIConversation, AIMessage } from '../../types';

export async function getAllAIProviders(): Promise<AIProvider[]> {
  return await db.aiProviders.toArray();
}

export async function getAIProviderById(id: string): Promise<AIProvider | undefined> {
  return await db.aiProviders.get(id);
}

export async function getDefaultAIProvider(): Promise<AIProvider | undefined> {
  const all = await db.aiProviders.toArray();
  return all.find((p) => p.isDefault) || all[0];
}

export async function saveAIProvider(data: Partial<AIProvider> & { id?: string }): Promise<AIProvider> {
  const now = new Date().toISOString();
  const id = data.id || `provider_${Date.now()}`;
  
  // If setting as default, unset others
  if (data.isDefault) {
    const all = await db.aiProviders.toArray();
    for (const p of all) {
      if (p.id !== id && p.isDefault) {
        await db.aiProviders.update(p.id, { isDefault: false });
      }
    }
  }

  const existing = await db.aiProviders.get(id);
  const provider: AIProvider = {
    id,
    name: data.name || 'AI Provider',
    type: data.type || 'openrouter',
    baseUrl: data.baseUrl || 'https://openrouter.ai/api/v1',
    apiKey: data.apiKey !== undefined ? data.apiKey : existing?.apiKey || '',
    model: data.model || existing?.model || 'anthropic/claude-3.7-sonnet',
    organizationId: data.organizationId || existing?.organizationId,
    temperature: data.temperature !== undefined ? data.temperature : existing?.temperature ?? 0.2,
    maxTokens: data.maxTokens || existing?.maxTokens || 4096,
    customHeaders: data.customHeaders || existing?.customHeaders || {},
    isDefault: data.isDefault !== undefined ? data.isDefault : existing?.isDefault ?? true,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  await db.aiProviders.put(provider);
  return provider;
}

export async function deleteAIProvider(id: string): Promise<void> {
  const existing = await db.aiProviders.get(id);
  await db.aiProviders.delete(id);
  if (existing?.isDefault) {
    const remaining = await db.aiProviders.toArray();
    if (remaining.length > 0) {
      await db.aiProviders.update(remaining[0].id, { isDefault: true });
    }
  }
}

export async function setDefaultAIProvider(id: string): Promise<void> {
  const all = await db.aiProviders.toArray();
  for (const p of all) {
    await db.aiProviders.update(p.id, { isDefault: p.id === id });
  }
}

// Conversations & Messages
export async function getAllConversations(): Promise<AIConversation[]> {
  const list = await db.aiConversations.toArray();
  return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function createConversation(title: string = 'New Conversation', providerId?: string, model?: string): Promise<AIConversation> {
  const now = new Date().toISOString();
  const conv: AIConversation = {
    id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title,
    providerId,
    model,
    createdAt: now,
    updatedAt: now,
  };
  await db.aiConversations.put(conv);
  return conv;
}

export async function deleteConversation(id: string): Promise<void> {
  await db.aiConversations.delete(id);
  await db.aiMessages.where('conversationId').equals(id).delete();
}

export async function getMessagesByConversation(conversationId: string): Promise<AIMessage[]> {
  const list = await db.aiMessages.where('conversationId').equals(conversationId).toArray();
  return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function saveAIMessage(data: Omit<AIMessage, 'id' | 'createdAt'>): Promise<AIMessage> {
  const message: AIMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...data,
    createdAt: new Date().toISOString(),
  };

  await db.aiMessages.put(message);
  await db.aiConversations.update(data.conversationId, {
    updatedAt: new Date().toISOString(),
  });
  return message;
}

export async function updateAIMessage(id: string, updates: Partial<AIMessage>): Promise<AIMessage> {
  const existing = await db.aiMessages.get(id);
  if (!existing) throw new Error(`Message ${id} not found`);

  const updated: AIMessage = {
    ...existing,
    ...updates,
  };
  await db.aiMessages.put(updated);
  return updated;
}
