import * as React from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getEmailError, getPasswordError } from "@/components/auth/authValidation";

const highlights = [
  {
    label: "Start w kilka sekund",
    value: "Rejestracja zajmuje mniej niż minutę.",
  },
  {
    label: "Twoje postępy",
    value: "Zobaczysz statystyki i tempo nauki na bieżąco.",
  },
  {
    label: "Przegląd wiedzy",
    value: "Wrócisz do poprzednich zestawów bez szukania plików.",
  },
];

const RegisterView = () => {
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

      setSubmitMessage("Formularz jest gotowy do podłączenia rejestracji w kolejnym kroku.");
    },
    [isValid]
  );

  const shouldShowEmailError = touched.email && validation.email;
  const shouldShowPasswordError = touched.password && validation.password;

  return (
    <section className="grid w-full gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <Card className="order-2 h-fit border-border/70 bg-white/90 shadow-xl animate-in fade-in-0 slide-in-from-bottom-6 duration-700 lg:order-1">
        <CardHeader className="space-y-2">
          <CardTitle>Rejestracja</CardTitle>
          <CardDescription>Utwórz konto, aby zapisywać i rozwijać fiszki.</CardDescription>
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
                autoComplete="new-password"
              />
              {shouldShowPasswordError ? <p className="text-xs text-destructive">{validation.password}</p> : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Masz już konto?</span>
              <a href="/login" className="font-medium text-foreground hover:underline">
                Zaloguj się
              </a>
            </div>

            <Button type="submit">Załóż konto</Button>

            {submitMessage ? (
              <Alert>
                <AlertDescription>{submitMessage}</AlertDescription>
              </Alert>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <div className="order-1 flex flex-col justify-between gap-6 rounded-3xl border border-white/70 bg-white/70 p-8 shadow-lg backdrop-blur animate-in fade-in-0 slide-in-from-right-6 duration-700 lg:order-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Nowe konto</p>
          <h1 className="mt-4 text-3xl font-semibold text-foreground">Zbuduj własną bibliotekę fiszek.</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Po rejestracji możesz generować, edytować i wracać do materiałów bez ograniczeń.
          </p>
        </div>
        <div className="grid gap-4">
          {highlights.map((item) => (
            <div key={item.label} className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-sm font-medium text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RegisterView;
