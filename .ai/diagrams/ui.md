<architecture_analysis>
1. Komponenty z referencji (PRD + auth-spec):
   - Layouty: Layout.astro, AppShellLayout.astro, (opcjonalnie) PublicLayout.astro.
   - Strony Astro: Strona logowania, Strona rejestracji, Strona generowania, Strona fiszek, Strona konta.
   - Komponenty React: LoginView, RegisterView, AccountView.
   - Hooki i moduły stanu: useMe, useAccountActions.
   - Warstwa API: API autentykacji, API aplikacji, klient API (fetch).
   - Moduly auth: sesja w cookies, Supabase Auth.

2. Glowne strony i odpowiadajace komponenty:
   - Strona logowania -> LoginView.
   - Strona rejestracji -> RegisterView.
   - Strony chronione -> AppShellLayout + odpowiedni widok React.

3. Przeplyw danych:
   - LoginView/RegisterView -> walidacja klienta -> API autentykacji -> Supabase Auth -> cookies.
   - Guard SSR czyta cookies i kieruje do strefy chronionej lub logowania.
   - Widoki chronione uzywaja hookow useMe/useAccountActions i klienta API do komunikacji z API aplikacji.

4. Opis funkcjonalnosci komponentow:
   - LoginView/RegisterView: formularze, walidacja, obsluga bledow, redirect po sukcesie.
   - AppShellLayout: nawigacja w strefie auth oraz punkt wylogowania.
   - useMe: pobiera dane biezacego uzytkownika i obsluguje 401.
   - useAccountActions: wylogowanie oraz usuwanie konta.
   - Guard SSR: wstepna kontrola sesji przed renderem stron chronionych.
</architecture_analysis>

<mermaid_diagram>
```mermaid
flowchart TD
  %% ===== Strefa publiczna =====
  subgraph PublicZone["Strefa publiczna"]
    LayoutBase["Layout bazowy"]
    LoginPage["Strona logowania"]
    RegisterPage["Strona rejestracji"]
    LoginView["LoginView"]
    RegisterView["RegisterView"]
    ClientValidation["Walidacja klienta"]
  end

  %% ===== Modul autentykacji =====
  subgraph AuthModule["Modul autentykacji"]
    AuthApi["API autentykacji"]
    SessionCookies["Sesja w cookies"]
    SupabaseAuth["Supabase Auth"]
  end

  %% ===== Strefa chroniona =====
  subgraph ProtectedZone["Strefa chroniona"]
    GuardSSR{"Guard sesji SSR"}
    AppShell["AppShellLayout"]
    GeneratePage["Strona generowania"]
    FlashcardsPage["Strona fiszek"]
    AccountPage["Strona konta"]
    GenerateView["GenerateFlashcardsView"]
    FlashcardsView["FlashcardsView"]
    AccountView["AccountView"]
  end

  %% ===== Komponenty wspoldzielone =====
  subgraph Shared["Komponenty wspoldzielone"]
    ApiClient["Klient API"]
    UseMe["useMe"]
    UseAccountActions["useAccountActions"]
    ErrorMapping["Mapowanie bledow"]
  end

  %% ===== Przeplywy publiczne =====
  LayoutBase --> LoginPage --> LoginView
  LayoutBase --> RegisterPage --> RegisterView
  LoginView --> ClientValidation --> AuthApi
  RegisterView --> ClientValidation --> AuthApi

  %% ===== Autentykacja i sesja =====
  AuthApi --> SupabaseAuth --> SessionCookies
  SessionCookies --> GuardSSR

  %% ===== Wejscie do strefy chronionej =====
  GuardSSR --> AppShell
  AppShell --> GeneratePage --> GenerateView
  AppShell --> FlashcardsPage --> FlashcardsView
  AppShell --> AccountPage --> AccountView

  %% ===== Stan i komunikacja z API =====
  AccountView --> UseMe --> ApiClient
  AccountView --> UseAccountActions --> ApiClient
  GenerateView --> ApiClient
  FlashcardsView --> ApiClient
  ApiClient --> ErrorMapping
  ApiClient --> AuthApi

  %% ===== Zaleznosci auth z reszta aplikacji =====
  UseMe -.-> SessionCookies
  UseAccountActions -.-> SessionCookies

  %% ===== Wyróżnienia aktualizacji =====
  classDef updated fill:#fff4cc,stroke:#caa300,stroke-width:2px;
  class AppShell,GeneratePage,FlashcardsPage,AccountPage,UseMe,UseAccountActions,ApiClient updated;
```
</mermaid_diagram>
