import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import useStore from '@/store/useStore';
import { Link } from 'wouter';
import { 
  FileText, 
  UploadCloud, 
  Send, 
  Loader2,
  AlertTriangle,
  Edit3
} from 'lucide-react';

export default function Upload() {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [contextMessage, setContextMessage] = useState('');
  const [currentMaterial, setCurrentMaterial] = useState<any>(null);
  
  const { apiKey, contextChatHistory, addContextChatMessage, setCurrentContext } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for materials
  const { data: materials = [] } = useQuery({
    queryKey: ['/api/materials'],
  });

  // Generate summary mutation
  const summaryMutation = useMutation({
    mutationFn: (data: { text: string; apiKey?: string }) => api.generateSummary(data.text, data.apiKey),
    onSuccess: (data) => {
      setSummary(data.summary);
      toast({ title: "Összefoglaló elkészült!", description: "Az AI sikeresen létrehozta az összefoglalót." });
    },
    onError: (error: any) => {
      toast({
        title: "Hiba történt",
        description: error.message || "Nem sikerült az összefoglalót elkészíteni.",
        variant: "destructive"
      });
    }
  });


  // Create material mutation
  const createMaterialMutation = useMutation({
    mutationFn: (data: { title: string; content: string; type: string; summary?: string }) => 
      api.createMaterial(data),
    onSuccess: (material) => {
      setCurrentMaterial(material);
      setCurrentContext(material.content);
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
    }
  });


  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: (data: { message: string; context?: string; history?: any[]; apiKey?: string }) =>
      api.sendChatMessage(data.message, data.context, data.history, data.apiKey),
    onSuccess: (data) => {
      addContextChatMessage({
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      });
    },
    onError: (error: any) => {
      toast({
        title: "Chat hiba",
        description: error.message || "Nem sikerült elküldeni az üzenetet.",
        variant: "destructive"
      });
    }
  });

  const handleGenerateSummary = () => {
    if (!text.trim()) {
      toast({ title: "Hiba", description: "Kérlek adj meg szöveget!", variant: "destructive" });
      return;
    }

    if (!apiKey) {
      toast({ 
        title: "API kulcs hiányzik", 
        description: "Állítsd be az OpenAI API kulcsot a beállításokban!",
        variant: "destructive" 
      });
      return;
    }

    summaryMutation.mutate({ text, apiKey });
  };

  const handleManualCardCreation = () => {
    // Optionally save material if text exists, but don't block navigation
    if (text.trim()) {
      const title = text.substring(0, 50) + (text.length > 50 ? '...' : '');
      createMaterialMutation.mutate({
        title,
        content: text,
        type: 'text',
        summary
      });
      
      toast({ 
        title: "Anyag mentve!", 
        description: "Most létrehozhatsz kártyákat manuálisan a Paklik oldalon."
      });
    }
    // Navigation happens automatically via Link wrapper
  };

  const handleSaveMaterial = () => {
    if (!text.trim()) {
      toast({ title: "Hiba", description: "Nincs mentendő szöveg!", variant: "destructive" });
      return;
    }

    const title = text.substring(0, 50) + (text.length > 50 ? '...' : '');
    createMaterialMutation.mutate({
      title,
      content: text,
      type: 'text',
      summary
    });
  };


  const handleSendContextMessage = () => {
    if (!contextMessage.trim() || !currentMaterial) return;

    if (!apiKey) {
      toast({ 
        title: "API kulcs hiányzik", 
        description: "Állítsd be az OpenAI API kulcsot a beállításokban!",
        variant: "destructive" 
      });
      return;
    }

    addContextChatMessage({
      role: 'user',
      content: contextMessage,
      timestamp: new Date()
    });

    chatMutation.mutate({
      message: contextMessage,
      context: currentMaterial.content,
      history: contextChatHistory,
      apiKey
    });

    setContextMessage('');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // TODO: Implement OCR processing for PDF/images
    toast({
      title: "Funkció fejlesztés alatt",
      description: "A fájl feltöltés és OCR funkció hamarosan elérhető lesz.",
      variant: "default"
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Feltöltés & Szövegbevitel</h1>
        <p className="text-muted-foreground">Illeszd be a szöveget vagy tölts fel fájlokat</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Text Input Section */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Szöveg beillesztése</h3>
              <Textarea
                placeholder="Illeszd be ide a tanulni kívánt szöveget..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-64 resize-none"
                data-testid="input-text"
              />
              
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  onClick={handleGenerateSummary}
                  disabled={summaryMutation.isPending || !text.trim()}
                  data-testid="button-summary"
                >
                  {summaryMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2" />
                  )}
                  Összefoglaló (AI szükséges)
                </Button>
                <Link href="/cards">
                  <Button
                    onClick={handleManualCardCreation}
                    data-testid="button-manual-cards"
                    variant="outline"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Kártyák kézi létrehozása
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* File Upload Section */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Fájl feltöltése</h3>
              <div 
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById('file-input')?.click()}
                data-testid="file-upload-area"
              >
                <UploadCloud className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">Húzd ide a fájlokat vagy kattints a tallózáshoz</p>
                <p className="text-sm text-muted-foreground">PDF, JPG, PNG fájlok támogatottak</p>
                <Input
                  id="file-input"
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={handleFileUpload}
                  data-testid="input-file"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview/Results Section */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Feldolgozott tartalom</h3>
              <div className="space-y-4">
                {summary && (
                  <div className="p-4 bg-muted rounded-md" data-testid="summary-result">
                    <h4 className="font-medium text-card-foreground mb-2">Összefoglaló</h4>
                    <p className="text-muted-foreground text-sm">{summary}</p>
                  </div>
                )}
                

                {!summary && (
                  <div className="p-4 bg-muted/50 rounded-md text-center">
                    <p className="text-muted-foreground text-sm">
                      A feldolgozott tartalom itt fog megjelenni
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Context Chat */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Téma Chat</h3>
              
              {currentMaterial ? (
                <>
                  <div className="space-y-3 max-h-40 overflow-y-auto mb-4" data-testid="context-chat-messages">
                    {contextChatHistory.map((message, index) => (
                      <div key={index} className="text-sm">
                        <div className={`p-2 rounded ${
                          message.role === 'user' 
                            ? 'bg-primary text-primary-foreground ml-8' 
                            : 'bg-muted mr-8'
                        }`}>
                          <strong>{message.role === 'user' ? 'Te:' : 'AI:'}</strong> {message.content}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex">
                    <Input
                      placeholder="Kérdezz erről az anyagról..."
                      value={contextMessage}
                      onChange={(e) => setContextMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendContextMessage()}
                      className="flex-1"
                      data-testid="input-context-message"
                    />
                    <Button
                      onClick={handleSendContextMessage}
                      disabled={chatMutation.isPending || !contextMessage.trim()}
                      className="ml-2"
                      data-testid="button-send-context"
                    >
                      {chatMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Először mentsd el az anyagot a téma-specifikus chat használatához
                  </p>
                  <Button
                    onClick={handleSaveMaterial}
                    disabled={!text.trim() || createMaterialMutation.isPending}
                    data-testid="button-save-material"
                  >
                    {createMaterialMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Anyag mentése
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* API Key Warning */}
          {!apiKey && (
            <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20" data-testid="api-key-warning">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Az AI funkciók működéséhez OpenAI API kulcs szükséges. 
                    <Link href="/settings">
                      <Button variant="link" className="p-0 h-auto text-yellow-800 dark:text-yellow-200 underline ml-1">
                        Állítsd be a beállításokban.
                      </Button>
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
