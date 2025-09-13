import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { api } from '@/services/api';
import { getAnimalForXP } from '@/utils/spaced-repetition';
import type { StudySession, Material, Flashcard } from '@shared/schema';
import { 
  Trophy, 
  Layers, 
  Clock, 
  Book, 
  Calculator, 
  Upload
} from 'lucide-react';
import { ANIMALS } from '@/utils/spaced-repetition';

export default function ProgressPage() {
  // Query for user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/user'],
  }) as { data: { xp: number } | undefined; isLoading: boolean };

  // Query for study sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/study-sessions'],
  }) as { data: StudySession[]; isLoading: boolean };

  // Query for materials
  const { data: materials = [] } = useQuery({
    queryKey: ['/api/materials'],
  }) as { data: Material[] };

  // Query for flashcards
  const { data: flashcards = [] } = useQuery({
    queryKey: ['/api/flashcards'],
  }) as { data: Flashcard[] };

  if (userLoading || sessionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Haladás betöltése...</p>
        </div>
      </div>
    );
  }

  // Calculate total XP from local session data first
  const localTotalXP = sessions.reduce((sum: number, session: StudySession) => sum + (session.xpEarned || 0), 0);
  const displayXP = localTotalXP > 0 ? localTotalXP : (user?.xp || 0);

  const currentAnimal = getAnimalForXP(displayXP);
  const xpProgress = currentAnimal.nextXP 
    ? ((displayXP - currentAnimal.minXP) / (currentAnimal.nextXP - currentAnimal.minXP)) * 100
    : 0;

  // Calculate weekly stats from sessions (last 7 days)
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  
  const weeklySessionsOnly = sessions.filter((session: StudySession) => {
    if (!session.createdAt) return false;
    const sessionDate = new Date(session.createdAt);
    return sessionDate >= weekStart;
  });
  
  const weeklyStats = {
    totalMinutes: weeklySessionsOnly.reduce((sum: number, session: StudySession) => sum + (session.duration || 0), 0),
    cardsStudied: weeklySessionsOnly.reduce((sum: number, session: StudySession) => sum + (session.cardsStudied || 0), 0),
    focusSessions: weeklySessionsOnly.filter((s: StudySession) => s.type === 'focus').length,
    totalXP: weeklySessionsOnly.reduce((sum: number, session: StudySession) => sum + (session.xpEarned || 0), 0),
  };

  // Calculate real daily activity from sessions (last 7 days)
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - i));
    return date;
  });
  
  const dayLabels = ['H', 'K', 'Sz', 'Cs', 'P', 'Szo', 'V'];
  const dayNames = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
  
  const dailyActivity = last7Days.map((date, index) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayMinutes = sessions
      .filter((session: StudySession) => {
        if (!session.createdAt) return false;
        const sessionDate = new Date(session.createdAt);
        return sessionDate >= dayStart && sessionDate <= dayEnd;
      })
      .reduce((sum: number, session: StudySession) => sum + (session.duration || 0), 0);
    
    return {
      day: dayLabels[date.getDay() === 0 ? 6 : date.getDay() - 1], // Convert Sunday=0 to our format
      minutes: dayMinutes,
      label: dayNames[date.getDay() === 0 ? 6 : date.getDay() - 1]
    };
  });

  const maxMinutes = Math.max(1, ...dailyActivity.map(d => d.minutes)); // Guard against division by zero

  // Calculate real achievements from actual user data
  const totalCardsStudied = sessions.reduce((sum: number, session: StudySession) => 
    sum + (session.cardsStudied || 0), 0);
  
  const focusSessionCount = sessions.filter((s: StudySession) => s.type === 'focus').length;
  
  const studyStreak = (() => {
    // Calculate consecutive days with study activity
    let streak = 0;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      checkDate.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(checkDate);
      nextDay.setHours(23, 59, 59, 999);
      
      const hasActivity = sessions.some((session: StudySession) => {
        if (!session.createdAt) return false;
        const sessionDate = new Date(session.createdAt);
        return sessionDate >= checkDate && sessionDate <= nextDay;
      });
      
      if (hasActivity) {
        streak++;
      } else if (i > 0) {
        break; // Stop counting if we hit a day without activity (but allow today to be empty)
      }
    }
    return streak;
  })();
  
  const achievements = [
    {
      icon: Trophy,
      name: 'Első hét',
      description: '7 napon át tanultál',
      earned: studyStreak >= 7,
      color: studyStreak >= 7 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-400'
    },
    {
      icon: Layers,
      name: 'Kártya mester',
      description: '100 kártyát tanultál',
      earned: totalCardsStudied >= 100,
      color: totalCardsStudied >= 100 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
    },
    {
      icon: Clock,
      name: 'Fókusz bajnok',
      description: '50 fókusz munkamenet',
      earned: focusSessionCount >= 50,
      color: focusSessionCount >= 50 ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'
    },
  ];

  // Calculate material mastery
  const materialStats = materials.map((material: Material) => {
    const materialCards = flashcards.filter((card: Flashcard) => card.materialId === material.id);
    const masteredCards = materialCards.filter((card: Flashcard) => (card.correctCount || 0) > (card.incorrectCount || 0));
    const masteryPercentage = materialCards.length > 0 ? Math.round((masteredCards.length / materialCards.length) * 100) : 0;
    
    return {
      ...material,
      cardCount: materialCards.length,
      masteryPercentage,
    };
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Haladás</h1>
        <p className="text-muted-foreground">A tanulási statisztikáid és fejlődésed</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Activity */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Napi aktivitás</h3>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {dailyActivity.map((day, index) => (
                  <div key={index} className="text-center" data-testid={`activity-${day.day}-${index}`}>
                    <div className="text-xs text-muted-foreground mb-1">{day.day}</div>
                    <div className="bg-primary/20 rounded h-8 flex items-end justify-center">
                      <div 
                        className="bg-primary rounded w-full transition-all duration-300" 
                        style={{ height: `${(day.minutes / maxMinutes) * 100}%` }}
                        title={`${day.label}: ${day.minutes} perc`}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{day.minutes}p</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Stats */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Heti statisztikák</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center" data-testid="stat-minutes">
                  <div className="text-2xl font-bold text-primary">{weeklyStats.totalMinutes}</div>
                  <div className="text-sm text-muted-foreground">Tanult perc</div>
                </div>
                <div className="text-center" data-testid="stat-cards">
                  <div className="text-2xl font-bold text-primary">{weeklyStats.cardsStudied}</div>
                  <div className="text-sm text-muted-foreground">Tanult kártya</div>
                </div>
                <div className="text-center" data-testid="stat-sessions">
                  <div className="text-2xl font-bold text-primary">{weeklyStats.focusSessions}</div>
                  <div className="text-sm text-muted-foreground">Fókusz munkamenet</div>
                </div>
                <div className="text-center" data-testid="stat-xp">
                  <div className="text-2xl font-bold text-primary">{displayXP}</div>
                  <div className="text-sm text-muted-foreground">Összes XP</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Legutóbbi aktivitás</h3>
              <div className="space-y-3" data-testid="recent-activities">
                {sessions.slice(0, 5).map((session: StudySession, index: number) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      {session.type === 'cards' && <Layers className="w-4 h-4 text-primary" />}
                      {session.type === 'focus' && <Clock className="w-4 h-4 text-primary" />}
                      {session.type === 'chat' && <Upload className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-card-foreground">
                        {session.type === 'cards' && `${session.cardsStudied || 0} kártyát tanultál`}
                        {session.type === 'focus' && `${session.duration || 0} perces fókusz munkamenet befejezve`}
                        {session.type === 'chat' && 'AI chat munkamenet'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.createdAt ? new Date(session.createdAt).toLocaleDateString('hu-HU') : 'N/A'}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-primary">+{session.xpEarned || 0} XP</div>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Még nincs tanulási aktivitás</p>
                    <p className="text-sm">Kezdj el tanulni, hogy lásd a haladásodat!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Level Progress */}
        <div className="space-y-6">
          {/* Current Level */}
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Jelenlegi szint</h3>
              
              {/* Animal Avatar */}
              <div className="bg-primary/10 w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center" data-testid="animal-avatar">
                <span className="text-4xl" role="img" aria-label={currentAnimal.name}>
                  {currentAnimal.icon}
                </span>
              </div>
              
              <h4 className="text-xl font-bold text-card-foreground mb-2" data-testid="current-level">
                {currentAnimal.name}
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                {currentAnimal.level}. szint
              </p>
              
              {/* XP Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">XP</span>
                  <span className="text-card-foreground" data-testid="xp-progress">
                    {displayXP}/{currentAnimal.nextXP || 100}
                  </span>
                </div>
                <Progress value={xpProgress} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  {currentAnimal.nextXP ? Math.max(0, currentAnimal.nextXP - displayXP) : 0} XP a következő szintig
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Animal Progression */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Szintek</h3>
              <div className="space-y-2" data-testid="animal-progression">
                {ANIMALS.map((animal, index) => {
                  const isUnlocked = displayXP >= animal.minXP;
                  const isCurrent = currentAnimal.level === animal.level;
                  
                  return (
                    <div 
                      key={index}
                      className={`flex items-center space-x-3 p-2 rounded-lg transition-all ${
                        isCurrent 
                          ? 'bg-primary/10 border border-primary/20' 
                          : isUnlocked 
                          ? 'bg-muted/50' 
                          : 'opacity-50'
                      }`}
                      data-testid={`animal-level-${animal.level}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isUnlocked ? 'bg-primary/20' : 'bg-muted'
                      }`}>
                        <span className="text-lg" role="img" aria-label={animal.name}>
                          {animal.icon}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          isUnlocked ? 'text-card-foreground' : 'text-muted-foreground'
                        }`}>
                          {animal.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {animal.minXP} XP{isCurrent ? ' (jelenlegi)' : ''}
                        </p>
                      </div>
                      {isCurrent && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Eredmények</h3>
              <div className="space-y-3" data-testid="achievements">
                {achievements.map((achievement, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center space-x-3 ${!achievement.earned ? 'opacity-50' : ''}`}
                  >
                    <div className={`p-2 rounded-full ${
                      achievement.earned 
                        ? 'bg-yellow-100 dark:bg-yellow-900/20' 
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <achievement.icon className={`w-4 h-4 ${achievement.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-card-foreground">{achievement.name}</p>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Study Materials */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Tananyagok</h3>
              <div className="space-y-3" data-testid="study-materials">
                {materialStats.map((material: Material & { cardCount: number; masteryPercentage: number }, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary/10 p-2 rounded">
                        {material.type === 'text' && <Book className="w-4 h-4 text-primary" />}
                        {material.type === 'pdf' && <Book className="w-4 h-4 text-primary" />}
                        {material.type === 'image' && <Calculator className="w-4 h-4 text-primary" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-card-foreground truncate max-w-32">
                          {material.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {material.cardCount} kártya
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">
                        {material.masteryPercentage}%
                      </p>
                      <p className="text-xs text-muted-foreground">elsajátítva</p>
                    </div>
                  </div>
                ))}
                {materials.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <Book className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Még nincs tananyag</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
