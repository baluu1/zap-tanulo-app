import { apiRequest } from '@/lib/queryClient';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const api = {
  // Materials
  async getMaterials() {
    const response = await apiRequest('GET', '/api/materials');
    return response.json();
  },

  async getMaterial(id: string) {
    const response = await apiRequest('GET', `/api/materials/${id}`);
    return response.json();
  },

  async createMaterial(data: { title: string; content: string; type: string; summary?: string }) {
    const response = await apiRequest('POST', '/api/materials', data);
    return response.json();
  },

  // AI Processing
  async generateSummary(text: string, apiKey?: string) {
    const response = await apiRequest('POST', '/api/ai/summary', { text, apiKey });
    return response.json();
  },

  async generateFlashcards(text: string, apiKey?: string) {
    const response = await apiRequest('POST', '/api/ai/flashcards', { text, apiKey });
    return response.json();
  },

  async sendChatMessage(
    message: string, 
    context?: string, 
    history?: ChatMessage[], 
    apiKey?: string
  ) {
    const response = await apiRequest('POST', '/api/ai/chat', {
      message,
      context,
      history,
      apiKey
    });
    return response.json();
  },

  async testApiKey(apiKey: string) {
    const response = await apiRequest('POST', '/api/ai/test', { apiKey });
    return response.json();
  },

  // Flashcards
  async getFlashcards() {
    const response = await apiRequest('GET', '/api/flashcards');
    return response.json();
  },

  async getFlashcardsForReview() {
    const response = await apiRequest('GET', '/api/flashcards/review');
    return response.json();
  },

  async createFlashcard(data: {
    materialId?: string;
    question: string;
    answer: string;
    difficulty?: number;
    nextReview?: Date;
  }) {
    const response = await apiRequest('POST', '/api/flashcards', data);
    return response.json();
  },

  async updateFlashcard(id: string, data: Partial<{
    difficulty: number;
    nextReview: Date;
    lastReviewed: Date;
    correctCount: number;
    incorrectCount: number;
  }>) {
    const response = await apiRequest('PATCH', `/api/flashcards/${id}`, data);
    return response.json();
  },

  // Study Sessions
  async getStudySessions() {
    const response = await apiRequest('GET', '/api/study-sessions');
    return response.json();
  },

  async createStudySession(data: {
    type: string;
    duration?: number;
    xpEarned?: number;
    cardsStudied?: number;
    correctCards?: number;
    focusInterrupted?: boolean;
  }) {
    const response = await apiRequest('POST', '/api/study-sessions', data);
    return response.json();
  },

  // Settings
  async getSettings() {
    const response = await apiRequest('GET', '/api/settings');
    return response.json();
  },

  async saveSettings(data: {
    openaiApiKey?: string;
    theme?: string;
    accentColor?: string;
    focusAlerts?: boolean;
    dailyReminders?: boolean;
    cardDifficulty?: string;
  }) {
    const response = await apiRequest('POST', '/api/settings', data);
    return response.json();
  },

  // User
  async getUser() {
    const response = await apiRequest('GET', '/api/user');
    return response.json();
  },

  async updateUser(data: Partial<{
    xp: number;
    level: number;
    currentAnimal: string;
  }>) {
    const response = await apiRequest('PATCH', '/api/user', data);
    return response.json();
  },

  // Add XP atomically (fixes hardcoded XP issues)
  async addXp(xpDelta: number) {
    const response = await apiRequest('POST', '/api/user/add-xp', { xpDelta });
    return response.json();
  },
};
