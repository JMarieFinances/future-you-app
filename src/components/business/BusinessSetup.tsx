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
import {
  addBusiness,
  updateBusiness,
} from "@/lib/businessStore";
import { BudgetItem, Business } from "@/lib/types";
import { useMemo, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import {
  BusinessSectionKey,
  businessSections,
} from "./businessData";

type SetupStep =
  | {
      type: "details";
      title: string;
      subtitle: string;
    }
  | {
      type: "budget";
      sectionKey: BusinessSectionKey;
      title: string;
      subtitle: string;
    }
  | {
      type: "income-mode";
      title: string;
      subtitle: string;
    }
  | {
      type: "review";
      title: string;
      subtitle: string;
    };

const cleanAmount = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");

  if (parts.length <= 1) {
    return cleaned;
  }

  return `${parts[0]}.${parts.slice(1).join("")}`;
};

const formatMoney = (amount: number) =>
  `$${amount.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;

export default function BusinessSetup({
  business,
  onBack,
  onSave,
}: {
  business?: Business;
  onBack: () => void;
  onSave: (business: Business) => void;
}) {
  const isEditing = Boolean(business);

  const steps = useMemo<SetupStep[]>(() => {
    return [
      {
        type: "details",
        title: "Business Details",
        subtitle: "Set up the basics for this business.",
      },
      ...businessSections.map<SetupStep>((section) => ({
        type: "budget",
        sectionKey: section.key,
        title: section.title,
        subtitle:
          section.key === "revenueSources"
            ? "Enter the monthly income this business receives."
            : "Enter the monthly amount for each category that applies.",
      })),
      {
        type: "income-mode",
        title: "Personal Income",
        subtitle:
          "Choose how this business connects to your personal budget.",
      },
      {
        type: "review",
        title: "Review Business",
        subtitle: "Review the plan before saving.",
      },
    ];
  }, []);

  const [stepIndex, setStepIndex] = useState(0);

  const [name, setName] = useState(business?.name ?? "");
  const [description, setDescription] = useState(
    business?.description ?? ""
  );
  const [businessType, setBusinessType] = useState(
    business?.businessType ?? "Side Hustle"
  );

  const [incomeMode, setIncomeMode] = useState<
    "main" | "combined" | "separate"
  >(business?.incomeMode ?? "separate");

  const [ownerPay, setOwnerPay] = useState(
    business?.ownerPay ? String(business.ownerPay) : ""
  );

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initialValues: Record<string, string> = {};

    businessSections.forEach((section) => {
      section.items.forEach((itemName) => {
        const savedItem = business?.budget[section.key]?.find(
          (item) => item.name === itemName
        );

        initialValues[`${section.key}-${itemName}`] = savedItem
          ? String(savedItem.budget)
          : "";
      });
    });

    return initialValues;
  });

  const currentStep = steps[stepIndex];
  const progress = ((stepIndex + 1) / steps.length) * 100;

  const buildItems = (
    sectionKey: BusinessSectionKey
  ): BudgetItem[] => {
    const section = businessSections.find(
      (item) => item.key === sectionKey
    );

    if (!section) {
      return [];
    }

    return section.items
      .map((itemName) => {
        const savedItem = business?.budget[sectionKey]?.find(
          (item) => item.name === itemName
        );

        return {
          id:
            savedItem?.id ??
            `${sectionKey}-${itemName
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")}`,
          name: itemName,
          budget:
            Number(values[`${sectionKey}-${itemName}`]) || 0,
          spent: savedItem?.spent ?? 0,
        };
      })
      .filter((item) => item.budget > 0);
  };

  const revenueSources = buildItems("revenueSources");
  const operatingExpenses = buildItems("operatingExpenses");
  const businessSpending = buildItems("businessSpending");
  const businessSavings = buildItems("businessSavings");

  const businessIncome = getBudgetTotal(revenueSources);

  const operatingTotal = getBudgetTotal(operatingExpenses);
  const spendingTotal = getBudgetTotal(businessSpending);
  const savingsTotal = getBudgetTotal(businessSavings);

  const assigned =
    operatingTotal + spendingTotal + savingsTotal;

  const spent =
    getSpentTotal(operatingExpenses) +
    getSpentTotal(businessSpending) +
    getSpentTotal(businessSavings);

  const ownerPayAmount =
    incomeMode === "separate"
      ? 0
      : Number(ownerPay) || 0;

  const totalPlannedOutflow = assigned + ownerPayAmount;
  const unassigned = businessIncome - totalPlannedOutflow;
  const availableAfterSpending = businessIncome - spent;

  const validateCurrentStep = () => {
    if (currentStep.type === "details") {
      if (!name.trim()) {
        Alert.alert(
          "Business name required",
          "Enter a name before continuing."
        );
        return false;
      }

      if (!businessType.trim()) {
        Alert.alert(
          "Business type required",
          "Enter a business type before continuing."
        );
        return false;
      }
    }

    if (
      currentStep.type === "budget" &&
      currentStep.sectionKey === "revenueSources" &&
      businessIncome <= 0
    ) {
      Alert.alert(
        "Revenue required",
        "Enter at least one monthly revenue source."
      );
      return false;
    }

    if (
      currentStep.type === "income-mode" &&
      incomeMode !== "separate"
    ) {
      if (ownerPayAmount <= 0) {
        Alert.alert(
          "Owner pay required",
          "Enter how much this business pays you each month."
        );
        return false;
      }

      if (ownerPayAmount > businessIncome) {
        Alert.alert(
          "Owner pay is too high",
          "Owner pay cannot exceed the business income."
        );
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }

    setStepIndex((previous) =>
      Math.min(previous + 1, steps.length - 1)
    );
  };

  const handleBack = () => {
    if (stepIndex === 0) {
      onBack();
      return;
    }

    setStepIndex((previous) => previous - 1);
  };

  const handleSave = async () => {
    if (!name.trim() || businessIncome <= 0) {
      Alert.alert(
        "Business incomplete",
        "Add a business name and at least one revenue source."
      );
      return;
    }

    if (
      incomeMode !== "separate" &&
      ownerPayAmount > businessIncome
    ) {
      Alert.alert(
        "Owner pay is too high",
        "Owner pay cannot exceed the business income."
      );
      return;
    }

    const savedBusiness: Business = {
      id: business?.id ?? Date.now().toString(),
      name: name.trim(),
      description: description.trim(),
      businessType: businessType.trim(),
      incomeMode,
      ownerPay: ownerPayAmount,
      budget: {
        businessIncome,
        revenueSources,
        operatingExpenses,
        businessSpending,
        businessSavings,
      },
    };

    if (isEditing) {
      await updateBusiness(savedBusiness.id, savedBusiness);
    } else {
      await addBusiness(savedBusiness);
    }

    onSave(savedBusiness);
  };

  const renderDetails = () => (
    <AppCard>
      <View style={{ gap: 16 }}>
        <View>
          <AppText variant="bold">Business name</AppText>

          <View style={{ marginTop: 8 }}>
            <AppInput
              placeholder="Business Name"
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        <View>
          <AppText variant="bold">Business type</AppText>

          <View style={{ marginTop: 8 }}>
            <AppInput
              placeholder="Side Hustle, LLC, Freelance"
              value={businessType}
              onChangeText={setBusinessType}
            />
          </View>
        </View>

        <View>
          <AppText variant="bold">Description</AppText>

          <View style={{ marginTop: 8 }}>
            <AppInput
              placeholder="Describe the business"
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>
        </View>
      </View>
    </AppCard>
  );

  const renderBudgetSection = (
    sectionKey: BusinessSectionKey
  ) => {
    const section = businessSections.find(
      (item) => item.key === sectionKey
    );

    if (!section) {
      return null;
    }

    const sectionTotal = getBudgetTotal(
      buildItems(sectionKey)
    );

    return (
      <>
        <AppCard>
          <AppRow>
            <View style={{ flex: 1 }}>
              <AppText variant="section">
                {section.title}
              </AppText>

              <AppText variant="muted">
                Fill in only what applies.
              </AppText>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <AppText variant="bold">
                {formatMoney(sectionTotal)}
              </AppText>

              <AppText variant="muted">monthly</AppText>
            </View>
          </AppRow>
        </AppCard>

        <AppCard>
          <View style={{ gap: 16 }}>
            {section.items.map((itemName) => (
              <View key={itemName}>
                <AppRow>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bold">
                      {itemName}
                    </AppText>
                  </View>

                  <AppInput
                    placeholder="$0"
                    value={
                      values[`${sectionKey}-${itemName}`]
                    }
                    onChangeText={(text) =>
                      setValues((previous) => ({
                        ...previous,
                        [`${sectionKey}-${itemName}`]:
                          cleanAmount(text),
                      }))
                    }
                    keyboardType="decimal-pad"
                    style={{
                      width: 130,
                      textAlign: "right",
                    }}
                  />
                </AppRow>
              </View>
            ))}
          </View>
        </AppCard>
      </>
    );
  };

  const renderIncomeModeOption = ({
    mode,
    title,
    description: optionDescription,
  }: {
    mode: "main" | "combined" | "separate";
    title: string;
    description: string;
  }) => {
    const selected = incomeMode === mode;

    return (
      <Pressable
        onPress={() => {
          setIncomeMode(mode);

          if (mode === "separate") {
            setOwnerPay("");
          }

          if (
            mode === "main" &&
            Number(ownerPay) <= 0
          ) {
            setOwnerPay(String(businessIncome));
          }
        }}
        style={({ pressed }) => ({
          opacity: pressed ? 0.75 : 1,
        })}
      >
        <AppCard>
          <AppRow>
            <View style={{ flex: 1 }}>
              <AppText variant="bold">{title}</AppText>

              <View style={{ marginTop: 4 }}>
                <AppText variant="muted">
                  {optionDescription}
                </AppText>
              </View>
            </View>

            <AppText variant="bold">
              {selected ? "Selected" : "Select"}
            </AppText>
          </AppRow>
        </AppCard>
      </Pressable>
    );
  };

  const renderIncomeMode = () => (
    <>
      {renderIncomeModeOption({
        mode: "main",
        title: "Main income",
        description:
          "This business is your primary personal income source.",
      })}

      {renderIncomeModeOption({
        mode: "combined",
        title: "Combined income",
        description:
          "Add a monthly owner payment alongside your other personal income.",
      })}

      {renderIncomeModeOption({
        mode: "separate",
        title: "Keep separate",
        description:
          "Keep all business income outside your personal budget.",
      })}

      {incomeMode !== "separate" ? (
        <AppCard>
          <AppText variant="section">
            Monthly owner pay
          </AppText>

          <View style={{ marginTop: 6 }}>
            <AppText variant="muted">
              This amount will be added to your personal
              income. Business expenses will stay separate.
            </AppText>
          </View>

          <View style={{ marginTop: 14 }}>
            <AppInput
              placeholder="$0"
              value={ownerPay}
              onChangeText={(text) =>
                setOwnerPay(cleanAmount(text))
              }
              keyboardType="decimal-pad"
            />
          </View>

          <View style={{ marginTop: 12 }}>
            <AppButton
              title={`Use Full Revenue ${formatMoney(
                businessIncome
              )}`}
              variant="outline"
              onPress={() =>
                setOwnerPay(String(businessIncome))
              }
            />
          </View>
        </AppCard>
      ) : null}
    </>
  );

  const renderReview = () => (
    <>
      <AppCard>
        <AppText variant="muted">Business</AppText>

        <View style={{ marginTop: 4 }}>
          <AppText variant="title">{name}</AppText>
        </View>

        <AppText variant="muted">
          {businessType}
        </AppText>

        {description ? (
          <View style={{ marginTop: 10 }}>
            <AppText variant="muted">
              {description}
            </AppText>
          </View>
        ) : null}
      </AppCard>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Revenue"
            value={formatMoney(businessIncome)}
            caption="Monthly"
            tone="primary"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Owner Pay"
            value={formatMoney(ownerPayAmount)}
            caption="Personal income"
            tone="primary"
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Assigned"
            value={formatMoney(assigned)}
            caption="Business plan"
            tone={
              totalPlannedOutflow > businessIncome
                ? "danger"
                : "success"
            }
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Unassigned"
            value={formatMoney(unassigned)}
            caption="Remaining"
            tone={unassigned < 0 ? "danger" : "success"}
          />
        </View>
      </View>

      <AppCard>
        <View style={{ gap: 12 }}>
          <AppRow>
            <AppText variant="muted">
              Revenue
            </AppText>

            <AppText variant="bold">
              {formatMoney(businessIncome)}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Operating expenses
            </AppText>

            <AppText variant="bold">
              {formatMoney(operatingTotal)}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Business spending
            </AppText>

            <AppText variant="bold">
              {formatMoney(spendingTotal)}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Business savings
            </AppText>

            <AppText variant="bold">
              {formatMoney(savingsTotal)}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Owner pay
            </AppText>

            <AppText variant="bold">
              {formatMoney(ownerPayAmount)}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Available after spending
            </AppText>

            <AppText variant="bold">
              {formatMoney(availableAfterSpending)}
            </AppText>
          </AppRow>
        </View>
      </AppCard>

      {unassigned < 0 ? (
        <Pressable
          onPress={() => {
            const expenseStep = steps.findIndex(
              (step) =>
                step.type === "budget" &&
                step.sectionKey ===
                  "operatingExpenses"
            );

            if (expenseStep >= 0) {
              setStepIndex(expenseStep);
            }
          }}
        >
          <AppCard>
            <AppText variant="bold">
              Plan exceeds revenue
            </AppText>

            <View style={{ marginTop: 4 }}>
              <AppText variant="muted">
                Reduce expenses, savings, or owner pay by{" "}
                {formatMoney(Math.abs(unassigned))}.
              </AppText>
            </View>
          </AppCard>
        </Pressable>
      ) : null}
    </>
  );

  return (
    <AppPage>
      <AppButton
        title={stepIndex === 0 ? "Cancel" : "Back"}
        onPress={handleBack}
        variant="outline"
      />

      <PageHeader
        title={currentStep.title}
        subtitle={currentStep.subtitle}
      />

      <AppCard>
        <AppRow>
          <AppText variant="muted">
            Step {stepIndex + 1} of {steps.length}
          </AppText>

          <AppText variant="bold">
            {progress.toFixed(0)}%
          </AppText>
        </AppRow>

        <View style={{ marginTop: 12 }}>
          <ProgressBar percent={progress} />
        </View>
      </AppCard>

      {currentStep.type === "details"
        ? renderDetails()
        : null}

      {currentStep.type === "budget"
        ? renderBudgetSection(currentStep.sectionKey)
        : null}

      {currentStep.type === "income-mode"
        ? renderIncomeMode()
        : null}

      {currentStep.type === "review"
        ? renderReview()
        : null}

      {currentStep.type === "review" ? (
        <AppButton
          title={
            isEditing
              ? "Save Business"
              : "Create Business"
          }
          onPress={handleSave}
        />
      ) : (
        <AppButton
          title="Continue"
          onPress={handleNext}
        />
      )}
    </AppPage>
  );
}