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
import { getHouseholds } from "@/lib/householdStore";
import { Household } from "@/lib/types";
import { router } from "expo-router";
import { Pressable, View } from "react-native";

const formatMoney = (amount: number) =>
  `$${amount.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;

export default function HouseholdList({
  onCreate,
  onOpen,
}: {
  onCreate: () => void;
  onOpen: (household: Household) => void;
}) {
  const households = getHouseholds();

  const totalIncome = households.reduce(
    (sum, household) =>
      sum + household.budget.householdIncome,
    0
  );

  const totalAssigned = households.reduce(
    (sum, household) =>
      sum +
      getBudgetTotal(household.budget.bills) +
      getBudgetTotal(household.budget.spending) +
      getBudgetTotal(household.budget.savings),
    0
  );

  const totalSpent = households.reduce(
    (sum, household) =>
      sum +
      getSpentTotal(household.budget.bills) +
      getSpentTotal(household.budget.spending) +
      getSpentTotal(household.budget.savings),
    0
  );

  const totalAvailable = totalIncome - totalSpent;

  return (
    <AppPage>
      <AppButton
  title="Back to Profile"
  onPress={() => router.replace("/(tabs)/profile")}
  variant="outline"
/>

      <PageHeader
        title="Households"
        subtitle="Manage shared income, bills, spending, and savings."
      />

      <AppCard>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="muted">
              Shared Money Hub
            </AppText>

            <View style={{ marginTop: 4 }}>
              <AppText variant="title">
                {formatMoney(totalAvailable)}
              </AppText>
            </View>

            <AppText variant="muted">
              Available across all household budgets.
            </AppText>
          </View>

          <View style={{ marginLeft: 12 }}>
            <AppButton
              title="Add Household"
              onPress={onCreate}
            />
          </View>
        </AppRow>
      </AppCard>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Income"
            value={formatMoney(totalIncome)}
            caption="Combined monthly"
            tone="primary"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Spent"
            value={formatMoney(totalSpent)}
            caption="Shared activity"
            tone={
              totalSpent > totalIncome
                ? "danger"
                : "warning"
            }
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Assigned"
            value={formatMoney(totalAssigned)}
            caption="Planned funds"
            tone="primary"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Households"
            value={String(households.length)}
            caption="Active budgets"
            tone="success"
          />
        </View>
      </View>

      <AppCard>
        <AppText variant="section">
          Your Households
        </AppText>

        <View style={{ marginTop: 4 }}>
          <AppText variant="muted">
            Each household has its own budget, calendar,
            transactions, and affordability tools.
          </AppText>
        </View>

        {households.length === 0 ? (
          <View style={{ marginTop: 14, gap: 14 }}>
            <EmptyState message="Create a household to manage shared income, bills, spending, and savings in one place." />

            <AppButton
              title="Set Up Your First Household"
              onPress={onCreate}
            />
          </View>
        ) : (
          <View style={{ marginTop: 14, gap: 12 }}>
            {households.map((household) => {
              const assigned =
                getBudgetTotal(household.budget.bills) +
                getBudgetTotal(
                  household.budget.spending
                ) +
                getBudgetTotal(
                  household.budget.savings
                );

              const spent =
                getSpentTotal(household.budget.bills) +
                getSpentTotal(
                  household.budget.spending
                ) +
                getSpentTotal(
                  household.budget.savings
                );

              const remaining =
                household.budget.householdIncome - spent;

              const unassigned =
                household.budget.householdIncome -
                assigned;

              return (
                <Pressable
                  key={household.id}
                  onPress={() => onOpen(household)}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <AppCard>
                    <AppRow>
                      <View style={{ flex: 1 }}>
                        <AppText variant="bold">
                          {household.name}
                        </AppText>

                        <AppText variant="muted">
                          {household.members} contributor
                          {household.members === 1
                            ? ""
                            : "s"}
                        </AppText>
                      </View>

                      <View
                        style={{
                          alignItems: "flex-end",
                        }}
                      >
                        <AppText variant="bold">
                          {formatMoney(remaining)}
                        </AppText>

                        <AppText variant="muted">
                          available
                        </AppText>
                      </View>
                    </AppRow>

                    {household.description ? (
                      <View style={{ marginTop: 10 }}>
                        <AppText variant="muted">
                          {household.description}
                        </AppText>
                      </View>
                    ) : null}

                    <View
                      style={{
                        marginTop: 14,
                        gap: 8,
                      }}
                    >
                      <AppRow>
                        <AppText variant="muted">
                          Monthly income
                        </AppText>

                        <AppText variant="bold">
                          {formatMoney(
                            household.budget
                              .householdIncome
                          )}
                        </AppText>
                      </AppRow>

                      <AppRow>
                        <AppText variant="muted">
                          Assigned
                        </AppText>

                        <AppText variant="bold">
                          {formatMoney(assigned)}
                        </AppText>
                      </AppRow>

                      <AppRow>
                        <AppText variant="muted">
                          Spent
                        </AppText>

                        <AppText variant="bold">
                          {formatMoney(spent)}
                        </AppText>
                      </AppRow>

                      <AppRow>
                        <AppText variant="muted">
                          Unassigned
                        </AppText>

                        <AppText variant="bold">
                          {formatMoney(unassigned)}
                        </AppText>
                      </AppRow>
                    </View>

                    <View style={{ marginTop: 14 }}>
                      <AppText variant="muted">
                        Open household workspace →
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