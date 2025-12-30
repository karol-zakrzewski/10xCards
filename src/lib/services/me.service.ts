import type { SupabaseClient } from "@/db/supabase.client";
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

export const getMe = async ({ supabase, userId }: { supabase: SupabaseClient; userId: string }): Promise<MeDTO> => {
  const { data: userResult, error: userError } = await supabase.auth.admin.getUserById(userId);

  if (userError || !userResult?.user) {
    throw new MeServiceError(401, "UNAUTHORIZED", "User not found or unauthorized.");
  }

  const [flashcardsCount, generationsCount] = await Promise.all([
    countTable(supabase, "flashcards", userId),
    countTable(supabase, "generations", userId),
  ]);

  return {
    user: { id: userId, email: userResult.user.email ?? "unknown@example.com" },
    stats: {
      flashcardsCount,
      generationsCount,
    },
  };
};

export const deleteMe = async ({
  supabase,
  userId,
}: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<DeletedResponse> => {
  // Delete user-owned data; rely on RLS + service role.
  await supabase.from("flashcards").delete().eq("user_id", userId);
  await supabase.from("generations").delete().eq("user_id", userId);
  await supabase.from("generation_error_logs").delete().eq("user_id", userId);

  const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
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
