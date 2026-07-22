import {
  getBudgetTotal,
  getSpentTotal,
} from "@/components/budget/budgetUtils";
import WorkspaceCalendar from "@/components/calendar/WorkspaceCalendar";
import HouseholdPlan from "@/components/household/HouseholdPlan";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import MetricCard from "@/components/ui/MetricCard";
import WorkspaceAfford from "@/components/workspace/WorkspaceAfford";
import WorkspaceDashboard, {
  type WorkspaceTab,
} from "@/components/workspace/WorkspaceDashboard";
import WorkspaceMembers from "@/components/workspace/WorkspaceMembers";
import WorkspaceTransactions from "@/components/workspace/WorkspaceTransactions";
import { getCalendarEvents } from "@/lib/calendarStore";
import { getPurchases } from "@/lib/purchaseStore";
import {
  getOrCreateSharedWorkspace,
  subscribeToSharedWorkspace,
} from "@/lib/sharedWorkspaceStore";
import { supabase } from "@/lib/supabase";
import type {
  Household,
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
  View
} from "react-native";

type Props = {
  household: Household;
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

type HouseholdMemberRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: "owner" | "editor" | "viewer";
  display_name: string | null;
  planned_contribution: number | null;
  contributed_amount: number | null;
  savings_contribution: number | null;
  status: string | null;
  has_completed_setup: boolean | null;
  created_at: string;
  updated_at?: string | null;
};

type HouseholdActivityRow = {
  id: string;
  workspace_id: string;
  user_id: string | null;
  member_id?: string | null;
  activity_type?: string | null;
  type?: string | null;
  title: string;
  description: string | null;
  amount: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const formatMoney = (amount: number) =>
  `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatActivityDate = (
  value: string
) => {
  const date = new Date(value);
  const now = new Date();

  const isToday =
    date.getFullYear() ===
      now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return date.toLocaleTimeString(
      undefined,
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  }

  return date.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() ===
        now.getFullYear()
          ? undefined
          : "numeric",
    }
  );
};

const getActivityLabel = (
  activity: HouseholdActivityRow
) => {
  const type =
    activity.activity_type ??
    activity.type ??
    "";

  switch (type) {
    case "member_joined":
      return "Member";
    case "member_updated":
    case "contribution_updated":
      return "Contribution";
    case "transaction_created":
    case "transaction_updated":
    case "transaction_deleted":
      return "Transaction";
    case "household_updated":
    case "workspace_updated":
      return "Household";
    default:
      return "Activity";
  }
};

export default function HouseholdDashboard({
  household,
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
    household.workspaceId ?? ""
  );

  const [
    workspaceLoading,
    setWorkspaceLoading,
  ] = useState(true);

  const [
    workspaceError,
    setWorkspaceError,
  ] = useState("");

  const [members, setMembers] =
    useState<HouseholdMemberRow[]>([]);

  const [activity, setActivity] =
    useState<HouseholdActivityRow[]>([]);

  const [
    dashboardRefreshing,
    setDashboardRefreshing,
  ] = useState(false);

  const transactions = useMemo(
    () =>
      getPurchases()
        .filter(
          (purchase) =>
            purchase.budgetType ===
              "household" &&
            purchase.budgetId ===
              household.id
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
    [household.id]
  );

  const householdEvents =
    useMemo(
      () =>
        getCalendarEvents().filter(
          (event) =>
            event.sourceType ===
              "household" &&
            event.sourceId ===
              household.id
        ),
      [household.id]
    );

  const income =
    household.budget.householdIncome;

  const billsBudget =
    getBudgetTotal(
      household.budget.bills
    );

  const spendingBudget =
    getBudgetTotal(
      household.budget.spending
    );

  const savingsBudget =
    getBudgetTotal(
      household.budget.savings
    );

  const assigned =
    billsBudget +
    spendingBudget +
    savingsBudget;

  const billsSpent =
    getSpentTotal(
      household.budget.bills
    );

  const spendingSpent =
    getSpentTotal(
      household.budget.spending
    );

  const savingsSpent =
    getSpentTotal(
      household.budget.savings
    );

  const spent =
    billsSpent +
    spendingSpent +
    savingsSpent;

  const available = income - spent;

  const plannedAvailable =
    income - assigned;

  const plannedContributions =
    members.reduce(
      (total, member) =>
        total +
        Number(
          member.planned_contribution ??
            0
        ),
      0
    );

  const contributedAmount =
    members.reduce(
      (total, member) =>
        total +
        Number(
          member.contributed_amount ??
            0
        ),
      0
    );

  const savingsContributions =
    members.reduce(
      (total, member) =>
        total +
        Number(
          member.savings_contribution ??
            0
        ),
      0
    );

  const activeMembers =
    members.filter(
      (member) =>
        member.status !== "left" &&
        member.status !== "removed"
    );

  const recentTransactions =
    transactions.slice(0, 4);

  const recentActivity =
    activity.slice(0, 8);

  const subtitle = `${
    activeMembers.length ||
    household.members ||
    1
  } member${
    (activeMembers.length ||
      household.members ||
      1) === 1
      ? ""
      : "s"
  }${
    household.description
      ? ` · ${household.description}`
      : ""
  }`;

  const loadHouseholdData =
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
              "household",
              household
            );

          const workspaceId =
            sharedWorkspace.id;

          setSharedWorkspaceId(
            workspaceId
          );

          const [
            memberResult,
            activityResult,
          ] = await Promise.all([
            supabase
              .from(
                "workspace_members"
              )
              .select(`
                id,
                workspace_id,
                user_id,
                role,
                display_name,
                planned_contribution,
                contributed_amount,
                savings_contribution,
                status,
                has_completed_setup,
                created_at,
                updated_at
              `)
              .eq(
                "workspace_id",
                workspaceId
              )
              .order("created_at", {
                ascending: true,
              }),

            supabase
              .from(
                "workspace_activity"
              )
              .select(`
                id,
                workspace_id,
                user_id,
                member_id,
                activity_type,
                type,
                title,
                description,
                amount,
                metadata,
                created_at
              `)
              .eq(
                "workspace_id",
                workspaceId
              )
              .order("created_at", {
                ascending: false,
              })
              .limit(50),
          ]);

          if (memberResult.error) {
            throw new Error(
              memberResult.error.message
            );
          }

          if (
            activityResult.error
          ) {
            throw new Error(
              activityResult.error.message
            );
          }

          setMembers(
            (memberResult.data ??
              []) as HouseholdMemberRow[]
          );

          setActivity(
            (activityResult.data ??
              []) as HouseholdActivityRow[]
          );
        } catch (error) {
          setWorkspaceError(
            error instanceof Error
              ? error.message
              : "Unable to load this household."
          );
        } finally {
          setWorkspaceLoading(false);
          setDashboardRefreshing(
            false
          );
        }
      },
      [
        household.id,
        household.name,
        household.description,
        household.workspaceId,
      ]
    );

  useEffect(() => {
    loadHouseholdData();
  }, [loadHouseholdData]);

  useEffect(() => {
    if (!sharedWorkspaceId) {
      return;
    }

    const unsubscribeWorkspace =
      subscribeToSharedWorkspace(
        sharedWorkspaceId,
        () => loadHouseholdData()
      );

    const activityChannel =
      supabase
        .channel(
          `household-dashboard-${sharedWorkspaceId}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "workspace_activity",
            filter: `workspace_id=eq.${sharedWorkspaceId}`,
          },
          () =>
            loadHouseholdData()
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "household_contributions",
            filter: `workspace_id=eq.${sharedWorkspaceId}`,
          },
          () =>
            loadHouseholdData()
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "household_transactions",
            filter: `workspace_id=eq.${sharedWorkspaceId}`,
          },
          () =>
            loadHouseholdData()
        )
        .subscribe();

    return () => {
      unsubscribeWorkspace();

      supabase.removeChannel(
        activityChannel
      );
    };
  }, [
    sharedWorkspaceId,
    loadHouseholdData,
  ]);

  const renderDashboardError = () => {
    if (!workspaceError) {
      return null;
    }

    return (
      <AppCard>
        <View style={{ gap: 12 }}>
          <AppText variant="section">
            Household data could not be
            loaded
          </AppText>

          <AppText variant="muted">
            {workspaceError}
          </AppText>

          <AppButton
            title="Try Again"
            onPress={() =>
              loadHouseholdData()
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
            loadHouseholdData(true)
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
            caption="Income minus spending"
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
            caption="Household spending"
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
            title="Savings"
            value={formatMoney(
              savingsSpent +
                savingsContributions
            )}
            caption="Saved and contributed"
            tone="success"
          />
        </View>

        <View
          style={{
            flexGrow: 1,
            flexBasis: 160,
          }}
        >
          <MetricCard
            title="Contributed"
            value={formatMoney(
              contributedAmount
            )}
            caption={`${formatMoney(
              plannedContributions
            )} planned`}
            tone="primary"
          />
        </View>
      </View>

      <AppCard>
        <View style={{ gap: 14 }}>
          <AppRow>
            <View style={{ flex: 1 }}>
              <AppText variant="section">
                Household plan
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
              Monthly income
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
                Contributions
              </AppText>

              <AppText variant="muted">
                Planned and completed
                household contributions
              </AppText>
            </View>

            <Pressable
              onPress={() =>
                setActiveTab("members")
              }
            >
              <AppText variant="bold">
                Members
              </AppText>
            </Pressable>
          </AppRow>

          {workspaceLoading ? (
            <AppText variant="muted">
              Loading contributions...
            </AppText>
          ) : activeMembers.length ===
            0 ? (
            <AppText variant="muted">
              No household members are
              available yet.
            </AppText>
          ) : (
            activeMembers.map(
              (member) => (
                <AppRow
                  key={member.id}
                >
                  <View
                    style={{ flex: 1 }}
                  >
                    <AppText variant="bold">
                      {member.display_name?.trim() ||
                        (member.role ===
                        "owner"
                          ? "Household Owner"
                          : "Household Member")}
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
                      {formatMoney(
                        Number(
                          member.contributed_amount ??
                            0
                        )
                      )}
                    </AppText>

                    <AppText variant="muted">
                      of{" "}
                      {formatMoney(
                        Number(
                          member.planned_contribution ??
                            0
                        )
                      )}
                    </AppText>
                  </View>
                </AppRow>
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
                Recent transactions
              </AppText>

              <AppText variant="muted">
                Latest household spending
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
              No household transactions
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
                        {transaction.category}{" "}
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

      <AppCard>
        <View style={{ gap: 14 }}>
          <AppRow>
            <View style={{ flex: 1 }}>
              <AppText variant="section">
                Recent activity
              </AppText>

              <AppText variant="muted">
                Automatic household
                updates
              </AppText>
            </View>

            <Pressable
              onPress={() =>
                setActiveTab("chat")
              }
            >
              <AppText variant="bold">
                View All
              </AppText>
            </Pressable>
          </AppRow>

          {workspaceLoading ? (
            <AppText variant="muted">
              Loading activity...
            </AppText>
          ) : recentActivity.length ===
            0 ? (
            <AppText variant="muted">
              Household activity will
              appear here automatically.
            </AppText>
          ) : (
            recentActivity
              .slice(0, 4)
              .map((item) => (
                <View
                  key={item.id}
                  style={{ gap: 3 }}
                >
                  <AppRow>
                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <AppText variant="bold">
                        {item.title}
                      </AppText>

                      {item.description ? (
                        <AppText variant="muted">
                          {
                            item.description
                          }
                        </AppText>
                      ) : null}
                    </View>

                    {item.amount ? (
                      <AppText variant="bold">
                        {formatMoney(
                          Number(
                            item.amount
                          )
                        )}
                      </AppText>
                    ) : null}
                  </AppRow>

                  <AppText variant="muted">
                    {getActivityLabel(
                      item
                    )}{" "}
                    ·{" "}
                    {formatActivityDate(
                      item.created_at
                    )}
                  </AppText>
                </View>
              ))
          )}
        </View>
      </AppCard>
    </ScrollView>
  );

  const renderActivityFeed = () => (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={
            dashboardRefreshing
          }
          onRefresh={() =>
            loadHouseholdData(true)
          }
        />
      }
      contentContainerStyle={{
        gap: 12,
        paddingBottom: 40,
      }}
      showsVerticalScrollIndicator={
        false
      }
    >
      <AppCard>
        <View style={{ gap: 6 }}>
          <AppText variant="title">
            Household Activity
          </AppText>

          <AppText variant="muted">
            Contributions, transactions,
            member updates, and household
            changes appear here
            automatically.
          </AppText>
        </View>
      </AppCard>

      {renderDashboardError()}

      {workspaceLoading ? (
        <AppCard>
          <AppText variant="muted">
            Loading household activity...
          </AppText>
        </AppCard>
      ) : activity.length === 0 ? (
        <AppCard>
          <AppText variant="section">
            No activity yet
          </AppText>

          <View
            style={{ marginTop: 6 }}
          >
            <AppText variant="muted">
              Activity will appear after
              members join, contributions
              change, or transactions are
              added.
            </AppText>
          </View>
        </AppCard>
      ) : (
        activity.map((item) => (
          <AppCard key={item.id}>
            <View style={{ gap: 8 }}>
              <AppRow>
                <View
                  style={{ flex: 1 }}
                >
                  <AppText variant="bold">
                    {item.title}
                  </AppText>

                  {item.description ? (
                    <View
                      style={{
                        marginTop: 4,
                      }}
                    >
                      <AppText variant="muted">
                        {
                          item.description
                        }
                      </AppText>
                    </View>
                  ) : null}
                </View>

                {item.amount ? (
                  <AppText variant="section">
                    {formatMoney(
                      Number(
                        item.amount
                      )
                    )}
                  </AppText>
                ) : null}
              </AppRow>

              <AppRow>
                <AppText variant="muted">
                  {getActivityLabel(
                    item
                  )}
                </AppText>

                <AppText variant="muted">
                  {formatActivityDate(
                    item.created_at
                  )}
                </AppText>
              </AppRow>
            </View>
          </AppCard>
        ))
      )}
    </ScrollView>
  );

  return (
    <WorkspaceDashboard
      title={household.name}
      subtitle={subtitle}
      backLabel="Back to Households"
      onBack={onBack}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      overview={renderOverview()}
      budget={
        <HouseholdPlan
          household={household}
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
          workspaceLabel="Household"
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
          workspaceLabel="Household"
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
          sourceType="household"
          sourceId={household.id}
          title="Household Calendar"
          subtitle="Track shared bills, due dates, paydays, events, and reminders."
          defaultEventType="household"
        />
      }
      members={
        <WorkspaceMembers
          workspaceType="household"
          workspace={household}
        />
      }
      chat={renderActivityFeed()}
    />
  );
}