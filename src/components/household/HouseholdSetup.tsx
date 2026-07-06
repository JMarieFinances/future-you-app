import ProgressBar from "@/components/budget/ProgressBar";
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
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import { updateHousehold } from "@/lib/householdStore";
import { BudgetItem, Household } from "@/lib/types";
import { useState } from "react";
import { View } from "react-native";
import { HouseholdSectionKey, householdSections } from "./householdData";

export default function HouseholdSetup({
  household,
  onBack,
  onSave,
}: {
  household: Household;
  onBack: () => void;
  onSave: (household: Household) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const startingValues: Record<string, string> = {};

    householdSections.forEach((section) => {
      section.items.forEach((item) => {
        const savedItem = household.budget[section.key].find(
          (budgetItem) => budgetItem.name === item
        );

        startingValues[`${section.key}-${item}`] = savedItem
          ? String(savedItem.budget)
          : "";
      });
    });

    return startingValues;
  });

  const buildBudgetItems = (section: HouseholdSectionKey): BudgetItem[] => {
    const preset = householdSections.find((item) => item.key === section);
    if (!preset) return [];

    return preset.items
      .map((itemName) => {
        const savedItem = household.budget[section].find(
          (budgetItem) => budgetItem.name === itemName
        );

        return {
          id: `${section}-${itemName}`,
          name: itemName,
          budget: Number(values[`${section}-${itemName}`]) || 0,
          spent: savedItem?.spent ?? 0,
        };
      })
      .filter((item) => item.budget > 0);
  };

  const incomeSources = buildBudgetItems("incomeSources");
  const bills = buildBudgetItems("bills");
  const spending = buildBudgetItems("spending");
  const savings = buildBudgetItems("savings");

  const householdIncome = getBudgetTotal(incomeSources);
  const assigned =
    getBudgetTotal(bills) + getBudgetTotal(spending) + getBudgetTotal(savings);
  const spent =
    getSpentTotal(bills) + getSpentTotal(spending) + getSpentTotal(savings);
  const remainingAfterPlan = householdIncome - assigned;
  const remainingAfterSpent = householdIncome - spent;

  const handleSave = async () => {
    const updatedHousehold: Household = {
      ...household,
      budget: {
        householdIncome,
        incomeSources,
        bills,
        spending,
        savings,
      },
    };

    await updateHousehold(updatedHousehold.id, updatedHousehold);
    onSave(updatedHousehold);
  };

  return (
    <AppPage>
      <AppButton title="Back" onPress={onBack} variant="outline" />

      <PageHeader
        title={household.name}
        subtitle="Set the monthly blueprint for shared money."
      />

      <AppCard>
        <AppText variant="muted">Household Budget Setup</AppText>

        <View style={{ marginTop: 4 }}>
          <AppText variant="title">${householdIncome.toFixed(0)}</AppText>
        </View>

        <AppText variant="muted">
          Total monthly money available for this household.
        </AppText>

        <View style={{ marginTop: 14 }}>
          <ProgressBar
            percent={householdIncome > 0 ? (assigned / householdIncome) * 100 : 0}
          />
        </View>
      </AppCard>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Assigned"
            value={`$${assigned.toFixed(0)}`}
            caption="Planned"
            tone="primary"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Unassigned"
            value={`$${remainingAfterPlan.toFixed(0)}`}
            caption="Left to plan"
            tone={remainingAfterPlan < 0 ? "danger" : "success"}
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Spent"
            value={`$${spent.toFixed(0)}`}
            caption="Already logged"
            tone="warning"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Remaining"
            value={`$${remainingAfterSpent.toFixed(0)}`}
            caption="After spending"
            tone={remainingAfterSpent < 0 ? "danger" : "success"}
          />
        </View>
      </View>

      {householdSections.map((section) => {
        const sectionTotal = getBudgetTotal(buildBudgetItems(section.key));

        return (
          <AppCard key={section.key}>
            <AppRow>
              <View>
                <AppText variant="section">{section.title}</AppText>
                <AppText variant="muted">
                  {sectionTotal > 0
                    ? `$${sectionTotal.toFixed(0)} planned`
                    : "Fill in what applies."}
                </AppText>
              </View>

              {householdIncome > 0 ? (
                <AppText variant="bold">
                  {((sectionTotal / householdIncome) * 100).toFixed(0)}%
                </AppText>
              ) : null}
            </AppRow>

            <View style={{ marginTop: 14, gap: 12 }}>
              {section.items.map((item) => (
                <AppRow key={item}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bold">{item}</AppText>
                  </View>

                  <AppInput
                    placeholder="$0"
                    value={values[`${section.key}-${item}`]}
                    onChangeText={(text) =>
                      setValues((prev) => ({
                        ...prev,
                        [`${section.key}-${item}`]: text,
                      }))
                    }
                    keyboardType="numeric"
                    style={{
                      width: 130,
                      textAlign: "right",
                    }}
                  />
                </AppRow>
              ))}
            </View>
          </AppCard>
        );
      })}

      <AppButton title="Save Household Budget" onPress={handleSave} />
    </AppPage>
  );
}