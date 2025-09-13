import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import useStore from '@/store/useStore';
import { focusDetector, FocusEvent } from '@/utils/focus-detector';
import { calculateXP } from '@/utils/spaced-repetition';
import { Play, Pause, RotateCcw, AlertTriangle, Clock } from 'lucide-react';

// Preset durations in minutes
const PRESET_DURATIONS = [5, 15, 25, 45, 60];

export default function Focus() {
  const [selectedDurationMinutes, setSelectedDurationMinutes] = useState(25);
  const [customDurationInput, setCustomDurationInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  // Calculate focus duration in seconds based on selected duration
  const focusDuration = selectedDurationMinutes * 60;
  const [timeLeft, setTimeLeft] = useState(focusDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [focusInterruptions, setFocusInterruptions] = useState(0);
  const [showCheatWarning, setShowCheatWarning] = useState(false);
  const [showSessionEndModal, setShowSessionEndModal] = useState(false);
  const [modalCardCount, setModalCardCount] = useState('');
  
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

  // Add XP mutation (atomic)
  const addXpMutation = useMutation({
    mutationFn: (xpDelta: number) => api.addXp(xpDelta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    }
  });

  // Focus detection
  useEffect(() => {
    const unsubscribe = focusDetector.onFocusChange((event: FocusEvent) => {
      if (!isRunning) return;
      
      // Don't count interruptions during UI dialogs (navigation confirmation, session end modal)
      if (focusState.isUIDialogOpen || showSessionEndModal) {
        return;
      }

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
  }, [isRunning, focusAlerts, toast, focusState.isUIDialogOpen, showSessionEndModal]);

  // Prevent page exit during focus session
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (focusState.isActive && isRunning) {
        e.preventDefault();
        e.returnValue = 'A fókusz munkamenet aktív! Biztosan elhagyja az oldalt? A munkamenet elvész.';
        return 'A fókusz munkamenet aktív! Biztosan elhagyja az oldalt? A munkamenet elvész.';
      }
    };

    if (focusState.isActive && isRunning) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [focusState.isActive, isRunning]);

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

  const handleTimerComplete = () => {
    // Show modal for card count input
    setShowSessionEndModal(true);
    setFocusState({ isUIDialogOpen: true }); // Signal that session end modal is open
  };

  const handleSessionEnd = async () => {
    const focusMinutes = Math.floor((focusDuration - timeLeft) / 60);
    const wasInterrupted = focusInterruptions > 0;
    const correctCards = parseInt(modalCardCount) || 0;
    const xp = calculateXP(focusMinutes, correctCards, wasInterrupted);

    // Save study session
    await createSessionMutation.mutateAsync({
      type: 'focus',
      duration: focusMinutes,
      xpEarned: xp,
      cardsStudied: correctCards,
      correctCards,
      focusInterrupted: wasInterrupted,
    });

    // Add XP atomically (no hardcoded values)
    await addXpMutation.mutateAsync(xp);

    toast({
      title: "Fókusz munkamenet befejezve!",
      description: `${focusMinutes} perc fókusz időt teljesítettél. ${correctCards} kártyával. +${xp} XP szerzett!`,
    });

    setFocusState({
      isActive: false,
      startTime: null,
      pausedTime: 0,
      interruptions: focusInterruptions,
    });
    
    setShowSessionEndModal(false);
    setFocusState({ isUIDialogOpen: false }); // Clear dialog flag
    setIsComplete(true);
  };

  const startTimer = () => {
    setIsRunning(true);
    setFocusState({
      isActive: true,
      startTime: new Date(),
      lastActivity: new Date(),
    });
    
    // Show soft lock notification
    toast({
      title: "Fókusz mód aktiválva",
      description: "A navigáció korlátozva a munkamenet alatt. Maradj fókuszban!",
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
    setTimeLeft(focusDuration);
    setIsComplete(false);
    setFocusInterruptions(0);
    setShowCheatWarning(false);
    setModalCardCount('');
    setShowSessionEndModal(false);
    setFocusState({ isUIDialogOpen: false }); // Clear dialog flag on reset
    resetFocus();
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // Update timer when duration changes
  useEffect(() => {
    if (!isRunning && !isComplete) {
      setTimeLeft(focusDuration);
    }
  }, [focusDuration, isRunning, isComplete]);

  const handlePresetSelect = (minutes: number) => {
    if (isRunning) return; // Don't change duration while running
    setSelectedDurationMinutes(minutes);
    setShowCustomInput(false);
    setCustomDurationInput('');
  };

  const handleCustomDuration = () => {
    const customMinutes = parseInt(customDurationInput);
    if (customMinutes && customMinutes >= 1 && customMinutes <= 120) {
      setSelectedDurationMinutes(customMinutes);
      setShowCustomInput(false);
      setCustomDurationInput('');
    }
  };

  const handleCustomInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomDuration();
    }
    if (e.key === 'Escape') {
      setShowCustomInput(false);
      setCustomDurationInput('');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((focusDuration - timeLeft) / focusDuration) * 100;
  const circumference = 2 * Math.PI * 112;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  const expectedXP = calculateXP(
    Math.floor((focusDuration - timeLeft) / 60), 
    0, // Cards will be entered at end
    focusInterruptions > 0
  );

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Fókusz mód</h1>
        <p className="text-muted-foreground">Állítható Pomodoro timer XP szerzéssel</p>
      </div>

      {/* Duration Selector */}
      <div className="max-w-2xl mx-auto mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-card-foreground mb-2 flex items-center justify-center">
                <Clock className="w-5 h-5 mr-2" />
                Munkamenet hossza
              </h3>
              <p className="text-sm text-muted-foreground">Válassz előre beállított időt vagy adj meg saját értéket (1-120 perc)</p>
            </div>
            
            {/* Preset Buttons */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {PRESET_DURATIONS.map((minutes) => (
                <Button
                  key={minutes}
                  variant={selectedDurationMinutes === minutes ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePresetSelect(minutes)}
                  disabled={isRunning}
                  className="min-w-16"
                  data-testid={`preset-${minutes}`}
                >
                  {minutes}p
                </Button>
              ))}
              <Button
                variant={showCustomInput ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (!isRunning) {
                    setShowCustomInput(!showCustomInput);
                    if (!showCustomInput) {
                      setCustomDurationInput(selectedDurationMinutes.toString());
                    }
                  }
                }}
                disabled={isRunning}
                data-testid="button-custom"
              >
                Egyéni
              </Button>
            </div>

            {/* Custom Input */}
            {showCustomInput && (
              <div className="flex items-center justify-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="120"
                  value={customDurationInput}
                  onChange={(e) => setCustomDurationInput(e.target.value)}
                  onKeyDown={handleCustomInputKeyPress}
                  placeholder="1-120 perc"
                  className="w-24 text-center"
                  data-testid="input-custom-duration"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleCustomDuration}
                  disabled={!customDurationInput || parseInt(customDurationInput) < 1 || parseInt(customDurationInput) > 120}
                  data-testid="button-apply-custom"
                >
                  Alkalmaz
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomDurationInput('');
                  }}
                  data-testid="button-cancel-custom"
                >
                  Mégse
                </Button>
              </div>
            )}
            
            {/* Selected Duration Display */}
            <div className="text-center mt-4">
              <div className="text-2xl font-bold text-primary" data-testid="selected-duration">
                {selectedDurationMinutes} perc
              </div>
              <div className="text-sm text-muted-foreground">
                {isRunning ? 'Munkamenet fut...' : 'Kész az indításra'}
              </div>
            </div>
          </CardContent>
        </Card>
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
                {timeLeft === focusDuration ? 'Indítás' : 'Folytatás'}
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
                <span className="text-muted-foreground">Tanult kártyák:</span>
                <span className="font-semibold text-muted-foreground" data-testid="cards-note">
                  A végén kérjük meg
                </span>
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
              Fókusz perc × 2 + Kártyák × 5
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
                  Munkamenet sikeresen befejezve!
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Session End Modal */}
      <Dialog open={showSessionEndModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" data-testid="session-end-modal">
          <DialogHeader>
            <DialogTitle>Fókusz munkamenet befejezve! 🎉</DialogTitle>
            <DialogDescription>
              Hány kártyát tanultál a munkamenet során?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cardCount">Tanult kártyák száma</Label>
              <Input
                id="cardCount"
                type="number"
                min="0"
                max="999"
                value={modalCardCount}
                onChange={(e) => setModalCardCount(e.target.value)}
                placeholder="pl. 15"
                data-testid="input-card-count"
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="secondary"
              onClick={() => {
                setModalCardCount('0');
                handleSessionEnd();
              }}
              data-testid="button-skip-cards"
            >
              Kihagyás (0 kártya)
            </Button>
            <Button
              onClick={handleSessionEnd}
              disabled={!modalCardCount || parseInt(modalCardCount) < 0}
              data-testid="button-confirm-cards"
            >
              Munkamenet befejezése
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
