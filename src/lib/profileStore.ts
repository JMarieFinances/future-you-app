import { supabase } from "./supabase";

export async function ensureProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("user_profiles")
    .upsert(
      {
        user_id: user.id,
        display_name:
          user.user_metadata?.name ??
          user.email?.split("@")[0] ??
          "User",
      },
      {
        onConflict: "user_id",
      }
    );
}

export async function getProfile(
  userId: string
) {
  const { data } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  return data;
}