import ProgressBar from "@/components/budget/ProgressBar";
import { getBudgetTotal } from "@/components/budget/budgetUtils";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppPage from "@/components/ui/AppPage";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import {
  addHousehold,
  updateHousehold,
} from "@/lib/householdStore";
import { BudgetItem, Household } from "@/lib/types";
import { useMemo, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import {
  HouseholdSectionKey,
  householdSections,
} from "./householdData";

type SetupStep =
  | {
      type: "details";
      title: string;
      subtitle: string;
    }
  | {
      type: "budget";
      sectionKey: HouseholdSectionKey;
      title: string;
      subtitle: string;
    }
  | {
      type: "personal-plan";
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

const cleanWholeNumber = (value: string) =>
  value.replace(/[^0-9]/g, "");

const formatMoney = (amount: number) =>
  `$${amount.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;

export default function HouseholdSetup({
  household,
  onBack,
  onSave,
}: {
  household?: Household;
  onBack: () => void;
  onSave: (household: Household) => void;
}) {
  const isEditing = Boolean(household);

  const steps = useMemo<SetupStep[]>(() => {
    return [
      {
        type: "details",
        title: "Household Details",
        subtitle: "Set up the basics for this shared budget.",
      },
      ...householdSections.map<SetupStep>((section) => ({
        type: "budget",
        sectionKey: section.key,
        title: section.title,
        subtitle:
          section.key === "incomeSources"
            ? "Enter the monthly money available to this household."
            : "Enter the monthly amount for each category that applies.",
      })),
      {
        type: "personal-plan",
        title: "Personal Plan",
        subtitle:
          "Choose whether your contribution should be included in your personal budget.",
      },
      {
        type: "review",
        title: "Review Household",
        subtitle: "Review the shared plan before saving.",
      },
    ];
  }, []);

  const [stepIndex, setStepIndex] = useState(0);

  const [name, setName] = useState(household?.name ?? "");
  const [description, setDescription] = useState(
    household?.description ?? ""
  );
  const [members, setMembers] = useState(
    String(household?.members ?? 1)
  );

  const [includedInPersonalPlan, setIncludedInPersonalPlan] =
    useState(household?.includedInPersonalPlan ?? false);

  const [personalContribution, setPersonalContribution] =
    useState(
      household?.personalContribution
        ? String(household.personalContribution)
        : ""
    );

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initialValues: Record<string, string> = {};

    householdSections.forEach((section) => {
      section.items.forEach((itemName) => {
        const savedItem = household?.budget[section.key]?.find(
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

  const buildBudgetItems = (
    sectionKey: HouseholdSectionKey
  ): BudgetItem[] => {
    const section = householdSections.find(
      (item) => item.key === sectionKey
    );

    if (!section) {
      return [];
    }

    return section.items
      .map((itemName) => {
        const savedItem = household?.budget[sectionKey]?.find(
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
          dueDay: savedItem?.dueDay,
          notes: savedItem?.notes,
        };
      })
      .filter((item) => item.budget > 0);
  };

  const incomeSources = buildBudgetItems("incomeSources");
  const bills = buildBudgetItems("bills");
  const spending = buildBudgetItems("spending");
  const savings = buildBudgetItems("savings");

  const householdIncome = getBudgetTotal(incomeSources);
  const billsTotal = getBudgetTotal(bills);
  const spendingTotal = getBudgetTotal(spending);
  const savingsTotal = getBudgetTotal(savings);

  const assigned =
    billsTotal + spendingTotal + savingsTotal;

  const unassigned = householdIncome - assigned;
  const contributionAmount =
    Number(personalContribution) || 0;

  const validateCurrentStep = () => {
    if (currentStep.type === "details") {
      if (!name.trim()) {
        Alert.alert(
          "Household name required",
          "Enter a name before continuing."
        );
        return false;
      }

      if ((Number(members) || 0) < 1) {
        Alert.alert(
          "Contributor required",
          "Enter at least one contributor."
        );
        return false;
      }
    }

    if (
      currentStep.type === "budget" &&
      currentStep.sectionKey === "incomeSources" &&
      householdIncome <= 0
    ) {
      Alert.alert(
        "Income required",
        "Enter at least one household income source."
      );
      return false;
    }

    if (
      currentStep.type === "personal-plan" &&
      includedInPersonalPlan
    ) {
      if (contributionAmount <= 0) {
        Alert.alert(
          "Contribution required",
          "Enter how much you contribute to this household each month."
        );
        return false;
      }

      if (contributionAmount > householdIncome) {
        Alert.alert(
          "Contribution is too high",
          "Your contribution cannot exceed the household income."
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
    if (!name.trim() || householdIncome <= 0) {
      Alert.alert(
        "Household incomplete",
        "Add a household name and at least one income source."
      );
      return;
    }

    const savedHousehold: Household = {
      id: household?.id ?? Date.now().toString(),
      name: name.trim(),
      description: description.trim(),
      members: Math.max(Number(members) || 1, 1),
      includedInPersonalPlan,
      personalContribution: includedInPersonalPlan
        ? contributionAmount
        : 0,
      budget: {
        householdIncome,
        incomeSources,
        bills,
        spending,
        savings,
      },
    };

    if (isEditing) {
      await updateHousehold(
        savedHousehold.id,
        savedHousehold
      );
    } else {
      await addHousehold(savedHousehold);
    }

    onSave(savedHousehold);
  };

  const renderDetails = () => (
    <AppCard>
      <View style={{ gap: 16 }}>
        <View>
          <AppText variant="bold">
            Household name
          </AppText>

          <View style={{ marginTop: 8 }}>
            <AppInput
              placeholder="Home, Apartment, Family"
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        <View>
          <AppText variant="bold">
            Number of contributors
          </AppText>

          <View style={{ marginTop: 8 }}>
            <AppInput
              placeholder="1"
              value={members}
              onChangeText={(text) =>
                setMembers(cleanWholeNumber(text))
              }
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View>
          <AppText variant="bold">
            Description
          </AppText>

          <View style={{ marginTop: 8 }}>
            <AppInput
              placeholder="Describe this household"
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
    sectionKey: HouseholdSectionKey
  ) => {
    const section = householdSections.find(
      (item) => item.key === sectionKey
    );

    if (!section) {
      return null;
    }

    const sectionTotal = getBudgetTotal(
      buildBudgetItems(sectionKey)
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

              <AppText variant="muted">
                monthly
              </AppText>
            </View>
          </AppRow>
        </AppCard>

        <AppCard>
          <View style={{ gap: 16 }}>
            {section.items.map((itemName) => (
              <AppRow key={itemName}>
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
            ))}
          </View>
        </AppCard>
      </>
    );
  };

  const renderPersonalPlan = () => (
    <>
      <Pressable
        onPress={() => setIncludedInPersonalPlan(true)}
        style={({ pressed }) => ({
          opacity: pressed ? 0.75 : 1,
        })}
      >
        <AppCard>
          <AppRow>
            <View style={{ flex: 1 }}>
              <AppText variant="bold">
                Include my contribution
              </AppText>

              <AppText variant="muted">
                Track the amount you personally put toward
                this household.
              </AppText>
            </View>

            <AppText variant="bold">
              {includedInPersonalPlan
                ? "Selected"
                : "Select"}
            </AppText>
          </AppRow>
        </AppCard>
      </Pressable>

      <Pressable
        onPress={() => {
          setIncludedInPersonalPlan(false);
          setPersonalContribution("");
        }}
        style={({ pressed }) => ({
          opacity: pressed ? 0.75 : 1,
        })}
      >
        <AppCard>
          <AppRow>
            <View style={{ flex: 1 }}>
              <AppText variant="bold">
                Keep it separate
              </AppText>

              <AppText variant="muted">
                Do not connect this household to your
                personal plan.
              </AppText>
            </View>

            <AppText variant="bold">
              {!includedInPersonalPlan
                ? "Selected"
                : "Select"}
            </AppText>
          </AppRow>
        </AppCard>
      </Pressable>

      {includedInPersonalPlan ? (
        <AppCard>
          <AppText variant="section">
            Monthly contribution
          </AppText>

          <View style={{ marginTop: 6 }}>
            <AppText variant="muted">
              Enter how much you personally contribute to
              this household each month.
            </AppText>
          </View>

          <View style={{ marginTop: 14 }}>
            <AppInput
              placeholder="$0"
              value={personalContribution}
              onChangeText={(text) =>
                setPersonalContribution(
                  cleanAmount(text)
                )
              }
              keyboardType="decimal-pad"
            />
          </View>
        </AppCard>
      ) : null}
    </>
  );

  const renderReview = () => (
    <>
      <AppCard>
        <AppText variant="muted">
          Household
        </AppText>

        <View style={{ marginTop: 4 }}>
          <AppText variant="title">
            {name}
          </AppText>
        </View>

        <AppText variant="muted">
          {Math.max(Number(members) || 1, 1)} contributor
          {Math.max(Number(members) || 1, 1) === 1
            ? ""
            : "s"}
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
            title="Income"
            value={formatMoney(householdIncome)}
            caption="Monthly"
            tone="primary"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Assigned"
            value={formatMoney(assigned)}
            caption="Shared plan"
            tone={
              assigned > householdIncome
                ? "danger"
                : "success"
            }
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Unassigned"
            value={formatMoney(unassigned)}
            caption="Remaining"
            tone={unassigned < 0 ? "danger" : "success"}
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Your Share"
            value={formatMoney(
              includedInPersonalPlan
                ? contributionAmount
                : 0
            )}
            caption="Monthly"
            tone="primary"
          />
        </View>
      </View>

      <AppCard>
        <View style={{ gap: 12 }}>
          <AppRow>
            <AppText variant="muted">
              Household income
            </AppText>

            <AppText variant="bold">
              {formatMoney(householdIncome)}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Bills
            </AppText>

            <AppText variant="bold">
              {formatMoney(billsTotal)}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Shared spending
            </AppText>

            <AppText variant="bold">
              {formatMoney(spendingTotal)}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Savings
            </AppText>

            <AppText variant="bold">
              {formatMoney(savingsTotal)}
            </AppText>
          </AppRow>
        </View>
      </AppCard>

      {unassigned < 0 ? (
        <Pressable
          onPress={() => {
            const billsStep = steps.findIndex(
              (step) =>
                step.type === "budget" &&
                step.sectionKey === "bills"
            );

            if (billsStep >= 0) {
              setStepIndex(billsStep);
            }
          }}
        >
          <AppCard>
            <AppText variant="bold">
              Plan exceeds income
            </AppText>

            <AppText variant="muted">
              Reduce the household plan by{" "}
              {formatMoney(Math.abs(unassigned))}.
            </AppText>
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

      {currentStep.type === "personal-plan"
        ? renderPersonalPlan()
        : null}

      {currentStep.type === "review"
        ? renderReview()
        : null}

      {currentStep.type === "review" ? (
        <AppButton
          title={
            isEditing
              ? "Save Household"
              : "Create Household"
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