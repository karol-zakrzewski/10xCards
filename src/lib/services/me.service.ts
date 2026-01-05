import { createSupabaseAdminClient, type SupabaseClient } from "@/db/supabase.client";
import type { DeletedResponse, MeDTO } from "@/types";

export class MeServiceError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "MeServiceError";
  }
}

export const getMe = async ({
  supabase,
  user,
}: {
  supabase: SupabaseClient;
  user: { id: string; email?: string | null };
}): Promise<MeDTO> => {
  const [flashcardsCount, generationsCount] = await Promise.all([
    countTable(supabase, "flashcards", user.id),
    countTable(supabase, "generations", user.id),
  ]);

  return {
    user: { id: user.id, email: user.email ?? "unknown@example.com" },
    stats: {
      flashcardsCount,
      generationsCount,
    },
  };
};

export const deleteMe = async ({
  userSupabase,
  userId,
}: {
  userSupabase: SupabaseClient;
  userId: string;
}): Promise<DeletedResponse> => {
  // Delete user-owned data; rely on RLS + service role.
  await userSupabase.from("flashcards").delete().eq("user_id", userId);
  await userSupabase.from("generations").delete().eq("user_id", userId);
  await userSupabase.from("generation_error_logs").delete().eq("user_id", userId);

  const adminSupabase = createSupabaseAdminClient();
  const { error: deleteUserError } = await adminSupabase.auth.admin.deleteUser(userId);
  if (deleteUserError) {
    throw new MeServiceError(500, "AUTH_ERROR", "Failed to delete user account.", { hint: deleteUserError.message });
  }

  return { deleted: true };
};

const countTable = async (
  supabase: SupabaseClient,
  table: "flashcards" | "generations",
  userId: string
): Promise<number> => {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) {
    throw new MeServiceError(500, "DB_ERROR", `Failed to count ${table}.`, { hint: error.message });
  }
  return count ?? 0;
};
