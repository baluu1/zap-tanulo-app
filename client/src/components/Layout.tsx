import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import useStore from '@/store/useStore';
import { 
  Sun, 
  Moon, 
  Menu, 
  X,
  Upload,
  Layers,
  MessageCircle,
  Clock,
  TrendingUp,
  Settings,
  UserPlus
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { focusState, resetFocus, setFocusState } = useStore();
  const [showFocusExitDialog, setShowFocusExitDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const navigation = [
    { name: 'Funkciók', href: '/', icon: Layers },
    { name: 'Kártyák', href: '/cards', icon: Layers },
    { name: 'Fókusz mód', href: '/focus', icon: Clock },
    { name: 'Feltöltés', href: '/upload', icon: Upload },
    { name: 'Haladás', href: '/progress', icon: TrendingUp },
    { name: 'Regisztráció / Belépés', href: '/auth', icon: UserPlus },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location === '/' || location === '/functions';
    }
    return location === href;
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleNavigation = (href: string, event: React.MouseEvent) => {
    // Don't prevent navigation if already on the same page or focus is not active
    if (location === href || !focusState.isActive) {
      return; // Allow normal navigation
    }

    // Set dialog flag FIRST to prevent race condition with focus detector
    setFocusState({ isUIDialogOpen: true });
    
    // Then prevent the default Link behavior and show confirmation
    event.preventDefault();
    setPendingNavigation(href);
    setShowFocusExitDialog(true);
  };

  const handleFocusExit = () => {
    setFocusState({ isUIDialogOpen: false }); // Clear dialog flag
    if (pendingNavigation) {
      resetFocus(); // Reset focus state
      setLocation(pendingNavigation); // Navigate to the pending location
      setPendingNavigation(null);
    }
    setShowFocusExitDialog(false);
  };

  const handleCancelNavigation = () => {
    setFocusState({ isUIDialogOpen: false }); // Clear dialog flag
    setPendingNavigation(null);
    setShowFocusExitDialog(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0" data-testid="logo-link">
                <span className="text-2xl font-bold text-primary">ZAP</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleNavigation(item.href, e)}
                    data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Button
                      variant="ghost"
                      className={`px-3 py-2 text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'text-foreground bg-accent'
                          : focusState.isActive && location !== item.href
                            ? 'text-muted-foreground/50 hover:text-muted-foreground cursor-not-allowed'
                            : 'text-muted-foreground hover:text-primary hover:bg-accent'
                      }`}
                      disabled={focusState.isActive && location !== item.href}
                    >
                      {item.name}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>

            {/* Theme Toggle & Mobile Menu */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                data-testid="theme-toggle"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
              
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="mobile-menu-toggle"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    handleNavigation(item.href, e);
                  }}
                  data-testid={`mobile-nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Button
                    variant="ghost"
                    className={`w-full justify-start px-3 py-2 text-base font-medium transition-colors ${
                      isActive(item.href)
                        ? 'text-foreground bg-accent'
                        : focusState.isActive && location !== item.href
                          ? 'text-muted-foreground/50 hover:text-muted-foreground cursor-not-allowed'
                          : 'text-muted-foreground hover:text-primary hover:bg-accent'
                    }`}
                    disabled={focusState.isActive && location !== item.href}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Focus Exit Confirmation Dialog */}
      <AlertDialog open={showFocusExitDialog} onOpenChange={setShowFocusExitDialog}>
        <AlertDialogContent data-testid="focus-exit-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Fókusz munkamenet aktív</AlertDialogTitle>
            <AlertDialogDescription>
              Jelenleg egy fókusz munkamenet van folyamatban. Ha most navigálsz, a munkamenet megszakad és elvész a haladás.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelNavigation} data-testid="button-cancel-navigation">
              Maradok itt
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleFocusExit} data-testid="button-confirm-navigation">
              Munkamenet befejezése
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
