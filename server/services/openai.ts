// server/services/openai.ts
import OpenAI from "openai";

const DEMO = process.env.DEMO_MODE === "true";
const NO_NETWORK = process.env.NO_NETWORK === "true";
const OPENAI_ENABLED = process.env.OPENAI_ENABLED === "true";
const API_KEY = process.env.OPENAI_API_KEY ?? "";
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export class OpenAIService {
  private openai: OpenAI | null;

  constructor(apiKey?: string) {
    const key = apiKey || API_KEY;
    this.openai =
      !DEMO && !NO_NETWORK && OPENAI_ENABLED && key
        ? new OpenAI({ apiKey: key })
        : null;
  }

  setApiKey(apikey: string) {
    this.openai =
      !DEMO && !NO_NETWORK && OPENAI_ENABLED && apikey
        ? new OpenAI({ apiKey: apikey })
        : null;
  }

  isConfigured(): boolean {
    return !!this.openai;
  }

  async testConnection(): Promise<boolean> {
    if (!this.openai) return false;
    try {
      const res = await this.openai.chat.completions.create({
        model: MODEL,
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5,
      });
      return !!res;
    } catch {
      return false;
    }
  }

  /** Rövid magyar összefoglaló – DEMO/OFFLINE módban nem hív hálót. */
  async generateSummary(text: string): Promise<string> {
    if (!this.openai) {
      // Nem hívunk külső API-t, visszaadunk determinisztikus “ál-összefoglalót”
      const t = text.trim().replace(/\s+/g, " ");
      const cut = t.slice(0, 140) + (t.length > 140 ? "…" : "");
      return `AI kikapcsolva (demo/offline mód). Kivonat: ${cut}`;
    }

    const response = await this.openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "Magyar tanulási asszisztens vagy. Foglald össze a szöveget 2–3 mondatban, tisztán és röviden, magyarul.",
        },
        { role: "user", content: text },
      ],
    });

    return response.choices?.[0]?.message?.content?.trim() ?? "";
  }
}

// Egyszerűen importálható singleton
export const openAIService = new OpenAIService();
