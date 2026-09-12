/**
 * AI CEO Background Chat Execution & Navigation Sync Test Suite
 *
 * Verifies that AI CEO chat turns execute asynchronously in the background,
 * survive simulated component unmounts / page navigations, update IndexedDB
 * reactively, and notify external listeners of progress and completion.
 */

import 'fake-indexeddb/auto';
import { db } from './db';
import { aiChatService } from './ai/aiChatService';
import { createConversation, getMessagesByConversation } from './db/services/aiStorageService';
import type { AIMessage } from './types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n================================================================');
  console.log('⚡ AI CEO BACKGROUND CHAT & NAVIGATION SYNC TEST SUITE');
  console.log('================================================================\n');

  try {
    // ---------------------------------------------------------
    // TEST 1: Background execution lifecycle & active state tracking
    // ---------------------------------------------------------
    console.log('--- 1. BACKGROUND EXECUTION LIFECYCLE & ACTIVE TRACKING ---');
    const conv1 = await createConversation('Background Session 1');

    let notificationCount = 0;
    const unsubscribe = aiChatService.subscribe(() => {
      notificationCount++;
    });

    const promptText = 'Run Monday Revenue War Room';
    const turnPromise = aiChatService.startConversationTurn({
      conversationId: conv1.id,
      userPrompt: promptText,
    });

    // Immediately check that conversation is marked active in the background
    const isActiveImmediate = aiChatService.isConversationActive(conv1.id);
    const hasAnyActiveImmediate = aiChatService.hasAnyActive();
    const activeState = aiChatService.getActiveExecution(conv1.id);

    assert(isActiveImmediate === true, 'Conversation is immediately marked active in aiChatService');
    assert(hasAnyActiveImmediate === true, 'hasAnyActive returns true while processing');
    assert(activeState !== undefined && activeState.userPrompt === promptText, 'Active state correctly records user prompt');
    assert(notificationCount > 0, 'Subscribers are notified when execution starts');

    // Wait for the background execution to resolve
    const result = await turnPromise;

    assert(result.assistantMessage !== undefined, 'Turn returns valid assistant message');
    assert(result.assistantMessage.role === 'assistant', 'Assistant message role is "assistant"');
    assert(aiChatService.isConversationActive(conv1.id) === false, 'Conversation is no longer active after completion');
    assert(aiChatService.hasAnyActive() === false, 'hasAnyActive returns false after completion');

    unsubscribe();

    // ---------------------------------------------------------
    // TEST 2: IndexedDB message persistence & reactive queryability
    // ---------------------------------------------------------
    console.log('\n--- 2. INDEXEDDB PERSISTENCE & REACTIVE SYNC ---');
    const storedMessages = await getMessagesByConversation(conv1.id);

    assert(storedMessages.length >= 2, `Conversation contains at least 2 messages in IndexedDB (found ${storedMessages.length})`);
    
    const userMsg = storedMessages.find((m) => m.role === 'user');
    const assistantMsg = storedMessages.find((m) => m.role === 'assistant');

    assert(userMsg !== undefined && userMsg.content === promptText, 'User message was persisted with original prompt text');
    assert(assistantMsg !== undefined, 'Assistant message was persisted in IndexedDB');
    assert(
      Array.isArray(assistantMsg?.toolCalls) && assistantMsg.toolCalls.length > 0,
      'Assistant message contains proposed tool calls for Revenue War Room'
    );

    // ---------------------------------------------------------
    // TEST 3: Navigation simulation (Unmount -> Turn in progress -> Remount)
    // ---------------------------------------------------------
    console.log('\n--- 3. NAVIGATION SIMULATION: UNMOUNT & RETURN ---');
    const conv2 = await createConversation('Navigation Sim Thread');
    
    // Simulate user typing a new deal intake and IMMEDIATELY navigating away to /projects
    const intakePrompt = 'Got a client for $7,500 building website';
    
    // Component unmounts: no reference to React setState held
    const backgroundTurn = aiChatService.startConversationTurn({
      conversationId: conv2.id,
      userPrompt: intakePrompt,
    });

    // Simulate user browsing /projects and /finance
    assert(aiChatService.isConversationActive(conv2.id) === true, 'Turn continues executing while user is on other routes');
    
    // Background execution finishes while user was elsewhere
    await backgroundTurn;

    // Simulate user returning to /ai and mounting fresh AICopilotPage:
    // Page runs useLiveQuery on getMessagesByConversation(conv2.id)
    const remountedMessages = await getMessagesByConversation(conv2.id);

    assert(remountedMessages.length === 2, `Remounted page receives both messages from IndexedDB (found ${remountedMessages.length})`);
    assert(remountedMessages[0].role === 'user', 'First message is user');
    assert(remountedMessages[1].role === 'assistant', 'Second message is assistant with onboardClientProject intake card');
    assert(
      remountedMessages[1].toolCalls?.[0]?.name === 'onboardClientProject',
      'Intake card parameters are fully preserved in background execution result'
    );

    // ---------------------------------------------------------
    // TEST 4: Deduplication of concurrent turns on same conversation
    // ---------------------------------------------------------
    console.log('\n--- 4. CONCURRENT TURN DEDUPLICATION ---');
    const conv3 = await createConversation('Deduplication Thread');
    
    const promiseA = aiChatService.startConversationTurn({
      conversationId: conv3.id,
      userPrompt: 'How is my runway?',
    });

    // Trigger second call while first is in flight
    const promiseB = aiChatService.startConversationTurn({
      conversationId: conv3.id,
      userPrompt: 'Duplicate request',
    });

    assert(promiseA === promiseB, 'Consecutive calls for same conversation return the identical running promise');
    await promiseA;

    // ---------------------------------------------------------
    // TEST 5: Independent multi-conversation background execution
    // ---------------------------------------------------------
    console.log('\n--- 5. INDEPENDENT MULTI-THREAD TRACKING ---');
    const threadA = await createConversation('Thread A');
    const threadB = await createConversation('Thread B');

    const turnA = aiChatService.startConversationTurn({
      conversationId: threadA.id,
      userPrompt: 'What are my biggest risks?',
    });

    const turnB = aiChatService.startConversationTurn({
      conversationId: threadB.id,
      userPrompt: 'Which deals need attention?',
    });

    assert(aiChatService.isConversationActive(threadA.id) === true, 'Thread A is marked active');
    assert(aiChatService.isConversationActive(threadB.id) === true, 'Thread B is marked active');
    assert(aiChatService.getAllActive().length === 2, 'getAllActive returns both active threads');

    await Promise.all([turnA, turnB]);

    assert(aiChatService.isConversationActive(threadA.id) === false, 'Thread A cleared after completion');
    assert(aiChatService.isConversationActive(threadB.id) === false, 'Thread B cleared after completion');
    assert(aiChatService.hasAnyActive() === false, 'All threads cleared from active registry');

    console.log('\n================================================================');
    console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test suite failed with uncaught exception:', error);
    process.exit(1);
  }
}

runTests();
