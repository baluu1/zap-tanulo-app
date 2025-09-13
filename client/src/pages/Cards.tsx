import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, BookOpen, Clock, Calendar, Settings, Trash2, Edit3 } from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import type { Deck, Flashcard } from '@shared/schema';

interface DeckStats {
  totalCards: number;
  dueToday: number;
  lastStudied: string | null;
}

export default function Cards() {
  const [showNewDeckForm, setShowNewDeckForm] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for decks
  const { data: decks = [], isLoading } = useQuery({
    queryKey: ['/api/decks'],
    refetchOnWindowFocus: false,
  }) as { data: Deck[]; isLoading: boolean };

  // Create deck mutation
  const createDeckMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await apiRequest('/api/decks', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/decks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/decks', 'with-stats'] });
      setShowNewDeckForm(false);
      setNewDeckName('');
      setNewDeckDescription('');
      toast({
        title: "Pakli létrehozva!",
        description: "Az új pakli sikeresen létrehozva.",
      });
    },
    onError: () => {
      toast({
        title: "Hiba!",
        description: "Nem sikerült létrehozni a paklit.",
        variant: "destructive",
      });
    }
  });

  // Fetch deck cards for stats
  const deckQueries = decks.map((deck: Deck) => ({
    queryKey: [`/api/decks/${deck.id}/cards`],
    enabled: !!deck.id,
  }));
  
  const deckReviewQueries = decks.map((deck: Deck) => ({
    queryKey: [`/api/decks/${deck.id}/review`],
    enabled: !!deck.id,
  }));

  // Function to get real deck stats
  const getDeckStats = (deck: Deck): DeckStats => {
    // Get cards data from query cache
    const cardsData = queryClient.getQueryData([`/api/decks/${deck.id}/cards`]) as Flashcard[] | undefined;
    const reviewData = queryClient.getQueryData([`/api/decks/${deck.id}/review`]) as Flashcard[] | undefined;
    
    return {
      totalCards: cardsData?.length || 0,
      dueToday: reviewData?.length || 0,
      lastStudied: deck.lastStudied ? new Date(deck.lastStudied).toLocaleDateString('hu-HU') : null
    };
  };
  
  // Fetch cards for each deck to get real stats
  const deckCardQueries = useQuery({
    queryKey: ['/api/decks', 'with-stats'],
    queryFn: async () => {
      if (!decks || decks.length === 0) return [];
      
      const decksWithStats = await Promise.all(
        (decks as Deck[]).map(async (deck: Deck) => {
          const [cards, reviewCards] = await Promise.all([
            fetch(`/api/decks/${deck.id}/cards`).then(r => r.json()),
            fetch(`/api/decks/${deck.id}/review`).then(r => r.json())
          ]);
          
          // Cache the results for individual queries
          queryClient.setQueryData([`/api/decks/${deck.id}/cards`], cards);
          queryClient.setQueryData([`/api/decks/${deck.id}/review`], reviewCards);
          
          return { ...deck, cards, reviewCards };
        })
      );
      return decksWithStats;
    },
    enabled: Array.isArray(decks) && decks.length > 0,
    refetchOnWindowFocus: false,
  });

  const handleCreateDeck = () => {
    if (!newDeckName.trim()) {
      toast({
        title: "Hiba!",
        description: "A pakli név megadása kötelező.",
        variant: "destructive",
      });
      return;
    }

    createDeckMutation.mutate({
      name: newDeckName.trim(),
      description: newDeckDescription.trim() || undefined
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Paklik betöltése...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Paklik</h1>
          <p className="text-muted-foreground mt-2">
            Kezeld a kártyáidat paklikban a hatékony tanulásért
          </p>
        </div>
        <Button
          onClick={() => setShowNewDeckForm(true)}
          className="flex items-center gap-2"
          data-testid="button-new-deck"
        >
          <Plus className="h-4 w-4" />
          Új pakli
        </Button>
      </div>

      {/* New Deck Form */}
      {showNewDeckForm && (
        <Card className="border-primary/20" data-testid="new-deck-form">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Új pakli létrehozása
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="deck-name" className="block text-sm font-medium mb-2">
                Pakli név *
              </label>
              <Input
                id="deck-name"
                placeholder="pl. Magyar történelem, Matematika..."
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                data-testid="input-deck-name"
              />
            </div>
            <div>
              <label htmlFor="deck-description" className="block text-sm font-medium mb-2">
                Leírás (opcionális)
              </label>
              <Textarea
                id="deck-description"
                placeholder="Rövid leírás a pakliról..."
                value={newDeckDescription}
                onChange={(e) => setNewDeckDescription(e.target.value)}
                data-testid="input-deck-description"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateDeck}
                disabled={createDeckMutation.isPending}
                data-testid="button-create-deck"
              >
                {createDeckMutation.isPending ? 'Létrehozás...' : 'Pakli létrehozása'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewDeckForm(false);
                  setNewDeckName('');
                  setNewDeckDescription('');
                }}
                data-testid="button-cancel-deck"
              >
                Mégse
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {decks.length === 0 && !showNewDeckForm && (
        <Card className="text-center py-12" data-testid="empty-state">
          <CardContent>
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-semibold mb-2">Még nincsenek paklik</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Hozz létre az első paklidat és kezdj el tanulni rendszerezetten! 
              Importálhatsz is kártyákat CSV/TSV fájlból.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setShowNewDeckForm(true)}
                className="flex items-center gap-2"
                data-testid="button-create-first-deck"
              >
                <Plus className="h-4 w-4" />
                Hozz létre egy paklit
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                data-testid="button-import-deck"
              >
                <BookOpen className="h-4 w-4" />
                Importálás (CSV/TSV)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decks Grid */}
      {decks.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck: Deck) => {
            const stats = getDeckStats(deck);
            return (
              <Card 
                key={deck.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                data-testid={`deck-card-${deck.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {deck.name}
                    </CardTitle>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        data-testid={`button-edit-deck-${deck.id}`}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        data-testid={`button-delete-deck-${deck.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {deck.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {deck.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Stats */}
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span data-testid={`deck-total-cards-${deck.id}`}>
                          {stats.totalCards} kártya
                        </span>
                      </div>
                      {stats.dueToday > 0 && (
                        <Badge variant="secondary" data-testid={`deck-due-cards-${deck.id}`}>
                          {stats.dueToday} esedékes
                        </Badge>
                      )}
                    </div>

                    {/* Last Studied */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span data-testid={`deck-last-studied-${deck.id}`}>
                        {stats.lastStudied ? `Utoljára: ${stats.lastStudied}` : 'Még nem tanult'}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Link href={`/study/${deck.id}`} className="flex-1">
                        <Button 
                          size="sm" 
                          className="w-full"
                          data-testid={`button-study-deck-${deck.id}`}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Tanulás
                        </Button>
                      </Link>
                      <Link href={`/cards/${deck.id}`}>
                        <Button 
                          size="sm" 
                          variant="outline"
                          data-testid={`button-manage-deck-${deck.id}`}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}