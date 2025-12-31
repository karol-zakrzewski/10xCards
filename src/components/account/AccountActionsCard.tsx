import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AccountActionsCardProps {
  onLogout: () => void;
  onOpenDelete: () => void;
  isBusy: boolean;
}

export const AccountActionsCard = ({ onLogout, onOpenDelete, isBusy }: AccountActionsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bezpieczeństwo</CardTitle>
        <CardDescription>Wyloguj się lub usuń konto wraz z danymi.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <Button variant="outline" onClick={onLogout} disabled={isBusy}>
          Wyloguj
        </Button>
        <Button variant="destructive" onClick={onOpenDelete} disabled={isBusy}>
          Usuń konto
        </Button>
      </CardContent>
    </Card>
  );
};
