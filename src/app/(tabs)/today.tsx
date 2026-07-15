import ProgressBar from "@/components/budget/ProgressBar";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppPage from "@/components/ui/AppPage";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import EmptyState from "@/components/ui/EmptyState";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import { getAppData, loadAppData } from "@/lib/appStore";
import {
  getNextEventDate,
  getPersonalCalendarEvents,
  getUpcomingCalendarEvents,
} from "@/lib/calendarStore";
import { getFinancialSummary } from "@/lib/financeEngine";
import { CalendarEvent } from "@/lib/types";
import { useTheme } from "@/lib/useTheme";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

const formatMoney = (
  amount: number,
  includeCents = false
) =>
  `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: includeCents ? 2 : 0,
    maximumFractionDigits: includeCents ? 2 : 0,
  })}`;

const formatEventDate = (event: CalendarEvent) => {
  const date = getNextEventDate(event);

  if (!date) {
    return "No upcoming date";
  }

  const today = new Date();
  const tomorrow = new Date();

  tomorrow.setDate(today.getDate() + 1);

  const sameDay = (first: Date, second: Date) =>
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();

  if (sameDay(date, today)) {
    return "Today";
  }

  if (sameDay(date, tomorrow)) {
    return "Tomorrow";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

export default function TodayScreen() {
  const { colors } = useTheme();
  const [isReady, setIsReady] = useState(false);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const load = async () => {
      await loadAppData();
      forceUpdate((previous) => previous + 1);
      setIsReady(true);
    };

    load();
  }, []);

  const summary = getFinancialSummary();
  const app = getAppData();

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good Morning"
      : hour < 18
        ? "Good Afternoon"
        : "Good Evening";

  const activeGoals = summary.plan.goals.filter(
    (goal) =>
      !goal.archived &&
      goal.target > goal.current
  );

  const recentPurchases =
    summary.recentTransactions.slice(0, 5);

  const personalCalendarEvents =
    getPersonalCalendarEvents();

  const upcomingEvents = getUpcomingCalendarEvents(
    personalCalendarEvents,
    5
  );

  const todaysEvents = upcomingEvents.filter(
    (event) => {
      const eventDate = getNextEventDate(event);

      if (!eventDate) {
        return false;
      }

      const today = new Date();

      return (
        eventDate.getFullYear() ===
          today.getFullYear() &&
        eventDate.getMonth() === today.getMonth() &&
        eventDate.getDate() === today.getDate()
      );
    }
  );

  const upcomingBills = upcomingEvents.filter(
    (event) =>
      event.type === "bill" ||
      event.type === "payday"
  );

  const nextEvent = upcomingEvents[0];

  const priorityAlerts = useMemo(() => {
    const alerts: {
      id: string;
      title: string;
      message: string;
      tone: "danger" | "warning" | "primary";
      action?: () => void;
    }[] = [];

    if (summary.safeToSpend < 0) {
      alerts.push({
        id: "safe-to-spend",
        title: "Spending limit exceeded",
        message: `${formatMoney(
          Math.abs(summary.safeToSpend)
        )} needs to be recovered to get back on plan.`,
        tone: "danger",
        action: () =>
          router.push("/(tabs)/dashboard"),
      });
    } else if (summary.safeToSpend < 100) {
      alerts.push({
        id: "safe-to-spend-low",
        title: "Safe to spend is running low",
        message: `${formatMoney(
          summary.safeToSpend
        )} remains for flexible spending.`,
        tone: "warning",
        action: () =>
          router.push("/(tabs)/dashboard"),
      });
    }

    if (upcomingBills.length > 0) {
      const firstBill = upcomingBills[0];

      alerts.push({
        id: `calendar-${firstBill.id}`,
        title: firstBill.title,
        message: `${
          firstBill.amount
            ? `${formatMoney(firstBill.amount)} due `
            : ""
        }${formatEventDate(firstBill).toLowerCase()}.`,
        tone: "warning",
        action: () =>
          router.push("/(tabs)/calendar"),
      });
    }

    const behindGoal = activeGoals.find((goal) => {
      if (goal.target <= 0) {
        return false;
      }

      return goal.current / goal.target < 0.25;
    });

    if (behindGoal) {
      alerts.push({
        id: `goal-${behindGoal.id}`,
        title: `${behindGoal.name} needs attention`,
        message: `${formatMoney(
          Math.max(
            behindGoal.target -
              behindGoal.current,
            0
          )
        )} remains to reach this goal.`,
        tone: "primary",
        action: () =>
          router.push("/(tabs)/goals"),
      });
    }

    return alerts.slice(0, 3);
  }, [
    activeGoals,
    summary.safeToSpend,
    upcomingBills,
  ]);

  const spendingPercent =
    summary.totalIncome > 0
      ? Math.min(
          (summary.totalSpent /
            summary.totalIncome) *
            100,
          100
        )
      : 0;

  const savingsPercent =
    summary.totalIncome > 0
      ? Math.min(
          (summary.estimatedSaved /
            summary.totalIncome) *
            100,
          100
        )
      : 0;

  if (!isReady) {
    return <AppPage />;
  }

  return (
    <AppPage>
      <PageHeader
        title={`${greeting}${
          app.settings.userName
            ? `, ${app.settings.userName}`
            : ""
        }`}
        subtitle="Here is what needs your attention today."
      />

      <AppCard>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="muted">
              Safe To Spend
            </AppText>

            <Text
              style={{
                color:
                  summary.safeToSpend < 0
                    ? colors.danger
                    : colors.primary,
                fontSize: 46,
                fontWeight: "bold",
                marginTop: 4,
              }}
            >
              {formatMoney(summary.safeToSpend)}
            </Text>

            <AppText variant="muted">
              {summary.safeToSpend < 0
                ? "Your current spending is above the safe limit."
                : "Available after bills, goals, debt, and planned spending."}
            </AppText>
          </View>

          <View
            style={{
              alignItems: "flex-end",
              marginLeft: 12,
            }}
          >
            <AppText variant="bold">
              {summary.budgetScore.score}/100
            </AppText>

            <AppText variant="muted">
              {summary.budgetScore.label}
            </AppText>
          </View>
        </AppRow>
      </AppCard>

      <View
        style={{
          flexDirection: "row",
          gap: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Spent"
            value={formatMoney(
              summary.totalSpent
            )}
            caption="This month"
            tone={
              summary.totalSpent >
              summary.totalIncome
                ? "danger"
                : "warning"
            }
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Saved"
            value={formatMoney(
              summary.estimatedSaved
            )}
            caption={`${summary.savingsRate.toFixed(
              0
            )}% savings rate`}
            tone="success"
          />
        </View>
      </View>

      <AppCard>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="section">
              Today
            </AppText>

            <AppText variant="muted">
              Your daily financial snapshot
            </AppText>
          </View>

          <Pressable
            onPress={() =>
              router.push("/(tabs)/calendar")
            }
          >
            <AppText variant="muted">
              Calendar
            </AppText>
          </Pressable>
        </AppRow>

        <View
          style={{
            marginTop: 14,
            gap: 12,
          }}
        >
          <AppRow>
            <AppText variant="muted">
              Events today
            </AppText>

            <AppText variant="bold">
              {todaysEvents.length}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Active goals
            </AppText>

            <AppText variant="bold">
              {activeGoals.length}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Recent activity
            </AppText>

            <AppText variant="bold">
              {recentPurchases.length}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Next scheduled item
            </AppText>

            <View
              style={{
                alignItems: "flex-end",
                flexShrink: 1,
              }}
            >
              <AppText variant="bold">
                {nextEvent
                  ? nextEvent.title
                  : "Nothing scheduled"}
              </AppText>

              {nextEvent ? (
                <AppText variant="muted">
                  {formatEventDate(nextEvent)}
                </AppText>
              ) : null}
            </View>
          </AppRow>
        </View>
      </AppCard>

      <AppCard>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="section">
              Priority Alerts
            </AppText>

            <AppText variant="muted">
              Items worth checking now
            </AppText>
          </View>
        </AppRow>

        {priorityAlerts.length === 0 ? (
          <View style={{ marginTop: 12 }}>
            <EmptyState message="Nothing urgent needs your attention right now." />
          </View>
        ) : (
          <View
            style={{
              marginTop: 14,
              gap: 10,
            }}
          >
            {priorityAlerts.map((alert) => (
              <Pressable
                key={alert.id}
                onPress={alert.action}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.72 : 1,
                })}
              >
                <AppCard>
                  <AppRow>
                    <View style={{ flex: 1 }}>
                      <AppText variant="bold">
                        {alert.title}
                      </AppText>

                      <View style={{ marginTop: 4 }}>
                        <AppText variant="muted">
                          {alert.message}
                        </AppText>
                      </View>
                    </View>

                    <AppText variant="muted">
                      View
                    </AppText>
                  </AppRow>
                </AppCard>
              </Pressable>
            ))}
          </View>
        )}
      </AppCard>

      <AppCard>
        <AppText variant="section">
          Quick Actions
        </AppText>

        <View
          style={{
            marginTop: 12,
            gap: 10,
          }}
        >
          <AppButton
            title="Add Purchase"
            onPress={() =>
              router.push("/(tabs)/dashboard")
            }
          />

          <View
            style={{
              flexDirection: "row",
              gap: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <AppButton
                title="Check Afford"
                onPress={() =>
                  router.push("/(tabs)/afford")
                }
                variant="outline"
              />
            </View>

            <View style={{ flex: 1 }}>
              <AppButton
                title="Add Goal"
                onPress={() =>
                  router.push("/(tabs)/goals")
                }
                variant="outline"
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
              <AppButton
                title="Household"
                onPress={() =>
                  router.push("/households")
                }
                variant="outline"
              />
            </View>

            <View style={{ flex: 1 }}>
              <AppButton
                title="Business"
                onPress={() =>
                  router.push("/businesses")
                }
                variant="outline"
              />
            </View>
          </View>
        </View>
      </AppCard>

      <AppCard>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="section">
              Upcoming
            </AppText>

            <AppText variant="muted">
              Bills, paydays, and reminders
            </AppText>
          </View>

          <Pressable
            onPress={() =>
              router.push("/(tabs)/calendar")
            }
          >
            <AppText variant="muted">
              See All
            </AppText>
          </Pressable>
        </AppRow>

        {upcomingEvents.length === 0 ? (
          <View style={{ marginTop: 12 }}>
            <EmptyState message="No upcoming calendar events yet." />
          </View>
        ) : (
          <View
            style={{
              marginTop: 14,
              gap: 12,
            }}
          >
            {upcomingEvents.map((event) => (
              <Pressable
                key={event.id}
                onPress={() =>
                  router.push("/(tabs)/calendar")
                }
                style={({ pressed }) => ({
                  opacity: pressed ? 0.72 : 1,
                })}
              >
                <AppRow>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bold">
                      {event.title}
                    </AppText>

                    <AppText variant="muted">
                      {formatEventDate(event)}
                      {event.repeat &&
                      event.repeat !== "never"
                        ? ` · ${event.repeat}`
                        : ""}
                    </AppText>
                  </View>

                  <AppText variant="bold">
                    {event.amount !== undefined
                      ? formatMoney(event.amount)
                      : ""}
                  </AppText>
                </AppRow>
              </Pressable>
            ))}
          </View>
        )}
      </AppCard>

      <AppCard>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="section">
              Goals
            </AppText>

            <AppText variant="muted">
              Progress toward Future You
            </AppText>
          </View>

          <Pressable
            onPress={() =>
              router.push("/(tabs)/goals")
            }
          >
            <AppText variant="muted">
              See All
            </AppText>
          </Pressable>
        </AppRow>

        {activeGoals.length === 0 ? (
          <View style={{ marginTop: 12 }}>
            <EmptyState message="No active goals yet. Add one to start building Future You." />
          </View>
        ) : (
          <View
            style={{
              marginTop: 14,
              gap: 16,
            }}
          >
            {activeGoals
              .slice(0, 3)
              .map((goal) => {
                const percent =
                  goal.target > 0
                    ? Math.min(
                        (goal.current /
                          goal.target) *
                          100,
                        100
                      )
                    : 0;

                return (
                  <View key={goal.id}>
                    <AppRow>
                      <View style={{ flex: 1 }}>
                        <AppText variant="bold">
                          {goal.emoji} {goal.name}
                        </AppText>

                        <AppText variant="muted">
                          {formatMoney(goal.current)} of{" "}
                          {formatMoney(goal.target)}
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

                    <View style={{ marginTop: 6 }}>
                      <AppText variant="muted">
                        {formatMoney(
                          Math.max(
                            goal.target -
                              goal.current,
                            0
                          )
                        )}{" "}
                        remaining
                      </AppText>
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
              Recent Activity
            </AppText>

            <AppText variant="muted">
              Latest personal transactions
            </AppText>
          </View>

          <Pressable
            onPress={() =>
              router.push("/(tabs)/dashboard")
            }
          >
            <AppText variant="muted">
              See All
            </AppText>
          </Pressable>
        </AppRow>

        {recentPurchases.length === 0 ? (
          <View style={{ marginTop: 12 }}>
            <EmptyState message="No purchases yet. Add one to activate your activity feed." />
          </View>
        ) : (
          <View
            style={{
              marginTop: 14,
              gap: 12,
            }}
          >
            {recentPurchases.map((purchase) => (
              <AppRow key={purchase.id}>
                <View style={{ flex: 1 }}>
                  <AppText variant="bold">
                    {purchase.name}
                  </AppText>

                  <AppText variant="muted">
                    {purchase.category}
                    {purchase.subcategory
                      ? ` · ${purchase.subcategory}`
                      : ""}
                  </AppText>
                </View>

                <Text
                  style={{
                    color:
                      purchase.type === "income"
                        ? colors.income
                        : colors.expense,
                    fontWeight: "bold",
                  }}
                >
                  {purchase.type === "income"
                    ? "+"
                    : "-"}
                  {formatMoney(
                    purchase.amount,
                    true
                  )}
                </Text>
              </AppRow>
            ))}
          </View>
        )}
      </AppCard>

      <AppCard>
        <AppText variant="section">
          Monthly Progress
        </AppText>

        <View
          style={{
            marginTop: 14,
            gap: 16,
          }}
        >
          <View>
            <AppRow>
              <AppText variant="muted">
                Income used
              </AppText>

              <AppText variant="bold">
                {spendingPercent.toFixed(0)}%
              </AppText>
            </AppRow>

            <View style={{ marginTop: 8 }}>
              <ProgressBar
                percent={spendingPercent}
              />
            </View>
          </View>

          <View>
            <AppRow>
              <AppText variant="muted">
                Income saved
              </AppText>

              <AppText variant="bold">
                {savingsPercent.toFixed(0)}%
              </AppText>
            </AppRow>

            <View style={{ marginTop: 8 }}>
              <ProgressBar
                percent={savingsPercent}
              />
            </View>
          </View>

          <AppRow>
            <AppText variant="muted">
              Monthly income
            </AppText>

            <AppText variant="bold">
              {formatMoney(
                summary.totalIncome
              )}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Monthly spending
            </AppText>

            <AppText variant="bold">
              {formatMoney(
                summary.totalSpent
              )}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Estimated savings
            </AppText>

            <AppText variant="bold">
              {formatMoney(
                summary.estimatedSaved
              )}
            </AppText>
          </AppRow>
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="section">
          Future You Tip
        </AppText>

        <View style={{ marginTop: 10 }}>
          <AppText variant="muted">
            {getTip(summary.safeToSpend)}
          </AppText>
        </View>
      </AppCard>
    </AppPage>
  );
}

function getTip(safeToSpend: number) {
  if (safeToSpend < 0) {
    return "Pause non-essential spending and review your plan today.";
  }

  if (safeToSpend < 100) {
    return "You are close to your spending limit. Keep purchases small until the next income date.";
  }

  return `${formatMoney(
    safeToSpend
  )} is currently safe to spend while keeping the rest of the plan on track.`;
}