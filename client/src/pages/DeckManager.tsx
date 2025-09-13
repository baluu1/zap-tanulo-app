import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Edit3, Trash2, BookOpen, Save, X } from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import type { Deck, Flashcard } from '@shared/schema';

export default function DeckManager() {
  const [, params] = useRoute('/cards/:deckId');
  const deckId = params?.deckId;
  
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for deck details
  const { data: deck, isLoading: deckLoading } = useQuery({
    queryKey: [`/api/decks/${deckId}`],
    enabled: !!deckId,
    refetchOnWindowFocus: false,
  }) as { data: Deck | undefined; isLoading: boolean };

  // Query for deck cards
  const { data: cards = [], isLoading: cardsLoading } = useQuery({
    queryKey: [`/api/decks/${deckId}/cards`],
    enabled: !!deckId,
    refetchOnWindowFocus: false,
  }) as { data: Flashcard[]; isLoading: boolean };

  // Create card mutation
  const createCardMutation = useMutation({
    mutationFn: async (data: { question: string; answer: string }) => {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          deckId,
          difficulty: 1,
          nextReview: new Date(),
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to create card');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/decks/${deckId}/cards`] });
      queryClient.invalidateQueries({ queryKey: ['/api/decks', 'with-stats'] });
      setShowNewCardForm(false);
      setNewQuestion('');
      setNewAnswer('');
      toast({
        title: "Kártya létrehozva!",
        description: "Az új kártya sikeresen hozzáadva a paklihoz.",
      });
    },
    onError: () => {
      toast({
        title: "Hiba!",
        description: "Nem sikerült létrehozni a kártyát.",
        variant: "destructive",
      });
    }
  });

  // Update card mutation
  const updateCardMutation = useMutation({
    mutationFn: async (data: { id: string; question: string; answer: string }) => {
      const response = await fetch(`/api/flashcards/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          question: data.question,
          answer: data.answer,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to update card');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/decks/${deckId}/cards`] });
      setEditingCard(null);
      setEditQuestion('');
      setEditAnswer('');
      toast({
        title: "Kártya frissítve!",
        description: "A kártya sikeresen módosítva.",
      });
    },
    onError: () => {
      toast({
        title: "Hiba!",
        description: "Nem sikerült frissíteni a kártyát.",
        variant: "destructive",
      });
    }
  });

  // Delete card mutation
  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const response = await fetch(`/api/flashcards/${cardId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete card');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/decks/${deckId}/cards`] });
      queryClient.invalidateQueries({ queryKey: ['/api/decks', 'with-stats'] });
      toast({
        title: "Kártya törölve!",
        description: "A kártya sikeresen eltávolítva.",
      });
    },
    onError: () => {
      toast({
        title: "Hiba!",
        description: "Nem sikerült törölni a kártyát.",
        variant: "destructive",
      });
    }
  });

  const handleCreateCard = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast({
        title: "Hiba!",
        description: "Mind a kérdés, mind a válasz megadása kötelező.",
        variant: "destructive",
      });
      return;
    }

    createCardMutation.mutate({
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
    });
  };

  const handleEditCard = (card: Flashcard) => {
    setEditingCard(card);
    setEditQuestion(card.question);
    setEditAnswer(card.answer);
  };

  const handleUpdateCard = () => {
    if (!editingCard || !editQuestion.trim() || !editAnswer.trim()) {
      toast({
        title: "Hiba!",
        description: "Mind a kérdés, mind a válasz megadása kötelező.",
        variant: "destructive",
      });
      return;
    }

    updateCardMutation.mutate({
      id: editingCard.id,
      question: editQuestion.trim(),
      answer: editAnswer.trim(),
    });
  };

  const handleDeleteCard = (cardId: string) => {
    if (confirm('Biztosan törölni szeretnéd ezt a kártyát?')) {
      deleteCardMutation.mutate(cardId);
    }
  };

  const cancelEdit = () => {
    setEditingCard(null);
    setEditQuestion('');
    setEditAnswer('');
  };

  if (deckLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Pakli betöltése...</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/cards">
            <Button variant="outline" size="sm" data-testid="button-back-to-cards">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Vissza
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{deck.name}</h1>
            {deck.description && (
              <p className="text-muted-foreground mt-1">{deck.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" data-testid="card-count-badge">
            <BookOpen className="w-3 h-3 mr-1" />
            {cards.length} kártya
          </Badge>
          <Button
            onClick={() => setShowNewCardForm(true)}
            className="flex items-center gap-2"
            data-testid="button-add-card"
          >
            <Plus className="h-4 w-4" />
            Új kártya
          </Button>
        </div>
      </div>

      {/* New Card Form */}
      {showNewCardForm && (
        <Card className="border-primary/20" data-testid="new-card-form">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Új kártya hozzáadása
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="new-question" className="block text-sm font-medium mb-2">
                Kérdés *
              </label>
              <Textarea
                id="new-question"
                placeholder="Írd ide a kérdést..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                data-testid="input-new-question"
                rows={2}
              />
            </div>
            <div>
              <label htmlFor="new-answer" className="block text-sm font-medium mb-2">
                Válasz *
              </label>
              <Textarea
                id="new-answer"
                placeholder="Írd ide a válasz..."
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                data-testid="input-new-answer"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateCard}
                disabled={createCardMutation.isPending}
                data-testid="button-save-card"
              >
                <Save className="w-4 h-4 mr-2" />
                {createCardMutation.isPending ? 'Mentés...' : 'Kártya mentése'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewCardForm(false);
                  setNewQuestion('');
                  setNewAnswer('');
                }}
                data-testid="button-cancel-card"
              >
                <X className="w-4 h-4 mr-2" />
                Mégse
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards List */}
      {cardsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground text-sm">Kártyák betöltése...</p>
          </div>
        </div>
      ) : cards.length === 0 ? (
        <Card className="text-center py-12" data-testid="empty-cards-state">
          <CardContent>
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold mb-2">Még nincsenek kártyák</h3>
            <p className="text-muted-foreground mb-6">
              Add hozzá az első kártyádat ehhez a paklihoz!
            </p>
            <Button
              onClick={() => setShowNewCardForm(true)}
              className="flex items-center gap-2"
              data-testid="button-add-first-card"
            >
              <Plus className="h-4 w-4" />
              Első kártya hozzáadása
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {cards.map((card, index) => (
            <Card key={card.id} className="hover:shadow-md transition-shadow">
              {editingCard?.id === card.id ? (
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Kérdés</label>
                      <Textarea
                        value={editQuestion}
                        onChange={(e) => setEditQuestion(e.target.value)}
                        data-testid={`input-edit-question-${card.id}`}
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Válasz</label>
                      <Textarea
                        value={editAnswer}
                        onChange={(e) => setEditAnswer(e.target.value)}
                        data-testid={`input-edit-answer-${card.id}`}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleUpdateCard}
                        disabled={updateCardMutation.isPending}
                        size="sm"
                        data-testid={`button-save-edit-${card.id}`}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Mentés
                      </Button>
                      <Button
                        variant="outline"
                        onClick={cancelEdit}
                        size="sm"
                        data-testid={`button-cancel-edit-${card.id}`}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Mégse
                      </Button>
                    </div>
                  </div>
                </CardContent>
              ) : (
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <span className="text-xs text-muted-foreground">Kérdés</span>
                        </div>
                        <p className="text-sm font-medium" data-testid={`card-question-${card.id}`}>
                          {card.question}
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Válasz</div>
                        <p className="text-sm" data-testid={`card-answer-${card.id}`}>
                          {card.answer}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCard(card)}
                        data-testid={`button-edit-card-${card.id}`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-card-${card.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}