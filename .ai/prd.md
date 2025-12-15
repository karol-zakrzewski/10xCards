# Dokument wymagań produktu (PRD) - 10xCards MVP

## 1. Przegląd produktu

Aplikacja web do szybkiego tworzenia fiszek edukacyjnych. Umożliwia generowanie kart przez AI z krótkiego tekstu (do 1000 znaków utworzenie kilka-kilkanaście fiszek) oraz ręczne tworzenie. Użytkownik musi być zalogowany (Supabase auth). Fiszki są przechowywane w Supabase (PostgreSQL). Mechanizm powtórek (spaced repetition / SM-2) jest planowany na późniejszy etap (po zrealizowaniu core MVP). Interface w języku polskim. Minimalistyczny UX z wykorzystaniem biblioteki shadcn, brak person docelowych.

## 2. Problem użytkownika

Ręczne tworzenie wysokiej jakości fiszek jest czasochłonne, co zniechęca do stosowania spaced repetition. Potrzebne jest narzędzie, które szybko generuje fiszki z dostarczonego tekstu, pozwala je edytować, zaakceptować lub odrzucić. Nauka według algorytmu powtórek (np. SM-2) zostanie dodana w kolejnym etapie prac.

## 3. Wymagania funkcjonalne

1. Generowanie fiszek AI z wklejonego tekstu (limit 1000 znaków na jeden zestaw fiszek - kilka/kilkanaście; walidacja front, brak automatycznego przycinania).
2. Ręczne tworzenie fiszek w tym samym edytorze co AI (front/back); po zapisaniu karta pojawia się na liście "Moje fiszki".
3. Podgląd, edycja, odrzucanie i akceptacja pojedynczych fiszek po generacji (stan „przed zapisem” jest utrzymywany tylko po stronie klienta).
4. Zapisanie zaakceptowanych fiszek następuje po kliknięciu przycisku zapisu; zapisujemy tylko te, które mają status accepted.
5. Usuwanie pojedynczych fiszek przed zapisem oraz po zapisaniu; po zapisaniu usuwanie jest trwałe (bez soft delete) i wymaga potwierdzenia użytkownika.
6. Przechowywanie fiszek w Supabase (flashcards: user_id, front, back, source, generation_id, created_at, updated_at; RLS włączone).
7. Statystyki generowania fiszek: zbieranie informacji o tym, ile fiszek zostało wygenerowanych przez AI i ile z nich ostatecznie zaakceptowano.
8. Auth: rejestracja, logowanie, kasowanie konta; dostęp tylko po zalogowaniu (użytkownicy zarządzani przez Supabase Auth, bez własnej tabeli users).
9. UI polski; brak content filterów i tagów w MVP.
10. Brak wymagań SLA czasu generacji; UI pokazuje stan w trakcie generacji i komunikat o błędzie w razie niepowodzenia API.

### Powtórki (po MVP)

- Mechanizm powtórek (spaced repetition; np. SM-2) zostanie zaimplementowany w późniejszym etapie.
- Wraz z powtórkami planujemy dodać pola takie jak `due_at` (UTC) oraz `sm2_state` (wersjonowany JSON w stringu).

## 4. Granice produktu

- Poza zakresem (MVP): mechanizm powtórek (spaced repetition / SM-2); własny algorytm powtórek; import formatów plików; współdzielenie zestawów; integracje z innymi platformami; aplikacje mobilne; content filtering; dodatkowe atrybuty kart (tagi, źródło materiału); płatności; SSO; autosave.
- Techniczne: web only; OpenRouter jako warstwa modelu AI z możliwością zmiany modelu; priorytet prostoty.

## 5. Historyjki użytkowników

ID: US-001
Tytuł: Rejestracja konta
Opis: Jako nowy użytkownik chcę się zarejestrować, aby mieć dostęp do własnych fiszek i móc korzystać z generowania fiszek przez AI.
Kryteria akceptacji:
- Formularz rejestracyjny zawiera pola na adres e-mail i hasło.
- Po poprawnym wypełnieniu formularza i weryfikacji danych konto jest aktywowane.
- Użytkownik otrzymuje potwierdzenie pomyślnej rejestracji i zostaje zalogowany.

ID: US-002
Tytuł: Logowanie do aplikacji
Opis: Jako zarejestrowany użytkownik chcę móc się zalogować, aby mieć dostęp do moich fiszek i historii generowania.
Kryteria akceptacji:
- Po podaniu prawidłowych danych logowania użytkownik zostaje przekierowany do widoku generowania fiszek.
- Błędne dane logowania wyświetlają komunikat o nieprawidłowych danych.
- Dane dotyczące logowania przechowywane są w bezpieczny sposób.

ID: US-003
Tytuł: Generowanie fiszek przy użyciu AI
Opis: Jako zalogowany użytkownik chcę wkleić kawałek tekstu i za pomocą przycisku wygenerować propozycje fiszek, aby zaoszczędzić czas na ręcznym tworzeniu pytań i odpowiedzi.
Kryteria akceptacji:
- W widoku generowania fiszek znajduje się pole tekstowe, w którym użytkownik może wkleić swój tekst.
- Pole tekstowe oczekuje od 1000 do 10 000 znaków.
- Po kliknięciu przycisku generowania aplikacja komunikuje się z API modelu LLM i wyświetla listę wygenerowanych propozycji fiszek do akceptacji przez użytkownika.
- W przypadku problemów z API lub braku odpowiedzi modelu użytkownik zobaczy stosowny komunikat o błędzie.

ID: US-004
Tytuł: Przegląd i zatwierdzanie propozycji fiszek
Opis: Jako zalogowany użytkownik chcę móc przeglądać wygenerowane fiszki i decydować, które z nich chcę dodać do mojego zestawu, aby zachować tylko przydatne pytania i odpowiedzi.
Kryteria akceptacji:
- Lista wygenerowanych fiszek jest wyświetlana pod formularzem generowania.
- Przy każdej fiszce znajduje się przycisk pozwalający na jej zatwierdzenie, edycję lub odrzucenie.
- Po zatwierdzeniu wybranych fiszek użytkownik może kliknąć przycisk zapisu i dodać je do bazy danych.

ID: US-005
Tytuł: Edycja fiszek utworzonych ręcznie i generowanych przez AI
Opis: Jako zalogowany użytkownik chcę edytować stworzone lub wygenerowane fiszki, aby poprawić ewentualne błędy lub dostosować pytania i odpowiedzi do własnych potrzeb.
Kryteria akceptacji:
- Istnieje lista zapisanych fiszek (zarówno ręcznie tworzonych, jak i zatwierdzonych wygenerowanych).
- Każdą fiszkę można kliknąć i wejść w tryb edycji.
- Zmiany są zapisywane w bazie danych po zatwierdzeniu.

ID: US-006
Tytuł: Usuwanie fiszek
Opis: Jako zalogowany użytkownik chcę usuwać zbędne fiszki, aby zachować porządek w moim zestawie.
Kryteria akceptacji:
- Przy każdej fiszce na liście (w widoku "Moje fiszki") widoczna jest opcja usunięcia.
- Po wybraniu usuwania użytkownik musi potwierdzić operację, zanim fiszka zostanie trwale usunięta.
- Fiszki zostają trwale usunięte z bazy danych po potwierdzeniu.

ID: US-007
Tytuł: Ręczne tworzenie fiszek
Opis: Jako zalogowany użytkownik chcę ręcznie stworzyć fiszkę (określając przód i tył fiszki), aby dodawać własny materiał, który nie pochodzi z automatycznie generowanych treści.
Kryteria akceptacji:
- W widoku "Moje fiszki" znajduje się przycisk dodania nowej fiszki.
- Naciśnięcie przycisku otwiera formularz z polami "Przód" i "Tył".
- Po zapisaniu nowa fiszka pojawia się na liście.

ID: US-008
Tytuł: Sesja nauki z algorytmem powtórek (po MVP)
Opis: Jako zalogowany użytkownik chcę, aby dodane fiszki były dostępne w widoku "Sesja nauki" opartym na zewnętrznym algorytmie, aby móc efektywnie się uczyć (spaced repetition). Ten element jest planowany na późniejszy etap prac.
Kryteria akceptacji:
- W widoku "Sesja nauki" algorytm przygotowuje dla mnie sesję nauki fiszek
- Na start wyświetlany jest przód fiszki, poprzez interakcję użytkownik wyświetla jej tył
- Użytkownik ocenia zgodnie z oczekiwaniami algorytmu na ile przyswoił fiszkę
- Następnie algorytm pokazuje kolejną fiszkę w ramach sesji nauki

ID: US-009
Tytuł: Bezpieczny dostęp i autoryzacja
Opis: Jako zalogowany użytkownik chcę mieć pewność, że moje fiszki nie są dostępne dla innych użytkowników, aby zachować prywatność i bezpieczeństwo danych.
Kryteria akceptacji:
- Tylko zalogowany użytkownik może wyświetlać, edytować i usuwać swoje fiszki.
- Nie ma dostępu do fiszek innych użytkowników ani możliwości współdzielenia.

## 6. Metryki sukcesu

1. 75% wygenerowanych przez AI fiszek jest akceptowanych przez użytkownika.
2. Użytkownicy tworzą co najmniej 75% fiszek z wykorzystaniem AI (w stosunku do wszystkich nowo dodanych fiszek).
3. Monitorowanie liczby wygenerowanych fiszek i porównanie z liczbą zatwierdzonych do analizy jakości i użyteczności.
