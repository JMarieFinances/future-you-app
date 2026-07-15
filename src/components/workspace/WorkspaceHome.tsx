import AppCard from "@/components/ui/AppCard";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import MetricCard from "@/components/ui/MetricCard";
import RecentActivityCard from "@/components/workspace/RecentActivityCard";
import UpcomingEventsCard from "@/components/workspace/UpcomingEventsCard";
import WorkspaceGoals from "@/components/workspace/WorkspaceGoals";
import WorkspaceInsights from "@/components/workspace/WorkspaceInsights";
import WorkspaceQuickActions, {
    type WorkspaceQuickAction,
} from "@/components/workspace/WorkspaceQuickActions";
import type { CalendarEvent } from "@/lib/calendarStore";
import type {
    BudgetItem,
    Purchase,
} from "@/lib/types";
import { Text, View } from "react-native";

type Props = {
  workspaceId?: string;
  workspaceLabel: string;

  incomeLabel: string;
  income: number;
  assigned: number;
  spent: number;
  available: number;
  plannedAvailable: number;

  transactions: Purchase[];
  events: CalendarEvent[];
  savingsItems?: BudgetItem[];

  secondaryMetric?: {
    title: string;
    value: number;
    caption: string;
  };

  onAddTransaction: () => void;
  onOpenBudget: () => void;
  onOpenTransactions: () => void;
  onOpenCalendar: () => void;
  onOpenMembers: () => void;
  onOpenChat: () => void;
};

const formatMoney = (
  amount: number,
  includeCents = false
) =>
  `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: includeCents ? 2 : 0,
    maximumFractionDigits: includeCents ? 2 : 0,
  })}`;

export default function WorkspaceHome({
  workspaceId,
  workspaceLabel,
  incomeLabel,
  income,
  assigned,
  spent,
  available,
  plannedAvailable,
  transactions,
  events,
  savingsItems = [],
  secondaryMetric,
  onAddTransaction,
  onOpenBudget,
  onOpenTransactions,
  onOpenCalendar,
  onOpenMembers,
  onOpenChat,
}: Props) {
  const assignedPercent =
    income > 0
      ? (assigned / income) * 100
      : 0;

  const spentPercent =
    income > 0
      ? (spent / income) * 100
      : 0;

  const health = getWorkspaceHealth({
    income,
    available,
    plannedAvailable,
  });

  const actions: WorkspaceQuickAction[] = [
    {
      id: "transaction",
      title: "Add Transaction",
      subtitle: "Log income or spending.",
      symbol: "+",
      onPress: onAddTransaction,
    },
    {
      id: "budget",
      title: "View Budget",
      subtitle: "Review the monthly plan.",
      symbol: "$",
      onPress: onOpenBudget,
    },
    {
      id: "calendar",
      title: "Calendar",
      subtitle: "See bills and reminders.",
      symbol: "C",
      onPress: onOpenCalendar,
    },
    {
      id: "chat",
      title: "Open Chat",
      subtitle: "Message workspace members.",
      symbol: "M",
      onPress: onOpenChat,
    },
    {
      id: "members",
      title: "Members",
      subtitle: "Manage access and invites.",
      symbol: "P",
      onPress: onOpenMembers,
    },
    {
      id: "history",
      title: "Transactions",
      subtitle: "Search previous activity.",
      symbol: "T",
      onPress: onOpenTransactions,
    },
  ];

  return (
    <>
      <AppCard glass>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="muted">
              {workspaceLabel} Available
            </AppText>

            <Text
              style={{
                fontSize: 46,
                lineHeight: 52,
                fontWeight: "800",
                letterSpacing: -1.4,
                marginTop: 4,
              }}
            >
              {formatMoney(available)}
            </Text>

            <AppText variant="muted">
              After current spending
            </AppText>
          </View>

          <View
            style={{
              alignItems: "flex-end",
              marginLeft: 14,
            }}
          >
            <AppText variant="bold">
              {health.label}
            </AppText>

            <AppText variant="muted">
              Financial health
            </AppText>
          </View>
        </AppRow>

        <View style={{ marginTop: 16 }}>
          <AppText variant="muted">
            {health.message}
          </AppText>
        </View>
      </AppCard>

      <View
        style={{
          flexDirection: "row",
          gap: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <MetricCard
            title={incomeLabel}
            value={formatMoney(income)}
            caption="Monthly"
            tone="success"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Spent"
            value={formatMoney(spent)}
            caption={`${spentPercent.toFixed(0)}% used`}
            tone={
              spent > income
                ? "danger"
                : spentPercent >= 80
                  ? "warning"
                  : "primary"
            }
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
            value={formatMoney(assigned)}
            caption={`${assignedPercent.toFixed(0)}% planned`}
            tone={
              plannedAvailable < 0
                ? "danger"
                : "primary"
            }
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title={
              secondaryMetric?.title ??
              "Planned Left"
            }
            value={formatMoney(
              secondaryMetric?.value ??
                plannedAvailable
            )}
            caption={
              secondaryMetric?.caption ??
              "After planning"
            }
            tone={
              (secondaryMetric?.value ??
                plannedAvailable) < 0
                ? "danger"
                : "success"
            }
          />
        </View>
      </View>

      <WorkspaceQuickActions
        actions={actions}
      />

      <UpcomingEventsCard
        events={events}
        onOpenCalendar={onOpenCalendar}
      />

      {workspaceId ? (
        <RecentActivityCard
          workspaceId={workspaceId}
        />
      ) : (
        <AppCard>
          <AppText variant="section">
            Recent Activity
          </AppText>

          <View style={{ marginTop: 6 }}>
            <AppText variant="muted">
              Shared activity will appear after
              this workspace finishes connecting.
            </AppText>
          </View>
        </AppCard>
      )}

      <WorkspaceGoals
        savingsItems={savingsItems}
        title={
          workspaceLabel === "Business"
            ? "Savings and Reserves"
            : "Shared Goals"
        }
      />

      <WorkspaceInsights
        workspaceLabel={workspaceLabel}
        income={income}
        assigned={assigned}
        spent={spent}
        available={available}
        transactions={transactions}
      />
    </>
  );
}

function getWorkspaceHealth({
  income,
  available,
  plannedAvailable,
}: {
  income: number;
  available: number;
  plannedAvailable: number;
}) {
  if (income <= 0) {
    return {
      label: "Needs Setup",
      message:
        "Add monthly income to activate this workspace.",
    };
  }

  if (available < 0) {
    return {
      label: "At Risk",
      message:
        "Current spending is higher than the available monthly funds.",
    };
  }

  if (plannedAvailable < 0) {
    return {
      label: "Overplanned",
      message:
        "The budget assigns more money than the workspace receives.",
    };
  }

  if ((available / income) * 100 < 10) {
    return {
      label: "Needs Attention",
      message:
        "Very little money remains after current activity.",
    };
  }

  return {
    label: "Healthy",
    message:
      "This workspace currently has positive funds available.",
  };
}