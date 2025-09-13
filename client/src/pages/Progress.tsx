import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { api } from '@/services/api';
import { getAnimalForXP } from '@/utils/spaced-repetition';
import { 
  Trophy, 
  Layers, 
  Clock, 
  Book, 
  Calculator, 
  Zap,
  Upload
} from 'lucide-react';

export default function ProgressPage() {
  // Query for user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/user'],
  });

  // Query for study sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/study-sessions'],
  });

  // Query for materials
  const { data: materials = [] } = useQuery({
    queryKey: ['/api/materials'],
  });

  // Query for flashcards
  const { data: flashcards = [] } = useQuery({
    queryKey: ['/api/flashcards'],
  });

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

  const currentAnimal = user ? getAnimalForXP(user.xp || 0) : { level: 1, name: "Kezdő Nyúl", minXP: 0, nextXP: 100 };
  const xpProgress = user && currentAnimal.nextXP 
    ? ((user.xp - currentAnimal.minXP) / (currentAnimal.nextXP - currentAnimal.minXP)) * 100
    : 0;

  // Calculate weekly stats from sessions
  const weeklyStats = {
    totalMinutes: sessions.reduce((sum: number, session: any) => sum + (session.duration || 0), 0),
    cardsStudied: sessions.reduce((sum: number, session: any) => sum + (session.cardsStudied || 0), 0),
    focusSessions: sessions.filter((s: any) => s.type === 'focus').length,
    totalXP: sessions.reduce((sum: number, session: any) => sum + (session.xpEarned || 0), 0),
  };

  // Mock daily activity data (in real app would come from sessions grouped by day)
  const dailyActivity = [
    { day: 'H', minutes: 45, label: 'Hétfő' },
    { day: 'K', minutes: 32, label: 'Kedd' },
    { day: 'Sz', minutes: 18, label: 'Szerda' },
    { day: 'Cs', minutes: 67, label: 'Csütörtök' },
    { day: 'P', minutes: 28, label: 'Péntek' },
    { day: 'Sz', minutes: 22, label: 'Szombat' },
    { day: 'V', minutes: 89, label: 'Vasárnap' },
  ];

  const maxMinutes = Math.max(...dailyActivity.map(d => d.minutes));

  // Mock achievements
  const achievements = [
    { icon: Trophy, name: 'Első hét', description: '7 napon át tanultál', earned: true, color: 'text-yellow-600 dark:text-yellow-400' },
    { icon: Layers, name: 'Kártya mester', description: '100 kártyát tanultál', earned: flashcards.length >= 6, color: 'text-blue-600 dark:text-blue-400' },
    { icon: Clock, name: 'Fókusz bajnok', description: '50 fókusz munkamenet', earned: false, color: 'text-gray-400' },
  ];

  // Calculate material mastery
  const materialStats = materials.map((material: any) => {
    const materialCards = flashcards.filter((card: any) => card.materialId === material.id);
    const masteredCards = materialCards.filter((card: any) => card.correctCount > card.incorrectCount);
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
                  <div key={index} className="text-center" data-testid={`activity-${day.day}`}>
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
                  <div className="text-2xl font-bold text-primary">{user?.xp || 0}</div>
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
                {sessions.slice(0, 5).map((session: any, index: number) => (
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
                        {new Date(session.createdAt).toLocaleDateString('hu-HU')}
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
                <Zap className="w-12 h-12 text-primary" />
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
                    {user?.xp || 0}/{currentAnimal.nextXP || 100}
                  </span>
                </div>
                <Progress value={xpProgress} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  {currentAnimal.nextXP ? (currentAnimal.nextXP - (user?.xp || 0)) : 0} XP a következő szintig
                </p>
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
                {materialStats.map((material: any, index: number) => (
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
