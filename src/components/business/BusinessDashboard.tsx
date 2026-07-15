import {
  getBudgetTotal,
  getSpentTotal,
} from "@/components/budget/budgetUtils";
import WorkspaceCalendar from "@/components/calendar/WorkspaceCalendar";
import AppButton from "@/components/ui/AppButton";
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
import type { Business, Purchase } from "@/lib/types";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { View } from "react-native";
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

  const [sharedWorkspaceId, setSharedWorkspaceId] =
    useState("");

  const [workspaceLoading, setWorkspaceLoading] =
    useState(true);

  const [workspaceError, setWorkspaceError] =
    useState("");

  const transactions = getPurchases()
    .filter(
      (purchase) =>
        purchase.budgetType === "business" &&
        purchase.budgetId === business.id
    )
    .sort(
      (first, second) =>
        new Date(second.date).getTime() -
        new Date(first.date).getTime()
    );

  const businessEvents = getCalendarEvents().filter(
    (event) =>
      event.sourceType === "business" &&
      event.sourceId === business.id
  );

  const income =
    business.budget.businessIncome;

  const operatingBudget = getBudgetTotal(
    business.budget.operatingExpenses
  );

  const spendingBudget = getBudgetTotal(
    business.budget.businessSpending
  );

  const savingsBudget = getBudgetTotal(
    business.budget.businessSavings
  );

  const assigned =
    operatingBudget +
    spendingBudget +
    savingsBudget;

  const operatingSpent = getSpentTotal(
    business.budget.operatingExpenses
  );

  const spendingSpent = getSpentTotal(
    business.budget.businessSpending
  );

  const savingsSpent = getSpentTotal(
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

  const subtitle = `${business.businessType}${
    business.description
      ? ` · ${business.description}`
      : ""
  }`;

  const loadSharedWorkspace =
    useCallback(async () => {
      setWorkspaceLoading(true);
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
      } catch (error) {
        setSharedWorkspaceId("");

        setWorkspaceError(
          error instanceof Error
            ? error.message
            : "Unable to connect this business to its shared workspace."
        );
      } finally {
        setWorkspaceLoading(false);
      }
    }, [
      business.id,
      business.name,
      business.description,
      business.businessType,
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
      title={business.name}
      subtitle={subtitle}
      backLabel="Back to Businesses"
      onBack={onBack}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      overview={
        <WorkspaceHome
          workspaceId={sharedWorkspaceId}
          workspaceLabel="Business"
          incomeLabel="Revenue"
          income={income}
          assigned={assigned}
          spent={spent}
          available={available}
          plannedAvailable={
            plannedAvailable
          }
          transactions={transactions}
          events={businessEvents}
          savingsItems={
            business.budget.businessSavings
          }
          secondaryMetric={{
            title: "Owner Pay",
            value: ownerPay,
            caption:
              business.incomeMode ===
              "separate"
                ? "Kept separate"
                : "Personal income",
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
        <BusinessPlan
          business={business}
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
              Connecting business chat...
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

            <View style={{ marginTop: 14 }}>
              <AppButton
                title="Try Again"
                onPress={
                  loadSharedWorkspace
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
              The shared business workspace is
              not available yet.
            </AppText>
          </AppCard>
        )
      }
    />
  );
}