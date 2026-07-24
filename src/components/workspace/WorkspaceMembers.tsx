import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import EmptyState from "@/components/ui/EmptyState";
import InviteMemberModal from "@/components/workspace/InviteMemberModal";
import WorkspaceDangerZone from "@/components/workspace/WorkspaceDangerZone";
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
import { supabase } from "@/lib/supabase";
import type {
  Business,
  Household,
} from "@/lib/types";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  useWindowDimensions,
  View
} from "react-native";

type Props = {
  workspaceType: WorkspaceType;
  workspace: Household | Business;
};

type ExtendedWorkspaceMember =
  WorkspaceMember & {
    display_name?: string | null;
    planned_contribution?: number | null;
    contributed_amount?: number | null;
    savings_contribution?: number | null;
    status?: string | null;
    has_completed_setup?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
  };

type MemberEditorState = {
  memberId: string;
  displayName: string;
  plannedContribution: string;
  contributedAmount: string;
  savingsContribution: string;
};

type ContributionEditorState = {
  memberId: string;
  amount: string;
};

const cleanAmount = (value: string) => {
  const cleaned = value.replace(
    /[^0-9.]/g,
    ""
  );

  const parts = cleaned.split(".");

  if (parts.length <= 1) {
    return cleaned;
  }

  return `${parts[0]}.${parts
    .slice(1)
    .join("")}`;
};

const formatMoney = (amount: number) =>
  `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (
  value?: string | null
) => {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Unknown";
  }

  return date.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
};

export default function WorkspaceMembers({
  workspaceType,
  workspace: workspaceData,
}: Props) {
  const { width } =
    useWindowDimensions();

  const isMobile = width < 700;

  const [
    sharedWorkspace,
    setSharedWorkspace,
  ] =
    useState<SharedWorkspace | null>(
      null
    );

  const [members, setMembers] =
    useState<
      ExtendedWorkspaceMember[]
    >([]);

  const [invites, setInvites] =
    useState<WorkspaceInvite[]>([]);

  const [
    currentUserId,
    setCurrentUserId,
  ] = useState("");

  const [
    inviteModalOpen,
    setInviteModalOpen,
  ] = useState(false);

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    processingId,
    setProcessingId,
  ] = useState<string | null>(
    null
  );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    memberEditor,
    setMemberEditor,
  ] =
    useState<MemberEditorState | null>(
      null
    );

  const [
    contributionEditor,
    setContributionEditor,
  ] =
    useState<ContributionEditorState | null>(
      null
    );

  const workspaceLabel =
    workspaceType === "business"
      ? "Business"
      : "Household";

  const isHousehold =
    workspaceType === "household";

  const loadWorkspace =
    useCallback(
      async (
        showLoading = false
      ) => {
        if (showLoading) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setErrorMessage("");

        try {
          const [
            loadedWorkspace,
            authResult,
          ] = await Promise.all([
            getOrCreateSharedWorkspace(
              workspaceType,
              workspaceData
            ),
            supabase.auth.getUser(),
          ]);

          if (
            authResult.error
          ) {
            throw new Error(
              authResult.error.message
            );
          }

          const [
            loadedMembers,
            loadedInvites,
          ] = await Promise.all([
            getWorkspaceMembers(
              loadedWorkspace.id
            ),
            getWorkspaceInvites(
              loadedWorkspace.id
            ),
          ]);

          setCurrentUserId(
            authResult.data.user?.id ??
              ""
          );

          setSharedWorkspace(
            loadedWorkspace
          );

          setMembers(
            loadedMembers as ExtendedWorkspaceMember[]
          );

          setInvites(
            loadedInvites
          );
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : `Unable to load ${workspaceLabel.toLowerCase()} members.`
          );
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
    if (
      !sharedWorkspace?.id
    ) {
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

  const pendingInvites =
    useMemo(
      () =>
        invites.filter(
          (invite) =>
            invite.status ===
            "pending"
        ),
      [invites]
    );

  const activeMembers =
    useMemo(
      () =>
        members.filter(
          (member) =>
            member.status !==
              "left" &&
            member.status !==
              "removed"
        ),
      [members]
    );

  const plannedContributionTotal =
    useMemo(
      () =>
        activeMembers.reduce(
          (total, member) =>
            total +
            Number(
              member.planned_contribution ??
                0
            ),
          0
        ),
      [activeMembers]
    );

  const contributedTotal =
    useMemo(
      () =>
        activeMembers.reduce(
          (total, member) =>
            total +
            Number(
              member.contributed_amount ??
                0
            ),
          0
        ),
      [activeMembers]
    );

  const savingsContributionTotal =
    useMemo(
      () =>
        activeMembers.reduce(
          (total, member) =>
            total +
            Number(
              member.savings_contribution ??
                0
            ),
          0
        ),
      [activeMembers]
    );

  const handleCancelInvite =
    async (
      invite: WorkspaceInvite
    ) => {
      const message = `${invite.invite_email} will no longer be able to accept this invitation.`;

      const confirmed =
        await confirmAction(
          "Cancel invitation?",
          message,
          "Cancel Invitation"
        );

      if (!confirmed) {
        return;
      }

      setProcessingId(
        invite.id
      );

      try {
        await cancelWorkspaceInvite(
          invite.id
        );

        setInvites(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                invite.id
            )
        );

        await loadWorkspace(false);
      } catch (error) {
        showError(
          "Unable to cancel invitation",
          error
        );
      } finally {
        setProcessingId(null);
      }
    };

  const handleRoleChange = (
    member: ExtendedWorkspaceMember
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
            setProcessingId(
              member.id
            );

            try {
              await updateWorkspaceMemberRole(
                member.id,
                nextRole
              );

              await loadWorkspace(
                false
              );
            } catch (error) {
              showError(
                "Unable to change role",
                error
              );
            } finally {
              setProcessingId(
                null
              );
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember =
    async (
      member: ExtendedWorkspaceMember
    ) => {
      const memberLabel =
        getMemberLabel(member);

      const confirmed =
        await confirmAction(
          "Remove member?",
          `${memberLabel} will lose access to this ${workspaceLabel.toLowerCase()}.`,
          "Remove"
        );

      if (!confirmed) {
        return;
      }

      setProcessingId(
        member.id
      );

      try {
        await removeWorkspaceMember(
          member.id
        );

        setMembers(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                member.id
            )
        );

        await loadWorkspace(false);
      } catch (error) {
        showError(
          "Unable to remove member",
          error
        );
      } finally {
        setProcessingId(null);
      }
    };

  const beginEditingMember = (
    member: ExtendedWorkspaceMember
  ) => {
    setContributionEditor(null);

    setMemberEditor({
      memberId: member.id,
      displayName:
        member.display_name ??
        "",
      plannedContribution: String(
        member.planned_contribution ??
          ""
      ),
      contributedAmount: String(
        member.contributed_amount ??
          ""
      ),
      savingsContribution: String(
        member.savings_contribution ??
          ""
      ),
    });
  };

  const saveMemberDetails =
    async () => {
      if (!memberEditor) {
        return;
      }

      const displayName =
        memberEditor.displayName.trim();

      if (!displayName) {
        Alert.alert(
          "Display name required",
          "Enter the name this household should use for the member."
        );

        return;
      }

      setProcessingId(
        memberEditor.memberId
      );

      try {
        const {
          error,
        } = await supabase
          .from(
            "workspace_members"
          )
          .update({
            display_name:
              displayName,
            planned_contribution:
              Number(
                memberEditor.plannedContribution
              ) || 0,
            contributed_amount:
              Number(
                memberEditor.contributedAmount
              ) || 0,
            savings_contribution:
              Number(
                memberEditor.savingsContribution
              ) || 0,
            has_completed_setup:
              true,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            memberEditor.memberId
          );

        if (error) {
          throw new Error(
            error.message
          );
        }

        setMemberEditor(null);

        await loadWorkspace(false);
      } catch (error) {
        showError(
          "Unable to update member",
          error
        );
      } finally {
        setProcessingId(null);
      }
    };

  const beginLoggingContribution =
    (
      member: ExtendedWorkspaceMember
    ) => {
      setMemberEditor(null);

      setContributionEditor({
        memberId: member.id,
        amount: "",
      });
    };

  const saveContribution =
    async () => {
      if (!contributionEditor) {
        return;
      }

      const amount =
        Number(
          contributionEditor.amount
        ) || 0;

      if (amount <= 0) {
        Alert.alert(
          "Contribution required",
          "Enter an amount greater than zero."
        );

        return;
      }

      const member =
        members.find(
          (item) =>
            item.id ===
            contributionEditor.memberId
        );

      if (!member) {
        return;
      }

      const nextTotal =
        Number(
          member.contributed_amount ??
            0
        ) + amount;

      setProcessingId(
        member.id
      );

      try {
        const {
          error,
        } = await supabase
          .from(
            "workspace_members"
          )
          .update({
            contributed_amount:
              nextTotal,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", member.id);

        if (error) {
          throw new Error(
            error.message
          );
        }

        setContributionEditor(
          null
        );

        await loadWorkspace(false);
      } catch (error) {
        showError(
          "Unable to log contribution",
          error
        );
      } finally {
        setProcessingId(null);
      }
    };

  const canEditMember = (
    member: ExtendedWorkspaceMember
  ) =>
    isOwner ||
    member.user_id ===
      currentUserId;

  const canLogContribution = (
    member: ExtendedWorkspaceMember
  ) =>
    isHousehold &&
    (isOwner ||
      member.user_id ===
        currentUserId);

  if (loading) {
    return (
      <AppCard>
        <AppText variant="muted">
          Loading{" "}
          {workspaceLabel.toLowerCase()}{" "}
          members...
        </AppText>
      </AppCard>
    );
  }

  if (errorMessage) {
    return (
      <AppCard>
        <AppText variant="section">
          Members could not be
          loaded
        </AppText>

        <View
          style={{ marginTop: 6 }}
        >
          <AppText variant="muted">
            {errorMessage}
          </AppText>
        </View>

        <View
          style={{ marginTop: 14 }}
        >
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
        <View
          style={{
            flexDirection: isMobile
              ? "column"
              : "row",
            alignItems: isMobile
              ? "stretch"
              : "center",
            gap: 14,
          }}
        >
          <View style={{ flex: 1 }}>
            <AppText variant="section">
              {workspaceLabel} Members
            </AppText>

            <AppText variant="muted">
              {activeMembers.length}{" "}
              member
              {activeMembers.length ===
              1
                ? ""
                : "s"}{" "}
              with access
            </AppText>
          </View>

          {isOwner ? (
            <AppButton
              title="Invite Member"
              onPress={() =>
                setInviteModalOpen(
                  true
                )
              }
            />
          ) : null}
        </View>
      </AppCard>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <View
          style={{
            flexGrow: 1,
            flexBasis: 140,
          }}
        >
          <AppCard>
            <AppText variant="muted">
              Members
            </AppText>

            <View
              style={{ marginTop: 4 }}
            >
              <AppText variant="section">
                {activeMembers.length}
              </AppText>
            </View>
          </AppCard>
        </View>

        <View
          style={{
            flexGrow: 1,
            flexBasis: 140,
          }}
        >
          <AppCard>
            <AppText variant="muted">
              Pending
            </AppText>

            <View
              style={{ marginTop: 4 }}
            >
              <AppText variant="section">
                {
                  pendingInvites.length
                }
              </AppText>
            </View>
          </AppCard>
        </View>

        {isHousehold ? (
          <>
            <View
              style={{
                flexGrow: 1,
                flexBasis: 140,
              }}
            >
              <AppCard>
                <AppText variant="muted">
                  Planned
                </AppText>

                <View
                  style={{
                    marginTop: 4,
                  }}
                >
                  <AppText variant="section">
                    {formatMoney(
                      plannedContributionTotal
                    )}
                  </AppText>
                </View>
              </AppCard>
            </View>

            <View
              style={{
                flexGrow: 1,
                flexBasis: 140,
              }}
            >
              <AppCard>
                <AppText variant="muted">
                  Contributed
                </AppText>

                <View
                  style={{
                    marginTop: 4,
                  }}
                >
                  <AppText variant="section">
                    {formatMoney(
                      contributedTotal
                    )}
                  </AppText>
                </View>
              </AppCard>
            </View>
          </>
        ) : null}
      </View>

      {isHousehold ? (
        <AppCard>
          <View style={{ gap: 12 }}>
            <AppText variant="section">
              Contribution Summary
            </AppText>

            <AppRow>
              <AppText variant="muted">
                Planned monthly
              </AppText>

              <AppText variant="bold">
                {formatMoney(
                  plannedContributionTotal
                )}
              </AppText>
            </AppRow>

            <AppRow>
              <AppText variant="muted">
                Contributed
              </AppText>

              <AppText variant="bold">
                {formatMoney(
                  contributedTotal
                )}
              </AppText>
            </AppRow>

            <AppRow>
              <AppText variant="muted">
                Remaining
              </AppText>

              <AppText variant="bold">
                {formatMoney(
                  Math.max(
                    plannedContributionTotal -
                      contributedTotal,
                    0
                  )
                )}
              </AppText>
            </AppRow>

            <AppRow>
              <AppText variant="muted">
                Savings contributions
              </AppText>

              <AppText variant="bold">
                {formatMoney(
                  savingsContributionTotal
                )}
              </AppText>
            </AppRow>
          </View>
        </AppCard>
      ) : null}

      <AppCard>
        <View
          style={{
            flexDirection: isMobile
              ? "column"
              : "row",
            alignItems: isMobile
              ? "stretch"
              : "center",
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <AppText variant="section">
              Current Members
            </AppText>

            <AppText variant="muted">
              Display names, roles,
              access, and contribution
              details.
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
        </View>

        {activeMembers.length ===
        0 ? (
          <View
            style={{ marginTop: 14 }}
          >
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
            {activeMembers.map(
              (member) => {
                const memberIsOwner =
                  member.role ===
                  "owner";

                const isCurrentUser =
                  member.user_id ===
                  currentUserId;

                const isProcessing =
                  processingId ===
                  member.id;

                const editorOpen =
                  memberEditor?.memberId ===
                  member.id;

                const contributionOpen =
                  contributionEditor?.memberId ===
                  member.id;

                const planned =
                  Number(
                    member.planned_contribution ??
                      0
                  );

                const contributed =
                  Number(
                    member.contributed_amount ??
                      0
                  );

                const remaining =
                  Math.max(
                    planned -
                      contributed,
                    0
                  );

                return (
                  <AppCard
                    key={member.id}
                  >
                    <View
                      style={{
                        gap: 14,
                      }}
                    >
                      <AppRow>
                        <View
                          style={{
                            flex: 1,
                          }}
                        >
                          <AppText variant="bold">
                            {getMemberLabel(
                              member
                            )}
                            {isCurrentUser
                              ? " · You"
                              : ""}
                          </AppText>

                          <AppText variant="muted">
                            {getRoleDescription(
                              member.role
                            )}
                          </AppText>
                        </View>

                        <RoleBadge
                          role={
                            member.role
                          }
                        />
                      </AppRow>

                      <AppRow>
                        <AppText variant="muted">
                          Joined
                        </AppText>

                        <AppText variant="bold">
                          {formatDate(
                            member.created_at
                          )}
                        </AppText>
                      </AppRow>

                      <AppRow>
                        <AppText variant="muted">
                          Setup
                        </AppText>

                        <StatusBadge
                          complete={
                            member.has_completed_setup ??
                            Boolean(
                              member.display_name
                            )
                          }
                        />
                      </AppRow>

                      {isHousehold ? (
                        <>
                          <View
                            style={{
                              height: 1,
                              backgroundColor:
                                "rgba(255,255,255,0.08)",
                            }}
                          />

                          <AppRow>
                            <AppText variant="muted">
                              Planned
                            </AppText>

                            <AppText variant="bold">
                              {formatMoney(
                                planned
                              )}
                            </AppText>
                          </AppRow>

                          <AppRow>
                            <AppText variant="muted">
                              Contributed
                            </AppText>

                            <AppText variant="bold">
                              {formatMoney(
                                contributed
                              )}
                            </AppText>
                          </AppRow>

                          <AppRow>
                            <AppText variant="muted">
                              Remaining
                            </AppText>

                            <AppText variant="bold">
                              {formatMoney(
                                remaining
                              )}
                            </AppText>
                          </AppRow>

                          <AppRow>
                            <AppText variant="muted">
                              Savings
                            </AppText>

                            <AppText variant="bold">
                              {formatMoney(
                                Number(
                                  member.savings_contribution ??
                                    0
                                )
                              )}
                            </AppText>
                          </AppRow>
                        </>
                      ) : null}

                      {editorOpen &&
                      memberEditor ? (
                        <View
                          style={{
                            gap: 12,
                          }}
                        >
                          <AppText variant="section">
                            Edit Member
                          </AppText>

                          <View>
                            <AppText variant="bold">
                              Household display
                              name
                            </AppText>

                            <View
                              style={{
                                marginTop: 8,
                              }}
                            >
                              <AppInput
                                placeholder="Display name"
                                value={
                                  memberEditor.displayName
                                }
                                onChangeText={(
                                  displayName
                                ) =>
                                  setMemberEditor(
                                    {
                                      ...memberEditor,
                                      displayName,
                                    }
                                  )
                                }
                              />
                            </View>
                          </View>

                          {isHousehold ? (
                            <>
                              <View>
                                <AppText variant="bold">
                                  Planned
                                  contribution
                                </AppText>

                                <View
                                  style={{
                                    marginTop: 8,
                                  }}
                                >
                                  <AppInput
                                    placeholder="$0"
                                    keyboardType="decimal-pad"
                                    value={
                                      memberEditor.plannedContribution
                                    }
                                    onChangeText={(
                                      value
                                    ) =>
                                      setMemberEditor(
                                        {
                                          ...memberEditor,
                                          plannedContribution:
                                            cleanAmount(
                                              value
                                            ),
                                        }
                                      )
                                    }
                                  />
                                </View>
                              </View>

                              {isOwner ? (
                                <View>
                                  <AppText variant="bold">
                                    Total
                                    contributed
                                  </AppText>

                                  <View
                                    style={{
                                      marginTop: 8,
                                    }}
                                  >
                                    <AppInput
                                      placeholder="$0"
                                      keyboardType="decimal-pad"
                                      value={
                                        memberEditor.contributedAmount
                                      }
                                      onChangeText={(
                                        value
                                      ) =>
                                        setMemberEditor(
                                          {
                                            ...memberEditor,
                                            contributedAmount:
                                              cleanAmount(
                                                value
                                              ),
                                          }
                                        )
                                      }
                                    />
                                  </View>
                                </View>
                              ) : null}

                              <View>
                                <AppText variant="bold">
                                  Savings
                                  contribution
                                </AppText>

                                <View
                                  style={{
                                    marginTop: 8,
                                  }}
                                >
                                  <AppInput
                                    placeholder="$0"
                                    keyboardType="decimal-pad"
                                    value={
                                      memberEditor.savingsContribution
                                    }
                                    onChangeText={(
                                      value
                                    ) =>
                                      setMemberEditor(
                                        {
                                          ...memberEditor,
                                          savingsContribution:
                                            cleanAmount(
                                              value
                                            ),
                                        }
                                      )
                                    }
                                  />
                                </View>
                              </View>
                            </>
                          ) : null}

                          <View
                            style={{
                              flexDirection:
                                isMobile
                                  ? "column"
                                  : "row",
                              gap: 10,
                            }}
                          >
                            <View
                              style={{
                                flex: 1,
                              }}
                            >
                              <AppButton
                                title="Save Changes"
                                loading={
                                  isProcessing
                                }
                                disabled={
                                  processingId !==
                                  null
                                }
                                onPress={
                                  saveMemberDetails
                                }
                              />
                            </View>

                            <View
                              style={{
                                flex: 1,
                              }}
                            >
                              <AppButton
                                title="Cancel"
                                variant="outline"
                                disabled={
                                  isProcessing
                                }
                                onPress={() =>
                                  setMemberEditor(
                                    null
                                  )
                                }
                              />
                            </View>
                          </View>
                        </View>
                      ) : null}

                      {contributionOpen &&
                      contributionEditor ? (
                        <View
                          style={{
                            gap: 12,
                          }}
                        >
                          <AppText variant="section">
                            Log Contribution
                          </AppText>

                          <AppText variant="muted">
                            Add a new payment
                            to this member’s
                            contributed total.
                          </AppText>

                          <AppInput
                            placeholder="$0"
                            keyboardType="decimal-pad"
                            value={
                              contributionEditor.amount
                            }
                            onChangeText={(
                              amount
                            ) =>
                              setContributionEditor(
                                {
                                  ...contributionEditor,
                                  amount:
                                    cleanAmount(
                                      amount
                                    ),
                                }
                              )
                            }
                          />

                          <View
                            style={{
                              flexDirection:
                                isMobile
                                  ? "column"
                                  : "row",
                              gap: 10,
                            }}
                          >
                            <View
                              style={{
                                flex: 1,
                              }}
                            >
                              <AppButton
                                title="Add Contribution"
                                loading={
                                  isProcessing
                                }
                                disabled={
                                  processingId !==
                                  null
                                }
                                onPress={
                                  saveContribution
                                }
                              />
                            </View>

                            <View
                              style={{
                                flex: 1,
                              }}
                            >
                              <AppButton
                                title="Cancel"
                                variant="outline"
                                disabled={
                                  isProcessing
                                }
                                onPress={() =>
                                  setContributionEditor(
                                    null
                                  )
                                }
                              />
                            </View>
                          </View>
                        </View>
                      ) : null}

                      {!editorOpen &&
                      !contributionOpen ? (
                        <View
                          style={{
                            flexDirection:
                              isMobile
                                ? "column"
                                : "row",
                            flexWrap: "wrap",
                            gap: 10,
                          }}
                        >
                          {canEditMember(
                            member
                          ) ? (
                            <View
                              style={{
                                flexGrow: 1,
                                flexBasis: 140,
                              }}
                            >
                              <AppButton
                                title="Edit Member"
                                variant="outline"
                                disabled={
                                  processingId !==
                                  null
                                }
                                onPress={() =>
                                  beginEditingMember(
                                    member
                                  )
                                }
                              />
                            </View>
                          ) : null}

                          {canLogContribution(
                            member
                          ) ? (
                            <View
                              style={{
                                flexGrow: 1,
                                flexBasis: 140,
                              }}
                            >
                              <AppButton
                                title="Log Contribution"
                                variant="outline"
                                disabled={
                                  processingId !==
                                  null
                                }
                                onPress={() =>
                                  beginLoggingContribution(
                                    member
                                  )
                                }
                              />
                            </View>
                          ) : null}

                          {isOwner &&
                          !memberIsOwner ? (
                            <>
                              <View
                                style={{
                                  flexGrow: 1,
                                  flexBasis: 140,
                                }}
                              >
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

                              <View
                                style={{
                                  flexGrow: 1,
                                  flexBasis: 140,
                                }}
                              >
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
                            </>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  </AppCard>
                );
              }
            )}
          </View>
        )}
      </AppCard>

      <AppCard>
        <AppText variant="section">
          Pending Invitations
        </AppText>

        <View
          style={{ marginTop: 4 }}
        >
          <AppText variant="muted">
            Invitations remain here
            until accepted, declined,
            or canceled.
          </AppText>
        </View>

        {pendingInvites.length ===
        0 ? (
          <View
            style={{ marginTop: 14 }}
          >
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
            {pendingInvites.map(
              (invite) => (
                <AppCard
                  key={invite.id}
                >
                  <AppRow>
                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <AppText variant="bold">
                        {
                          invite.invite_email
                        }
                      </AppText>

                      <AppText variant="muted">
                        {formatRole(
                          invite.role
                        )}{" "}
                        access
                      </AppText>
                    </View>

                    <StatusBadge
                      label="Pending"
                    />
                  </AppRow>

                  {isOwner ? (
                    <View
                      style={{
                        marginTop: 14,
                      }}
                    >
                      <AppButton
                        title="Cancel Invitation"
                        variant="outline"
                        loading={
                          processingId ===
                          invite.id
                        }
                        disabled={
                          processingId !==
                          null
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
              )
            )}
          </View>
        )}
      </AppCard>

      {!isOwner ? (
        <AppCard>
          <AppText variant="section">
            Your Access
          </AppText>

          <View
            style={{ marginTop: 10 }}
          >
            <AppRow>
              <AppText variant="muted">
                Current role
              </AppText>

              <RoleBadge
                role={currentUserRole}
              />
            </AppRow>
          </View>

          <View
            style={{ marginTop: 10 }}
          >
            <AppText variant="muted">
              {getRoleDescription(
                currentUserRole
              )}
            </AppText>
          </View>
        </AppCard>
      ) : null}

      {sharedWorkspace ? (
  <WorkspaceDangerZone
    workspaceType={workspaceType}
    sharedWorkspace={sharedWorkspace}
    isOwner={isOwner}
    onWorkspaceExit={() => {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }}
  />
) : null}

      <InviteMemberModal
        visible={inviteModalOpen}
        workspaceName={
          workspaceData.name
        }
        workspaceId={
          sharedWorkspace?.id ?? ""
        }
        onClose={() =>
          setInviteModalOpen(false)
        }
        onSuccess={async () => {
          setInviteModalOpen(false);

          await loadWorkspace(
            false
          );
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

function StatusBadge({
  complete,
  label,
}: {
  complete?: boolean;
  label?: string;
}) {
  const text =
    label ??
    (complete
      ? "Setup Complete"
      : "Setup Needed");

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
        {text}
      </AppText>
    </View>
  );
}

function formatRole(
  role: WorkspaceRole
) {
  return (
    role.charAt(0).toUpperCase() +
    role.slice(1)
  );
}

function getMemberLabel(
  member: ExtendedWorkspaceMember
) {
  if (
    member.display_name?.trim()
  ) {
    return member.display_name.trim();
  }

  if (member.email) {
    return member.email;
  }

  if (
    member.role === "owner"
  ) {
    return "Household Owner";
  }

  return "Household Member";
}

function getRoleDescription(
  role: WorkspaceRole
) {
  if (role === "owner") {
    return "Can edit the workspace, manage members, contributions, roles, and invitations.";
  }

  if (role === "editor") {
    return "Can view and update budgets, transactions, calendars, and shared content.";
  }

  return "Can view the workspace but cannot make changes.";
}

async function confirmAction(
  title: string,
  message: string,
  actionLabel: string
) {
  if (
    typeof window !== "undefined"
  ) {
    return window.confirm(
      `${title}\n\n${message}`
    );
  }

  return new Promise<boolean>(
    (resolve) => {
      Alert.alert(
        title,
        message,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () =>
              resolve(false),
          },
          {
            text: actionLabel,
            style: "destructive",
            onPress: () =>
              resolve(true),
          },
        ],
        {
          cancelable: true,
          onDismiss: () =>
            resolve(false),
        }
      );
    }
  );
}

function showError(
  title: string,
  error: unknown
) {
  const message =
    error instanceof Error
      ? error.message
      : "Something went wrong.";

  if (
    typeof window !== "undefined"
  ) {
    window.alert(
      `${title}\n\n${message}`
    );

    return;
  }

  Alert.alert(title, message);
}