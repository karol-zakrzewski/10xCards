import * as React from "react";

import { AccountActionsCard } from "@/components/account/AccountActionsCard";
import { AccountHeader } from "@/components/account/AccountHeader";
import { AccountProfileCard } from "@/components/account/AccountProfileCard";
import { AccountStatsCard } from "@/components/account/AccountStatsCard";
import { useMe } from "@/components/hooks/useMe";
import type { MeViewModel } from "@/lib/viewmodels/accountViewmodels";

const fallbackMe: MeViewModel = {
  user: {
    id: "",
    email: "—",
    emailLabel: "Email",
  },
  stats: {
    flashcardsCount: 0,
    generationsCount: 0,
    flashcardsLabel: "Liczba fiszek",
    generationsLabel: "Liczba generacji",
  },
};

const AccountView = () => {
  const { data, status } = useMe();
  const me = data ?? fallbackMe;
  const isLoading = status === "loading";
  const isBusy = false;

  const handleLogout = React.useCallback(() => {
    window.location.href = "/login";
  }, []);

  const handleOpenDelete = React.useCallback(() => {}, []);

  return (
    <section className="grid gap-6">
      <AccountHeader title="Panel użytkownika" subtitle="Zarządzaj kontem i kontroluj aktywność." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="grid gap-6">
          <AccountProfileCard user={me.user} isLoading={isLoading} />
          <AccountStatsCard stats={me.stats} isLoading={isLoading} />
        </div>
        <AccountActionsCard onLogout={handleLogout} onOpenDelete={handleOpenDelete} isBusy={isBusy} />
      </div>
    </section>
  );
};

export default AccountView;
