// Simple spaced repetition algorithm based on SM-2
export interface CardReview {
  correct: boolean;
  difficulty: number; // 1-5 scale
}

export function calculateNextReview(review: CardReview, previousInterval: number = 1, difficultyMultiplier: number = 1.0): {
  nextInterval: number;
  nextReviewDate: Date;
  newDifficulty: number;
} {
  let { correct, difficulty } = review;
  let interval = previousInterval;

  if (correct) {
    // Correct answer - increase interval
    if (interval === 1) {
      interval = 6; // 6 days for first correct review
    } else {
      interval = Math.ceil(interval * 2.5); // Exponential growth
    }
    
    // Apply difficulty multiplier to interval
    interval = Math.ceil(interval * difficultyMultiplier);
    
    // Slightly reduce difficulty for correct answers
    difficulty = Math.max(1, difficulty - 0.1);
  } else {
    // Incorrect answer - reset to short interval (always 1 day regardless of multiplier)
    interval = 1;
    
    // Increase difficulty for incorrect answers
    difficulty = Math.min(5, difficulty + 0.5);
  }

  // Cap the maximum interval at 180 days
  interval = Math.min(interval, 180);

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    nextInterval: interval,
    nextReviewDate,
    newDifficulty: difficulty,
  };
}

// Sort cards by priority (overdue cards first, then by difficulty)
export function sortCardsByPriority(cards: any[]): any[] {
  const now = new Date();
  
  return [...cards].sort((a, b) => {
    const aOverdue = new Date(a.nextReview) <= now;
    const bOverdue = new Date(b.nextReview) <= now;
    
    // Overdue cards first
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    
    // Among overdue cards, prioritize by how overdue they are
    if (aOverdue && bOverdue) {
      const aDays = Math.floor((now.getTime() - new Date(a.nextReview).getTime()) / (1000 * 60 * 60 * 24));
      const bDays = Math.floor((now.getTime() - new Date(b.nextReview).getTime()) / (1000 * 60 * 60 * 24));
      return bDays - aDays; // Most overdue first
    }
    
    // Among future cards, prioritize by difficulty (harder cards first)
    return b.difficulty - a.difficulty;
  });
}

// Calculate XP for a study session
export function calculateXP(focusMinutes: number, correctCards: number, focusInterrupted: boolean = false): number {
  let xp = focusMinutes * 2 + correctCards * 5;
  
  // Reduce XP if focus was interrupted
  if (focusInterrupted) {
    xp = Math.floor(xp * 0.7);
  }
  
  return Math.max(0, xp);
}

// Level progression system
export const ANIMALS = [
  { level: 1, name: "Kezdő Nyúl", minXP: 0 },
  { level: 2, name: "Okos Bagoly", minXP: 100 },
  { level: 3, name: "Gyors Gepárd", minXP: 300 },
  { level: 4, name: "Erős Medve", minXP: 600 },
  { level: 5, name: "Villám Nyúl", minXP: 1000 },
  { level: 6, name: "Bölcs Elefánt", minXP: 1500 },
  { level: 7, name: "Büszke Sas", minXP: 2100 },
  { level: 8, name: "Ravasz Róka", minXP: 2800 },
  { level: 9, name: "Hatalmas Oroszlán", minXP: 3600 },
  { level: 10, name: "Legendás Sárkány", minXP: 4500 },
];

export function getAnimalForXP(xp: number): { level: number; name: string; minXP: number; nextXP?: number } {
  const currentAnimal = ANIMALS.slice().reverse().find(animal => xp >= animal.minXP) || ANIMALS[0];
  const nextAnimal = ANIMALS.find(animal => animal.level > currentAnimal.level);
  
  return {
    ...currentAnimal,
    nextXP: nextAnimal?.minXP,
  };
}
