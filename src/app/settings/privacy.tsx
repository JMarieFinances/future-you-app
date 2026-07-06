import AppCard from "@/components/ui/AppCard";
import AppPage from "@/components/ui/AppPage";
import AppText from "@/components/ui/AppText";
import PageHeader from "@/components/ui/PageHeader";

export default function PrivacyPolicyScreen() {
  return (
    <AppPage>
      <PageHeader
        title="Privacy Policy"
        subtitle="How Future You handles your information."
        showBack
      />

      <AppCard>
        <AppText variant="title">Privacy Policy</AppText>

        <AppText style={{ marginTop: 12 }}>
          Future You collects the information needed to create your account,
          manage your subscription, save your financial planning data, and
          provide support.
        </AppText>

        <AppText style={{ marginTop: 12 }}>
          This may include your email address, account details, subscription
          status, app settings, budgets, goals, calendar items, purchases,
          businesses, households, and support requests.
        </AppText>

        <AppText style={{ marginTop: 12 }}>
          Payment processing is handled through Stripe. Future You does not
          store your full card number.
        </AppText>

        <AppText style={{ marginTop: 12 }}>
          Your app data may be saved locally on your device and synced securely
          with Supabase so your information can be restored when you log in.
        </AppText>

        <AppText style={{ marginTop: 12 }}>
          Future You does not sell your personal information. Your information
          is used to operate the app, improve reliability, provide customer
          support, and manage subscriptions.
        </AppText>

        <AppText style={{ marginTop: 12 }}>
          You may request help with your account or data by contacting support
          through the Support Center inside the app.
        </AppText>

        <AppText style={{ marginTop: 12 }}>
          This policy may be updated as Future You grows. Continued use of the
          app means you accept the latest version of this policy.
        </AppText>
      </AppCard>
    </AppPage>
  );
}