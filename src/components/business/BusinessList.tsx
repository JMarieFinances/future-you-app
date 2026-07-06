import {
  getBudgetTotal,
  getSpentTotal,
} from "@/components/budget/budgetUtils";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppPage from "@/components/ui/AppPage";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import EmptyState from "@/components/ui/EmptyState";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import { addBusiness, getBusinesses } from "@/lib/businessStore";
import { Business } from "@/lib/types";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";

export default function BusinessList({
  onCreate,
  onOpen,
}: {
  onCreate: (business: Business) => void;
  onOpen: (business: Business) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [businessType, setBusinessType] = useState("Side Hustle");
  const [, forceUpdate] = useState(0);

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

  const handleCreate = async () => {
    if (!name.trim()) return;

    const newBusiness: Business = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description.trim(),
      businessType: businessType.trim(),
      budget: {
        businessIncome: 0,
        revenueSources: [],
        operatingExpenses: [],
        businessSpending: [],
        businessSavings: [],
      },
    };

    await addBusiness(newBusiness);

    setName("");
    setDescription("");
    setBusinessType("Side Hustle");

    forceUpdate((prev) => prev + 1);
    onCreate(newBusiness);
  };

  return (
    <AppPage>
      <AppButton title="Back to Profile" onPress={() => router.back()} variant="outline" />

      <PageHeader
        title="Businesses"
        subtitle="Manage revenue, expenses, cash flow and growth."
      />

      <AppCard>
        <AppText variant="muted">Business HQ</AppText>

        <View style={{ marginTop: 4 }}>
          <AppText variant="title">${totalRevenue.toFixed(0)}</AppText>
        </View>

        <AppText variant="muted">Combined revenue across all businesses.</AppText>
      </AppCard>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Assigned"
            value={`$${totalAssigned.toFixed(0)}`}
            caption="Operating budget"
            tone="primary"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Spent"
            value={`$${totalSpent.toFixed(0)}`}
            caption="Business activity"
            tone={totalSpent > totalAssigned ? "danger" : "warning"}
          />
        </View>
      </View>

      <AppCard>
        <AppText variant="section">Create Business</AppText>

        <View style={{ marginTop: 12, gap: 12 }}>
          <AppInput placeholder="Business Name" value={name} onChangeText={setName} />

          <AppInput
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
          />

          <AppInput
            placeholder="Business Type"
            value={businessType}
            onChangeText={setBusinessType}
          />

          <AppButton title="Create Business" onPress={handleCreate} />
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="section">Your Businesses</AppText>

        {businesses.length === 0 ? (
          <View style={{ marginTop: 10 }}>
            <EmptyState message="Create your first business to begin tracking revenue and expenses." />
          </View>
        ) : (
          <View style={{ marginTop: 12, gap: 12 }}>
            {businesses.map((business) => {
              const assigned =
                getBudgetTotal(business.budget.operatingExpenses) +
                getBudgetTotal(business.budget.businessSpending) +
                getBudgetTotal(business.budget.businessSavings);

              const spent =
                getSpentTotal(business.budget.operatingExpenses) +
                getSpentTotal(business.budget.businessSpending) +
                getSpentTotal(business.budget.businessSavings);

              const remaining = business.budget.businessIncome - spent;

              return (
                <Pressable key={business.id} onPress={() => onOpen(business)}>
                  <AppCard>
                    <AppRow>
                      <View>
                        <AppText variant="bold">{business.name}</AppText>
                        <AppText variant="muted">{business.businessType}</AppText>
                      </View>

                      <AppText variant="bold">${remaining.toFixed(0)} left</AppText>
                    </AppRow>

                    {business.description ? (
                      <View style={{ marginTop: 8 }}>
                        <AppText variant="muted">{business.description}</AppText>
                      </View>
                    ) : null}

                    <View style={{ marginTop: 12, gap: 6 }}>
                      <AppRow>
                        <AppText variant="muted">Revenue</AppText>
                        <AppText variant="bold">
                          ${business.budget.businessIncome.toFixed(0)}
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