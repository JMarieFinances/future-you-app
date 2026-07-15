import { supabase } from "./supabase";

export type ActivityType =
  | "transaction"
  | "message"
  | "goal"
  | "calendar"
  | "member"
  | "budget";

export type WorkspaceActivity = {
  id: string;

  workspace_id: string;

  user_id?: string;

  type: ActivityType;

  title: string;

  description?: string;

  amount?: number;

  metadata?: Record<string, any>;

  created_at: string;
};

export async function addWorkspaceActivity(
  activity: Omit<
    WorkspaceActivity,
    "id" | "created_at"
  >
) {
  const { error } = await supabase
    .from("workspace_activity")
    .insert(activity);

  if (error) throw error;
}

export async function getWorkspaceActivity(
  workspaceId: string
) {
  const { data, error } = await supabase
    .from("workspace_activity")
    .select(`
      *,
      profile:user_profiles(
        display_name
      )
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", {
      ascending: false,
    });

  if (error) throw error;

  return data ?? [];
}

export function subscribeToWorkspaceActivity(
  workspaceId: string,
  callback: () => void
) {
  const channel = supabase
    .channel(`activity-${workspaceId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "workspace_activity",
        filter: `workspace_id=eq.${workspaceId}`,
      },
      callback
    )
    .subscribe();

  return () =>
    supabase.removeChannel(channel);
}