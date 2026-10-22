import {z} from 'zod';

export type Fetch = typeof fetch;
const API = 'https://api.anthropic.com/v1/messages';
export const DEFAULT_MODEL = 'claude-sonnet-5-5';

/** JSON Schema for a tool's input_schema, generated from the same zod schema used for validation. */
export const toolSchema = (schema: z.ZodType): Record<string, unknown> => {
  const js = z.toJSONSchema(schema) as Record<string, unknown>;
  delete js.$schema;
  return js;
};

type Block = {type: string; id?: string; name?: string; input?: unknown};

/**
 * Forces Claude to answer through one tool, validates the input with zod, and on failure sends the
 * exact problems back as a tool_result error so it can correct itself.
 */
export async function callTool<T>(o: {
  system: string;
  prompt: string;
  tool: string;
  description: string;
  schema: z.ZodType<T>;
  apiKey?: string;
  model?: string;
  retries?: number;
  fetchImpl?: Fetch;
}): Promise<T> {
  const apiKey = o.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Set ANTHROPIC_API_KEY');
  const doFetch = o.fetchImpl ?? fetch;
  const tools = [{name: o.tool, description: o.description, input_schema: toolSchema(o.schema)}];
  const messages: unknown[] = [{role: 'user', content: o.prompt}];
  let issues = '';
  for (let attempt = 0; attempt <= (o.retries ?? 2); attempt++) {
    const res = await doFetch(API, {
      method: 'POST',
      headers: {'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'},
      body: JSON.stringify({
        model: o.model ?? process.env.CLAUDE_MODEL ?? DEFAULT_MODEL,
        max_tokens: 4000,
        system: o.system,
        tools,
        tool_choice: {type: 'tool', name: o.tool},
        messages,
      }),
    });
    if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as {content: Block[]};
    const call = data.content.find((b) => b.type === 'tool_use' && b.name === o.tool);
    if (!call) throw new Error('Claude did not call the tool');
    const parsed = o.schema.safeParse(call.input);
    if (parsed.success) return parsed.data;
    issues = parsed.error.issues.map((i) => `- ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');
    messages.push(
      {role: 'assistant', content: data.content},
      {role: 'user', content: [{type: 'tool_result', tool_use_id: call.id, is_error: true,
        content: `Rejected. Fix every problem below and call ${o.tool} again with the complete corrected input:\n${issues}`}]},
    );
  }
  throw new Error(`Story output still invalid after retries:\n${issues}`);
}
