import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Demo implementation - in real app would call API
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Bejelentkezés sikeres!",
        description: `Üdvözlünk, ${email}!`,
      });
    }, 1000);
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      toast({
        title: "Hiba",
        description: "A jelszavak nem egyeznek!",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    // Demo implementation - in real app would call API
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Regisztráció sikeres!",
        description: `Üdvözlünk a ZAP-ban, ${name}!`,
      });
    }, 1000);
  };

  const handleSocialLogin = (provider: string) => {
    toast({
      title: "Funkció fejlesztés alatt",
      description: `${provider} bejelentkezés hamarosan elérhető lesz.`,
    });
  };

  return (
    <div>
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Üdvözlünk a ZAP-ban!</h1>
          <p className="text-muted-foreground">Jelentkezz be vagy regisztrálj a kezdéshez</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" data-testid="tab-login">Belépés</TabsTrigger>
                <TabsTrigger value="register" data-testid="tab-register">Regisztráció</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4" data-testid="form-login">
                  <div>
                    <Label htmlFor="login-email" className="text-sm font-medium text-card-foreground">
                      Email cím
                    </Label>
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      placeholder="email@example.com"
                      required
                      className="mt-1"
                      data-testid="input-login-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password" className="text-sm font-medium text-card-foreground">
                      Jelszó
                    </Label>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="mt-1"
                      data-testid="input-login-password"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remember" name="remember" data-testid="checkbox-remember" />
                      <Label htmlFor="remember" className="text-sm text-muted-foreground">
                        Emlékezz rám
                      </Label>
                    </div>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-sm text-primary hover:underline"
                      type="button"
                      data-testid="link-forgot-password"
                    >
                      Elfelejtett jelszó?
                    </Button>
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full"
                    data-testid="button-login"
                  >
                    {isLoading ? "Bejelentkezés..." : "Belépés"}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4" data-testid="form-register">
                  <div>
                    <Label htmlFor="register-name" className="text-sm font-medium text-card-foreground">
                      Név
                    </Label>
                    <Input
                      id="register-name"
                      name="name"
                      type="text"
                      placeholder="Teljes név"
                      required
                      className="mt-1"
                      data-testid="input-register-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-email" className="text-sm font-medium text-card-foreground">
                      Email cím
                    </Label>
                    <Input
                      id="register-email"
                      name="email"
                      type="email"
                      placeholder="email@example.com"
                      required
                      className="mt-1"
                      data-testid="input-register-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-password" className="text-sm font-medium text-card-foreground">
                      Jelszó
                    </Label>
                    <Input
                      id="register-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="mt-1"
                      data-testid="input-register-password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-confirm-password" className="text-sm font-medium text-card-foreground">
                      Jelszó megerősítése
                    </Label>
                    <Input
                      id="register-confirm-password"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="mt-1"
                      data-testid="input-register-confirm-password"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" name="terms" required data-testid="checkbox-terms" />
                    <Label htmlFor="terms" className="text-sm text-muted-foreground">
                      Elfogadom a{" "}
                      <Button
                        variant="link"
                        className="p-0 h-auto text-sm text-primary hover:underline"
                        type="button"
                        data-testid="link-terms"
                      >
                        felhasználási feltételeket
                      </Button>
                    </Label>
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full"
                    data-testid="button-register"
                  >
                    {isLoading ? "Regisztráció..." : "Regisztráció"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Social Login */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-center text-sm text-muted-foreground mb-4">
                Vagy folytasd a következővel
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleSocialLogin('Google')}
                  className="flex items-center justify-center"
                  data-testid="button-google-login"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSocialLogin('Facebook')}
                  className="flex items-center justify-center"
                  data-testid="button-facebook-login"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
