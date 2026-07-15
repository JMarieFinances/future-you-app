import AppCard from "@/components/ui/AppCard";
import AppPage from "@/components/ui/AppPage";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import { getAppData } from "@/lib/appStore";
import { getFinancialSummary } from "@/lib/financeEngine";
import { getThemeConfig } from "@/lib/settingsStore";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";

export default function ProfileTab() {
  const app = getAppData();
  const summary = getFinancialSummary();
  const theme = getThemeConfig();

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] =
    useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsAdmin(false);
          return;
        }

        const { data, error } = await supabase
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
    };

    checkAdminAccess();
  }, []);

  return (
    <AppPage>
      <PageHeader
        title="Profile"
        subtitle={`Welcome back${
          app.settings.userName
            ? `, ${app.settings.userName}`
            : ""
        }.`}
      />

      <AppCard glass>
        <AppText variant="muted">
          Account Hub
        </AppText>

        <View style={{ marginTop: 4 }}>
          <AppText variant="title">
            {theme.emoji} {theme.name}
          </AppText>
        </View>

        <AppText variant="muted">
          Manage your budgets, workspace, and reminders.
        </AppText>
      </AppCard>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Income"
            value={`$${summary.totalIncome.toFixed(0)}`}
            caption="Monthly"
            tone="success"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Safe"
            value={`$${summary.safeToSpend.toFixed(0)}`}
            caption="To spend"
            tone={
              summary.safeToSpend < 0
                ? "danger"
                : "primary"
            }
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
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
            caption={summary.budgetScore.label}
            tone={
              summary.budgetScore.score >= 80
                ? "success"
                : "warning"
            }
          />
        </View>
      </View>

      {adminCheckComplete && isAdmin ? (
        <AppCard>
          <AppText variant="section">
            Administration
          </AppText>

          <View style={{ marginTop: 12 }}>
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
      onPress={() => router.push(route as never)}
      style={({ pressed }) => ({
        opacity: pressed ? 0.72 : 1,
        transform: [
          {
            scale: pressed ? 0.99 : 1,
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

          <AppText variant="bold">›</AppText>
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