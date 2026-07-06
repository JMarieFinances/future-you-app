import ProgressBar from "@/components/budget/ProgressBar";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppPage from "@/components/ui/AppPage";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import { updateAppData } from "@/lib/appStore";
import type { CalendarEvent } from "@/lib/calendarStore";
import { getPlanData } from "@/lib/planStore";
import type { Goal, PlanData } from "@/lib/types";
import { useTheme } from "@/lib/useTheme";
import { useFocusEffect } from "expo-router";
import { ReactNode, useCallback, useMemo, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

type DetailType = "income" | "obligation" | "subscription" | "debt" | "lifestyle";

type EditingItem =
  | {
      type: DetailType;
      label: string;
      value: number;
      dueDay?: number;
    }
  | {
      type: "goal";
      goalId: string;
      label: string;
      value: number;
    };

const bucketColors = {
  income: "#10b981",
  obligation: "#ef4444",
  subscription: "#8b5cf6",
  debt: "#f59e0b",
  lifestyle: "#0ea5e9",
  goals: "#eab308",
};

const recommendedIncomeCategories = [
  "Paycheck",
  "Side Hustle",
  "Freelance",
  "Business Income",
  "Other Income",
];

const recommendedFixedExpenseCategories = [
  "Rent / Mortgage",
  "Electricity",
  "Water",
  "Gas",
  "Internet",
  "Phone",
  "Insurance",
  "Transportation",
];

const recommendedSubscriptionCategories = [
  "Netflix",
  "Spotify",
  "Hulu",
  "Disney+",
  "Amazon Prime",
  "ChatGPT",
  "Gym Membership",
  "iCloud",
  "Google One",
  "Xbox Game Pass",
  "PlayStation Plus",
];

const recommendedDebtCategories = [
  "Credit Card",
  "Student Loan",
  "Car Loan",
  "Personal Loan",
  "Medical Debt",
  "Other Debt",
];

const recommendedLifestyleCategories = [
  "Groceries",
  "Dining Out",
  "Gas",
  "Shopping",
  "Entertainment",
  "Travel",
  "Personal Care",
  "Hobbies",
  "Miscellaneous",
];

export default function PlanTab() {
  const { colors } = useTheme();
  const [plan, setPlan] = useState(() => recalculatePlan(getPlanData()));
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [editingDueDay, setEditingDueDay] = useState("");
  const [newItemModal, setNewItemModal] = useState<DetailType | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [newItemDueDay, setNewItemDueDay] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    income: true,
    obligation: true,
    subscription: true,
    debt: false,
    lifestyle: false,
    goals: true,
    formula: false,
    review: false,
    recommendations: true,
  });

  useFocusEffect(
    useCallback(() => {
      setPlan(recalculatePlan(getPlanData()));
    }, [])
  );

  const subscriptionsTotal = plan.subscriptions ?? 0;
  const fixedTotal = plan.obligations;
  const protectedTotal = fixedTotal + subscriptionsTotal + plan.debt + plan.goalContributions;
  const flexibleTotal = plan.lifestyle;

  const finalSafeToSpend =
    plan.income -
    plan.obligations -
    subscriptionsTotal -
    plan.debt -
    plan.lifestyle -
    plan.goalContributions;

  const savingsRate = percentOf(plan.goalContributions, plan.income);
  const fixedRate = percentOf(fixedTotal, plan.income);
  const subscriptionRate = percentOf(subscriptionsTotal, plan.income);
  const debtRate = percentOf(plan.debt, plan.income);
  const lifestyleRate = percentOf(plan.lifestyle, plan.income);
  const protectedRate = percentOf(protectedTotal, plan.income);

  const planScore = getPlanScore({
    safeToSpend: finalSafeToSpend,
    savingsRate,
    protectedRate,
    debtRate,
    income: plan.income,
  });

  const monthlyReview = useMemo(
    () =>
      getMonthlyReview({
        plan,
        safeToSpend: finalSafeToSpend,
        subscriptionsTotal,
      }),
    [plan, finalSafeToSpend, subscriptionsTotal]
  );

  const recommendations = getRecommendations({
    plan,
    safeToSpend: finalSafeToSpend,
    savingsRate,
    protectedRate,
    lifestyleRate,
    debtRate,
    subscriptionsTotal,
  });

  const savePlan = async (nextPlan: PlanData) => {
    const recalculated = recalculatePlan(nextPlan);
    setPlan(recalculated);

    await updateAppData((app) => {
      app.personalPlan = {
        ...app.personalPlan,
        ...recalculated,
      };

      app.calendarEvents = syncBudgetCalendarEvents(
        app.calendarEvents ?? [],
        recalculated
      );
    });
  };

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const openEdit = (item: EditingItem) => {
    setEditingItem(item);
    setEditingValue(String(item.value));

    if (item.type === "obligation") {
      setEditingDueDay(String(plan.obligationDueDates?.[item.label] ?? ""));
    } else if (item.type === "subscription") {
      setEditingDueDay(String(plan.subscriptionDueDates?.[item.label] ?? ""));
    } else {
      setEditingDueDay("");
    }
  };

  const saveEdit = async () => {
    if (!editingItem) return;

    const newValue = Number(editingValue) || 0;
    let updatedPlan: PlanData = normalizePlan(plan);

    if (editingItem.type === "income") {
      updatedPlan = {
        ...updatedPlan,
        incomeDetails: {
          ...updatedPlan.incomeDetails,
          [editingItem.label]: newValue,
        },
      };
    }

    if (editingItem.type === "obligation") {
      updatedPlan = {
        ...updatedPlan,
        obligationDetails: {
          ...updatedPlan.obligationDetails,
          [editingItem.label]: newValue,
        },
        obligationDueDates: {
          ...(updatedPlan.obligationDueDates ?? {}),
          [editingItem.label]: clampDay(editingDueDay),
        },
      };
    }

    if (editingItem.type === "subscription") {
      updatedPlan = {
        ...updatedPlan,
        subscriptionDetails: {
          ...(updatedPlan.subscriptionDetails ?? {}),
          [editingItem.label]: newValue,
        },
        subscriptionDueDates: {
          ...(updatedPlan.subscriptionDueDates ?? {}),
          [editingItem.label]: clampDay(editingDueDay),
        },
      };
    }

    if (editingItem.type === "debt") {
      updatedPlan = {
        ...updatedPlan,
        debtDetails: {
          ...updatedPlan.debtDetails,
          [editingItem.label]: newValue,
        },
      };
    }

    if (editingItem.type === "lifestyle") {
      updatedPlan = {
        ...updatedPlan,
        lifestyleDetails: {
          ...updatedPlan.lifestyleDetails,
          [editingItem.label]: newValue,
        },
      };
    }

    if (editingItem.type === "goal") {
      updatedPlan = {
        ...updatedPlan,
        goals: updatedPlan.goals.map((goal) =>
          goal.id === editingItem.goalId ? { ...goal, monthly: newValue } : goal
        ),
      };
    }

    await savePlan(updatedPlan);
    setEditingItem(null);
    setEditingValue("");
    setEditingDueDay("");
  };

  const addNewItem = async () => {
    if (!newItemModal || !newItemName.trim()) return;

    const amount = Number(newItemAmount) || 0;
    let updatedPlan: PlanData = normalizePlan(plan);
    const label = newItemName.trim();

    if (newItemModal === "income") {
      updatedPlan = {
        ...updatedPlan,
        incomeDetails: { ...updatedPlan.incomeDetails, [label]: amount },
      };
    }

    if (newItemModal === "obligation") {
      updatedPlan = {
        ...updatedPlan,
        obligationDetails: { ...updatedPlan.obligationDetails, [label]: amount },
        obligationDueDates: {
          ...(updatedPlan.obligationDueDates ?? {}),
          [label]: clampDay(newItemDueDay),
        },
      };
    }

    if (newItemModal === "subscription") {
      updatedPlan = {
        ...updatedPlan,
        subscriptionDetails: {
          ...(updatedPlan.subscriptionDetails ?? {}),
          [label]: amount,
        },
        subscriptionDueDates: {
          ...(updatedPlan.subscriptionDueDates ?? {}),
          [label]: clampDay(newItemDueDay),
        },
      };
    }

    if (newItemModal === "debt") {
      updatedPlan = {
        ...updatedPlan,
        debtDetails: { ...updatedPlan.debtDetails, [label]: amount },
      };
    }

    if (newItemModal === "lifestyle") {
      updatedPlan = {
        ...updatedPlan,
        lifestyleDetails: { ...updatedPlan.lifestyleDetails, [label]: amount },
      };
    }

    await savePlan(updatedPlan);
    setNewItemModal(null);
    setNewItemName("");
    setNewItemAmount("");
    setNewItemDueDay("");
  };

  const addRecommendedItem = async (type: DetailType, label: string) => {
    let updatedPlan: PlanData = normalizePlan(plan);

    if (type === "income") {
      if (updatedPlan.incomeDetails[label] !== undefined) return;
      updatedPlan = {
        ...updatedPlan,
        incomeDetails: { ...updatedPlan.incomeDetails, [label]: 0 },
      };
    }

    if (type === "obligation") {
      if (updatedPlan.obligationDetails[label] !== undefined) return;
      updatedPlan = {
        ...updatedPlan,
        obligationDetails: { ...updatedPlan.obligationDetails, [label]: 0 },
        obligationDueDates: {
          ...(updatedPlan.obligationDueDates ?? {}),
          [label]: 1,
        },
      };
    }

    if (type === "subscription") {
      if ((updatedPlan.subscriptionDetails ?? {})[label] !== undefined) return;
      updatedPlan = {
        ...updatedPlan,
        subscriptionDetails: {
          ...(updatedPlan.subscriptionDetails ?? {}),
          [label]: 0,
        },
        subscriptionDueDates: {
          ...(updatedPlan.subscriptionDueDates ?? {}),
          [label]: 1,
        },
      };
    }

    if (type === "debt") {
      if (updatedPlan.debtDetails[label] !== undefined) return;
      updatedPlan = {
        ...updatedPlan,
        debtDetails: { ...updatedPlan.debtDetails, [label]: 0 },
      };
    }

    if (type === "lifestyle") {
      if (updatedPlan.lifestyleDetails[label] !== undefined) return;
      updatedPlan = {
        ...updatedPlan,
        lifestyleDetails: { ...updatedPlan.lifestyleDetails, [label]: 0 },
      };
    }

    await savePlan(updatedPlan);
  };

  const removeItem = async (type: DetailType, label: string) => {
    let updatedPlan: PlanData = normalizePlan(plan);

    if (type === "income") {
      const next = { ...updatedPlan.incomeDetails };
      delete next[label];
      updatedPlan = { ...updatedPlan, incomeDetails: next };
    }

    if (type === "obligation") {
      const next = { ...updatedPlan.obligationDetails };
      const due = { ...(updatedPlan.obligationDueDates ?? {}) };
      delete next[label];
      delete due[label];
      updatedPlan = { ...updatedPlan, obligationDetails: next, obligationDueDates: due };
    }

    if (type === "subscription") {
      const next = { ...(updatedPlan.subscriptionDetails ?? {}) };
      const due = { ...(updatedPlan.subscriptionDueDates ?? {}) };
      delete next[label];
      delete due[label];
      updatedPlan = { ...updatedPlan, subscriptionDetails: next, subscriptionDueDates: due };
    }

    if (type === "debt") {
      const next = { ...updatedPlan.debtDetails };
      delete next[label];
      updatedPlan = { ...updatedPlan, debtDetails: next };
    }

    if (type === "lifestyle") {
      const next = { ...updatedPlan.lifestyleDetails };
      delete next[label];
      updatedPlan = { ...updatedPlan, lifestyleDetails: next };
    }

    await savePlan(updatedPlan);
  };

  return (
    <AppPage>
      <PageHeader
        title="Budget"
        subtitle="Build the monthly money system Future You can actually live with."
      />

      <AppCard>
        <AccentLine color={finalSafeToSpend < 0 ? colors.danger : colors.primary} />
        <AppText variant="muted">Safe To Spend</AppText>

        <Text
          style={{
            color: finalSafeToSpend < 0 ? colors.danger : colors.primary,
            fontSize: 46,
            fontWeight: "bold",
            marginTop: 4,
          }}
        >
          ${finalSafeToSpend.toFixed(0)}
        </Text>

        <AppText variant="muted">
          {finalSafeToSpend < 0
            ? "Your budget is overextended. Adjust a bucket before spending."
            : "Available after fixed expenses, subscriptions, debt, lifestyle, and goals."}
        </AppText>
      </AppCard>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Budget Score"
            value={`${planScore.score}/100`}
            caption={planScore.label}
            tone={planScore.tone}
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Savings Rate"
            value={`${savingsRate.toFixed(0)}%`}
            caption="Goal funding"
            tone={savingsRate >= 20 ? "success" : savingsRate >= 10 ? "warning" : "danger"}
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Income"
            value={`$${plan.income.toFixed(0)}`}
            caption="Monthly"
            tone="success"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Protected"
            value={`${protectedRate.toFixed(0)}%`}
            caption="Bills + goals"
            tone={protectedRate > 75 ? "danger" : protectedRate > 60 ? "warning" : "primary"}
          />
        </View>
      </View>

      <AppCard>
        <AppText variant="section">Monthly Allocation</AppText>

        <View style={{ marginTop: 12, gap: 12 }}>
          <AllocationRow label="Income" amount={plan.income} percent={100} color={bucketColors.income} />
          <AllocationRow label="Fixed Expenses" amount={plan.obligations} percent={fixedRate} color={bucketColors.obligation} />
          <AllocationRow label="Subscriptions" amount={subscriptionsTotal} percent={subscriptionRate} color={bucketColors.subscription} />
          <AllocationRow label="Debt" amount={plan.debt} percent={debtRate} color={bucketColors.debt} />
          <AllocationRow label="Lifestyle" amount={plan.lifestyle} percent={lifestyleRate} color={bucketColors.lifestyle} />
          <AllocationRow label="Goals" amount={plan.goalContributions} percent={savingsRate} color={bucketColors.goals} />
          <AllocationRow
            label="Safe To Spend"
            amount={finalSafeToSpend}
            percent={percentOf(finalSafeToSpend, plan.income)}
            color={finalSafeToSpend < 0 ? colors.danger : colors.primary}
          />
        </View>
      </AppCard>

      <MoneySection
        title="Income"
        type="income"
        accentColor={bucketColors.income}
        data={plan.incomeDetails}
        total={plan.income}
        income={plan.income}
        suggested={recommendedIncomeCategories}
        isOpen={openSections.income}
        onToggle={() => toggleSection("income")}
        onEdit={openEdit}
        onAdd={() => setNewItemModal("income")}
        onAddSuggested={addRecommendedItem}
        onRemove={removeItem}
      />

      <MoneySection
        title="Fixed Expenses"
        type="obligation"
        accentColor={bucketColors.obligation}
        data={plan.obligationDetails}
        dueDates={plan.obligationDueDates ?? {}}
        total={plan.obligations}
        income={plan.income}
        suggested={recommendedFixedExpenseCategories}
        isOpen={openSections.obligation}
        onToggle={() => toggleSection("obligation")}
        onEdit={openEdit}
        onAdd={() => setNewItemModal("obligation")}
        onAddSuggested={addRecommendedItem}
        onRemove={removeItem}
      />

      <MoneySection
        title="Subscriptions"
        type="subscription"
        accentColor={bucketColors.subscription}
        data={plan.subscriptionDetails ?? {}}
        dueDates={plan.subscriptionDueDates ?? {}}
        total={subscriptionsTotal}
        income={plan.income}
        suggested={recommendedSubscriptionCategories}
        isOpen={openSections.subscription}
        onToggle={() => toggleSection("subscription")}
        onEdit={openEdit}
        onAdd={() => setNewItemModal("subscription")}
        onAddSuggested={addRecommendedItem}
        onRemove={removeItem}
      />

      <MoneySection
        title="Debt"
        type="debt"
        accentColor={bucketColors.debt}
        data={plan.debtDetails}
        total={plan.debt}
        income={plan.income}
        suggested={recommendedDebtCategories}
        isOpen={openSections.debt}
        onToggle={() => toggleSection("debt")}
        onEdit={openEdit}
        onAdd={() => setNewItemModal("debt")}
        onAddSuggested={addRecommendedItem}
        onRemove={removeItem}
      />

      <MoneySection
        title="Lifestyle"
        type="lifestyle"
        accentColor={bucketColors.lifestyle}
        data={plan.lifestyleDetails}
        total={plan.lifestyle}
        income={plan.income}
        suggested={recommendedLifestyleCategories}
        isOpen={openSections.lifestyle}
        onToggle={() => toggleSection("lifestyle")}
        onEdit={openEdit}
        onAdd={() => setNewItemModal("lifestyle")}
        onAddSuggested={addRecommendedItem}
        onRemove={removeItem}
      />

      <GoalContributionSection
        goals={plan.goals.filter((goal) => !goal.archived)}
        income={plan.income}
        total={plan.goalContributions}
        accentColor={bucketColors.goals}
        isOpen={openSections.goals}
        onToggle={() => toggleSection("goals")}
        onEdit={openEdit}
      />

      <CollapsibleCard
        title="Monthly Review"
        subtitle="Quick summary of your budget."
        isOpen={openSections.review}
        onToggle={() => toggleSection("review")}
      >
        <View style={{ gap: 10 }}>
          {monthlyReview.map((item) => (
            <AppRow key={item.label}>
              <AppText variant="muted">{item.label}</AppText>
              <AppText variant="bold">{item.value}</AppText>
            </AppRow>
          ))}
        </View>
      </CollapsibleCard>

      <CollapsibleCard
        title="Safe To Spend Formula"
        subtitle="How Future You calculates your spending money."
        isOpen={openSections.formula}
        onToggle={() => toggleSection("formula")}
      >
        <View style={{ gap: 10 }}>
          <FormulaRow label="Income" value={plan.income} tone="positive" />
          <FormulaRow label="Fixed Expenses" value={plan.obligations} tone="negative" />
          <FormulaRow label="Subscriptions" value={subscriptionsTotal} tone="negative" />
          <FormulaRow label="Debt" value={plan.debt} tone="negative" />
          <FormulaRow label="Lifestyle" value={plan.lifestyle} tone="negative" />
          <FormulaRow label="Goals" value={plan.goalContributions} tone="negative" />
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />
          <FormulaRow label="Safe To Spend" value={finalSafeToSpend} tone={finalSafeToSpend < 0 ? "negative" : "positive"} strong />
        </View>
      </CollapsibleCard>

      <CollapsibleCard
        title="Recommendations"
        subtitle={`${recommendations.length} insight${recommendations.length === 1 ? "" : "s"} for this budget.`}
        isOpen={openSections.recommendations}
        onToggle={() => toggleSection("recommendations")}
      >
        <View style={{ gap: 8 }}>
          {recommendations.length === 0 ? (
            <ThemedEmpty message="Your budget looks balanced. Keep funding Future You first." />
          ) : (
            recommendations.map((rec) => (
              <AppText key={rec} variant="muted">
                {rec}
              </AppText>
            ))
          )}
        </View>
      </CollapsibleCard>

      <EditAmountModal
        item={editingItem}
        value={editingValue}
        dueDay={editingDueDay}
        onChangeValue={setEditingValue}
        onChangeDueDay={setEditingDueDay}
        onSave={saveEdit}
        onClose={() => {
          setEditingItem(null);
          setEditingValue("");
          setEditingDueDay("");
        }}
      />

      <AddItemModal
        visible={newItemModal !== null}
        type={newItemModal}
        name={newItemName}
        amount={newItemAmount}
        dueDay={newItemDueDay}
        onChangeName={setNewItemName}
        onChangeAmount={setNewItemAmount}
        onChangeDueDay={setNewItemDueDay}
        onSave={addNewItem}
        onClose={() => {
          setNewItemModal(null);
          setNewItemName("");
          setNewItemAmount("");
          setNewItemDueDay("");
        }}
      />
    </AppPage>
  );
}

function AccentLine({ color }: { color: string }) {
  return (
    <View
      style={{
        height: 5,
        borderRadius: 999,
        backgroundColor: color,
        marginBottom: 12,
      }}
    />
  );
}

function CollapsibleCard({
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <AppCard>
      <Pressable onPress={onToggle}>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="section">{title}</AppText>
            {subtitle ? <AppText variant="muted">{subtitle}</AppText> : null}
          </View>

          <AppText variant="bold">{isOpen ? "Hide" : "Show"}</AppText>
        </AppRow>
      </Pressable>

      {isOpen ? <View style={{ marginTop: 14 }}>{children}</View> : null}
    </AppCard>
  );
}

function MoneySection({
  title,
  type,
  accentColor,
  data,
  dueDates = {},
  total,
  income,
  suggested,
  isOpen,
  onToggle,
  onEdit,
  onAdd,
  onAddSuggested,
  onRemove,
}: {
  title: string;
  type: DetailType;
  accentColor: string;
  data: Record<string, number>;
  dueDates?: Record<string, number>;
  total: number;
  income: number;
  suggested: string[];
  isOpen: boolean;
  onToggle: () => void;
  onEdit: (item: EditingItem) => void;
  onAdd: () => void;
  onAddSuggested: (type: DetailType, label: string) => void;
  onRemove: (type: DetailType, label: string) => void;
}) {
  const { colors } = useTheme();
  const entries = Object.entries(data);
  const percent = percentOf(total, income);
  const missingSuggestions = suggested.filter((item) => data[item] === undefined);
  const hasDueDates = type === "obligation" || type === "subscription";

  return (
    <AppCard>
      <AccentLine color={accentColor} />
      <Pressable onPress={onToggle}>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="section">{title}</AppText>
            <AppText variant="muted">
              ${total.toFixed(2)} • {percent.toFixed(1)}% of income
            </AppText>
          </View>

          <AppText variant="bold">{isOpen ? "Hide" : "Show"}</AppText>
        </AppRow>
      </Pressable>

      <View style={{ marginTop: 12 }}>
        <ProgressBar percent={percent} />
      </View>

      {isOpen ? (
        <View style={{ marginTop: 12 }}>
          <AppButton title="Add Item" onPress={onAdd} variant="outline" />

          {entries.length === 0 ? (
            <View style={{ marginTop: 12 }}>
              <ThemedEmpty message="Nothing here yet. Add a line item to make your budget more accurate." />
            </View>
          ) : (
            <View style={{ marginTop: 12, gap: 8 }}>
              {entries.map(([label, amount]) => (
                <View
                  key={label}
                  style={{
                    borderLeftWidth: 5,
                    borderLeftColor: accentColor,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 14,
                    padding: 12,
                    backgroundColor: "transparent",
                  }}
                >
                  <AppRow>
                    <Pressable
                      onPress={() =>
                        onEdit({
                          type,
                          label,
                          value: amount,
                          dueDay: dueDates[label],
                        })
                      }
                      style={{ flex: 1 }}
                    >
                      <AppText variant="bold">{label}</AppText>
                      <AppText variant="muted">
                        {percentOf(amount, income).toFixed(1)}% of income
                        {hasDueDates && dueDates[label] ? ` • Due day ${dueDates[label]}` : ""}
                      </AppText>
                    </Pressable>

                    <View style={{ alignItems: "flex-end" }}>
                      <AppText variant="bold">${amount.toFixed(2)}</AppText>
                      <Pressable onPress={() => onRemove(type, label)}>
                        <Text style={{ color: colors.danger, fontWeight: "600", marginTop: 4 }}>
                          Remove
                        </Text>
                      </Pressable>
                    </View>
                  </AppRow>
                </View>
              ))}
            </View>
          )}

          {missingSuggestions.length > 0 ? (
            <View style={{ marginTop: 14 }}>
              <AppText variant="bold">Quick add</AppText>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {missingSuggestions.slice(0, 8).map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => onAddSuggested(type, item)}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 999,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                    }}
                  >
                    <AppText variant="muted">+ {item}</AppText>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
    </AppCard>
  );
}

function GoalContributionSection({
  goals,
  income,
  total,
  accentColor,
  isOpen,
  onToggle,
  onEdit,
}: {
  goals: Goal[];
  income: number;
  total: number;
  accentColor: string;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: (item: EditingItem) => void;
}) {
  return (
    <AppCard>
      <AccentLine color={accentColor} />
      <Pressable onPress={onToggle}>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="section">Goals</AppText>
            <AppText variant="muted">
              ${total.toFixed(2)} • {percentOf(total, income).toFixed(1)}% of income
            </AppText>
          </View>

          <AppText variant="bold">{isOpen ? "Hide" : "Show"}</AppText>
        </AppRow>
      </Pressable>

      <View style={{ marginTop: 12 }}>
        <ProgressBar percent={percentOf(total, income)} />
      </View>

      {isOpen ? (
        goals.length === 0 ? (
          <View style={{ marginTop: 12 }}>
            <ThemedEmpty message="No active goals yet. Create a goal to make Future You contributions automatic." />
          </View>
        ) : (
          <View style={{ marginTop: 12, gap: 8 }}>
            {goals.map((goal) => (
              <Pressable
                key={goal.id}
                onPress={() =>
                  onEdit({
                    type: "goal",
                    goalId: goal.id,
                    label: goal.name,
                    value: goal.monthly,
                  })
                }
              >
                <View style={{ paddingVertical: 6 }}>
                  <AppRow>
                    <View>
                      <AppText variant="bold">
                        {goal.emoji} {goal.name}
                      </AppText>
                      <AppText variant="muted">{percentOf(goal.monthly, income).toFixed(1)}% of income</AppText>
                    </View>

                    <AppText variant="bold">${goal.monthly.toFixed(2)}</AppText>
                  </AppRow>
                </View>
              </Pressable>
            ))}
          </View>
        )
      ) : null}
    </AppCard>
  );
}

function ThemedEmpty({ message }: { message: string }) {
  const { colors, theme } = useTheme();

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: "transparent",
        borderRadius: theme.radius.card,
        padding: 16,
      }}
    >
      <AppText variant="muted">{message}</AppText>
    </View>
  );
}

function AllocationRow({
  label,
  amount,
  percent,
  color,
}: {
  label: string;
  amount: number;
  percent: number;
  color: string;
}) {
  const { colors } = useTheme();
  const safePercent = Math.max(0, Math.min(percent, 100));

  return (
    <View>
      <AppRow>
        <AppText variant="muted">{label}</AppText>
        <AppText variant="bold">
          ${amount.toFixed(0)} • {percent.toFixed(0)}%
        </AppText>
      </AppRow>

      <View
        style={{
          height: 10,
          borderRadius: 999,
          backgroundColor: colors.progressTrack,
          overflow: "hidden",
          marginTop: 6,
        }}
      >
        <View style={{ width: `${safePercent}%`, height: "100%", backgroundColor: color }} />
      </View>
    </View>
  );
}

function FormulaRow({
  label,
  value,
  tone,
  strong,
}: {
  label: string;
  value: number;
  tone: "positive" | "negative";
  strong?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <AppRow>
      <AppText variant={strong ? "bold" : "muted"}>{label}</AppText>
      <Text
        style={{
          color: tone === "positive" ? colors.success : colors.danger,
          fontWeight: strong ? "bold" : "600",
        }}
      >
        {tone === "negative" ? "-" : ""}${Math.abs(value).toFixed(2)}
      </Text>
    </AppRow>
  );
}

function EditAmountModal({
  item,
  value,
  dueDay,
  onChangeValue,
  onChangeDueDay,
  onSave,
  onClose,
}: {
  item: EditingItem | null;
  value: string;
  dueDay: string;
  onChangeValue: (value: string) => void;
  onChangeDueDay: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const needsDueDay = item?.type === "obligation" || item?.type === "subscription";

  return (
    <SimpleModal visible={item !== null} title={item?.label ?? "Edit"} onClose={onClose}>
      <AppInput value={value} onChangeText={onChangeValue} keyboardType="numeric" placeholder="Monthly Amount" />
      {needsDueDay ? (
        <>
          <View style={{ height: 10 }} />
          <AppInput value={dueDay} onChangeText={onChangeDueDay} keyboardType="numeric" placeholder="Due Day" />
        </>
      ) : null}
      <View style={{ marginTop: 12, gap: 10 }}>
        <AppButton title="Save Changes" onPress={onSave} />
        <AppButton title="Cancel" onPress={onClose} variant="outline" />
      </View>
    </SimpleModal>
  );
}

function AddItemModal({
  visible,
  type,
  name,
  amount,
  dueDay,
  onChangeName,
  onChangeAmount,
  onChangeDueDay,
  onSave,
  onClose,
}: {
  visible: boolean;
  type: DetailType | null;
  name: string;
  amount: string;
  dueDay: string;
  onChangeName: (value: string) => void;
  onChangeAmount: (value: string) => void;
  onChangeDueDay: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const needsDueDay = type === "obligation" || type === "subscription";

  return (
    <SimpleModal visible={visible} title={`Add ${getTypeLabel(type)}`} onClose={onClose}>
      <AppInput value={name} onChangeText={onChangeName} placeholder="Name" />
      <View style={{ height: 10 }} />
      <AppInput value={amount} onChangeText={onChangeAmount} keyboardType="numeric" placeholder="Monthly Amount" />
      {needsDueDay ? (
        <>
          <View style={{ height: 10 }} />
          <AppInput value={dueDay} onChangeText={onChangeDueDay} keyboardType="numeric" placeholder="Due Day" />
        </>
      ) : null}
      <View style={{ marginTop: 12, gap: 10 }}>
        <AppButton title="Save Item" onPress={onSave} />
        <AppButton title="Cancel" onPress={onClose} variant="outline" />
      </View>
    </SimpleModal>
  );
}

function SimpleModal({
  visible,
  title,
  children,
  onClose,
}: {
  visible: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const { colors, theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,.45)", padding: 24 }}>
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: theme.radius.card,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <AppRow>
            <AppText variant="section">{title}</AppText>
            <Pressable onPress={onClose}>
              <AppText variant="muted">Close</AppText>
            </Pressable>
          </AppRow>

          <View style={{ marginTop: 16 }}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

function normalizePlan(plan: PlanData): PlanData {
  return {
    ...plan,
    subscriptions: plan.subscriptions ?? 0,
    subscriptionDetails: plan.subscriptionDetails ?? {},
    subscriptionDueDates: plan.subscriptionDueDates ?? {},
    obligationDueDates: plan.obligationDueDates ?? {},
  };
}

function recalculatePlan(updatedPlan: PlanData) {
  const normalized = normalizePlan(updatedPlan);
  const income = sumRecord(normalized.incomeDetails);
  const obligations = sumRecord(normalized.obligationDetails);
  const subscriptions = sumRecord(normalized.subscriptionDetails ?? {});
  const debt = sumRecord(normalized.debtDetails);
  const lifestyle = sumRecord(normalized.lifestyleDetails);
  const goalContributions = normalized.goals
    .filter((goal) => !goal.archived)
    .reduce((sum, goal) => sum + goal.monthly, 0);

  return {
    ...normalized,
    income,
    obligations,
    subscriptions,
    debt,
    lifestyle,
    goalContributions,
    safeToSpend: income - obligations - subscriptions - debt - lifestyle - goalContributions,
  };
}

function syncBudgetCalendarEvents(existingEvents: CalendarEvent[], plan: PlanData) {
  const now = new Date();
  const manualEvents = existingEvents.filter(
    (event) =>
      !event.id.startsWith("budget-fixed-") &&
      !event.id.startsWith("budget-subscription-") &&
      !event.id.startsWith("budget-goal-")
  );

  const fixedEvents: CalendarEvent[] = Object.entries(plan.obligationDetails).map(([name, amount]) => ({
    id: `budget-fixed-${slugify(name)}`,
    title: name,
    amount,
    day: plan.obligationDueDates?.[name] ?? 1,
    month: now.getMonth(),
    year: now.getFullYear(),
    type: "bill",
    repeat: "monthly",
    notes: "Generated from Budget fixed expenses.",
    sourceType: "personal",
  }));

  const subscriptionEvents: CalendarEvent[] = Object.entries(plan.subscriptionDetails ?? {}).map(([name, amount]) => ({
    id: `budget-subscription-${slugify(name)}`,
    title: name,
    amount,
    day: plan.subscriptionDueDates?.[name] ?? 1,
    month: now.getMonth(),
    year: now.getFullYear(),
    type: "subscription" as any,
    repeat: "monthly",
    notes: "Generated from Budget subscriptions.",
    sourceType: "personal",
  }));

  const goalEvents: CalendarEvent[] = plan.goals
    .filter((goal) => !goal.archived && goal.monthly > 0)
    .map((goal) => ({
      id: `budget-goal-${goal.id}`,
      title: goal.name,
      amount: goal.monthly,
      day: 5,
      month: now.getMonth(),
      year: now.getFullYear(),
      type: "goal",
      repeat: "monthly",
      notes: "Generated from Budget goal contributions.",
      sourceId: goal.id,
      sourceType: "goal",
    }));

  return [...manualEvents, ...fixedEvents, ...subscriptionEvents, ...goalEvents];
}

function getRecommendations({
  plan,
  safeToSpend,
  savingsRate,
  protectedRate,
  lifestyleRate,
  debtRate,
  subscriptionsTotal,
}: {
  plan: PlanData;
  safeToSpend: number;
  savingsRate: number;
  protectedRate: number;
  lifestyleRate: number;
  debtRate: number;
  subscriptionsTotal: number;
}) {
  const recs: string[] = [];

  if (safeToSpend < 0) {
    recs.push(`Your budget is over by $${Math.abs(safeToSpend).toFixed(0)}/month. Reduce a bucket before spending.`);
  }

  if (safeToSpend >= 0 && safeToSpend < 250) {
    recs.push("Your budget works, but the buffer is tight. Protect at least $250 of monthly breathing room.");
  }

  if (subscriptionsTotal > 0) {
    recs.push(`Subscriptions cost $${subscriptionsTotal.toFixed(0)}/month, or about $${(subscriptionsTotal * 12).toFixed(0)}/year.`);
  }

  if (savingsRate < 10 && plan.income > 0) {
    recs.push("Your savings rate is below 10%. Raising goal contributions even slightly makes Future You stronger.");
  }

  if (protectedRate > 75) {
    recs.push("Protected spending is taking a large share of income. Fixed expenses, debt, and goals may be limiting flexibility.");
  }

  if (lifestyleRate > 30) {
    recs.push("Lifestyle spending is above 30% of income. Dining, shopping, and entertainment are the fastest places to adjust.");
  }

  if (debtRate > 15) {
    recs.push("Debt is taking a large share of income. Extra payoff planning may be the strongest next move.");
  }

  return recs.slice(0, 5);
}

function getMonthlyReview({
  plan,
  safeToSpend,
  subscriptionsTotal,
}: {
  plan: PlanData;
  safeToSpend: number;
  subscriptionsTotal: number;
}) {
  return [
    { label: "Income", value: `$${plan.income.toFixed(2)}` },
    { label: "Fixed Expenses", value: `$${plan.obligations.toFixed(2)}` },
    { label: "Subscriptions", value: `$${subscriptionsTotal.toFixed(2)}` },
    { label: "Debt", value: `$${plan.debt.toFixed(2)}` },
    { label: "Lifestyle", value: `$${plan.lifestyle.toFixed(2)}` },
    { label: "Goals", value: `$${plan.goalContributions.toFixed(2)}` },
    { label: "Safe To Spend", value: `$${safeToSpend.toFixed(2)}` },
  ];
}

function getPlanScore({
  safeToSpend,
  savingsRate,
  protectedRate,
  debtRate,
  income,
}: {
  safeToSpend: number;
  savingsRate: number;
  protectedRate: number;
  debtRate: number;
  income: number;
}) {
  let score = 100;

  if (income <= 0) score -= 40;
  if (safeToSpend < 0) score -= 30;
  if (safeToSpend >= 0 && safeToSpend < 250) score -= 10;
  if (savingsRate < 10) score -= 15;
  if (protectedRate > 75) score -= 15;
  if (debtRate > 15) score -= 10;

  score = Math.max(0, Math.min(score, 100));

  return {
    score,
    label:
      score >= 90
        ? "Excellent"
        : score >= 75
        ? "Healthy"
        : score >= 60
        ? "Watch closely"
        : "Needs attention",
    tone: score >= 80 ? ("success" as const) : score >= 60 ? ("warning" as const) : ("danger" as const),
  };
}

function sumRecord(record: Record<string, number>) {
  return Object.values(record).reduce((sum, value) => sum + value, 0);
}

function percentOf(amount: number, income: number) {
  if (income <= 0) return 0;
  return (amount / income) * 100;
}

function clampDay(value: string | number) {
  return Math.min(Math.max(Number(value) || 1, 1), 31);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function getTypeLabel(type: DetailType | null) {
  if (type === "income") return "Income Source";
  if (type === "obligation") return "Fixed Expense";
  if (type === "subscription") return "Subscription";
  if (type === "debt") return "Debt Payment";
  if (type === "lifestyle") return "Lifestyle Item";
  return "Item";
}
