import AppCard from "@/components/ui/AppCard";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import { BudgetItem } from "@/lib/types";
import { useTheme } from "@/lib/useTheme";
import { Pressable, View } from "react-native";
import ProgressBar from "./ProgressBar";
import { getBudgetTotal, getPercent, getSpentTotal } from "./budgetUtils";

export default function BudgetDashboardSection({
  title,
  items,
  isOpen = true,
  onToggle,
}: {
  title: string;
  items: BudgetItem[];
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  const { colors } = useTheme();

  const totalBudget = getBudgetTotal(items);
  const totalSpent = getSpentTotal(items);
  const percentUsed = getPercent(totalSpent, totalBudget);

  return (
    <AppCard>
      <Pressable onPress={onToggle}>
        <AppRow>
          <View>
            <AppText variant="section">{title}</AppText>
            <AppText variant="muted">{percentUsed.toFixed(0)}% used</AppText>
          </View>

          {onToggle ? (
            <AppText variant="bold">{isOpen ? "Hide" : "Show"}</AppText>
          ) : null}
        </AppRow>
      </Pressable>

      <ProgressBar percent={percentUsed} />

      <AppRow>
        <AppText variant="muted">Budget</AppText>
        <AppText variant="bold">${totalBudget.toFixed(2)}</AppText>
      </AppRow>

      <AppRow>
        <AppText variant="muted">Spent</AppText>
        <AppText variant="bold">${totalSpent.toFixed(2)}</AppText>
      </AppRow>

      {isOpen ? (
        <View style={{ marginTop: 10 }}>
          {items.length === 0 ? (
            <AppText variant="muted">No items added yet.</AppText>
          ) : (
            items.map((item) => {
              const left = item.budget - item.spent;
              const itemPercent = getPercent(item.spent, item.budget);
              const isOver = item.spent > item.budget;

              return (
                <View
                  key={item.id}
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    paddingTop: 12,
                    marginTop: 12,
                  }}
                >
                  <AppRow>
                    <AppText variant="bold">{item.name}</AppText>

                    <AppText variant="muted">
                      {itemPercent.toFixed(0)}%
                    </AppText>
                  </AppRow>

                  <ProgressBar percent={itemPercent} />

                  <AppRow>
                    <AppText variant="muted">Budget</AppText>
                    <AppText variant="bold">${item.budget.toFixed(2)}</AppText>
                  </AppRow>

                  <AppRow>
                    <AppText variant="muted">Spent</AppText>
                    <AppText variant="bold">${item.spent.toFixed(2)}</AppText>
                  </AppRow>

                  <AppRow>
                    <AppText variant="muted">Remaining</AppText>
                    <AppText variant="bold">
                      {isOver ? "-" : ""}${Math.abs(left).toFixed(2)}
                    </AppText>
                  </AppRow>
                </View>
              );
            })
          )}
        </View>
      ) : null}
    </AppCard>
  );
}