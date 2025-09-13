import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/components/ThemeProvider';
import { api } from '@/services/api';
import useStore from '@/store/useStore';
import { 
  Eye, 
  EyeOff, 
  Sun, 
  Moon, 
  Monitor, 
  Download, 
  Upload as UploadIcon, 
  Trash2,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function Settings() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState<boolean | null>(null);

  const { theme, setTheme } = useTheme();
  const { 
    apiKey, 
    setApiKey, 
    accentColor, 
    setAccentColor, 
    focusAlerts, 
    setFocusAlerts,
    dailyReminders,
    setDailyReminders,
    cardDifficulty,
    setCardDifficulty
  } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings'],
    retry: false,
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: (data: any) => api.saveSettings(data),
    onSuccess: () => {
      toast({ title: "Beállítások mentve!", description: "A beállításaid sikeresen frissítve lettek." });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Mentési hiba",
        description: error.message || "Nem sikerült menteni a beállításokat.",
        variant: "destructive"
      });
    }
  });

  // Initialize API key input when settings load
  useEffect(() => {
    if (settings?.openaiApiKey && !apiKeyInput) {
      setApiKeyInput(settings.openaiApiKey);
      setApiKey(settings.openaiApiKey);
    }
  }, [settings, apiKeyInput, setApiKey]);

  const handleSaveApiKey = async () => {
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim());
      await saveSettingsMutation.mutateAsync({
        openaiApiKey: apiKeyInput.trim(),
      });
    }
  };

  const handleTestApiKey = async () => {
    if (!apiKeyInput.trim()) {
      toast({ title: "Hiba", description: "Kérlek add meg az API kulcsot!", variant: "destructive" });
      return;
    }

    setIsTestingKey(true);
    setKeyTestResult(null);

    try {
      const result = await api.testApiKey(apiKeyInput.trim());
      setKeyTestResult(result.success);
      
      if (result.success) {
        toast({ title: "API kulcs működik!", description: "A kapcsolat sikeresen létrejött." });
      } else {
        toast({ 
          title: "API kulcs hiba", 
          description: "A kulcs nem érvényes vagy nincs internetkapcsolat.",
          variant: "destructive" 
        });
      }
    } catch (error) {
      setKeyTestResult(false);
      toast({ 
        title: "Tesztelési hiba", 
        description: "Nem sikerült tesztelni az API kulcsot.",
        variant: "destructive" 
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme === 'auto' ? 'system' : newTheme);
    await saveSettingsMutation.mutateAsync({
      theme: newTheme,
    });
  };

  const handleAccentColorChange = async (color: string) => {
    setAccentColor(color);
    await saveSettingsMutation.mutateAsync({
      accentColor: color,
    });
  };

  const handleToggleFocusAlerts = async (enabled: boolean) => {
    setFocusAlerts(enabled);
    await saveSettingsMutation.mutateAsync({
      focusAlerts: enabled,
    });
  };

  const handleToggleDailyReminders = async (enabled: boolean) => {
    setDailyReminders(enabled);
    await saveSettingsMutation.mutateAsync({
      dailyReminders: enabled,
    });
  };

  const handleCardDifficultyChange = async (difficulty: string) => {
    setCardDifficulty(difficulty);
    await saveSettingsMutation.mutateAsync({
      cardDifficulty: difficulty,
    });
  };

  const handleExportData = () => {
    const data = {
      settings: useStore.getState(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zap-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: "Adatok exportálva!", description: "A biztonsági mentés letöltése megkezdődött." });
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        if (importedData.settings) {
          // Restore settings from imported data
          const { settings } = importedData;
          if (settings.apiKey) setApiKey(settings.apiKey);
          if (settings.accentColor) setAccentColor(settings.accentColor);
          if (typeof settings.focusAlerts === 'boolean') setFocusAlerts(settings.focusAlerts);
          if (typeof settings.dailyReminders === 'boolean') setDailyReminders(settings.dailyReminders);
          if (settings.cardDifficulty) setCardDifficulty(settings.cardDifficulty);
          
          toast({ title: "Adatok importálva!", description: "A beállítások sikeresen visszaállítva." });
        }
      } catch (error) {
        toast({ 
          title: "Import hiba", 
          description: "A fájl formátuma nem megfelelő.",
          variant: "destructive" 
        });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleClearAllData = () => {
    if (window.confirm('Biztosan törölni szeretnéd az összes adatot? Ez a művelet visszavonhatatlan!')) {
      // Clear local storage
      localStorage.clear();
      
      // Reset store to defaults
      setApiKey(null);
      setAccentColor('blue');
      setFocusAlerts(true);
      setDailyReminders(false);
      setCardDifficulty('medium');
      
      toast({ 
        title: "Adatok törölve!", 
        description: "Minden adat sikeresen törölve lett.",
        variant: "destructive" 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Beállítások betöltése...</p>
        </div>
      </div>
    );
  }

  const accentColors = [
    { name: 'Kék', value: 'blue', color: 'bg-blue-600' },
    { name: 'Zöld', value: 'green', color: 'bg-green-600' },
    { name: 'Lila', value: 'purple', color: 'bg-purple-600' },
    { name: 'Piros', value: 'red', color: 'bg-red-600' },
    { name: 'Sárga', value: 'yellow', color: 'bg-yellow-600' },
    { name: 'Indigo', value: 'indigo', color: 'bg-indigo-600' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Beállítások</h1>
        <p className="text-muted-foreground">API kulcsok és alkalmazás beállítások</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* OpenAI API Settings */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">OpenAI API Beállítások</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="api-key" className="text-sm font-medium text-card-foreground mb-2">
                  API Kulcs
                </Label>
                <div className="relative">
                  <Input
                    id="api-key"
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="sk-..."
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="pr-12"
                    data-testid="input-api-key"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                    onClick={() => setShowApiKey(!showApiKey)}
                    data-testid="button-toggle-api-key"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Az API kulcs biztonságosan tárolódik a böngésződben. 
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary hover:underline ml-1"
                  >
                    Szerezz be egyet itt.
                  </a>
                </p>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSaveApiKey}
                    disabled={saveSettingsMutation.isPending || !apiKeyInput.trim()}
                    data-testid="button-save-api-key"
                  >
                    {saveSettingsMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Kulcs mentése
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTestApiKey}
                    disabled={isTestingKey || !apiKeyInput.trim()}
                    data-testid="button-test-api-key"
                  >
                    {isTestingKey ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Kulcs tesztelése
                  </Button>
                </div>
                <div className="flex items-center text-sm" data-testid="api-key-status">
                  {keyTestResult === true && (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-green-600">Működik</span>
                    </>
                  )}
                  {keyTestResult === false && (
                    <>
                      <XCircle className="w-4 h-4 text-destructive mr-2" />
                      <span className="text-destructive">Hibás</span>
                    </>
                  )}
                  {keyTestResult === null && !apiKey && (
                    <>
                      <div className="w-2 h-2 bg-destructive rounded-full mr-2"></div>
                      <span className="text-muted-foreground">Nincs beállítva</span>
                    </>
                  )}
                  {keyTestResult === null && apiKey && (
                    <>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                      <span className="text-muted-foreground">Nem tesztelve</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">Megjelenés</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-card-foreground mb-2">Téma</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    className="p-3 flex flex-col items-center"
                    onClick={() => handleThemeChange('light')}
                    data-testid="button-theme-light"
                  >
                    <Sun className="w-5 h-5 mb-1" />
                    <span className="text-xs">Világos</span>
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    className="p-3 flex flex-col items-center"
                    onClick={() => handleThemeChange('dark')}
                    data-testid="button-theme-dark"
                  >
                    <Moon className="w-5 h-5 mb-1" />
                    <span className="text-xs">Sötét</span>
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    className="p-3 flex flex-col items-center"
                    onClick={() => handleThemeChange('auto')}
                    data-testid="button-theme-auto"
                  >
                    <Monitor className="w-5 h-5 mb-1" />
                    <span className="text-xs">Auto</span>
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-card-foreground mb-2">Accent szín</Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {accentColors.map((color) => (
                    <Button
                      key={color.value}
                      variant="outline"
                      className={`w-8 h-8 p-0 rounded-lg ${color.color} ${
                        accentColor === color.value ? 'ring-2 ring-primary ring-offset-2' : ''
                      }`}
                      onClick={() => handleAccentColorChange(color.value)}
                      title={color.name}
                      data-testid={`button-accent-${color.value}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learning Settings */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">Tanulási beállítások</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center" data-testid="setting-focus-alerts">
                <div>
                  <Label className="text-sm font-medium text-card-foreground">Fókusz figyelmeztetések</Label>
                  <p className="text-xs text-muted-foreground">Értesítés fókusz megszakadásakor</p>
                </div>
                <Switch
                  checked={focusAlerts}
                  onCheckedChange={handleToggleFocusAlerts}
                />
              </div>

              <div className="flex justify-between items-center" data-testid="setting-daily-reminders">
                <div>
                  <Label className="text-sm font-medium text-card-foreground">Napi emlékeztetők</Label>
                  <p className="text-xs text-muted-foreground">Tanulási emlékeztetők küldése</p>
                </div>
                <Switch
                  checked={dailyReminders}
                  onCheckedChange={handleToggleDailyReminders}
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-card-foreground mb-2">
                  Kártyák nehézségi szintje
                </Label>
                <Select value={cardDifficulty} onValueChange={handleCardDifficultyChange}>
                  <SelectTrigger data-testid="select-card-difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Kezdő</SelectItem>
                    <SelectItem value="medium">Közepes</SelectItem>
                    <SelectItem value="hard">Haladó</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">Adatok kezelése</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  variant="secondary"
                  onClick={handleExportData}
                  data-testid="button-export-data"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Adatok exportálása
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => document.getElementById('import-input')?.click()}
                  data-testid="button-import-data"
                >
                  <UploadIcon className="w-4 h-4 mr-2" />
                  Adatok importálása
                </Button>
                <input
                  id="import-input"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportData}
                />
              </div>
              <div className="border-t border-border pt-4">
                <Button
                  variant="destructive"
                  onClick={handleClearAllData}
                  className="w-full"
                  data-testid="button-clear-data"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Összes adat törlése
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Ez véglegesen törli az összes tanulási adatot és beállítást.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
