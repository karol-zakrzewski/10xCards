import type { SupabaseClient } from "@/db/supabase.client";
import type { GenerationErrorLogDTO, PagedResponse } from "@/types";

export class GenerationErrorLogServiceError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "GenerationErrorLogServiceError";
  }
}

export const listGenerationErrorLogs = async ({
  supabase,
  userId,
  page,
  limit,
  order,
}: {
  supabase: SupabaseClient;
  userId: string;
  page: number;
  limit: number;
  order: "asc" | "desc";
}): Promise<PagedResponse<GenerationErrorLogDTO>> => {
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from("generation_error_logs")
    .select("id, model, source_text_hash, source_text_length, error_code, error_message, created_at", {
      count: "exact",
    })
    .eq("user_id", userId)
    .order("created_at", { ascending: order === "asc" })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new GenerationErrorLogServiceError(500, "DB_ERROR", "Failed to list generation error logs.", {
      hint: error.message,
    });
  }

  const rows = (data ?? []).map((row) => ({
    id: row.id,
    model: row.model,
    sourceTextHash: row.source_text_hash,
    sourceTextLength: row.source_text_length,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  }));

  return {
    data: rows,
    page: {
      page,
      limit,
      total: count ?? 0,
    },
  };
};
