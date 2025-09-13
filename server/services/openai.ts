import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user

export class OpenAIService {
  private openai: OpenAI | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  setApiKey(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  isConfigured(): boolean {
    return this.openai !== null;
  }

  async testConnection(): Promise<boolean> {
    if (!this.openai) return false;
    
    try {
      await this.openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async generateSummary(text: string): Promise<string> {
    if (!this.openai) {
      throw new Error("OpenAI API kulcs nincs beállítva");
    }

    const response = await this.openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "Te egy magyar tanulási asszisztens vagy. Készíts rövid, érthető összefoglalót a megadott szövegről magyar nyelven. Az összefoglaló legyen 2-3 mondat, és tartalmazza a legfontosabb pontokat."
        },
        {
          role: "user",
          content: `Készíts összefoglalót erről a szövegről: ${text}`
        }
      ],
      max_tokens: 200,
    });

    return response.choices[0].message.content || "Nem sikerült összefoglalót készíteni.";
  }

  async generateFlashcards(text: string): Promise<Array<{ question: string; answer: string }>> {
    if (!this.openai) {
      throw new Error("OpenAI API kulcs nincs beállítva");
    }

    const response = await this.openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "Te egy magyar tanulási asszisztens vagy. Készíts 5-8 tanulókártyát a megadott szövegből. Minden kártya legyen egy kérdés-válasz pár. A kérdések legyenek világosak és specifikusak, a válaszok rövidek és pontosak. Válaszolj JSON formátumban: {\"cards\": [{\"question\": \"...\", \"answer\": \"...\"}]}"
        },
        {
          role: "user",
          content: `Készíts tanulókártyákat erről a szövegről: ${text}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    try {
      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.cards || [];
    } catch (error) {
      throw new Error("Nem sikerült kártyákat generálni a válaszból.");
    }
  }

  async chatGlobal(message: string, conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<string> {
    if (!this.openai) {
      throw new Error("OpenAI API kulcs nincs beállítva");
    }

    const messages = [
      {
        role: "system" as const,
        content: "Te egy barátságos magyar tanulási asszisztens vagy. Segíts a felhasználónak bármilyen tanulással kapcsolatos kérdésben. Válaszolj magyarul, legyen informatív és motiváló."
      },
      ...conversationHistory,
      { role: "user" as const, content: message }
    ];

    const response = await this.openai.chat.completions.create({
      model: "gpt-5",
      messages,
      max_tokens: 500,
    });

    return response.choices[0].message.content || "Sajnos nem tudok válaszolni erre a kérdésre.";
  }

  async chatWithContext(message: string, context: string, conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<string> {
    if (!this.openai) {
      throw new Error("OpenAI API kulcs nincs beállítva");
    }

    const messages = [
      {
        role: "system" as const,
        content: `Te egy magyar tanulási asszisztens vagy. A felhasználó kérdései a következő tananyagról szólnak: "${context}". Válaszolj a kérdésekre a tananyag alapján, magyarul. Ha a kérdés nem kapcsolódik a tananyaghoz, udvariasan tereld vissza a témához.`
      },
      ...conversationHistory,
      { role: "user" as const, content: message }
    ];

    const response = await this.openai.chat.completions.create({
      model: "gpt-5",
      messages,
      max_tokens: 500,
    });

    return response.choices[0].message.content || "Sajnos nem tudok válaszolni erre a kérdésre.";
  }
}

// Global instance that can be configured with API key
export const openaiService = new OpenAIService(process.env.OPENAI_API_KEY);
