// Base URL for the Lovanet backend API (edge function `api`).
// Falls back to the legacy VITE_BACKEND_URL when explicitly provided.
const legacyBase = (import.meta.env.VITE_BACKEND_URL ?? "") as string;
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? "") as string;

export const API_BASE = legacyBase
  ? `${legacyBase}/api`
  : supabaseUrl
    ? `${supabaseUrl}/functions/v1/api`
    : "/api";