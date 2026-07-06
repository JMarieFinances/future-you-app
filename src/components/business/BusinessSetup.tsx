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
import { updateBusiness } from "@/lib/businessStore";
import { BudgetItem, Business } from "@/lib/types";
import { useState } from "react";
import { View } from "react-native";
import { BusinessSectionKey, businessSections } from "./businessData";

export default function BusinessSetup({
  business,
  onBack,
  onSave,
}: {
  business: Business;
  onBack: () => void;
  onSave: (business: Business) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const startingValues: Record<string, string> = {};

    businessSections.forEach((section) => {
      section.items.forEach((item) => {
        const saved = business.budget[section.key].find(
          (budgetItem) => budgetItem.name === item
        );

        startingValues[`${section.key}-${item}`] = saved
          ? String(saved.budget)
          : "";
      });
    });

    return startingValues;
  });

  const buildItems = (section: BusinessSectionKey): BudgetItem[] => {
    const preset = businessSections.find((item) => item.key === section);
    if (!preset) return [];

    return preset.items
      .map((name) => {
        const saved = business.budget[section].find(
          (item) => item.name === name
        );

        return {
          id: `${section}-${name}`,
          name,
          budget: Number(values[`${section}-${name}`]) || 0,
          spent: saved?.spent ?? 0,
        };
      })
      .filter((item) => item.budget > 0);
  };

  const revenueSources = buildItems("revenueSources");
  const operatingExpenses = buildItems("operatingExpenses");
  const businessSpending = buildItems("businessSpending");
  const businessSavings = buildItems("businessSavings");

  const businessIncome = getBudgetTotal(revenueSources);
  const assigned =
    getBudgetTotal(operatingExpenses) +
    getBudgetTotal(businessSpending) +
    getBudgetTotal(businessSavings);
  const spent =
    getSpentTotal(operatingExpenses) +
    getSpentTotal(businessSpending) +
    getSpentTotal(businessSavings);

  const unassigned = businessIncome - assigned;
  const remainingAfterSpent = businessIncome - spent;

  const handleSave = async () => {
    const updated: Business = {
      ...business,
      budget: {
        businessIncome,
        revenueSources,
        operatingExpenses,
        businessSpending,
        businessSavings,
      },
    };

    await updateBusiness(updated.id, updated);
    onSave(updated);
  };

  return (
    <AppPage>
      <AppButton title="Back" onPress={onBack} variant="outline" />

      <PageHeader
        title={business.name}
        subtitle="Build the monthly operating blueprint for your business."
      />

      <AppCard>
        <AppText variant="muted">Business Budget Setup</AppText>

        <View style={{ marginTop: 4 }}>
          <AppText variant="title">${businessIncome.toFixed(0)}</AppText>
        </View>

        <AppText variant="muted">
          Total monthly revenue planned for this business.
        </AppText>

        <View style={{ marginTop: 14 }}>
          <ProgressBar
            percent={businessIncome > 0 ? (assigned / businessIncome) * 100 : 0}
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
            value={`$${unassigned.toFixed(0)}`}
            caption="Left to plan"
            tone={unassigned < 0 ? "danger" : "success"}
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

      {businessSections.map((section) => {
        const sectionTotal = getBudgetTotal(buildItems(section.key));

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

              {businessIncome > 0 ? (
                <AppText variant="bold">
                  {((sectionTotal / businessIncome) * 100).toFixed(0)}%
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

      <AppButton title="Save Business Budget" onPress={handleSave} />
    </AppPage>
  );
}