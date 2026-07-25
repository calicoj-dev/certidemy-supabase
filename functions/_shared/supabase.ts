// Supabase client factories.
//
// - getServiceClient()  : bypasses RLS. Use AFTER authenticating the user.
// - getUserClient(auth) : enforces RLS as the calling user. Use to verify
//                         the caller's identity via auth.getUser().

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export function getServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export function getUserClient(authHeader: string): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authHeader } },
    },
  );
}

export async function authenticate(req: Request): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw new HttpError(401, 'missing authorization header');
  const userClient = getUserClient(authHeader);
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) throw new HttpError(401, 'invalid token');
  return data.user.id;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
