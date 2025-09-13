import { type User, type InsertUser, type Material, type InsertMaterial, type Deck, type InsertDeck, type Flashcard, type InsertFlashcard, type StudySession, type InsertStudySession, type Settings, type InsertSettings } from "@shared/schema";

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

import { DatabaseStorage } from './database-storage';

export const storage = new DatabaseStorage();

// Clean seed database function with minimal demo data
export async function seedDatabase() {
  try {
    // Check if demo user already exists
    const demoUser = await storage.getUserByEmail('demo@example.com');
    if (demoUser) {
      console.log('Demo data already exists');
      return;
    }

    console.log('Seeding database with clean demo data...');
    
    // Create demo user with 0 XP (user requirement: XP only from real events)
    const user = await storage.createUser({
      username: 'demo',
      email: 'demo@example.com',
      password: 'demo',
      xp: 0, // Start with 0 XP as requested
      level: 1,
      currentAnimal: 'Hangya', // First level according to our progression
    });

    // Create initial empty settings for the demo user
    await storage.createOrUpdateSettings({
      userId: user.id,
      openaiApiKey: null,
      theme: 'light',
      accentColor: 'blue',
      focusAlerts: true,
      dailyReminders: false,
      cardDifficulty: 'medium',
    });

    console.log('Database seeded successfully with clean data!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// One-time migration to clean up demo data and reset XP
export async function cleanDemoData() {
  try {
    const demoUser = await storage.getUserByEmail('demo@example.com');
    if (demoUser && (demoUser.xp || 0) > 0) {
      console.log('Cleaning demo XP data...');
      await storage.updateUser(demoUser.id, {
        xp: 0,
        level: 1,
        currentAnimal: 'Hangya'
      });
      console.log('Demo data cleaned successfully!');
    }
  } catch (error) {
    console.error('Error cleaning demo data:', error);
  }
}