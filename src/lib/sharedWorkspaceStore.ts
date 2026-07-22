import {
    getAppData,
    updateAppData,
} from "./appStore";
import { supabase } from "./supabase";
import type {
    Business,
    Household,
} from "./types";

export type WorkspaceType =
  | "household"
  | "business";

export type WorkspaceRole =
  | "owner"
  | "editor"
  | "viewer";

export type WorkspaceInviteStatus =
  | "pending"
  | "accepted"
  | "declined";

export type WorkspaceData =
  | Household
  | Business;

export type SharedWorkspace<
  T extends WorkspaceData = WorkspaceData,
> = {
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
  display_name?: string;
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

type WorkspaceRpcRow = {
  id: string;
  type: WorkspaceType;
  owner_id: string;
  local_workspace_id?: string | null;
  name: string;
  description?: string | null;
  workspace_data: WorkspaceData;
  created_at: string;
  updated_at: string;
  current_user_role: WorkspaceRole;
};

type ProfileRow = {
  user_id: string;
  display_name?: string | null;
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
    throw new Error(
      "You must be signed in."
    );
  }

  return user;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function cloneWorkspaceData<
  T extends WorkspaceData,
>(workspace: T): T {
  return JSON.parse(
    JSON.stringify(workspace)
  ) as T;
}

function isHousehold(
  value: unknown
): value is Household {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const household =
    value as Partial<Household>;

  return Boolean(
    household.id &&
      household.name &&
      household.budget &&
      "householdIncome" in
        household.budget
  );
}

function isBusiness(
  value: unknown
): value is Business {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const business =
    value as Partial<Business>;

  return Boolean(
    business.id &&
      business.name &&
      business.budget &&
      "businessIncome" in
        business.budget
  );
}

function mapWorkspaceRow(
  row: WorkspaceRpcRow
): SharedWorkspace {
  return {
    id: row.id,
    type: row.type,
    owner_id: row.owner_id,
    local_workspace_id:
      row.local_workspace_id,
    name: row.name,
    description:
      row.description ?? "",
    workspace_data:
      row.workspace_data,
    created_at: row.created_at,
    updated_at: row.updated_at,
    current_user_role:
      row.current_user_role,
  };
}

async function getCurrentUserRole(
  workspaceId: string,
  ownerId: string
): Promise<WorkspaceRole> {
  const user = await requireUser();

  if (ownerId === user.id) {
    return "owner";
  }

  const { data, error } =
    await supabase
      .from("workspace_members")
      .select("role")
      .eq(
        "workspace_id",
        workspaceId
      )
      .eq("user_id", user.id)
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (
    (data?.role as WorkspaceRole) ??
    "viewer"
  );
}

async function mergeWorkspacesIntoAppData(
  workspaces: SharedWorkspace[]
) {
  await updateAppData((app) => {
    app.households ??= [];
    app.businesses ??= [];

    const householdMap =
      new Map<string, Household>();

    const businessMap =
      new Map<string, Business>();

    app.households.forEach(
      (household) => {
        householdMap.set(
          household.id,
          household
        );
      }
    );

    app.businesses.forEach(
      (business) => {
        businessMap.set(
          business.id,
          business
        );
      }
    );

    workspaces.forEach(
      (workspace) => {
        if (
          workspace.type ===
            "household" &&
          isHousehold(
            workspace.workspace_data
          )
        ) {
          householdMap.set(
            workspace.workspace_data.id,
            cloneWorkspaceData(
              workspace.workspace_data
            )
          );

          return;
        }

        if (
          workspace.type ===
            "business" &&
          isBusiness(
            workspace.workspace_data
          )
        ) {
          businessMap.set(
            workspace.workspace_data.id,
            cloneWorkspaceData(
              workspace.workspace_data
            )
          );
        }
      }
    );

    app.households = Array.from(
      householdMap.values()
    );

    app.businesses = Array.from(
      businessMap.values()
    );
  });
}

export async function createSharedWorkspace(
  type: WorkspaceType,
  workspace: WorkspaceData
): Promise<SharedWorkspace> {
  const user = await requireUser();

  const { data, error } =
    await supabase
      .from("shared_workspaces")
      .insert({
        type,
        owner_id: user.id,
        local_workspace_id:
          workspace.id,
        name: workspace.name,
        description:
          workspace.description ?? "",
        workspace_data:
          cloneWorkspaceData(workspace),
      })
      .select(`
        id,
        type,
        owner_id,
        local_workspace_id,
        name,
        description,
        workspace_data,
        created_at,
        updated_at
      `)
      .single();

  if (error) {
    throw new Error(error.message);
  }

  const created = {
    ...data,
    description:
      data.description ?? "",
    current_user_role:
      "owner" as WorkspaceRole,
  } as SharedWorkspace;

  await mergeWorkspacesIntoAppData([
    created,
  ]);

  return created;
}

export async function getOrCreateSharedWorkspace(
  type: WorkspaceType,
  workspace: WorkspaceData
): Promise<SharedWorkspace> {
  const user = await requireUser();

  const { data, error } =
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
        updated_at
      `)
      .eq("type", type)
      .eq(
        "local_workspace_id",
        workspace.id
      )
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return createSharedWorkspace(
      type,
      workspace
    );
  }

  const role =
    data.owner_id === user.id
      ? "owner"
      : await getCurrentUserRole(
          data.id,
          data.owner_id
        );

  const existing = {
    ...data,
    description:
      data.description ?? "",
    current_user_role: role,
  } as SharedWorkspace;

  await mergeWorkspacesIntoAppData([
    existing,
  ]);

  return existing;
}

export async function getSharedWorkspace(
  workspaceId: string
): Promise<SharedWorkspace> {
  await requireUser();

  const { data, error } =
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
        updated_at
      `)
      .eq("id", workspaceId)
      .single();

  if (error) {
    throw new Error(error.message);
  }

  const role =
    await getCurrentUserRole(
      data.id,
      data.owner_id
    );

  return {
    ...data,
    description:
      data.description ?? "",
    current_user_role: role,
  } as SharedWorkspace;
}

export async function getSharedWorkspaceByLocalId(
  type: WorkspaceType,
  localWorkspaceId: string
): Promise<SharedWorkspace | null> {
  await requireUser();

  const { data, error } =
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
        updated_at
      `)
      .eq("type", type)
      .eq(
        "local_workspace_id",
        localWorkspaceId
      )
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const role =
    await getCurrentUserRole(
      data.id,
      data.owner_id
    );

  return {
    ...data,
    description:
      data.description ?? "",
    current_user_role: role,
  } as SharedWorkspace;
}

/**
 * Loads every workspace the current user owns
 * or has joined through workspace_members.
 *
 * This uses the SECURITY DEFINER RPC so RLS
 * cannot silently hide accepted workspaces.
 */
export async function getSharedWorkspaces(
  type?: WorkspaceType
): Promise<SharedWorkspace[]> {
  await requireUser();

  const { data, error } =
    await supabase.rpc(
      "get_my_shared_workspaces",
      {
        requested_type:
          type ?? null,
      }
    );

  if (error) {
    throw new Error(error.message);
  }

  const workspaces = (
    (data ?? []) as WorkspaceRpcRow[]
  ).map(mapWorkspaceRow);

  console.log(
    "Accessible shared workspaces:",
    workspaces.map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
      type: workspace.type,
      role:
        workspace.current_user_role,
      localId:
        workspace.local_workspace_id,
      hasData: Boolean(
        workspace.workspace_data
      ),
    }))
  );

  return workspaces;
}

export async function refreshSharedWorkspacesIntoAppData() {
  const workspaces =
    await getSharedWorkspaces();

  await mergeWorkspacesIntoAppData(
    workspaces
  );

  console.log(
    "Households after shared refresh:",
    getAppData().households
  );

  console.log(
    "Businesses after shared refresh:",
    getAppData().businesses
  );

  return workspaces;
}

export async function updateSharedWorkspace(
  workspaceId: string,
  workspace: WorkspaceData
): Promise<SharedWorkspace> {
  await requireUser();

  const { data, error } =
    await supabase
      .from("shared_workspaces")
      .update({
        local_workspace_id:
          workspace.id,
        name: workspace.name,
        description:
          workspace.description ?? "",
        workspace_data:
          cloneWorkspaceData(workspace),
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", workspaceId)
      .select(`
        id,
        type,
        owner_id,
        local_workspace_id,
        name,
        description,
        workspace_data,
        created_at,
        updated_at
      `)
      .single();

  if (error) {
    throw new Error(error.message);
  }

  const role =
    await getCurrentUserRole(
      data.id,
      data.owner_id
    );

  const updated = {
    ...data,
    description:
      data.description ?? "",
    current_user_role: role,
  } as SharedWorkspace;

  await mergeWorkspacesIntoAppData([
    updated,
  ]);

  return updated;
}

export async function syncSharedWorkspace(
  type: WorkspaceType,
  workspace: WorkspaceData
) {
  const sharedWorkspace =
    await getOrCreateSharedWorkspace(
      type,
      workspace
    );

  return updateSharedWorkspace(
    sharedWorkspace.id,
    workspace
  );
}

export async function deleteSharedWorkspace(
  workspaceId: string
) {
  await requireUser();

  const { data, error } =
    await supabase
      .from("shared_workspaces")
      .delete()
      .eq("id", workspaceId)
      .select("id")
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      "The workspace was not deleted."
    );
  }

  return data.id;
}

export async function inviteWorkspaceMember({
  workspaceId,
  email,
  role = "editor",
}: {
  workspaceId: string;
  email: string;
  role?: WorkspaceRole;
}): Promise<WorkspaceInvite> {
  const user = await requireUser();

  const normalizedEmail =
    normalizeEmail(email);

  if (!normalizedEmail) {
    throw new Error(
      "Enter an email address."
    );
  }

  if (
    normalizedEmail ===
    normalizeEmail(user.email ?? "")
  ) {
    throw new Error(
      "You cannot invite your own account."
    );
  }

  if (role === "owner") {
    throw new Error(
      "Members cannot be invited as owners."
    );
  }

  const {
    data: existingInvite,
    error: lookupError,
  } = await supabase
    .from("workspace_invites")
    .select("id")
    .eq(
      "workspace_id",
      workspaceId
    )
    .ilike(
      "invite_email",
      normalizedEmail
    )
    .eq("status", "pending")
    .maybeSingle();

  if (lookupError) {
    throw new Error(
      lookupError.message
    );
  }

  if (existingInvite) {
    throw new Error(
      "A pending invitation already exists for this email."
    );
  }

  const { data, error } =
    await supabase
      .from("workspace_invites")
      .insert({
        workspace_id:
          workspaceId,
        invited_by: user.id,
        invite_email:
          normalizedEmail,
        role,
        status: "pending",
      })
      .select(`
        id,
        workspace_id,
        invited_by,
        invite_email,
        role,
        status,
        created_at,
        accepted_at
      `)
      .single();

  if (error) {
    throw new Error(error.message);
  }

  const invite =
    data as WorkspaceInvite;

  const {
    data: emailResult,
    error: emailError,
  } = await supabase.functions.invoke(
    "send-workspace-invite",
    {
      body: {
        inviteId: invite.id,
      },
    }
  );

  if (
    emailError ||
    emailResult?.error
  ) {
    await supabase
      .from("workspace_invites")
      .delete()
      .eq("id", invite.id);

    throw new Error(
      emailResult?.error ??
        emailError?.message ??
        "The invitation email could not be sent."
    );
  }

  return invite;
}

export async function getPendingInvites(): Promise<
  WorkspaceInvite[]
> {
  const user = await requireUser();

  if (!user.email) {
    return [];
  }

  const { data, error } =
    await supabase
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
        normalizeEmail(user.email)
      )
      .eq("status", "pending")
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(
    (invite: any) => ({
      ...invite,
      workspace: Array.isArray(
        invite.workspace
      )
        ? invite.workspace[0]
        : invite.workspace,
    })
  ) as WorkspaceInvite[];
}

export async function getWorkspaceInvites(
  workspaceId: string
): Promise<WorkspaceInvite[]> {
  await requireUser();

  const { data, error } =
    await supabase
      .from("workspace_invites")
      .select(`
        id,
        workspace_id,
        invited_by,
        invite_email,
        role,
        status,
        created_at,
        accepted_at
      `)
      .eq(
        "workspace_id",
        workspaceId
      )
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    throw new Error(error.message);
  }

  return (
    data ?? []
  ) as WorkspaceInvite[];
}

export async function acceptWorkspaceInvite(
  invite: WorkspaceInvite
): Promise<SharedWorkspace> {
  const user = await requireUser();

  if (
    normalizeEmail(
      user.email ?? ""
    ) !==
    normalizeEmail(
      invite.invite_email
    )
  ) {
    throw new Error(
      "This invitation belongs to another account."
    );
  }

  const {
    data: workspaceId,
    error,
  } = await supabase.rpc(
    "accept_workspace_invite",
    {
      target_invite_id:
        invite.id,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!workspaceId) {
    throw new Error(
      "The workspace could not be loaded after accepting."
    );
  }

  const workspace =
    await getSharedWorkspace(
      String(workspaceId)
    );

  await mergeWorkspacesIntoAppData([
    workspace,
  ]);

  return workspace;
}

export async function declineWorkspaceInvite(
  inviteId: string
) {
  await requireUser();

  const { data, error } =
    await supabase
      .from("workspace_invites")
      .update({
        status: "declined",
      })
      .eq("id", inviteId)
      .select("id")
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      "The invitation could not be declined."
    );
  }

  return data.id;
}

export async function cancelWorkspaceInvite(
  inviteId: string
) {
  await requireUser();

  const { data, error } =
    await supabase
      .from("workspace_invites")
      .delete()
      .eq("id", inviteId)
      .select("id")
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      "The invitation was not canceled."
    );
  }

  return data.id;
}

export async function getWorkspaceMembers(
  workspaceId: string
): Promise<WorkspaceMember[]> {
  const currentUser =
    await requireUser();

  const { data, error } =
    await supabase
      .from("workspace_members")
      .select(`
        id,
        workspace_id,
        user_id,
        role,
        created_at
      `)
      .eq(
        "workspace_id",
        workspaceId
      )
      .order("created_at", {
        ascending: true,
      });

  if (error) {
    throw new Error(error.message);
  }

  const members =
    (data ??
      []) as WorkspaceMember[];

  const userIds = members.map(
    (member) => member.user_id
  );

  let profiles: ProfileRow[] = [];

  if (userIds.length > 0) {
    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from("user_profiles")
      .select(`
        user_id,
        display_name
      `)
      .in("user_id", userIds);

    if (!profileError) {
      profiles =
        (profileData ??
          []) as ProfileRow[];
    }
  }

  return members.map((member) => {
    const profile =
      profiles.find(
        (item) =>
          item.user_id ===
          member.user_id
      );

    return {
      ...member,
      email:
        member.user_id ===
        currentUser.id
          ? currentUser.email ??
            undefined
          : undefined,
      display_name:
        profile?.display_name ??
        undefined,
    };
  });
}

export async function updateWorkspaceMemberRole(
  memberId: string,
  role: WorkspaceRole
): Promise<WorkspaceMember> {
  await requireUser();

  if (role === "owner") {
    throw new Error(
      "Ownership transfer is not supported yet."
    );
  }

  const { data, error } =
    await supabase
      .from("workspace_members")
      .update({ role })
      .eq("id", memberId)
      .neq("role", "owner")
      .select(`
        id,
        workspace_id,
        user_id,
        role,
        created_at
      `)
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      "The member role was not changed."
    );
  }

  return data as WorkspaceMember;
}

export async function removeWorkspaceMember(
  memberId: string
) {
  await requireUser();

  const { data, error } =
    await supabase
      .from("workspace_members")
      .delete()
      .eq("id", memberId)
      .neq("role", "owner")
      .select("id")
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      "The member was not removed."
    );
  }

  return data.id;
}

export function subscribeToSharedWorkspace(
  workspaceId: string,
  onChange: () => void
) {
  const channelName = [
    "shared-workspace",
    workspaceId,
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2),
  ].join("-");

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table:
          "shared_workspaces",
        filter: `id=eq.${workspaceId}`,
      },
      onChange
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table:
          "workspace_members",
        filter: `workspace_id=eq.${workspaceId}`,
      },
      onChange
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table:
          "workspace_invites",
        filter: `workspace_id=eq.${workspaceId}`,
      },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}