import {
  getBudgetTotal,
  getSpentTotal,
} from "@/components/budget/budgetUtils";
import WorkspaceCalendar from "@/components/calendar/WorkspaceCalendar";
import HouseholdPlan from "@/components/household/HouseholdPlan";
import AppCard from "@/components/ui/AppCard";
import AppText from "@/components/ui/AppText";
import WorkspaceAfford from "@/components/workspace/WorkspaceAfford";
import WorkspaceChat from "@/components/workspace/WorkspaceChat";
import WorkspaceDashboard, {
  type WorkspaceTab,
} from "@/components/workspace/WorkspaceDashboard";
import WorkspaceHome from "@/components/workspace/WorkspaceHome";
import WorkspaceMembers from "@/components/workspace/WorkspaceMembers";
import WorkspaceTransactions from "@/components/workspace/WorkspaceTransactions";
import { getCalendarEvents } from "@/lib/calendarStore";
import { getPurchases } from "@/lib/purchaseStore";
import {
  getOrCreateSharedWorkspace,
  subscribeToSharedWorkspace,
} from "@/lib/sharedWorkspaceStore";
import type {
  Household,
  Purchase,
} from "@/lib/types";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { View } from "react-native";

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

type HouseholdWithContribution =
  Household & {
    personalContribution?: number;
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

  const [sharedWorkspaceId, setSharedWorkspaceId] =
    useState("");

  const [workspaceLoading, setWorkspaceLoading] =
    useState(true);

  const [workspaceError, setWorkspaceError] =
    useState("");

  const transactions = getPurchases()
    .filter(
      (purchase) =>
        purchase.budgetType === "household" &&
        purchase.budgetId === household.id
    )
    .sort(
      (first, second) =>
        new Date(second.date).getTime() -
        new Date(first.date).getTime()
    );

  const householdEvents = getCalendarEvents().filter(
    (event) =>
      event.sourceType === "household" &&
      event.sourceId === household.id
  );

  const income =
    household.budget.householdIncome;

  const billsBudget = getBudgetTotal(
    household.budget.bills
  );

  const spendingBudget = getBudgetTotal(
    household.budget.spending
  );

  const savingsBudget = getBudgetTotal(
    household.budget.savings
  );

  const assigned =
    billsBudget +
    spendingBudget +
    savingsBudget;

  const billsSpent = getSpentTotal(
    household.budget.bills
  );

  const spendingSpent = getSpentTotal(
    household.budget.spending
  );

  const savingsSpent = getSpentTotal(
    household.budget.savings
  );

  const spent =
    billsSpent +
    spendingSpent +
    savingsSpent;

  const available = income - spent;

  const plannedAvailable =
    income - assigned;

  const householdWithContribution =
    household as HouseholdWithContribution;

  const personalContribution =
    household.includedInPersonalPlan
      ? householdWithContribution.personalContribution ??
        0
      : 0;

  const subtitle = `${household.members} contributor${
    household.members === 1 ? "" : "s"
  }${
    household.description
      ? ` · ${household.description}`
      : ""
  }`;

  const loadSharedWorkspace =
    useCallback(async () => {
      setWorkspaceLoading(true);
      setWorkspaceError("");

      try {
        const sharedWorkspace =
          await getOrCreateSharedWorkspace(
            "household",
            household
          );

        setSharedWorkspaceId(
          sharedWorkspace.id
        );
      } catch (error) {
        setSharedWorkspaceId("");

        setWorkspaceError(
          error instanceof Error
            ? error.message
            : "Unable to connect this household to its shared workspace."
        );
      } finally {
        setWorkspaceLoading(false);
      }
    }, [
      household.id,
      household.name,
      household.description,
    ]);

  useEffect(() => {
    loadSharedWorkspace();
  }, [loadSharedWorkspace]);

  useEffect(() => {
    if (!sharedWorkspaceId) {
      return;
    }

    return subscribeToSharedWorkspace(
      sharedWorkspaceId,
      loadSharedWorkspace
    );
  }, [
    sharedWorkspaceId,
    loadSharedWorkspace,
  ]);

  return (
    <WorkspaceDashboard
      title={household.name}
      subtitle={subtitle}
      backLabel="Back to Households"
      onBack={onBack}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      overview={
        <WorkspaceHome
          workspaceId={sharedWorkspaceId}
          workspaceLabel="Household"
          incomeLabel="Household Income"
          income={income}
          assigned={assigned}
          spent={spent}
          available={available}
          plannedAvailable={
            plannedAvailable
          }
          transactions={transactions}
          events={householdEvents}
          savingsItems={
            household.budget.savings
          }
          secondaryMetric={{
            title: "Your Share",
            value: personalContribution,
            caption:
              household.includedInPersonalPlan
                ? "Personal contribution"
                : "Kept separate",
          }}
          onAddTransaction={
            onAddTransaction
          }
          onOpenBudget={() =>
            setActiveTab("budget")
          }
          onOpenTransactions={() =>
            setActiveTab("transactions")
          }
          onOpenCalendar={() =>
            setActiveTab("calendar")
          }
          onOpenMembers={() =>
            setActiveTab("members")
          }
          onOpenChat={() =>
            setActiveTab("chat")
          }
        />
      }
      budget={
        <HouseholdPlan
          household={household}
          transactions={transactions}
          onEditBudget={onEditBudget}
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
      chat={
        workspaceLoading ? (
          <AppCard>
            <AppText variant="muted">
              Connecting household chat...
            </AppText>
          </AppCard>
        ) : workspaceError ? (
          <AppCard>
            <AppText variant="section">
              Chat could not be connected
            </AppText>

            <View style={{ marginTop: 6 }}>
              <AppText variant="muted">
                {workspaceError}
              </AppText>
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
              The shared household is not
              available yet.
            </AppText>
          </AppCard>
        )
      }
    />
  );
}