import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AccountUserVM, ApiErrorVM } from "@/lib/viewmodels/accountViewmodels";

interface AccountProfileCardProps {
  user: AccountUserVM;
  isLoading: boolean;
  error?: ApiErrorVM;
}

export const AccountProfileCard = ({ user, isLoading, error }: AccountProfileCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dane konta</CardTitle>
        <CardDescription>Podstawowe informacje o Twoim profilu.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{user.emailLabel}</p>
          {isLoading ? (
            <div className="h-5 w-48 animate-pulse rounded bg-muted" aria-hidden="true" />
          ) : (
            <p className="text-sm font-medium text-foreground">{user.email}</p>
          )}
        </div>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
};
