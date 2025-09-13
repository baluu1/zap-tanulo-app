import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, RotateCcw, Clock, CheckCircle, XCircle, Home } from 'lucide-react';
import { calculateNextReview } from '@/utils/spaced-repetition';
import useStore from '@/store/useStore';
import type { Deck, Flashcard } from '@shared/schema';

interface StudyStats {
  correct: number;
  incorrect: number;
  total: number;
  currentIndex: number;
}

export default function StudyMode() {
  const [, params] = useRoute('/study/:deckId');
  const deckId = params?.deckId;
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyStats, setStudyStats] = useState<StudyStats>({
    correct: 0,
    incorrect: 0,
    total: 0,
    currentIndex: 0,
  });
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { cardDifficulty } = useStore();

  // Query for deck details
  const { data: deck } = useQuery({
    queryKey: [`/api/decks/${deckId}`],
    enabled: !!deckId,
    refetchOnWindowFocus: false,
  }) as { data: Deck | undefined };

  // Query for cards that need review
  const { data: reviewCards = [], isLoading } = useQuery({
    queryKey: [`/api/decks/${deckId}/review`],
    enabled: !!deckId,
    refetchOnWindowFocus: false,
  }) as { data: Flashcard[]; isLoading: boolean };

  // Update flashcard mutation
  const updateCardMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to update card');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/decks/${deckId}/cards`] });
      queryClient.invalidateQueries({ queryKey: [`/api/decks/${deckId}/review`] });
    }
  });

  // Create study session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/study-sessions', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to create session');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/study-sessions'] });
    }
  });

  // Initialize session when review cards are loaded
  useEffect(() => {
    if (reviewCards.length > 0 && sessionCards.length === 0) {
      // Limit to 20 cards per session for better UX
      const limitedCards = reviewCards.slice(0, 20);
      setSessionCards(limitedCards);
      setStudyStats({
        correct: 0,
        incorrect: 0,
        total: limitedCards.length,
        currentIndex: 0,
      });
    }
  }, [reviewCards, sessionCards.length]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (sessionComplete || !showAnswer) return;
      
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handleCardResponse(false);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleCardResponse(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showAnswer, sessionComplete]);

  const currentCard = sessionCards[currentCardIndex];
  const progress = sessionCards.length > 0 ? ((currentCardIndex) / sessionCards.length) * 100 : 0;

  const handleCardReveal = () => {
    setShowAnswer(true);
  };

  const handleCardResponse = async (known: boolean) => {
    if (!currentCard || !showAnswer) return;

    // Calculate next review using spaced repetition with global difficulty setting
    const difficultyMultiplier = {
      'easy': 1.5,    // Easier intervals (longer gaps)
      'medium': 1.0,  // Standard intervals
      'hard': 0.7     // Harder intervals (shorter gaps)
    }[cardDifficulty] || 1.0;

    const review = {
      correct: known,
      difficulty: currentCard.difficulty || 1,
    };

    const previousInterval = currentCard.lastReviewed 
      ? Math.ceil((Date.now() - new Date(currentCard.lastReviewed).getTime()) / (1000 * 60 * 60 * 24))
      : 1;

    const { nextInterval, nextReviewDate, newDifficulty } = calculateNextReview(review, previousInterval, difficultyMultiplier);

    // Update card in database
    await updateCardMutation.mutateAsync({
      id: currentCard.id,
      data: {
        difficulty: newDifficulty,
        nextReview: nextReviewDate,
        lastReviewed: new Date(),
        correctCount: known ? (currentCard.correctCount || 0) + 1 : currentCard.correctCount,
        incorrectCount: known ? currentCard.incorrectCount : (currentCard.incorrectCount || 0) + 1,
      }
    });

    // Update session stats
    const newStats = {
      ...studyStats,
      correct: studyStats.correct + (known ? 1 : 0),
      incorrect: studyStats.incorrect + (known ? 0 : 1),
      currentIndex: currentCardIndex,
    };
    setStudyStats(newStats);

    // Move to next card or finish session
    if (currentCardIndex < sessionCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    } else {
      // Session complete
      setSessionComplete(true);
      
      // Calculate XP (simplified: 5 points per correct card, 1 per incorrect)
      const xp = newStats.correct * 5 + newStats.incorrect * 1;
      
      // Save study session
      await createSessionMutation.mutateAsync({
        type: 'cards',
        duration: 0, // We don't track duration for card-only sessions currently
        xpEarned: xp,
        cardsStudied: sessionCards.length,
        correctCards: newStats.correct,
        focusInterrupted: false,
      });

      toast({
        title: "Tanulási munkamenet befejezve!",
        description: `${newStats.correct} helyes, ${newStats.incorrect} helytelen válasz. +${xp} XP szerzett!`,
      });
    }
  };

  const resetSession = () => {
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setStudyStats({ correct: 0, incorrect: 0, total: 0, currentIndex: 0 });
    setSessionComplete(false);
    setSessionCards([]);
    queryClient.invalidateQueries({ queryKey: [`/api/decks/${deckId}/review`] });
  };

  // Touch event handlers for swipe gestures
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || !showAnswer) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);
    const minSwipeDistance = 50;

    if (isHorizontalSwipe && Math.abs(distanceX) > minSwipeDistance) {
      if (distanceX > 0) {
        // Swiped left = "Nem tudom" (Don't know)
        handleCardResponse(false);
      } else {
        // Swiped right = "Tudom" (I know)
        handleCardResponse(true);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Kártyák betöltése...</p>
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Pakli nem található</h1>
        <Link href="/cards">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Vissza a paklikhoz
          </Button>
        </Link>
      </div>
    );
  }

  if (reviewCards.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{deck.name}</h1>
          <p className="text-muted-foreground">Nincs tanulnivaló kártya</p>
        </div>
        
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-lg font-semibold mb-2">Minden kártya naprakész!</h3>
            <p className="text-muted-foreground mb-4">
              Jelenleg nincs olyan kártya, amit gyakorolnod kellene. Térj vissza később!
            </p>
            <Link href="/cards">
              <Button data-testid="button-back-to-decks">
                <Home className="w-4 h-4 mr-2" />
                Vissza a paklikhoz
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{deck.name}</h1>
          <p className="text-muted-foreground">Tanulási munkamenet befejezve</p>
        </div>

        <Card className="max-w-md mx-auto" data-testid="session-complete">
          <CardContent className="p-6">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-lg font-semibold text-card-foreground mb-4">
              Szuper munka!
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center mb-6">
              <div>
                <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                  <CheckCircle className="w-6 h-6" />
                  <span data-testid="correct-count">{studyStats.correct}</span>
                </div>
                <div className="text-sm text-muted-foreground">Helyes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-destructive flex items-center justify-center gap-1">
                  <XCircle className="w-6 h-6" />
                  <span data-testid="incorrect-count">{studyStats.incorrect}</span>
                </div>
                <div className="text-sm text-muted-foreground">Helytelen</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={resetSession} 
                className="flex-1"
                data-testid="button-new-session"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Új munkamenet
              </Button>
              <Link href="/cards" className="flex-1">
                <Button variant="outline" className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Paklik
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 text-center">
        <Link href="/cards" className="inline-block mb-4">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Vissza
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{deck.name}</h1>
        <p className="text-muted-foreground">
          {showAnswer 
            ? "Swipe jobbra ha tudod, balra ha nem tudod, vagy használd a ←/→ gombokat"
            : "Koppints a kártyára a válasz megtekintéséhez"
          }
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">Haladás</span>
          <div className="flex items-center gap-4">
            <Badge variant="outline">
              <span data-testid="progress-text">
                {currentCardIndex + 1}/{sessionCards.length}
              </span>
            </Badge>
            <div className="flex gap-2 text-xs">
              <span className="text-green-600">✓ {studyStats.correct}</span>
              <span className="text-destructive">✗ {studyStats.incorrect}</span>
            </div>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Card Display */}
      <div 
        className="relative mb-8 cursor-pointer select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={showAnswer ? undefined : handleCardReveal}
        data-testid="study-card"
      >
        <Card className="min-h-[300px] hover:shadow-lg transition-shadow">
          <CardContent className="p-8 h-full flex items-center justify-center">
            <div className="text-center space-y-4 w-full">
              <div className="text-lg font-semibold text-card-foreground">
                {currentCard?.question}
              </div>
              
              {showAnswer ? (
                <div className="pt-4 border-t border-border">
                  <div className="text-muted-foreground mb-2 text-sm">Válasz:</div>
                  <div className="text-lg text-card-foreground">
                    {currentCard?.answer}
                  </div>
                </div>
              ) : (
                <div className="pt-4">
                  <div className="text-muted-foreground text-sm">
                    Koppints ide a válasz megtekintéséhez
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Next card preview */}
        {currentCardIndex < sessionCards.length - 1 && (
          <Card className="absolute inset-0 transform scale-95 -translate-y-2 opacity-30 pointer-events-none" style={{ zIndex: -1 }}>
            <CardContent className="p-8 h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Következő kártya</div>
                <div className="text-base font-medium text-card-foreground mt-2">
                  {sessionCards[currentCardIndex + 1]?.question}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Buttons - Only show when answer is revealed */}
      {showAnswer && (
        <>
          {/* Swipe Instructions */}
          <div className="flex justify-between items-center mb-6 text-sm">
            <div className="flex items-center text-destructive">
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span>Swipe balra / ← gomb</span>
            </div>
            <div className="flex items-center text-green-600">
              <span>Swipe jobbra / → gomb</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={() => handleCardResponse(false)}
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-14"
              data-testid="button-dont-know"
            >
              <XCircle className="w-5 h-5 mr-2" />
              Nem tudom
            </Button>
            <Button
              onClick={() => handleCardResponse(true)}
              className="flex-1 bg-green-600 text-white hover:bg-green-700 h-14"
              data-testid="button-know"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Tudom
            </Button>
          </div>
        </>
      )}
    </div>
  );
}