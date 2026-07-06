import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppPage from "@/components/ui/AppPage";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import PageHeader from "@/components/ui/PageHeader";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

export default function SettingsScreen() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? "Signed in");
    };

    loadUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth");
  };

  return (
    <AppPage>
      <PageHeader
        title="Settings"
        subtitle="Manage your account and Future You preferences."
      />

      <AppCard>
        <AppText variant="section">Account</AppText>

        <View style={{ marginTop: 12, gap: 10 }}>
          <AppRow>
            <AppText variant="muted">Email</AppText>
            <AppText variant="bold">{email}</AppText>
          </AppRow>

          <AppButton title="Log Out" onPress={handleLogout} variant="outline" />
        </View>
      </AppCard>
    </AppPage>
  );
}