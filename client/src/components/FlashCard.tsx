import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, RotateCcw } from 'lucide-react';

interface FlashCardProps {
  question: string;
  answer: string;
  onKnown: () => void;
  onUnknown: () => void;
  className?: string;
}

export default function FlashCard({ question, answer, onKnown, onUnknown, className = "" }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleKnown = () => {
    onKnown();
    setIsFlipped(false);
  };

  const handleUnknown = () => {
    onUnknown();
    setIsFlipped(false);
  };

  return (
    <div className={`flip-card cursor-pointer ${isFlipped ? 'flipped' : ''} ${className}`} data-testid="flashcard">
      <div className="flip-card-inner w-full h-full">
        {/* Front Side - Question */}
        <Card 
          className="flip-card-front absolute inset-0 border-2 border-border hover:border-primary/50 transition-colors shadow-lg"
          onClick={handleFlip}
          data-testid="flashcard-front"
        >
          <CardContent className="p-6 h-full flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">{question}</h3>
              <p className="text-sm text-muted-foreground mt-4">Kattints a megfordításhoz</p>
            </div>
          </CardContent>
        </Card>

        {/* Back Side - Answer */}
        <Card 
          className="flip-card-back absolute inset-0 bg-primary border-2 border-primary shadow-lg"
          onClick={handleFlip}
          data-testid="flashcard-back"
        >
          <CardContent className="p-6 h-full flex flex-col items-center justify-center">
            <div className="text-center flex-1 flex flex-col justify-center">
              <h3 className="text-lg font-semibold text-primary-foreground mb-4">{answer}</h3>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-4 mt-4" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleUnknown}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-unknown"
              >
                <X className="w-4 h-4 mr-2" />
                Nem tudom
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleKnown}
                className="bg-green-600 text-white hover:bg-green-700"
                data-testid="button-known"
              >
                <Check className="w-4 h-4 mr-2" />
                Tudom
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
