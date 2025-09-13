import { type User, type InsertUser, type Material, type InsertMaterial, type Deck, type InsertDeck, type Flashcard, type InsertFlashcard, type StudySession, type InsertStudySession, type Settings, type InsertSettings } from "@shared/schema";
import { users, materials, decks, flashcards, studySessions, settings } from "@shared/schema";
import { db } from "./db";
import { eq, and, lte } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Materials
  getMaterialsByUserId(userId: string): Promise<Material[]>;
  getMaterial(id: string): Promise<Material | undefined>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: string, updates: Partial<Material>): Promise<Material | undefined>;
  deleteMaterial(id: string): Promise<boolean>;

  // Decks
  getDecksByUserId(userId: string): Promise<Deck[]>;
  getDeck(id: string): Promise<Deck | undefined>;
  createDeck(deck: InsertDeck): Promise<Deck>;
  updateDeck(id: string, updates: Partial<Deck>): Promise<Deck | undefined>;
  deleteDeck(id: string): Promise<boolean>;

  // Flashcards
  getFlashcardsByDeckId(deckId: string): Promise<Flashcard[]>;
  getFlashcardsByMaterialId(materialId: string): Promise<Flashcard[]>;
  getFlashcardsByUserId(userId: string): Promise<Flashcard[]>;
  getFlashcardsForReview(userId: string): Promise<Flashcard[]>;
  getFlashcardsForReviewByDeck(deckId: string): Promise<Flashcard[]>;
  getFlashcard(id: string): Promise<Flashcard | undefined>;
  createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard>;
  updateFlashcard(id: string, updates: Partial<Flashcard>): Promise<Flashcard | undefined>;
  deleteFlashcard(id: string): Promise<boolean>;

  // Study Sessions
  getStudySessionsByUserId(userId: string): Promise<StudySession[]>;
  createStudySession(session: InsertStudySession): Promise<StudySession>;

  // Settings
  getSettings(userId: string): Promise<Settings | undefined>;
  createOrUpdateSettings(settings: InsertSettings): Promise<Settings>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private materials: Map<string, Material> = new Map();
  private decks: Map<string, Deck> = new Map();
  private flashcards: Map<string, Flashcard> = new Map();
  private studySessions: Map<string, StudySession> = new Map();
  private settings: Map<string, Settings> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create demo user with fixed "demo" ID for consistency
    const userId = "demo";
    const user: User = {
      id: userId,
      username: "demo",
      email: "demo@example.com",
      password: "demo",
      xp: 1432,
      level: 5,
      currentAnimal: "Villám Nyúl",
      createdAt: new Date(),
    };
    this.users.set(userId, user);

    // Create demo material
    const materialId = randomUUID();
    const material: Material = {
      id: materialId,
      userId,
      title: "Magyar történelem",
      content: "Az Árpád-házi királyok időszaka (896-1301) Magyarország történelmének alapító korszaka volt. István I., az első magyar király 1000-ben vagy 1001-ben koronáztatta meg magát. A kereszténység felvétele és az európai államközösséghez való csatlakozás megalapozta a magyar államiságot.",
      summary: "Az Árpád-ház Magyarország első királyi dinasztiája volt, amely megalapozta a keresztény magyar államot.",
      type: "text",
      createdAt: new Date(),
    };
    this.materials.set(materialId, material);

    // Create demo deck
    const deckId = randomUUID();
    const deck: Deck = {
      id: deckId,
      userId,
      name: "Magyar történelem",
      description: "Árpád-házi királyok és a korai magyar államiság",
      createdAt: new Date(),
      lastStudied: null,
    };
    this.decks.set(deckId, deck);

    // Create demo flashcards
    const flashcardData = [
      { question: "Mikor kezdődött az Árpád-ház uralma Magyarországon?", answer: "896-ban, amikor Árpád vezér és a magyarok betelepedtek a Kárpát-medencébe." },
      { question: "Ki volt az első magyar király?", answer: "István I., akit 1000. december 25-én vagy 1001. január 1-jén koronáztak meg." },
      { question: "Mikor ért véget az Árpád-ház uralma?", answer: "1301-ben III. András halálával." },
      { question: "Mi volt István király legnagyobb eredménye?", answer: "A kereszténység felvétele és a magyar államiság megalapozása." },
      { question: "Hogyan csatlakozott Magyarország Európához?", answer: "A kereszténység felvételével és az európai államközösséghez való csatlakozással." },
      { question: "Milyen időszakot ölelt fel az Árpád-ház uralma?", answer: "896-tól 1301-ig, összesen 405 évet." },
    ];

    flashcardData.forEach((card, index) => {
      const flashcardId = randomUUID();
      const flashcard: Flashcard = {
        id: flashcardId,
        deckId,
        materialId,
        userId,
        question: card.question,
        answer: card.answer,
        difficulty: 1,
        nextReview: new Date(),
        lastReviewed: null,
        correctCount: Math.floor(Math.random() * 5),
        incorrectCount: Math.floor(Math.random() * 3),
        createdAt: new Date(),
      };
      this.flashcards.set(flashcardId, flashcard);
    });

    // Create demo settings
    const settingsId = randomUUID();
    const userSettings: Settings = {
      id: settingsId,
      userId,
      openaiApiKey: null,
      theme: "light",
      accentColor: "blue",
      focusAlerts: true,
      dailyReminders: false,
      cardDifficulty: "medium",
    };
    this.settings.set(userId, userSettings);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  // Materials
  async getMaterialsByUserId(userId: string): Promise<Material[]> {
    return Array.from(this.materials.values()).filter(material => material.userId === userId);
  }

  async getMaterial(id: string): Promise<Material | undefined> {
    return this.materials.get(id);
  }

  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const id = randomUUID();
    const material: Material = { ...insertMaterial, id, createdAt: new Date() };
    this.materials.set(id, material);
    return material;
  }

  async updateMaterial(id: string, updates: Partial<Material>): Promise<Material | undefined> {
    const material = this.materials.get(id);
    if (!material) return undefined;
    const updated = { ...material, ...updates };
    this.materials.set(id, updated);
    return updated;
  }

  async deleteMaterial(id: string): Promise<boolean> {
    return this.materials.delete(id);
  }

  // Decks
  async getDecksByUserId(userId: string): Promise<Deck[]> {
    return Array.from(this.decks.values()).filter(deck => deck.userId === userId);
  }

  async getDeck(id: string): Promise<Deck | undefined> {
    return this.decks.get(id);
  }

  async createDeck(insertDeck: InsertDeck): Promise<Deck> {
    const id = randomUUID();
    const deck: Deck = { ...insertDeck, id, createdAt: new Date(), lastStudied: null };
    this.decks.set(id, deck);
    return deck;
  }

  async updateDeck(id: string, updates: Partial<Deck>): Promise<Deck | undefined> {
    const deck = this.decks.get(id);
    if (!deck) return undefined;
    const updated = { ...deck, ...updates };
    this.decks.set(id, updated);
    return updated;
  }

  async deleteDeck(id: string): Promise<boolean> {
    return this.decks.delete(id);
  }

  // Flashcards
  async getFlashcardsByDeckId(deckId: string): Promise<Flashcard[]> {
    return Array.from(this.flashcards.values()).filter(card => card.deckId === deckId);
  }

  async getFlashcardsByMaterialId(materialId: string): Promise<Flashcard[]> {
    return Array.from(this.flashcards.values()).filter(card => card.materialId === materialId);
  }

  async getFlashcardsByUserId(userId: string): Promise<Flashcard[]> {
    return Array.from(this.flashcards.values()).filter(card => card.userId === userId);
  }

  async getFlashcardsForReview(userId: string): Promise<Flashcard[]> {
    const now = new Date();
    return Array.from(this.flashcards.values())
      .filter(card => card.userId === userId && card.nextReview && card.nextReview <= now)
      .sort((a, b) => (a.nextReview?.getTime() || 0) - (b.nextReview?.getTime() || 0));
  }

  async getFlashcardsForReviewByDeck(deckId: string): Promise<Flashcard[]> {
    const now = new Date();
    return Array.from(this.flashcards.values())
      .filter(card => card.deckId === deckId && card.nextReview && card.nextReview <= now)
      .sort((a, b) => (a.nextReview?.getTime() || 0) - (b.nextReview?.getTime() || 0));
  }

  async getFlashcard(id: string): Promise<Flashcard | undefined> {
    return this.flashcards.get(id);
  }

  async createFlashcard(insertFlashcard: InsertFlashcard): Promise<Flashcard> {
    const id = randomUUID();
    const flashcard: Flashcard = { 
      ...insertFlashcard, 
      id, 
      createdAt: new Date(),
      lastReviewed: null,
    };
    this.flashcards.set(id, flashcard);
    return flashcard;
  }

  async updateFlashcard(id: string, updates: Partial<Flashcard>): Promise<Flashcard | undefined> {
    const flashcard = this.flashcards.get(id);
    if (!flashcard) return undefined;
    const updated = { ...flashcard, ...updates };
    this.flashcards.set(id, updated);
    return updated;
  }

  async deleteFlashcard(id: string): Promise<boolean> {
    return this.flashcards.delete(id);
  }

  // Study Sessions
  async getStudySessionsByUserId(userId: string): Promise<StudySession[]> {
    return Array.from(this.studySessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createStudySession(insertSession: InsertStudySession): Promise<StudySession> {
    const id = randomUUID();
    const session: StudySession = { ...insertSession, id, createdAt: new Date() };
    this.studySessions.set(id, session);
    return session;
  }

  // Settings
  async getSettings(userId: string): Promise<Settings | undefined> {
    return this.settings.get(userId);
  }

  async createOrUpdateSettings(insertSettings: InsertSettings): Promise<Settings> {
    const existing = this.settings.get(insertSettings.userId!);
    if (existing) {
      const updated = { ...existing, ...insertSettings };
      this.settings.set(insertSettings.userId!, updated);
      return updated;
    } else {
      const id = randomUUID();
      const settings: Settings = { ...insertSettings, id };
      this.settings.set(insertSettings.userId!, settings);
      return settings;
    }
  }
}

import { DatabaseStorage } from './database-storage';

export const storage = new DatabaseStorage();

// Seed database with demo data if needed
export async function seedDatabase() {
  try {
    // Check if demo user already exists
    const demoUser = await storage.getUserByEmail('demo@example.com');
    if (demoUser) {
      console.log('Demo data already exists');
      return;
    }

    console.log('Seeding database with demo data...');
    
    // Create demo user
    const user = await storage.createUser({
      username: 'demo',
      email: 'demo@example.com',
      password: 'demo',
      xp: 1432,
      level: 5,
      currentAnimal: 'Delfin',
    });

    // Create demo material
    const material = await storage.createMaterial({
      userId: user.id,
      title: 'Magyar történelem',
      content: 'Az Árpád-házi királyok időszaka (896-1301) Magyarország történelmének alapító korszaka volt. István I., az első magyar király 1000-ben vagy 1001-ben koronáztatta meg magát. A kereszténység felvétele és az európai államközösséghez való csatlakozás megalapozta a magyar államiságot.',
      summary: 'Az Árpád-ház Magyarország első királyi dinasztiája volt, amely megalapozta a keresztény magyar államot.',
      type: 'text',
    });

    // Create demo deck
    const deck = await storage.createDeck({
      userId: user.id,
      name: 'Magyar történelem',
      description: 'Árpád-házi királyok és a korai magyar államiság',
    });

    // Create demo flashcards
    const flashcardData = [
      { question: 'Mikor kezdődött az Árpád-ház uralma Magyarországon?', answer: '896-ban, amikor Árpád vezér és a magyarok betelepedtek a Kárpát-medencébe.' },
      { question: 'Ki volt az első magyar király?', answer: 'István I., akit 1000. december 25-én vagy 1001. január 1-jén koronáztak meg.' },
      { question: 'Mikor ért véget az Árpád-ház uralma?', answer: '1301-ben III. András halálával.' },
      { question: 'Mi volt István király legnagyobb eredménye?', answer: 'A kereszténység felvétele és a magyar államiság megalapozása.' },
      { question: 'Hogyan csatlakozott Magyarország Európához?', answer: 'A kereszténység felvételével és az európai államközösséghez való csatlakozással.' },
    ];

    for (const cardData of flashcardData) {
      await storage.createFlashcard({
        userId: user.id,
        deckId: deck.id,
        materialId: material.id,
        question: cardData.question,
        answer: cardData.answer,
        difficulty: 1,
        nextReview: new Date(),
      });
    }

    // Create demo settings
    await storage.createOrUpdateSettings({
      userId: user.id,
      openaiApiKey: null,
      theme: 'light',
      accentColor: 'blue',
      focusAlerts: true,
      dailyReminders: false,
      cardDifficulty: 'medium',
    });

    // Create some demo study sessions
    const sessions = [
      {
        userId: user.id,
        type: 'cards' as const,
        duration: 15,
        xpEarned: 45,
        cardsStudied: 5,
        correctCards: 4,
        focusInterrupted: false,
      },
      {
        userId: user.id,
        type: 'focus' as const,
        duration: 25,
        xpEarned: 50,
        cardsStudied: 0,
        correctCards: 0,
        focusInterrupted: false,
      },
    ];

    for (const sessionData of sessions) {
      await storage.createStudySession(sessionData);
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
