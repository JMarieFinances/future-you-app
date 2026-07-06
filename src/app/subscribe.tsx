import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppPage from "@/components/ui/AppPage";
import AppText from "@/components/ui/AppText";
import PageHeader from "@/components/ui/PageHeader";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";

export default function SubscribeScreen() {
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth");
        return;
      }

      const { error } = await supabase
        .from("user_subscriptions")
        .upsert({
          user_id: user.id,
          status: "trialing",
          plan: "premium",
          trial_end: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      router.replace("/");
    } catch (err: any) {
      Alert.alert("Subscription Error", err.message);
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  return (
    <AppPage>
      <PageHeader
        title="Future You Premium"
        subtitle="Plan your life, not just your money."
      />

      <AppCard>
        <AppText variant="muted">Premium Membership</AppText>

        <View style={{ marginTop: 8 }}>
          <AppText variant="title">$5.99/month</AppText>
        </View>

        <View style={{ marginTop: 12, gap: 6 }}>
          <AppText variant="muted">• 30-day free beta trial</AppText>
          <AppText variant="muted">• Personal budgets</AppText>
          <AppText variant="muted">• Household budgets</AppText>
          <AppText variant="muted">• Business budgets</AppText>
          <AppText variant="muted">• Goals & Calendar</AppText>
          <AppText variant="muted">• Cloud Sync</AppText>
        </View>
      </AppCard>

      <AppButton
        title={loading ? "Starting Trial..." : "Start Free Month"}
        onPress={handleSubscribe}
      />

      <AppButton
        title="Log Out"
        onPress={handleLogout}
        variant="outline"
      />
    </AppPage>
  );
}