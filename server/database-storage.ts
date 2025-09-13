import { type User, type InsertUser, type Material, type InsertMaterial, type Deck, type InsertDeck, type Flashcard, type InsertFlashcard, type StudySession, type InsertStudySession, type Settings, type InsertSettings } from "@shared/schema";
import { users, materials, decks, flashcards, studySessions, settings } from "@shared/schema";
import { db } from "./db";
import { eq, and, lte } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updatedUser || undefined;
  }

  // Materials
  async getMaterialsByUserId(userId: string): Promise<Material[]> {
    return await db.select().from(materials).where(eq(materials.userId, userId));
  }

  async getMaterial(id: string): Promise<Material | undefined> {
    const [material] = await db.select().from(materials).where(eq(materials.id, id));
    return material || undefined;
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const [newMaterial] = await db.insert(materials).values(material).returning();
    return newMaterial;
  }

  async updateMaterial(id: string, updates: Partial<Material>): Promise<Material | undefined> {
    const [updatedMaterial] = await db.update(materials).set(updates).where(eq(materials.id, id)).returning();
    return updatedMaterial || undefined;
  }

  async deleteMaterial(id: string): Promise<boolean> {
    const result = await db.delete(materials).where(eq(materials.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Decks
  async getDecksByUserId(userId: string): Promise<Deck[]> {
    return await db.select().from(decks).where(eq(decks.userId, userId));
  }

  async getDeck(id: string): Promise<Deck | undefined> {
    const [deck] = await db.select().from(decks).where(eq(decks.id, id));
    return deck || undefined;
  }

  async createDeck(deck: InsertDeck): Promise<Deck> {
    const [newDeck] = await db.insert(decks).values(deck).returning();
    return newDeck;
  }

  async updateDeck(id: string, updates: Partial<Deck>): Promise<Deck | undefined> {
    const [updatedDeck] = await db.update(decks).set(updates).where(eq(decks.id, id)).returning();
    return updatedDeck || undefined;
  }

  async deleteDeck(id: string): Promise<boolean> {
    const result = await db.delete(decks).where(eq(decks.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Flashcards
  async getFlashcardsByDeckId(deckId: string): Promise<Flashcard[]> {
    return await db.select().from(flashcards).where(eq(flashcards.deckId, deckId));
  }

  async getFlashcardsByMaterialId(materialId: string): Promise<Flashcard[]> {
    return await db.select().from(flashcards).where(eq(flashcards.materialId, materialId));
  }

  async getFlashcardsByUserId(userId: string): Promise<Flashcard[]> {
    return await db.select().from(flashcards).where(eq(flashcards.userId, userId));
  }

  async getFlashcardsForReview(userId: string): Promise<Flashcard[]> {
    const now = new Date();
    return await db.select().from(flashcards).where(
      and(
        eq(flashcards.userId, userId),
        lte(flashcards.nextReview, now)
      )
    );
  }

  async getFlashcardsForReviewByDeck(deckId: string): Promise<Flashcard[]> {
    const now = new Date();
    return await db.select().from(flashcards).where(
      and(
        eq(flashcards.deckId, deckId),
        lte(flashcards.nextReview, now)
      )
    );
  }

  async getFlashcard(id: string): Promise<Flashcard | undefined> {
    const [flashcard] = await db.select().from(flashcards).where(eq(flashcards.id, id));
    return flashcard || undefined;
  }

  async createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard> {
    const [newFlashcard] = await db.insert(flashcards).values(flashcard).returning();
    return newFlashcard;
  }

  async updateFlashcard(id: string, updates: Partial<Flashcard>): Promise<Flashcard | undefined> {
    const [updatedFlashcard] = await db.update(flashcards).set(updates).where(eq(flashcards.id, id)).returning();
    return updatedFlashcard || undefined;
  }

  async deleteFlashcard(id: string): Promise<boolean> {
    const result = await db.delete(flashcards).where(eq(flashcards.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Study Sessions
  async getStudySessionsByUserId(userId: string): Promise<StudySession[]> {
    return await db.select().from(studySessions).where(eq(studySessions.userId, userId));
  }

  async createStudySession(session: InsertStudySession): Promise<StudySession> {
    const [newSession] = await db.insert(studySessions).values(session).returning();
    return newSession;
  }

  // Settings
  async getSettings(userId: string): Promise<Settings | undefined> {
    const [userSettings] = await db.select().from(settings).where(eq(settings.userId, userId));
    return userSettings || undefined;
  }

  async createOrUpdateSettings(settingsData: InsertSettings): Promise<Settings> {
    // Try to find existing settings
    const existing = await this.getSettings(settingsData.userId!);
    
    if (existing) {
      // Update existing settings
      const [updatedSettings] = await db
        .update(settings)
        .set(settingsData)
        .where(eq(settings.userId, settingsData.userId!))
        .returning();
      return updatedSettings;
    } else {
      // Create new settings
      const [newSettings] = await db.insert(settings).values(settingsData).returning();
      return newSettings;
    }
  }
}