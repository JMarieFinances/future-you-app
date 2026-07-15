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
    removeWorkspaceMember,
    subscribeToSharedWorkspace,
    updateWorkspaceMemberRole,
    type SharedWorkspace,
    type WorkspaceInvite,
    type WorkspaceMember,
    type WorkspaceRole,
    type WorkspaceType,
} from "@/lib/sharedWorkspaceStore";
import type { Business, Household } from "@/lib/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, View } from "react-native";

type Props = {
  workspaceType: WorkspaceType;
  workspace: Household | Business;
};

export default function WorkspaceMembers({
  workspaceType,
  workspace: workspaceData,
}: Props) {
  const [sharedWorkspace, setSharedWorkspace] =
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
  const [refreshing, setRefreshing] =
    useState(false);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const workspaceLabel =
    workspaceType === "business"
      ? "Business"
      : "Household";

  const loadWorkspace = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setErrorMessage("");

      try {
        const loadedWorkspace =
          await getOrCreateSharedWorkspace(
            workspaceType,
            workspaceData
          );

        const [loadedMembers, loadedInvites] =
          await Promise.all([
            getWorkspaceMembers(
              loadedWorkspace.id
            ),
            getWorkspaceInvites(
              loadedWorkspace.id
            ),
          ]);

        setSharedWorkspace(loadedWorkspace);
        setMembers(loadedMembers);
        setInvites(loadedInvites);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : `Unable to load ${workspaceLabel.toLowerCase()} members.`;

        setErrorMessage(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      workspaceData.id,
      workspaceData.name,
      workspaceType,
      workspaceLabel,
    ]
  );

  useEffect(() => {
    loadWorkspace(true);
  }, [loadWorkspace]);

  useEffect(() => {
    if (!sharedWorkspace?.id) {
      return;
    }

    return subscribeToSharedWorkspace(
      sharedWorkspace.id,
      () => {
        loadWorkspace(false);
      }
    );
  }, [
    sharedWorkspace?.id,
    loadWorkspace,
  ]);

  const isOwner =
    sharedWorkspace?.current_user_role ===
    "owner";

  const currentUserRole =
    sharedWorkspace?.current_user_role ??
    "viewer";

  const pendingInvites = useMemo(
    () =>
      invites.filter(
        (invite) =>
          invite.status === "pending"
      ),
    [invites]
  );

  const handleCancelInvite = (
    invite: WorkspaceInvite
  ) => {
    Alert.alert(
      "Cancel invitation?",
      `${invite.invite_email} will no longer be able to accept this invitation.`,
      [
        {
          text: "Keep Invitation",
          style: "cancel",
        },
        {
          text: "Cancel Invitation",
          style: "destructive",
          onPress: async () => {
            setProcessingId(invite.id);

            try {
              await cancelWorkspaceInvite(
                invite.id
              );

              await loadWorkspace(false);
            } catch (error) {
              Alert.alert(
                "Unable to cancel invitation",
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

  const handleRoleChange = (
    member: WorkspaceMember
  ) => {
    const nextRole: WorkspaceRole =
      member.role === "editor"
        ? "viewer"
        : "editor";

    Alert.alert(
      "Change member role?",
      `${getMemberLabel(
        member
      )} will become a ${formatRole(
        nextRole
      ).toLowerCase()}.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Change Role",
          onPress: async () => {
            setProcessingId(member.id);

            try {
              await updateWorkspaceMemberRole(
                member.id,
                nextRole
              );

              await loadWorkspace(false);
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
          },
        },
      ]
    );
  };

  const handleRemoveMember = (
    member: WorkspaceMember
  ) => {
    Alert.alert(
      "Remove member?",
      `${getMemberLabel(
        member
      )} will lose access to this ${workspaceLabel.toLowerCase()}.`,
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

              await loadWorkspace(false);
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

  if (loading) {
    return (
      <AppCard>
        <AppText variant="muted">
          Loading {workspaceLabel.toLowerCase()} members...
        </AppText>
      </AppCard>
    );
  }

  if (errorMessage) {
    return (
      <AppCard>
        <AppText variant="section">
          Members could not be loaded
        </AppText>

        <View style={{ marginTop: 6 }}>
          <AppText variant="muted">
            {errorMessage}
          </AppText>
        </View>

        <View style={{ marginTop: 14 }}>
          <AppButton
            title="Try Again"
            loading={refreshing}
            onPress={() =>
              loadWorkspace(false)
            }
          />
        </View>
      </AppCard>
    );
  }

  return (
    <>
      <AppCard glass>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="section">
              {workspaceLabel} Members
            </AppText>

            <AppText variant="muted">
              {members.length} member
              {members.length === 1
                ? ""
                : "s"}{" "}
              with access
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

      <View
        style={{
          flexDirection: "row",
          gap: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <AppCard>
            <AppText variant="muted">
              Members
            </AppText>

            <View style={{ marginTop: 4 }}>
              <AppText variant="section">
                {members.length}
              </AppText>
            </View>
          </AppCard>
        </View>

        <View style={{ flex: 1 }}>
          <AppCard>
            <AppText variant="muted">
              Pending
            </AppText>

            <View style={{ marginTop: 4 }}>
              <AppText variant="section">
                {pendingInvites.length}
              </AppText>
            </View>
          </AppCard>
        </View>
      </View>

      <AppCard>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="section">
              Current Members
            </AppText>

            <AppText variant="muted">
              Owners control access and roles.
            </AppText>
          </View>

          <AppButton
            title="Refresh"
            variant="outline"
            loading={refreshing}
            onPress={() =>
              loadWorkspace(false)
            }
          />
        </AppRow>

        {members.length === 0 ? (
          <View style={{ marginTop: 14 }}>
            <EmptyState
              message={`No ${workspaceLabel.toLowerCase()} members were found.`}
            />
          </View>
        ) : (
          <View
            style={{
              marginTop: 14,
              gap: 12,
            }}
          >
            {members.map((member) => {
              const memberIsOwner =
                member.role === "owner";

              const isProcessing =
                processingId === member.id;

              return (
                <AppCard key={member.id}>
                  <AppRow>
                    <View style={{ flex: 1 }}>
                      <AppText variant="bold">
                        {getMemberLabel(member)}
                      </AppText>

                      <AppText variant="muted">
                        {getRoleDescription(
                          member.role
                        )}
                      </AppText>
                    </View>

                    <RoleBadge
                      role={member.role}
                    />
                  </AppRow>

                  {isOwner &&
                  !memberIsOwner ? (
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
                            member.role ===
                            "editor"
                              ? "Make Viewer"
                              : "Make Editor"
                          }
                          variant="outline"
                          loading={
                            isProcessing
                          }
                          disabled={
                            processingId !==
                            null
                          }
                          onPress={() =>
                            handleRoleChange(
                              member
                            )
                          }
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <AppButton
                          title="Remove"
                          variant="danger"
                          disabled={
                            processingId !==
                            null
                          }
                          onPress={() =>
                            handleRemoveMember(
                              member
                            )
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

        <View style={{ marginTop: 4 }}>
          <AppText variant="muted">
            Invitations remain here until accepted,
            declined, or canceled.
          </AppText>
        </View>

        {pendingInvites.length === 0 ? (
          <View style={{ marginTop: 14 }}>
            <EmptyState
              message={`There are no pending ${workspaceLabel.toLowerCase()} invitations.`}
            />
          </View>
        ) : (
          <View
            style={{
              marginTop: 14,
              gap: 12,
            }}
          >
            {pendingInvites.map((invite) => (
              <AppCard key={invite.id}>
                <AppRow>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bold">
                      {invite.invite_email}
                    </AppText>

                    <AppText variant="muted">
                      {formatRole(invite.role)} access
                    </AppText>
                  </View>

                  <AppText variant="bold">
                    Pending
                  </AppText>
                </AppRow>

                {isOwner ? (
                  <View style={{ marginTop: 14 }}>
                    <AppButton
                      title="Cancel Invitation"
                      variant="outline"
                      loading={
                        processingId ===
                        invite.id
                      }
                      disabled={
                        processingId !== null
                      }
                      onPress={() =>
                        handleCancelInvite(
                          invite
                        )
                      }
                    />
                  </View>
                ) : null}
              </AppCard>
            ))}
          </View>
        )}
      </AppCard>

      {!isOwner ? (
        <AppCard>
          <AppText variant="section">
            Your Access
          </AppText>

          <View style={{ marginTop: 10 }}>
            <AppRow>
              <AppText variant="muted">
                Current role
              </AppText>

              <RoleBadge
                role={currentUserRole}
              />
            </AppRow>
          </View>

          <View style={{ marginTop: 10 }}>
            <AppText variant="muted">
              {getRoleDescription(
                currentUserRole
              )}
            </AppText>
          </View>
        </AppCard>
      ) : null}

      <InviteMemberModal
        visible={inviteModalOpen}
        workspaceName={workspaceData.name}
        workspaceId={
          sharedWorkspace?.id ?? ""
        }
        onClose={() =>
          setInviteModalOpen(false)
        }
        onSuccess={async () => {
          setInviteModalOpen(false);
          await loadWorkspace(false);
        }}
      />
    </>
  );
}

function RoleBadge({
  role,
}: {
  role: WorkspaceRole;
}) {
  return (
    <View
      style={{
        paddingVertical: 7,
        paddingHorizontal: 11,
        borderRadius: 999,
        backgroundColor:
          "rgba(255,255,255,0.1)",
      }}
    >
      <AppText variant="bold">
        {formatRole(role)}
      </AppText>
    </View>
  );
}

function formatRole(role: WorkspaceRole) {
  return (
    role.charAt(0).toUpperCase() +
    role.slice(1)
  );
}

function getMemberLabel(
  member: WorkspaceMember
) {
  if (member.email) {
    return member.email;
  }

  if (member.role === "owner") {
    return "Workspace Owner";
  }

  return `Member ${member.user_id.slice(
    0,
    8
  )}`;
}

function getRoleDescription(
  role: WorkspaceRole
) {
  if (role === "owner") {
    return "Can edit the workspace, manage members, and control invitations.";
  }

  if (role === "editor") {
    return "Can view and update budgets, transactions, calendars, and shared content.";
  }

  return "Can view the workspace but cannot make changes.";
}