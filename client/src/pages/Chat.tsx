import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import useStore from '@/store/useStore';
import { Send, Bot, User, Loader2, AlertTriangle } from 'lucide-react';

export default function Chat() {
  const [message, setMessage] = useState('');
  const { 
    apiKey, 
    globalChatHistory, 
    addGlobalChatMessage, 
    clearGlobalChat 
  } = useStore();
  const { toast } = useToast();

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: (data: { message: string; history: any[]; apiKey?: string }) =>
      api.sendChatMessage(data.message, undefined, data.history, data.apiKey),
    onSuccess: (data) => {
      addGlobalChatMessage({
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

  const handleSendMessage = () => {
    if (!message.trim()) return;

    if (!apiKey) {
      toast({ 
        title: "API kulcs hiányzik", 
        description: "Állítsd be az OpenAI API kulcsot a beállításokban!",
        variant: "destructive" 
      });
      return;
    }

    // Add user message
    addGlobalChatMessage({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Send to API
    chatMutation.mutate({
      message,
      history: globalChatHistory,
      apiKey
    });

    setMessage('');
  };

  const handleClearChat = () => {
    clearGlobalChat();
    toast({ title: "Chat törölve", description: "A chat előzmények törölve lettek." });
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">AI Chat</h1>
            <p className="text-muted-foreground">Kérdezz bármit a tanulással kapcsolatban</p>
          </div>
          {globalChatHistory.length > 0 && (
            <Button 
              variant="outline" 
              onClick={handleClearChat}
              data-testid="button-clear-chat"
            >
              Chat törlése
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card className="h-96 flex flex-col">
          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-6" data-testid="chat-messages">
            <div className="space-y-4">
              {globalChatHistory.length === 0 && (
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-card-foreground">
                        Szia! Én vagyok a ZAP AI asszisztensed. Miben segíthetek a tanulásban?
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">Most</span>
                  </div>
                </div>
              )}

              {globalChatHistory.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex items-start space-x-3 ${
                    msg.role === 'user' ? 'justify-end' : ''
                  }`}
                  data-testid={`message-${msg.role}-${index}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  
                  <div className={`flex-1 ${msg.role === 'user' ? 'max-w-xs' : ''}`}>
                    <div className={`p-3 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-card-foreground'
                    }`}>
                      <p>{msg.content}</p>
                    </div>
                    <span className={`text-xs text-muted-foreground mt-1 ${
                      msg.role === 'user' ? 'flex justify-end' : ''
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString('hu-HU', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {msg.role === 'user' && (
                    <div className="bg-secondary/50 p-2 rounded-full">
                      <User className="w-4 h-4 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {chatMutation.isPending && (
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <p className="text-card-foreground">AI gondolkodik...</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="border-t border-border p-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Írd be a kérdésedet..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                disabled={chatMutation.isPending}
                className="flex-1"
                data-testid="input-chat-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={chatMutation.isPending || !message.trim()}
                data-testid="button-send-message"
              >
                {chatMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* API Key Warning */}
        {!apiKey && (
          <Card className="mt-4 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20" data-testid="api-key-warning">
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Az AI chat működéséhez OpenAI API kulcs szükséges. 
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-yellow-800 dark:text-yellow-200 underline ml-1"
                    onClick={() => window.location.href = '/settings'}
                    data-testid="link-settings"
                  >
                    Állítsd be a beállításokban.
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Tips */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <h4 className="font-medium text-card-foreground mb-2">💡 Tippek a hatékony chat használathoz:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Légy konkrét a kérdéseidben</li>
              <li>• Kérdezz tanulási módszerekről, technikákról</li>
              <li>• Kérj magyarázatokat bonyolult témákhoz</li>
              <li>• Használd a téma-specifikus chatot feltöltött anyagokhoz</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
