import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppPage from "@/components/ui/AppPage";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import {
    acceptWorkspaceInvite,
    declineWorkspaceInvite,
    getPendingInvites,
    WorkspaceInvite,
} from "@/lib/sharedWorkspaceStore";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, View } from "react-native";

export default function InvitationsScreen() {
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loadInvites = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const pendingInvites = await getPendingInvites();
      setInvites(pendingInvites);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load invitations.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInvites();
    }, [loadInvites])
  );

  const handleAccept = async (invite: WorkspaceInvite) => {
    setProcessingId(invite.id);

    try {
      await acceptWorkspaceInvite(invite);

      setInvites((current) =>
        current.filter((item) => item.id !== invite.id)
      );

      Alert.alert(
        "Invitation accepted",
        `You now have access to ${
          invite.workspace?.name ?? "the shared workspace"
        }.`
      );

      if (invite.workspace?.type === "business") {
  router.replace("/businesses");
} else {
  router.replace("/households");
}

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

  const handleDecline = (invite: WorkspaceInvite) => {
    Alert.alert(
      "Decline invitation?",
      `You will not be added to ${
        invite.workspace?.name ?? "this workspace"
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
            setProcessingId(invite.id);

            try {
              await declineWorkspaceInvite(invite.id);

              setInvites((current) =>
                current.filter((item) => item.id !== invite.id)
              );
            } catch (error) {
              Alert.alert(
                "Unable to decline",
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

  const openAcceptedWorkspace = (invite: WorkspaceInvite) => {
    if (invite.workspace?.type === "business") {
      router.replace("/businesses");
      return;
    }

    router.replace("/households");
  };

  return (
    <AppPage>
      <AppButton
        title="Back to Profile"
        variant="outline"
        onPress={() => router.replace("/(tabs)/profile")}
      />

      <PageHeader
        title="Invitations"
        subtitle="Review invitations to shared household and business budgets."
      />

      <AppCard glass>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="muted">Pending Invitations</AppText>

            <View style={{ marginTop: 4 }}>
              <AppText variant="title">{invites.length}</AppText>
            </View>

            <AppText variant="muted">
              Invitations sent to your signed-in email address.
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
            Invitations could not be loaded
          </AppText>

          <View style={{ marginTop: 6 }}>
            <AppText variant="muted">{errorMessage}</AppText>
          </View>

          <View style={{ marginTop: 14 }}>
            <AppButton title="Try Again" onPress={loadInvites} />
          </View>
        </AppCard>
      ) : null}

      {!errorMessage && loading ? (
        <AppCard>
          <AppText variant="muted">
            Loading your invitations...
          </AppText>
        </AppCard>
      ) : null}

      {!loading && !errorMessage && invites.length === 0 ? (
        <AppCard>
          <EmptyState message="You do not have any pending workspace invitations." />
        </AppCard>
      ) : null}

      {!loading && invites.length > 0 ? (
        <View style={{ gap: 12 }}>
          {invites.map((invite) => {
            const workspaceName =
              invite.workspace?.name ?? "Shared Workspace";

            const workspaceType =
              invite.workspace?.type === "business"
                ? "Business"
                : "Household";

            const roleLabel =
              invite.role.charAt(0).toUpperCase() +
              invite.role.slice(1);

            const isProcessing = processingId === invite.id;

            return (
              <AppCard key={invite.id}>
                <AppRow>
                  <View style={{ flex: 1 }}>
                    <AppText variant="section">
                      {workspaceName}
                    </AppText>

                    <AppText variant="muted">
                      {workspaceType} workspace
                    </AppText>
                  </View>

                  <AppText variant="bold">{roleLabel}</AppText>
                </AppRow>

                {invite.workspace?.description ? (
                  <View style={{ marginTop: 12 }}>
                    <AppText variant="muted">
                      {invite.workspace.description}
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
                    <AppText variant="muted">Invited email</AppText>

                    <View
                      style={{
                        flex: 1,
                        alignItems: "flex-end",
                        marginLeft: 12,
                      }}
                    >
                      <AppText variant="bold">
                        {invite.invite_email}
                      </AppText>
                    </View>
                  </AppRow>

                  <AppRow>
                    <AppText variant="muted">Access level</AppText>
                    <AppText variant="bold">{roleLabel}</AppText>
                  </AppRow>

                  <AppRow>
                    <AppText variant="muted">Sent</AppText>

                    <AppText variant="bold">
                      {new Date(invite.created_at).toLocaleDateString()}
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
                    loading={isProcessing}
                    disabled={processingId !== null}
                   onPress={() => handleAccept(invite)}
                  />

                  <AppButton
                    title="Decline"
                    variant="outline"
                    disabled={processingId !== null}
                    onPress={() => handleDecline(invite)}
                  />
                </View>
              </AppCard>
            );
          })}
        </View>
      ) : null}

      <Pressable
        onPress={() => router.replace("/(tabs)/profile")}
        style={({ pressed }) => ({
          alignItems: "center",
          paddingVertical: 10,
          opacity: pressed ? 0.65 : 1,
        })}
      >
        <AppText variant="muted">Return to Profile</AppText>
      </Pressable>
    </AppPage>
  );
}