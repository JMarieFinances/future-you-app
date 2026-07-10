import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppPage from "@/components/ui/AppPage";
import AppText from "@/components/ui/AppText";
import PageHeader from "@/components/ui/PageHeader";
import {
  getSubscriptionStatus,
  hasActiveSubscription,
} from "@/lib/subscriptionStore";
import { supabase } from "@/lib/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Linking, View } from "react-native";

export default function SubscribePage() {
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (params.success !== "true") return;

    let canceled = false;

    async function waitForSubscription() {
      setActivating(true);

      for (let i = 0; i < 15; i++) {
        const status = await getSubscriptionStatus();

        if (hasActiveSubscription(status)) {
          router.replace("/onboarding");
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (canceled) return;
      }

      Alert.alert(
        "Still activating",
        "Your payment went through, but your account is still updating. Try refreshing in a few seconds."
      );

      setActivating(false);
    }

    waitForSubscription();

    return () => {
      canceled = true;
    };
  }, [params.success]);

  useEffect(() => {
    if (params.canceled === "true") {
      Alert.alert(
        "Checkout canceled",
        "You can start your trial whenever you're ready."
      );
    }
  }, [params.canceled]);

  async function startTrial() {
    if (loading) return;

    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert("Sign in required", "Please create an account or sign in first.");
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

      if (error) {
        Alert.alert("Checkout error", error.message);
        return;
      }

      if (!data?.url) {
        Alert.alert("Checkout error", "No Stripe checkout link was returned.");
        return;
      }

      await Linking.openURL(data.url);
    } catch (err) {
      Alert.alert(
        "Checkout error",
        err instanceof Error ? err.message : "Something went wrong opening Stripe."
      );
    } finally {
      setLoading(false);
    }
  }

  if (activating) {
    return (
      <AppPage>
        <PageHeader
          title="Activating your trial..."
          subtitle="This usually only takes a few seconds."
        />

        <AppCard>
          <View style={{ gap: 12 }}>
            <AppText variant="title">Almost there</AppText>
            <AppText>
              Future You is confirming your subscription and setting up your
              account.
            </AppText>
          </View>
        </AppCard>
      </AppPage>
    );
  }

  return (
    <AppPage>
      <PageHeader
        title="Future You Premium"
        subtitle="Start your 30-day free trial."
      />

      <AppCard>
        <View style={{ gap: 14 }}>
          <AppText variant="title">$5.99/month</AppText>

          <AppText>
            Start with a 30-day free trial. After your trial, your subscription
            continues monthly unless canceled.
          </AppText>

          <View style={{ gap: 8 }}>
            <AppText>✓ Today page</AppText>
            <AppText>✓ Dashboard</AppText>
            <AppText>✓ Goals</AppText>
            <AppText>✓ Plan</AppText>
            <AppText>✓ Calendar</AppText>
            <AppText>✓ Review</AppText>
            <AppText>✓ Afford checks</AppText>
            <AppText>✓ Business and household budgets</AppText>
          </View>

          <AppButton
            title={loading ? "Opening Stripe..." : "Start Free Trial"}
            onPress={startTrial}
            disabled={loading}
          />
        </View>
      </AppCard>
    </AppPage>
  );
}