import * as React from "react";
import { Check, Pencil, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FlashcardProposalVM } from "@/lib/viewmodels/generateFlashcards";

interface ProposalCardProps {
  proposal: FlashcardProposalVM;
  disabled?: boolean;
  onAcceptToggle: (id: string) => void;
  onRefuse: (id: string) => void;
  onUndo: (id: string) => void;
  onEdit: (id: string) => void;
}

const statusStyles: Record<FlashcardProposalVM["status"], string> = {
  pending: "border-border",
  accepted: "border-emerald-400/70",
  refused: "border-dashed border-muted-foreground/50 opacity-70",
};

const statusLabel: Record<FlashcardProposalVM["status"], string> = {
  pending: "Oczekuje",
  accepted: "Zaakceptowana",
  refused: "Odrzucona",
};

export const ProposalCard = React.memo(
  ({ proposal, disabled = false, onAcceptToggle, onRefuse, onUndo, onEdit }: ProposalCardProps) => {
    const isRefused = proposal.status === "refused";
    const isAccepted = proposal.status === "accepted";

    return (
      <Card className={statusStyles[proposal.status]}>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <Badge variant={isAccepted ? "default" : "secondary"}>{statusLabel[proposal.status]}</Badge>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onAcceptToggle(proposal.id)}
              disabled={disabled || isRefused}
              aria-label={isAccepted ? "Cofnij akceptację" : "Akceptuj fiszkę"}
            >
              <Check className={isAccepted ? "text-emerald-500" : undefined} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRefuse(proposal.id)}
              disabled={disabled || isRefused || isAccepted}
              aria-label="Odrzuć fiszkę"
            >
              <X className="text-destructive" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onUndo(proposal.id)}
              disabled={disabled || !isRefused}
              aria-label="Cofnij odrzucenie"
            >
              <RotateCcw />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(proposal.id)}
              disabled={disabled || isRefused}
              aria-label="Edytuj fiszkę"
            >
              <Pencil />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Przód</p>
            <p className="mt-1 whitespace-pre-wrap text-base">{proposal.current.front}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Tył</p>
            <p className="mt-1 whitespace-pre-wrap text-base">{proposal.current.back}</p>
          </div>
          {proposal.isEdited ? (
            <p className="text-xs text-muted-foreground">Edytowana ręcznie</p>
          ) : (
            <p className="text-xs text-muted-foreground">Propozycja AI bez zmian</p>
          )}
        </CardContent>
      </Card>
    );
  }
);

ProposalCard.displayName = "ProposalCard";
