# Dokument wymagań produktu (PRD) - 10xCards MVP

## 1. Przegląd produktu

Aplikacja web do szybkiego tworzenia fiszek edukacyjnych. Umożliwia generowanie kart przez AI z krótkiego tekstu (do 1000 znaków utworzenie kilka-kilkanaście fiszek) oraz ręczne tworzenie. Użytkownik musi być zalogowany (Supabase auth). Karty są przechowywane w Supabase, powtórki realizowane biblioteką SM-2. Interface w języku polskim. Minimalistyczny UX z wykorzystaniem biblioteki shadcn, brak person docelowych.

## 2. Problem użytkownika

Ręczne tworzenie wysokiej jakości fiszek jest czasochłonne, co zniechęca do stosowania spaced repetition. Potrzebne jest narzędzie, które szybko generuje fiszki z dostarczonego tekstu, pozwala je edytować, zaakceptować lub odrzucić i uczyć się według sprawdzonego algorytmu powtórek.

## 3. Wymagania funkcjonalne

1. Generowanie fiszek AI z wklejonego tekstu (limit 1000 znaków na jeden zestaw fiszek - kilka/kilkanaście; walidacja front, brak automatycznego przycinania).
2. Ręczne tworzenie fiszek w tym samym edytorze co AI (front/back).
3. Podgląd, edycja, odrzucanie i akceptacja pojedynczych fiszek po generacji.
4. Zapis bulkiem tylko zaakceptowanych fiszek; edytowana zaakceptowana karta wymaga ponownej akceptacji.
5. Usuwanie pojedynczych fiszek przed zapisem oraz po zapisaniu.
6. Przechowywanie fiszek w Supabase (cards: user_id, front, back, due_at, sm2_state; RLS włączone).
7. Integracja powtórek SM-2: wyliczanie due_at przy batch save, przechowywanie w UTC.
8. Logowanie eventów w Supabase: generated, accepted, rejected (pola: user_id, card_id, status, ts).
9. Auth: rejestracja, logowanie, kasowanie konta; dostęp tylko po zalogowaniu.
10. UI polski; brak content filterów i tagów w MVP.
11. Testy Playwright pokrywające happy path: signup, generate→edit→accept→batch save, reject flow, review SM-2.
12. Brak wymagań SLA czasu generacji; UI pokazuje stan w trakcie generacji.

## 4. Granice produktu

- Poza zakresem: własny algorytm powtórek; import formatów plików; współdzielenie zestawów; integracje z innymi platformami; aplikacje mobilne; content filtering; dodatkowe atrybuty kart (tagi, źródła); płatności; SSO; autosave.
- Techniczne: web only; OpenRouter jako warstwa modelu AI z możliwością zmiany modelu; priorytet prostoty.

## 5. Historyjki użytkowników

US-001

- Tytuł: Rejestracja użytkownika
- Opis: Jako nowy użytkownik chcę założyć konto, aby móc korzystać z aplikacji.
- Kryteria akceptacji: formularz email/hasło, walidacja, email verification w Supabase, komunikat o sukcesie lub błędzie.

US-002

- Tytuł: Logowanie użytkownika
- Opis: Jako użytkownik chcę się zalogować, aby uzyskać dostęp do fiszek.
- Kryteria akceptacji: poprawne dane dają dostęp, błędne dane pokazują błąd, sesja utrzymywana, przycisk resetu hasła.

US-004

- Tytuł: Generowanie fiszek AI
- Opis: Jako użytkownik chcę wkleić tekst i otrzymać zestaw fiszek front/back.
- Kryteria akceptacji: blokada wysyłki przy >1000 znaków; po sukcesie lista kart z front/back; komunikat o błędzie przy niepowodzeniu; zapis eventu generated z modelem.

US-005

- Tytuł: Edycja i akceptacja pojedynczej fiszki
- Opis: Jako użytkownik chcę edytować treść karty i zaakceptować ją do zapisania.
- Kryteria akceptacji: edycja front/back; klik accept oznacza kartę jako accepted; edycja po akceptacji ustawia status needs re-accept; event accepted zapisany.

US-006

- Tytuł: Odrzucenie fiszki
- Opis: Jako użytkownik chcę odrzucić kartę, która jest nieprzydatna.
- Kryteria akceptacji: klik reject usuwa kartę z kolejki zapisu; event rejected zapisany; opcja cofnięcia ostatniego odrzucenia do momentu opuszczenia sesji.

US-007

- Tytuł: Batch save zaakceptowanych fiszek
- Opis: Jako użytkownik chcę jednym kliknięciem zapisać wszystkie zaakceptowane karty do bazy.
- Kryteria akceptacji: przycisk Save accepted zapisuje tylko accepted; operacja atomowa w transakcji; w razie błędu lista card_id z przyczyną; post-save liczba zapisanych potwierdzona.

US-008

- Tytuł: Ręczne tworzenie fiszki
- Opis: Jako użytkownik chcę samodzielnie dodać kartę w prostym formularzu z dwoma polami.
- Kryteria akceptacji: formularz front/back, zapis natychmiast; karta pojawia się w liście.

US-009

- Tytuł: Przegląd i nauka według SM-2
- Opis: Jako użytkownik chcę przeglądać zaplanowane karty i odpowiadać zgodnie z harmonogramem SM-2.
- Kryteria akceptacji: widok kart due today; po odpowiedzi aktualizacja sm2_state i due_at w UTC; zapis w Supabase.

US-010

- Tytuł: Usuwanie fiszki
- Opis: Jako użytkownik chcę usunąć wybraną kartę z bazy.
- Kryteria akceptacji: przycisk delete dostępny po zapisaniu; potwierdzenie; karta znika z listy i z harmonogramu.

US-011

- Tytuł: Logowanie metryk
- Opis: Jako właściciel produktu chcę rejestrować eventy, aby mierzyć akceptację i koszty.
- Kryteria akceptacji: każdy generated/accepted/rejected zapisuje user_id, card_id, status, ts;

US-012

- Tytuł: Usunięcie konta
- Opis: Jako użytkownik chcę usunąć konto wraz z danymi.
- Kryteria akceptacji: akcja delete account dostępna po zalogowaniu; cascade delete kart i eventów; potwierdzenie operacji.

US-013

- Tytuł: Obsługa błędów AI i limitów
- Opis: Jako użytkownik chcę jasnych komunikatów, gdy generacja się nie powiedzie lub osiągnę limity.
- Kryteria akceptacji: timeout komunikatu; błąd pokazuje opcję ponów; brak utraty już wygenerowanych kart w sesji.

## 6. Metryki sukcesu

1. 75% fiszek wygenerowanych przez AI jest akceptowane przez użytkownika (accepted/generated z eventów).
2. 75% wszystkich tworzonych fiszek pochodzi z AI (liczone z eventów generated vs ręcznie utworzone).
3. Co najmniej jeden komplet testów Playwright przechodzi dla kluczowych ścieżek (signup, generate/edit/accept/save, reject, review SM-2, limit 1000 znaków).
4. Dane metryk dostępne z Supabase bez dodatkowych ETL (event logs kompletne dla 95% operacji).
