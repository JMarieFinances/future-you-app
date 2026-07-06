import AppCard from "@/components/ui/AppCard";
import AppPage from "@/components/ui/AppPage";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";

type SubscriptionRow = {
  user_id: string;
  status: string;
  plan: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_end: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

type SupportRequest = {
  id: string;
  user_id: string;
  email: string;
  issue_type: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "closed";
  created_at: string;
};

export default function AdminScreen() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
 const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    const { data: requests } = await supabase
  .from("support_requests")
  .select("*")
  .order("created_at", { ascending: false });

setSupportRequests((requests ?? []) as SupportRequest[]);

    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminRow) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    setAllowed(true);

    const { data } = await supabase
      .from("user_subscriptions")
      .select("*")
      .order("updated_at", { ascending: false });

    setSubscriptions((data ?? []) as SubscriptionRow[]);
    setLoading(false);
  };

  if (loading) {
    return (
      <AppPage>
        <PageHeader title="Admin" subtitle="Loading dashboard..." />
      </AppPage>
    );
  }

  if (!allowed) {
    return (
      <AppPage>
        <PageHeader
          title="Admin"
          subtitle="You do not have access to this page."
        />
      </AppPage>
    );
  }

  const totalUsers = subscriptions.length;
  const trials = subscriptions.filter((item) => item.status === "trialing").length;
  const active = subscriptions.filter((item) => item.status === "active").length;
  const pastDue = subscriptions.filter((item) => item.status === "past_due").length;
  const canceled = subscriptions.filter((item) => item.status === "canceled").length;
  const inactive = subscriptions.filter((item) => item.status === "inactive").length;

  const activeMrr = active * 5.99;
  const trialPipeline = trials * 5.99;
  const paidOrTrial = active + trials;
  const conversionRate = totalUsers > 0 ? (active / totalUsers) * 100 : 0;
  const churnRate = totalUsers > 0 ? (canceled / totalUsers) * 100 : 0;

  const trialsEndingSoon = subscriptions.filter((item) => {
    if (item.status !== "trialing" || !item.trial_end) return false;

    const now = Date.now();
    const trialEnd = new Date(item.trial_end).getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    return trialEnd >= now && trialEnd <= now + sevenDays;
  });

  const filteredSubscriptions =
    filter === "all"
      ? subscriptions
      : subscriptions.filter((item) => item.status === filter);

  return (
    <AppPage>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Track users, trials, subscriptions, revenue, and platform health."
      />

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Users"
            value={String(totalUsers)}
            caption="Total accounts"
            tone="primary"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Trials"
            value={String(trials)}
            caption="Free month"
            tone="warning"
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Active"
            value={String(active)}
            caption="Paid users"
            tone="success"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="MRR"
            value={`$${activeMrr.toFixed(2)}`}
            caption="Monthly revenue"
            tone="success"
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Past Due"
            value={String(pastDue)}
            caption="Payment issues"
            tone="danger"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Trial Pipeline"
            value={`$${trialPipeline.toFixed(2)}`}
            caption="Potential MRR"
            tone="primary"
          />
        </View>
      </View>

      <AppCard>
        <AppText variant="section">Business Health</AppText>

        <View style={{ marginTop: 12, gap: 8 }}>
          <AppRow>
            <AppText variant="muted">Active + Trialing</AppText>
            <AppText variant="bold">{paidOrTrial}</AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">Conversion Rate</AppText>
            <AppText variant="bold">{conversionRate.toFixed(1)}%</AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">Churn Rate</AppText>
            <AppText variant="bold">{churnRate.toFixed(1)}%</AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">Inactive</AppText>
            <AppText variant="bold">{inactive}</AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">Canceled</AppText>
            <AppText variant="bold">{canceled}</AppText>
          </AppRow>
        </View>
      </AppCard>

      <AppCard>
  <AppRow>
    <AppText variant="section">Support Queue</AppText>
    <AppText variant="muted">
      {supportRequests.length} requests
    </AppText>
  </AppRow>

  <View style={{ marginTop: 12, gap: 14 }}>
    {supportRequests.length === 0 ? (
      <AppText variant="muted">
        No support requests.
      </AppText>
    ) : (
      supportRequests.map((request) => (
        <View key={request.id}>
          <AppRow>
            <AppText variant="bold">
              {request.subject}
            </AppText>

            <AppText>
              {request.status === "open"
                ? "Open"
                : request.status === "in_progress"
                ? "In Progress"
                : "Closed"}
            </AppText>
          </AppRow>

          <AppText variant="muted">
            {request.email}
          </AppText>

          <AppText variant="muted">
            {request.issue_type.replaceAll("_", " ")}
          </AppText>

          <AppText style={{ marginTop: 4 }}>
            {request.message}
          </AppText>

          <AppText variant="muted" style={{ marginTop: 6 }}>
            {formatDate(request.created_at)}
          </AppText>
        </View>
      ))
    )}
  </View>
</AppCard>

      <AppCard>
        <AppText variant="section">Filters</AppText>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {["all", "trialing", "active", "past_due", "inactive", "canceled"].map(
            (status) => (
              <FilterChip
                key={status}
                label={status}
                active={filter === status}
                onPress={() => setFilter(status)}
              />
            )
          )}
        </View>
      </AppCard>

      <AppCard>
        <AppRow>
          <AppText variant="section">Users</AppText>
          <AppText variant="muted">{filteredSubscriptions.length} shown</AppText>
        </AppRow>

        <View style={{ marginTop: 12, gap: 14 }}>
          {filteredSubscriptions.length === 0 ? (
            <AppText variant="muted">No users match this filter.</AppText>
          ) : (
            filteredSubscriptions.map((item) => (
              <AdminUserRow key={item.user_id} item={item} />
            ))
          )}
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="section">Feature Flags</AppText>

        <View style={{ marginTop: 12, gap: 8 }}>
          <FeatureFlag label="Monthly Review Redesign" enabled />
          <FeatureFlag label="Stripe Billing" enabled />
          <FeatureFlag label="Cloud Sync" enabled />
          <FeatureFlag label="AI Budget Coach" />
          <FeatureFlag label="Advanced Charts" />
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="section">Support Queue</AppText>

        <View style={{ marginTop: 12, gap: 8 }}>
          <AppText variant="muted">No support requests yet.</AppText>
          <AppText variant="muted">
            Later, this can connect to a support_requests table.
          </AppText>
        </View>
      </AppCard>
    </AppPage>
  );
}

function AdminUserRow({ item }: { item: SubscriptionRow }) {
  return (
    <View>
      <AppRow>
        <AppText variant="bold">{item.status}</AppText>
        <AppText variant="muted">{formatDate(item.updated_at)}</AppText>
      </AppRow>

      <AppText variant="muted">User: {shortId(item.user_id)}</AppText>

      {item.trial_end ? (
        <AppText variant="muted">Trial ends: {formatDate(item.trial_end)}</AppText>
      ) : null}

      {item.current_period_end ? (
        <AppText variant="muted">
          Period ends: {formatDate(item.current_period_end)}
        </AppText>
      ) : null}

      {item.stripe_customer_id ? (
        <AppText variant="muted">
          Stripe: {shortId(item.stripe_customer_id)}
        </AppText>
      ) : null}
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 14,
        opacity: active ? 1 : 0.65,
      }}
    >
      <AppText variant="bold">{label}</AppText>
    </Pressable>
  );
}

function FeatureFlag({ label, enabled = false }: { label: string; enabled?: boolean }) {
  return (
    <AppRow>
      <AppText variant="muted">{label}</AppText>
      <AppText variant="bold">{enabled ? "On" : "Off"}</AppText>
    </AppRow>
  );
}

function shortId(value: string) {
  if (!value) return "";
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}