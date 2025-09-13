import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  Layers, 
  MessageCircle, 
  Clock, 
  TrendingUp, 
  Settings 
} from 'lucide-react';

export default function Functions() {
  const [, navigate] = useLocation();

  const functions = [
    {
      title: 'Feltöltés & Szövegbevitel',
      description: 'Szöveg beillesztése vagy fájl feltöltése PDF/kép formátumban',
      icon: Upload,
      route: '/upload',
      testId: 'function-upload'
    },
    {
      title: 'Kártyák',
      description: 'Intelligens kártyák tanulása ismétlési algoritmussal',
      icon: Layers,
      route: '/cards',
      testId: 'function-cards'
    },
    {
      title: 'AI Chat',
      description: 'Kérdezz bármit az AI tanári asszisztenstől',
      icon: MessageCircle,
      route: '/chat',
      testId: 'function-chat'
    },
    {
      title: 'Fókusz mód',
      description: '25 perces Pomodoro timer XP számítással',
      icon: Clock,
      route: '/focus',
      testId: 'function-focus'
    },
    {
      title: 'Haladás',
      description: 'Napi aktivitás és tanulási statisztikák',
      icon: TrendingUp,
      route: '/progress',
      testId: 'function-progress'
    },
    {
      title: 'Beállítások',
      description: 'OpenAI API kulcs és egyéb beállítások',
      icon: Settings,
      route: '/settings',
      testId: 'function-settings'
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Funkciók</h1>
        <p className="text-muted-foreground">Válassz egy funkciót a tanulás megkezdéséhez</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {functions.map((func) => (
          <Card
            key={func.title}
            className="hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => navigate(func.route)}
            data-testid={func.testId}
          >
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-primary/10 p-3 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <func.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-card-foreground">{func.title}</h3>
              </div>
              <p className="text-muted-foreground">{func.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
