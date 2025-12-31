interface AccountStatItemProps {
  label: string;
  value: number | string;
  isLoading?: boolean;
}

export const AccountStatItem = ({ label, value, isLoading = false }: AccountStatItemProps) => {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      {isLoading ? (
        <div className="mt-2 h-6 w-16 animate-pulse rounded bg-muted" aria-hidden="true" />
      ) : (
        <p className="mt-2 text-2xl font-semibold">{value}</p>
      )}
    </div>
  );
};
