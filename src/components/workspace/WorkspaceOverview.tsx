import ProgressBar from "@/components/budget/ProgressBar";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import EmptyState from "@/components/ui/EmptyState";
import MetricCard from "@/components/ui/MetricCard";
import type { Purchase } from "@/lib/types";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

type WorkspaceOverviewProps = {
  workspaceLabel: string;
  incomeLabel: string;
  income: number;
  assigned: number;
  spent: number;
  available: number;
  plannedAvailable: number;
  transactions: Purchase[];
  sections: {
    id: string;
    title: string;
    budget: number;
    spent: number;
  }[];
  secondaryMetric?: {
    title: string;
    value: number;
    caption: string;
  };
  onAddTransaction: () => void;
  onEditTransaction: (transaction: Purchase) => void;
  onOpenBudget: () => void;
  onOpenCalendar?: () => void;
};

const formatMoney = (
  amount: number,
  includeCents = false
) =>
  `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: includeCents ? 2 : 0,
    maximumFractionDigits: includeCents ? 2 : 0,
  })}`;

export default function WorkspaceOverview({
  workspaceLabel,
  incomeLabel,
  income,
  assigned,
  spent,
  available,
  plannedAvailable,
  transactions,
  sections,
  secondaryMetric,
  onAddTransaction,
  onEditTransaction,
  onOpenBudget,
  onOpenCalendar,
}: WorkspaceOverviewProps) {
  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort(
          (first, second) =>
            new Date(second.date).getTime() -
            new Date(first.date).getTime()
        )
        .slice(0, 5),
    [transactions]
  );

  const assignedPercent =
    income > 0 ? (assigned / income) * 100 : 0;

  const spentPercent =
    income > 0 ? (spent / income) * 100 : 0;

  const health = useMemo(() => {
    if (income <= 0) {
      return {
        label: "Needs Setup",
        message: `Add ${incomeLabel.toLowerCase()} to activate this workspace.`,
        tone: "warning" as const,
      };
    }

    if (available < 0) {
      return {
        label: "At Risk",
        message: `${workspaceLabel} spending is above available monthly funds.`,
        tone: "danger" as const,
      };
    }

    if (plannedAvailable < 0) {
      return {
        label: "Overplanned",
        message: `The ${workspaceLabel.toLowerCase()} budget assigns more than it receives.`,
        tone: "danger" as const,
      };
    }

    if ((available / income) * 100 < 10) {
      return {
        label: "Needs Attention",
        message: `Very little ${workspaceLabel.toLowerCase()} money remains.`,
        tone: "warning" as const,
      };
    }

    return {
      label: "Healthy",
      message: `This ${workspaceLabel.toLowerCase()} has positive funds available.`,
      tone: "success" as const,
    };
  }, [
    available,
    income,
    incomeLabel,
    plannedAvailable,
    workspaceLabel,
  ]);

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
            caption="Current activity"
            tone={spent > income ? "danger" : "warning"}
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
            caption="Monthly plan"
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

      <AppCard>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="section">
              Monthly Progress
            </AppText>

            <AppText variant="muted">
              Planned and actual activity
            </AppText>
          </View>

          <Pressable onPress={onOpenBudget}>
            <AppText variant="muted">
              View Budget
            </AppText>
          </Pressable>
        </AppRow>

        <View
          style={{
            marginTop: 16,
            gap: 18,
          }}
        >
          <View>
            <AppRow>
              <AppText variant="muted">
                Assigned
              </AppText>

              <AppText variant="bold">
                {assignedPercent.toFixed(0)}%
              </AppText>
            </AppRow>

            <View style={{ marginTop: 8 }}>
              <ProgressBar
                percent={assignedPercent}
              />
            </View>
          </View>

          <View>
            <AppRow>
              <AppText variant="muted">
                Spent
              </AppText>

              <AppText variant="bold">
                {spentPercent.toFixed(0)}%
              </AppText>
            </AppRow>

            <View style={{ marginTop: 8 }}>
              <ProgressBar
                percent={spentPercent}
              />
            </View>
          </View>
        </View>
      </AppCard>

      <AppCard>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="section">
              Category Snapshot
            </AppText>

            <AppText variant="muted">
              Current budget usage
            </AppText>
          </View>

          <AppButton
            title="Add"
            onPress={onAddTransaction}
          />
        </AppRow>

        {sections.length === 0 ? (
          <View style={{ marginTop: 14 }}>
            <EmptyState message="No budget categories have been added yet." />
          </View>
        ) : (
          <View
            style={{
              marginTop: 16,
              gap: 18,
            }}
          >
            {sections.map((section) => {
              const percent =
                section.budget > 0
                  ? (section.spent /
                      section.budget) *
                    100
                  : 0;

              return (
                <View key={section.id}>
                  <AppRow>
                    <View style={{ flex: 1 }}>
                      <AppText variant="bold">
                        {section.title}
                      </AppText>

                      <AppText variant="muted">
                        {formatMoney(
                          section.spent
                        )}{" "}
                        of{" "}
                        {formatMoney(
                          section.budget
                        )}
                      </AppText>
                    </View>

                    <AppText variant="bold">
                      {percent.toFixed(0)}%
                    </AppText>
                  </AppRow>

                  <View style={{ marginTop: 8 }}>
                    <ProgressBar
                      percent={percent}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </AppCard>

      <AppCard>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="section">
              Recent Transactions
            </AppText>

            <AppText variant="muted">
              Latest {workspaceLabel.toLowerCase()} activity
            </AppText>
          </View>

          <AppButton
            title="New"
            onPress={onAddTransaction}
            variant="outline"
          />
        </AppRow>

        {recentTransactions.length === 0 ? (
          <View style={{ marginTop: 14 }}>
            <EmptyState message={`No ${workspaceLabel.toLowerCase()} transactions yet.`} />
          </View>
        ) : (
          <View
            style={{
              marginTop: 14,
              gap: 12,
            }}
          >
            {recentTransactions.map(
              (transaction) => (
                <Pressable
                  key={transaction.id}
                  onPress={() =>
                    onEditTransaction(
                      transaction
                    )
                  }
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <AppRow>
                    <View style={{ flex: 1 }}>
                      <AppText variant="bold">
                        {transaction.name}
                      </AppText>

                      <AppText variant="muted">
                        {transaction.subcategory ??
                          transaction.category}
                      </AppText>
                    </View>

                    <AppText variant="bold">
                      {transaction.type === "income"
                        ? "+"
                        : "-"}
                      {formatMoney(
                        transaction.amount,
                        true
                      )}
                    </AppText>
                  </AppRow>
                </Pressable>
              )
            )}
          </View>
        )}
      </AppCard>

      {onOpenCalendar ? (
        <AppButton
          title="Open Calendar"
          onPress={onOpenCalendar}
          variant="outline"
        />
      ) : null}
    </>
  );
}