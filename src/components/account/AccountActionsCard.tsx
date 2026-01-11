import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AccountActionsCardProps {
  onOpenDelete: () => void;
  isBusy: boolean;
}

export const AccountActionsCard = ({ onOpenDelete, isBusy }: AccountActionsCardProps) => {
  return (
    <Card>
      <div className="flex flex-col gap-4">
        <CardHeader>
          <CardTitle>Bezpieczeństwo</CardTitle>
          <CardDescription>Usuń konto wraz z danymi.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Button variant="destructive" onClick={onOpenDelete} disabled={isBusy}>
            Usuń konto
          </Button>
        </CardContent>
      </div>
    </Card>
  );
};
