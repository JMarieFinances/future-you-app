import { supabase } from "./supabase";
import type { Business, Household } from "./types";

export type WorkspaceType = "household" | "business";
export type WorkspaceRole = "owner" | "editor" | "viewer";
export type WorkspaceInviteStatus =
  | "pending"
  | "accepted"
  | "declined";

export type SharedWorkspace<T = Household | Business> = {
  id: string;
  type: WorkspaceType;
  owner_id: string;
  local_workspace_id?: string | null;
  name: string;
  description: string;
  workspace_data: T;
  created_at: string;
  updated_at: string;
  current_user_role?: WorkspaceRole;
};

export type WorkspaceMember = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
  email?: string;
};

export type WorkspaceInvite = {
  id: string;
  workspace_id: string;
  invited_by: string;
  invite_email: string;
  role: WorkspaceRole;
  status: WorkspaceInviteStatus;
  created_at: string;
  accepted_at?: string | null;
  workspace?: {
    id: string;
    type: WorkspaceType;
    local_workspace_id?: string | null;
    name: string;
    description: string;
  };
};

async function requireUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!user) {
    throw new Error("You must be signed in.");
  }

  return user;
}

function normalizeWorkspaceData<T extends Household | Business>(
  workspace: T
): T {
  return JSON.parse(JSON.stringify(workspace)) as T;
}

export async function createSharedWorkspace(
  type: WorkspaceType,
  workspace: Household | Business
) {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("shared_workspaces")
    .insert({
      type,
      owner_id: user.id,
      local_workspace_id: workspace.id,
      name: workspace.name,
      description: workspace.description ?? "",
      workspace_data: normalizeWorkspaceData(workspace),
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SharedWorkspace;
}

export async function getOrCreateSharedWorkspace(
  type: WorkspaceType,
  workspace: Household | Business
) {
  const user = await requireUser();

  const { data: existing, error: lookupError } =
    await supabase
      .from("shared_workspaces")
      .select(`
        id,
        type,
        owner_id,
        local_workspace_id,
        name,
        description,
        workspace_data,
        created_at,
        updated_at,
        workspace_members (
          user_id,
          role
        )
      `)
      .eq("type", type)
      .eq("local_workspace_id", workspace.id)
      .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  if (existing) {
    const member = existing.workspace_members?.find(
      (item: {
        user_id: string;
        role: WorkspaceRole;
      }) => item.user_id === user.id
    );

    return {
      id: existing.id,
      type: existing.type,
      owner_id: existing.owner_id,
      local_workspace_id:
        existing.local_workspace_id,
      name: existing.name,
      description: existing.description,
      workspace_data:
        existing.workspace_data,
      created_at: existing.created_at,
      updated_at: existing.updated_at,
      current_user_role:
        existing.owner_id === user.id
          ? "owner"
          : member?.role ?? "viewer",
    } as SharedWorkspace;
  }

  return createSharedWorkspace(
    type,
    workspace
  );
}

export async function getSharedWorkspaceByLocalId(
  type: WorkspaceType,
  localWorkspaceId: string
) {
  await requireUser();

  const { data, error } = await supabase
    .from("shared_workspaces")
    .select(`
      id,
      type,
      owner_id,
      local_workspace_id,
      name,
      description,
      workspace_data,
      created_at,
      updated_at,
      workspace_members (
        user_id,
        role
      )
    `)
    .eq("type", type)
    .eq("local_workspace_id", localWorkspaceId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const currentUser = await requireUser();

  const member = data.workspace_members?.find(
    (item: {
      user_id: string;
      role: WorkspaceRole;
    }) => item.user_id === currentUser.id
  );

  return {
    id: data.id,
    type: data.type,
    owner_id: data.owner_id,
    local_workspace_id: data.local_workspace_id,
    name: data.name,
    description: data.description,
    workspace_data: data.workspace_data,
    created_at: data.created_at,
    updated_at: data.updated_at,
    current_user_role:
      data.owner_id === currentUser.id
        ? "owner"
        : member?.role,
  } as SharedWorkspace;
}

export async function getSharedWorkspaces(
  type?: WorkspaceType
) {
  const user = await requireUser();

  let query = supabase
    .from("shared_workspaces")
    .select(`
      id,
      type,
      owner_id,
      local_workspace_id,
      name,
      description,
      workspace_data,
      created_at,
      updated_at,
      workspace_members (
        user_id,
        role
      )
    `)
    .order("updated_at", {
      ascending: false,
    });

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((workspace: any) => {
    const member = workspace.workspace_members?.find(
      (item: {
        user_id: string;
        role: WorkspaceRole;
      }) => item.user_id === user.id
    );

    return {
      id: workspace.id,
      type: workspace.type,
      owner_id: workspace.owner_id,
      local_workspace_id: workspace.local_workspace_id,
      name: workspace.name,
      description: workspace.description,
      workspace_data: workspace.workspace_data,
      created_at: workspace.created_at,
      updated_at: workspace.updated_at,
      current_user_role:
        workspace.owner_id === user.id
          ? "owner"
          : member?.role,
    };
  }) as SharedWorkspace[];
}

export async function getSharedWorkspace(
  workspaceId: string
) {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("shared_workspaces")
    .select(`
      id,
      type,
      owner_id,
      local_workspace_id,
      name,
      description,
      workspace_data,
      created_at,
      updated_at,
      workspace_members (
        user_id,
        role
      )
    `)
    .eq("id", workspaceId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const member = data.workspace_members?.find(
    (item: {
      user_id: string;
      role: WorkspaceRole;
    }) => item.user_id === user.id
  );

  return {
    id: data.id,
    type: data.type,
    owner_id: data.owner_id,
    local_workspace_id: data.local_workspace_id,
    name: data.name,
    description: data.description,
    workspace_data: data.workspace_data,
    created_at: data.created_at,
    updated_at: data.updated_at,
    current_user_role:
      data.owner_id === user.id
        ? "owner"
        : member?.role,
  } as SharedWorkspace;
}

export async function updateSharedWorkspace(
  workspaceId: string,
  workspace: Household | Business
) {
  await requireUser();

  const { data, error } = await supabase
    .from("shared_workspaces")
    .update({
      local_workspace_id: workspace.id,
      name: workspace.name,
      description: workspace.description ?? "",
      workspace_data: normalizeWorkspaceData(workspace),
      updated_at: new Date().toISOString(),
    })
    .eq("id", workspaceId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SharedWorkspace;
}

export async function syncSharedWorkspace(
  type: WorkspaceType,
  workspace: Household | Business
) {
  const sharedWorkspace =
    await getOrCreateSharedWorkspace(type, workspace);

  return updateSharedWorkspace(
    sharedWorkspace.id,
    workspace
  );
}

export async function deleteSharedWorkspace(
  workspaceId: string
) {
  await requireUser();

  const { error } = await supabase
    .from("shared_workspaces")
    .delete()
    .eq("id", workspaceId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function inviteWorkspaceMember({
  workspaceId,
  email,
  role = "editor",
}: {
  workspaceId: string;
  email: string;
  role?: WorkspaceRole;
}) {
  const user = await requireUser();
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Enter an email address.");
  }

  if (
    normalizedEmail ===
    user.email?.trim().toLowerCase()
  ) {
    throw new Error(
      "You cannot invite your own account."
    );
  }

  const { data: existingInvite, error: lookupError } =
    await supabase
      .from("workspace_invites")
      .select("id, status")
      .eq("workspace_id", workspaceId)
      .ilike("invite_email", normalizedEmail)
      .eq("status", "pending")
      .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  if (existingInvite) {
    throw new Error(
      "A pending invitation already exists for this email."
    );
  }

  const { data, error } = await supabase
    .from("workspace_invites")
    .insert({
      workspace_id: workspaceId,
      invited_by: user.id,
      invite_email: normalizedEmail,
      role,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
  throw new Error(error.message);
}

const invite =
  data as WorkspaceInvite;

const {
  error: emailError,
} = await supabase.functions.invoke(
  "send-workspace-invite",
  {
    body: {
      inviteId: invite.id,
    },
  }
);

if (emailError) {
  await supabase
    .from("workspace_invites")
    .delete()
    .eq("id", invite.id);

  throw new Error(
    `The invitation could not be emailed: ${emailError.message}`
  );
}

return invite;
}

export async function getPendingInvites() {
  const user = await requireUser();

  if (!user.email) {
    return [];
  }

  const { data, error } = await supabase
    .from("workspace_invites")
    .select(`
      id,
      workspace_id,
      invited_by,
      invite_email,
      role,
      status,
      created_at,
      accepted_at,
      workspace:shared_workspaces (
        id,
        type,
        local_workspace_id,
        name,
        description
      )
    `)
    .ilike(
      "invite_email",
      user.email.trim().toLowerCase()
    )
    .eq("status", "pending")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((invite: any) => ({
    ...invite,
    workspace: Array.isArray(invite.workspace)
      ? invite.workspace[0]
      : invite.workspace,
  })) as WorkspaceInvite[];
}

export async function getWorkspaceInvites(
  workspaceId: string
) {
  await requireUser();

  const { data, error } = await supabase
    .from("workspace_invites")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as WorkspaceInvite[];
}

export async function acceptWorkspaceInvite(
  invite: WorkspaceInvite
) {
  const user = await requireUser();

  if (
    user.email?.trim().toLowerCase() !==
    invite.invite_email.trim().toLowerCase()
  ) {
    throw new Error(
      "This invitation belongs to another account."
    );
  }

  const { data, error } = await supabase.rpc(
    "accept_workspace_invite",
    {
      target_invite_id: invite.id,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data as string;
}

export async function declineWorkspaceInvite(
  inviteId: string
) {
  await requireUser();

  const { error } = await supabase
    .from("workspace_invites")
    .update({
      status: "declined",
    })
    .eq("id", inviteId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function cancelWorkspaceInvite(
  inviteId: string
) {
  await requireUser();

  const { error } = await supabase
    .from("workspace_invites")
    .delete()
    .eq("id", inviteId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getWorkspaceMembers(
  workspaceId: string
) {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((member) => ({
    ...member,
    email:
      member.user_id === user.id
        ? user.email ?? undefined
        : undefined,
  })) as WorkspaceMember[];
}

export async function updateWorkspaceMemberRole(
  memberId: string,
  role: WorkspaceRole
) {
  await requireUser();

  if (role === "owner") {
    throw new Error(
      "Ownership transfer requires a separate action."
    );
  }

  const { data, error } = await supabase
    .from("workspace_members")
    .update({
      role,
    })
    .eq("id", memberId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as WorkspaceMember;
}

export async function removeWorkspaceMember(
  memberId: string
) {
  await requireUser();

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("id", memberId);

  if (error) {
    throw new Error(error.message);
  }
}

export function subscribeToSharedWorkspace(
  workspaceId: string,
  onChange: () => void
) {
  const channelName = `shared-workspace-${workspaceId}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "shared_workspaces",
        filter: `id=eq.${workspaceId}`,
      },
      () => {
        onChange();
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "workspace_members",
        filter: `workspace_id=eq.${workspaceId}`,
      },
      () => {
        onChange();
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "workspace_invites",
        filter: `workspace_id=eq.${workspaceId}`,
      },
      () => {
        onChange();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}