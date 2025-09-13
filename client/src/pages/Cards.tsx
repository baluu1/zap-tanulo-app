import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import FlashCard from '@/components/FlashCard';
import { api } from '@/services/api';
import useStore from '@/store/useStore';
import { calculateNextReview, sortCardsByPriority, calculateXP } from '@/utils/spaced-repetition';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

export default function Cards() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({ known: 0, unknown: 0 });
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionCards, setSessionCards] = useState<any[]>([]);
  
  const { flashcardSession, setFlashcardSession, resetFlashcardSession } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for flashcards that need review
  const { data: allCards = [], isLoading } = useQuery({
    queryKey: ['/api/flashcards/review'],
    refetchOnWindowFocus: false,
  });

  // Update flashcard mutation
  const updateCardMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateFlashcard(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flashcards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/flashcards/review'] });
    }
  });

  // Create study session mutation
  const createSessionMutation = useMutation({
    mutationFn: (data: any) => api.createStudySession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/study-sessions'] });
    }
  });

  // Initialize session when cards are loaded
  useEffect(() => {
    if (allCards.length > 0 && sessionCards.length === 0) {
      const sortedCards = sortCardsByPriority(allCards).slice(0, 12); // Limit to 12 cards per session
      setSessionCards(sortedCards);
      setFlashcardSession({
        cards: sortedCards,
        currentIndex: 0,
        correctCount: 0,
        incorrectCount: 0,
        sessionStartTime: new Date(),
      });
    }
  }, [allCards, sessionCards.length, setFlashcardSession]);

  const currentCard = sessionCards[currentCardIndex];
  const progress = sessionCards.length > 0 ? ((currentCardIndex) / sessionCards.length) * 100 : 0;

  const handleCardResponse = async (known: boolean) => {
    if (!currentCard) return;

    const review = {
      correct: known,
      difficulty: currentCard.difficulty || 1,
    };

    const { nextInterval, nextReviewDate, newDifficulty } = calculateNextReview(
      review,
      1 // Previous interval - simplified for demo
    );

    // Update card in database
    await updateCardMutation.mutateAsync({
      id: currentCard.id,
      data: {
        difficulty: newDifficulty,
        nextReview: nextReviewDate,
        lastReviewed: new Date(),
        correctCount: known ? currentCard.correctCount + 1 : currentCard.correctCount,
        incorrectCount: known ? currentCard.incorrectCount : currentCard.incorrectCount + 1,
      }
    });

    // Update session stats
    const newStats = {
      known: sessionStats.known + (known ? 1 : 0),
      unknown: sessionStats.unknown + (known ? 0 : 1),
    };
    setSessionStats(newStats);

    // Update store
    setFlashcardSession({
      correctCount: newStats.known,
      incorrectCount: newStats.unknown,
    });

    // Move to next card or finish session
    if (currentCardIndex < sessionCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      // Session complete
      setSessionComplete(true);
      
      // Calculate XP and save session
      const sessionDuration = flashcardSession.sessionStartTime 
        ? Math.floor((Date.now() - flashcardSession.sessionStartTime.getTime()) / (1000 * 60))
        : 0;
      
      const xp = calculateXP(0, newStats.known, false); // No focus time for card-only sessions
      
      await createSessionMutation.mutateAsync({
        type: 'cards',
        duration: sessionDuration,
        xpEarned: xp,
        cardsStudied: sessionCards.length,
        correctCards: newStats.known,
        focusInterrupted: false,
      });

      toast({
        title: "Munkamenet befejezve!",
        description: `${newStats.known} ismert, ${newStats.unknown} ismeretlen kártya. +${xp} XP szerzett!`,
      });
    }
  };

  const resetSession = () => {
    setCurrentCardIndex(0);
    setSessionStats({ known: 0, unknown: 0 });
    setSessionComplete(false);
    setSessionCards([]);
    resetFlashcardSession();
    queryClient.invalidateQueries({ queryKey: ['/api/flashcards/review'] });
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

  if (allCards.length === 0) {
    return (
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Kártyák</h1>
          <p className="text-muted-foreground">Nincs áttekintendő kártya</p>
        </div>
        
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-lg font-semibold mb-2">Minden kártya naprakész!</h3>
            <p className="text-muted-foreground mb-4">
              Jelenleg nincs olyan kártya, amit gyakorolnod kellene. Térj vissza később, vagy hozz létre új kártyákat.
            </p>
            <Button onClick={() => window.location.href = '/upload'} data-testid="button-create-cards">
              Új kártyák létrehozása
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Kártyák</h1>
          <p className="text-muted-foreground">Munkamenet befejezve</p>
        </div>

        <Card className="max-w-md mx-auto" data-testid="session-stats">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4 text-center">
              Munkamenet befejezve!
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center mb-6">
              <div>
                <div className="text-2xl font-bold text-green-600" data-testid="known-count">
                  {sessionStats.known}
                </div>
                <div className="text-sm text-muted-foreground">Ismert</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-destructive" data-testid="unknown-count">
                  {sessionStats.unknown}
                </div>
                <div className="text-sm text-muted-foreground">Ismeretlen</div>
              </div>
            </div>
            <Button 
              onClick={resetSession} 
              className="w-full"
              data-testid="button-new-session"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Új munkamenet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Kártyák</h1>
        <p className="text-muted-foreground">Swipe jobbra ha tudod, balra ha nem tudod</p>
      </div>

      <div className="max-w-md mx-auto">
        {/* Card Display */}
        <div className="relative h-96 mb-8">
          {currentCard && (
            <FlashCard
              question={currentCard.question}
              answer={currentCard.answer}
              onKnown={() => handleCardResponse(true)}
              onUnknown={() => handleCardResponse(false)}
              className="absolute inset-0"
            />
          )}

          {/* Next card preview */}
          {currentCardIndex < sessionCards.length - 1 && (
            <Card className="absolute inset-0 transform scale-95 -translate-y-2 opacity-50 pointer-events-none" style={{ zIndex: -1 }}>
              <CardContent className="p-6 h-full flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-card-foreground">
                    {sessionCards[currentCardIndex + 1]?.question}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-4">Következő kártya</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Swipe Instructions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center text-destructive">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-sm">Nem tudom</span>
          </div>
          <div className="flex items-center text-green-600">
            <span className="text-sm">Tudom</span>
            <ArrowRight className="w-5 h-5 ml-2" />
          </div>
        </div>

        {/* Progress */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Haladás</span>
              <span className="text-sm font-semibold text-card-foreground" data-testid="card-progress">
                {currentCardIndex + 1}/{sessionCards.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={() => handleCardResponse(false)}
            className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="button-unknown-main"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Nem tudom
          </Button>
          <Button
            onClick={() => handleCardResponse(true)}
            className="flex-1 bg-green-600 text-white hover:bg-green-700"
            data-testid="button-known-main"
          >
            Tudom
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Current Session Stats */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-center text-sm">
              <div>
                <div className="font-semibold text-green-600" data-testid="session-known">
                  {sessionStats.known}
                </div>
                <div className="text-muted-foreground">Ismert ebben a munkamenetben</div>
              </div>
              <div>
                <div className="font-semibold text-destructive" data-testid="session-unknown">
                  {sessionStats.unknown}
                </div>
                <div className="text-muted-foreground">Ismeretlen ebben a munkamenetben</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
