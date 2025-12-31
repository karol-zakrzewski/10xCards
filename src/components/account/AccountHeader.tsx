import type { ReactNode } from "react";

interface AccountHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
}

export const AccountHeader = ({ title, subtitle }: AccountHeaderProps) => {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
    </header>
  );
};
