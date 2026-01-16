GenerateFlashcardsView.tsx (src/components/generate/GenerateFlashcardsView.tsx)
├── Components
│ ├── SourceTextSection
│ │ ├── Button (ui)
│ │ └── Textarea (ui)
│ ├── GenerationStatusBanner
│ │ ├── Alert (ui)
│ │ │ ├── AlertTitle
│ │ │ └── AlertDescription
│ │ └── Button (ui)
│ ├── ProposalsSection
│ │ ├── Badge (ui)
│ │ ├── ProposalCard
│ │ │ ├── Button (ui)
│ │ │ ├── Card (ui)
│ │ │ │ ├── CardHeader
│ │ │ │ └── CardContent
│ │ │ ├── Badge (ui)
│ │ │ └── lucide-react icons (Check, X, RotateCcw, Pencil)
│ │ └── SaveAcceptedBar
│ │ └── Button (ui)
│ └── EditProposalDialog
│ ├── Dialog (ui)
│ │ ├── DialogContent
│ │ ├── DialogHeader
│ │ ├── DialogTitle
│ │ ├── DialogDescription
│ │ └── DialogFooter
│ ├── Textarea (ui)
│ └── Button (ui)
│
├── Hooks
│ └── useGenerationSession
│ ├── mapProposalFromDTO()
│ └── updateProposalContent()
│
├── API Client (src/lib/api/client.ts)
│ ├── fetchJson()
│ ├── getAuthorizationHeader()
│ ├── ApiError
│ └── Endpoints
│ ├── POST /api/v1/generations
│ └── POST /api/v1/flashcards/bulkCreate
│
├── Viewmodels (src/lib/viewmodels/generateFlashcards.ts)
│ ├── getSourceTextValidation()
│ ├── normalizeFlashcardKey()
│ ├── createEditDraft()
│ ├── validateEditDraft()
│ ├── mapProposalFromDTO()
│ ├── updateProposalContent()
│ └── Types (VM)
│ ├── ApiRequestState
│ ├── ApiErrorVM
│ ├── SourceTextValidationVM
│ ├── FlashcardProposalVM
│ └── FlashcardEditDraftVM
│
└── Types (src/types.ts)
├── GenerationSummaryDTO
├── FlashcardProposalDTO
└── BulkFlashcardsCreateResultDTO
