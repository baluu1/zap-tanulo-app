import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Layout from "@/components/Layout";
import NotFound from "@/pages/not-found";
import Functions from "@/pages/Functions";
import Upload from "@/pages/Upload";
import Cards from "@/pages/Cards";
import DeckManager from "@/pages/DeckManager";
import Chat from "@/pages/Chat";
import Focus from "@/pages/Focus";
import Progress from "@/pages/Progress";
import Settings from "@/pages/Settings";
import Auth from "@/pages/Auth";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Functions} />
        <Route path="/functions" component={Functions} />
        <Route path="/upload" component={Upload} />
        <Route path="/cards" component={Cards} />
        <Route path="/cards/:deckId" component={DeckManager} />
        <Route path="/chat" component={Chat} />
        <Route path="/focus" component={Focus} />
        <Route path="/progress" component={Progress} />
        <Route path="/settings" component={Settings} />
        <Route path="/auth" component={Auth} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="zap-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
