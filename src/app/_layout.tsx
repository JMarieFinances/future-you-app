import { getAppData, loadAppData } from "@/lib/appStore";
import {
  getSubscriptionStatus,
  hasActiveSubscription,
  SubscriptionStatus,
} from "@/lib/subscriptionStore";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { router, Stack, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const segments = useSegments();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus>("inactive");

  const refreshUserState = async (newSession: Session | null) => {
    setSession(newSession);

    if (!newSession) {
      setOnboarded(false);
      setSubscriptionStatus("inactive");
      return;
    }

    await loadAppData();

    setOnboarded(getAppData().settings.onboarded);
    setSubscriptionStatus(await getSubscriptionStatus());
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const { data } = await supabase.auth.getSession();

      await refreshUserState(data.session);

      setLoading(false);
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      await refreshUserState(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const currentRoute = segments[0];

    const isAuthRoute = currentRoute === "auth";
    const isSubscribeRoute = currentRoute === "subscribe";
    const isOnboardingRoute = currentRoute === "onboarding";

    const subscribed = hasActiveSubscription(subscriptionStatus);

    if (!session && !isAuthRoute) {
      router.replace("/auth");
      return;
    }

    if (session && isAuthRoute) {
      router.replace("/");
      return;
    }

    if (session && !subscribed && !isSubscribeRoute) {
      router.replace("/subscribe");
      return;
    }

    if (session && subscribed && isSubscribeRoute) {
      router.replace("/");
      return;
    }

    if (session && subscribed && !onboarded && !isOnboardingRoute) {
      router.replace("/onboarding");
      return;
    }

    if (session && subscribed && onboarded && isOnboardingRoute) {
      router.replace("/(tabs)/today");
    }
  }, [session, subscriptionStatus, onboarded, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}