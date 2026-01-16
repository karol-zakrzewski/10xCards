# Plan testów integracyjnych — Generate Flashcards

Poniższy plan obejmuje tylko kluczowe komponenty i ich funkcjonalności (na podstawie diagramu komponentów).

## GenerateFlashcardsView (flow end-to-end)
- Start sesji: wpisanie tekstu w `SourceTextSection` + klik „Generate” wysyła `POST /api/v1/generations` i pokazuje stan ładowania.
- Sukces generacji: po odpowiedzi API pojawia się lista propozycji w `ProposalsSection`.
- Błąd generacji: `GenerationStatusBanner` pokazuje błąd i umożliwia ponowienie (ponowny request).

## SourceTextSection
- Walidacja źródła: zbyt krótki/pusty tekst blokuje akcję generowania i pokazuje komunikat.
- Poprawny tekst umożliwia wysłanie żądania.

## GenerationStatusBanner
- Stany: `loading`, `success`, `error` — poprawne komunikaty i CTA.
- Retry w stanie `error` ponawia generowanie.

## ProposalsSection + ProposalCard
- Render: lista kart z treścią propozycji i statusami.
- Akceptuj/odrzuć: kliknięcia aktualizują stan propozycji w UI.
- Reset propozycji (RotateCcw) przywraca stan bazowy.
- Edycja: klik „Edit” otwiera `EditProposalDialog` z wstępnie wypełnioną treścią.

## EditProposalDialog
- Zapis edycji: zatwierdzenie aktualizuje treść propozycji w `ProposalCard`.
- Walidacja edycji: nieprawidłowy input blokuje zapis i pokazuje komunikat.

## SaveAcceptedBar
- Aktywny tylko przy zaakceptowanych propozycjach.
- Klik „Save” wysyła `POST /api/v1/flashcards/bulkCreate` z zaakceptowanymi propozycjami.
- Błąd zapisu — banner z komunikatem i możliwość ponowienia.
