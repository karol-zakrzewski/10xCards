import * as React from "react";

import { Button } from "@/components/ui/button";
import { useAccountActions } from "@/components/hooks/useAccountActions";

const fallbackEmail = "—";

interface UserNavProps {
  email?: string | null;
}

const UserNav = ({ email }: UserNavProps) => {
  const { logout, logoutState } = useAccountActions();

  const isLoggingOut = logoutState === "loading";
  const safeEmail = email ?? fallbackEmail;

  const handleLogout = React.useCallback(() => {
    logout();
  }, [logout]);

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="rounded-md border border-border/60 bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
        {safeEmail}
      </span>
      <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
        {isLoggingOut ? "Wylogowywanie..." : "Wyloguj"}
      </Button>
    </div>
  );
};

export default UserNav;
