/**
 * MyAssistant Client
 *
 * Calls the MyAssistant proxy running inside VS Code.
 * The proxy uses your GitHub Copilot quota (or DeepSeek/OpenRouter if configured).
 *
 * Default port: 3172  (VS Code setting: myassistant.port)
 * Override via env: MYASSISTANT_PORT=3172  or  MYASSISTANT_URL=http://127.0.0.1:3172
 */

const DEFAULT_PORT = 3172;

function getBaseUrl(): string {
  if (process.env.MYASSISTANT_URL) { return process.env.MYASSISTANT_URL; }
  const port = process.env.MYASSISTANT_PORT
    ? parseInt(process.env.MYASSISTANT_PORT, 10)
    : DEFAULT_PORT;
  return `http://127.0.0.1:${port}`;
}

export type AIBackend = 'copilot' | 'deepseek' | 'openrouter';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

/**
 * Send a chat completion request to the MyAssistant proxy.
 * Returns the assistant's text response.
 *
 * @example
 * const reply = await aiChat([
 *   { role: 'system', content: 'Tu es un assistant pour PLAL.' },
 *   { role: 'user', content: 'Explique ce que fait ce code...' }
 * ]);
 */
export async function aiChat(
  messages: AIMessage[],
  options: AIChatOptions = {},
): Promise<string> {
  const url = `${getBaseUrl()}/v1/chat/completions`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: options.model ?? 'auto',
      messages,
      stream: false,
      temperature: options.temperature,
      max_tokens: options.max_tokens,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MyAssistant proxy error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  return data.choices[0]?.message?.content ?? '';
}

/**
 * Switch the active backend mid-session (no restart needed).
 * - 'copilot'    → GitHub Copilot Pro+ quota (free, default)
 * - 'deepseek'   → DeepSeek API ($0.87/M tokens, needs DEEPSEEK_API_KEY)
 * - 'openrouter' → OpenRouter ($0.44/M tokens, needs OPENROUTER_API_KEY)
 */
export async function aiSwitchBackend(backend: AIBackend): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/_proxy/mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ backend }),
  });
  if (!res.ok) {
    throw new Error(`Failed to switch backend: ${await res.text()}`);
  }
}

/** Get the current proxy status (active backend, port, uptime, API keys present…). */
export async function aiGetStatus(): Promise<Record<string, unknown>> {
  const res = await fetch(`${getBaseUrl()}/_proxy/status`);
  if (!res.ok) { throw new Error(`MyAssistant not reachable on port ${DEFAULT_PORT}. Is VS Code running with the extension active?`); }
  return res.json() as Promise<Record<string, unknown>>;
}

/** Get token usage and estimated cost per backend. */
export async function aiGetCosts(): Promise<Record<string, unknown>> {
  const res = await fetch(`${getBaseUrl()}/_proxy/cost`);
  return res.json() as Promise<Record<string, unknown>>;
}
