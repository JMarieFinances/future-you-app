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
  addCalendarEvent,
  deleteCalendarEventsBySource,
} from "@/lib/calendarStore";
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
  CalendarEvent,
  CalendarEventRepeat,
  Household,
  HouseholdMemberSplit,
  HouseholdSplitType,
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
      type: "responsibilities";
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

type ResponsibilityDraft = {
  dueDay: string;
  frequency: CalendarEventRepeat;
  reminderDaysBefore: string;
  required: boolean;
  splitType: HouseholdSplitType;
  assignedMemberId?: string;
  memberSplits: HouseholdMemberSplit[];
  notes: string;
};

type HouseholdParticipant = {
  id: string;
  label: string;
  type: "owner" | "invite";
};

const OWNER_TEMP_ID = "current-household-owner";

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

const cleanWholeNumber = (
  value: string
) => value.replace(/[^0-9]/g, "");

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

const getValueKey = (
  sectionKey: HouseholdSectionKey,
  itemName: string
) => `${sectionKey}-${itemName}`;

const getResponsibilityKey = (
  sectionKey: HouseholdSectionKey,
  itemName: string
) => `${sectionKey}-${itemName}`;

const getInviteParticipantId = (
  email: string
) => `invite:${normalizeEmail(email)}`;

const clampDueDay = (
  value: string
): number | undefined => {
  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed <= 0
  ) {
    return undefined;
  }

  return Math.min(
    Math.max(Math.floor(parsed), 1),
    31
  );
};

const clampReminderDays = (
  value: string
): number | undefined => {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    return undefined;
  }

  return Math.min(
    Math.floor(parsed),
    30
  );
};

const getFrequencyLabel = (
  frequency: CalendarEventRepeat
) => {
  if (frequency === "weekly") {
    return "Weekly";
  }

  if (frequency === "biweekly") {
    return "Every 2 weeks";
  }

  if (frequency === "yearly") {
    return "Yearly";
  }

  return "Monthly";
};

const getSplitLabel = (
  splitType?: HouseholdSplitType
) => {
  if (splitType === "equal") {
    return "Split evenly";
  }

  if (splitType === "percentage") {
    return "Percentage split";
  }

  if (splitType === "custom") {
    return "Custom amounts";
  }

  return "One person";
};

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
          "Create the shared space before building the household budget.",
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
        type: "responsibilities",
        title:
          "Responsibilities & Due Dates",
        subtitle:
          "Choose who handles each expense and when it should appear on the household calendar.",
      },
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

  const initialOwnerId =
    existingOwner?.userId ??
    existingOwner?.id ??
    OWNER_TEMP_ID;

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
              getValueKey(
                section.key,
                itemName
              )
            ] = savedItem
              ? String(savedItem.budget)
              : "";
          }
        );
      }
    );

    return initialValues;
  });

  const [
    responsibilities,
    setResponsibilities,
  ] = useState<
    Record<string, ResponsibilityDraft>
  >(() => {
    const initialDrafts: Record<
      string,
      ResponsibilityDraft
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

            initialDrafts[
              getResponsibilityKey(
                section.key,
                itemName
              )
            ] = {
              dueDay:
                savedItem?.dueDay !==
                undefined
                  ? String(
                      savedItem.dueDay
                    )
                  : "",
              frequency:
                savedItem?.frequency ??
                "monthly",
              reminderDaysBefore:
                savedItem
                  ?.reminderDaysBefore !==
                undefined
                  ? String(
                      savedItem.reminderDaysBefore
                    )
                  : "",
              required:
                savedItem?.required ??
                section.key === "bills",
              splitType:
                savedItem?.splitType ??
                "single",
              assignedMemberId:
                savedItem
                  ?.assignedMemberId ??
                initialOwnerId,
              memberSplits:
                savedItem
                  ?.memberSplits ?? [],
              notes:
                savedItem
                  ?.responsibilityNotes ??
                savedItem?.notes ??
                "",
            };
          }
        );
      }
    );

    return initialDrafts;
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

  const participants =
    useMemo<HouseholdParticipant[]>(
      () => [
        {
          id: initialOwnerId,
          label:
            householdDisplayName.trim() ||
            "You",
          type: "owner",
        },
        ...validInvites.map(
          (invite) => ({
            id: getInviteParticipantId(
              invite.email
            ),
            label:
              normalizeEmail(
                invite.email
              ),
            type: "invite" as const,
          })
        ),
      ],
      [
        householdDisplayName,
        initialOwnerId,
        validInvites,
      ]
    );

  const updateResponsibility = (
    sectionKey: HouseholdSectionKey,
    itemName: string,
    changes: Partial<ResponsibilityDraft>
  ) => {
    const key = getResponsibilityKey(
      sectionKey,
      itemName
    );

    setResponsibilities(
      (previous) => ({
        ...previous,
        [key]: {
          ...previous[key],
          ...changes,
        },
      })
    );
  };

  const buildBudgetItems = (
    sectionKey: HouseholdSectionKey,
    currentUserId?: string
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

        const responsibility =
          responsibilities[
            getResponsibilityKey(
              sectionKey,
              itemName
            )
          ];

        const resolveMemberId = (
          memberId?: string
        ) => {
          if (
            memberId === OWNER_TEMP_ID &&
            currentUserId
          ) {
            return currentUserId;
          }

          return memberId;
        };

        const resolvedMemberSplits =
          responsibility.memberSplits.map(
            (split) => ({
              ...split,
              memberId:
                resolveMemberId(
                  split.memberId
                ) ?? split.memberId,
            })
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
                getValueKey(
                  sectionKey,
                  itemName
                )
              ]
            ) || 0,
          spent:
            savedItem?.spent ?? 0,
          dueDay:
            sectionKey ===
            "incomeSources"
              ? savedItem?.dueDay
              : clampDueDay(
                  responsibility.dueDay
                ),
          notes:
            savedItem?.notes,
          assignedMemberId:
            sectionKey ===
            "incomeSources"
              ? savedItem
                  ?.assignedMemberId
              : resolveMemberId(
                  responsibility
                    .assignedMemberId
                ),
          splitType:
            sectionKey ===
            "incomeSources"
              ? savedItem?.splitType
              : responsibility.splitType,
          memberSplits:
            sectionKey ===
            "incomeSources"
              ? savedItem
                  ?.memberSplits
              : resolvedMemberSplits,
          frequency:
            sectionKey ===
            "incomeSources"
              ? savedItem?.frequency
              : responsibility.frequency,
          reminderDaysBefore:
            sectionKey ===
            "incomeSources"
              ? savedItem
                  ?.reminderDaysBefore
              : clampReminderDays(
                  responsibility
                    .reminderDaysBefore
                ),
          responsibilityNotes:
            sectionKey ===
            "incomeSources"
              ? savedItem
                  ?.responsibilityNotes
              : responsibility.notes.trim(),
          required:
            sectionKey ===
            "incomeSources"
              ? savedItem?.required
              : responsibility.required,
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

  const responsibilityItems =
    useMemo(
      () =>
        (
          [
            "bills",
            "spending",
            "savings",
          ] as HouseholdSectionKey[]
        ).flatMap((sectionKey) => {
          const section =
            householdSections.find(
              (item) =>
                item.key ===
                sectionKey
            );

          if (!section) {
            return [];
          }

          return section.items
            .map((itemName) => ({
              sectionKey,
              sectionTitle:
                section.title,
              itemName,
              amount:
                Number(
                  values[
                    getValueKey(
                      sectionKey,
                      itemName
                    )
                  ]
                ) || 0,
            }))
            .filter(
              (item) =>
                item.amount > 0
            );
        }),
      [values]
    );

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
    const invite =
      pendingInvites.find(
        (item) =>
          item.id === inviteId
      );

    const participantId = invite
      ? getInviteParticipantId(
          invite.email
        )
      : undefined;

    setPendingInvites(
      (previous) =>
        previous.filter(
          (item) =>
            item.id !== inviteId
        )
    );

    if (participantId) {
      setResponsibilities(
        (previous) => {
          const next = {
            ...previous,
          };

          Object.keys(next).forEach(
            (key) => {
              const draft = next[key];

              next[key] = {
                ...draft,
                assignedMemberId:
                  draft.assignedMemberId ===
                  participantId
                    ? initialOwnerId
                    : draft.assignedMemberId,
                memberSplits:
                  draft.memberSplits.filter(
                    (split) =>
                      split.memberId !==
                      participantId
                  ),
              };
            }
          );

          return next;
        }
      );
    }
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

  const validateResponsibilities =
    () => {
      const missingDueDate =
        responsibilityItems.find(
          (item) => {
            const draft =
              responsibilities[
                getResponsibilityKey(
                  item.sectionKey,
                  item.itemName
                )
              ];

            return !clampDueDay(
              draft.dueDay
            );
          }
        );

      if (missingDueDate) {
        Alert.alert(
          "Due date required",
          `Enter a due day for ${missingDueDate.itemName}.`
        );

        return false;
      }

      const invalidSingle =
        responsibilityItems.find(
          (item) => {
            const draft =
              responsibilities[
                getResponsibilityKey(
                  item.sectionKey,
                  item.itemName
                )
              ];

            return (
              draft.splitType ===
                "single" &&
              !draft.assignedMemberId
            );
          }
        );

      if (invalidSingle) {
        Alert.alert(
          "Responsible member required",
          `Choose who is responsible for ${invalidSingle.itemName}.`
        );

        return false;
      }

      const invalidPercentage =
        responsibilityItems.find(
          (item) => {
            const draft =
              responsibilities[
                getResponsibilityKey(
                  item.sectionKey,
                  item.itemName
                )
              ];

            if (
              draft.splitType !==
              "percentage"
            ) {
              return false;
            }

            const total =
              draft.memberSplits.reduce(
                (sum, split) =>
                  sum +
                  Number(
                    split.percentage ??
                      0
                  ),
                0
              );

            return Math.abs(
              total - 100
            ) > 0.01;
          }
        );

      if (invalidPercentage) {
        Alert.alert(
          "Percentage split incomplete",
          `The percentages for ${invalidPercentage.itemName} must total 100%.`
        );

        return false;
      }

      const invalidCustom =
        responsibilityItems.find(
          (item) => {
            const draft =
              responsibilities[
                getResponsibilityKey(
                  item.sectionKey,
                  item.itemName
                )
              ];

            if (
              draft.splitType !==
              "custom"
            ) {
              return false;
            }

            const total =
              draft.memberSplits.reduce(
                (sum, split) =>
                  sum +
                  Number(
                    split.amount ?? 0
                  ),
                0
              );

            return (
              Math.abs(
                total - item.amount
              ) > 0.01
            );
          }
        );

      if (invalidCustom) {
        Alert.alert(
          "Custom split incomplete",
          `The custom amounts for ${invalidCustom.itemName} must total ${formatMoney(
            invalidCustom.amount
          )}.`
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
        "responsibilities" &&
      !validateResponsibilities()
    ) {
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

  const getParticipantLabel = (
    memberId?: string
  ) => {
    if (!memberId) {
      return undefined;
    }

    return participants.find(
      (participant) =>
        participant.id === memberId
    )?.label;
  };

  const syncHouseholdCalendar =
    async (
      householdId: string,
      budgetItems: BudgetItem[]
    ) => {
      await deleteCalendarEventsBySource(
        "household",
        householdId
      );

      for (const item of budgetItems) {
        if (
          !item.dueDay ||
          item.budget <= 0
        ) {
          continue;
        }

        const event: CalendarEvent = {
          id: `household-${householdId}-${item.id}`,
          title: item.name,
          amount: item.budget,
          day: item.dueDay,
          repeat:
            item.frequency ??
            "monthly",
          type: "household",
          notes:
            item.responsibilityNotes ||
            item.notes,
          sourceId: householdId,
          sourceType: "household",
          budgetItemId: item.id,
          householdMemberId:
            item.splitType ===
            "single"
              ? item.assignedMemberId
              : undefined,
          assignedMemberName:
            item.splitType ===
            "single"
              ? getParticipantLabel(
                  item.assignedMemberId
                )
              : getSplitLabel(
                  item.splitType
                ),
          completed: false,
          createdAt:
            new Date().toISOString(),
        };

        await addCalendarEvent(event);
      }
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

    if (!validateResponsibilities()) {
      return;
    }

    setIsSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(
          userError.message
        );
      }

      if (!user) {
        throw new Error(
          "You must be signed in."
        );
      }

      const finalizedIncomeSources =
        buildBudgetItems(
          "incomeSources",
          user.id
        );

      const finalizedBills =
        buildBudgetItems(
          "bills",
          user.id
        );

      const finalizedSpending =
        buildBudgetItems(
          "spending",
          user.id
        );

      const finalizedSavings =
        buildBudgetItems(
          "savings",
          user.id
        );

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
          householdIncome:
            getBudgetTotal(
              finalizedIncomeSources
            ),
          incomeSources:
            finalizedIncomeSources,
          bills: finalizedBills,
          spending:
            finalizedSpending,
          savings:
            finalizedSavings,
        },
        createdByUserId:
          household
            ?.createdByUserId ??
          user.id,
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

      await syncHouseholdCalendar(
        finalizedHousehold.id,
        [
          ...finalizedBills,
          ...finalizedSpending,
          ...finalizedSavings,
        ]
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
                inside this household.
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

            <AppText variant="muted">
              Enter how much you expect
              to contribute to the
              household each month.
            </AppText>
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

            <AppText variant="muted">
              Enter the amount intended
              for household savings.
            </AppText>
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
                        getValueKey(
                          sectionKey,
                          itemName
                        )
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
                          [getValueKey(
                            sectionKey,
                            itemName
                          )]:
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

  const createDefaultSplits = (
    splitType: HouseholdSplitType,
    amount: number
  ): HouseholdMemberSplit[] => {
    if (
      splitType !== "percentage" &&
      splitType !== "custom"
    ) {
      return [];
    }

    if (participants.length === 0) {
      return [];
    }

    if (splitType === "percentage") {
      const base =
        100 / participants.length;

      return participants.map(
        (participant, index) => ({
          memberId: participant.id,
          percentage:
            index ===
            participants.length - 1
              ? Number(
                  (
                    100 -
                    base *
                      (participants.length -
                        1)
                  ).toFixed(2)
                )
              : Number(
                  base.toFixed(2)
                ),
        })
      );
    }

    const base =
      amount / participants.length;

    return participants.map(
      (participant, index) => ({
        memberId: participant.id,
        amount:
          index ===
          participants.length - 1
            ? Number(
                (
                  amount -
                  base *
                    (participants.length -
                      1)
                ).toFixed(2)
              )
            : Number(
                base.toFixed(2)
              ),
      })
    );
  };

  const renderSplitSelector = (
    sectionKey: HouseholdSectionKey,
    itemName: string,
    amount: number,
    draft: ResponsibilityDraft
  ) => {
    const options: {
      label: string;
      value: HouseholdSplitType;
    }[] = [
      {
        label: "One person",
        value: "single",
      },
      {
        label: "Split evenly",
        value: "equal",
      },
      {
        label: "Percentages",
        value: "percentage",
      },
      {
        label: "Custom amounts",
        value: "custom",
      },
    ];

    return (
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {options.map((option) => {
          const selected =
            draft.splitType ===
            option.value;

          return (
            <Pressable
              key={option.value}
              onPress={() =>
                updateResponsibility(
                  sectionKey,
                  itemName,
                  {
                    splitType:
                      option.value,
                    assignedMemberId:
                      option.value ===
                      "single"
                        ? draft.assignedMemberId ??
                          participants[0]
                            ?.id
                        : undefined,
                    memberSplits:
                      createDefaultSplits(
                        option.value,
                        amount
                      ),
                  }
                )
              }
              style={({ pressed }) => ({
                opacity:
                  pressed ? 0.7 : 1,
                minWidth: 130,
                flexGrow:
                  isMobile ? 1 : 0,
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
  };

  const renderSingleMemberSelector = (
    sectionKey: HouseholdSectionKey,
    itemName: string,
    draft: ResponsibilityDraft
  ) => (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
      }}
    >
      {participants.map(
        (participant) => {
          const selected =
            draft.assignedMemberId ===
            participant.id;

          return (
            <Pressable
              key={participant.id}
              onPress={() =>
                updateResponsibility(
                  sectionKey,
                  itemName,
                  {
                    assignedMemberId:
                      participant.id,
                  }
                )
              }
              style={({ pressed }) => ({
                opacity:
                  pressed ? 0.7 : 1,
                minWidth: 120,
                flexGrow:
                  isMobile ? 1 : 0,
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
                      ? `${participant.label} selected`
                      : participant.label}
                  </AppText>
                </View>
              </AppCard>
            </Pressable>
          );
        }
      )}
    </View>
  );

  const updateMemberSplit = (
    sectionKey: HouseholdSectionKey,
    itemName: string,
    memberId: string,
    field: "amount" | "percentage",
    value: string
  ) => {
    const key = getResponsibilityKey(
      sectionKey,
      itemName
    );

    const draft =
      responsibilities[key];

    const nextSplits =
      draft.memberSplits.map(
        (split) =>
          split.memberId === memberId
            ? {
                ...split,
                [field]:
                  Number(
                    cleanAmount(value)
                  ) || 0,
              }
            : split
      );

    updateResponsibility(
      sectionKey,
      itemName,
      {
        memberSplits: nextSplits,
      }
    );
  };

  const renderMemberSplits = (
    sectionKey: HouseholdSectionKey,
    itemName: string,
    draft: ResponsibilityDraft
  ) => {
    if (
      draft.splitType !==
        "percentage" &&
      draft.splitType !== "custom"
    ) {
      return null;
    }

    const field =
      draft.splitType ===
      "percentage"
        ? "percentage"
        : "amount";

    return (
      <View style={{ gap: 10 }}>
        {participants.map(
          (participant) => {
            const split =
              draft.memberSplits.find(
                (item) =>
                  item.memberId ===
                  participant.id
              );

            const value =
              field === "percentage"
                ? String(
                    split?.percentage ??
                      ""
                  )
                : String(
                    split?.amount ?? ""
                  );

            return (
              <View
                key={participant.id}
                style={{
                  flexDirection:
                    isMobile
                      ? "column"
                      : "row",
                  alignItems:
                    isMobile
                      ? "stretch"
                      : "center",
                  gap: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <AppText variant="bold">
                    {participant.label}
                  </AppText>
                </View>

                <AppInput
                  placeholder={
                    field ===
                    "percentage"
                      ? "0%"
                      : "$0"
                  }
                  value={value}
                  onChangeText={(text) =>
                    updateMemberSplit(
                      sectionKey,
                      itemName,
                      participant.id,
                      field,
                      text
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
            );
          }
        )}
      </View>
    );
  };

  const renderFrequencySelector = (
    sectionKey: HouseholdSectionKey,
    itemName: string,
    draft: ResponsibilityDraft
  ) => {
    const frequencies: CalendarEventRepeat[] =
      [
        "weekly",
        "biweekly",
        "monthly",
        "yearly",
      ];

    return (
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {frequencies.map(
          (frequency) => {
            const selected =
              draft.frequency ===
              frequency;

            return (
              <Pressable
                key={frequency}
                onPress={() =>
                  updateResponsibility(
                    sectionKey,
                    itemName,
                    { frequency }
                  )
                }
                style={({ pressed }) => ({
                  opacity:
                    pressed ? 0.7 : 1,
                  minWidth: 110,
                  flexGrow:
                    isMobile ? 1 : 0,
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
                        ? `${getFrequencyLabel(
                            frequency
                          )} selected`
                        : getFrequencyLabel(
                            frequency
                          )}
                    </AppText>
                  </View>
                </AppCard>
              </Pressable>
            );
          }
        )}
      </View>
    );
  };

  const renderResponsibilityItem = (
    item: {
      sectionKey: HouseholdSectionKey;
      sectionTitle: string;
      itemName: string;
      amount: number;
    }
  ) => {
    const key =
      getResponsibilityKey(
        item.sectionKey,
        item.itemName
      );

    const draft =
      responsibilities[key];

    return (
      <AppCard key={key}>
        <View style={{ gap: 16 }}>
          <AppRow>
            <View style={{ flex: 1 }}>
              <AppText variant="section">
                {item.itemName}
              </AppText>

              <AppText variant="muted">
                {item.sectionTitle}
              </AppText>
            </View>

            <AppText variant="section">
              {formatMoney(item.amount)}
            </AppText>
          </AppRow>

          <View>
            <AppText variant="bold">
              Due day
            </AppText>

            <View
              style={{ marginTop: 8 }}
            >
              <AppInput
                placeholder="1 through 31"
                value={draft.dueDay}
                onChangeText={(text) =>
                  updateResponsibility(
                    item.sectionKey,
                    item.itemName,
                    {
                      dueDay:
                        cleanWholeNumber(
                          text
                        ).slice(0, 2),
                    }
                  )
                }
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <AppText variant="bold">
              Repeats
            </AppText>

            {renderFrequencySelector(
              item.sectionKey,
              item.itemName,
              draft
            )}
          </View>

          <View>
            <AppText variant="bold">
              Reminder
            </AppText>

            <View
              style={{ marginTop: 8 }}
            >
              <AppInput
                placeholder="Days before due date"
                value={
                  draft.reminderDaysBefore
                }
                onChangeText={(text) =>
                  updateResponsibility(
                    item.sectionKey,
                    item.itemName,
                    {
                      reminderDaysBefore:
                        cleanWholeNumber(
                          text
                        ).slice(0, 2),
                    }
                  )
                }
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <AppText variant="bold">
              Who pays for this?
            </AppText>

            {renderSplitSelector(
              item.sectionKey,
              item.itemName,
              item.amount,
              draft
            )}
          </View>

          {draft.splitType ===
          "single"
            ? renderSingleMemberSelector(
                item.sectionKey,
                item.itemName,
                draft
              )
            : null}

          {renderMemberSplits(
            item.sectionKey,
            item.itemName,
            draft
          )}

          <Pressable
            onPress={() =>
              updateResponsibility(
                item.sectionKey,
                item.itemName,
                {
                  required:
                    !draft.required,
                }
              )
            }
          >
            <AppRow>
              <View style={{ flex: 1 }}>
                <AppText variant="bold">
                  Required expense
                </AppText>

                <AppText variant="muted">
                  Mark this as something
                  the household cannot
                  skip.
                </AppText>
              </View>

              <AppText variant="bold">
                {draft.required
                  ? "Yes"
                  : "No"}
              </AppText>
            </AppRow>
          </Pressable>

          <View>
            <AppText variant="bold">
              Responsibility notes
            </AppText>

            <View
              style={{ marginTop: 8 }}
            >
              <AppInput
                placeholder="Optional instructions or details"
                value={draft.notes}
                onChangeText={(notes) =>
                  updateResponsibility(
                    item.sectionKey,
                    item.itemName,
                    { notes }
                  )
                }
                multiline
              />
            </View>
          </View>
        </View>
      </AppCard>
    );
  };

  const renderResponsibilities = () => (
    <>
      <AppCard>
        <View style={{ gap: 8 }}>
          <AppText variant="section">
            Household calendar setup
          </AppText>

          <AppText variant="muted">
            Every expense below will be
            added to the household
            calendar using its due date
            and repeat schedule.
          </AppText>
        </View>
      </AppCard>

      {responsibilityItems.length ===
      0 ? (
        <AppCard>
          <AppText variant="bold">
            No expenses added
          </AppText>

          <AppText variant="muted">
            Go back and add at least one
            bill, spending category, or
            savings category.
          </AppText>
        </AppCard>
      ) : (
        responsibilityItems.map(
          renderResponsibilityItem
        )
      )}
    </>
  );

  const renderPersonalPlan = () => (
    <>
      <Pressable
        onPress={() =>
          setIncludedInPersonalPlan(
            true
          )
        }
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
                    {invite.email}
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
        </View>
      </AppCard>

      <AppCard>
        <View style={{ gap: 14 }}>
          <AppText variant="section">
            Upcoming expenses
          </AppText>

          {responsibilityItems.map(
            (item) => {
              const draft =
                responsibilities[
                  getResponsibilityKey(
                    item.sectionKey,
                    item.itemName
                  )
                ];

              return (
                <AppRow
                  key={`${item.sectionKey}-${item.itemName}`}
                >
                  <View
                    style={{ flex: 1 }}
                  >
                    <AppText variant="bold">
                      {item.itemName}
                    </AppText>

                    <AppText variant="muted">
                      Due day{" "}
                      {draft.dueDay ||
                        "not set"}{" "}
                      ·{" "}
                      {getFrequencyLabel(
                        draft.frequency
                      )}
                    </AppText>
                  </View>

                  <AppText variant="bold">
                    {formatMoney(
                      item.amount
                    )}
                  </AppText>
                </AppRow>
              );
            }
          )}
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
                "responsibilities"
              )
            }
          >
            <AppRow>
              <AppText variant="muted">
                Responsibilities and due
                dates
              </AppText>

              <AppText variant="bold">
                Edit
              </AppText>
            </AppRow>
          </Pressable>

          <Pressable
            onPress={() =>
              goToStep(
                "personal-plan"
              )
            }
          >
            <AppRow>
              <AppText variant="muted">
                Personal plan
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
      "responsibilities"
        ? renderResponsibilities()
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