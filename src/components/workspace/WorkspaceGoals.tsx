import ProgressBar from "@/components/budget/ProgressBar";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import EmptyState from "@/components/ui/EmptyState";
import type { BudgetItem } from "@/lib/types";
import { Pressable, View } from "react-native";

export type WorkspaceGoal = {
  id: string;
  name: string;
  target: number;
  current: number;
  monthly?: number;
  dueDate?: string;
  category?: string;
};

type Props = {
  goals?: WorkspaceGoal[];
  savingsItems?: BudgetItem[];
  title?: string;
  subtitle?: string;
  onAddGoal?: () => void;
  onOpenGoal?: (goal: WorkspaceGoal) => void;
  onSeeAll?: () => void;
  limit?: number;
};

const formatMoney = (amount: number) =>
  `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

export default function WorkspaceGoals({
  goals,
  savingsItems,
  title = "Goals",
  subtitle = "Progress toward shared priorities",
  onAddGoal,
  onOpenGoal,
  onSeeAll,
  limit = 4,
}: Props) {
  const normalizedGoals =
    goals ??
    savingsItems?.map((item) => ({
      id: item.id,
      name: item.name,
      target: item.budget,
      current: item.spent,
      category: "Savings",
    })) ??
    [];

  const activeGoals = normalizedGoals
    .filter((goal) => goal.target > 0)
    .sort((first, second) => {
      const firstPercent =
        first.target > 0
          ? first.current / first.target
          : 0;

      const secondPercent =
        second.target > 0
          ? second.current / second.target
          : 0;

      return secondPercent - firstPercent;
    });

  const visibleGoals = activeGoals.slice(0, limit);

  const totalTarget = activeGoals.reduce(
    (sum, goal) => sum + goal.target,
    0
  );

  const totalSaved = activeGoals.reduce(
    (sum, goal) => sum + goal.current,
    0
  );

  const overallPercent =
    totalTarget > 0
      ? Math.min((totalSaved / totalTarget) * 100, 100)
      : 0;

  return (
    <AppCard>
      <AppRow>
        <View style={{ flex: 1 }}>
          <AppText variant="section">
            {title}
          </AppText>

          <AppText variant="muted">
            {subtitle}
          </AppText>
        </View>

        {onAddGoal ? (
          <AppButton
            title="Add Goal"
            onPress={onAddGoal}
            variant="outline"
          />
        ) : onSeeAll ? (
          <Pressable
            onPress={onSeeAll}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <AppText variant="muted">
              See All
            </AppText>
          </Pressable>
        ) : null}
      </AppRow>

      {activeGoals.length === 0 ? (
        <View style={{ marginTop: 14 }}>
          <EmptyState message="No shared goals have been added yet." />
        </View>
      ) : (
        <>
          <AppCard glass style={{ marginTop: 14 }}>
            <AppRow>
              <View style={{ flex: 1 }}>
                <AppText variant="muted">
                  Overall Progress
                </AppText>

                <View style={{ marginTop: 4 }}>
                  <AppText variant="title">
                    {overallPercent.toFixed(0)}%
                  </AppText>
                </View>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <AppText variant="bold">
                  {formatMoney(totalSaved)}
                </AppText>

                <AppText variant="muted">
                  of {formatMoney(totalTarget)}
                </AppText>
              </View>
            </AppRow>

            <View style={{ marginTop: 12 }}>
              <ProgressBar percent={overallPercent} />
            </View>
          </AppCard>

          <View
            style={{
              marginTop: 16,
              gap: 16,
            }}
          >
            {visibleGoals.map((goal) => {
              const percent =
                goal.target > 0
                  ? Math.min(
                      (goal.current / goal.target) * 100,
                      100
                    )
                  : 0;

              const remaining = Math.max(
                goal.target - goal.current,
                0
              );

              return (
                <Pressable
                  key={goal.id}
                  disabled={!onOpenGoal}
                  onPress={() => onOpenGoal?.(goal)}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View>
                    <AppRow>
                      <View style={{ flex: 1 }}>
                        <AppText variant="bold">
                          {goal.name}
                        </AppText>

                        <AppText variant="muted">
                          {goal.category
                            ? `${goal.category} · `
                            : ""}
                          {formatMoney(remaining)} remaining
                        </AppText>
                      </View>

                      <AppText variant="bold">
                        {percent.toFixed(0)}%
                      </AppText>
                    </AppRow>

                    <View style={{ marginTop: 8 }}>
                      <ProgressBar percent={percent} />
                    </View>

                    <View style={{ marginTop: 7 }}>
                      <AppRow>
                        <AppText variant="muted">
                          {formatMoney(goal.current)} saved
                        </AppText>

                        <AppText variant="muted">
                          Goal {formatMoney(goal.target)}
                        </AppText>
                      </AppRow>
                    </View>

                    {goal.monthly && goal.monthly > 0 ? (
                      <View style={{ marginTop: 5 }}>
                        <AppText variant="muted">
                          {formatMoney(goal.monthly)} planned monthly
                        </AppText>
                      </View>
                    ) : null}

                    {goal.dueDate ? (
                      <View style={{ marginTop: 5 }}>
                        <AppText variant="muted">
                          Target date{" "}
                          {new Date(goal.dueDate).toLocaleDateString()}
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {activeGoals.length > limit && onSeeAll ? (
            <View style={{ marginTop: 16 }}>
              <AppButton
                title={`View All ${activeGoals.length} Goals`}
                onPress={onSeeAll}
                variant="outline"
              />
            </View>
          ) : null}
        </>
      )}
    </AppCard>
  );
}