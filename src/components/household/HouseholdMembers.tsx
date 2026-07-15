import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import EmptyState from "@/components/ui/EmptyState";
import InviteMemberModal from "@/components/workspace/InviteMemberModal";
import {
    cancelWorkspaceInvite,
    getOrCreateSharedWorkspace,
    getWorkspaceInvites,
    getWorkspaceMembers,
    inviteWorkspaceMember,
    removeWorkspaceMember,
    subscribeToSharedWorkspace,
    updateWorkspaceMemberRole,
    type SharedWorkspace,
    type WorkspaceInvite,
    type WorkspaceMember,
    type WorkspaceRole,
} from "@/lib/sharedWorkspaceStore";
import type { Household } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Pressable,
    View,
} from "react-native";

type Props = {
  household: Household;
};

export default function HouseholdMembers({
  household,
}: Props) {
  const [workspace, setWorkspace] =
    useState<SharedWorkspace | null>(null);

  const [members, setMembers] = useState<
    WorkspaceMember[]
  >([]);

  const [invites, setInvites] = useState<
    WorkspaceInvite[]
  >([]);

  const [inviteModalOpen, setInviteModalOpen] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);

    try {
      const sharedWorkspace =
        await getOrCreateSharedWorkspace(
          "household",
          household
        );

      const [loadedMembers, loadedInvites] =
        await Promise.all([
          getWorkspaceMembers(sharedWorkspace.id),
          getWorkspaceInvites(sharedWorkspace.id),
        ]);

      setWorkspace(sharedWorkspace);
      setMembers(loadedMembers);
      setInvites(loadedInvites);
    } catch (error) {
      Alert.alert(
        "Unable to load members",
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [household]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (!workspace?.id) {
      return;
    }

    return subscribeToSharedWorkspace(
      workspace.id,
      loadWorkspace
    );
  }, [workspace?.id, loadWorkspace]);

  const handleInvite = async ({
    email,
    role,
  }: {
    email: string;
    role: WorkspaceRole;
  }) => {
    if (!workspace) {
      throw new Error(
        "The shared household is not ready yet."
      );
    }

    await inviteWorkspaceMember({
      workspaceId: workspace.id,
      email,
      role,
    });

    setInviteModalOpen(false);
    await loadWorkspace();
  };

  const handleCancelInvite = (
    invite: WorkspaceInvite
  ) => {
    Alert.alert(
      "Cancel invitation?",
      `${invite.invite_email} will no longer be able to accept it.`,
      [
        {
          text: "Keep Invite",
          style: "cancel",
        },
        {
          text: "Cancel Invite",
          style: "destructive",
          onPress: async () => {
            setProcessingId(invite.id);

            try {
              await cancelWorkspaceInvite(invite.id);
              await loadWorkspace();
            } catch (error) {
              Alert.alert(
                "Unable to cancel",
                error instanceof Error
                  ? error.message
                  : "Something went wrong."
              );
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleRoleChange = async (
    member: WorkspaceMember
  ) => {
    const nextRole: WorkspaceRole =
      member.role === "editor"
        ? "viewer"
        : "editor";

    setProcessingId(member.id);

    try {
      await updateWorkspaceMemberRole(
        member.id,
        nextRole
      );

      await loadWorkspace();
    } catch (error) {
      Alert.alert(
        "Unable to change role",
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemoveMember = (
    member: WorkspaceMember
  ) => {
    Alert.alert(
      "Remove member?",
      "This person will lose access to the shared household.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setProcessingId(member.id);

            try {
              await removeWorkspaceMember(
                member.id
              );

              await loadWorkspace();
            } catch (error) {
              Alert.alert(
                "Unable to remove member",
                error instanceof Error
                  ? error.message
                  : "Something went wrong."
              );
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const isOwner =
    workspace?.current_user_role === "owner";

  const pendingInvites = invites.filter(
    (invite) => invite.status === "pending"
  );

  if (loading) {
    return (
      <AppCard>
        <AppText variant="muted">
          Loading household members...
        </AppText>
      </AppCard>
    );
  }

  return (
    <>
      <AppCard glass>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="section">
              Household Members
            </AppText>

            <AppText variant="muted">
              {members.length} member
              {members.length === 1 ? "" : "s"}
            </AppText>
          </View>

          {isOwner ? (
            <AppButton
              title="Invite Member"
              onPress={() =>
                setInviteModalOpen(true)
              }
            />
          ) : null}
        </AppRow>
      </AppCard>

      <AppCard>
        <AppText variant="section">
          Current Members
        </AppText>

        {members.length === 0 ? (
          <View style={{ marginTop: 12 }}>
            <EmptyState message="No household members were found." />
          </View>
        ) : (
          <View
            style={{
              marginTop: 14,
              gap: 12,
            }}
          >
            {members.map((member) => {
              const isMemberOwner =
                member.role === "owner";

              const isProcessing =
                processingId === member.id;

              return (
                <AppCard key={member.id}>
                  <AppRow>
                    <View style={{ flex: 1 }}>
                      <AppText variant="bold">
                        {member.email ??
                          (isMemberOwner
                            ? "Household Owner"
                            : "Household Member")}
                      </AppText>

                      <AppText variant="muted">
                        {formatRole(member.role)}
                      </AppText>
                    </View>

                    <AppText variant="bold">
                      {formatRole(member.role)}
                    </AppText>
                  </AppRow>

                  {isOwner && !isMemberOwner ? (
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 10,
                        marginTop: 14,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <AppButton
                          title={
                            member.role === "editor"
                              ? "Make Viewer"
                              : "Make Editor"
                          }
                          variant="outline"
                          loading={isProcessing}
                          disabled={
                            processingId !== null
                          }
                          onPress={() =>
                            handleRoleChange(member)
                          }
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <AppButton
                          title="Remove"
                          variant="danger"
                          disabled={
                            processingId !== null
                          }
                          onPress={() =>
                            handleRemoveMember(member)
                          }
                        />
                      </View>
                    </View>
                  ) : null}
                </AppCard>
              );
            })}
          </View>
        )}
      </AppCard>

      <AppCard>
        <AppText variant="section">
          Pending Invitations
        </AppText>

        {pendingInvites.length === 0 ? (
          <View style={{ marginTop: 12 }}>
            <EmptyState message="There are no pending household invitations." />
          </View>
        ) : (
          <View
            style={{
              marginTop: 14,
              gap: 12,
            }}
          >
            {pendingInvites.map((invite) => {
              const isProcessing =
                processingId === invite.id;

              return (
                <AppCard key={invite.id}>
                  <AppRow>
                    <View style={{ flex: 1 }}>
                      <AppText variant="bold">
                        {invite.invite_email}
                      </AppText>

                      <AppText variant="muted">
                        {formatRole(invite.role)} · Pending
                      </AppText>
                    </View>

                    {isOwner ? (
                      <Pressable
                        disabled={
                          processingId !== null
                        }
                        onPress={() =>
                          handleCancelInvite(invite)
                        }
                        style={({ pressed }) => ({
                          opacity:
                            pressed || isProcessing
                              ? 0.55
                              : 1,
                        })}
                      >
                        <AppText variant="muted">
                          Cancel
                        </AppText>
                      </Pressable>
                    ) : null}
                  </AppRow>
                </AppCard>
              );
            })}
          </View>
        )}
      </AppCard>

      {!isOwner ? (
        <AppCard>
          <AppText variant="bold">
            Your access
          </AppText>

          <View style={{ marginTop: 6 }}>
            <AppText variant="muted">
              You are a{" "}
              {formatRole(
                workspace?.current_user_role ??
                  "viewer"
              ).toLowerCase()}{" "}
              in this household.
            </AppText>
          </View>
        </AppCard>
      ) : null}

      <InviteMemberModal
        visible={inviteModalOpen}
        workspaceName={household.name}
        onClose={() =>
          setInviteModalOpen(false)
        }
        onInvite={handleInvite}
      />
    </>
  );
}

function formatRole(role: WorkspaceRole) {
  return (
    role.charAt(0).toUpperCase() +
    role.slice(1)
  );
}