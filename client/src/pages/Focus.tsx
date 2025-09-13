import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import useStore from '@/store/useStore';
import { focusDetector, FocusEvent } from '@/utils/focus-detector';
import { calculateXP } from '@/utils/spaced-repetition';
import { Play, Pause, RotateCcw, AlertTriangle } from 'lucide-react';

const FOCUS_DURATION = 25 * 60; // 25 minutes in seconds

export default function Focus() {
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [focusInterruptions, setFocusInterruptions] = useState(0);
  const [showCheatWarning, setShowCheatWarning] = useState(false);
  const [correctCards, setCorrectCards] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { focusState, setFocusState, resetFocus, focusAlerts } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create study session mutation
  const createSessionMutation = useMutation({
    mutationFn: (data: any) => api.createStudySession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/study-sessions'] });
    }
  });

  // Update user XP mutation
  const updateUserMutation = useMutation({
    mutationFn: (data: any) => api.updateUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    }
  });

  // Focus detection
  useEffect(() => {
    const unsubscribe = focusDetector.onFocusChange((event: FocusEvent) => {
      if (!isRunning) return;

      if (event.type === 'blur' || event.type === 'hidden' || event.type === 'idle') {
        setFocusInterruptions(prev => prev + 1);
        
        if (focusAlerts) {
          setShowCheatWarning(true);
          toast({
            title: "Fókusz megszakadt!",
            description: "Az oldal elhagyása vagy inaktivitás miatt a fókusz megszakadt.",
            variant: "destructive"
          });
        }

        // Hide warning after 3 seconds
        setTimeout(() => setShowCheatWarning(false), 3000);
      }
    });

    return unsubscribe;
  }, [isRunning, focusAlerts, toast]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = async () => {
    const focusMinutes = Math.floor((FOCUS_DURATION - timeLeft) / 60);
    const wasInterrupted = focusInterruptions > 0;
    const xp = calculateXP(focusMinutes, correctCards, wasInterrupted);

    // Save study session
    await createSessionMutation.mutateAsync({
      type: 'focus',
      duration: focusMinutes,
      xpEarned: xp,
      cardsStudied: 0,
      correctCards,
      focusInterrupted: wasInterrupted,
    });

    // Update user XP (simplified - in real app would fetch current XP first)
    await updateUserMutation.mutateAsync({
      xp: 1432 + xp, // Demo XP + earned XP
    });

    toast({
      title: "Fókusz munkamenet befejezve!",
      description: `${focusMinutes} perc fókusz időt teljesítettél. +${xp} XP szerzett!`,
    });

    setFocusState({
      isActive: false,
      startTime: null,
      pausedTime: 0,
      interruptions: focusInterruptions,
    });
  };

  const startTimer = () => {
    setIsRunning(true);
    setFocusState({
      isActive: true,
      startTime: new Date(),
      lastActivity: new Date(),
    });
  };

  const pauseTimer = () => {
    setIsRunning(false);
    setFocusState({
      isActive: false,
      pausedTime: focusState.pausedTime + 1,
    });
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(FOCUS_DURATION);
    setIsComplete(false);
    setFocusInterruptions(0);
    setShowCheatWarning(false);
    setCorrectCards(0);
    resetFocus();
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((FOCUS_DURATION - timeLeft) / FOCUS_DURATION) * 100;
  const circumference = 2 * Math.PI * 112;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  const expectedXP = calculateXP(
    Math.floor((FOCUS_DURATION - timeLeft) / 60), 
    correctCards, 
    focusInterruptions > 0
  );

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Fókusz mód</h1>
        <p className="text-muted-foreground">25 perces Pomodoro timer XP szerzéssel</p>
      </div>

      <div className="max-w-md mx-auto text-center">
        {/* Circular Progress */}
        <div className="relative mb-8">
          <svg className="progress-ring w-64 h-64 mx-auto transform -rotate-90" width="256" height="256">
            <circle
              className="text-muted stroke-current"
              strokeWidth="8"
              fill="transparent"
              r="112"
              cx="128"
              cy="128"
            />
            <circle
              className="text-primary stroke-current progress-ring-circle"
              strokeWidth="8"
              fill="transparent"
              r="112"
              cx="128"
              cy="128"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.35s' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div>
              <div className="text-4xl font-bold text-foreground" data-testid="timer-display">
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-muted-foreground" data-testid="timer-status">
                {isComplete ? 'Befejezve!' : isRunning ? 'Futó' : 'Kész az indításra'}
              </div>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center space-x-4 mb-8">
          <Button
            onClick={isRunning ? pauseTimer : startTimer}
            disabled={isComplete}
            className="px-6 py-3"
            data-testid="button-start-pause"
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 mr-2" />
                Szünet
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                {timeLeft === FOCUS_DURATION ? 'Indítás' : 'Folytatás'}
              </>
            )}
          </Button>
          <Button
            onClick={resetTimer}
            variant="secondary"
            className="px-6 py-3"
            data-testid="button-reset"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Újra
          </Button>
        </div>

        {/* Focus Status */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">Fókusz állapot</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Fókusz megtartva:</span>
                <span 
                  className={`font-semibold ${
                    focusInterruptions === 0 ? 'text-green-600' : 'text-destructive'
                  }`}
                  data-testid="focus-status"
                >
                  {focusInterruptions === 0 ? '✓ Aktív' : `${focusInterruptions} megszakítás`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Helyes kártyák:</span>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCorrectCards(Math.max(0, correctCards - 1))}
                    disabled={correctCards === 0}
                    data-testid="button-decrease-cards"
                  >
                    -
                  </Button>
                  <span className="font-semibold text-card-foreground min-w-8" data-testid="correct-cards">
                    {correctCards}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCorrectCards(correctCards + 1)}
                    data-testid="button-increase-cards"
                  >
                    +
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Várható XP:</span>
                <span className="font-semibold text-primary" data-testid="expected-xp">
                  {expectedXP}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* XP Calculation Info */}
        <Card className="mb-6 bg-muted/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>XP számítás:</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Fókusz perc × 2 + Helyes kártyák × 5
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              A fókusz megszakadása csökkenti az XP-t
            </p>
          </CardContent>
        </Card>

        {/* Anti-cheat Warning */}
        {showCheatWarning && (
          <Card className="border-destructive/20 bg-destructive/10" data-testid="cheat-warning">
            <CardContent className="p-4">
              <div className="flex items-center text-destructive">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">Fókusz megszakadt!</span>
              </div>
              <p className="text-sm text-destructive/80 mt-1">
                Az oldal elhagyása vagy inaktivitás miatt az XP csökkent.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Session Complete Message */}
        {isComplete && (
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20" data-testid="session-complete">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl mb-2">🎉</div>
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  Fókusz munkamenet befejezve!
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Szuper munka! +{expectedXP} XP szerzett.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
