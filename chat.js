// POST /api/chat — proxies the coach conversation to the Anthropic Messages API
// and streams plain text back. Runs as a Vercel serverless function, and is also
// used by server.js for local or Render/Railway hosting.
//
// Environment variables:
//   ANTHROPIC_API_KEY  (required)
//   ACCESS_CODE        (strongly recommended when hosted publicly: blocks strangers
//                       from spending your API credits)
//   ANTHROPIC_MODEL    (optional, default claude-sonnet-4-6)

const MAX_TURNS = 60;
const MAX_BYTES = 200_000;

export async function POST(request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return new Response("Server is missing ANTHROPIC_API_KEY.", { status: 500 });

  const code = process.env.ACCESS_CODE;
  if (code && request.headers.get("x-access-code") !== code) {
    return new Response("Access code required.", { status: 401 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BYTES) return new Response("Conversation too long.", { status: 413 });

  let messages;
  try { ({ messages } = JSON.parse(raw)); } catch { return new Response("Bad JSON", { status: 400 }); }
  if (!Array.isArray(messages) || !messages.length) return new Response("messages required", { status: 400 });

  // The page sends its coaching rules as the first user turn followed by an
  // acknowledgement; promote them to the system prompt.
  let system;
  if (messages[0]?.role === "user" && messages[1]?.role === "assistant") {
    system = String(messages[0].content);
    messages = messages.slice(2);
  }
  messages = messages
    .filter(m => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_TURNS);
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length) return new Response("messages required", { status: 400 });

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: 2048, system, messages, stream: true,
    }),
  });
  if (!upstream.ok || !upstream.body) {
    const status = upstream.status === 429 ? 429 : 502;
    return new Response(await upstream.text(), { status });
  }

  const dec = new TextDecoder();
  const enc = new TextEncoder();
  let buf = "";
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of upstream.body) {
          buf += dec.decode(chunk, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop();
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            try {
              const evt = JSON.parse(line.slice(5));
              if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
                controller.enqueue(enc.encode(evt.delta.text));
              }
            } catch {}
          }
        }
      } catch (e) {
        controller.error(e);
        return;
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-cache" } });
}
