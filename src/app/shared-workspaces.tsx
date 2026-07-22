import AppCard from "@/components/ui/AppCard";
import AppPage from "@/components/ui/AppPage";
import AppText from "@/components/ui/AppText";
import PageHeader from "@/components/ui/PageHeader";
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "expo-router";
import {
    useCallback,
    useState,
} from "react";
import {
    Pressable,
    RefreshControl,
    ScrollView,
    View,
} from "react-native";

type WorkspaceType =
  | "household"
  | "business";

type WorkspaceRole =
  | "owner"
  | "editor"
  | "viewer";

type SharedWorkspaceRow = {
  id: string;
  type: WorkspaceType;
  owner_id: string;
  local_workspace_id:
    | string
    | null;
  name: string;
  description:
    | string
    | null;
  workspace_data:
    | Record<string, unknown>
    | null;
  created_at: string;
  updated_at: string;
  current_user_role:
    WorkspaceRole;
};

export default function SharedWorkspacesScreen() {
  const [
    workspaces,
    setWorkspaces,
  ] = useState<
    SharedWorkspaceRow[]
  >([]);

  const [
    currentUser,
    setCurrentUser,
  ] = useState<{
    id: string;
    email: string;
  } | null>(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const loadSharedWorkspaces =
    useCallback(async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: sessionData,
          error: sessionError,
        } =
          await supabase.auth
            .getSession();

        if (sessionError) {
          throw new Error(
            sessionError.message
          );
        }

        const user =
          sessionData.session
            ?.user;

        if (!user) {
          setCurrentUser(null);
          setWorkspaces([]);

          throw new Error(
            "No signed-in account was found."
          );
        }

        setCurrentUser({
          id: user.id,
          email:
            user.email ??
            "No email",
        });

        const {
          data,
          error,
        } = await supabase.rpc(
          "get_my_shared_workspaces",
          {
            requested_type:
              null,
          }
        );

        if (error) {
          throw new Error(
            error.message
          );
        }

        const rows =
          (
            data ?? []
          ) as SharedWorkspaceRow[];

        setWorkspaces(rows);

        console.log(
          "Direct shared workspace results:",
          {
            userId: user.id,
            email: user.email,
            count: rows.length,
            workspaces:
              rows.map(
                (workspace) => ({
                  id:
                    workspace.id,
                  type:
                    workspace.type,
                  name:
                    workspace.name,
                  role:
                    workspace
                      .current_user_role,
                  ownerId:
                    workspace
                      .owner_id,
                  localId:
                    workspace
                      .local_workspace_id,
                })
              ),
          }
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Shared workspaces could not be loaded.";

        setErrorMessage(
          message
        );

        console.log(
          "Direct workspace screen error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useFocusEffect(
    useCallback(() => {
      loadSharedWorkspaces();
    }, [
      loadSharedWorkspaces,
    ])
  );

  const households =
    workspaces.filter(
      (workspace) =>
        workspace.type ===
        "household"
    );

  const businesses =
    workspaces.filter(
      (workspace) =>
        workspace.type ===
        "business"
    );

  return (
    <AppPage>
      <PageHeader
        title="Shared Workspaces"
        subtitle="Loaded directly from your Supabase workspace access."
      />

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 40,
          gap: 14,
        }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={
              loadSharedWorkspaces
            }
          />
        }
      >
        <AppCard>
          <AppText variant="section">
            Signed-In Account
          </AppText>

          <View
            style={{
              marginTop: 10,
              gap: 4,
            }}
          >
            <AppText variant="bold">
              {currentUser?.email ??
                "No account"}
            </AppText>

            <AppText variant="muted">
              User ID:{" "}
              {currentUser?.id ??
                "Not available"}
            </AppText>
          </View>
        </AppCard>

        {errorMessage ? (
          <AppCard>
            <AppText variant="section">
              Loading Error
            </AppText>

            <View
              style={{
                marginTop: 10,
              }}
            >
              <AppText variant="muted">
                {errorMessage}
              </AppText>
            </View>

            <View
              style={{
                marginTop: 14,
              }}
            >
              <RefreshButton
                loading={loading}
                onPress={
                  loadSharedWorkspaces
                }
              />
            </View>
          </AppCard>
        ) : null}

        {!errorMessage &&
        !loading &&
        workspaces.length ===
          0 ? (
          <AppCard>
            <AppText variant="section">
              No Shared Workspaces
            </AppText>

            <View
              style={{
                marginTop: 8,
              }}
            >
              <AppText variant="muted">
                Supabase returned zero
                owned or joined
                workspaces for this
                account.
              </AppText>
            </View>
          </AppCard>
        ) : null}

        {households.length >
        0 ? (
          <WorkspaceSection
            title="Households"
            workspaces={
              households
            }
          />
        ) : null}

        {businesses.length >
        0 ? (
          <WorkspaceSection
            title="Businesses"
            workspaces={
              businesses
            }
          />
        ) : null}

        <RefreshButton
          loading={loading}
          onPress={
            loadSharedWorkspaces
          }
        />
      </ScrollView>
    </AppPage>
  );
}

function WorkspaceSection({
  title,
  workspaces,
}: {
  title: string;
  workspaces: SharedWorkspaceRow[];
}) {
  return (
    <View
      style={{
        gap: 10,
      }}
    >
      <AppText variant="section">
        {title}
      </AppText>

      {workspaces.map(
        (workspace) => (
          <WorkspaceCard
            key={workspace.id}
            workspace={
              workspace
            }
          />
        )
      )}
    </View>
  );
}

function WorkspaceCard({
  workspace,
}: {
  workspace: SharedWorkspaceRow;
}) {
  const workspaceData =
    workspace.workspace_data;

  const dataName =
    typeof workspaceData?.name ===
    "string"
      ? workspaceData.name
      : workspace.name;

  const dataId =
    typeof workspaceData?.id ===
    "string"
      ? workspaceData.id
      : workspace
          .local_workspace_id;

  return (
    <AppCard>
      <View
        style={{
          gap: 6,
        }}
      >
        <AppText variant="title">
          {dataName}
        </AppText>

        {workspace.description ? (
          <AppText variant="muted">
            {
              workspace.description
            }
          </AppText>
        ) : null}

        <View
          style={{
            marginTop: 6,
            gap: 3,
          }}
        >
          <AppText variant="bold">
            Role:{" "}
            {
              workspace.current_user_role
            }
          </AppText>

          <AppText variant="muted">
            Workspace ID:{" "}
            {workspace.id}
          </AppText>

          <AppText variant="muted">
            Household/Business ID:{" "}
            {dataId ??
              "Missing"}
          </AppText>

          <AppText variant="muted">
            Owner ID:{" "}
            {
              workspace.owner_id
            }
          </AppText>
        </View>
      </View>
    </AppCard>
  );
}

function RefreshButton({
  loading,
  onPress,
}: {
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity:
          loading || pressed
            ? 0.65
            : 1,
      })}
    >
      <AppCard>
        <View
          style={{
            alignItems:
              "center",
          }}
        >
          <AppText variant="bold">
            {loading
              ? "Loading..."
              : "Refresh Workspaces"}
          </AppText>
        </View>
      </AppCard>
    </Pressable>
  );
}