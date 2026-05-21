// Claude API helper.
//
// Two entry points:
//   callClaude(prompt, opts)      → raw text response
//   callClaudeJSON<T>(prompt, opts) → parsed JSON of type T (with retry on parse fail)
//
// The JSON helper amends the system prompt to enforce no markdown fences and
// strips them defensively, so this stays robust even if a model echoes ```json.

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-6';

export interface ClaudeOptions {
  model?: string;
  max_tokens?: number;
  system?: string;
  temperature?: number;
}

interface AnthropicResponse {
  content: Array<{ type: string; text?: string }>;
  stop_reason: string;
}

export async function callClaude(prompt: string, opts: ClaudeOptions = {}): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: opts.model || DEFAULT_MODEL,
      max_tokens: opts.max_tokens ?? 4096,
      temperature: opts.temperature ?? 0.7,
      system: opts.system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API ${res.status}: ${body}`);
  }
  const data = await res.json() as AnthropicResponse;
  return data.content
    .filter(c => c.type === 'text' && typeof c.text === 'string')
    .map(c => c.text)
    .join('\n');
}

export async function callClaudeJSON<T>(prompt: string, opts: ClaudeOptions = {}): Promise<T> {
  const enforced =
    (opts.system ? opts.system + '\n\n' : '') +
    'OUTPUT FORMAT: Respond with valid JSON only. No markdown code fences, no commentary, no prose outside the JSON value.';

  const tryParse = (raw: string): T => {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    // If the model wrapped the JSON in extra text, try to find the first { or [
    const first = cleaned.search(/[\[{]/);
    if (first > 0) return JSON.parse(cleaned.slice(first)) as T;
    return JSON.parse(cleaned) as T;
  };

  let lastErr: unknown;
  for (let i = 0; i < 2; i++) {
    const raw = await callClaude(prompt, { ...opts, system: enforced, temperature: opts.temperature ?? 0.3 });
    try {
      return tryParse(raw);
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`Claude returned non-JSON: ${lastErr}`);
}
