import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { openaiService } from "./services/openai";
import { insertMaterialSchema, insertDeckSchema, insertFlashcardSchema, insertStudySessionSchema, insertSettingsSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Materials
  app.get("/api/materials", async (req, res) => {
    try {
      // For demo, use the demo user
      const materials = await storage.getMaterialsByUserId("demo");
      res.json(materials);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch materials" });
    }
  });

  app.get("/api/materials/:id", async (req, res) => {
    try {
      const material = await storage.getMaterial(req.params.id);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }
      res.json(material);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch material" });
    }
  });

  app.post("/api/materials", async (req, res) => {
    try {
      const validatedData = insertMaterialSchema.parse({
        ...req.body,
        userId: "demo" // For demo purposes
      });
      const material = await storage.createMaterial(validatedData);
      res.json(material);
    } catch (error) {
      res.status(400).json({ error: "Invalid material data" });
    }
  });

  // AI Processing
  app.post("/api/ai/summary", async (req, res) => {
    try {
      const { text, apiKey } = req.body;
      
      if (apiKey) {
        openaiService.setApiKey(apiKey);
      }

      if (!openaiService.isConfigured()) {
        return res.status(400).json({ error: "OpenAI API kulcs nincs beállítva" });
      }

      const summary = await openaiService.generateSummary(text);
      res.json({ summary });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Hiba történt az összefoglaló készítése során" });
    }
  });

  app.post("/api/ai/flashcards", async (req, res) => {
    try {
      const { text, apiKey } = req.body;
      
      if (apiKey) {
        openaiService.setApiKey(apiKey);
      }

      if (!openaiService.isConfigured()) {
        return res.status(400).json({ error: "OpenAI API kulcs nincs beállítva" });
      }

      const cards = await openaiService.generateFlashcards(text);
      res.json({ cards });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Hiba történt a kártyák generálása során" });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, context, history, apiKey } = req.body;
      
      if (apiKey) {
        openaiService.setApiKey(apiKey);
      }

      if (!openaiService.isConfigured()) {
        return res.status(400).json({ error: "OpenAI API kulcs nincs beállítva" });
      }

      let response;
      if (context) {
        response = await openaiService.chatWithContext(message, context, history || []);
      } else {
        response = await openaiService.chatGlobal(message, history || []);
      }
      
      res.json({ response });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Hiba történt a chat során" });
    }
  });

  app.post("/api/ai/test", async (req, res) => {
    try {
      const { apiKey } = req.body;
      
      if (apiKey) {
        openaiService.setApiKey(apiKey);
      }

      const isWorking = await openaiService.testConnection();
      res.json({ success: isWorking });
    } catch (error) {
      res.json({ success: false });
    }
  });

  // Decks
  app.get("/api/decks", async (req, res) => {
    try {
      const decks = await storage.getDecksByUserId("demo");
      res.json(decks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch decks" });
    }
  });

  app.get("/api/decks/:id", async (req, res) => {
    try {
      const deck = await storage.getDeck(req.params.id);
      if (!deck) {
        return res.status(404).json({ error: "Deck not found" });
      }
      res.json(deck);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deck" });
    }
  });

  app.post("/api/decks", async (req, res) => {
    try {
      const validatedData = insertDeckSchema.parse({
        ...req.body,
        userId: "demo" // For demo purposes
      });
      const deck = await storage.createDeck(validatedData);
      res.json(deck);
    } catch (error) {
      res.status(400).json({ error: "Invalid deck data" });
    }
  });

  app.put("/api/decks/:id", async (req, res) => {
    try {
      const updated = await storage.updateDeck(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Deck not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update deck" });
    }
  });

  app.delete("/api/decks/:id", async (req, res) => {
    try {
      const success = await storage.deleteDeck(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Deck not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete deck" });
    }
  });

  app.get("/api/decks/:id/cards", async (req, res) => {
    try {
      const cards = await storage.getFlashcardsByDeckId(req.params.id);
      res.json(cards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cards" });
    }
  });

  app.get("/api/decks/:id/review", async (req, res) => {
    try {
      const cards = await storage.getFlashcardsForReviewByDeck(req.params.id);
      res.json(cards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cards for review" });
    }
  });

  // Flashcards
  app.get("/api/flashcards", async (req, res) => {
    try {
      const flashcards = await storage.getFlashcardsByUserId("demo");
      res.json(flashcards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch flashcards" });
    }
  });

  app.get("/api/flashcards/review", async (req, res) => {
    try {
      const flashcards = await storage.getFlashcardsForReview("demo");
      res.json(flashcards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch flashcards for review" });
    }
  });

  app.post("/api/flashcards", async (req, res) => {
    try {
      const validatedData = insertFlashcardSchema.parse({
        ...req.body,
        userId: "demo"
      });
      const flashcard = await storage.createFlashcard(validatedData);
      res.json(flashcard);
    } catch (error) {
      res.status(400).json({ error: "Invalid flashcard data" });
    }
  });

  app.patch("/api/flashcards/:id", async (req, res) => {
    try {
      const flashcard = await storage.updateFlashcard(req.params.id, req.body);
      if (!flashcard) {
        return res.status(404).json({ error: "Flashcard not found" });
      }
      res.json(flashcard);
    } catch (error) {
      res.status(500).json({ error: "Failed to update flashcard" });
    }
  });

  // Study Sessions
  app.get("/api/study-sessions", async (req, res) => {
    try {
      const sessions = await storage.getStudySessionsByUserId("demo");
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch study sessions" });
    }
  });

  app.post("/api/study-sessions", async (req, res) => {
    try {
      const validatedData = insertStudySessionSchema.parse({
        ...req.body,
        userId: "demo"
      });
      const session = await storage.createStudySession(validatedData);
      res.json(session);
    } catch (error) {
      res.status(400).json({ error: "Invalid study session data" });
    }
  });

  // Settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings("demo");
      if (!settings) {
        return res.status(404).json({ error: "Settings not found" });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const validatedData = insertSettingsSchema.parse({
        ...req.body,
        userId: "demo"
      });
      const settings = await storage.createOrUpdateSettings(validatedData);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ error: "Invalid settings data" });
    }
  });

  // User data (for progress tracking)
  app.get("/api/user", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.patch("/api/user", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const updatedUser = await storage.updateUser(user.id, req.body);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
