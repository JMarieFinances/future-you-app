import {
  getBudgetTotal,
  getSpentTotal,
} from "@/components/budget/budgetUtils";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppPage from "@/components/ui/AppPage";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import EmptyState from "@/components/ui/EmptyState";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import { getBusinesses } from "@/lib/businessStore";
import { Business } from "@/lib/types";
import { router } from "expo-router";
import { Pressable, View } from "react-native";

export default function BusinessList({
  onCreate,
  onOpen,
}: {
  onCreate: () => void;
  onOpen: (business: Business) => void;
}) {
  const businesses = getBusinesses();

  const totalRevenue = businesses.reduce(
    (sum, business) => sum + business.budget.businessIncome,
    0
  );

  const totalAssigned = businesses.reduce(
    (sum, business) =>
      sum +
      getBudgetTotal(business.budget.operatingExpenses) +
      getBudgetTotal(business.budget.businessSpending) +
      getBudgetTotal(business.budget.businessSavings),
    0
  );

  const totalSpent = businesses.reduce(
    (sum, business) =>
      sum +
      getSpentTotal(business.budget.operatingExpenses) +
      getSpentTotal(business.budget.businessSpending) +
      getSpentTotal(business.budget.businessSavings),
    0
  );

  return (
    <AppPage>
      <AppButton
        title="Back to Profile"
        onPress={() => router.back()}
        variant="outline"
      />

      <PageHeader
        title="Businesses"
        subtitle="Manage your businesses without mixing their finances with your personal budget."
      />

      <AppCard>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="muted">Business HQ</AppText>

            <View style={{ marginTop: 4 }}>
              <AppText variant="title">
                ${totalRevenue.toFixed(0)}
              </AppText>
            </View>

            <AppText variant="muted">
              Combined monthly revenue across all businesses.
            </AppText>
          </View>

          <View style={{ marginLeft: 12 }}>
            <AppButton title="Add Business" onPress={onCreate} />
          </View>
        </AppRow>
      </AppCard>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Assigned"
            value={`$${totalAssigned.toFixed(0)}`}
            caption="Planned business funds"
            tone="primary"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Spent"
            value={`$${totalSpent.toFixed(0)}`}
            caption="Business spending"
            tone={totalSpent > totalAssigned ? "danger" : "warning"}
          />
        </View>
      </View>

      <AppCard>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="section">Your Businesses</AppText>
            <AppText variant="muted">
              Each business has its own budget, calendar and financial plan.
            </AppText>
          </View>
        </AppRow>

        {businesses.length === 0 ? (
          <View style={{ marginTop: 14, gap: 14 }}>
            <EmptyState message="Create your first business to begin tracking revenue, expenses and growth separately from your personal finances." />

            <AppButton
              title="Set Up Your First Business"
              onPress={onCreate}
            />
          </View>
        ) : (
          <View style={{ marginTop: 14, gap: 12 }}>
            {businesses.map((business) => {
              const assigned =
                getBudgetTotal(business.budget.operatingExpenses) +
                getBudgetTotal(business.budget.businessSpending) +
                getBudgetTotal(business.budget.businessSavings);

              const spent =
                getSpentTotal(business.budget.operatingExpenses) +
                getSpentTotal(business.budget.businessSpending) +
                getSpentTotal(business.budget.businessSavings);

              const remaining =
                business.budget.businessIncome - spent;

              return (
                <Pressable
                  key={business.id}
                  onPress={() => onOpen(business)}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <AppCard>
                    <AppRow>
                      <View style={{ flex: 1 }}>
                        <AppText variant="bold">
                          {business.name}
                        </AppText>

                        <AppText variant="muted">
                          {business.businessType}
                        </AppText>
                      </View>

                      <View style={{ alignItems: "flex-end" }}>
                        <AppText
                          variant="bold"
                          style={{
                            color:
                              remaining < 0
                                ? "#DC2626"
                                : undefined,
                          }}
                        >
                          ${remaining.toFixed(0)}
                        </AppText>

                        <AppText variant="muted">
                          available
                        </AppText>
                      </View>
                    </AppRow>

                    {business.description ? (
                      <View style={{ marginTop: 10 }}>
                        <AppText variant="muted">
                          {business.description}
                        </AppText>
                      </View>
                    ) : null}

                    <View style={{ marginTop: 14, gap: 8 }}>
                      <AppRow>
                        <AppText variant="muted">
                          Monthly revenue
                        </AppText>

                        <AppText variant="bold">
                          ${business.budget.businessIncome.toFixed(0)}
                        </AppText>
                      </AppRow>

                      <AppRow>
                        <AppText variant="muted">
                          Assigned
                        </AppText>

                        <AppText variant="bold">
                          ${assigned.toFixed(0)}
                        </AppText>
                      </AppRow>

                      <AppRow>
                        <AppText variant="muted">
                          Spent
                        </AppText>

                        <AppText variant="bold">
                          ${spent.toFixed(0)}
                        </AppText>
                      </AppRow>
                    </View>

                    <View style={{ marginTop: 14 }}>
                      <AppText variant="muted">
                        Open business workspace →
                      </AppText>
                    </View>
                  </AppCard>
                </Pressable>
              );
            })}
          </View>
        )}
      </AppCard>
    </AppPage>
  );
}