import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppPage from "@/components/ui/AppPage";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import {
  getAppData,
  updateAppData,
} from "@/lib/appStore";
import { getFinancialSummary } from "@/lib/financeEngine";
import { getThemeConfig } from "@/lib/settingsStore";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import {
  useEffect,
  useState,
} from "react";
import {
  Alert,
  Pressable,
  View,
} from "react-native";

export default function ProfileTab() {
  const app = getAppData();
  const summary = getFinancialSummary();
  const theme = getThemeConfig();

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [
    adminCheckComplete,
    setAdminCheckComplete,
  ] = useState(false);

  const [userId, setUserId] =
    useState("");

  const [
    displayName,
    setDisplayName,
  ] = useState("");

  const [
    savedDisplayName,
    setSavedDisplayName,
  ] = useState(
    app.settings.userName ?? ""
  );

  const [
    profileLoading,
    setProfileLoading,
  ] = useState(true);

  const [
    profileSaving,
    setProfileSaving,
  ] = useState(false);

  const [
    isEditingProfile,
    setIsEditingProfile,
  ] = useState(false);

  useEffect(() => {
    loadProfile();
    checkAdminAccess();
  }, []);

  async function loadProfile() {
    setProfileLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (userError) {
        throw new Error(
          userError.message
        );
      }

      if (!user) {
        setUserId("");
        return;
      }

      setUserId(user.id);

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error(
          profileError.message
        );
      }

      const nextDisplayName =
        profile?.display_name?.trim() ||
        app.settings.userName?.trim() ||
        "";

      setSavedDisplayName(
        nextDisplayName
      );

      setDisplayName(
        nextDisplayName
      );

      if (
        nextDisplayName &&
        nextDisplayName !==
          app.settings.userName
      ) {
        await updateAppData(
          (currentApp) => {
            currentApp.settings.userName =
              nextDisplayName;
          }
        );
      }
    } catch (error) {
      Alert.alert(
        "Unable to load profile",
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setProfileLoading(false);
    }
  }

  async function checkAdminAccess() {
    try {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        setIsAdmin(false);
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error(
          "Unable to verify admin access:",
          error
        );

        setIsAdmin(false);
        return;
      }

      setIsAdmin(Boolean(data));
    } catch (error) {
      console.error(
        "Admin access check failed:",
        error
      );

      setIsAdmin(false);
    } finally {
      setAdminCheckComplete(true);
    }
  }

  function beginEditingProfile() {
    setDisplayName(
      savedDisplayName
    );

    setIsEditingProfile(true);
  }

  function cancelEditingProfile() {
    setDisplayName(
      savedDisplayName
    );

    setIsEditingProfile(false);
  }

  async function saveProfile() {
    const cleanDisplayName =
      displayName.trim();

    if (!userId) {
      Alert.alert(
        "Unable to save",
        "You must be signed in to update your profile."
      );

      return;
    }

    if (!cleanDisplayName) {
      Alert.alert(
        "Display name required",
        "Enter the name you want shown in Future You."
      );

      return;
    }

    if (
      cleanDisplayName.length > 50
    ) {
      Alert.alert(
        "Name too long",
        "Display name must be 50 characters or fewer."
      );

      return;
    }

    setProfileSaving(true);

    try {
      const {
        error: profileError,
      } = await supabase
        .from("user_profiles")
        .upsert(
          {
            user_id: userId,
            display_name:
              cleanDisplayName,
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        );

      if (profileError) {
        throw new Error(
          profileError.message
        );
      }

      const {
        error: metadataError,
      } =
        await supabase.auth.updateUser(
          {
            data: {
              display_name:
                cleanDisplayName,
            },
          }
        );

      if (metadataError) {
        throw new Error(
          metadataError.message
        );
      }

      await updateAppData(
        (currentApp) => {
          currentApp.settings.userName =
            cleanDisplayName;
        }
      );

      setSavedDisplayName(
        cleanDisplayName
      );

      setDisplayName(
        cleanDisplayName
      );

      setIsEditingProfile(false);

      Alert.alert(
        "Profile updated",
        "Your display name has been saved."
      );
    } catch (error) {
      Alert.alert(
        "Unable to update profile",
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setProfileSaving(false);
    }
  }

  return (
    <AppPage>
      <PageHeader
        title="Profile"
        subtitle={`Welcome back${
          savedDisplayName
            ? `, ${savedDisplayName}`
            : ""
        }.`}
      />

      <AppCard glass>
        <AppText variant="muted">
          Account Hub
        </AppText>

        <View
          style={{ marginTop: 4 }}
        >
          <AppText variant="title">
            {theme.name}
          </AppText>
        </View>

        <AppText variant="muted">
          Manage your account,
          budgets, workspaces, and
          reminders.
        </AppText>
      </AppCard>

      <AppCard>
        <View style={{ gap: 14 }}>
          <View>
            <AppText variant="section">
              Profile Details
            </AppText>

            <AppText variant="muted">
              This name appears in
              households, businesses,
              responsibilities, and
              the admin dashboard.
            </AppText>
          </View>

          {profileLoading ? (
            <AppText variant="muted">
              Loading profile...
            </AppText>
          ) : isEditingProfile ? (
            <View style={{ gap: 12 }}>
              <AppInput
                label="Display Name"
                placeholder="Enter your display name"
                value={displayName}
                onChangeText={
                  setDisplayName
                }
                autoCapitalize="words"
                editable={
                  !profileSaving
                }
              />

              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <AppButton
                    title="Save Changes"
                    loading={
                      profileSaving
                    }
                    disabled={
                      profileSaving ||
                      !displayName.trim()
                    }
                    onPress={saveProfile}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <AppButton
                    title="Cancel"
                    variant="outline"
                    disabled={
                      profileSaving
                    }
                    onPress={
                      cancelEditingProfile
                    }
                  />
                </View>
              </View>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              <View>
                <AppText variant="muted">
                  Display Name
                </AppText>

                <View
                  style={{
                    marginTop: 4,
                  }}
                >
                  <AppText variant="title">
                    {savedDisplayName ||
                      "No display name set"}
                  </AppText>
                </View>
              </View>

              <AppButton
                title="Edit Display Name"
                variant="outline"
                onPress={
                  beginEditingProfile
                }
              />
            </View>
          )}
        </View>
      </AppCard>

      <View
        style={{
          flexDirection: "row",
          gap: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Income"
            value={`$${summary.totalIncome.toFixed(
              0
            )}`}
            caption="Monthly"
            tone="success"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Safe"
            value={`$${summary.safeToSpend.toFixed(
              0
            )}`}
            caption="To spend"
            tone={
              summary.safeToSpend < 0
                ? "danger"
                : "primary"
            }
          />
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Goals"
            value={`${summary.plan.goals.length}`}
            caption="Created"
            tone="primary"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Score"
            value={`${summary.budgetScore.score}`}
            caption={
              summary.budgetScore.label
            }
            tone={
              summary.budgetScore
                .score >= 80
                ? "success"
                : "warning"
            }
          />
        </View>
      </View>

      {adminCheckComplete &&
      isAdmin ? (
        <AppCard>
          <AppText variant="section">
            Administration
          </AppText>

          <View
            style={{ marginTop: 12 }}
          >
            <MenuButton
              title="Admin Dashboard"
              subtitle="Manage users, subscriptions, support requests, and app activity."
              route="/admin"
            />
          </View>
        </AppCard>
      ) : null}

      <AppCard>
        <AppText variant="section">
          Budget Management
        </AppText>

        <View
          style={{
            marginTop: 12,
            gap: 10,
          }}
        >
          <MenuButton
            title="Household Budgets"
            subtitle="Manage shared bills and household money."
            route="/households"
          />

          <MenuButton
            title="Business Budgets"
            subtitle="Manage revenue, expenses, and business cash flow."
            route="/businesses"
          />
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="section">
          Personalization
        </AppText>

        <View
          style={{
            marginTop: 12,
            gap: 10,
          }}
        >
          <MenuButton
            title="Themes"
            subtitle="Change your app style anytime."
            route="/themes"
          />

          <MenuButton
            title="Notifications"
            subtitle="Control reminders, warnings, and monthly reviews."
            route="/notifications"
          />

          <MenuButton
            title="Settings"
            subtitle="Manage account, billing, support, and app details."
            route="/(tabs)/settings"
          />
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="section">
          Coming Soon
        </AppText>

        <View
          style={{
            marginTop: 12,
            gap: 10,
          }}
        >
          <DisabledRow
            title="Export Data"
            subtitle="Download reports and backups."
          />

          <DisabledRow
            title="Help Center"
            subtitle="Guides, FAQs, and support resources."
          />
        </View>
      </AppCard>
    </AppPage>
  );
}

function MenuButton({
  title,
  subtitle,
  route,
}: {
  title: string;
  subtitle: string;
  route: string;
}) {
  return (
    <Pressable
      onPress={() =>
        router.push(route as never)
      }
      style={({ pressed }) => ({
        opacity: pressed
          ? 0.72
          : 1,
        transform: [
          {
            scale: pressed
              ? 0.99
              : 1,
          },
        ],
      })}
    >
      <AppCard>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="bold">
              {title}
            </AppText>

            <AppText variant="muted">
              {subtitle}
            </AppText>
          </View>

          <AppText variant="bold">
            ›
          </AppText>
        </AppRow>
      </AppCard>
    </Pressable>
  );
}

function DisabledRow({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <AppCard>
      <AppText variant="bold">
        {title}
      </AppText>

      <AppText variant="muted">
        {subtitle}
      </AppText>
    </AppCard>
  );
}