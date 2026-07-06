import { supabase } from "./supabase";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "inactive";

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) return "inactive";

  const { data } = await supabase
    .from("user_subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  return (data?.status as SubscriptionStatus) ?? "inactive";
}

export function hasActiveSubscription(status: SubscriptionStatus) {
  return status === "active" || status === "trialing";
}