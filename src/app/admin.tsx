import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppPage from "@/components/ui/AppPage";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Alert, Pressable, View } from "react-native";

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
  email: string | null;
  type?: string;
  issue_type?: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "closed";
  admin_response?: string | null;
  created_at: string;
};

export default function AdminScreen() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      setAllowed(false);
      setLoading(false);
      return;
    }

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

    const { data: subData } = await supabase
      .from("user_subscriptions")
      .select("*")
      .order("updated_at", { ascending: false });

    const { data: requestsData, error: requestsError } = await supabase
      .from("support_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (requestsError) {
      Alert.alert("Support error", requestsError.message);
    }

    setSubscriptions((subData ?? []) as SubscriptionRow[]);
    setSupportRequests((requestsData ?? []) as SupportRequest[]);
    setLoading(false);
  }

  async function updateSupportStatus(status: "open" | "in_progress" | "closed") {
    if (!selectedRequest) return;

    const { error } = await supabase
      .from("support_requests")
      .update({
        status,
        admin_response: adminResponse,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedRequest.id);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    Alert.alert("Saved", "Support request updated.");
    setSelectedRequest(null);
    setAdminResponse("");
    loadAdminData();
  }

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
        <PageHeader title="Admin" subtitle="You do not have access to this page." />
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

  const filteredSubscriptions =
    filter === "all" ? subscriptions : subscriptions.filter((item) => item.status === filter);

  if (selectedRequest) {
    const requestType = selectedRequest.issue_type ?? selectedRequest.type ?? "general";

    return (
      <AppPage>
        <PageHeader title="Support Request" subtitle="Review and update this ticket." />

        <AppCard>
          <View style={{ gap: 12 }}>
            <AppText variant="title">{selectedRequest.subject}</AppText>
            <AppText variant="muted">Email: {selectedRequest.email ?? "No email"}</AppText>
            <AppText variant="muted">Type: {requestType.replaceAll("_", " ")}</AppText>
            <AppText variant="muted">Status: {selectedRequest.status}</AppText>
            <AppText variant="muted">Created: {formatDate(selectedRequest.created_at)}</AppText>

            <AppText>{selectedRequest.message}</AppText>

            <AppInput
              label="Admin Response / Notes"
              value={adminResponse}
              onChangeText={setAdminResponse}
              placeholder="Write your response or internal note..."
              multiline
            />

            <AppButton title="Mark In Progress" onPress={() => updateSupportStatus("in_progress")} />
            <AppButton title="Mark Closed" onPress={() => updateSupportStatus("closed")} />
            <AppButton
              title="Back to Support Queue"
              variant="secondary"
              onPress={() => {
                setSelectedRequest(null);
                setAdminResponse("");
              }}
            />
          </View>
        </AppCard>
      </AppPage>
    );
  }

  return (
    <AppPage>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Track users, trials, subscriptions, revenue, and support."
      />

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard title="Users" value={String(totalUsers)} caption="Total accounts" tone="primary" />
        </View>
        <View style={{ flex: 1 }}>
          <MetricCard title="Trials" value={String(trials)} caption="Free month" tone="warning" />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard title="Active" value={String(active)} caption="Paid users" tone="success" />
        </View>
        <View style={{ flex: 1 }}>
          <MetricCard title="MRR" value={`$${activeMrr.toFixed(2)}`} caption="Monthly revenue" tone="success" />
        </View>
      </View>

      <AppCard>
        <AppText variant="section">Support Queue</AppText>

        <View style={{ marginTop: 12, gap: 14 }}>
          {supportRequests.length === 0 ? (
            <AppText variant="muted">No support requests.</AppText>
          ) : (
            supportRequests.map((request) => {
              const requestType = request.issue_type ?? request.type ?? "general";

              return (
                <AppCard key={request.id}>
                  <View style={{ gap: 8 }}>
                    <AppRow>
                      <AppText variant="bold">{request.subject}</AppText>
                      <AppText>{request.status}</AppText>
                    </AppRow>

                    <AppText variant="muted">{request.email ?? "No email"}</AppText>
                    <AppText variant="muted">{requestType.replaceAll("_", " ")}</AppText>
                    <AppText>{request.message}</AppText>
                    <AppText variant="muted">{formatDate(request.created_at)}</AppText>

                    <AppButton
                      title="Open"
                      onPress={() => {
                        setSelectedRequest(request);
                        setAdminResponse(request.admin_response ?? "");
                      }}
                    />
                  </View>
                </AppCard>
              );
            })
          )}
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="section">Filters</AppText>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {["all", "trialing", "active", "past_due", "inactive", "canceled"].map((status) => (
            <FilterChip
              key={status}
              label={status}
              active={filter === status}
              onPress={() => setFilter(status)}
            />
          ))}
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
            filteredSubscriptions.map((item) => <AdminUserRow key={item.user_id} item={item} />)
          )}
        </View>
      </AppCard>

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
            <AppText variant="muted">Past Due</AppText>
            <AppText variant="bold">{pastDue}</AppText>
          </AppRow>
          <AppRow>
            <AppText variant="muted">Inactive</AppText>
            <AppText variant="bold">{inactive}</AppText>
          </AppRow>
          <AppRow>
            <AppText variant="muted">Canceled</AppText>
            <AppText variant="bold">{canceled}</AppText>
          </AppRow>
          <AppRow>
            <AppText variant="muted">Trial Pipeline</AppText>
            <AppText variant="bold">${trialPipeline.toFixed(2)}</AppText>
          </AppRow>
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
        <AppText variant="muted">Period ends: {formatDate(item.current_period_end)}</AppText>
      ) : null}

      {item.stripe_customer_id ? (
        <AppText variant="muted">Stripe: {shortId(item.stripe_customer_id)}</AppText>
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