import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppPage from "@/components/ui/AppPage";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import PageHeader from "@/components/ui/PageHeader";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, View } from "react-native";

export default function SettingsScreen() {
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    setEmail(user?.email ?? "Signed in");
    setUserId(user?.id ?? "");

    if (!user) return;

    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    setIsAdmin(!!adminRow);
  };

  const handleManageBilling = async () => {
    try {
      setBillingLoading(true);

      if (!userId) throw new Error("Missing user.");

      const { data, error } = await supabase.functions.invoke(
        "create-billing-portal-session",
        {
          body: { userId },
        }
      );

      if (error) throw error;
      if (!data?.url) throw new Error("No billing portal URL returned.");

      await Linking.openURL(data.url);
    } catch (err: any) {
      Alert.alert("Billing Error", err.message ?? "Could not open billing.");
    } finally {
      setBillingLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth");
  };

  return (
    <AppPage>
      <PageHeader
        title="Settings"
        subtitle="Manage your account, billing, and Future You preferences."
      showBack
      />

      <AppCard>
        <AppText variant="section">Account</AppText>

        <View style={{ marginTop: 12, gap: 10 }}>
          <AppRow>
            <AppText variant="muted">Email</AppText>
            <AppText variant="bold">{email}</AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">Plan</AppText>
            <AppText variant="bold">Future You Premium</AppText>
          </AppRow>
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="section">Subscription</AppText>

        <View style={{ marginTop: 12, gap: 10 }}>
          <AppText variant="muted">
            Manage your payment method, billing details, and subscription through Stripe.
          </AppText>

          <AppButton
            title={billingLoading ? "Opening Billing..." : "Manage Billing"}
            onPress={handleManageBilling}
          />
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="section">Support</AppText>

        <View style={{ marginTop: 12, gap: 12 }}>
         <AppButton
  title="Support Center"
  onPress={() => router.push("/settings/support")}
/>
          <AppButton
  title="Privacy Policy"
  onPress={() => router.push("/settings/privacy")}
/>
          <AppButton
  title="Terms of Service"
  onPress={() => router.push("/settings/terms")}
/>
        </View>
      </AppCard>

      {isAdmin ? (
        <AppCard>
          <AppText variant="section">Admin</AppText>

          <View style={{ marginTop: 12 }}>
            <AppButton
              title="Open Admin Dashboard"
              onPress={() => router.push("/admin")}
            />
          </View>
        </AppCard>
      ) : null}

      <AppCard>
        <AppText variant="section">About</AppText>

        <View style={{ marginTop: 12, gap: 8 }}>
          <AppRow>
            <AppText variant="muted">App</AppText>
            <AppText variant="bold">Future You</AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">Version</AppText>
            <AppText variant="bold">1.0.0-beta</AppText>
          </AppRow>
        </View>
      </AppCard>

      <AppButton title="Log Out" onPress={handleLogout} variant="outline" />
    </AppPage>
  );
}

function SettingsLink({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <AppRow>
        <AppText variant="bold">{label}</AppText>
        <AppText variant="muted">›</AppText>
      </AppRow>
    </Pressable>
  );
}