import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppPage from "@/components/ui/AppPage";
import AppText from "@/components/ui/AppText";
import PageHeader from "@/components/ui/PageHeader";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Linking, View } from "react-native";

export default function SubscribeScreen() {
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        router.replace("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body: {
            email: user.email,
            userId: user.id,
          },
        }
      );

      if (error) throw error;
      if (!data?.url) throw new Error("No checkout URL returned.");

      await Linking.openURL(data.url);
    } catch (err: any) {
      Alert.alert("Checkout Error", err.message ?? "Something went wrong.");
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
        subtitle="Start your free month, then continue for $5.99/month."
      />

      <AppCard>
        <AppText variant="muted">Premium Membership</AppText>

        <View style={{ marginTop: 8 }}>
          <AppText variant="title">$5.99/month</AppText>
        </View>

        <View style={{ marginTop: 12, gap: 6 }}>
          <AppText variant="muted">• 30-day free trial</AppText>
          <AppText variant="muted">• Personal budgets</AppText>
          <AppText variant="muted">• Household budgets</AppText>
          <AppText variant="muted">• Business budgets</AppText>
          <AppText variant="muted">• Goals & Calendar</AppText>
          <AppText variant="muted">• Cloud Sync</AppText>
        </View>
      </AppCard>

      <AppButton
        title={loading ? "Opening Checkout..." : "Start Free Month"}
        onPress={handleSubscribe}
      />

      <AppButton title="Log Out" onPress={handleLogout} variant="outline" />
    </AppPage>
  );
}