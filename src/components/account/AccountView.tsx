import * as React from "react";

import { AccountActionsCard } from "@/components/account/AccountActionsCard";
import { AccountHeader } from "@/components/account/AccountHeader";
import { AccountProfileCard } from "@/components/account/AccountProfileCard";
import { AccountStatsCard } from "@/components/account/AccountStatsCard";
import { DeleteAccountDialog } from "@/components/account/DeleteAccountDialog";
import { useAccountActions } from "@/components/hooks/useAccountActions";
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
  const { data, status, error: meError } = useMe();
  const { deleteAccount, deleteState, deleteError, resetDeleteState } = useAccountActions();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = React.useState(false);

  const me = data ?? fallbackMe;
  const isLoading = status === "loading";
  const isDeleting = deleteState === "loading";
  const isBusy = isDeleting;

  const handleOpenDelete = React.useCallback(() => {
    setDeleteDialogOpen(true);
    setDeleteConfirmed(false);
    resetDeleteState();
  }, [resetDeleteState]);

  const handleCloseDelete = React.useCallback(() => {
    if (isDeleting) {
      return;
    }
    setDeleteDialogOpen(false);
    setDeleteConfirmed(false);
  }, [isDeleting]);

  const handleConfirmDelete = React.useCallback(async () => {
    const result = await deleteAccount();
    if (result) {
      setDeleteDialogOpen(false);
      setDeleteConfirmed(false);
    }
  }, [deleteAccount]);

  const handleConfirmChange = React.useCallback((confirmed: boolean) => {
    setDeleteConfirmed(confirmed);
  }, []);

  return (
    <section className="grid gap-6">
      <AccountHeader title="Panel użytkownika" subtitle="Zarządzaj kontem i kontroluj aktywność." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="grid gap-6">
          <AccountProfileCard user={me.user} isLoading={isLoading} error={meError} />
          <AccountStatsCard stats={me.stats} isLoading={isLoading} error={meError} />
        </div>
        <AccountActionsCard onOpenDelete={handleOpenDelete} isBusy={isBusy} />
      </div>

      <DeleteAccountDialog
        open={deleteDialogOpen}
        isBusy={isDeleting}
        error={deleteError}
        confirmed={deleteConfirmed}
        onConfirm={handleConfirmDelete}
        onClose={handleCloseDelete}
        onConfirmChange={handleConfirmChange}
      />
    </section>
  );
};

export default AccountView;
