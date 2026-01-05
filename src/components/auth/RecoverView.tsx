import * as React from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getEmailError } from "@/components/auth/authValidation";

const RecoverView = () => {
  const emailId = React.useId();

  const [email, setEmail] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const [submitMessage, setSubmitMessage] = React.useState<string | null>(null);

  const emailError = React.useMemo(() => getEmailError(email), [email]);
  const isValid = !emailError;

  const handleEmailChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  }, []);

  const handleEmailBlur = React.useCallback(() => {
    setTouched(true);
  }, []);

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setTouched(true);
      setSubmitMessage(null);

      if (!isValid) {
        return;
      }

      setSubmitMessage("Jeśli konto istnieje, wyślemy wiadomość z dalszymi instrukcjami odzyskania dostępu.");
    },
    [isValid]
  );

  const shouldShowEmailError = touched && emailError;

  return (
    <section className="grid w-full gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/70 p-8 shadow-lg backdrop-blur animate-in fade-in-0 slide-in-from-left-6 duration-700">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Odzyskiwanie konta</p>
        <h1 className="mt-4 text-3xl font-semibold text-foreground">Przywróć dostęp do swojego profilu.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Wprowadź adres e-mail powiązany z kontem. Otrzymasz bezpieczny link do ustawienia nowego hasła.
        </p>
        <div className="mt-8 grid gap-4">
          <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
            <p className="text-sm font-medium text-foreground">Szybki powrót</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Link jest aktywny przez ograniczony czas, aby zapewnić bezpieczeństwo danych.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
            <p className="text-sm font-medium text-foreground">Wsparcie zespołu</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Jeśli nie pamiętasz adresu, skontaktuj się z nami, a pomożemy odzyskać konto.
            </p>
          </div>
        </div>
      </div>

      <Card className="h-fit border-border/70 bg-white/90 shadow-xl animate-in fade-in-0 slide-in-from-bottom-6 duration-700">
        <CardHeader className="space-y-2">
          <CardTitle>Odzyskiwanie hasła</CardTitle>
          <CardDescription>Podaj email, a wyślemy instrukcje resetu.</CardDescription>
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
              {shouldShowEmailError ? <p className="text-xs text-destructive">{emailError}</p> : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Pamiętasz hasło?</span>
              <a href="/login" className="font-medium text-foreground hover:underline">
                Wróć do logowania
              </a>
            </div>

            <Button type="submit">Wyślij instrukcje</Button>

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

export default RecoverView;
