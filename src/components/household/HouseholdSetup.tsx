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
import {
  getOrCreateSharedWorkspace,
  inviteWorkspaceMember,
  updateSharedWorkspace,
  type WorkspaceRole,
} from "@/lib/sharedWorkspaceStore";
import { supabase } from "@/lib/supabase";
import type {
  BudgetItem,
  Household,
} from "@/lib/types";
import {
  useMemo,
  useState,
} from "react";
import {
  Alert,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";
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
      type: "members";
      title: string;
      subtitle: string;
    }
  | {
      type: "contributions";
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

type PendingInvite = {
  id: string;
  email: string;
  role: Exclude<WorkspaceRole, "owner">;
};

const cleanAmount = (value: string) => {
  const cleaned = value.replace(
    /[^0-9.]/g,
    ""
  );

  const parts = cleaned.split(".");

  if (parts.length <= 1) {
    return cleaned;
  }

  return `${parts[0]}.${parts
    .slice(1)
    .join("")}`;
};

const formatMoney = (amount: number) =>
  `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const createInviteId = () =>
  `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;

const normalizeEmail = (value: string) =>
  value.trim().toLowerCase();

const createBudgetItemId = (
  sectionKey: HouseholdSectionKey,
  itemName: string
) =>
  `${sectionKey}-${itemName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;

export default function HouseholdSetup({
  household,
  onBack,
  onSave,
}: {
  household?: Household;
  onBack: () => void;
  onSave: (household: Household) => void;
}) {
  const { width } = useWindowDimensions();

  const isMobile = width < 700;
  const isEditing = Boolean(household);

  const steps = useMemo<SetupStep[]>(
    () => [
      {
        type: "details",
        title: "Household Details",
        subtitle:
          "Create the shared space before building the budget.",
      },
      {
        type: "members",
        title: "Household Members",
        subtitle:
          "Choose your household name and invite the people budgeting with you.",
      },
      {
        type: "contributions",
        title: "Your Contribution",
        subtitle:
          "Set the amount you plan to contribute each month.",
      },
      ...householdSections.map<SetupStep>(
        (section) => ({
          type: "budget",
          sectionKey: section.key,
          title: section.title,
          subtitle:
            section.key === "incomeSources"
              ? "Enter the monthly money available to the household."
              : "Enter the monthly amount for each category that applies.",
        })
      ),
      {
        type: "personal-plan",
        title: "Personal Plan",
        subtitle:
          "Choose whether your household contribution should appear in your personal budget.",
      },
      {
        type: "review",
        title: "Review Household",
        subtitle:
          "Check the shared plan before saving.",
      },
    ],
    []
  );

  const existingOwner =
    household?.memberList?.find(
      (member) => member.role === "owner"
    );

  const [stepIndex, setStepIndex] =
    useState(0);

  const [isSaving, setIsSaving] =
    useState(false);

  const [name, setName] = useState(
    household?.name ?? ""
  );

  const [
    description,
    setDescription,
  ] = useState(
    household?.description ?? ""
  );

  const [
    householdDisplayName,
    setHouseholdDisplayName,
  ] = useState(
    existingOwner?.displayName ??
      existingOwner?.accountName ??
      ""
  );

  const [
    plannedContribution,
    setPlannedContribution,
  ] = useState(
    existingOwner?.plannedContribution
      ? String(
          existingOwner.plannedContribution
        )
      : household?.personalContribution
        ? String(
            household.personalContribution
          )
        : ""
  );

  const [
    savingsContribution,
    setSavingsContribution,
  ] = useState(
    existingOwner?.savingsContribution
      ? String(
          existingOwner.savingsContribution
        )
      : ""
  );

  const [
    includedInPersonalPlan,
    setIncludedInPersonalPlan,
  ] = useState(
    household?.includedInPersonalPlan ??
      false
  );

  const [
    pendingInvites,
    setPendingInvites,
  ] = useState<PendingInvite[]>([]);

  const [values, setValues] = useState<
    Record<string, string>
  >(() => {
    const initialValues: Record<
      string,
      string
    > = {};

    householdSections.forEach(
      (section) => {
        section.items.forEach(
          (itemName) => {
            const savedItem =
              household?.budget[
                section.key
              ]?.find(
                (item) =>
                  item.name === itemName
              );

            initialValues[
              `${section.key}-${itemName}`
            ] = savedItem
              ? String(savedItem.budget)
              : "";
          }
        );
      }
    );

    return initialValues;
  });

  const currentStep =
    steps[stepIndex];

  const progress =
    ((stepIndex + 1) /
      steps.length) *
    100;

  const validInvites =
    pendingInvites.filter(
      (invite) =>
        normalizeEmail(invite.email)
          .length > 0
    );

  const plannedContributionAmount =
    Number(plannedContribution) || 0;

  const savingsContributionAmount =
    Number(savingsContribution) || 0;

  const memberCount =
    1 + validInvites.length;

  const buildBudgetItems = (
    sectionKey: HouseholdSectionKey
  ): BudgetItem[] => {
    const section =
      householdSections.find(
        (item) =>
          item.key === sectionKey
      );

    if (!section) {
      return [];
    }

    return section.items
      .map((itemName) => {
        const savedItem =
          household?.budget[
            sectionKey
          ]?.find(
            (item) =>
              item.name === itemName
          );

        return {
          id:
            savedItem?.id ??
            createBudgetItemId(
              sectionKey,
              itemName
            ),
          name: itemName,
          budget:
            Number(
              values[
                `${sectionKey}-${itemName}`
              ]
            ) || 0,
          spent:
            savedItem?.spent ?? 0,
          dueDay:
            savedItem?.dueDay,
          notes: savedItem?.notes,
          assignedMemberId:
            savedItem?.assignedMemberId,
          splitType:
            savedItem?.splitType,
          memberSplits:
            savedItem?.memberSplits,
        };
      })
      .filter(
        (item) => item.budget > 0
      );
  };

  const incomeSources =
    buildBudgetItems(
      "incomeSources"
    );

  const bills =
    buildBudgetItems("bills");

  const spending =
    buildBudgetItems("spending");

  const savings =
    buildBudgetItems("savings");

  const householdIncome =
    getBudgetTotal(incomeSources);

  const billsTotal =
    getBudgetTotal(bills);

  const spendingTotal =
    getBudgetTotal(spending);

  const savingsTotal =
    getBudgetTotal(savings);

  const assigned =
    billsTotal +
    spendingTotal +
    savingsTotal;

  const unassigned =
    householdIncome - assigned;

  const updateInvite = (
    inviteId: string,
    changes: Partial<PendingInvite>
  ) => {
    setPendingInvites(
      (previous) =>
        previous.map((invite) =>
          invite.id === inviteId
            ? {
                ...invite,
                ...changes,
              }
            : invite
        )
    );
  };

  const addInvite = () => {
    setPendingInvites(
      (previous) => [
        ...previous,
        {
          id: createInviteId(),
          email: "",
          role: "editor",
        },
      ]
    );
  };

  const removeInvite = (
    inviteId: string
  ) => {
    setPendingInvites(
      (previous) =>
        previous.filter(
          (invite) =>
            invite.id !== inviteId
        )
    );
  };

  const validateInvites = () => {
    const normalizedEmails =
      validInvites.map((invite) =>
        normalizeEmail(invite.email)
      );

    const duplicateEmails =
      normalizedEmails.filter(
        (email, index) =>
          normalizedEmails.indexOf(
            email
          ) !== index
      );

    if (
      duplicateEmails.length > 0
    ) {
      Alert.alert(
        "Duplicate invitation",
        "Each household member can only be invited once."
      );

      return false;
    }

    const invalidInvite =
      validInvites.find(
        (invite) =>
          !normalizeEmail(
            invite.email
          ).includes("@")
      );

    if (invalidInvite) {
      Alert.alert(
        "Invalid email",
        "Enter a valid email address for each household member."
      );

      return false;
    }

    return true;
  };

  const validateCurrentStep = () => {
    if (
      currentStep.type ===
      "details"
    ) {
      if (!name.trim()) {
        Alert.alert(
          "Household name required",
          "Enter a household name before continuing."
        );

        return false;
      }
    }

    if (
      currentStep.type ===
      "members"
    ) {
      if (
        !householdDisplayName.trim()
      ) {
        Alert.alert(
          "Household name required",
          "Enter the name everyone in this household should call you."
        );

        return false;
      }

      if (!validateInvites()) {
        return false;
      }
    }

    if (
      currentStep.type ===
      "contributions"
    ) {
      if (
        plannedContributionAmount <
          0 ||
        savingsContributionAmount < 0
      ) {
        Alert.alert(
          "Invalid contribution",
          "Contribution amounts cannot be negative."
        );

        return false;
      }
    }

    if (
      currentStep.type ===
        "budget" &&
      currentStep.sectionKey ===
        "incomeSources" &&
      householdIncome <= 0
    ) {
      Alert.alert(
        "Household income required",
        "Enter at least one source of money available to the household."
      );

      return false;
    }

    if (
      currentStep.type ===
        "personal-plan" &&
      includedInPersonalPlan &&
      plannedContributionAmount <= 0
    ) {
      Alert.alert(
        "Contribution required",
        "Enter your planned monthly contribution before connecting it to your personal plan."
      );

      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }

    setStepIndex((previous) =>
      Math.min(
        previous + 1,
        steps.length - 1
      )
    );
  };

  const handleBack = () => {
    if (stepIndex === 0) {
      onBack();
      return;
    }

    setStepIndex(
      (previous) => previous - 1
    );
  };

  const goToStep = (
    type: SetupStep["type"],
    sectionKey?: HouseholdSectionKey
  ) => {
    const nextIndex =
      steps.findIndex((step) => {
        if (
          step.type !== type
        ) {
          return false;
        }

        if (
          type === "budget" &&
          step.type === "budget"
        ) {
          return (
            step.sectionKey ===
            sectionKey
          );
        }

        return true;
      });

    if (nextIndex >= 0) {
      setStepIndex(nextIndex);
    }
  };

  const saveMemberSetup = async (
    workspaceId: string
  ) => {
    const { error } =
      await supabase.rpc(
        "complete_household_member_setup",
        {
          target_workspace_id:
            workspaceId,
          new_display_name:
            householdDisplayName.trim(),
          new_planned_contribution:
            plannedContributionAmount,
          new_savings_contribution:
            savingsContributionAmount,
        }
      );

    if (error) {
      throw new Error(error.message);
    }
  };

  const sendInvitations = async (
    workspaceId: string
  ) => {
    const failures: string[] = [];

    for (const invite of validInvites) {
      try {
        await inviteWorkspaceMember({
          workspaceId,
          email:
            normalizeEmail(
              invite.email
            ),
          role: invite.role,
        });
      } catch (error) {
        failures.push(
          error instanceof Error
            ? `${invite.email}: ${error.message}`
            : `${invite.email}: Invitation failed`
        );
      }
    }

    return failures;
  };

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    if (!name.trim()) {
      Alert.alert(
        "Household incomplete",
        "Enter a household name."
      );

      return;
    }

    if (
      !householdDisplayName.trim()
    ) {
      Alert.alert(
        "Household name required",
        "Enter the name everyone in this household should call you."
      );

      return;
    }

    if (householdIncome <= 0) {
      Alert.alert(
        "Household incomplete",
        "Add at least one household income source."
      );

      return;
    }

    if (!validateInvites()) {
      return;
    }

    setIsSaving(true);

    try {
      const savedHousehold: Household = {
        id:
          household?.id ??
          Date.now().toString(),
        workspaceId:
          household?.workspaceId,
        name: name.trim(),
        description:
          description.trim(),
        members: memberCount,
        includedInPersonalPlan,
        personalContribution:
          includedInPersonalPlan
            ? plannedContributionAmount
            : 0,
        budget: {
          householdIncome,
          incomeSources,
          bills,
          spending,
          savings,
        },
        createdByUserId:
          household?.createdByUserId,
        createdAt:
          household?.createdAt ??
          new Date().toISOString(),
        updatedAt:
          new Date().toISOString(),
        hasCompletedSetup: true,
      };

      if (isEditing) {
        await updateHousehold(
          savedHousehold.id,
          savedHousehold
        );
      } else {
        await addHousehold(
          savedHousehold
        );
      }

      const sharedWorkspace =
        await getOrCreateSharedWorkspace(
          "household",
          savedHousehold
        );

      const finalizedHousehold: Household =
        {
          ...savedHousehold,
          workspaceId:
            sharedWorkspace.id,
        };

      await updateHousehold(
        finalizedHousehold.id,
        finalizedHousehold
      );

      await updateSharedWorkspace(
        sharedWorkspace.id,
        finalizedHousehold
      );

      await saveMemberSetup(
        sharedWorkspace.id
      );

      const invitationFailures =
        await sendInvitations(
          sharedWorkspace.id
        );

      onSave(finalizedHousehold);

      if (
        invitationFailures.length > 0
      ) {
        Alert.alert(
          "Household created",
          `The household was saved, but some invitations could not be sent:\n\n${invitationFailures.join(
            "\n"
          )}`
        );
      }
    } catch (error) {
      Alert.alert(
        "Could not save household",
        error instanceof Error
          ? error.message
          : "Something went wrong while saving the household."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const renderDetails = () => (
    <AppCard>
      <View style={{ gap: 18 }}>
        <View>
          <AppText variant="bold">
            Household name
          </AppText>

          <View
            style={{ marginTop: 8 }}
          >
            <AppInput
              placeholder="The Johnson Household"
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        <View>
          <AppText variant="bold">
            Description
          </AppText>

          <View
            style={{ marginTop: 8 }}
          >
            <AppInput
              placeholder="Family home, apartment, roommates"
              value={description}
              onChangeText={
                setDescription
              }
              multiline
            />
          </View>
        </View>

        <AppText variant="muted">
          You will be added as the
          household owner. Other members
          can be invited during the next
          step or later from Household
          Settings.
        </AppText>
      </View>
    </AppCard>
  );

  const renderRoleSelector = (
    invite: PendingInvite
  ) => (
    <View
      style={{
        flexDirection: "row",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      {(
        [
          {
            label: "Editor",
            value: "editor",
          },
          {
            label: "Viewer",
            value: "viewer",
          },
        ] as const
      ).map((option) => {
        const selected =
          invite.role === option.value;

        return (
          <Pressable
            key={option.value}
            onPress={() =>
              updateInvite(
                invite.id,
                {
                  role: option.value,
                }
              )
            }
            style={({ pressed }) => ({
              opacity:
                pressed ? 0.7 : 1,
              minWidth: 100,
              flexGrow: isMobile
                ? 1
                : 0,
            })}
          >
            <AppCard>
              <View
                style={{
                  alignItems:
                    "center",
                }}
              >
                <AppText
                  variant={
                    selected
                      ? "bold"
                      : "muted"
                  }
                >
                  {selected
                    ? `${option.label} selected`
                    : option.label}
                </AppText>
              </View>
            </AppCard>
          </Pressable>
        );
      })}
    </View>
  );

  const renderMembers = () => (
    <>
      <AppCard>
        <View style={{ gap: 14 }}>
          <View>
            <AppText variant="section">
              Your household name
            </AppText>

            <View
              style={{
                marginTop: 6,
              }}
            >
              <AppText variant="muted">
                This name is only used
                inside this household. You
                could use Jaya, Lily, Mom,
                Dad, or any name the
                household recognizes.
              </AppText>
            </View>
          </View>

          <AppInput
            placeholder="What should everyone call you?"
            value={
              householdDisplayName
            }
            onChangeText={
              setHouseholdDisplayName
            }
          />

          <AppRow>
            <View style={{ flex: 1 }}>
              <AppText variant="bold">
                Owner
              </AppText>

              <AppText variant="muted">
                Full household access
              </AppText>
            </View>

            <AppText variant="bold">
              {householdDisplayName.trim() ||
                "You"}
            </AppText>
          </AppRow>
        </View>
      </AppCard>

      <AppCard>
        <View style={{ gap: 14 }}>
          <View>
            <AppText variant="section">
              Invite household members
            </AppText>

            <View
              style={{
                marginTop: 6,
              }}
            >
              <AppText variant="muted">
                Editors can manage the
                budget. Viewers can only
                view household
                information.
              </AppText>
            </View>
          </View>

          {pendingInvites.length ===
          0 ? (
            <AppText variant="muted">
              No invitations added yet.
              You can create the household
              by yourself and invite
              people later.
            </AppText>
          ) : null}

          {pendingInvites.map(
            (invite, index) => (
              <View
                key={invite.id}
                style={{
                  gap: 12,
                  paddingTop:
                    index === 0
                      ? 0
                      : 14,
                }}
              >
                <AppRow>
                  <AppText variant="bold">
                    Member {index + 2}
                  </AppText>

                  <Pressable
                    onPress={() =>
                      removeInvite(
                        invite.id
                      )
                    }
                    style={({
                      pressed,
                    }) => ({
                      opacity:
                        pressed
                          ? 0.65
                          : 1,
                    })}
                  >
                    <AppText variant="muted">
                      Remove
                    </AppText>
                  </Pressable>
                </AppRow>

                <AppInput
                  placeholder="member@email.com"
                  value={invite.email}
                  onChangeText={(email) =>
                    updateInvite(
                      invite.id,
                      { email }
                    )
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                {renderRoleSelector(
                  invite
                )}
              </View>
            )
          )}

          <AppButton
            title="Add Member"
            onPress={addInvite}
            variant="outline"
          />
        </View>
      </AppCard>
    </>
  );

  const renderContributions = () => (
    <>
      <AppCard>
        <View style={{ gap: 16 }}>
          <View>
            <AppText variant="section">
              Planned household
              contribution
            </AppText>

            <View
              style={{
                marginTop: 6,
              }}
            >
              <AppText variant="muted">
                Enter how much you expect
                to contribute to the
                household each month.
              </AppText>
            </View>
          </View>

          <AppInput
            placeholder="$0"
            value={
              plannedContribution
            }
            onChangeText={(text) =>
              setPlannedContribution(
                cleanAmount(text)
              )
            }
            keyboardType="decimal-pad"
          />
        </View>
      </AppCard>

      <AppCard>
        <View style={{ gap: 16 }}>
          <View>
            <AppText variant="section">
              Planned savings
              contribution
            </AppText>

            <View
              style={{
                marginTop: 6,
              }}
            >
              <AppText variant="muted">
                Enter the amount of your
                contribution intended for
                household savings. This is
                optional.
              </AppText>
            </View>
          </View>

          <AppInput
            placeholder="$0"
            value={
              savingsContribution
            }
            onChangeText={(text) =>
              setSavingsContribution(
                cleanAmount(text)
              )
            }
            keyboardType="decimal-pad"
          />
        </View>
      </AppCard>

      <AppCard>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="bold">
              {householdDisplayName.trim() ||
                "Your contribution"}
            </AppText>

            <AppText variant="muted">
              Planned monthly total
            </AppText>
          </View>

          <AppText variant="section">
            {formatMoney(
              plannedContributionAmount
            )}
          </AppText>
        </AppRow>
      </AppCard>
    </>
  );

  const renderBudgetSection = (
    sectionKey: HouseholdSectionKey
  ) => {
    const section =
      householdSections.find(
        (item) =>
          item.key === sectionKey
      );

    if (!section) {
      return null;
    }

    const sectionTotal =
      getBudgetTotal(
        buildBudgetItems(
          sectionKey
        )
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
                Fill in only what applies
                to this household.
              </AppText>
            </View>

            <View
              style={{
                alignItems:
                  "flex-end",
              }}
            >
              <AppText variant="bold">
                {formatMoney(
                  sectionTotal
                )}
              </AppText>

              <AppText variant="muted">
                monthly
              </AppText>
            </View>
          </AppRow>
        </AppCard>

        <AppCard>
          <View style={{ gap: 16 }}>
            {section.items.map(
              (itemName) => (
                <View
                  key={itemName}
                  style={{
                    flexDirection:
                      isMobile
                        ? "column"
                        : "row",
                    alignItems:
                      isMobile
                        ? "stretch"
                        : "center",
                    gap: isMobile
                      ? 8
                      : 14,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <AppText variant="bold">
                      {itemName}
                    </AppText>
                  </View>

                  <AppInput
                    placeholder="$0"
                    value={
                      values[
                        `${sectionKey}-${itemName}`
                      ]
                    }
                    onChangeText={(
                      text
                    ) =>
                      setValues(
                        (
                          previous
                        ) => ({
                          ...previous,
                          [`${sectionKey}-${itemName}`]:
                            cleanAmount(
                              text
                            ),
                        })
                      )
                    }
                    keyboardType="decimal-pad"
                    style={{
                      width: isMobile
                        ? undefined
                        : 150,
                      textAlign:
                        isMobile
                          ? "left"
                          : "right",
                    }}
                  />
                </View>
              )
            )}
          </View>
        </AppCard>
      </>
    );
  };

  const renderPersonalPlan = () => (
    <>
      <Pressable
        onPress={() =>
          setIncludedInPersonalPlan(
            true
          )
        }
        style={({ pressed }) => ({
          opacity:
            pressed ? 0.75 : 1,
        })}
      >
        <AppCard>
          <AppRow>
            <View style={{ flex: 1 }}>
              <AppText variant="bold">
                Include my contribution
              </AppText>

              <AppText variant="muted">
                Track your planned
                household contribution in
                your personal budget.
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
        onPress={() =>
          setIncludedInPersonalPlan(
            false
          )
        }
        style={({ pressed }) => ({
          opacity:
            pressed ? 0.75 : 1,
        })}
      >
        <AppCard>
          <AppRow>
            <View style={{ flex: 1 }}>
              <AppText variant="bold">
                Keep it separate
              </AppText>

              <AppText variant="muted">
                Do not connect this
                household contribution to
                your personal plan.
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

      <AppCard>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="bold">
              Monthly contribution
            </AppText>

            <AppText variant="muted">
              Amount connected to your
              personal budget
            </AppText>
          </View>

          <AppText variant="section">
            {formatMoney(
              includedInPersonalPlan
                ? plannedContributionAmount
                : 0
            )}
          </AppText>
        </AppRow>
      </AppCard>
    </>
  );

  const renderMetricGrid = () => (
    <View
      style={{
        flexDirection: isMobile
          ? "column"
          : "row",
        gap: 10,
      }}
    >
      <View style={{ flex: 1 }}>
        <MetricCard
          title="Income"
          value={formatMoney(
            householdIncome
          )}
          caption="Monthly"
          tone="primary"
        />
      </View>

      <View style={{ flex: 1 }}>
        <MetricCard
          title="Assigned"
          value={formatMoney(assigned)}
          caption="Household plan"
          tone={
            assigned >
            householdIncome
              ? "danger"
              : "success"
          }
        />
      </View>

      <View style={{ flex: 1 }}>
        <MetricCard
          title="Remaining"
          value={formatMoney(
            unassigned
          )}
          caption="Unassigned"
          tone={
            unassigned < 0
              ? "danger"
              : "success"
          }
        />
      </View>
    </View>
  );

  const renderReview = () => (
    <>
      <AppCard>
        <View style={{ gap: 8 }}>
          <AppText variant="muted">
            Household
          </AppText>

          <AppText variant="title">
            {name.trim() ||
              "New Household"}
          </AppText>

          <AppText variant="muted">
            {memberCount} member
            {memberCount === 1
              ? ""
              : "s"}
          </AppText>

          {description.trim() ? (
            <AppText variant="muted">
              {description.trim()}
            </AppText>
          ) : null}
        </View>
      </AppCard>

      {renderMetricGrid()}

      <AppCard>
        <View style={{ gap: 14 }}>
          <AppText variant="section">
            Members
          </AppText>

          <AppRow>
            <View style={{ flex: 1 }}>
              <AppText variant="bold">
                {householdDisplayName.trim() ||
                  "You"}
              </AppText>

              <AppText variant="muted">
                Owner
              </AppText>
            </View>

            <AppText variant="bold">
              {formatMoney(
                plannedContributionAmount
              )}
            </AppText>
          </AppRow>

          {validInvites.map(
            (invite) => (
              <AppRow key={invite.id}>
                <View
                  style={{ flex: 1 }}
                >
                  <AppText variant="bold">
                    {
                      invite.email
                    }
                  </AppText>

                  <AppText variant="muted">
                    Invitation pending
                  </AppText>
                </View>

                <AppText variant="bold">
                  {invite.role ===
                  "editor"
                    ? "Editor"
                    : "Viewer"}
                </AppText>
              </AppRow>
            )
          )}
        </View>
      </AppCard>

      <AppCard>
        <View style={{ gap: 12 }}>
          <AppText variant="section">
            Monthly plan
          </AppText>

          <AppRow>
            <AppText variant="muted">
              Household income
            </AppText>

            <AppText variant="bold">
              {formatMoney(
                householdIncome
              )}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Bills
            </AppText>

            <AppText variant="bold">
              {formatMoney(
                billsTotal
              )}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Shared spending
            </AppText>

            <AppText variant="bold">
              {formatMoney(
                spendingTotal
              )}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Savings
            </AppText>

            <AppText variant="bold">
              {formatMoney(
                savingsTotal
              )}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Your planned contribution
            </AppText>

            <AppText variant="bold">
              {formatMoney(
                plannedContributionAmount
              )}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Your savings contribution
            </AppText>

            <AppText variant="bold">
              {formatMoney(
                savingsContributionAmount
              )}
            </AppText>
          </AppRow>
        </View>
      </AppCard>

      {unassigned < 0 ? (
        <Pressable
          onPress={() =>
            goToStep(
              "budget",
              "bills"
            )
          }
          style={({ pressed }) => ({
            opacity:
              pressed ? 0.7 : 1,
          })}
        >
          <AppCard>
            <AppText variant="bold">
              Plan exceeds household
              income
            </AppText>

            <AppText variant="muted">
              Reduce the plan by{" "}
              {formatMoney(
                Math.abs(unassigned)
              )}
              .
            </AppText>
          </AppCard>
        </Pressable>
      ) : null}

      <AppCard>
        <View style={{ gap: 10 }}>
          <AppText variant="section">
            Edit setup
          </AppText>

          <Pressable
            onPress={() =>
              goToStep("details")
            }
          >
            <AppRow>
              <AppText variant="muted">
                Household details
              </AppText>

              <AppText variant="bold">
                Edit
              </AppText>
            </AppRow>
          </Pressable>

          <Pressable
            onPress={() =>
              goToStep("members")
            }
          >
            <AppRow>
              <AppText variant="muted">
                Members and invitations
              </AppText>

              <AppText variant="bold">
                Edit
              </AppText>
            </AppRow>
          </Pressable>

          <Pressable
            onPress={() =>
              goToStep(
                "contributions"
              )
            }
          >
            <AppRow>
              <AppText variant="muted">
                Your contribution
              </AppText>

              <AppText variant="bold">
                Edit
              </AppText>
            </AppRow>
          </Pressable>
        </View>
      </AppCard>
    </>
  );

  return (
    <AppPage>
      <AppButton
        title={
          stepIndex === 0
            ? "Cancel"
            : "Back"
        }
        onPress={handleBack}
        variant="outline"
      />

      <PageHeader
        title={currentStep.title}
        subtitle={
          currentStep.subtitle
        }
      />

      <AppCard>
        <AppRow>
          <AppText variant="muted">
            Step {stepIndex + 1} of{" "}
            {steps.length}
          </AppText>

          <AppText variant="bold">
            {progress.toFixed(0)}%
          </AppText>
        </AppRow>

        <View
          style={{ marginTop: 12 }}
        >
          <ProgressBar
            percent={progress}
          />
        </View>
      </AppCard>

      {currentStep.type ===
      "details"
        ? renderDetails()
        : null}

      {currentStep.type ===
      "members"
        ? renderMembers()
        : null}

      {currentStep.type ===
      "contributions"
        ? renderContributions()
        : null}

      {currentStep.type ===
      "budget"
        ? renderBudgetSection(
            currentStep.sectionKey
          )
        : null}

      {currentStep.type ===
      "personal-plan"
        ? renderPersonalPlan()
        : null}

      {currentStep.type ===
      "review"
        ? renderReview()
        : null}

      {currentStep.type ===
      "review" ? (
        <AppButton
          title={
            isSaving
              ? "Saving..."
              : isEditing
                ? "Save Household"
                : "Create Household"
          }
          onPress={handleSave}
          disabled={isSaving}
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