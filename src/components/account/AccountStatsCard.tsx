import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountStatItem } from "@/components/account/AccountStatItem";
import type { AccountStatsVM, ApiErrorVM } from "@/lib/viewmodels/accountViewmodels";

interface AccountStatsCardProps {
  stats: AccountStatsVM;
  isLoading: boolean;
  error?: ApiErrorVM;
}

export const AccountStatsCard = ({ stats, isLoading, error }: AccountStatsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Statystyki</CardTitle>
        <CardDescription>Podsumowanie aktywności na koncie.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <AccountStatItem label={stats.flashcardsLabel} value={stats.flashcardsCount} isLoading={isLoading} />
        <AccountStatItem label={stats.generationsLabel} value={stats.generationsCount} isLoading={isLoading} />
      </CardContent>
      {error ? (
        <div className="px-6 pb-6">
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </div>
      ) : null}
    </Card>
  );
};
