import AppCard from "@/components/ui/AppCard";
import AppPage from "@/components/ui/AppPage";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import { loadAppData } from "@/lib/appStore";
import { getFinancialSummary, getMonthlyReview } from "@/lib/financeEngine";
import { useEffect, useState } from "react";
import { View } from "react-native";

export default function MonthlyReviewScreen() {
  const [isReady, setIsReady] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      await loadAppData();
      setIsReady(true);
    };

    load();
  }, [refreshKey]);

  if (!isReady) {
    return <AppPage />;
  }

  const review = getMonthlyReview();
  const summary = getFinancialSummary();

  return (
    <AppPage>
      <PageHeader
        title={`${review.month} ${review.year} Review`}
        subtitle="A clear look at what happened with your money this month."
      />

      <AppCard>
        <AppText variant="muted">Monthly Outcome</AppText>

        <View style={{ marginTop: 4 }}>
          <AppText variant="title">
            {summary.safeToSpend >= 0 ? "On Track" : "Needs Attention"}
          </AppText>
        </View>

        <AppText variant="muted">
          {summary.safeToSpend >= 0
            ? `You still have $${summary.safeToSpend.toFixed(0)} safe to spend.`
            : `You are $${Math.abs(summary.safeToSpend).toFixed(0)} over your safe-to-spend amount.`}
        </AppText>
      </AppCard>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Income"
            value={`$${summary.totalIncome.toFixed(0)}`}
            caption="Monthly"
            tone="success"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Spent"
            value={`$${summary.totalSpent.toFixed(0)}`}
            caption="Logged"
            tone="warning"
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Remaining"
            value={`$${summary.safeToSpend.toFixed(0)}`}
            caption="Safe to spend"
            tone={summary.safeToSpend >= 0 ? "primary" : "danger"}
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Goals"
            value={`$${summary.goalMonthly.toFixed(0)}`}
            caption="Planned"
            tone="success"
          />
        </View>
      </View>

      <AppCard>
        <AppText variant="section">Budget Breakdown</AppText>

        <View style={{ marginTop: 12, gap: 10 }}>
          <ReviewRow label="Fixed Expenses" amount={summary.fixedExpenses} />
          <ReviewRow label="Subscriptions" amount={summary.subscriptions} />
          <ReviewRow label="Debt" amount={summary.debt} />
          <ReviewRow label="Lifestyle" amount={summary.lifestyle} />
          <ReviewRow label="Goals" amount={summary.goalMonthly} />
        </View>
      </AppCard>

      {summary.biggestExpense ? (
        <AppCard>
          <AppText variant="section">Biggest Purchase</AppText>

          <View style={{ marginTop: 12 }}>
            <AppRow>
              <View>
                <AppText variant="bold">{summary.biggestExpense.name}</AppText>
                <AppText variant="muted">
                  {summary.biggestExpense.category}
                </AppText>
              </View>

              <AppText variant="bold">
                ${summary.biggestExpense.amount.toFixed(2)}
              </AppText>
            </AppRow>
          </View>
        </AppCard>
      ) : (
        <AppCard>
          <AppText variant="section">Biggest Purchase</AppText>
          <View style={{ marginTop: 10 }}>
            <AppText variant="muted">
              No purchases logged this month.
            </AppText>
          </View>
        </AppCard>
      )}

      <AppCard>
        <AppText variant="section">Wins</AppText>

        <View style={{ marginTop: 10, gap: 8 }}>
          {review.wins.length === 0 ? (
            <AppText variant="muted">No wins recorded yet.</AppText>
          ) : (
            review.wins.map((win) => (
              <AppText key={win} variant="muted">
                • {win}
              </AppText>
            ))
          )}
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="section">Needs Attention</AppText>

        <View style={{ marginTop: 10, gap: 8 }}>
          {review.warnings.length === 0 ? (
            <AppText variant="muted">Nothing major needs attention.</AppText>
          ) : (
            review.warnings.map((warning) => (
              <AppText key={warning} variant="muted">
                • {warning}
              </AppText>
            ))
          )}
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="section">Next Month</AppText>

        <View style={{ marginTop: 10, gap: 8 }}>
          {review.recommendations.length === 0 ? (
            <AppText variant="muted">Keep following your current plan.</AppText>
          ) : (
            review.recommendations.map((recommendation) => (
              <AppText key={recommendation} variant="muted">
                • {recommendation}
              </AppText>
            ))
          )}
        </View>
      </AppCard>
    </AppPage>
  );
}

function ReviewRow({ label, amount }: { label: string; amount: number }) {
  return (
    <AppRow>
      <AppText variant="muted">{label}</AppText>
      <AppText variant="bold">${amount.toFixed(0)}</AppText>
    </AppRow>
  );
}