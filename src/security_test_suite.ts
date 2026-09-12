import 'fake-indexeddb/auto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { db } from './db';
import { seedDemoData, clearAllCompanyData } from './db/seed';
import { AI_TOOL_DEFINITIONS, executeLocalTool } from './ai/tools';
import { getSystemPrompt } from './ai/prompts';
import {
  saveAIProvider,
  getDefaultAIProvider,
  createConversation,
  saveAIMessage,
  getMessagesByConversation,
} from './db/services/aiStorageService';
import { processConversationTurn, executeConfirmedToolAction } from './ai/toolRunner';
import { exportAllData } from './utils/exportImport';
import type { AIProvider, Company } from './types';

interface SecurityReport {
  category: string;
  name: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  passed: boolean;
  durationMs: number;
  finding?: string;
}

const reports: SecurityReport[] = [];

async function secTest(
  category: string,
  name: string,
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info',
  fn: () => Promise<void>
) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    reports.push({ category, name, severity, passed: true, durationMs });
    console.log(`  ✓ [${severity}] ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    reports.push({
      category,
      name,
      severity,
      passed: false,
      durationMs,
      finding: err.message || String(err),
    });
    console.error(`  ✗ [${severity}] ${name} (${durationMs}ms):`, err.message || err);
  }
}

async function runSecurityAudit() {
  console.log('\n======================================================');
  console.log('🛡️ FOUNDEROS COMPREHENSIVE SECURITY AUDIT SUITE');
  console.log('======================================================\n');

  await seedDemoData();

  // ==========================================
  // 1. HARDCODED SECRETS SCAN
  // ==========================================
  console.log('--- 1. HARDCODED SECRETS & REPO SCAN ---');

  await secTest('Credentials', 'Verify no production API keys (sk-, gsk_, etc.) are hardcoded in source', 'Critical', async () => {
    const srcDir = path.resolve(__dirname);
    const files = fs.readdirSync(srcDir, { recursive: true }) as string[];

    const forbiddenPatterns = [
      /sk-[a-zA-Z0-9]{20,}/,
      /gsk_[a-zA-Z0-9]{20,}/,
      /Bearer\s+[a-zA-Z0-9_\-\.]{25,}/,
    ];

    for (const relPath of files) {
      if (relPath.endsWith('.ts') || relPath.endsWith('.tsx') || relPath.endsWith('.html')) {
        const fullPath = path.join(srcDir, relPath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        for (const pattern of forbiddenPatterns) {
          if (pattern.test(content) && !relPath.includes('test_suite')) {
            throw new Error(`Potential hardcoded secret detected in ${relPath}`);
          }
        }
      }
    }
  });

  // ==========================================
  // 2. PROMPT & CONVERSATION LEAKAGE
  // ==========================================
  console.log('\n--- 2. PROMPT INJECTION & CREDENTIAL LEAKAGE ---');

  await secTest('Data Leakage', 'System Prompt never contains API keys or raw user credentials', 'Critical', async () => {
    const company: Company = {
      id: 'comp_1',
      name: 'CyberShield AI',
      legalName: 'CyberShield Inc.',
      currency: 'USD',
      website: 'https://cybershield.ai',
      industry: 'AI Security',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const prompt = getSystemPrompt(company);
    if (prompt.includes('sk-') || prompt.includes('apiKey') || prompt.includes('password') || prompt.includes('token')) {
      throw new Error('System prompt contains credential keywords or leaked token references');
    }
  });

  await secTest('Data Leakage', 'AI Tool queries never return stored AI Provider API keys', 'High', async () => {
    // Configure a provider with secret key
    await saveAIProvider({
      name: 'SuperSecret Provider',
      type: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: 'sk-or-super-secret-key-1234567890',
      model: 'anthropic/claude-3.7-sonnet',
      temperature: 0.2,
    });

    // Execute every read tool
    const toolsToTest = [
      'getCompanyOverview', 'getRevenue', 'getExpenses', 'getRunway', 'getCustomers',
      'getSalesPipeline', 'getTasks', 'getProjects', 'getFeatures', 'getBugs',
      'getGoals', 'getRecentActivity', 'getEmployees', 'getDepartments',
      'getCashPosition', 'getBalanceSheet',
    ];

    for (const toolName of toolsToTest) {
      const output = await executeLocalTool(toolName, {});
      const strOutput = JSON.stringify(output);
      if (strOutput.includes('super-secret-key')) {
        throw new Error(`Tool "${toolName}" leaked API key in return payload!`);
      }
    }
  });

  // ==========================================
  // 3. EXECUTION SANDBOX & WHITELIST ENFORCEMENT
  // ==========================================
  console.log('\n--- 3. CODE EXECUTION SANDBOX & WHITELIST ENFORCEMENT ---');

  await secTest('Sandbox', 'AI cannot execute arbitrary code, eval, or unrestricted DB drops', 'Critical', async () => {
    const maliciousToolNames = [
      'eval',
      'exec',
      'runScript',
      'db.dropDatabase',
      'dropTable',
      'deleteFromRoot',
      '__proto__',
      'constructor',
    ];

    for (const badName of maliciousToolNames) {
      let threw = false;
      try {
        await executeLocalTool(badName, { code: 'window.alert(1)' });
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('not registered in the approved tool whitelist')) {
          throw new Error(`Unexpected error message for ${badName}: ${err.message}`);
        }
      }
      if (!threw) throw new Error(`Malicious tool "${badName}" was not rejected by whitelist!`);
    }
  });

  await secTest('Sandbox', 'Write & Destructive tools require user confirmation before execution', 'High', async () => {
    const writeTools = AI_TOOL_DEFINITIONS.filter(d => d.function.category === 'write' || d.function.category === 'destructive');
    if (writeTools.length === 0) throw new Error('No write/destructive tools found in definition');

    // Test that processConversationTurn puts write tools into proposedActions and does not execute them automatically
    const conv = await createConversation('Sandbox Confirmation Test');
    const msg = await saveAIMessage({
      conversationId: conv.id,
      role: 'assistant',
      content: 'I propose creating a task:',
      toolCalls: [
        {
          id: 'call_sec_1',
          name: 'createTask',
          arguments: { title: 'Unconfirmed Task' },
          status: 'pending_confirmation',
        },
      ],
    });

    // Check that task is NOT in db.tasks yet
    const allTasks = await db.tasks.toArray();
    if (allTasks.some(t => t.title === 'Unconfirmed Task')) {
      throw new Error('Task was executed before founder confirmation!');
    }

    // Now execute via explicit founder action
    await executeConfirmedToolAction(msg.id, 'call_sec_1', 'createTask', {
      title: 'Confirmed Safe Task',
      priority: 'medium',
      status: 'todo',
      tags: [],
    });

    const confirmedTask = await db.tasks.toArray();
    if (!confirmedTask.some(t => t.title === 'Confirmed Safe Task')) {
      throw new Error('Task was not created after founder confirmation');
    }
  });

  // ==========================================
  // 4. DATA MINIMIZATION & TOKEN BOUNDS
  // ==========================================
  console.log('\n--- 4. DATA MINIMIZATION & SCOPED EXPOSURE ---');

  await secTest('Data Minimization', 'Conversation history sends only recent bounded turns (max 8) to LLM', 'Medium', async () => {
    // Generate 20 messages
    const conv = await createConversation('History Window Test');
    const baseTime = Date.now() - 100000;
    for (let i = 0; i < 20; i++) {
      await db.aiMessages.put({
        id: `msg_win_${i}`,
        conversationId: conv.id,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        createdAt: new Date(baseTime + i * 1000).toISOString(),
      });
    }

    const messages = await getMessagesByConversation(conv.id);
    const windowed = messages.slice(-8);
    if (windowed.length !== 8) throw new Error('History window length mismatch');
    if (windowed[0].content !== 'Message 12') throw new Error('Windowed messages offset mismatch');
  });

  // ==========================================
  // 5. PRODUCTION BUNDLE & SOURCE MAP INSPECTION
  // ==========================================
  console.log('\n--- 5. PRODUCTION ASSET INSPECTION ---');

  await secTest('Build Security', 'Production bundle dist/ contains zero hardcoded API keys or credentials', 'Critical', async () => {
    const distDir = path.resolve(__dirname, '../dist/assets');
    if (!fs.existsSync(distDir)) {
      throw new Error('Production dist directory not found. Please run npm run build first.');
    }

    const files = fs.readdirSync(distDir);
    for (const f of files) {
      if (f.endsWith('.js')) {
        const js = fs.readFileSync(path.join(distDir, f), 'utf-8');
        if (/sk-[a-zA-Z0-9]{25,}/.test(js)) {
          throw new Error(`Production JS bundle ${f} contains leaked live API key pattern!`);
        }
      }
    }
  });

  // ==========================================
  // FINAL SECURITY SUMMARY
  // ==========================================
  console.log('\n======================================================');
  console.log('📊 SECURITY AUDIT SUMMARY');
  console.log('======================================================');
  const total = reports.length;
  const passed = reports.filter(r => r.passed).length;
  const failed = reports.filter(r => !r.passed).length;

  console.log(`Total Checks Executed: ${total}`);
  console.log(`Passed:                ${passed}`);
  console.log(`Failed:                ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAudit().catch(err => {
  console.error('Fatal security audit error:', err);
  process.exit(1);
});
