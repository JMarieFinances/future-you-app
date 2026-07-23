import {
  getBudgetTotal,
  getSpentTotal,
} from "@/components/budget/budgetUtils";
import WorkspaceCalendar from "@/components/calendar/WorkspaceCalendar";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import MetricCard from "@/components/ui/MetricCard";
import WorkspaceAfford from "@/components/workspace/WorkspaceAfford";
import WorkspaceChat from "@/components/workspace/WorkspaceChat";
import WorkspaceDashboard, {
  type WorkspaceTab,
} from "@/components/workspace/WorkspaceDashboard";
import WorkspaceMembers from "@/components/workspace/WorkspaceMembers";
import WorkspaceTransactions from "@/components/workspace/WorkspaceTransactions";
import { getCalendarEvents } from "@/lib/calendarStore";
import { getPurchases } from "@/lib/purchaseStore";
import {
  getOrCreateSharedWorkspace,
  getWorkspaceMembers,
  subscribeToSharedWorkspace,
  type WorkspaceMember,
} from "@/lib/sharedWorkspaceStore";
import type {
  BudgetItem,
  Business,
  Purchase,
} from "@/lib/types";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import BusinessPlan from "./BusinessPlan";

type Props = {
  business: Business;
  onBack: () => void;
  onEditBudget: () => void;
  onAddTransaction: () => void;
  onEditTransaction: (
    transaction: Purchase
  ) => void;
  onDeleteTransaction: (
    transactionId: string
  ) => void;
};

type ResponsibilityItem = BudgetItem & {
  sectionLabel: string;
};

const formatMoney = (amount: number) =>
  `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatFrequency = (
  frequency?: BudgetItem["frequency"]
) => {
  switch (frequency) {
    case "weekly":
      return "Weekly";
    case "biweekly":
      return "Every two weeks";
    case "monthly":
      return "Monthly";
    case "yearly":
      return "Yearly";
    case "never":
      return "Does not repeat";
    default:
      return "Monthly";
  }
};

const getCurrentDueDate = (
  dueDay?: number
) => {
  if (!dueDay) {
    return null;
  }

  const today = new Date();

  let dueDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    dueDay
  );

  if (
    dueDate.getTime() <
    new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).getTime()
  ) {
    dueDate = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      dueDay
    );
  }

  return dueDate;
};

const formatDueDate = (
  dueDay?: number
) => {
  const dueDate =
    getCurrentDueDate(dueDay);

  if (!dueDate) {
    return "No due date";
  }

  return dueDate.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
    }
  );
};

export default function BusinessDashboard({
  business,
  onBack,
  onEditBudget,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: Props) {
  const [activeTab, setActiveTab] =
    useState<WorkspaceTab>("overview");

  const [
    sharedWorkspaceId,
    setSharedWorkspaceId,
  ] = useState(
    business.workspaceId ?? ""
  );

  const [
    workspaceLoading,
    setWorkspaceLoading,
  ] = useState(true);

  const [
    workspaceError,
    setWorkspaceError,
  ] = useState("");

  const [
    dashboardRefreshing,
    setDashboardRefreshing,
  ] = useState(false);

  const [
    workspaceMembers,
    setWorkspaceMembers,
  ] = useState<WorkspaceMember[]>([]);

  const transactions = useMemo(
    () =>
      getPurchases()
        .filter(
          (purchase) =>
            purchase.budgetType ===
              "business" &&
            purchase.budgetId ===
              business.id
        )
        .sort(
          (first, second) =>
            new Date(
              second.date
            ).getTime() -
            new Date(
              first.date
            ).getTime()
        ),
    [business.id]
  );

  const businessEvents = useMemo(
    () =>
      getCalendarEvents().filter(
        (event) =>
          event.sourceType ===
            "business" &&
          event.sourceId ===
            business.id
      ),
    [business.id]
  );

  const income =
    business.budget.businessIncome;

  const operatingBudget =
    getBudgetTotal(
      business.budget.operatingExpenses
    );

  const spendingBudget =
    getBudgetTotal(
      business.budget.businessSpending
    );

  const savingsBudget =
    getBudgetTotal(
      business.budget.businessSavings
    );

  const assigned =
    operatingBudget +
    spendingBudget +
    savingsBudget;

  const operatingSpent =
    getSpentTotal(
      business.budget.operatingExpenses
    );

  const spendingSpent =
    getSpentTotal(
      business.budget.businessSpending
    );

  const savingsSpent =
    getSpentTotal(
      business.budget.businessSavings
    );

  const spent =
    operatingSpent +
    spendingSpent +
    savingsSpent;

  const ownerPay =
    business.incomeMode === "separate"
      ? 0
      : business.ownerPay || 0;

  const available =
    income - spent - ownerPay;

  const plannedAvailable =
    income - assigned - ownerPay;

  const profit =
    income -
    operatingSpent -
    spendingSpent -
    ownerPay;

  const subtitle = `${
    business.businessType
  }${
    business.description
      ? ` · ${business.description}`
      : ""
  }`;

  const responsibilities =
    useMemo<ResponsibilityItem[]>(
      () => {
        const items: ResponsibilityItem[] =
          [
            ...business.budget.operatingExpenses.map(
              (item) => ({
                ...item,
                sectionLabel:
                  "Operating Expense",
              })
            ),
            ...business.budget.businessSpending.map(
              (item) => ({
                ...item,
                sectionLabel:
                  "Business Spending",
              })
            ),
            ...business.budget.businessSavings.map(
              (item) => ({
                ...item,
                sectionLabel:
                  "Savings & Reserves",
              })
            ),
          ];

        return items
          .filter(
            (item) =>
              item.budget > 0
          )
          .sort((first, second) => {
            const firstDate =
              getCurrentDueDate(
                first.dueDay
              );

            const secondDate =
              getCurrentDueDate(
                second.dueDay
              );

            if (
              firstDate &&
              secondDate
            ) {
              return (
                firstDate.getTime() -
                secondDate.getTime()
              );
            }

            if (firstDate) {
              return -1;
            }

            if (secondDate) {
              return 1;
            }

            return first.name.localeCompare(
              second.name
            );
          });
      },
      [business]
    );

  const upcomingResponsibilities =
    responsibilities.slice(0, 6);

  const recentTransactions =
    transactions.slice(0, 4);

  const loadSharedWorkspace =
    useCallback(
      async (
        showRefresh = false
      ) => {
        if (showRefresh) {
          setDashboardRefreshing(true);
        }

        setWorkspaceError("");

        try {
          const sharedWorkspace =
            await getOrCreateSharedWorkspace(
              "business",
              business
            );

          setSharedWorkspaceId(
            sharedWorkspace.id
          );

          const members =
            await getWorkspaceMembers(
              sharedWorkspace.id
            );

          setWorkspaceMembers(
            members
          );
        } catch (error) {
          setSharedWorkspaceId("");
          setWorkspaceMembers([]);

          setWorkspaceError(
            error instanceof Error
              ? error.message
              : "Unable to connect this business to its shared workspace."
          );
        } finally {
          setWorkspaceLoading(false);
          setDashboardRefreshing(
            false
          );
        }
      },
      [
        business.id,
        business.name,
        business.description,
        business.businessType,
        business.workspaceId,
      ]
    );

  useEffect(() => {
    loadSharedWorkspace();
  }, [loadSharedWorkspace]);

  useEffect(() => {
    if (!sharedWorkspaceId) {
      return;
    }

    return subscribeToSharedWorkspace(
      sharedWorkspaceId,
      () => loadSharedWorkspace()
    );
  }, [
    sharedWorkspaceId,
    loadSharedWorkspace,
  ]);

  const getAssignedMemberName = (
    memberId?: string
  ) => {
    if (
      !memberId ||
      memberId === "owner"
    ) {
      const sharedOwner =
        workspaceMembers.find(
          (member) =>
            member.role === "owner"
        );

      return (
        sharedOwner?.display_name?.trim() ||
        business.memberList?.find(
          (member) =>
            member.role === "owner"
        )?.displayName ||
        "Business Owner"
      );
    }

    const sharedMember =
      workspaceMembers.find(
        (member) =>
          member.id === memberId ||
          member.user_id === memberId
      );

    if (sharedMember) {
      return (
        sharedMember.display_name?.trim() ||
        sharedMember.email ||
        "Team Member"
      );
    }

    const savedMember =
      business.memberList?.find(
        (member) =>
          member.id === memberId ||
          member.userId === memberId
      );

    return (
      savedMember?.displayName ||
      savedMember?.accountName ||
      savedMember?.email ||
      "Team Member"
    );
  };

  const renderDashboardError =
    () => {
      if (!workspaceError) {
        return null;
      }

      return (
        <AppCard>
          <View style={{ gap: 12 }}>
            <AppText variant="section">
              Business data could not
              be loaded
            </AppText>

            <AppText variant="muted">
              {workspaceError}
            </AppText>

            <AppButton
              title="Try Again"
              onPress={() =>
                loadSharedWorkspace()
              }
              variant="outline"
            />
          </View>
        </AppCard>
      );
    };

  const renderOverview = () => (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={
            dashboardRefreshing
          }
          onRefresh={() =>
            loadSharedWorkspace(true)
          }
        />
      }
      contentContainerStyle={{
        gap: 14,
        paddingBottom: 40,
      }}
      showsVerticalScrollIndicator={
        false
      }
    >
      {renderDashboardError()}

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <View
          style={{
            flexGrow: 1,
            flexBasis: 160,
          }}
        >
          <MetricCard
            title="Available"
            value={formatMoney(
              available
            )}
            caption="Revenue minus spending"
            tone={
              available < 0
                ? "danger"
                : "success"
            }
          />
        </View>

        <View
          style={{
            flexGrow: 1,
            flexBasis: 160,
          }}
        >
          <MetricCard
            title="Spent"
            value={formatMoney(spent)}
            caption="Business spending"
            tone="primary"
          />
        </View>

        <View
          style={{
            flexGrow: 1,
            flexBasis: 160,
          }}
        >
          <MetricCard
            title="Profit"
            value={formatMoney(profit)}
            caption="After expenses"
            tone={
              profit < 0
                ? "danger"
                : "success"
            }
          />
        </View>

        <View
          style={{
            flexGrow: 1,
            flexBasis: 160,
          }}
        >
          <MetricCard
            title="Reserves"
            value={formatMoney(
              savingsSpent
            )}
            caption={`${formatMoney(
              savingsBudget
            )} planned`}
            tone="success"
          />
        </View>
      </View>

      <AppCard>
        <View style={{ gap: 14 }}>
          <AppRow>
            <View style={{ flex: 1 }}>
              <AppText variant="section">
                Business plan
              </AppText>

              <AppText variant="muted">
                Monthly budget progress
              </AppText>
            </View>

            <Pressable
              onPress={() =>
                setActiveTab("budget")
              }
            >
              <AppText variant="bold">
                View Plan
              </AppText>
            </Pressable>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Monthly revenue
            </AppText>

            <AppText variant="bold">
              {formatMoney(income)}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Assigned
            </AppText>

            <AppText variant="bold">
              {formatMoney(assigned)}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Owner pay
            </AppText>

            <AppText variant="bold">
              {formatMoney(ownerPay)}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Unassigned
            </AppText>

            <AppText variant="bold">
              {formatMoney(
                plannedAvailable
              )}
            </AppText>
          </AppRow>
        </View>
      </AppCard>

      <AppCard>
        <View style={{ gap: 14 }}>
          <AppRow>
            <View style={{ flex: 1 }}>
              <AppText variant="section">
                Upcoming Responsibilities
              </AppText>

              <AppText variant="muted">
                Assigned expenses,
                deadlines, and reserves
              </AppText>
            </View>

            <Pressable
              onPress={() =>
                setActiveTab("calendar")
              }
            >
              <AppText variant="bold">
                Calendar
              </AppText>
            </Pressable>
          </AppRow>

          {upcomingResponsibilities.length ===
          0 ? (
            <AppText variant="muted">
              No business
              responsibilities have
              been scheduled yet.
            </AppText>
          ) : (
            upcomingResponsibilities.map(
              (item) => (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    setActiveTab(
                      "calendar"
                    )
                  }
                >
                  <View
                    style={{
                      gap: 5,
                    }}
                  >
                    <AppRow>
                      <View
                        style={{
                          flex: 1,
                        }}
                      >
                        <AppText variant="bold">
                          {item.name}
                        </AppText>

                        <AppText variant="muted">
                          {
                            item.sectionLabel
                          }{" "}
                          ·{" "}
                          {formatFrequency(
                            item.frequency
                          )}
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
                            item.budget
                          )}
                        </AppText>

                        <AppText variant="muted">
                          {formatDueDate(
                            item.dueDay
                          )}
                        </AppText>
                      </View>
                    </AppRow>

                    <AppRow>
                      <AppText variant="muted">
                        Responsible
                      </AppText>

                      <AppText variant="bold">
                        {getAssignedMemberName(
                          item.assignedMemberId
                        )}
                      </AppText>
                    </AppRow>

                    {item.required !==
                    undefined ? (
                      <AppText variant="muted">
                        {item.required
                          ? "Required"
                          : "Optional"}
                        {item.reminderDaysBefore !==
                        undefined
                          ? ` · Reminder ${item.reminderDaysBefore} day${
                              item.reminderDaysBefore ===
                              1
                                ? ""
                                : "s"
                            } before`
                          : ""}
                      </AppText>
                    ) : null}
                  </View>
                </Pressable>
              )
            )
          )}
        </View>
      </AppCard>

      <AppCard>
        <View style={{ gap: 14 }}>
          <AppRow>
            <View style={{ flex: 1 }}>
              <AppText variant="section">
                Team
              </AppText>

              <AppText variant="muted">
                Business members and
                responsibilities
              </AppText>
            </View>

            <Pressable
              onPress={() =>
                setActiveTab("members")
              }
            >
              <AppText variant="bold">
                Manage
              </AppText>
            </Pressable>
          </AppRow>

          {workspaceLoading ? (
            <AppText variant="muted">
              Loading team members...
            </AppText>
          ) : workspaceMembers.length ===
            0 ? (
            <AppText variant="muted">
              No team members are
              available yet.
            </AppText>
          ) : (
            workspaceMembers.map(
              (member) => {
                const responsibilityCount =
                  responsibilities.filter(
                    (item) =>
                      item.assignedMemberId ===
                        member.id ||
                      item.assignedMemberId ===
                        member.user_id ||
                      (member.role ===
                        "owner" &&
                        (!item.assignedMemberId ||
                          item.assignedMemberId ===
                            "owner"))
                  ).length;

                return (
                  <AppRow
                    key={member.id}
                  >
                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <AppText variant="bold">
                        {member.display_name?.trim() ||
                          (member.role ===
                          "owner"
                            ? "Business Owner"
                            : "Team Member")}
                      </AppText>

                      <AppText variant="muted">
                        {member.role
                          .charAt(0)
                          .toUpperCase() +
                          member.role.slice(
                            1
                          )}
                        {member.status
                          ? ` · ${member.status}`
                          : ""}
                      </AppText>
                    </View>

                    <View
                      style={{
                        alignItems:
                          "flex-end",
                      }}
                    >
                      <AppText variant="bold">
                        {
                          responsibilityCount
                        }
                      </AppText>

                      <AppText variant="muted">
                        {responsibilityCount ===
                        1
                          ? "responsibility"
                          : "responsibilities"}
                      </AppText>
                    </View>
                  </AppRow>
                );
              }
            )
          )}
        </View>
      </AppCard>

      <AppCard>
        <View style={{ gap: 14 }}>
          <AppRow>
            <View style={{ flex: 1 }}>
              <AppText variant="section">
                Recent transactions
              </AppText>

              <AppText variant="muted">
                Latest business
                spending
              </AppText>
            </View>

            <Pressable
              onPress={() =>
                setActiveTab(
                  "transactions"
                )
              }
            >
              <AppText variant="bold">
                View All
              </AppText>
            </Pressable>
          </AppRow>

          {recentTransactions.length ===
          0 ? (
            <AppText variant="muted">
              No business transactions
              yet.
            </AppText>
          ) : (
            recentTransactions.map(
              (transaction) => (
                <Pressable
                  key={transaction.id}
                  onPress={() =>
                    onEditTransaction(
                      transaction
                    )
                  }
                >
                  <AppRow>
                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <AppText variant="bold">
                        {transaction.merchant ||
                          transaction.name ||
                          transaction.category}
                      </AppText>

                      <AppText variant="muted">
                        {
                          transaction.category
                        }{" "}
                        ·{" "}
                        {new Date(
                          transaction.date
                        ).toLocaleDateString(
                          undefined,
                          {
                            month:
                              "short",
                            day: "numeric",
                          }
                        )}
                      </AppText>
                    </View>

                    <AppText variant="bold">
                      {formatMoney(
                        transaction.amount
                      )}
                    </AppText>
                  </AppRow>
                </Pressable>
              )
            )
          )}

          <AppButton
            title="Add Transaction"
            onPress={
              onAddTransaction
            }
          />
        </View>
      </AppCard>
    </ScrollView>
  );

  return (
    <WorkspaceDashboard
      title={business.name}
      subtitle={subtitle}
      backLabel="Back to Businesses"
      onBack={onBack}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      overview={renderOverview()}
      budget={
        <BusinessPlan
          business={business}
          transactions={transactions}
          onEditBudget={
            onEditBudget
          }
          onAddTransaction={
            onAddTransaction
          }
          onEditTransaction={
            onEditTransaction
          }
          onDeleteTransaction={
            onDeleteTransaction
          }
        />
      }
      transactions={
        <WorkspaceTransactions
          workspaceLabel="Business"
          transactions={transactions}
          onAddTransaction={
            onAddTransaction
          }
          onEditTransaction={
            onEditTransaction
          }
          onDeleteTransaction={
            onDeleteTransaction
          }
        />
      }
      afford={
        <WorkspaceAfford
          workspaceLabel="Business"
          available={available}
          plannedAvailable={
            plannedAvailable
          }
          monthlyIncome={income}
          monthlyAssigned={assigned}
          monthlySpent={spent}
          onAddTransaction={
            onAddTransaction
          }
        />
      }
      calendar={
        <WorkspaceCalendar
          sourceType="business"
          sourceId={business.id}
          title="Business Calendar"
          subtitle="Track payroll, invoices, taxes, renewals, bills, and deadlines."
          defaultEventType="business"
        />
      }
      members={
        <WorkspaceMembers
          workspaceType="business"
          workspace={business}
        />
      }
      chat={
        workspaceLoading ? (
          <AppCard>
            <AppText variant="muted">
              Connecting business
              chat...
            </AppText>
          </AppCard>
        ) : workspaceError ? (
          <AppCard>
            <AppText variant="section">
              Chat could not be
              connected
            </AppText>

            <View
              style={{
                marginTop: 6,
              }}
            >
              <AppText variant="muted">
                {workspaceError}
              </AppText>
            </View>

            <View
              style={{
                marginTop: 14,
              }}
            >
              <AppButton
                title="Try Again"
                onPress={() =>
                  loadSharedWorkspace()
                }
              />
            </View>
          </AppCard>
        ) : sharedWorkspaceId ? (
          <WorkspaceChat
            workspaceId={
              sharedWorkspaceId
            }
          />
        ) : (
          <AppCard>
            <AppText variant="muted">
              The shared business
              workspace is not
              available yet.
            </AppText>
          </AppCard>
        )
      }
    />
  );
}