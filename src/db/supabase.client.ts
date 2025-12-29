import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Prefer service-role key on the server to bypass RLS when auth isn’t wired yet.
// Falls back to anon for environments where the service key isn’t provided.
const supabaseServerKey = supabaseServiceRoleKey ?? supabaseAnonKey;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseServerKey);

export type SupabaseClient = typeof supabaseClient;

export const DEFAULT_USER_ID = "0347ab53-210e-450e-9cb3-1ff0abd82f9a";
