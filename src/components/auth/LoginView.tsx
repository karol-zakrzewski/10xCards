import * as React from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getEmailError, getPasswordError } from "@/components/auth/authValidation";

const benefits = [
  {
    title: "Jedno miejsce dla Twoich fiszek",
    description: "Organizuj materiały z wielu tematów i wracaj do nich w dowolnym momencie.",
  },
  {
    title: "Szybsze utrwalanie wiedzy",
    description: "Twórz krótkie zestawy i planuj powtórki bez przerw w nauce.",
  },
  {
    title: "Bezpieczna przestrzeń",
    description: "Dane konta są oddzielone, a dostęp do treści jest tylko dla Ciebie.",
  },
];

const LoginView = () => {
  const emailId = React.useId();
  const passwordId = React.useId();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [touched, setTouched] = React.useState({ email: false, password: false });
  const [submitMessage, setSubmitMessage] = React.useState<string | null>(null);

  const validation = React.useMemo(() => {
    return {
      email: getEmailError(email),
      password: getPasswordError(password),
    };
  }, [email, password]);

  const isValid = !validation.email && !validation.password;

  const handleEmailChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  }, []);

  const handlePasswordChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  }, []);

  const handleBlur = React.useCallback((field: "email" | "password") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleEmailBlur = React.useCallback(() => handleBlur("email"), [handleBlur]);
  const handlePasswordBlur = React.useCallback(() => handleBlur("password"), [handleBlur]);

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setTouched({ email: true, password: true });
      setSubmitMessage(null);

      if (!isValid) {
        return;
      }

      setSubmitMessage("Formularz jest gotowy do podłączenia logowania w kolejnym kroku.");
    },
    [isValid]
  );

  const shouldShowEmailError = touched.email && validation.email;
  const shouldShowPasswordError = touched.password && validation.password;

  return (
    <section className="grid w-full gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/70 p-8 shadow-lg backdrop-blur animate-in fade-in-0 slide-in-from-left-6 duration-700">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Powrót do 10xCards</p>
        <h1 className="mt-4 text-3xl font-semibold text-foreground">Zaloguj się i wróć do nauki.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Wszystkie Twoje zestawy i statystyki czekają w bezpiecznym panelu.
        </p>
        <div className="mt-8 grid gap-4">
          {benefits.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      <Card className="h-fit border-border/70 bg-white/90 shadow-xl animate-in fade-in-0 slide-in-from-bottom-6 duration-700">
        <CardHeader className="space-y-2">
          <CardTitle>Logowanie</CardTitle>
          <CardDescription>Użyj danych konta, aby przejść do aplikacji.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-2">
              <label htmlFor={emailId} className="text-sm font-medium">
                Email
              </label>
              <Input
                id={emailId}
                type="email"
                name="email"
                placeholder="twoj@email.com"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                aria-invalid={shouldShowEmailError ? "true" : "false"}
                autoComplete="email"
              />
              {shouldShowEmailError ? <p className="text-xs text-destructive">{validation.email}</p> : null}
            </div>
            <div className="grid gap-2">
              <label htmlFor={passwordId} className="text-sm font-medium">
                Hasło
              </label>
              <Input
                id={passwordId}
                type="password"
                name="password"
                placeholder="Minimum 6 znaków"
                value={password}
                onChange={handlePasswordChange}
                onBlur={handlePasswordBlur}
                aria-invalid={shouldShowPasswordError ? "true" : "false"}
                autoComplete="current-password"
              />
              {shouldShowPasswordError ? <p className="text-xs text-destructive">{validation.password}</p> : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Nie masz jeszcze konta?</span>
              <a href="/register" className="font-medium text-foreground hover:underline">
                Załóż konto
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <a href="/recover" className="text-xs font-medium text-muted-foreground hover:text-foreground">
                Nie pamiętam hasła
              </a>
              <Button type="submit">Zaloguj się</Button>
            </div>

            {submitMessage ? (
              <Alert>
                <AlertDescription>{submitMessage}</AlertDescription>
              </Alert>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </section>
  );
};

export default LoginView;
