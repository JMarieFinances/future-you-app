import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppPage from "@/components/ui/AppPage";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import {
  acceptWorkspaceInvite,
  declineWorkspaceInvite,
  getPendingInvites,
  type WorkspaceInvite,
} from "@/lib/sharedWorkspaceStore";
import { supabase } from "@/lib/supabase";
import {
  router,
  useFocusEffect,
} from "expo-router";
import {
  useCallback,
  useState,
} from "react";
import {
  Alert,
  Pressable,
  View,
} from "react-native";

type HouseholdSetupState = {
  workspaceId: string;
  workspaceName: string;
  displayName: string;
  plannedContribution: string;
  savingsContribution: string;
};

function cleanAmount(value: string) {
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
}

export default function InvitationsScreen() {
  const [invites, setInvites] =
    useState<WorkspaceInvite[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [
    processingId,
    setProcessingId,
  ] = useState<string | null>(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    householdSetup,
    setHouseholdSetup,
  ] =
    useState<HouseholdSetupState | null>(
      null
    );

  const [
    savingSetup,
    setSavingSetup,
  ] = useState(false);

  const loadInvites =
    useCallback(async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const pendingInvites =
          await getPendingInvites();

        setInvites(pendingInvites);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load invitations."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useFocusEffect(
    useCallback(() => {
      loadInvites();
    }, [loadInvites])
  );

  const handleAccept = async (
    invite: WorkspaceInvite
  ) => {
    setProcessingId(invite.id);

    try {
      await acceptWorkspaceInvite(invite);

      setInvites((current) =>
        current.filter(
          (item) =>
            item.id !== invite.id
        )
      );

      const workspaceType =
        invite.workspace?.type;

      const workspaceId =
        invite.workspace_id;

      const workspaceName =
        invite.workspace?.name ??
        "Shared Household";

      if (
        workspaceType ===
        "business"
      ) {
        Alert.alert(
          "Invitation accepted",
          `You now have access to ${workspaceName}.`
        );

        router.replace(
          "/businesses"
        );

        return;
      }

      setHouseholdSetup({
        workspaceId,
        workspaceName,
        displayName: "",
        plannedContribution: "",
        savingsContribution: "",
      });
    } catch (error) {
      Alert.alert(
        "Unable to accept",
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleSaveHouseholdSetup =
    async () => {
      if (!householdSetup) {
        return;
      }

      const displayName =
        householdSetup.displayName.trim();

      if (!displayName) {
        Alert.alert(
          "Display name required",
          "Enter the name this household should use for you."
        );

        return;
      }

      setSavingSetup(true);

      try {
        const {
          data: authData,
          error: authError,
        } =
          await supabase.auth.getUser();

        if (authError) {
          throw new Error(
            authError.message
          );
        }

        const userId =
          authData.user?.id;

        if (!userId) {
          throw new Error(
            "Your account could not be found."
          );
        }

        const {
          data: member,
          error: memberError,
        } = await supabase
          .from(
            "workspace_members"
          )
          .select("id")
          .eq(
            "workspace_id",
            householdSetup.workspaceId
          )
          .eq("user_id", userId)
          .maybeSingle();

        if (memberError) {
          throw new Error(
            memberError.message
          );
        }

        if (!member) {
          throw new Error(
            "Your household membership could not be found."
          );
        }

        const {
          error: updateError,
        } = await supabase
          .from(
            "workspace_members"
          )
          .update({
            display_name:
              displayName,
            planned_contribution:
              Number(
                householdSetup.plannedContribution
              ) || 0,
            contributed_amount: 0,
            savings_contribution:
              Number(
                householdSetup.savingsContribution
              ) || 0,
            has_completed_setup:
              true,
            status: "active",
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", member.id);

        if (updateError) {
          throw new Error(
            updateError.message
          );
        }

        setHouseholdSetup(null);

        Alert.alert(
          "Household ready",
          `Your setup for ${householdSetup.workspaceName} is complete.`
        );

        router.replace(
          "/households"
        );
      } catch (error) {
        Alert.alert(
          "Unable to finish setup",
          error instanceof Error
            ? error.message
            : "Something went wrong."
        );
      } finally {
        setSavingSetup(false);
      }
    };

  const handleDecline = (
    invite: WorkspaceInvite
  ) => {
    Alert.alert(
      "Decline invitation?",
      `You will not be added to ${
        invite.workspace?.name ??
        "this workspace"
      }.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            setProcessingId(
              invite.id
            );

            try {
              await declineWorkspaceInvite(
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
            } catch (error) {
              Alert.alert(
                "Unable to decline",
                error instanceof Error
                  ? error.message
                  : "Something went wrong."
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

  if (householdSetup) {
    return (
      <AppPage>
        <AppButton
          title="Back to Invitations"
          variant="outline"
          onPress={() =>
            setHouseholdSetup(null)
          }
        />

        <PageHeader
          title="Finish Household Setup"
          subtitle={`Choose how you will appear and contribute in ${householdSetup.workspaceName}.`}
        />

        <AppCard glass>
          <View style={{ gap: 6 }}>
            <AppText variant="section">
              Your Household Profile
            </AppText>

            <AppText variant="muted">
              These details only apply
              inside this household.
            </AppText>
          </View>
        </AppCard>

        <AppCard>
          <View style={{ gap: 16 }}>
            <View>
              <AppText variant="bold">
                Household display name
              </AppText>

              <View
                style={{ marginTop: 8 }}
              >
                <AppInput
                  placeholder="Example: Mom, Lily, Jay"
                  value={
                    householdSetup.displayName
                  }
                  onChangeText={(
                    displayName
                  ) =>
                    setHouseholdSetup(
                      {
                        ...householdSetup,
                        displayName,
                      }
                    )
                  }
                />
              </View>

              <View
                style={{ marginTop: 6 }}
              >
                <AppText variant="muted">
                  This can be different
                  from your account name.
                </AppText>
              </View>
            </View>

            <View>
              <AppText variant="bold">
                Planned monthly
                contribution
              </AppText>

              <View
                style={{ marginTop: 8 }}
              >
                <AppInput
                  placeholder="$0"
                  keyboardType="decimal-pad"
                  value={
                    householdSetup.plannedContribution
                  }
                  onChangeText={(
                    value
                  ) =>
                    setHouseholdSetup(
                      {
                        ...householdSetup,
                        plannedContribution:
                          cleanAmount(
                            value
                          ),
                      }
                    )
                  }
                />
              </View>

              <View
                style={{ marginTop: 6 }}
              >
                <AppText variant="muted">
                  The amount you plan to
                  add to the household
                  each month.
                </AppText>
              </View>
            </View>

            <View>
              <AppText variant="bold">
                Planned savings
                contribution
              </AppText>

              <View
                style={{ marginTop: 8 }}
              >
                <AppInput
                  placeholder="$0"
                  keyboardType="decimal-pad"
                  value={
                    householdSetup.savingsContribution
                  }
                  onChangeText={(
                    value
                  ) =>
                    setHouseholdSetup(
                      {
                        ...householdSetup,
                        savingsContribution:
                          cleanAmount(
                            value
                          ),
                      }
                    )
                  }
                />
              </View>

              <View
                style={{ marginTop: 6 }}
              >
                <AppText variant="muted">
                  The portion you plan to
                  put toward shared
                  savings.
                </AppText>
              </View>
            </View>

            <AppButton
              title="Complete Setup"
              loading={savingSetup}
              disabled={savingSetup}
              onPress={
                handleSaveHouseholdSetup
              }
            />
          </View>
        </AppCard>
      </AppPage>
    );
  }

  return (
    <AppPage>
      <AppButton
        title="Back to Profile"
        variant="outline"
        onPress={() =>
          router.replace(
            "/(tabs)/profile"
          )
        }
      />

      <PageHeader
        title="Invitations"
        subtitle="Review invitations to shared household and business budgets."
      />

      <AppCard glass>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="muted">
              Pending Invitations
            </AppText>

            <View
              style={{ marginTop: 4 }}
            >
              <AppText variant="title">
                {invites.length}
              </AppText>
            </View>

            <AppText variant="muted">
              Invitations sent to your
              signed-in email address.
            </AppText>
          </View>

          <AppButton
            title="Refresh"
            variant="outline"
            onPress={loadInvites}
            loading={loading}
          />
        </AppRow>
      </AppCard>

      {errorMessage ? (
        <AppCard>
          <AppText variant="section">
            Invitations could not be
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
              onPress={loadInvites}
            />
          </View>
        </AppCard>
      ) : null}

      {!errorMessage &&
      loading ? (
        <AppCard>
          <AppText variant="muted">
            Loading your
            invitations...
          </AppText>
        </AppCard>
      ) : null}

      {!loading &&
      !errorMessage &&
      invites.length === 0 ? (
        <AppCard>
          <EmptyState message="You do not have any pending workspace invitations." />
        </AppCard>
      ) : null}

      {!loading &&
      invites.length > 0 ? (
        <View style={{ gap: 12 }}>
          {invites.map(
            (invite) => {
              const workspaceName =
                invite.workspace
                  ?.name ??
                "Shared Workspace";

              const workspaceType =
                invite.workspace
                  ?.type ===
                "business"
                  ? "Business"
                  : "Household";

              const roleLabel =
                invite.role
                  .charAt(0)
                  .toUpperCase() +
                invite.role.slice(1);

              const isProcessing =
                processingId ===
                invite.id;

              return (
                <AppCard
                  key={invite.id}
                >
                  <AppRow>
                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <AppText variant="section">
                        {
                          workspaceName
                        }
                      </AppText>

                      <AppText variant="muted">
                        {workspaceType}{" "}
                        workspace
                      </AppText>
                    </View>

                    <AppText variant="bold">
                      {roleLabel}
                    </AppText>
                  </AppRow>

                  {invite.workspace
                    ?.description ? (
                    <View
                      style={{
                        marginTop: 12,
                      }}
                    >
                      <AppText variant="muted">
                        {
                          invite
                            .workspace
                            .description
                        }
                      </AppText>
                    </View>
                  ) : null}

                  <View
                    style={{
                      marginTop: 14,
                      gap: 10,
                    }}
                  >
                    <AppRow>
                      <AppText variant="muted">
                        Invited email
                      </AppText>

                      <View
                        style={{
                          flex: 1,
                          alignItems:
                            "flex-end",
                          marginLeft: 12,
                        }}
                      >
                        <AppText variant="bold">
                          {
                            invite.invite_email
                          }
                        </AppText>
                      </View>
                    </AppRow>

                    <AppRow>
                      <AppText variant="muted">
                        Access level
                      </AppText>

                      <AppText variant="bold">
                        {roleLabel}
                      </AppText>
                    </AppRow>

                    <AppRow>
                      <AppText variant="muted">
                        Sent
                      </AppText>

                      <AppText variant="bold">
                        {new Date(
                          invite.created_at
                        ).toLocaleDateString()}
                      </AppText>
                    </AppRow>
                  </View>

                  <View
                    style={{
                      marginTop: 16,
                      gap: 10,
                    }}
                  >
                    <AppButton
                      title="Accept Invitation"
                      loading={
                        isProcessing
                      }
                      disabled={
                        processingId !==
                        null
                      }
                      onPress={() =>
                        handleAccept(
                          invite
                        )
                      }
                    />

                    <AppButton
                      title="Decline"
                      variant="outline"
                      disabled={
                        processingId !==
                        null
                      }
                      onPress={() =>
                        handleDecline(
                          invite
                        )
                      }
                    />
                  </View>
                </AppCard>
              );
            }
          )}
        </View>
      ) : null}

      <Pressable
        onPress={() =>
          router.replace(
            "/(tabs)/profile"
          )
        }
        style={({ pressed }) => ({
          alignItems: "center",
          paddingVertical: 10,
          opacity: pressed
            ? 0.65
            : 1,
        })}
      >
        <AppText variant="muted">
          Return to Profile
        </AppText>
      </Pressable>
    </AppPage>
  );
}