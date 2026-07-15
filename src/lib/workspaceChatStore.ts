import { supabase } from "./supabase";

export type WorkspaceMessage = {
  id: string;
  workspace_id: string;
  user_id: string;
  message: string;
  created_at: string;
};

export async function getWorkspaceMessages(
  workspaceId: string
) {
  const { data, error } = await supabase
    .from("workspace_messages")
    .select(`
    *,
    profile:user_profiles(
        display_name,
        avatar
    )
`)
    .eq("workspace_id", workspaceId)
    .order("created_at", {
      ascending: true,
    });

  if (error) throw error;

  return (data ?? []) as WorkspaceMessage[];
}

export async function sendWorkspaceMessage(
  workspaceId: string,
  message: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not signed in.");
  }

  const { error } = await supabase
    .from("workspace_messages")
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
      message,
    });

  if (error) throw error;
}

export function subscribeToWorkspaceMessages(
  workspaceId: string,
  callback: () => void
) {
  const channel = supabase
    .channel(`chat-${workspaceId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "workspace_messages",
        filter: `workspace_id=eq.${workspaceId}`,
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}