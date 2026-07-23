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
import {
  addCalendarEvent,
  deleteCalendarEventsBySource,
} from "@/lib/calendarStore";
import {
  createSharedWorkspace,
  inviteWorkspaceMember,
  updateSharedWorkspace,
  WorkspaceRole,
} from "@/lib/sharedWorkspaceStore";
import {
  BudgetItem,
  Business,
  BusinessMember,
  CalendarEvent,
  CalendarEventRepeat,
  HouseholdSplitType,
} from "@/lib/types";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  View,
} from "react-native";
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
      sectionKey: BusinessSectionKey;
      title: string;
      subtitle: string;
    }
  | {
      type: "responsibilities";
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

type ResponsibilityDraft = {
  dueDay: string;
  frequency: CalendarEventRepeat;
  reminderDaysBefore: string;
  assignedMemberId: string;
  splitType: HouseholdSplitType;
  required: boolean;
  notes: string;
};

type InviteDraft = {
  id: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  plannedContribution: string;
  savingsContribution: string;
};

const frequencyOptions: {
  label: string;
  value: CalendarEventRepeat;
}[] = [
  {
    label: "Weekly",
    value: "weekly",
  },
  {
    label: "Every two weeks",
    value: "biweekly",
  },
  {
    label: "Monthly",
    value: "monthly",
  },
  {
    label: "Yearly",
    value: "yearly",
  },
];

const splitOptions: {
  label: string;
  value: HouseholdSplitType;
}[] = [
  {
    label: "One person",
    value: "single",
  },
  {
    label: "Equal",
    value: "equal",
  },
  {
    label: "Percentage",
    value: "percentage",
  },
  {
    label: "Custom",
    value: "custom",
  },
];

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
    maximumFractionDigits: 0,
  })}`;

const createLocalId = (
  prefix: string
) =>
  `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

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

  const steps =
    useMemo<SetupStep[]>(() => {
      return [
        {
          type: "details",
          title: "Business Details",
          subtitle:
            "Set up the basics for this business.",
        },
        {
          type: "members",
          title: "Team Members",
          subtitle:
            "Add the people who help manage this business.",
        },
        {
          type: "contributions",
          title: "Contributions",
          subtitle:
            "Set the planned contribution for each team member.",
        },
        ...businessSections.map<SetupStep>(
          (section) => ({
            type: "budget",
            sectionKey: section.key,
            title: section.title,
            subtitle:
              section.key ===
              "revenueSources"
                ? "Enter the monthly revenue this business receives."
                : "Enter the monthly amount for each category that applies.",
          })
        ),
        {
          type: "responsibilities",
          title: "Responsibilities",
          subtitle:
            "Set due dates, schedules, reminders, and responsible members.",
        },
        {
          type: "income-mode",
          title: "Personal Income",
          subtitle:
            "Choose how this business connects to your personal budget.",
        },
        {
          type: "review",
          title: "Review Business",
          subtitle:
            "Review the business plan before saving.",
        },
      ];
    }, []);

  const [stepIndex, setStepIndex] =
    useState(0);

  const [name, setName] = useState(
    business?.name ?? ""
  );

  const [
    description,
    setDescription,
  ] = useState(
    business?.description ?? ""
  );

  const [
    businessType,
    setBusinessType,
  ] = useState(
    business?.businessType ??
      "Side Hustle"
  );

  const [incomeMode, setIncomeMode] =
    useState<
      "main" | "combined" | "separate"
    >(
      business?.incomeMode ??
        "separate"
    );

  const [ownerPay, setOwnerPay] =
    useState(
      business?.ownerPay
        ? String(business.ownerPay)
        : ""
    );

  const [
    inviteName,
    setInviteName,
  ] = useState("");

  const [
    inviteEmail,
    setInviteEmail,
  ] = useState("");

  const [inviteRole, setInviteRole] =
    useState<WorkspaceRole>(
      "editor"
    );

  const [members, setMembers] =
    useState<InviteDraft[]>(() => {
      return (
        business?.memberList
          ?.filter(
            (member) =>
              member.role !== "owner"
          )
          .map((member) => ({
            id: member.id,
            name:
              member.displayName ??
              member.accountName ??
              "",
            email:
              member.email ?? "",
            role: member.role,
            plannedContribution: String(
              member.plannedContribution ??
                0
            ),
            savingsContribution: String(
              member.savingsContribution ??
                0
            ),
          })) ?? []
      );
    });

  const [values, setValues] =
    useState<Record<string, string>>(
      () => {
        const initialValues: Record<
          string,
          string
        > = {};

        businessSections.forEach(
          (section) => {
            section.items.forEach(
              (itemName) => {
                const savedItem =
                  business?.budget[
                    section.key
                  ]?.find(
                    (item) =>
                      item.name === itemName
                  );

                initialValues[
                  `${section.key}-${itemName}`
                ] = savedItem
                  ? String(
                      savedItem.budget
                    )
                  : "";
              }
            );
          }
        );

        return initialValues;
      }
    );

  const [
    responsibilities,
    setResponsibilities,
  ] = useState<
    Record<string, ResponsibilityDraft>
  >(() => {
    const initial: Record<
      string,
      ResponsibilityDraft
    > = {};

    businessSections.forEach(
      (section) => {
        if (
          section.key ===
          "revenueSources"
        ) {
          return;
        }

        section.items.forEach(
          (itemName) => {
            const savedItem =
              business?.budget[
                section.key
              ]?.find(
                (item) =>
                  item.name === itemName
              );

            const key = `${section.key}-${itemName}`;

            initial[key] = {
              dueDay:
                savedItem?.dueDay
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
                  : "3",
              assignedMemberId:
                savedItem
                  ?.assignedMemberId ??
                "owner",
              splitType:
                savedItem?.splitType ??
                "single",
              required:
                savedItem?.required ??
                true,
              notes:
                savedItem
                  ?.responsibilityNotes ??
                "",
            };
          }
        );
      }
    );

    return initial;
  });

  const currentStep =
    steps[stepIndex];

  const progress =
    ((stepIndex + 1) /
      steps.length) *
    100;

  const getResponsibility = (
    sectionKey: BusinessSectionKey,
    itemName: string
  ) => {
    const key = `${sectionKey}-${itemName}`;

    return (
      responsibilities[key] ?? {
        dueDay: "",
        frequency: "monthly",
        reminderDaysBefore: "3",
        assignedMemberId: "owner",
        splitType: "single",
        required: true,
        notes: "",
      }
    );
  };

  const updateResponsibility = (
    sectionKey: BusinessSectionKey,
    itemName: string,
    updates: Partial<ResponsibilityDraft>
  ) => {
    const key = `${sectionKey}-${itemName}`;

    setResponsibilities(
      (previous) => ({
        ...previous,
        [key]: {
          ...getResponsibility(
            sectionKey,
            itemName
          ),
          ...updates,
        },
      })
    );
  };

  const buildItems = (
    sectionKey: BusinessSectionKey
  ): BudgetItem[] => {
    const section =
      businessSections.find(
        (item) =>
          item.key === sectionKey
      );

    if (!section) {
      return [];
    }

    return section.items
      .map((itemName) => {
        const savedItem =
          business?.budget[
            sectionKey
          ]?.find(
            (item) =>
              item.name === itemName
          );

        const responsibility =
          getResponsibility(
            sectionKey,
            itemName
          );

        const amount =
          Number(
            values[
              `${sectionKey}-${itemName}`
            ]
          ) || 0;

        const includeResponsibility =
          sectionKey !==
            "revenueSources" &&
          amount > 0;

        return {
          id:
            savedItem?.id ??
            `${sectionKey}-${itemName
              .toLowerCase()
              .replace(
                /[^a-z0-9]+/g,
                "-"
              )}`,
          name: itemName,
          budget: amount,
          spent:
            savedItem?.spent ?? 0,

          dueDay:
            includeResponsibility &&
            responsibility.dueDay
              ? Math.min(
                  Math.max(
                    Number(
                      responsibility.dueDay
                    ) || 1,
                    1
                  ),
                  31
                )
              : undefined,

          frequency:
            includeResponsibility
              ? responsibility.frequency
              : undefined,

          reminderDaysBefore:
            includeResponsibility
              ? Number(
                  responsibility
                    .reminderDaysBefore
                ) || 0
              : undefined,

          assignedMemberId:
            includeResponsibility
              ? responsibility
                  .assignedMemberId
              : undefined,

          splitType:
            includeResponsibility
              ? responsibility.splitType
              : undefined,

          required:
            includeResponsibility
              ? responsibility.required
              : undefined,

          responsibilityNotes:
            includeResponsibility
              ? responsibility.notes.trim() ||
                undefined
              : undefined,

          notes:
            savedItem?.notes,
          memberSplits:
            savedItem?.memberSplits,
        };
      })
      .filter(
        (item) => item.budget > 0
      );
  };

  const revenueSources = buildItems(
    "revenueSources"
  );

  const operatingExpenses =
    buildItems(
      "operatingExpenses"
    );

  const businessSpending =
    buildItems(
      "businessSpending"
    );

  const businessSavings =
    buildItems(
      "businessSavings"
    );

  const businessIncome =
    getBudgetTotal(revenueSources);

  const operatingTotal =
    getBudgetTotal(
      operatingExpenses
    );

  const spendingTotal =
    getBudgetTotal(
      businessSpending
    );

  const savingsTotal =
    getBudgetTotal(
      businessSavings
    );

  const assigned =
    operatingTotal +
    spendingTotal +
    savingsTotal;

  const spent =
    getSpentTotal(
      operatingExpenses
    ) +
    getSpentTotal(
      businessSpending
    ) +
    getSpentTotal(
      businessSavings
    );

  const ownerPayAmount =
    incomeMode === "separate"
      ? 0
      : Number(ownerPay) || 0;

  const totalPlannedOutflow =
    assigned + ownerPayAmount;

  const unassigned =
    businessIncome -
    totalPlannedOutflow;

  const availableAfterSpending =
    businessIncome - spent;

  const addMember = () => {
    const email =
      inviteEmail
        .trim()
        .toLowerCase();

    if (!email) {
      Alert.alert(
        "Email required",
        "Enter the team member's email address."
      );
      return;
    }

    if (!email.includes("@")) {
      Alert.alert(
        "Invalid email",
        "Enter a valid email address."
      );
      return;
    }

    const alreadyAdded =
      members.some(
        (member) =>
          member.email
            .trim()
            .toLowerCase() === email
      );

    if (alreadyAdded) {
      Alert.alert(
        "Member already added",
        "This email is already on the team list."
      );
      return;
    }

    setMembers((previous) => [
      ...previous,
      {
        id: createLocalId(
          "business-member"
        ),
        name: inviteName.trim(),
        email,
        role: inviteRole,
        plannedContribution: "",
        savingsContribution: "",
      },
    ]);

    setInviteName("");
    setInviteEmail("");
    setInviteRole("editor");
  };

  const removeMember = (
    memberId: string
  ) => {
    setMembers((previous) =>
      previous.filter(
        (member) =>
          member.id !== memberId
      )
    );
  };

  const updateMember = (
    memberId: string,
    updates: Partial<InviteDraft>
  ) => {
    setMembers((previous) =>
      previous.map((member) =>
        member.id === memberId
          ? {
              ...member,
              ...updates,
            }
          : member
      )
    );
  };

  const validateCurrentStep = () => {
    if (
      currentStep.type === "details"
    ) {
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
      currentStep.type ===
        "budget" &&
      currentStep.sectionKey ===
        "revenueSources" &&
      businessIncome <= 0
    ) {
      Alert.alert(
        "Revenue required",
        "Enter at least one monthly revenue source."
      );
      return false;
    }

    if (
      currentStep.type ===
      "responsibilities"
    ) {
      const expenseItems = [
        ...operatingExpenses,
        ...businessSpending,
        ...businessSavings,
      ];

      const missingDueDate =
        expenseItems.find(
          (item) => !item.dueDay
        );

      if (missingDueDate) {
        Alert.alert(
          "Due date required",
          `Choose a due day for ${missingDueDate.name}.`
        );
        return false;
      }
    }

    if (
      currentStep.type ===
        "income-mode" &&
      incomeMode !== "separate"
    ) {
      if (ownerPayAmount <= 0) {
        Alert.alert(
          "Owner pay required",
          "Enter how much this business pays you each month."
        );
        return false;
      }

      if (
        ownerPayAmount >
        businessIncome
      ) {
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

  const getMemberDisplayName = (
    memberId?: string
  ) => {
    if (
      !memberId ||
      memberId === "owner"
    ) {
      return "Owner";
    }

    const member = members.find(
      (item) =>
        item.id === memberId
    );

    return (
      member?.name ||
      member?.email ||
      "Team member"
    );
  };

  const buildMemberList =
    (): BusinessMember[] => {
      const existingOwner =
        business?.memberList?.find(
          (member) =>
            member.role === "owner"
        );

      const owner: BusinessMember = {
        id:
          existingOwner?.id ??
          "owner",
        workspaceId:
          business?.workspaceId,
        userId:
          existingOwner?.userId,
        email:
          existingOwner?.email,
        accountName:
          existingOwner?.accountName,
        displayName:
          existingOwner?.displayName ??
          "Owner",
        role: "owner",
        status: "active",
        plannedContribution:
          existingOwner
            ?.plannedContribution ?? 0,
        contributedAmount:
          existingOwner
            ?.contributedAmount ?? 0,
        savingsContribution:
          existingOwner
            ?.savingsContribution ?? 0,
        hasCompletedSetup: true,
        joinedAt:
          existingOwner?.joinedAt ??
          new Date().toISOString(),
      };

      const invitedMembers =
        members.map<BusinessMember>(
          (member) => ({
            id: member.id,
            workspaceId:
              business?.workspaceId,
            email: member.email,
            displayName:
              member.name ||
              member.email,
            role: member.role,
            status: "pending",
            plannedContribution:
              Number(
                member.plannedContribution
              ) || 0,
            contributedAmount: 0,
            savingsContribution:
              Number(
                member.savingsContribution
              ) || 0,
            invitedAt:
              new Date().toISOString(),
            hasCompletedSetup: false,
          })
        );

      return [
        owner,
        ...invitedMembers,
      ];
    };

  const rebuildBusinessCalendar =
    async (
      savedBusiness: Business
    ) => {
      await deleteCalendarEventsBySource(
        "business",
        savedBusiness.id
      );

      const scheduledItems = [
        ...savedBusiness.budget
          .operatingExpenses,
        ...savedBusiness.budget
          .businessSpending,
        ...savedBusiness.budget
          .businessSavings,
      ].filter(
        (item) =>
          item.budget > 0 &&
          item.dueDay &&
          item.frequency &&
          item.frequency !== "never"
      );

      for (const item of scheduledItems) {
        const assignedMemberName =
          getMemberDisplayName(
            item.assignedMemberId
          );

        const event: CalendarEvent = {
          id: createLocalId(
            `business-event-${item.id}`
          ),
          title: item.name,
          amount: item.budget,
          day: item.dueDay ?? 1,
          month:
            new Date().getMonth(),
          year:
            new Date().getFullYear(),
          repeat:
            item.frequency ??
            "monthly",
          type: "business",
          notes:
            item.responsibilityNotes,
          sourceId:
            savedBusiness.id,
          sourceType: "business",
          budgetItemId: item.id,
          assignedMemberId:
            item.assignedMemberId,
          businessMemberId:
            item.assignedMemberId,
          assignedMemberName,
          reminderDaysBefore:
            item.reminderDaysBefore,
          required: item.required,
          completed: false,
          createdAt:
            new Date().toISOString(),
        };

        await addCalendarEvent(event);
      }
    };

  const handleSave = async () => {
    if (
      !name.trim() ||
      businessIncome <= 0
    ) {
      Alert.alert(
        "Business incomplete",
        "Add a business name and at least one revenue source."
      );
      return;
    }

    if (
      incomeMode !== "separate" &&
      ownerPayAmount >
        businessIncome
    ) {
      Alert.alert(
        "Owner pay is too high",
        "Owner pay cannot exceed the business income."
      );
      return;
    }

    const now =
      new Date().toISOString();

    const savedBusiness: Business = {
      id:
        business?.id ??
        createLocalId("business"),

      workspaceId:
        business?.workspaceId,

      name: name.trim(),
      description:
        description.trim(),
      businessType:
        businessType.trim(),

      incomeMode,
      ownerPay: ownerPayAmount,

      members:
        members.length + 1,
      memberList:
        buildMemberList(),

      budget: {
        businessIncome,
        revenueSources,
        operatingExpenses,
        businessSpending,
        businessSavings,
      },

      activity:
        business?.activity ?? [],

      createdByUserId:
        business?.createdByUserId,

      createdAt:
        business?.createdAt ?? now,

      updatedAt: now,
      hasCompletedSetup: true,
    };

    try {
      if (isEditing) {
        await updateBusiness(
          savedBusiness.id,
          savedBusiness
        );

        if (
          savedBusiness.workspaceId
        ) {
          await updateSharedWorkspace(
            savedBusiness.workspaceId,
            savedBusiness
          );
        } else {
          const shared =
            await createSharedWorkspace(
              "business",
              savedBusiness
            );

          savedBusiness.workspaceId =
            shared.id;

          savedBusiness.memberList =
            savedBusiness.memberList?.map(
              (member) => ({
                ...member,
                workspaceId: shared.id,
              })
            );

          await updateBusiness(
            savedBusiness.id,
            savedBusiness
          );

          await updateSharedWorkspace(
            shared.id,
            savedBusiness
          );
        }
      } else {
        await addBusiness(
          savedBusiness
        );

        const shared =
          await createSharedWorkspace(
            "business",
            savedBusiness
          );

        savedBusiness.workspaceId =
          shared.id;

        savedBusiness.memberList =
          savedBusiness.memberList?.map(
            (member) => ({
              ...member,
              workspaceId: shared.id,
            })
          );

        await updateBusiness(
          savedBusiness.id,
          savedBusiness
        );

        await updateSharedWorkspace(
          shared.id,
          savedBusiness
        );

        for (const member of members) {
          await inviteWorkspaceMember({
            workspaceId: shared.id,
            email: member.email,
            role: member.role,
          });
        }
      }

      await rebuildBusinessCalendar(
        savedBusiness
      );

      onSave(savedBusiness);
    } catch (error) {
      Alert.alert(
        "Business could not be saved",
        error instanceof Error
          ? error.message
          : "Something went wrong while saving the business."
      );
    }
  };

  const renderDetails = () => (
    <AppCard>
      <View style={{ gap: 16 }}>
        <View>
          <AppText variant="bold">
            Business name
          </AppText>

          <View
            style={{ marginTop: 8 }}
          >
            <AppInput
              placeholder="Business Name"
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        <View>
          <AppText variant="bold">
            Business type
          </AppText>

          <View
            style={{ marginTop: 8 }}
          >
            <AppInput
              placeholder="Side Hustle, LLC, Freelance"
              value={businessType}
              onChangeText={
                setBusinessType
              }
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
              placeholder="Describe the business"
              value={description}
              onChangeText={
                setDescription
              }
              multiline
            />
          </View>
        </View>
      </View>
    </AppCard>
  );

  const renderMembers = () => (
    <>
      <AppCard>
        <View style={{ gap: 14 }}>
          <View>
            <AppText variant="bold">
              Team member name
            </AppText>

            <View
              style={{ marginTop: 8 }}
            >
              <AppInput
                placeholder="Name"
                value={inviteName}
                onChangeText={
                  setInviteName
                }
              />
            </View>
          </View>

          <View>
            <AppText variant="bold">
              Email address
            </AppText>

            <View
              style={{ marginTop: 8 }}
            >
              <AppInput
                placeholder="name@email.com"
                value={inviteEmail}
                onChangeText={
                  setInviteEmail
                }
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View>
            <AppText variant="bold">
              Access level
            </AppText>

            <View
              style={{
                marginTop: 8,
                gap: 8,
              }}
            >
              {(
                [
                  {
                    value:
                      "editor" as const,
                    label: "Editor",
                    description:
                      "Can update the business budget.",
                  },
                  {
                    value:
                      "viewer" as const,
                    label: "Viewer",
                    description:
                      "Can view the business without editing.",
                  },
                ]
              ).map((option) => {
                const selected =
                  inviteRole ===
                  option.value;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() =>
                      setInviteRole(
                        option.value
                      )
                    }
                  >
                    <AppCard>
                      <AppRow>
                        <View
                          style={{
                            flex: 1,
                          }}
                        >
                          <AppText variant="bold">
                            {
                              option.label
                            }
                          </AppText>

                          <AppText variant="muted">
                            {
                              option.description
                            }
                          </AppText>
                        </View>

                        <AppText variant="bold">
                          {selected
                            ? "Selected"
                            : "Select"}
                        </AppText>
                      </AppRow>
                    </AppCard>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <AppButton
            title="Add Team Member"
            onPress={addMember}
          />
        </View>
      </AppCard>

      {members.length === 0 ? (
        <AppCard>
          <AppText variant="bold">
            No team members added
          </AppText>

          <View
            style={{ marginTop: 4 }}
          >
            <AppText variant="muted">
              You can continue as the only
              owner and invite people later.
            </AppText>
          </View>
        </AppCard>
      ) : (
        members.map((member) => (
          <AppCard key={member.id}>
            <AppRow>
              <View style={{ flex: 1 }}>
                <AppText variant="bold">
                  {member.name ||
                    member.email}
                </AppText>

                <AppText variant="muted">
                  {member.email}
                </AppText>

                <AppText variant="muted">
                  {member.role ===
                  "editor"
                    ? "Editor"
                    : "Viewer"}
                </AppText>
              </View>

              <AppButton
                title="Remove"
                variant="outline"
                onPress={() =>
                  removeMember(
                    member.id
                  )
                }
              />
            </AppRow>
          </AppCard>
        ))
      )}
    </>
  );

  const renderContributions = () => (
    <>
      <AppCard>
        <AppText variant="section">
          Owner
        </AppText>

        <View style={{ marginTop: 4 }}>
          <AppText variant="muted">
            The owner manages the business
            by default.
          </AppText>
        </View>
      </AppCard>

      {members.length === 0 ? (
        <AppCard>
          <AppText variant="muted">
            Add team members to assign
            planned contributions.
          </AppText>
        </AppCard>
      ) : (
        members.map((member) => (
          <AppCard key={member.id}>
            <View style={{ gap: 14 }}>
              <View>
                <AppText variant="section">
                  {member.name ||
                    member.email}
                </AppText>

                <AppText variant="muted">
                  {member.email}
                </AppText>
              </View>

              <View>
                <AppText variant="bold">
                  Planned business
                  contribution
                </AppText>

                <View
                  style={{
                    marginTop: 8,
                  }}
                >
                  <AppInput
                    placeholder="$0"
                    value={
                      member.plannedContribution
                    }
                    onChangeText={(
                      text
                    ) =>
                      updateMember(
                        member.id,
                        {
                          plannedContribution:
                            cleanAmount(
                              text
                            ),
                        }
                      )
                    }
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View>
                <AppText variant="bold">
                  Planned reserve
                  contribution
                </AppText>

                <View
                  style={{
                    marginTop: 8,
                  }}
                >
                  <AppInput
                    placeholder="$0"
                    value={
                      member.savingsContribution
                    }
                    onChangeText={(
                      text
                    ) =>
                      updateMember(
                        member.id,
                        {
                          savingsContribution:
                            cleanAmount(
                              text
                            ),
                        }
                      )
                    }
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>
          </AppCard>
        ))
      )}
    </>
  );

  const renderBudgetSection = (
    sectionKey: BusinessSectionKey
  ) => {
    const section =
      businessSections.find(
        (item) =>
          item.key === sectionKey
      );

    if (!section) {
      return null;
    }

    const sectionTotal =
      getBudgetTotal(
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
                Fill in only what
                applies.
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
                <View key={itemName}>
                  <AppRow>
                    <View
                      style={{ flex: 1 }}
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
                          (previous) => ({
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
                        width: 130,
                        textAlign:
                          "right",
                      }}
                    />
                  </AppRow>
                </View>
              )
            )}
          </View>
        </AppCard>
      </>
    );
  };

 const renderChoice = ({
  keyValue,
  title,
  selected,
  onPress,
}: {
  keyValue?: string;
  title: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <Pressable
    key={keyValue}
    onPress={onPress}
  >
    <AppCard>
      <AppRow>
        <AppText variant="bold">
          {title}
        </AppText>

        <AppText variant="bold">
          {selected
            ? "Selected"
            : "Select"}
        </AppText>
      </AppRow>
    </AppCard>
  </Pressable>
);

  const renderResponsibilities =
    () => {
      const sections =
        businessSections.filter(
          (section) =>
            section.key !==
            "revenueSources"
        );

      const activeSections =
        sections
          .map((section) => ({
            ...section,
            activeItems:
              section.items.filter(
                (itemName) =>
                  Number(
                    values[
                      `${section.key}-${itemName}`
                    ]
                  ) > 0
              ),
          }))
          .filter(
            (section) =>
              section.activeItems
                .length > 0
          );

      if (
        activeSections.length === 0
      ) {
        return (
          <AppCard>
            <AppText variant="muted">
              Add at least one business
              expense before assigning
              responsibilities.
            </AppText>
          </AppCard>
        );
      }

      return (
        <>
          {activeSections.map(
            (section) => (
              <View
                key={section.key}
                style={{ gap: 12 }}
              >
                <AppCard>
                  <AppText variant="section">
                    {section.title}
                  </AppText>
                </AppCard>

                {section.activeItems.map(
                  (itemName) => {
                    const draft =
                      getResponsibility(
                        section.key,
                        itemName
                      );

                    return (
                      <AppCard
                        key={itemName}
                      >
                        <View
                          style={{
                            gap: 14,
                          }}
                        >
                          <AppRow>
                            <View
                              style={{
                                flex: 1,
                              }}
                            >
                              <AppText variant="section">
                                {itemName}
                              </AppText>

                              <AppText variant="muted">
                                {formatMoney(
                                  Number(
                                    values[
                                      `${section.key}-${itemName}`
                                    ]
                                  ) || 0
                                )}
                              </AppText>
                            </View>

                            <AppText variant="bold">
                              {draft.required
                                ? "Required"
                                : "Optional"}
                            </AppText>
                          </AppRow>

                          <View>
                            <AppText variant="bold">
                              Due day
                            </AppText>

                            <View
                              style={{
                                marginTop: 8,
                              }}
                            >
                              <AppInput
                                placeholder="1-31"
                                value={
                                  draft.dueDay
                                }
                                onChangeText={(
                                  text
                                ) =>
                                  updateResponsibility(
                                    section.key,
                                    itemName,
                                    {
                                      dueDay:
                                        cleanWholeNumber(
                                          text
                                        ),
                                    }
                                  )
                                }
                                keyboardType="number-pad"
                              />
                            </View>
                          </View>

                          <View>
                            <AppText variant="bold">
                              Repeat
                            </AppText>

                            <View
                              style={{
                                marginTop: 8,
                                gap: 8,
                              }}
                            >
                              {frequencyOptions.map(
  (option) =>
    renderChoice({
      keyValue: `${section.key}-${itemName}-frequency-${option.value}`,
      title: option.label,
      selected:
        draft.frequency ===
        option.value,
      onPress: () =>
        updateResponsibility(
          section.key,
          itemName,
          {
            frequency:
              option.value,
          }
        ),
    })
)}
                            </View>
                          </View>

                          <View>
                            <AppText variant="bold">
                              Reminder
                            </AppText>

                            <View
                              style={{
                                marginTop: 8,
                              }}
                            >
                              <AppInput
                                placeholder="Days before"
                                value={
                                  draft.reminderDaysBefore
                                }
                                onChangeText={(
                                  text
                                ) =>
                                  updateResponsibility(
                                    section.key,
                                    itemName,
                                    {
                                      reminderDaysBefore:
                                        cleanWholeNumber(
                                          text
                                        ),
                                    }
                                  )
                                }
                                keyboardType="number-pad"
                              />
                            </View>
                          </View>

                          <View>
                            <AppText variant="bold">
                              Responsible
                              person
                            </AppText>

                            <View
                              style={{
                                marginTop: 8,
                                gap: 8,
                              }}
                            >
                              {renderChoice({
                                title:
                                  "Owner",
                                selected:
                                  draft.assignedMemberId ===
                                  "owner",
                                onPress:
                                  () =>
                                    updateResponsibility(
                                      section.key,
                                      itemName,
                                      {
                                        assignedMemberId:
                                          "owner",
                                      }
                                    ),
                              })}

                              {members.map(
                                (
                                  member
                                ) =>
                                  renderChoice(
                                    {
                                      title:
                                        member.name ||
                                        member.email,
                                      selected:
                                        draft.assignedMemberId ===
                                        member.id,
                                      onPress:
                                        () =>
                                          updateResponsibility(
                                            section.key,
                                            itemName,
                                            {
                                              assignedMemberId:
                                                member.id,
                                            }
                                          ),
                                    }
                                  )
                              )}
                            </View>
                          </View>

                          <View>
                            <AppText variant="bold">
                              Split
                            </AppText>

                            <View
                              style={{
                                marginTop: 8,
                                gap: 8,
                              }}
                            >
                              {splitOptions.map(
  (option) =>
    renderChoice({
      keyValue: `${section.key}-${itemName}-split-${option.value}`,
      title: option.label,
      selected:
        draft.splitType ===
        option.value,
      onPress: () =>
        updateResponsibility(
          section.key,
          itemName,
          {
            splitType:
              option.value,
          }
        ),
    })
)}
                            </View>
                          </View>

                          <Pressable
                            onPress={() =>
                              updateResponsibility(
                                section.key,
                                itemName,
                                {
                                  required:
                                    !draft.required,
                                }
                              )
                            }
                          >
                            <AppCard>
                              <AppRow>
                                <AppText variant="bold">
                                  Required
                                  expense
                                </AppText>

                                <AppText variant="bold">
                                  {draft.required
                                    ? "Yes"
                                    : "No"}
                                </AppText>
                              </AppRow>
                            </AppCard>
                          </Pressable>

                          <View>
                            <AppText variant="bold">
                              Notes
                            </AppText>

                            <View
                              style={{
                                marginTop: 8,
                              }}
                            >
                              <AppInput
                                placeholder="Add responsibility notes"
                                value={
                                  draft.notes
                                }
                                onChangeText={(
                                  text
                                ) =>
                                  updateResponsibility(
                                    section.key,
                                    itemName,
                                    {
                                      notes:
                                        text,
                                    }
                                  )
                                }
                                multiline
                              />
                            </View>
                          </View>
                        </View>
                      </AppCard>
                    );
                  }
                )}
              </View>
            )
          )}
        </>
      );
    };

  const renderIncomeModeOption = ({
    mode,
    title,
    description:
      optionDescription,
  }: {
    mode:
      | "main"
      | "combined"
      | "separate";
    title: string;
    description: string;
  }) => {
    const selected =
      incomeMode === mode;

    return (
      <Pressable
        onPress={() => {
          setIncomeMode(mode);

          if (
            mode === "separate"
          ) {
            setOwnerPay("");
          }

          if (
            mode === "main" &&
            Number(ownerPay) <= 0
          ) {
            setOwnerPay(
              String(
                businessIncome
              )
            );
          }
        }}
      >
        <AppCard>
          <AppRow>
            <View style={{ flex: 1 }}>
              <AppText variant="bold">
                {title}
              </AppText>

              <View
                style={{
                  marginTop: 4,
                }}
              >
                <AppText variant="muted">
                  {
                    optionDescription
                  }
                </AppText>
              </View>
            </View>

            <AppText variant="bold">
              {selected
                ? "Selected"
                : "Select"}
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
          "Add monthly owner pay alongside your other personal income.",
      })}

      {renderIncomeModeOption({
        mode: "separate",
        title: "Keep separate",
        description:
          "Keep all business income outside your personal budget.",
      })}

      {incomeMode !==
      "separate" ? (
        <AppCard>
          <AppText variant="section">
            Monthly owner pay
          </AppText>

          <View
            style={{ marginTop: 6 }}
          >
            <AppText variant="muted">
              This amount will be added
              to your personal income.
              Business expenses stay
              separate.
            </AppText>
          </View>

          <View
            style={{ marginTop: 14 }}
          >
            <AppInput
              placeholder="$0"
              value={ownerPay}
              onChangeText={(text) =>
                setOwnerPay(
                  cleanAmount(text)
                )
              }
              keyboardType="decimal-pad"
            />
          </View>

          <View
            style={{ marginTop: 12 }}
          >
            <AppButton
              title={`Use Full Revenue ${formatMoney(
                businessIncome
              )}`}
              variant="outline"
              onPress={() =>
                setOwnerPay(
                  String(
                    businessIncome
                  )
                )
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
        <AppText variant="muted">
          Business
        </AppText>

        <View style={{ marginTop: 4 }}>
          <AppText variant="title">
            {name}
          </AppText>
        </View>

        <AppText variant="muted">
          {businessType}
        </AppText>

        {description ? (
          <View
            style={{ marginTop: 10 }}
          >
            <AppText variant="muted">
              {description}
            </AppText>
          </View>
        ) : null}
      </AppCard>

      <View
        style={{
          flexDirection: "row",
          gap: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Revenue"
            value={formatMoney(
              businessIncome
            )}
            caption="Monthly"
            tone="primary"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Owner Pay"
            value={formatMoney(
              ownerPayAmount
            )}
            caption="Personal income"
            tone="primary"
          />
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Assigned"
            value={formatMoney(
              assigned
            )}
            caption="Business plan"
            tone={
              totalPlannedOutflow >
              businessIncome
                ? "danger"
                : "success"
            }
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Unassigned"
            value={formatMoney(
              unassigned
            )}
            caption="Remaining"
            tone={
              unassigned < 0
                ? "danger"
                : "success"
            }
          />
        </View>
      </View>

      <AppCard>
        <View style={{ gap: 12 }}>
          <AppRow>
            <AppText variant="muted">
              Team members
            </AppText>

            <AppText variant="bold">
              {members.length + 1}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Revenue
            </AppText>

            <AppText variant="bold">
              {formatMoney(
                businessIncome
              )}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Operating expenses
            </AppText>

            <AppText variant="bold">
              {formatMoney(
                operatingTotal
              )}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Business spending
            </AppText>

            <AppText variant="bold">
              {formatMoney(
                spendingTotal
              )}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Savings and reserves
            </AppText>

            <AppText variant="bold">
              {formatMoney(
                savingsTotal
              )}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Owner pay
            </AppText>

            <AppText variant="bold">
              {formatMoney(
                ownerPayAmount
              )}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Available after
              spending
            </AppText>

            <AppText variant="bold">
              {formatMoney(
                availableAfterSpending
              )}
            </AppText>
          </AppRow>
        </View>
      </AppCard>

      {unassigned < 0 ? (
        <AppCard>
          <AppText variant="bold">
            Plan exceeds revenue
          </AppText>

          <View
            style={{ marginTop: 4 }}
          >
            <AppText variant="muted">
              Reduce expenses,
              savings, or owner pay
              by{" "}
              {formatMoney(
                Math.abs(unassigned)
              )}
              .
            </AppText>
          </View>
        </AppCard>
      ) : null}
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
      "income-mode"
        ? renderIncomeMode()
        : null}

      {currentStep.type ===
      "review"
        ? renderReview()
        : null}

      {currentStep.type ===
      "review" ? (
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