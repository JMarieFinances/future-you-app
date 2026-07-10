import { getAppData, loadAppData } from "@/lib/appStore";
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

  async function refreshUserState(newSession: Session | null) {
    setSession(newSession);

    if (!newSession) {
      setOnboarded(false);
      return;
    }

    await loadAppData();
    setOnboarded(getAppData().settings.onboarded);
  }

  useEffect(() => {
    async function initializeAuth() {
      const { data } = await supabase.auth.getSession();
      await refreshUserState(data.session);
      setLoading(false);
    }

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
    const isOnboardingRoute = currentRoute === "onboarding";

    if (!session && !isAuthRoute) {
      router.replace("/auth");
      return;
    }

    if (session && isAuthRoute) {
      router.replace("/");
      return;
    }

    if (session && !onboarded && !isOnboardingRoute) {
      router.replace("/onboarding");
      return;
    }

    if (session && onboarded && isOnboardingRoute) {
      router.replace("/(tabs)/today");
      return;
    }
  }, [session, onboarded, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}