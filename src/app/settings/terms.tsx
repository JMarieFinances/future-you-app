import AppCard from "@/components/ui/AppCard";
import AppPage from "@/components/ui/AppPage";
import AppText from "@/components/ui/AppText";
import PageHeader from "@/components/ui/PageHeader";

export default function TermsScreen() {
  return (
    <AppPage>
      <PageHeader
        title="Terms of Service"
        subtitle="The rules for using Future You."
        showBack
      />

      <AppCard>
        <AppText variant="title">Terms of Service</AppText>

        <AppText style={{ marginTop: 12 }}>
          By creating an account or using Future You, you agree to these Terms
          of Service.
        </AppText>

        <AppText style={{ marginTop: 12 }}>
          Future You is a financial planning and budgeting application designed
          to help you organize your finances. It is not financial, legal, tax,
          or investment advice.
        </AppText>

        <AppText style={{ marginTop: 12 }}>
          You are responsible for the accuracy of the information you enter into
          the app. Financial decisions remain your responsibility.
        </AppText>

        <AppText style={{ marginTop: 12 }}>
          Subscription billing is managed through Stripe. Paid subscriptions
          automatically renew unless canceled through the Billing Portal before
          the next billing cycle.
        </AppText>

        <AppText style={{ marginTop: 12 }}>
          You agree not to misuse the app, attempt unauthorized access, disrupt
          the service, or violate applicable laws while using Future You.
        </AppText>

        <AppText style={{ marginTop: 12 }}>
          Future You may update features, pricing, or these Terms from time to
          time. Continued use of the app constitutes acceptance of those
          updates.
        </AppText>

        <AppText style={{ marginTop: 12 }}>
          Future You is provided "as is" without guarantees of uninterrupted
          availability or specific financial outcomes.
        </AppText>
      </AppCard>
    </AppPage>
  );
}