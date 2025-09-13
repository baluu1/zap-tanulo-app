import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface FocusState {
  isActive: boolean;
  startTime: Date | null;
  pausedTime: number;
  interruptions: number;
  lastActivity: Date;
}

interface FlashcardSession {
  cards: any[];
  currentIndex: number;
  correctCount: number;
  incorrectCount: number;
  sessionStartTime: Date | null;
}

interface AppState {
  // Theme
  theme: 'light' | 'dark' | 'auto';
  accentColor: string;
  
  // Chat
  globalChatHistory: ChatMessage[];
  contextChatHistory: ChatMessage[];
  currentContext: string | null;
  
  // Focus
  focusState: FocusState;
  
  // Flashcards
  flashcardSession: FlashcardSession;
  
  // Settings
  apiKey: string | null;
  focusAlerts: boolean;
  dailyReminders: boolean;
  cardDifficulty: string;
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setAccentColor: (color: string) => void;
  addGlobalChatMessage: (message: ChatMessage) => void;
  addContextChatMessage: (message: ChatMessage) => void;
  setCurrentContext: (context: string | null) => void;
  clearGlobalChat: () => void;
  clearContextChat: () => void;
  setFocusState: (state: Partial<FocusState>) => void;
  resetFocus: () => void;
  setFlashcardSession: (session: Partial<FlashcardSession>) => void;
  resetFlashcardSession: () => void;
  setApiKey: (key: string | null) => void;
  setFocusAlerts: (enabled: boolean) => void;
  setDailyReminders: (enabled: boolean) => void;
  setCardDifficulty: (difficulty: string) => void;
}

const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'light',
      accentColor: 'blue',
      globalChatHistory: [],
      contextChatHistory: [],
      currentContext: null,
      focusState: {
        isActive: false,
        startTime: null,
        pausedTime: 0,
        interruptions: 0,
        lastActivity: new Date(),
      },
      flashcardSession: {
        cards: [],
        currentIndex: 0,
        correctCount: 0,
        incorrectCount: 0,
        sessionStartTime: null,
      },
      apiKey: null,
      focusAlerts: true,
      dailyReminders: false,
      cardDifficulty: 'medium',

      // Actions
      setTheme: (theme) => set({ theme }),
      setAccentColor: (color) => set({ accentColor: color }),
      
      addGlobalChatMessage: (message) => 
        set((state) => ({
          globalChatHistory: [...state.globalChatHistory, message]
        })),
      
      addContextChatMessage: (message) => 
        set((state) => ({
          contextChatHistory: [...state.contextChatHistory, message]
        })),
      
      setCurrentContext: (context) => set({ currentContext: context }),
      
      clearGlobalChat: () => set({ globalChatHistory: [] }),
      clearContextChat: () => set({ contextChatHistory: [] }),
      
      setFocusState: (newState) => 
        set((state) => ({
          focusState: { ...state.focusState, ...newState }
        })),
      
      resetFocus: () => 
        set({
          focusState: {
            isActive: false,
            startTime: null,
            pausedTime: 0,
            interruptions: 0,
            lastActivity: new Date(),
          }
        }),
      
      setFlashcardSession: (newSession) => 
        set((state) => ({
          flashcardSession: { ...state.flashcardSession, ...newSession }
        })),
      
      resetFlashcardSession: () => 
        set({
          flashcardSession: {
            cards: [],
            currentIndex: 0,
            correctCount: 0,
            incorrectCount: 0,
            sessionStartTime: null,
          }
        }),
      
      setApiKey: (key) => set({ apiKey: key }),
      setFocusAlerts: (enabled) => set({ focusAlerts: enabled }),
      setDailyReminders: (enabled) => set({ dailyReminders: enabled }),
      setCardDifficulty: (difficulty) => set({ cardDifficulty: difficulty }),
    }),
    {
      name: 'zap-storage',
      // Only persist certain parts of the state
      partialize: (state) => ({
        theme: state.theme,
        accentColor: state.accentColor,
        apiKey: state.apiKey,
        focusAlerts: state.focusAlerts,
        dailyReminders: state.dailyReminders,
        cardDifficulty: state.cardDifficulty,
        globalChatHistory: state.globalChatHistory,
      }),
    }
  )
);

export default useStore;
