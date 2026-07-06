import { getBudgetTotal, getSpentTotal } from "@/components/budget/budgetUtils";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppPage from "@/components/ui/AppPage";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import EmptyState from "@/components/ui/EmptyState";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import { addHousehold, getHouseholds } from "@/lib/householdStore";
import { Household } from "@/lib/types";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";

export default function HouseholdList({
  onCreate,
  onOpen,
}: {
  onCreate: (household: Household) => void;
  onOpen: (household: Household) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState("1");
  const [, forceUpdate] = useState(0);

  const households = getHouseholds();

  const totalIncome = households.reduce(
    (sum, household) => sum + household.budget.householdIncome,
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

  const handleCreate = async () => {
    if (!name.trim()) return;

    const newHousehold: Household = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description.trim(),
      members: Number(members) || 1,
      budget: {
        householdIncome: 0,
        incomeSources: [],
        bills: [],
        spending: [],
        savings: [],
      },
    };

    await addHousehold(newHousehold);

    setName("");
    setDescription("");
    setMembers("1");

    forceUpdate((prev) => prev + 1);
    onCreate(newHousehold);
  };

  return (
    <AppPage>
      <AppButton title="Back to Profile" onPress={() => router.back()} variant="outline" />

      <PageHeader
        title="Households"
        subtitle="Manage shared money, bills, spending, and household savings."
      />

      <AppCard>
        <AppText variant="muted">Shared Money Hub</AppText>

        <View style={{ marginTop: 4 }}>
          <AppText variant="title">${totalIncome.toFixed(0)}</AppText>
        </View>

        <AppText variant="muted">
          Total household income across all shared budgets.
        </AppText>
      </AppCard>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Assigned"
            value={`$${totalAssigned.toFixed(0)}`}
            caption="Planned"
            tone="primary"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Spent"
            value={`$${totalSpent.toFixed(0)}`}
            caption="Logged"
            tone={totalSpent > totalAssigned ? "danger" : "warning"}
          />
        </View>
      </View>

      <AppCard>
        <AppText variant="section">Create Household</AppText>

        <View style={{ marginTop: 12, gap: 12 }}>
          <AppInput
            placeholder="Household name"
            value={name}
            onChangeText={setName}
          />

          <AppInput
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
          />

          <AppInput
            placeholder="Number of contributors"
            value={members}
            onChangeText={setMembers}
            keyboardType="numeric"
          />

          <AppButton title="Create Household" onPress={handleCreate} />
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="section">Your Households</AppText>

        {households.length === 0 ? (
          <View style={{ marginTop: 10 }}>
            <EmptyState message="No households yet. Create one to manage shared bills and spending." />
          </View>
        ) : (
          <View style={{ marginTop: 12, gap: 12 }}>
            {households.map((household) => {
              const assigned =
                getBudgetTotal(household.budget.bills) +
                getBudgetTotal(household.budget.spending) +
                getBudgetTotal(household.budget.savings);

              const spent =
                getSpentTotal(household.budget.bills) +
                getSpentTotal(household.budget.spending) +
                getSpentTotal(household.budget.savings);

              const remaining = household.budget.householdIncome - spent;

              return (
                <Pressable key={household.id} onPress={() => onOpen(household)}>
                  <AppCard>
                    <AppRow>
                      <View>
                        <AppText variant="bold">{household.name}</AppText>

                        <AppText variant="muted">
                          {household.members} contributor
                          {household.members === 1 ? "" : "s"}
                          {household.description ? ` · ${household.description}` : ""}
                        </AppText>
                      </View>

                      <AppText variant="bold">${remaining.toFixed(0)} left</AppText>
                    </AppRow>

                    <View style={{ marginTop: 10, gap: 6 }}>
                      <AppRow>
                        <AppText variant="muted">Income</AppText>
                        <AppText variant="bold">
                          ${household.budget.householdIncome.toFixed(0)}
                        </AppText>
                      </AppRow>

                      <AppRow>
                        <AppText variant="muted">Assigned</AppText>
                        <AppText variant="bold">${assigned.toFixed(0)}</AppText>
                      </AppRow>

                      <AppRow>
                        <AppText variant="muted">Spent</AppText>
                        <AppText variant="bold">${spent.toFixed(0)}</AppText>
                      </AppRow>
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