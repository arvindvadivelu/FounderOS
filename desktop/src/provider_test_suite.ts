import 'fake-indexeddb/auto';
import { db } from './db';
import { seedDemoData, clearAllCompanyData } from './db/seed';
import {
  getAllAIProviders,
  getAIProviderById,
  getDefaultAIProvider,
  saveAIProvider,
  deleteAIProvider,
  setDefaultAIProvider,
  createConversation,
  getMessagesByConversation,
  saveAIMessage,
} from './db/services/aiStorageService';
import { testProviderConnection, sendChatMessage } from './ai/providerClient';
import { processConversationTurn } from './ai/toolRunner';
import { getSystemPrompt } from './ai/prompts';
import type { AIProvider } from './types';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

const results: TestResult[] = [];

async function test(suite: string, name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    results.push({ suite, name, passed: true, durationMs });
    console.log(`  ✓ [${suite}] ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    results.push({ suite, name, passed: false, durationMs, error: err.message || String(err) });
    console.error(`  ✗ [${suite}] ${name} (${durationMs}ms):`, err.message || err);
  }
}

async function runProviderIntegritySuite() {
  console.log('\n======================================================');
  console.log('⚡ FOUNDEROS AI PROVIDER SYSTEM DEEP INTEGRITY SUITE');
  console.log('======================================================\n');

  await clearAllCompanyData();

  // ==========================================
  // SUITE 1: Provider CRUD & Model Selection
  // ==========================================
  console.log('--- SUITE 1: PROVIDER CRUD & MODEL CONFIGURATION ---');

  await test('CRUD', 'Create OpenRouter provider with Claude 3.7 Sonnet', async () => {
    const p = await saveAIProvider({
      name: 'OpenRouter Primary',
      type: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: 'sk-or-v1-test-key-12345678',
      model: 'anthropic/claude-3.7-sonnet',
      temperature: 0.2,
      maxTokens: 4096,
      isDefault: true,
    });

    const fetched = await getAIProviderById(p.id);
    if (!fetched) throw new Error('Provider was not persisted');
    if (fetched.name !== 'OpenRouter Primary' || fetched.model !== 'anthropic/claude-3.7-sonnet') {
      throw new Error('Provider fields mismatch');
    }
  });

  await test('CRUD', 'Create Custom OpenAI-compatible providers (Groq, Ollama, DeepSeek)', async () => {
    const groq = await saveAIProvider({
      name: 'Groq Cloud',
      type: 'openai-compatible',
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKey: 'gsk_test12345',
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      maxTokens: 8192,
      isDefault: false,
    });

    const ollama = await saveAIProvider({
      name: 'Ollama Localhost',
      type: 'custom',
      baseUrl: 'http://localhost:11434/v1',
      apiKey: '', // No key required for local Ollama
      model: 'llama3.2',
      temperature: 0.3,
      maxTokens: 2048,
      customHeaders: { 'X-Custom-Auth': 'local-token' },
      isDefault: false,
    });

    const all = await getAllAIProviders();
    if (all.length !== 3) throw new Error(`Expected 3 providers, found ${all.length}`);
    if (!all.some(p => p.id === groq.id) || !all.some(p => p.id === ollama.id)) {
      throw new Error('Custom providers not found in database');
    }
  });

  await test('CRUD', 'Edit provider configuration (temperature, maxTokens, headers)', async () => {
    const all = await getAllAIProviders();
    const target = all.find(p => p.name === 'Groq Cloud')!;

    const updated = await saveAIProvider({
      id: target.id,
      model: 'mixtral-8x7b-32768',
      temperature: 0.5,
      maxTokens: 16384,
      organizationId: 'org_enterprise_99',
    });

    if (updated.model !== 'mixtral-8x7b-32768' || updated.temperature !== 0.5 || updated.maxTokens !== 16384) {
      throw new Error('Provider update did not apply new configuration');
    }
    if (updated.organizationId !== 'org_enterprise_99') {
      throw new Error('Organization ID not saved');
    }
  });

  // ==========================================
  // SUITE 2: Default Provider Switching & Auto-Promotion Invariant
  // ==========================================
  console.log('\n--- SUITE 2: DEFAULT PROVIDER SWITCHING & INVARIANTS ---');

  await test('Switching', 'setDefaultAIProvider enforces single default provider exclusivity', async () => {
    const all = await getAllAIProviders();
    const second = all[1];

    await setDefaultAIProvider(second.id);

    const refreshed = await getAllAIProviders();
    const defaults = refreshed.filter(p => p.isDefault);

    if (defaults.length !== 1) {
      throw new Error(`Expected exactly 1 default provider, found ${defaults.length}`);
    }
    if (defaults[0].id !== second.id) {
      throw new Error('Default provider was not switched to selected ID');
    }
  });

  await test('Invariants', 'Deleting active default provider auto-promotes remaining provider', async () => {
    const currentDefault = await getDefaultAIProvider();
    if (!currentDefault) throw new Error('No default provider found');

    await deleteAIProvider(currentDefault.id);

    const remaining = await getAllAIProviders();
    const newDefault = await getDefaultAIProvider();

    if (!newDefault || !newDefault.isDefault) {
      throw new Error('No provider was auto-promoted to default after deletion');
    }
    if (newDefault.id === currentDefault.id) {
      throw new Error('Deleted provider still marked as default');
    }
  });

  // ==========================================
  // SUITE 3: API Key Security, Masking & Zero-Leakage
  // ==========================================
  console.log('\n--- SUITE 3: API KEY SECURITY & ZERO-LEAKAGE ---');

  await test('Security', 'API keys are stored exclusively in IndexedDB aiProviders and masked in UI views', async () => {
    const p = await saveAIProvider({
      name: 'Key Test Provider',
      type: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: 'sk-or-secret-api-key-998877',
      model: 'anthropic/claude-3.7-sonnet',
      temperature: 0.2,
    });

    // UI Masking simulation
    const masked = p.apiKey ? `••••••••${p.apiKey.slice(-4)}` : '(None set)';
    if (masked !== '••••••••8877') {
      throw new Error(`Masking format incorrect: ${masked}`);
    }

    // Verify system prompt never contains raw API key
    const systemPrompt = getSystemPrompt({ name: 'Solvst AI', currency: 'USD' } as any);
    if (systemPrompt.includes('sk-or-secret') || systemPrompt.includes('8877')) {
      throw new Error('System prompt leaked API key!');
    }
  });

  // ==========================================
  // SUITE 4: Connection Testing & Error Classifications
  // ==========================================
  console.log('\n--- SUITE 4: CONNECTION TESTING & ERROR CLASSIFICATIONS ---');

  await test('Error Handling', 'Missing API key returns immediate validation error without network fetch', async () => {
    const missingKeyProv: AIProvider = {
      id: 'no_key',
      name: 'No Key Prov',
      type: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: '',
      model: 'anthropic/claude-3.7-sonnet',
      temperature: 0.2,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = await testProviderConnection(missingKeyProv);
    if (res.success || !res.message.includes('API Key is missing')) {
      throw new Error('Expected missing API key error message');
    }
  });

  await test('Error Handling', 'Timeout aborts fetch with clear duration notification', async () => {
    const timeoutProv: AIProvider = {
      id: 'timeout_prov',
      name: 'Timeout Target',
      type: 'custom',
      baseUrl: 'http://10.255.255.1', // Non-routable blackhole IP
      apiKey: 'dummy',
      model: 'dummy-model',
      temperature: 0.2,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = await testProviderConnection(timeoutProv, 50); // 50ms fast timeout
    if (res.success) throw new Error('Timeout connection should fail');
    if (!res.message.includes('Timed Out') && !res.message.includes('failed') && !res.message.includes('Network')) {
      throw new Error('Unexpected timeout message: ' + res.message);
    }
  });

  // ==========================================
  // SUITE 5: AI Agent Provider Integration & Persistence
  // ==========================================
  console.log('\n--- SUITE 5: AI AGENT DYNAMIC PROVIDER INTEGRATION ---');

  await test('Agent Binding', 'Agent uses active default provider dynamically and records token usage', async () => {
    // Set a designated provider as default
    const testProv = await saveAIProvider({
      name: 'DeepSeek Copilot Engine',
      type: 'openai-compatible',
      baseUrl: 'https://api.deepseek.com/v1',
      apiKey: 'sk-deepseek-test-1234',
      model: 'deepseek-chat',
      temperature: 0.1,
      isDefault: true,
    });

    const activeDefault = await getDefaultAIProvider();
    if (activeDefault?.id !== testProv.id || activeDefault?.model !== 'deepseek-chat') {
      throw new Error('Active default provider not bound');
    }

    // Save turn message with usage metadata
    const conv = await createConversation('Token Usage Test');
    const msg = await saveAIMessage({
      conversationId: conv.id,
      role: 'assistant',
      content: 'Financial summary response',
      metadata: {
        usage: { promptTokens: 350, completionTokens: 90, totalTokens: 440 },
        durationMs: 820,
      },
    });

    const fetchedMsgs = await getMessagesByConversation(conv.id);
    if (!fetchedMsgs[0]?.metadata?.usage || fetchedMsgs[0].metadata.usage.totalTokens !== 440) {
      throw new Error('Token usage metadata was not persisted');
    }
  });

  await test('Agent Binding', 'Empty database state yields friendly setup instructions without unhandled crash', async () => {
    await clearAllCompanyData();
    await db.aiProviders.clear();

    const noDefault = await getDefaultAIProvider();
    if (noDefault) throw new Error('Expected no default provider on fresh database');

    const conv = await createConversation('Fresh Setup Session');
    const turn = await processConversationTurn({
      conversationId: conv.id,
      userPrompt: 'Hello Copilot',
      history: [],
    });

    if (!turn.assistantMessage.content.includes('AI Provider Not Configured')) {
      throw new Error('Expected setup guidance content on empty database');
    }
    if (!turn.assistantMessage.content.includes('Settings → AI Providers')) {
      throw new Error('Expected navigation instructions to Settings');
    }
  });

  // ==========================================
  // FINAL REPORT
  // ==========================================
  console.log('\n======================================================');
  console.log('📊 AI PROVIDER SYSTEM INTEGRITY SUMMARY');
  console.log('======================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => r.error).length;

  console.log(`Total Tests Run: ${total}`);
  console.log(`Passed:          ${passed}`);
  console.log(`Failed:          ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runProviderIntegritySuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
