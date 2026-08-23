const MODEL = "gemini-3.6-flash";

async function callGemini(prompt: string, responseSchema?: object): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        ...(responseSchema
          ? { generationConfig: { responseMimeType: "application/json", responseSchema } }
          : {}),
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini API returned no text");
  }
  return text as string;
}

export async function generateInsight(prompt: string): Promise<string> {
  return callGemini(prompt);
}

export type TicketPriority = { ticket_number: string; priority: "red" | "yellow" | "green" };
export type StructuredInsight = { summary: string; priorities: TicketPriority[] };

const INSIGHT_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    priorities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          ticket_number: { type: "string" },
          priority: { type: "string", enum: ["red", "yellow", "green"] },
        },
        required: ["ticket_number", "priority"],
      },
    },
  },
  required: ["summary", "priorities"],
};

export async function generateStructuredInsight(prompt: string): Promise<StructuredInsight> {
  const text = await callGemini(prompt, INSIGHT_SCHEMA);
  return JSON.parse(text) as StructuredInsight;
}
