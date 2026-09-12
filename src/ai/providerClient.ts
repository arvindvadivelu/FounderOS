import type { AIProvider } from '../types';

export interface ChatMessagePayload {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export interface TestConnectionResult {
  success: boolean;
  provider: string;
  model: string;
  durationMs: number;
  message: string;
  errorDetails?: string;
}

export async function testProviderConnection(provider: AIProvider, timeoutMs: number = 15000): Promise<TestConnectionResult> {
  const startTime = performance.now();

  if (!provider.apiKey && provider.type !== 'custom') {
    return {
      success: false,
      provider: provider.name,
      model: provider.model,
      durationMs: 0,
      message: 'API Key is missing. Please enter your provider API key.',
    };
  }

  const endpoint = provider.baseUrl.replace(/\/+$/, '') + '/chat/completions';
  const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'https://founderos.local';
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (provider.apiKey) {
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
  }

  if (provider.type === 'openrouter') {
    headers['HTTP-Referer'] = origin;
    headers['X-Title'] = 'FounderOS';
  }

  if (provider.organizationId) {
    headers['OpenAI-Organization'] = provider.organizationId;
  }

  if (provider.customHeaders) {
    Object.assign(headers, provider.customHeaders);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: 'user', content: 'Ping: Respond with "pong" only.' }],
        max_tokens: 10,
        temperature: 0.1,
      }),
    });

    clearTimeout(timer);
    const durationMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      let errText = '';
      try {
        const errJson = await response.json();
        errText = errJson?.error?.message || JSON.stringify(errJson);
      } catch {
        errText = await response.text();
      }

      let userFriendlyStatus = `HTTP ${response.status} ${response.statusText}`;
      if (response.status === 401) {
        userFriendlyStatus = 'Authentication Failed (HTTP 401): Invalid API Key or Unauthorized.';
      } else if (response.status === 403) {
        userFriendlyStatus = 'Access Forbidden (HTTP 403): Model permissions or tier restriction.';
      } else if (response.status === 404) {
        userFriendlyStatus = `Model Not Found (HTTP 404): "${provider.model}" is not available on this endpoint.`;
      } else if (response.status === 429) {
        userFriendlyStatus = 'Rate Limit Exceeded (HTTP 429): Quota exhausted or rate throttled.';
      }

      return {
        success: false,
        provider: provider.name,
        model: provider.model,
        durationMs,
        message: userFriendlyStatus,
        errorDetails: errText || 'API endpoint rejected the request.',
      };
    }

    const data = await response.json();
    return {
      success: true,
      provider: provider.name,
      model: data?.model || provider.model,
      durationMs,
      message: `Connection verified! Model responded in ${durationMs}ms.`,
    };
  } catch (err: any) {
    clearTimeout(timer);
    const durationMs = Math.round(performance.now() - startTime);

    if (err?.name === 'AbortError' || err?.message?.toLowerCase().includes('aborted')) {
      return {
        success: false,
        provider: provider.name,
        model: provider.model,
        durationMs,
        message: `Connection Timed Out (${timeoutMs / 1000}s limit)`,
        errorDetails: 'The remote endpoint did not respond within the timeout window.',
      };
    }

    const isCors = err?.message?.toLowerCase().includes('failed to fetch') || err?.name === 'TypeError';

    return {
      success: false,
      provider: provider.name,
      model: provider.model,
      durationMs,
      message: isCors ? 'CORS restriction or Network failure' : err.message || 'Connection failed',
      errorDetails: isCors
        ? 'Browser blocked direct connection to this endpoint due to CORS policies or no internet connectivity. For local models, enable CORS headers on your local server (e.g. OLLAMA_ORIGINS="*").'
        : err.stack || err.message,
    };
  }
}

export async function sendChatMessage(
  provider: AIProvider,
  messages: ChatMessagePayload[],
  tools?: any[],
  timeoutMs: number = 45000
): Promise<{
  content: string;
  toolCalls?: Array<{ id: string; name: string; arguments: any }>;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  durationMs: number;
}> {
  const startTime = performance.now();
  const endpoint = provider.baseUrl.replace(/\/+$/, '') + '/chat/completions';
  const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'https://founderos.local';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (provider.apiKey) {
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
  }

  if (provider.type === 'openrouter') {
    headers['HTTP-Referer'] = origin;
    headers['X-Title'] = 'FounderOS';
  }

  if (provider.organizationId) {
    headers['OpenAI-Organization'] = provider.organizationId;
  }

  if (provider.customHeaders) {
    Object.assign(headers, provider.customHeaders);
  }

  const payload: any = {
    model: provider.model,
    messages,
    temperature: provider.temperature ?? 0.2,
  };

  if (provider.maxTokens) {
    payload.max_tokens = provider.maxTokens;
  }

  if (tools && tools.length > 0) {
    payload.tools = tools;
    payload.tool_choice = 'auto';
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify(payload),
    });

    clearTimeout(timer);
    const durationMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      let errBody = '';
      try {
        const errJson = await response.json();
        errBody = errJson?.error?.message || JSON.stringify(errJson);
      } catch {
        errBody = await response.text();
      }

      if (response.status === 401) {
        throw new Error(`Authentication Failed (HTTP 401): Invalid API key for provider "${provider.name}".`);
      }
      if (response.status === 404) {
        throw new Error(`Model Not Found (HTTP 404): Model "${provider.model}" is not available on endpoint "${provider.baseUrl}".`);
      }
      if (response.status === 429) {
        throw new Error(`Rate Limit Exceeded (HTTP 429): Quota exhausted or rate limit hit. Details: ${errBody}`);
      }

      throw new Error(`API Error (${response.status} ${response.statusText}): ${errBody}`);
    }

    const data = await response.json();
    const choice = data?.choices?.[0];
    const message = choice?.message;

    const parsedToolCalls: Array<{ id: string; name: string; arguments: any }> = [];

    if (message?.tool_calls && Array.isArray(message.tool_calls)) {
      for (const tc of message.tool_calls) {
        let args = {};
        try {
          args = typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments;
        } catch {
          args = { raw: tc.function.arguments };
        }
        parsedToolCalls.push({
          id: tc.id,
          name: tc.function.name,
          arguments: args,
        });
      }
    }

    return {
      content: message?.content || '',
      toolCalls: parsedToolCalls.length > 0 ? parsedToolCalls : undefined,
      usage: data?.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
      durationMs,
    };
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === 'AbortError' || err?.message?.toLowerCase().includes('aborted')) {
      throw new Error(`Request Timed Out: The AI provider "${provider.name}" did not respond within ${timeoutMs / 1000} seconds.`);
    }
    throw err;
  }
}
