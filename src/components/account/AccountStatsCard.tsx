import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountStatItem } from "@/components/account/AccountStatItem";
import type { AccountStatsVM } from "@/lib/viewmodels/accountViewmodels";

interface AccountStatsCardProps {
  stats: AccountStatsVM;
  isLoading: boolean;
}

export const AccountStatsCard = ({ stats, isLoading }: AccountStatsCardProps) => {
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
    </Card>
  );
};
